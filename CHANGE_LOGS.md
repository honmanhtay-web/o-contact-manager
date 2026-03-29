## [TASK-16] 2026-03-28 — Deploy & Production Setup

### Thay đổi kỹ thuật

- Tạo mới `docs/deployment-guide.md`:
  - Hướng dẫn đầy đủ cho 2 lựa chọn: self-hosted (Node.js + PM2) và Firebase Cloud Functions
  - Bước từng bước: cài server, upload code, cấu hình .env, deploy rules, tạo API key, import, khởi động PM2, nginx reverse proxy, HTTPS
  - Quản lý API keys (tạo, vô hiệu hóa, key có hạn sử dụng)
  - Monitoring & maintenance commands
  - Bảng xử lý sự cố thường gặp (401, 403, query chậm, timeout, quota)
  - Production checklist 10 điểm

- Tạo mới `scripts/health-check.js`:
  - Check 1: GET /health → server reachable
  - Check 2: GET /contacts không key → 401 (auth middleware hoạt động)
  - Check 3: GET /contacts với key → 200 (key hợp lệ)
  - Check 4: GET /meta/stats → Firebase connectivity
  - Check 5: GET /ud-keys → lookup endpoint
  - Check 6: GET /contacts/nonexistent → 404 handler
  - CLI: `--url`, `--key`; exit code 1 nếu có lỗi (CI-friendly)

- Tạo mới `ecosystem.config.js`:
  - PM2 config: name, script, autorestart, max_memory_restart 512M, restart_delay
  - Log paths: `/var/log/contact-manager/out.log` + `error.log`
  - env_file: `.env`, graceful shutdown với kill_timeout 5000ms

- Cập nhật `package.json`: thêm `"health": "node scripts/health-check.js"`
- Cập nhật `Readme.md`: deploy quick-start 5 lệnh + link deployment-guide

### Lý do
- TASK-16 là task cuối — tạo artifacts giúp user deploy ngay mà không cần đọc nhiều docs
- health-check.js cho phép CI/CD verify deployment tự động (exit code)
- ecosystem.config.js giúp PM2 quản lý process production chuẩn

---

## [TASK-07..15] 2026-03-28 — API Routes, Middleware, Scripts & Tools

### Thay đổi kỹ thuật

**TASK-10 — middleware/auth.js + scripts/create-api-key.js**
- Tạo mới `functions/middleware/auth.js`:
  - `authMiddleware` — Express middleware validate `Authorization: Bearer <key>`
  - SHA-256 hash key → lookup `/api_keys/{keyHash}` trong Realtime DB
  - Kiểm tra `active` flag + `expiresAt` (optional)
  - Non-blocking `lastUsedAt` update sau mỗi request thành công
  - Attach `req.apiKey = { hash, name, ... }` cho downstream handlers
  - `hashApiKey(key)` — export để dùng trong create-api-key script
- Tạo mới `scripts/create-api-key.js`:
  - Generate 32-byte random key → base64url (43 chars)
  - SHA-256 hash → ghi vào Realtime DB `/api_keys/{hash}`
  - CLI args: `--name`, `--expires`
  - In key ra stdout 1 lần duy nhất (không lưu key gốc)

**TASK-07 — routes/contacts.js**
- Tạo mới `functions/routes/contacts.js`:
  - `GET /contacts` — parseQueryParams + paginateQuery + buildListResponse; validate search ≥ 2 chars
  - `GET /contacts/:id` — parallel read index + detail (2 reads)
  - `POST /contacts` — validate displayName hoặc email, writeContact với isUpdate=false
  - `PUT /contacts/:id` — check exists, writeContact với isUpdate=true (overwrite)
  - `PATCH /contacts/:id` — đọc existing detail → deep merge contact + userDefined → writeContact
  - `DELETE /contacts/:id` — deleteContact, map "not found" error → 404

**TASK-08 — routes/lookup.js**
- Tạo mới `functions/routes/lookup.js`:
  - `GET /contacts/by-email/:email` — encodeDocId → email_lookup → parallel fetch index+detail (3 reads total)
  - `GET /contacts/by-ud-key/:key` — ud_key_lookup → batch fetch contacts_index (1+N reads)
  - `GET /contacts/ud-keys` — full scan ud_key_lookup collection, orderBy key

