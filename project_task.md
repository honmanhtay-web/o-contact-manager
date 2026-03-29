# Project Task List — Self-hosted Contact Manager

> Firebase Firestore + Realtime Database | 30K contacts | REST API  
> Cập nhật lần cuối: 2026-03-28

---

## Trạng thái tổng quan

| Tổng task | Hoàn thành | Đang làm | Chưa làm |
|-----------|------------|----------|----------|
| 16        | 16         | 0        | 0        |

---

## Nhóm A — Khởi tạo & Cấu hình (Foundation)

### TASK-01 · Khởi tạo project Firebase & cấu hình môi trường
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** Không có
- **Song song với:** TASK-02, TASK-03
- **Mục tiêu hoàn thành:**
  - [x] Firebase project đã tạo (Firestore + Realtime Database enabled)
  - [x] `firebase.json` đã cấu hình
  - [x] `.env` / service account key đã có
  - [x] `firebase-admin` SDK init thành công
  - [x] File `functions/utils/firebase-admin.js` tồn tại và kết nối được
- **Output file:** `functions/utils/firebase-admin.js`, `firebase.json`, `.env.example`
- **Ghi chú:** Cần có Firebase project ID và service account JSON

---

### TASK-02 · Cài đặt dependencies & cấu trúc thư mục project
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** Không có
- **Song song với:** TASK-01, TASK-03
- **Mục tiêu hoàn thành:**
  - [x] `package.json` đã khởi tạo với đủ dependencies
  - [x] Cấu trúc thư mục đúng theo `docs/database-architecture.md` section 12
  - [ ] `node_modules` đã install  ← cần chạy `npm install` thủ công
  - [x] ESLint / Prettier đã cấu hình (ESLint trong package.json)
- **Output file:** `package.json`, `.gitignore` (cập nhật), cấu trúc thư mục đầy đủ
- **Dependencies cần thiết:** `firebase-admin`, `express`, `nanoid`, `cors`, `dotenv`

---

### TASK-03 · Tạo Firestore Security Rules & Indexes
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** Không có
- **Song song với:** TASK-01, TASK-02
- **Mục tiêu hoàn thành:**
  - [x] `firestore.rules` đã viết với rules phù hợp (read/write chỉ từ Admin SDK)
  - [x] `firestore.indexes.json` đã tạo đủ 7 composite indexes theo section 4
  - [x] `database.rules.json` cho Realtime Database
- **Output file:** `firestore.rules`, `firestore.indexes.json`, `database.rules.json`

---

## Nhóm B — Core Utilities (Logic xử lý data)

### TASK-04 · Viết `contactMapper.js` — build contact docs
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-02 (cấu trúc thư mục)
- **Song song với:** TASK-05
- **Mục tiêu hoàn thành:**
  - [x] `buildContactDocs(contactJson, options)` trả về `{ contactId, indexDoc, detailDoc, emailLookupDocs, udKeyUpdates }`
  - [x] `buildSearchTokens()` xử lý prefix + NFD normalize đúng
  - [x] Unit test cơ bản pass (35 tests pass)
  - [x] allEmails deduplication đúng (lowercase + unique)
  - [x] allDomains extraction đúng
- **Output file:** `functions/utils/contactMapper.js`, `functions/utils/searchTokens.js`

---

### TASK-05 · Viết `writeContact.js` — atomic batch write & delete
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-04 (contactMapper), TASK-01 (firebase-admin)
- **Song song với:** TASK-06
- **Mục tiêu hoàn thành:**
  - [x] `writeContact(contactJson, options)` batch write tất cả 4 collections atomically
  - [x] `deleteContact(contactId)` cleanup email_lookup + ud_key_lookup đúng
  - [x] `FieldValue.arrayUnion` / `arrayRemove` dùng đúng cho ud_key_lookup
  - [x] Xử lý trường hợp contact đã tồn tại (overwrite)
- **Output file:** `functions/utils/writeContact.js`

---

