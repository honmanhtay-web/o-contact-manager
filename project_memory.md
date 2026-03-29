# Project Memory — Self-hosted Contact Manager

> Cập nhật: 2026-03-28 | Task hoàn thành gần nhất: TASK-16 — TẤT CẢ 16/16 TASKS HOÀN THÀNH ✅
> Agent đọc file này để nắm toàn bộ context và tiếp tục làm việc

---

## Tổng quan project

**Tên project:** contacts-selfhost  
**Mục đích:** Quản lý danh bạ cá nhân self-hosted với ~30,000 contacts  
**Tech stack:**
- Backend: Firebase Firestore + Realtime Database
- API Layer: Express.js / Cloud Functions + Firebase Admin SDK
- Auth: API Key (hash lưu trong Realtime Database)
- Language: Node.js (CommonJS, `'use strict'`)

**Tài liệu gốc:** `docs/database-architecture.md` — đây là spec chính, mọi implementation phải tuân theo

---

## Kiến trúc Database (tóm tắt)

### Firestore Collections (6 collections)
| Collection | Mục đích | Kích thước |
|------------|----------|------------|
| `contacts_index/{id}` | Hiển thị danh sách, search, filter | ~1KB/doc × 30K |
| `contacts_detail/{id}` | Dữ liệu đầy đủ, đọc khi click vào 1 contact | ~5-50KB/doc |
| `email_lookup/{emailId}` | Reverse lookup email → contactId (O1) | ~54K docs |
| `ud_key_lookup/{keyId}` | Reverse lookup userDefined key → contactIds | ~10-30 docs |
| `categories/{id}` | Tag management | ~50 docs |
| `meta/stats` | Thống kê tổng | 1 doc |

### Realtime Database
- `/api_keys/{keyHash}` — API key management
- `/sync_status` — trạng thái sync
- `/import_jobs/{jobId}` — bulk import progress

### Encoding rule cho document IDs của lookup collections
- Dấu `.` thay bằng `,`
- Ví dụ: `"gitea.token"` → doc ID: `"gitea,token"`
- Ví dụ: `"ongtrieuhau@gmail.com"` → doc ID: `"ongtrieuhau@gmail,com"`

---

## Trạng thái tasks

### Đã hoàn thành (16/16) 🎉
- TASK-01: Khởi tạo Firebase & cấu hình môi trường ✅
- TASK-02: Cài đặt dependencies & cấu trúc thư mục ✅
- TASK-03: Firestore Security Rules & Indexes ✅
- TASK-04: `contactMapper.js` + `searchTokens.js` ✅
- TASK-05: `writeContact.js` ✅
- TASK-06: `pagination.js` ✅
- TASK-07: `routes/contacts.js` ✅
- TASK-08: `routes/lookup.js` ✅
- TASK-09: `routes/bulk.js` & `routes/meta.js` ✅
- TASK-10: `middleware/auth.js` + `scripts/create-api-key.js` ✅
- TASK-11: `functions/index.js` ✅
- TASK-12: `scripts/vcf2json.js` ✅
- TASK-13: `scripts/import.js` ✅
- TASK-14: `scripts/migrate-v2.js` ✅
- TASK-15: `docs/api.http` (API documentation) ✅
- TASK-16: Deploy guide + health-check + PM2 config ✅

### Chưa thực hiện
Không còn task nào. Project hoàn chỉnh 16/16.

---

## Cấu trúc file hiện tại