**TASK-09 — routes/bulk.js + routes/meta.js**
- Tạo mới `functions/routes/bulk.js`:
  - `POST /contacts/bulk/import` — validate contacts array (max 5000), create job in Realtime DB, return 202 + jobId, async bulkWriteContacts với onProgress, update stats sau khi xong
  - `GET /contacts/bulk/import/:jobId` — đọc job status từ Realtime DB
  - `GET /contacts/bulk/export` — hỗ trợ format json/vcf, limit, category filter; contactToVcf() fallback nếu không có vcfRaw
- Tạo mới `functions/routes/meta.js`:
  - `GET /contacts/meta/stats` — đọc `meta/stats` (1 read), trả zero stats nếu chưa có

**TASK-11 — functions/index.js**
- Tạo mới `functions/index.js`:
  - Express app với cors + json (limit 10mb) + urlencoded
  - `GET /health` — không cần auth
  - Auth middleware áp dụng cho tất cả `/contacts` routes
  - Route mounting order đúng: lookupRouter → bulkRouter → metaRouter → contactsRouter
  - Global 404 + error handler
  - Standalone mode (`node functions/index.js`) + export cho Cloud Functions

**TASK-12 — scripts/vcf2json.js**
- Tạo mới `scripts/vcf2json.js`:
  - `parseVcf(text)` — split nhiều vCards, parse từng cái
  - `parseVcfFile(path)` — async read file + parseVcf
  - `parseProp(line)` — parse property name/params/value, handle QUOTED-PRINTABLE, backslash unescape
  - Hỗ trợ: FN, N, EMAIL, TEL, ORG, CATEGORIES, NOTE, BDAY, PHOTO (URL only), ADR
  - X-FOO-BAR → `userDefined.foo.bar`; X-BAR → `contact.extensions.BAR`
  - CLI: `node scripts/vcf2json.js input.vcf [output.json]`

**TASK-13 — scripts/import.js**
- Tạo mới `scripts/import.js`:
  - Đọc .vcf (parseVcfFile) hoặc .json (JSON.parse)
  - bulkWriteContacts với concurrency config, progress bar % trên stdout
  - Cập nhật meta/stats sau import
  - Exit code 0 nếu không lỗi, 1 nếu có lỗi
  - CLI: `--file`, `--concurrency`

**TASK-14 — scripts/migrate-v2.js**
- Tạo mới `scripts/migrate-v2.js`:
  - Cursor-based scan toàn bộ contacts_detail (batchSize=400, default)
  - Rebuild contacts_index bằng buildContactDocs
  - Set email_lookup (idempotent qua set())
  - FieldValue.arrayUnion cho ud_key_lookup.contactIds
  - Tự động flush Firestore batch khi opsInBatch ≥ 490
  - Cập nhật meta/stats sau migrate
  - CLI: `--dry-run`, `--batch`, `--start-after`

**TASK-15 — docs/api.http**
- Tạo mới `docs/api.http`:
  - REST Client file (VSCode/IntelliJ) cho tất cả 13 endpoints
  - Ví dụ đầy đủ: list, search, filter, CRUD, lookup, bulk, meta
  - Phân nhóm rõ ràng với comments

### Lý do
- TASK-10 trước để auth sẵn sàng cho routes test
- Route mounting order trong TASK-11 quan trọng: specific paths (by-email, bulk, meta) phải trước `:id` wildcard
- PATCH dùng deep merge thay vì shallow để bảo toàn fields không được gửi lên
- Bulk import dùng async (202) để tránh timeout với 30K contacts
- VCF parser tự viết (không dùng thư viện) để giảm dependencies

---

## [TASK-04,05,06] 2026-03-28 — Core Utilities: contactMapper, writeContact, pagination

### Thay đổi kỹ thuật

**TASK-04 — contactMapper.js + searchTokens.js**
- Tạo mới `functions/utils/searchTokens.js`:
  - `normalize(str)` — lowercase + NFD strip diacritics (hỗ trợ tiếng Việt: ễ, ă, ơ, ...)
  - `tokensFromText(text)` — prefix ngrams từ min 2 chars, bỏ 1-char
  - `buildSearchTokens({displayName, organization, primaryEmail, allEmails})` — dedup + sorted