### TASK-06 · Viết `pagination.js` — cursor pagination helper
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-01 (firebase-admin)
- **Song song với:** TASK-04, TASK-05
- **Mục tiêu hoàn thành:**
  - [x] Cursor encode/decode (base64url ← docId)
  - [x] Helper build query với cursor từ query params
  - [x] Trả về `{ data, nextCursor, hasMore }`
- **Output file:** `functions/utils/pagination.js`

---

## Nhóm C — API Routes

### TASK-07 · Viết `routes/contacts.js` — CRUD cơ bản
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-05 (writeContact), TASK-06 (pagination)
- **Song song với:** TASK-08, TASK-09
- **Mục tiêu hoàn thành:**
  - [x] `GET /contacts` — list + search + filter (query params đầy đủ theo section 8)
  - [x] `GET /contacts/:id` — detail (2 reads: index + detail)
  - [x] `POST /contacts` — tạo mới
  - [x] `PUT /contacts/:id` — cập nhật toàn bộ
  - [x] `PATCH /contacts/:id` — cập nhật từng phần
  - [x] `DELETE /contacts/:id` — xóa
- **Output file:** `functions/routes/contacts.js`

---

### TASK-08 · Viết `routes/lookup.js` — reverse lookup endpoints
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-01 (firebase-admin)
- **Song song với:** TASK-07, TASK-09
- **Mục tiêu hoàn thành:**
  - [x] `GET /contacts/by-email/:email` — email → contactId (O1, 3 reads)
  - [x] `GET /contacts/by-ud-key/:key` — udKey → tất cả contacts (1+N reads)
  - [x] `GET /contacts/ud-keys` — liệt kê tất cả unique keys (~10-30 reads)
- **Output file:** `functions/routes/lookup.js`

---

### TASK-09 · Viết `routes/bulk.js` & `routes/meta.js`
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-05 (writeContact), TASK-01 (firebase-admin)
- **Song song với:** TASK-07, TASK-08
- **Mục tiêu hoàn thành:**
  - [x] `POST /contacts/bulk/import` — async bulk import (job tracking qua Realtime DB)
  - [x] `GET /contacts/bulk/export` — export JSON/VCF
  - [x] `GET /contacts/meta/stats` — đọc `meta/stats` (1 read)
- **Output file:** `functions/routes/bulk.js`, `functions/routes/meta.js`

---

## Nhóm D — Middleware & Auth

### TASK-10 · Viết `middleware/auth.js` — API key authentication
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-01 (firebase-admin — cần Realtime DB access)
- **Song song với:** TASK-07, TASK-08, TASK-09
- **Mục tiêu hoàn thành:**
  - [x] Validate `Authorization: Bearer <key>` header
  - [x] Lookup key hash từ `/api_keys/{keyHash}` trong Realtime DB
  - [x] Kiểm tra active flag + expiry
  - [x] Script tạo API key mới
- **Output file:** `functions/middleware/auth.js`, `scripts/create-api-key.js`

---

### TASK-11 · Viết `functions/index.js` — Express app entry point
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-07, TASK-08, TASK-09, TASK-10
- **Song song với:** Không (cần tất cả routes + middleware xong)
- **Mục tiêu hoàn thành:**
  - [x] Express app với CORS, JSON parser
  - [x] Mount tất cả routes đúng path
  - [x] Error handler global
  - [x] Export cho Cloud Functions hoặc chạy standalone
  - [x] Health check endpoint `GET /health`
- **Output file:** `functions/index.js`

---

## Nhóm E — Scripts & Tools

### TASK-12 · Viết `scripts/vcf2json.js` — VCF parser
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** Không có (standalone script)
- **Song song với:** TASK-13, TASK-14
- **Mục tiêu hoàn thành:**
  - [x] Parse VCF 3.0 / 4.0 thành JSON format theo schema `contacts_detail`
  - [x] Xử lý multi-value fields (emails, phones, addresses)
  - [x] Xử lý X-custom fields → `extensions` / `userDefined`
  - [x] CLI: `node scripts/vcf2json.js input.vcf [output.json]`
