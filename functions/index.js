'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { authMiddleware } = require('./middleware/auth');
const contactsRouter = require('./routes/contacts');
const lookupRouter = require('./routes/lookup');
const bulkRouter = require('./routes/bulk');
const metaRouter = require('./routes/meta');

const app = express();

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' })); // bulk import cần limit cao hơn
app.use(express.urlencoded({ extended: false }));

// ─── Health check (không cần auth) ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth middleware (áp dụng cho tất cả /contacts routes) ───────────────────
app.use('/contacts', authMiddleware);

// ─── Routes — thứ tự quan trọng! ─────────────────────────────────────────────
// lookup & bulk & meta phải mount TRƯỚC contacts/:id để tránh conflict

// /contacts/by-email/:email, /contacts/by-ud-key/:key, /contacts/ud-keys
app.use('/contacts', lookupRouter);

// /contacts/bulk/import, /contacts/bulk/export
app.use('/contacts/bulk', bulkRouter);

// /contacts/meta/stats
app.use('/contacts/meta', metaRouter);

// /contacts (CRUD — :id route là cuối)
app.use('/contacts', contactsRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ─── Start server (standalone mode) ──────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Contact Manager API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
  });
}

// Export for Cloud Functions hoặc testing
module.exports = app;