- Tạo mới `functions/utils/contactMapper.js`:
  - `buildContactDocs(contactJson, options)` — transform về `{contactId, indexDoc, detailDoc, emailLookupDocs, udKeyUpdates}`
  - Hỗ trợ 2 input format: wrapped `{contact:{...}, userDefined:{...}}` và flat `{displayName, emails, ...}`
  - `encodeDocId(key)` — encode `.` → `,` cho Firestore document IDs
  - `extractEmails()`, `extractPhones()`, `extractDisplayName()`, `extractUdKeys()` — các helper extract fields
  - allEmails: dedup + lowercase; allDomains: extract domain từ mỗi email
  - Auto-generate contactId bằng `nanoid(12)` nếu không truyền
- Tạo mới `tests/contactMapper.test.js` — 35 unit tests, 100% pass

**TASK-05 — writeContact.js**
- Tạo mới `functions/utils/writeContact.js`:
  - `writeContact(contactJson, options)` — 1 Firestore batch: set index, set detail, delete cũ email_lookup, set mới email_lookup, arrayRemove cũ ud_key_lookup, arrayUnion mới ud_key_lookup
  - `deleteContact(contactId)` — đọc index → batch delete index + detail + email_lookups + arrayRemove ud_key_lookups
  - `bulkWriteContacts(array, {concurrency, onProgress})` — Promise.allSettled với chunk size 5
  - isUpdate=true: đọc allEmails + userDefinedKeys cũ để cleanup diff trước khi write
  - FieldValue.increment(-1/+1) trên ud_key_lookup.count

**TASK-06 — pagination.js**
- Tạo mới `functions/utils/pagination.js`:
  - `encodeCursor(docId)` / `decodeCursor(cursor)` — base64url
  - `parseQueryParams(req.query)` — validate + normalize: search, category, domain, email, udKey, hasUD, sort, order, limit (max 200), cursor
  - `buildQuery(params)` — Firestore query builder với ưu tiên filter: search > email > udKey > category > domain; support combo category+udKey
  - `paginateQuery(params)` — fetch limit+1, startAfter snapshot, trả `{data, nextCursor, hasMore, count}`
  - `buildListResponse()` — format response chuẩn với meta object

### Lý do
- TASK-04: Prerequisite cho mọi thứ — import script, write operations, API routes đều dùng contactMapper
- TASK-05: Đảm bảo 4 collections luôn consistent — không bao giờ write 1 collection mà thiếu collection kia
- TASK-06: Cursor pagination giải quyết vấn đề quota — offset-based là O(n) reads với Firestore

---

## [TASK-01,02,03] 2026-03-28 — Khởi tạo Firebase, Dependencies & Security Rules

### Thay đổi kỹ thuật

**TASK-01 — Firebase Admin SDK init**
- Tạo mới `functions/utils/firebase-admin.js` — singleton pattern, lazy init
- Tạo mới `firebase.json` — cấu hình Firestore rules/indexes, Realtime DB rules, Functions runtime nodejs18
- Tạo mới `.env.example`

**TASK-02 — Dependencies & Project Structure**
- Tạo mới `package.json` với đủ dependencies
- Cập nhật `.gitignore`

**TASK-03 — Firestore Security Rules & Indexes**
- Tạo mới `firestore.rules` — chặn toàn bộ client-side access
- Tạo mới `firestore.indexes.json` — 7 composite indexes
- Tạo mới `database.rules.json`

### Lý do
- Foundation cho toàn bộ project

---

## [TASK-00] 2026-03-28 — Khởi tạo dự án & Lên kế hoạch

### Thay đổi kỹ thuật
- Tạo mới `project_task.md`, `template-task.md`, `project_memory.md`, `Readme.md`, `CHANGE_LOGS.md`, `CHANGE_LOGS_USER.md`
- Phân tích `docs/database-architecture.md` và chia nhỏ thành 16 tasks

### Lý do
- Khởi tạo dự án từ tài liệu kiến trúc có sẵn

---