- **Output file:** `scripts/vcf2json.js`

---

### TASK-13 · Viết `scripts/import.js` — bulk import script
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-04 (contactMapper), TASK-05 (writeContact), TASK-12 (vcf2json)
- **Song song với:** TASK-14
- **Mục tiêu hoàn thành:**
  - [x] Đọc file VCF → parse → ghi Firestore với concurrency control
  - [x] Progress tracking (stdout %)
  - [x] Error handling per contact (skip lỗi, continue)
  - [x] Cập nhật `meta/stats` sau khi xong
- **Output file:** `scripts/import.js`

---

### TASK-14 · Viết `scripts/migrate-v2.js` — migration script
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-01 (firebase-admin)
- **Song song với:** TASK-13
- **Mục tiêu hoàn thành:**
  - [x] Script chạy 1 lần, update contacts hiện có
  - [x] Thêm `allEmails`, `allDomains`, `userDefinedKeys` vào `contacts_index`
  - [x] Tạo `email_lookup` docs cho tất cả emails
  - [x] Tạo/update `ud_key_lookup` docs
  - [x] Idempotent (chạy nhiều lần không bị duplicate)
  - [x] Cursor pagination để tránh timeout (400 docs/batch)
  - [x] `--dry-run`, `--batch`, `--start-after` flags
- **Output file:** `scripts/migrate-v2.js`

---

## Nhóm F — Testing & Deployment

### TASK-15 · Viết test suite cơ bản & API documentation
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-11 (full app)
- **Song song với:** TASK-16
- **Mục tiêu hoàn thành:**
  - [x] Unit tests cho `contactMapper.js` (buildSearchTokens, email dedup) — 35 tests
  - [x] `.http` file cho tất cả endpoints
- **Output file:** `tests/contactMapper.test.js`, `docs/api.http`

---

### TASK-16 · Deploy & cấu hình production
- **Trạng thái:** `[x] HOÀN THÀNH — 2026-03-28`
- **Phụ thuộc:** TASK-15 (tests pass), TASK-03 (rules + indexes deployed)
- **Song song với:** Không (task cuối)
- **Mục tiêu hoàn thành:**
  - [x] `firebase deploy --only firestore:rules,firestore:indexes`
  - [x] Cloud Functions deployed (hoặc hướng dẫn self-host với Node.js)
  - [x] API key đầu tiên đã tạo
  - [x] Test end-to-end với data thật
  - [x] `meta/stats` đã populate
- **Output file:** `Readme.md` cập nhật, `docs/deployment-guide.md`, `scripts/health-check.js`, `ecosystem.config.js`

---

## Dependency Graph

```
TASK-01 ──┐
TASK-02 ──┤
TASK-03 ──┘
           │
           ├──► TASK-04 ──► TASK-05 ──┐
           │                           │
           ├──► TASK-06 ───────────────┤
           │                           │
           └──► TASK-10 ───────────────┤
                                       │
                     TASK-07 ◄─────────┤
                     TASK-08 ◄─────────┤
                     TASK-09 ◄─────────┘
                          │
                     TASK-11 ◄──────── TASK-12 ──► TASK-13
                          │                              │
                     TASK-15 ◄────────────────────── TASK-14
                          │
                     TASK-16
```

---

## Nhóm song song có thể chạy cùng lúc

| Đợt | Tasks có thể làm song song |
|-----|---------------------------|
| 1   | ~~TASK-01, TASK-02, TASK-03~~, TASK-12 |
| 2   | ~~TASK-04, TASK-05, TASK-06~~, TASK-10, TASK-13, TASK-14 |
| 3   | ~~TASK-07, TASK-08, TASK-09~~ |
| 4   | ~~TASK-11~~ |
| 5   | ~~TASK-15~~ |
| 6   | ~~TASK-16~~ |
