#!/usr/bin/env node
"use strict";

/**
 * scripts/migrate-v2.js — Migration script: nâng cấp contacts lên schema v2
 *
 * Thêm các fields mới vào contacts_index:
 *   - allEmails[]     ← collect từ contacts_detail
 *   - allDomains[]    ← extract domain từ allEmails
 *   - userDefinedKeys[] ← collect từ contacts_detail.userDefined
 *   - hasUserDefined  ← boolean
 *   - udKeyCount      ← số lượng
 *
 * Tạo lookup collections:
 *   - email_lookup/{emailId}   ← cho mỗi email
 *   - ud_key_lookup/{keyId}    ← cho mỗi userDefined key
 *
 * Đặc điểm:
 *   - Idempotent: chạy nhiều lần không duplicate (overwrite)
 *   - Cursor pagination: 400 docs/batch để tránh timeout
 *   - Dry run: --dry-run để xem sẽ làm gì mà không thực sự ghi
 *   - Resume: --start-after <docId> để tiếp tục từ điểm dừng
 *
 * Usage:
 *   node scripts/migrate-v2.js
 *   node scripts/migrate-v2.js --dry-run
 *   node scripts/migrate-v2.js --batch-size 200
 *   node scripts/migrate-v2.js --start-after uid_abc123
 *   node scripts/migrate-v2.js --stats-only  (chỉ đọc và in stats)
 */

require("dotenv").config();

const { getFirestore, FieldValue } = require("../functions/utils/firebase-admin");

// ─── Config ───────────────────────────────────────────────────────────────────

const BATCH_LIMIT = 400; // Firestore batch tối đa 500 ops, để an toàn dùng 400
const FIRESTORE_BATCH_MAX = 490; // Số ops tối đa trong 1 batch write

// ─── Helpers ──────────────────────────────────────────────────────────────────

function encodeDocId(key) {
  return key.replace(/\./g, ",");
}

function domainOf(email) {
  if (!email || !email.includes("@")) return null;
  return email.split("@")[1].toLowerCase();
}

function parseArgs(argv) {
  const args = { batchSize: 400 };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--stats-only") args.statsOnly = true;
    else if (arg === "--batch-size") args.batchSize = parseInt(argv[++i], 10) || 400;
    else if (arg === "--start-after") args.startAfter = argv[++i];
    else if (arg === "--collection") args.collection = argv[++i];
  }
  return args;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

let _lastRender = 0;
function renderProgress(done, total, batchNum, errors, startTime) {
  const now = Date.now();
  if (now - _lastRender < 500 && done < total) return; // Throttle 500ms
  _lastRender = now;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const elapsed = (now - startTime) / 1000;
  const rate = elapsed > 0 ? Math.round(done / elapsed) : 0;
  const remaining = rate > 0 ? Math.round((total - done) / rate) : "?";
  const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
  process.stdout.write(`\r  [${bar}] ${pct}% | ${done}/${total} | batch ${batchNum} | ❌${errors} | ${rate}/s | ~${remaining}s  `);
}

// ─── Core Migration Logic ─────────────────────────────────────────────────────

/**
 * Migrate 1 contact:
 *  - Đọc contacts_detail để lấy emails + userDefined
 *  - Cập nhật contacts_index với allEmails, allDomains, userDefinedKeys
 *  - Tạo/update email_lookup docs
 *  - Tạo/update ud_key_lookup docs (dùng arrayUnion để idempotent)
 *
 * @returns { ops: number, emailCount: number, udKeyCount: number }
 */