```
contacts-selfhost/
├── functions/
│   ├── index.js                          ✅ [TASK-11] Express app entry point
│   ├── utils/
│   │   ├── firebase-admin.js             ✅ [TASK-01] Firebase singleton init
│   │   ├── searchTokens.js               ✅ [TASK-04] normalize, buildSearchTokens
│   │   ├── contactMapper.js              ✅ [TASK-04] buildContactDocs, encodeDocId
│   │   ├── writeContact.js               ✅ [TASK-05] writeContact, deleteContact, bulkWriteContacts
│   │   └── pagination.js                 ✅ [TASK-06] parseQueryParams, paginateQuery
│   ├── routes/
│   │   ├── contacts.js                   ✅ [TASK-07] GET/POST/PUT/PATCH/DELETE /contacts
│   │   ├── lookup.js                     ✅ [TASK-08] by-email, by-ud-key, ud-keys
│   │   ├── bulk.js                       ✅ [TASK-09] bulk import/export
│   │   └── meta.js                       ✅ [TASK-09] /meta/stats
│   └── middleware/
│       └── auth.js                       ✅ [TASK-10] API key auth middleware
│
├── scripts/
│   ├── create-api-key.js                 ✅ [TASK-10] Tạo API key mới
│   ├── vcf2json.js                       ✅ [TASK-12] VCF parser
│   ├── import.js                         ✅ [TASK-13] Bulk import từ VCF/JSON
│   └── migrate-v2.js                     ✅ [TASK-14] Migration v1→v2
│
├── docs/
│   ├── api.http                          ✅ [TASK-15] HTTP test file
│   ├── deployment-guide.md               ✅ [TASK-16] Hướng dẫn deploy production
│   └── database-architecture.md         (spec gốc)
│
├── tests/
│   └── contactMapper.test.js             ✅ [TASK-04] 35 unit tests
│
├── firestore.rules                       ✅ [TASK-03]
├── firestore.indexes.json                ✅ [TASK-03] 7 composite indexes
├── database.rules.json                   ✅ [TASK-03]
├── firebase.json                         ✅ [TASK-01]
├── package.json                          ✅ [TASK-02]
├── .env.example                          ✅ [TASK-01]
└── .gitignore                            ✅ [TASK-02]
```

---

## Quyết định kỹ thuật đã chốt

1. **Atomic batch write:** Mỗi contact write = 1 Firestore batch (index + detail + email_lookup + ud_key_lookup)
2. **Search tokens:** Prefix ngrams từ ký tự thứ 2 trở đi, NFD normalize để hỗ trợ tiếng Việt
3. **Email encoding:** lowercase trước khi lưu
4. **Pagination:** Cursor-based (base64url encode docId, startAfter snapshot)
5. **Không query `contacts_detail` để làm danh sách** — chỉ query `contacts_index`
6. **API Key hashing:** SHA-256, lưu hash trong Realtime DB, không lưu key gốc
7. **CommonJS (`require`):** Toàn bộ project dùng `'use strict'` + CommonJS — không dùng ESM
8. **`nanoid@^3`:** Dùng v3 (CommonJS) — v4+ chỉ có ESM
9. **Filter priority trong buildQuery:** search > email > udKey > category > domain
10. **Route mounting order trong index.js:** lookup + bulk + meta phải mount TRƯỚC contacts/:id
11. **PATCH strategy:** Đọc existing detail → deep merge → gọi writeContact với isUpdate=true
12. **Bulk import:** Async (202 response + jobId), progress tracked trong Realtime DB
13. **VCF X-custom fields:** X-FOO-BAR → userDefined key `foo.bar`, X-BAR → extensions.BAR
14. **Migration:** Cursor-based qua contacts_detail, batch 400 docs, idempotent via set()

---

## API của các utils đã implement

### contactMapper.js
```js
const { buildContactDocs, encodeDocId } = require('./contactMapper');
const result = buildContactDocs(contactJson, { contactId?, sourceFile?, importedAt?, version? });
// result: { contactId, indexDoc, detailDoc, emailLookupDocs[], udKeyUpdates[] }
```

### writeContact.js
```js
const { writeContact, deleteContact, bulkWriteContacts } = require('./writeContact');
await writeContact(contactJson, { contactId?, isUpdate?, sourceFile? });
await deleteContact(contactId);
await bulkWriteContacts(array, { concurrency?, onProgress? });
```

### pagination.js
```js
const { parseQueryParams, paginateQuery, buildListResponse } = require('./pagination');
const params = parseQueryParams(req.query);
const result = await paginateQuery(params);
res.json(buildListResponse(result, params));
```

### auth.js
```js
const { authMiddleware, hashApiKey } = require('./middleware/auth');
app.use('/contacts', authMiddleware); // Express middleware
```

---

## Cấu hình cần thiết khi setup

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
PORT=3000
NODE_ENV=development
```

---

## Ghi chú cho agent tiếp theo

**Project đã hoàn chỉnh 16/16 tasks.** Để sử dụng:

1. `npm install` — cài dependencies
2. Cấu hình `.env` với Firebase credentials
3. `npm run deploy:rules` — upload rules & indexes
4. `npm run create-key` — tạo API key đầu tiên
5. `npm run import -- --file contacts.vcf` — import data
6. `pm2 start ecosystem.config.js` — khởi động production
7. `npm run health -- --key <key>` — kiểm tra hệ thống

Xem `docs/deployment-guide.md` để biết thêm chi tiết.
