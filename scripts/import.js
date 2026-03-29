#!/usr/bin/env node
'use strict';

/**
 * scripts/import.js — Bulk import contacts từ VCF file vào Firestore
 *
 * Usage:
 *   node scripts/import.js --file contacts.vcf
 *   node scripts/import.js --file contacts.vcf --concurrency 10
 *   node scripts/import.js --file contacts.json   (JSON array)
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { parseVcfFile } = require('./vcf2json');
const { bulkWriteContacts } = require('../functions/utils/writeContact');
const { getFirestore, FieldValue } = require('../functions/utils/firebase-admin');

// ─── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let inputFile = null;
let concurrency = 5;

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--file' || args[i] === '-f') && args[i + 1]) inputFile = args[++i];
  if (args[i] === '--concurrency' && args[i + 1]) concurrency = parseInt(args[++i], 10) || 5;
}

if (!inputFile) {
  console.error('Usage: node scripts/import.js --file <contacts.vcf|contacts.json>');
  process.exit(1);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const absolutePath = path.resolve(inputFile);
  const sourceFile = path.basename(inputFile);
  const ext = path.extname(inputFile).toLowerCase();

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`\n📂 Reading: ${absolutePath}`);

  // Parse input
  let contacts = [];
  if (ext === '.vcf' || ext === '.vcard') {
    contacts = await parseVcfFile(absolutePath);
    console.log(`📇 Parsed ${contacts.length} vCards from VCF`);
  } else if (ext === '.json') {
    const raw = fs.readFileSync(absolutePath, 'utf8');
    const parsed = JSON.parse(raw);
    contacts = Array.isArray(parsed) ? parsed : parsed.contacts || [];
    console.log(`📋 Loaded ${contacts.length} contacts from JSON`);
  } else {
    console.error('❌ Unsupported file format. Use .vcf or .json');
    process.exit(1);
  }

  if (contacts.length === 0) {
    console.log('⚠️  No contacts found. Exiting.');
    process.exit(0);
  }

  // Thêm sourceFile vào mỗi contact
  const contactsWithMeta = contacts.map(c => ({ ...c, sourceFile }));

  // Bắt đầu import
  const startTime = Date.now();
  console.log(`\n🚀 Importing ${contacts.length} contacts (concurrency: ${concurrency})...`);

  let lastReported = 0;
  const result = await bulkWriteContacts(contactsWithMeta, {
    concurrency,
    onProgress: (done, total) => {
      const pct = Math.floor((done / total) * 100);
      // Log mỗi 10%
      if (pct >= lastReported + 10 || done === total) {
        lastReported = Math.floor(pct / 10) * 10;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`\r  ⏳ ${done}/${total} (${pct}%) — ${elapsed}s`);
      }
    },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n');

  // ── Cập nhật meta/stats ───────────────────────────────────────────────────
  try {
    const db = getFirestore();
    await db.collection('meta').doc('stats').set(
      {
        totalContacts: FieldValue.increment(result.success),
        lastImportAt: new Date().toISOString(),
        lastImportFile: sourceFile,
        lastImportCount: result.success,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('⚠️  Could not update meta/stats:', err.message);
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('━'.repeat(50));
  console.log(`✅ Import complete in ${elapsed}s`);
  console.log(`   Total:    ${contacts.length}`);
  console.log(`   Success:  ${result.success}`);
  console.log(`   Errors:   ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors (first 10):');
    result.errors.slice(0, 10).forEach(e => {
      console.log(`   - [${e.index}] ${e.error}`);
    });
    if (result.errors.length > 10) {
      console.log(`   ... and ${result.errors.length - 10} more`);
    }
  }

  console.log('━'.repeat(50));
  console.log('');

  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