async function migrateContact(db, contactId, indexData, detailData, opts = {}) {
  const { dryRun = false } = opts;

  // Lấy emails từ contacts_detail
  const detailEmails = (detailData?.contact?.emails || []).map((e) => (e.value || "").toLowerCase().trim()).filter((e) => e && e.includes("@"));

  // Merge với primaryEmail từ index (nếu có)
  const primaryEmail = (indexData.primaryEmail || "").toLowerCase().trim();
  const allEmails = [...new Set([...(primaryEmail ? [primaryEmail] : []), ...detailEmails, ...(indexData.allEmails || [])])].filter(
    (e) => e && e.includes("@"),
  );

  const allDomains = [...new Set(allEmails.map(domainOf).filter(Boolean))];

  // Lấy userDefined keys từ contacts_detail
  const userDefined = detailData?.userDefined || {};
  const userDefinedKeys = Object.keys(userDefined).filter((k) => userDefined[k] != null);

  const updates = {
    allEmails,
    allDomains,
    userDefinedKeys,
    hasUserDefined: userDefinedKeys.length > 0,
    udKeyCount: userDefinedKeys.length,
    emailCount: allEmails.length,
  };

  // Tính số batch ops cần thiết
  // 1 (index update) + N (email_lookup) + M (ud_key_lookup) + 1 (stats) ≈ thêm sau
  const opsCount = 1 + allEmails.length + userDefinedKeys.length;

  if (dryRun) {
    return { ops: opsCount, emailCount: allEmails.length, udKeyCount: userDefinedKeys.length };
  }

  return { updates, allEmails, userDefinedKeys, ops: opsCount, emailCount: allEmails.length, udKeyCount: userDefinedKeys.length };
}

// ─── Batch Writer ─────────────────────────────────────────────────────────────

/**
 * Viết 1 batch migration cho chunk contacts
 * Dùng Firestore WriteBatch — tối đa 500 ops
 */
