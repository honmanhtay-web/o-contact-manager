'use strict';

/**
 * auth.js — API Key authentication middleware
 *
 * Flow:
 * 1. Đọc header: Authorization: Bearer <api-key>
 * 2. SHA-256 hash key → lookup /api_keys/{keyHash} trong Realtime DB
 * 3. Kiểm tra active flag + (optional) expiry
 * 4. Attach keyInfo vào req.apiKey nếu hợp lệ
 *
 * Realtime DB schema:
 * /api_keys/{keyHash}:
 *   { name, active, createdAt, lastUsedAt, expiresAt? }
 */

const crypto = require('crypto');
const { getRtdb } = require('../utils/firebase-admin');

/**
 * Hash API key bằng SHA-256
 * @param {string} apiKey
 * @returns {string} hex digest
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Lookup key hash trong Realtime Database
 * @param {string} keyHash
 * @returns {Promise<object|null>}
 */
async function lookupApiKey(keyHash) {
  const rtdb = getRtdb();
  const snap = await rtdb.ref(`api_keys/${keyHash}`).once('value');
  return snap.exists() ? snap.val() : null;
}

/**
 * Express middleware — validate API key
 * Gắn req.apiKey = { hash, name, ... } nếu hợp lệ
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header. Use: Authorization: Bearer <api-key>',
    });
  }

  const apiKey = authHeader.slice(7).trim(); // bỏ "Bearer "
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Empty API key' });
  }

  try {
    const keyHash = hashApiKey(apiKey);
    const keyInfo = await lookupApiKey(keyHash);

    if (!keyInfo) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API key' });
    }

    if (keyInfo.active === false) {
      return res.status(403).json({ error: 'Forbidden', message: 'API key is disabled' });
    }

    // Kiểm tra expiry nếu có
    if (keyInfo.expiresAt && new Date(keyInfo.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Forbidden', message: 'API key has expired' });
    }

    // Cập nhật lastUsedAt (non-blocking, không await)
    getRtdb()
      .ref(`api_keys/${keyHash}/lastUsedAt`)
      .set(new Date().toISOString())
      .catch(() => {}); // ignore errors để không block request

    req.apiKey = { hash: keyHash, ...keyInfo };
    return next();
  } catch (err) {
    console.error('[auth] Error validating API key:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Auth check failed' });
  }
}

module.exports = { authMiddleware, hashApiKey };
