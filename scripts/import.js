#!/usr/bin/env node
"use strict";

/**
 * scripts/import.js — Bulk import contacts từ VCF file vào Firestore
 *
 * Usage:
 *   node scripts/import.js --file contacts.vcf
 *   node scripts/import.js --file contacts.vcf --dry-run
 *   node scripts/import.js --file contacts.vcf --concurrency 10
 *   node scripts/import.js --file contacts.vcf --source "google_export_2026.vcf"
 *   node scripts/import.js --file contacts.json  (JSON array format)
 *
 * JSON format:
 *   [ { contact: {...}, userDefined: {...} }, ... ]
 *   hoặc [ { displayName, emails: [...], ... }, ... ]  (flat format)
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { parseVcfFile } = require("./vcf2json");
const { writeContact } = require("../functions/utils/writeContact");
const { getFirestore, getRtdb, FieldValue } = require("../functions/utils/firebase-admin");

// ─── CLI Args ─────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--file") args.file = argv[++i];
    else if (arg === "--concurrency") args.concurrency = parseInt(argv[++i], 10) || 5;
    else if (arg === "--source") args.source = argv[++i];
    else if (arg === "--job-id") args.jobId = argv[++i];
    else if (arg === "--no-rtdb") args.noRtdb = true;
    else if (arg === "--skip-errors") args.skipErrors = false;
  }
  return args;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function renderProgress(done, total, errors, startTime) {
  const pct = Math.round((done / total) * 100);
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = done / elapsed;
  const remaining = rate > 0 ? Math.round((total - done) / rate) : "?";
  const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
  process.stdout.write(`\r  [${bar}] ${pct}% | ${done}/${total} | ✅${done - errors} ❌${errors} | ${remaining}s left  `);
}

// ─── Import Logic ─────────────────────────────────────────────────────────────

async function importContacts(contacts, options = {}) {
  const { concurrency = 5, dryRun = false, sourceFile = null, jobId = null, noRtdb = false } = options;

  const total = contacts.length;
  let done = 0;
  let success = 0;
  let errors = 0;
  const errorList = [];
  const startTime = Date.now();

  const rtdb = noRtdb ? null : getRtdb();

  // Khởi tạo job trong Realtime DB (nếu có jobId)
  if (jobId && rtdb) {
    await rtdb.ref(`import_jobs/${jobId}`).set({
      status: "running",
      total,
      done: 0,
      success: 0,
      errors: 0,
      source: sourceFile || "script",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  console.log(`\n🚀 Starting import: ${total} contacts (concurrency: ${concurrency})${dryRun ? " [DRY RUN]" : ""}`);
  if (sourceFile) console.log(`   Source: ${sourceFile}`);
  console.log("");

  // Process theo chunks
  for (let i = 0; i < total; i += concurrency) {
    const chunk = contacts.slice(i, i + concurrency);

    let results;
    if (dryRun) {
      // Dry run: chỉ validate không ghi
      results = chunk.map((contact, idx) => {
        const hasName = contact.contact?.displayName || contact.displayName;
        const hasEmail = contact.contact?.emails?.length || contact.emails?.length;
        if (!hasName && !hasEmail) {
          return { status: "rejected", reason: new Error("Missing displayName and email") };
        }
        return { status: "fulfilled", value: { contactId: `dry_${i + idx}` } };
      });
    } else {
      results = await Promise.allSettled(
        chunk.map((contact) =>
          writeContact(contact, {
            isUpdate: false,
            sourceFile,
            importedAt: new Date(),
          }),
        ),
      );
    }

    for (let j = 0; j < results.length; j++) {
      done++;
      if (results[j].status === "fulfilled") {
        success++;
      } else {
        errors++;
        errorList.push({
          index: i + j,
          contact: contacts[i + j]?.contact?.displayName || contacts[i + j]?.displayName || "(unknown)",
          error: results[j].reason?.message || "Unknown error",
        });
      }
    }

    renderProgress(done, total, errors, startTime);

    // Cập nhật Realtime DB mỗi 50 contacts
    if (jobId && rtdb && (done % 50 === 0 || done === total)) {
      await rtdb
        .ref(`import_jobs/${jobId}`)
        .update({
          done,
          success,
          errors,
          updatedAt: new Date().toISOString(),
        })
        .catch(() => {}); // non-critical
    }
  }

  process.stdout.write("\n");

  // Cập nhật meta/stats trong Firestore
  if (!dryRun && success > 0) {
    try {
      const db = getFirestore();
      await db
        .collection("meta")
        .doc("stats")
        .set(
          {
            totalContacts: FieldValue.increment(success),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      console.log(`\n📊 Updated meta/stats: +${success} contacts`);
    } catch (e) {
      console.warn("\n⚠️  Failed to update meta/stats:", e.message);
    }
  }

  // Final RTDB update
  if (jobId && rtdb) {
    const finalStatus = errors === total ? "failed" : errors > 0 ? "partial" : "completed";
    await rtdb
      .ref(`import_jobs/${jobId}`)
      .update({
        status: finalStatus,
        done,
        success,
        errors,
        errorSample: errorList.slice(0, 10),
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .catch(() => {});
  }

  return { total, success, errors, errorList, durationMs: Date.now() - startTime };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (!args.file) {
    console.error("Usage: node scripts/import.js --file <contacts.vcf|contacts.json> [options]");
    console.error("\nOptions:");
    console.error("  --dry-run          Validate without writing to Firestore");
    console.error("  --concurrency <n>  Parallel writes (default: 5)");
    console.error("  --source <name>    Tag contacts with source filename");
    console.error("  --job-id <id>      Track progress in Realtime DB");
    console.error("  --no-rtdb          Skip Realtime DB job tracking");
    process.exit(1);
  }

  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  const sourceFile = args.source || path.basename(filePath);

  console.log(`\n📂 Reading: ${filePath}`);

  let contacts;
  try {
    if (ext === ".vcf" || ext === ".vcard") {
      contacts = await parseVcfFile(filePath);
    } else if (ext === ".json") {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      contacts = Array.isArray(parsed) ? parsed : parsed.contacts || parsed.data || [];
    } else {
      console.error(`❌ Unsupported file type: ${ext} (use .vcf or .json)`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Failed to parse file: ${err.message}`);
    process.exit(1);
  }

  if (!contacts.length) {
    console.log("⚠️  No contacts found in file.");
    process.exit(0);
  }

  console.log(`✅ Found ${contacts.length} contacts in file`);

  // Tạo job ID nếu không truyền
  const jobId = args.jobId || (args.noRtdb ? null : `job_${crypto.randomBytes(6).toString("hex")}`);
  if (jobId && !args.noRtdb) {
    console.log(`📋 Job ID: ${jobId}`);
  }

  const result = await importContacts(contacts, {
    concurrency: args.concurrency || 5,
    dryRun: !!args.dryRun,
    sourceFile,
    jobId,
    noRtdb: !!args.noRtdb,
  });

  // Summary
  const duration = (result.durationMs / 1000).toFixed(1);
  const rate = Math.round(result.total / (result.durationMs / 1000));

  console.log("\n" + "━".repeat(50));
  console.log(`✅ Import ${args.dryRun ? "(DRY RUN) " : ""}complete!`);
  console.log(`   Total:    ${result.total}`);
  console.log(`   Success:  ${result.success}`);
  console.log(`   Errors:   ${result.errors}`);
  console.log(`   Duration: ${duration}s (~${rate} contacts/s)`);

  if (result.errorList.length > 0) {
    console.log("\n❌ First errors:");
    for (const err of result.errorList.slice(0, 5)) {
      console.log(`   [${err.index}] ${err.contact}: ${err.error}`);
    }
    if (result.errorList.length > 5) {
      console.log(`   ... and ${result.errorList.length - 5} more`);
    }
  }

  console.log("━".repeat(50) + "\n");

  process.exit(result.errors > 0 && result.success === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