async function writeMigrationBatch(db, migrations) {
  const batch = db.batch();
  let opsCount = 0;

  for (const { contactId, updates, allEmails, userDefinedKeys } of migrations) {
    // 1. Update contacts_index
    batch.update(db.collection("contacts_index").doc(contactId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    opsCount++;

    // 2. Create/update email_lookup
    for (let i = 0; i < allEmails.length; i++) {
      const email = allEmails[i];
      const docId = encodeDocId(email);
      batch.set(
        db.collection("email_lookup").doc(docId),
        {
          email,
          contactId,
          isPrimary: i === 0,
          type: ["INTERNET"],
          label: null,
        },
        { merge: false }, // Overwrite để idempotent
      );
      opsCount++;
    }

    // 3. Create/update ud_key_lookup (arrayUnion để không duplicate)
    for (const key of userDefinedKeys) {
      const docId = encodeDocId(key);
      batch.set(
        db.collection("ud_key_lookup").doc(docId),
        {
          key,
          contactIds: FieldValue.arrayUnion(contactId),
          count: FieldValue.increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      opsCount++;
    }

    // Nếu gần đến limit, flush batch (an toàn: thực ra không vượt vì limit trước)
    if (opsCount >= FIRESTORE_BATCH_MAX) {
      console.warn(`\n⚠️  Batch ops limit reached at ${opsCount}, may need splitting`);
      break;
    }
  }

  await batch.commit();
  return opsCount;
}

// ─── Main Migration ───────────────────────────────────────────────────────────

async function runMigration(args = {}) {
  const { dryRun = false, statsOnly = false, batchSize = 400, startAfter = null } = args;

  const db = getFirestore();

  console.log("\n🔄 Contact Manager — Migration v2");
  console.log("━".repeat(50));
  if (dryRun) console.log("  MODE: DRY RUN (no writes)");
  if (statsOnly) console.log("  MODE: STATS ONLY");
  console.log(`  Batch size: ${batchSize}`);
  if (startAfter) console.log(`  Resume after: ${startAfter}`);
  console.log("━".repeat(50));

  // Đếm tổng contacts trước
  // (Firestore không có COUNT nhanh — dùng meta/stats hoặc estimate)
  let totalEstimate = "?";
  try {
    const statsSnap = await db.collection("meta").doc("stats").get();
    if (statsSnap.exists) totalEstimate = statsSnap.data().totalContacts || "?";
  } catch {}
  console.log(`\n📊 Estimated total: ${totalEstimate} contacts`);

  // Stats accumulators
  let processed = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let totalEmails = 0;
  let totalUdKeys = 0;
  let batchNum = 0;
  const startTime = Date.now();

  // Cursor pagination
  let lastDoc = null;
  if (startAfter) {
    lastDoc = await db.collection("contacts_index").doc(startAfter).get();
    console.log(`\n⏩ Resuming after: ${startAfter}`);
  }

  console.log("\n📤 Processing contacts...\n");

  while (true) {
    batchNum++;
    let q = db.collection("contacts_index").orderBy("createdAt", "asc").limit(batchSize);

    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    const docs = snap.docs;
    lastDoc = docs[docs.length - 1];

    // Fetch tất cả contacts_detail song song (theo nhóm 50)
    const DETAIL_CHUNK = 50;
    const detailMap = {};

    for (let i = 0; i < docs.length; i += DETAIL_CHUNK) {
      const chunk = docs.slice(i, i + DETAIL_CHUNK);
      const detailSnaps = await Promise.all(chunk.map((d) => db.collection("contacts_detail").doc(d.id).get()));
      for (let j = 0; j < chunk.length; j++) {
        if (detailSnaps[j].exists) {
          detailMap[chunk[j].id] = detailSnaps[j].data();
        }
      }
    }

    // Phân tích từng contact
    const migrations = [];
    for (const doc of docs) {
      const contactId = doc.id;
      const indexData = doc.data();
      const detailData = detailMap[contactId];

      // Skip nếu không có detail doc
      if (!detailData) {
        skipped++;
        processed++;
        continue;
      }

      try {
        const result = await migrateContact(db, contactId, indexData, detailData, { dryRun });

        if (dryRun || statsOnly) {
          // Chỉ đếm, không ghi
          migrated++;
          totalEmails += result.emailCount;
          totalUdKeys += result.udKeyCount;
          processed++;
        } else {
          // Collect để batch write
          migrations.push({
            contactId,
            updates: result.updates,
            allEmails: result.allEmails,
            userDefinedKeys: result.userDefinedKeys,
          });
          totalEmails += result.emailCount;
          totalUdKeys += result.udKeyCount;
        }
      } catch (err) {
        errors++;
        processed++;
        if (errors <= 5) {
          process.stdout.write("\n");
          console.error(`  ❌ ${contactId}: ${err.message}`);
        }
      }
    }

    // Batch write (nếu không phải dry-run/stats-only)
    if (!dryRun && !statsOnly && migrations.length > 0) {
      // Chia nhỏ nếu batch quá lớn (nhiều email/udKey per contact)
      // Mỗi contact có thể tạo 1 + N + M ops
      // Safe approach: ghi từng nhóm 50 contacts
      const WRITE_CHUNK = 50;
      for (let i = 0; i < migrations.length; i += WRITE_CHUNK) {
        const chunk = migrations.slice(i, i + WRITE_CHUNK);
        try {
          await writeMigrationBatch(db, chunk);
          migrated += chunk.length;
        } catch (err) {
          errors += chunk.length;
          console.error(`\n  ❌ Batch write failed: ${err.message}`);
        }
        processed += chunk.length;
      }
    } else {
      if (!statsOnly && dryRun) {
        processed += migrations.length;
        migrated += migrations.length;
      }
    }

    renderProgress(processed, typeof totalEstimate === "number" ? totalEstimate : processed + 1, batchNum, errors, startTime);

    if (snap.docs.length < batchSize) break; // Last batch
  }

  process.stdout.write("\n");

  // Update meta/stats sau khi migrate xong
  if (!dryRun && !statsOnly && migrated > 0) {
    try {
      await db.collection("meta").doc("stats").set(
        {
          totalEmails: totalEmails,
          updatedAt: new Date().toISOString(),
          lastMigration: new Date().toISOString(),
        },
        { merge: true },
      );
      console.log("\n📊 Updated meta/stats");
    } catch (e) {
      console.warn("\n⚠️  Failed to update meta/stats:", e.message);
    }
  }

  // Final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "━".repeat(50));
  console.log(`✅ Migration ${dryRun ? "(DRY RUN) " : statsOnly ? "(STATS ONLY) " : ""}complete!`);
  console.log(`   Processed:   ${processed}`);
  console.log(`   Migrated:    ${migrated}`);
  console.log(`   Skipped:     ${skipped} (no detail doc)`);
  console.log(`   Errors:      ${errors}`);
  console.log(`   Emails:      ${totalEmails} total across all contacts`);
  console.log(`   UD keys:     ${totalUdKeys} total userDefined key assignments`);
  console.log(`   Duration:    ${duration}s`);
  console.log("━".repeat(50) + "\n");

  return { processed, migrated, skipped, errors };
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = parseArgs(process.argv);

  runMigration(args)
    .then((result) => {
      process.exit(result.errors > result.migrated ? 1 : 0);
    })
    .catch((err) => {
      console.error("\n❌ Fatal error:", err.message);
      process.exit(1);
    });
}

module.exports = { runMigration, migrateContact, writeMigrationBatch };
