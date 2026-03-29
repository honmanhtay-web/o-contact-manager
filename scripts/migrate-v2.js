#!/usr/bin/env node
'use strict';

/**
 * scripts/migrate-v2.js — Migration từ v1 → v2
 *
 * Chạy 1 lần để:
 * 1. Đọc toàn bộ contacts_detail
 * 2. Rebuild contacts_index (thêm allEmails, allDomains, userDefinedKeys, searchTokens)
 * 3. Tạo email_lookup docs cho tất cả emails
 * 4. Tạo/update ud_key_lookup docs
 *
 * Đặc điểm:
 * - Idempotent: chạy nhiều lần không bị duplicate (set thay vì insert)
 * - Cursor pagination: xử lý 400 docs/batch để tránh timeout
 * - Progress tracking trên stdout
 *
 * Usage:
 *   node scripts/migrate-v2.js
 *   node scripts/migrate-v2.js --dry-run      (chỉ đọc, không ghi)
 *   node scripts/migrate-v2.js --batch 200    (batch size, default 400)
 *   node scripts/migrate-v2.js --start-after <docId>   (resume từ giữa)
 */

require('dotenv').config();

const { getFirestore, FieldValue } = require('../functions/utils/firebase-admin');
const { buildContactDocs } = require('../functions/utils/contactMapper');

// ─── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let isDryRun = false;
let batchSize = 400;
let startAfterDocId = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') isDryRun = true;
  if (args[i] === '--batch' && args[i + 1]) batchSize = parseInt(args[++i], 10) || 400;
  if (args[i] === '--start-after' && args[i + 1]) startAfterDocId = args[++i];
}

const MAX_BATCH_OPS = 490; // Firestore batch limit = 500, giữ buffer

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const db = getFirestore();
  const startTime = Date.now();

  console.log('\n🔄 Contact Manager — Migration v2');
  console.log('━'.repeat(50));
  if (isDryRun) console.log('⚠️  DRY RUN MODE — không ghi vào Firestore');
  console.log(`   Batch size: ${batchSize}`);
  if (startAfterDocId) console.log(`   Resume from: ${startAfterDocId}`);
  console.log('━'.repeat(50));
  console.log('');

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  let cursor = null;

  // Resume nếu có startAfterDocId
  if (startAfterDocId) {
    cursor = await db.collection('contacts_detail').doc(startAfterDocId).get();
  }

  let pageNum = 0;
  while (true) {
    pageNum++;

    // Build query với cursor
    let q = db.collection('contacts_detail')
      .orderBy('id')
      .limit(batchSize);

    if (cursor) q = q.startAfter(cursor);

    const snapshot = await q.get();
    if (snapshot.empty) break;

    const docs = snapshot.docs;
    cursor = docs[docs.length - 1];

    console.log(`📦 Page ${pageNum}: processing ${docs.length} docs...`);

    // Process mỗi doc trong page
    // Chia thành các Firestore batches (mỗi contact ~6 ops)
    let firestoreBatch = db.batch();
    let opsInBatch = 0;

    const flushBatch = async () => {
      if (opsInBatch === 0) return;
      if (!isDryRun) await firestoreBatch.commit();
      firestoreBatch = db.batch();
      opsInBatch = 0;
    };

    for (const doc of docs) {
      totalProcessed++;
      try {
        const detailData = doc.data();
        if (!detailData) continue;

        // Build contact docs từ detail
        const built = buildContactDocs(detailData, {
          contactId: doc.id,
          sourceFile: detailData.sourceFile || null,
          importedAt: detailData.createdAt ? new Date(detailData.createdAt) : new Date(),
          version: 2,
        });

        const { indexDoc, emailLookupDocs, udKeyUpdates } = built;

        // Estimate ops: 1 (index) + N (email_lookup) + M (ud_key_lookup)
        const estimatedOps = 1 + emailLookupDocs.length + udKeyUpdates.length;

        // Flush nếu sắp vượt batch limit
        if (opsInBatch + estimatedOps >= MAX_BATCH_OPS) {
          await flushBatch();
        }

        // 1. Set contacts_index
        firestoreBatch.set(
          db.collection('contacts_index').doc(doc.id),
          indexDoc
        );
        opsInBatch++;

        // 2. Set email_lookup docs
        for (const { docId, data } of emailLookupDocs) {
          firestoreBatch.set(db.collection('email_lookup').doc(docId), data);
          opsInBatch++;
        }

        // 3. Set ud_key_lookup (arrayUnion — idempotent)
        for (const { docId, key } of udKeyUpdates) {
          firestoreBatch.set(
            db.collection('ud_key_lookup').doc(docId),
            {
              key,
              contactIds: FieldValue.arrayUnion(doc.id),
              count: FieldValue.increment(1),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          opsInBatch++;
        }

        totalSuccess++;
      } catch (err) {
        totalErrors++;
        console.error(`  ❌ Error processing ${doc.id}: ${err.message}`);
      }
    }

    // Flush batch còn lại
    await flushBatch();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✓ Page ${pageNum} done — ${totalProcessed} total (${elapsed}s)`);

    // Nếu docs < batchSize thì đây là page cuối
    if (docs.length < batchSize) break;
  }

  // ── Cập nhật meta/stats ───────────────────────────────────────────────────
  if (!isDryRun && totalSuccess > 0) {
    try {
      await db.collection('meta').doc('stats').set(
        {
          totalContacts: totalSuccess,
          migratedAt: new Date().toISOString(),
          migratedCount: totalSuccess,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('⚠️  Could not update meta/stats:', err.message);
    }
  }

  // ── Final report ──────────────────────────────────────────────────────────
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('━'.repeat(50));
  console.log(`✅ Migration complete in ${totalTime}s`);
  console.log(`   Processed: ${totalProcessed}`);
  console.log(`   Success:   ${totalSuccess}`);
  console.log(`   Errors:    ${totalErrors}`);
  if (isDryRun) console.log('   (DRY RUN — nothing was written)');
  console.log('━'.repeat(50));
  console.log('');

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
