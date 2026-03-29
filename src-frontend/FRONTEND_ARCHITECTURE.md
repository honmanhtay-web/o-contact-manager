# Frontend Architecture — O Contact Manager
# Path: src-frontend/FRONTEND_ARCHITECTURE.md

> React 18 + Vite + TypeScript + TailwindCSS  
> PWA-ready, mobile-first, Google Contacts-inspired UI  
> Verified against the current implementation on 2026-03-29

---

## 1. Current Status

- `npm run type-check` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run dev` boots successfully

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| UI | React 18 | Function components + hooks |
| Build | Vite 5 | Fast dev server and production bundling |
| Language | TypeScript 5 | Strict mode enabled |
| Styling | TailwindCSS 3 | Custom Google Contacts-inspired palette |
| Routing | React Router v6 | Protected routes + form leave guards |
| State | Zustand | Auth, UI, and filters |
| Data | TanStack Query v5 | Caching, infinite lists, import polling |
| HTTP | Axios | Auth header + normalized errors |
| Forms | React Hook Form + Zod | Dynamic email/phone/userDefined fields |
| PWA | vite-plugin-pwa | Generated manifest + service worker |

---

## 3. Directory Layout

```text
src-frontend/
├── public/
│   ├── icon.svg
│   ├── icon-mask.svg
│   ├── manifest.json
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── api/
│   │   ├── bulk.api.ts
│   │   ├── client.ts
│   │   ├── contacts.api.ts
│   │   ├── lookup.api.ts
│   │   ├── meta.api.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── bulk/
│   │   ├── contact/
│   │   ├── layout/
│   │   ├── search/
│   │   └── ui/
│   ├── constants/
│   │   ├── config.ts
│   │   ├── queryKeys.ts
│   │   └── routes.ts
│   ├── hooks/
│   │   ├── useBulkImport.ts
│   │   ├── useCategories.ts
│   │   ├── useContact.ts
│   │   ├── useContactMutations.ts
│   │   ├── useContacts.ts
│   │   ├── useDebounce.ts
│   │   ├── useInfiniteContacts.ts
│   │   ├── useStats.ts
│   │   ├── useUdKeys.ts
│   │   └── useUnsavedChangesPrompt.ts
│   ├── pages/
│   │   ├── CategoryPage.tsx
│   │   ├── ContactDetailPage.tsx
│   │   ├── ContactsPage.tsx
│   │   ├── EditContactPage.tsx
│   │   ├── NewContactPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── StatsPage.tsx
│   │   └── UdKeysPage.tsx
│   ├── store/
│   │   ├── auth.store.ts
│   │   ├── filter.store.ts
│   │   └── ui.store.ts
│   ├── types/
│   │   ├── common.types.ts
│   │   ├── contact.types.ts
│   │   └── pagination.types.ts
│   ├── utils/
│   │   ├── avatar.ts
│   │   ├── categories.ts
│   │   ├── format.ts
│   │   ├── groupContacts.ts
│   │   ├── storage.ts
│   │   ├── validators.ts
│   │   └── vcf.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 4. Runtime Flow

```text
Page
  -> Hook
  -> TanStack Query
  -> API function
  -> Axios client
  -> Backend REST API
```

### Example

```text
ContactsPage
  -> useInfiniteContacts()
  -> getContacts()
  -> apiClient
  -> GET /contacts
```

---

## 5. State Model

### Zustand

- `auth.store.ts`
  - `apiKey`
  - `isAuthenticated`
  - persists API key via localStorage helper
- `ui.store.ts`
  - `sidebarOpen`
  - `viewMode` (`list | grid`)
  - `selectedContactId`
  - `activePanel`
- `filter.store.ts`
  - `search`, `category`, `domain`, `email`, `udKey`, `hasUD`
  - sort and order
  - converts state into API params

### Query Cache

- `['contacts', 'list', filters]`
- `['contacts', 'detail', id]`
- `['stats']`
- `['categories']`
- `['udKeys']`
- `['emailLookup', email]`
- `['udKeyLookup', key]`
- `['importJob', jobId]`

---

## 6. Implemented Feature Areas

### Contact Browsing

- Infinite list with cursor pagination
- A-Z grouping with virtualized rows
- Grid/list view switching
- Contact detail side panel on larger screens

### Search

- Debounced live search
- Grouped result sections:
  - by name / organization
  - by exact email lookup
  - by UD key lookup
- Recent searches persisted in localStorage

### Forms

- Create and edit flows
- Dynamic emails, phones, and userDefined fields
- Zod validation
- Unsaved-change navigation warning

### Bulk Operations

- JSON import
- Direct `.vcf` file parsing in the browser before bulk import
- Import job progress polling
- JSON / VCF export

### Category Intelligence

- Category summary is derived client-side by paging through contacts
- Used by sidebar, stats page, filter drawer, and form suggestions

---

## 7. PWA

- Static `public/manifest.json` is available for direct serving
- `vite-plugin-pwa` also generates the production web manifest and service worker
- App icons are available in both SVG and PNG form
- Runtime caching:
  - network-first for `/contacts` and `/health`
  - cache-first for Google Fonts assets

---

## 8. Environment & Config

Frontend env vars:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=O Contact Manager
```

Runtime behavior:

- API key is stored in localStorage
- API base URL override is also stored in localStorage
- if the backend returns `401`, the app redirects to `/settings`

---

## 9. Known Tradeoffs

- Category breakdown is computed client-side from paginated contacts because the backend does not currently expose a dedicated category stats endpoint.
- Search by UD key uses heuristic triggering for exact-key lookup, while broad text search remains powered by `/contacts?search=...`.

---

## 10. Recommended Next Backend Enhancements

- Add `/contacts/meta/categories` to avoid client-side category aggregation
- Add a dedicated search endpoint that can return grouped sections in one round-trip
- Add richer stats payloads for categories and import history
