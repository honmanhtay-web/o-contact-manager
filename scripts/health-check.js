#!/usr/bin/env node
'use strict';

/**
 * scripts/health-check.js — Kiểm tra toàn bộ hệ thống trước/sau deploy
 *
 * Usage:
 *   node scripts/health-check.js
 *   node scripts/health-check.js --url http://localhost:3000 --key YOUR_API_KEY
 *   node scripts/health-check.js --url https://api.yourdomain.com --key YOUR_API_KEY
 *
 * Checks:
 *   1. Server reachable (GET /health)
 *   2. Auth working (GET /contacts với key hợp lệ)
 *   3. Auth blocking (GET /contacts không có key → 401)
 *   4. Pagination working (GET /contacts?limit=1)
 *   5. Stats endpoint (GET /contacts/meta/stats)
 *   6. Firebase connectivity (thông qua stats response)
 */

require('dotenv').config();

const https = require('https');
const http = require('http');

// ─── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let baseUrl = 'http://localhost:3000';
let apiKey = '';

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--url' || args[i] === '-u') && args[i + 1]) baseUrl = args[++i];
  if ((args[i] === '--key' || args[i] === '-k') && args[i + 1]) apiKey = args[++i];
}

baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => reject(new Error('Timeout after 10s')), 10000);

    const req = lib.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      clearTimeout(timeout);
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => { clearTimeout(timeout); reject(err); });
    req.end();
  });
}

// ─── Check runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label, detail) {
  console.log(`  ❌ ${label}`);
  if (detail) console.log(`     → ${detail}`);
  failed++;
}

function warn(label) {
  console.log(`  ⚠️  ${label}`);
}

// ─── Checks ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 Contact Manager — Health Check');
  console.log('━'.repeat(50));
  console.log(`   URL: ${baseUrl}`);
  console.log(`   Key: ${apiKey ? apiKey.slice(0, 8) + '...' : '(none)'}`);
  console.log('━'.repeat(50));
  console.log('');

  // ── 1. Server reachable ───────────────────────────────────────────────────
  console.log('1. Server connectivity');
  try {
    const res = await request(`${baseUrl}/health`);
    if (res.status === 200 && res.body.status === 'ok') {
      ok(`GET /health → 200 (version: ${res.body.version || 'unknown'})`);
    } else {
      fail(`GET /health → ${res.status}`, JSON.stringify(res.body));
    }
  } catch (err) {
    fail(`GET /health → cannot connect`, err.message);
    console.log('\n⛔ Server không reachable. Dừng kiểm tra.');
    process.exit(1);
  }

  // ── 2. Auth blocking (no key) ─────────────────────────────────────────────
  console.log('\n2. Authentication');
  try {
    const res = await request(`${baseUrl}/contacts`);
    if (res.status === 401) {
      ok('GET /contacts (no key) → 401 Unauthorized ✓');
    } else {
      fail(`GET /contacts (no key) → ${res.status} (expected 401)`, 'Auth middleware có thể chưa hoạt động');
    }
  } catch (err) {
    fail('GET /contacts (no key)', err.message);
  }

  // ── 3. Auth working (with key) ────────────────────────────────────────────
  if (!apiKey) {
    warn('Bỏ qua test với API key (không có --key). Chạy lại với --key <your-key> để test đầy đủ.');
  } else {
    const headers = { Authorization: `Bearer ${apiKey}` };

    try {
      const res = await request(`${baseUrl}/contacts?limit=1`, { headers });
      if (res.status === 200 && res.body.data !== undefined) {
        ok(`GET /contacts (with key) → 200, count=${res.body.meta?.count ?? '?'}`);
      } else if (res.status === 401 || res.status === 403) {
        fail(`GET /contacts (with key) → ${res.status}`, 'Key không hợp lệ hoặc đã bị disabled');
      } else {
        fail(`GET /contacts (with key) → ${res.status}`, JSON.stringify(res.body).slice(0, 100));
      }
    } catch (err) {
      fail('GET /contacts (with key)', err.message);
    }

    // ── 4. Stats ──────────────────────────────────────────────────────────────
    console.log('\n3. Endpoints');
    try {
      const res = await request(`${baseUrl}/contacts/meta/stats`, { headers });
      if (res.status === 200 && res.body.data !== undefined) {
        const total = res.body.data.totalContacts ?? 0;
        ok(`GET /meta/stats → 200 (totalContacts: ${total})`);
        if (total === 0) warn('totalContacts = 0. Chạy import nếu cần data.');
      } else {
        fail(`GET /meta/stats → ${res.status}`);
      }
    } catch (err) {
      fail('GET /meta/stats', err.message);
    }

    // ── 5. Lookup endpoints ───────────────────────────────────────────────────
    try {
      const res = await request(`${baseUrl}/contacts/ud-keys`, { headers });
      if (res.status === 200) {
        ok(`GET /ud-keys → 200 (${res.body.meta?.total ?? 0} keys)`);
      } else {
        fail(`GET /ud-keys → ${res.status}`);
      }
    } catch (err) {
      fail('GET /ud-keys', err.message);
    }

    // ── 6. Invalid endpoint ───────────────────────────────────────────────────
    try {
      const res = await request(`${baseUrl}/contacts/nonexistent-id-xyz-404`, { headers });
      if (res.status === 404) {
        ok('GET /contacts/nonexistent → 404 Not Found ✓');
      } else {
        fail(`GET /contacts/nonexistent → ${res.status} (expected 404)`);
      }
    } catch (err) {
      fail('GET /contacts/nonexistent', err.message);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('');
  console.log('━'.repeat(50));
  const total = passed + failed;
  if (failed === 0) {
    console.log(`✅ All ${total} checks passed!`);
  } else {
    console.log(`⚠️  ${passed}/${total} passed, ${failed} failed`);
  }
  console.log('━'.repeat(50));
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err.message);
  process.exit(1);
});
