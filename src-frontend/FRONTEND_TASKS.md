# Frontend Task List — O Contact Manager
# Path: src-frontend/FRONTEND_TASKS.md

> Tất cả tasks được thiết kế để thực hiện song song tối đa  
> Mỗi task độc lập, output rõ ràng, tiêu chí hoàn thành đo lường được  
> Cập nhật: 2026-03-29  
> Trạng thái bên dưới đã được đối chiếu lại với code thực tế trong `src-frontend`

---

## Trạng thái tổng quan

| Tổng task | Hoàn thành | Một phần | Chưa làm |
|-----------|------------|----------|----------|
| 18        | 15         | 3        | 0        |

### Kết quả xác minh gần nhất

- [x] `npm run type-check` pass
- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] `npm run dev` boot thành công; khi verify cổng `5173` đang bận nên Vite tự chuyển sang `5174`

### Quy ước trạng thái

- `[x] HOÀN THÀNH`: đã có code và đã qua xác minh phù hợp với task ở mức triển khai hiện tại
- `[~] THỰC HIỆN MỘT PHẦN`: đã có code chính, nhưng vẫn còn lệch một phần so với acceptance criteria gốc
- `[ ] CHƯA THỰC HIỆN`: chưa có triển khai đáng kể

### Hạng mục còn partial nổi bật

- `FE-08`: component primitives đã dùng được, nhưng chưa bổ sung đầy đủ JSDoc/keyboard behavior như spec gốc
- `FE-10`: list/grid/detail chạy tốt, nhưng swipe actions mobile vẫn chưa làm riêng
- `FE-11`: form/detail đã hoàn chỉnh phần chính, nhưng UX categories vẫn theo kiểu input + suggestion thay vì multi-select riêng

---

## Nhóm I — Khởi tạo & Cấu hình (Foundation)
> Không có dependencies nhau, thực hiện song song được

---

### TASK-FE-01 · Khởi tạo Vite + React + TypeScript project
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** Không có
- **Song song với:** TASK-FE-02, TASK-FE-03
- **Estimated:** 1h
- **Output files:**
  - `src-frontend/package.json`
  - `src-frontend/vite.config.ts`
  - `src-frontend/tsconfig.json`
  - `src-frontend/tsconfig.node.json`
  - `src-frontend/index.html`
  - `src-frontend/src/main.tsx`
  - `src-frontend/src/App.tsx`
  - `src-frontend/src/vite-env.d.ts`
  - `src-frontend/.env.example`
  - `src-frontend/.gitignore`

- **Mục tiêu hoàn thành:**
  - [ ] `npm create vite` với template react-ts
  - [ ] Install dependencies: react-router-dom, axios, zustand, @tanstack/react-query, react-hook-form, zod, lucide-react, react-hot-toast
  - [ ] Install devDependencies: tailwindcss, postcss, autoprefixer, @types/node, vite-plugin-pwa
  - [ ] `npm run dev` khởi động thành công tại port 5173
  - [ ] `npm run build` không có lỗi TypeScript
  - [ ] `.env.example` có `VITE_API_BASE_URL` và `VITE_APP_TITLE`

- **Chi tiết package.json dependencies:**
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "@tanstack/react-query": "^5.56.0",
    "@tanstack/react-virtual": "^3.10.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.446.0",
    "react-hot-toast": "^2.4.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/node": "^22.0.0"
  }
}
```

---

### TASK-FE-02 · Cấu hình TailwindCSS + Global Styles
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-01
- **Song song với:** TASK-FE-03
- **Estimated:** 30m
- **Output files:**
  - `src-frontend/tailwind.config.ts`
  - `src-frontend/postcss.config.js`
  - `src-frontend/src/index.css`

- **Mục tiêu hoàn thành:**
  - [ ] TailwindCSS cấu hình với custom colors (Google blue palette)
  - [ ] Custom font: Inter via Google Fonts
  - [ ] CSS variables cho theming (light/dark mode ready)
  - [ ] Custom components trong `@layer components`: `.btn-primary`, `.btn-secondary`, `.card`, `.input-field`
  - [ ] Scrollbar custom styles
  - [ ] Safe area insets cho mobile PWA

- **Chi tiết tailwind.config.ts:**
```typescript
// colors cần define:
colors: {
  primary: { 50..900 }, // Google Blue #1a73e8
  surface: { DEFAULT: '#fff', dark: '#1c1c1e' },
  'on-surface': '#202124',
  divider: '#e0e0e0',
  'contact-accent': [
    '#4285f4', '#ea4335', '#fbbc04', '#34a853',
    '#ff6d00', '#46bdc6', '#7b1fa2', '#c62828'
  ]
}
```

---

### TASK-FE-03 · Types & API Layer Foundation
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-01
- **Song song với:** TASK-FE-02, TASK-FE-04
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/types/contact.types.ts`
  - `src-frontend/src/types/pagination.types.ts`
  - `src-frontend/src/types/common.types.ts`
  - `src-frontend/src/api/client.ts`
  - `src-frontend/src/api/types.ts`
  - `src-frontend/src/constants/config.ts`
  - `src-frontend/src/constants/queryKeys.ts`
  - `src-frontend/src/constants/routes.ts`
  - `src-frontend/src/utils/storage.ts`

- **Mục tiêu hoàn thành:**
  - [ ] Tất cả TypeScript types match với backend schema
  - [ ] `client.ts`: axios instance, request interceptor attach `Authorization: Bearer`, response interceptor handle 401
  - [ ] `queryKeys.ts`: factory functions cho mọi query key
  - [ ] `storage.ts`: getApiKey/setApiKey/clearApiKey dùng localStorage

- **Chi tiết types cần implement:**

**contact.types.ts:**
```typescript
interface EmailEntry { type: string[]; value: string; label?: string }
interface PhoneEntry { type: string[]; value: string }
interface NameParts { family?: string; given?: string; middle?: string }

interface ContactIndex {
  id: string; displayName: string; nameNormalized: string;
  primaryEmail: string; emailDomain: string;
  allEmails: string[]; allDomains: string[];
  primaryPhone: string; organization?: string; photoUrl?: string;
  categories: string[]; tags: string[];
  searchTokens: string[]; userDefinedKeys: string[];
  hasUserDefined: boolean; udKeyCount: number;
  emailCount: number; phoneCount: number;
  createdAt: string; updatedAt: string;
  importedAt?: string; sourceFile?: string; version: number;
}

interface ContactDetail {
  id: string;
  contact: {
    displayName: string; name?: NameParts;
    emails: EmailEntry[]; phones: PhoneEntry[];
    organization?: string; categories: string[];
  };
  userDefined: Record<string, string>;
  vcfRaw?: string; createdAt: string; updatedAt: string; version: number;
}

interface ContactWithDetail extends ContactIndex {
  detail: ContactDetail | null;
}

interface ContactFormData {
  contact: {
    displayName: string; name?: NameParts;
    emails: EmailEntry[]; phones: PhoneEntry[];
    organization?: string; categories: string[];
  };
  userDefined: Record<string, string>;
}
```

**pagination.types.ts:**
```typescript
interface PaginationMeta {
  count: number; limit: number; hasMore: boolean;
  nextCursor: string | null; sort: string; order: string;
}
interface ContactsPage {
  data: ContactIndex[]; meta: PaginationMeta;
}
```

**queryKeys.ts:**
```typescript
export const queryKeys = {
  contacts: {
    all: ['contacts'] as const,
    list: (filters: ContactFilters) => ['contacts', 'list', filters] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  stats: ['stats'] as const,
  udKeys: ['udKeys'] as const,
  importJob: (jobId: string) => ['importJob', jobId] as const,
}
```

---

### TASK-FE-04 · API Functions (contacts, lookup, bulk, meta)
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-03
- **Song song với:** TASK-FE-05 (sau khi FE-03 xong)
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/api/contacts.api.ts`
  - `src-frontend/src/api/lookup.api.ts`
  - `src-frontend/src/api/bulk.api.ts`
  - `src-frontend/src/api/meta.api.ts`

- **Mục tiêu hoàn thành:**
  - [ ] Mỗi function có TypeScript return type đầy đủ
  - [ ] Error handling: throw AxiosError với message từ server
  - [ ] All API endpoints theo `docs/database-architecture.md` section 6

- **Chi tiết contacts.api.ts — mọi function cần implement:**
```typescript
// List contacts với filters + cursor pagination
getContacts(params: {
  search?: string; category?: string; domain?: string;
  email?: string; udKey?: string; hasUD?: boolean;
  sort?: 'updatedAt'|'createdAt'|'displayName'; order?: 'asc'|'desc';
  limit?: number; cursor?: string;
}): Promise<ContactsPage>

// Get contact detail (index + detail merged)
getContact(id: string): Promise<ContactWithDetail>

// Create new contact
createContact(data: ContactFormData): Promise<{ contactId: string; emailCount: number; udKeyCount: number }>

// Full update (PUT)
updateContact(id: string, data: ContactFormData): Promise<{ contactId: string }>

// Partial update (PATCH)
patchContact(id: string, data: Partial<ContactFormData>): Promise<{ contactId: string }>

// Delete
deleteContact(id: string): Promise<{ contactId: string; deletedEmails: number; cleanedUdKeys: number }>
```

- **Chi tiết lookup.api.ts:**
```typescript
getContactByEmail(email: string): Promise<ContactByEmailResult>
getContactsByUdKey(key: string): Promise<{ data: ContactIndex[]; meta: { key: string; count: number } }>
getUdKeys(): Promise<{ data: UdKeyEntry[]; meta: { total: number } }>
```

- **Chi tiết bulk.api.ts:**
```typescript
importContacts(contacts: ContactFormData[], sourceFile?: string): Promise<{ jobId: string; statusUrl: string; total: number }>
getImportJobStatus(jobId: string): Promise<ImportJobStatus>
exportContacts(params: { format?: 'json'|'vcf'; limit?: number; category?: string }): Promise<Blob>
```

- **Chi tiết meta.api.ts:**
```typescript
getStats(): Promise<StatsData>
// StatsData: { totalContacts, totalEmails?, totalWithUserDefined?, lastImportAt, lastImportCount }
```

---

## Nhóm II — State Management & Hooks
> Phụ thuộc TASK-FE-03, FE-04. Các task trong nhóm này độc lập nhau.

---

### TASK-FE-05 · Zustand Stores
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-03
- **Song song với:** TASK-FE-06, TASK-FE-07
- **Estimated:** 1h
- **Output files:**
  - `src-frontend/src/store/auth.store.ts`
  - `src-frontend/src/store/ui.store.ts`
  - `src-frontend/src/store/filter.store.ts`

- **Mục tiêu hoàn thành:**
  - [ ] `auth.store.ts`: persist apiKey to localStorage, expose `isAuthenticated` computed
  - [ ] `ui.store.ts`: sidebarOpen, viewMode, selectedContactId, activePanel ('list'|'detail')
  - [ ] `filter.store.ts`: all filter fields, `setFilter`, `resetFilters`, `hasActiveFilters`
  - [ ] Không có circular dependencies giữa các stores

- **Chi tiết auth.store.ts:**
```typescript
interface AuthStore {
  apiKey: string | null;
  isAuthenticated: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}
// persist middleware: localStorage key = 'o-contact-api-key'
```

- **Chi tiết filter.store.ts:**
```typescript
interface FilterStore {
  search: string; category: string | null; domain: string | null;
  email: string | null; udKey: string | null; hasUD: boolean | null;
  sort: 'updatedAt' | 'createdAt' | 'displayName'; order: 'asc' | 'desc';
  setSearch: (q: string) => void;
  setCategory: (c: string | null) => void;
  setFilter: (key: keyof FilterFields, value: any) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  toApiParams: () => ContactsApiParams; // derived
}
```

---

### TASK-FE-06 · TanStack Query Hooks
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-04, TASK-FE-05
- **Song song với:** TASK-FE-07
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/hooks/useContacts.ts`
  - `src-frontend/src/hooks/useContact.ts`
  - `src-frontend/src/hooks/useContactMutations.ts`
  - `src-frontend/src/hooks/useInfiniteContacts.ts`
  - `src-frontend/src/hooks/useBulkImport.ts`
  - `src-frontend/src/hooks/useStats.ts`
  - `src-frontend/src/hooks/useUdKeys.ts`
  - `src-frontend/src/hooks/useDebounce.ts`

- **Mục tiêu hoàn thành:**
  - [ ] `useContacts`: useQuery với filter params, stale 30s
  - [ ] `useInfiniteContacts`: useInfiniteQuery + cursor pagination, fetch next page on scroll
  - [ ] `useContact(id)`: fetch index+detail, enabled khi id truthy
  - [ ] `useContactMutations`: create/update/patch/delete với optimistic updates + cache invalidation
  - [ ] `useBulkImport`: post import → poll job status mỗi 2s đến khi completed/failed
  - [ ] `useStats`: stale 5 phút
  - [ ] `useUdKeys`: stale 2 phút
  - [ ] `useDebounce(value, 300)`: debounce search input

- **Chi tiết useContactMutations:**
```typescript
// createContact: onSuccess → invalidate contacts list, show toast
// updateContact: onSuccess → invalidate detail + list
// deleteContact: onSuccess → optimistically remove from list, navigate to /
// onError: show error toast với message từ server
```

- **Chi tiết useInfiniteContacts:**
```typescript
// getNextPageParam: ({ meta }) => meta.hasMore ? meta.nextCursor : undefined
// select: flatten pages → ContactIndex[] for rendering
// fetchNextPage được gọi khi scroll đến cuối list
```

---

### TASK-FE-07 · Utility Functions
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-03
- **Song song với:** TASK-FE-05, TASK-FE-06
- **Estimated:** 1h
- **Output files:**
  - `src-frontend/src/utils/format.ts`
  - `src-frontend/src/utils/avatar.ts`
  - `src-frontend/src/utils/groupContacts.ts`
  - `src-frontend/src/utils/validators.ts`

- **Mục tiêu hoàn thành:**
  - [ ] `format.ts`: `formatDisplayName`, `formatPhone`, `formatDate`, `formatRelativeTime`, `truncate`
  - [ ] `avatar.ts`: `getInitials(name)` → max 2 chars; `getAvatarColor(name)` → deterministic color từ 8 preset colors
  - [ ] `groupContacts.ts`: `groupByAlphabet(contacts)` → `{ letter: string; contacts: ContactIndex[] }[]`, '#' cho số/ký tự đặc biệt
  - [ ] `validators.ts`: `isValidEmail`, `isValidPhone`, Zod schemas cho ContactFormData

- **Chi tiết groupContacts:**
```typescript
// Sort contacts by displayName (ignore diacritics, case-insensitive)
// Group vào letters A-Z + '#' cho non-alpha
// Output: Array<{ letter: string; contacts: ContactIndex[] }>
// Dùng Intl.Collator cho Vietnamese sorting
```

---

## Nhóm III — UI Components (Base)
> Phụ thuộc TASK-FE-01, FE-02. Các components độc lập nhau hoàn toàn.

---

### TASK-FE-08 · Base UI Primitives
- **Trạng thái:** `[~] THỰC HIỆN MỘT PHẦN`
- **Phụ thuộc:** TASK-FE-01, TASK-FE-02
- **Song song với:** TASK-FE-09, TASK-FE-10
- **Estimated:** 3h
- **Output files:**
  - `src-frontend/src/components/ui/Button.tsx`
  - `src-frontend/src/components/ui/Input.tsx`
  - `src-frontend/src/components/ui/Badge.tsx`
  - `src-frontend/src/components/ui/Avatar.tsx`
  - `src-frontend/src/components/ui/Modal.tsx`
  - `src-frontend/src/components/ui/Drawer.tsx`
  - `src-frontend/src/components/ui/Dropdown.tsx`
  - `src-frontend/src/components/ui/Spinner.tsx`
  - `src-frontend/src/components/ui/EmptyState.tsx`
  - `src-frontend/src/components/ui/ErrorBoundary.tsx`
  - `src-frontend/src/components/ui/ConfirmDialog.tsx`
  - `src-frontend/src/components/ui/index.ts` (re-exports)

- **Mục tiêu hoàn thành:**
  - [ ] Mỗi component có Props interface đầy đủ với JSDoc
  - [ ] Support `className` prop cho override
  - [ ] `Button`: variants (primary/secondary/ghost/danger), sizes (sm/md/lg), loading state, icon support
  - [ ] `Input`: label, error message, prefix/suffix icon, clearable
  - [ ] `Badge`: variants (category colors), sizes
  - [ ] `Avatar`: photo URL fallback → initials, size variants
  - [ ] `Modal`: portal render, backdrop click close, focus trap, animation
  - [ ] `Drawer`: slide from bottom (mobile) or right (desktop), overlay
  - [ ] `Dropdown`: trigger + menu items, keyboard navigation
  - [ ] `Spinner`: sizes, overlay variant
  - [ ] `EmptyState`: icon + title + description + optional CTA
  - [ ] `ErrorBoundary`: catch render errors, show fallback UI
  - [ ] `ConfirmDialog`: title + message + confirm/cancel buttons

---

### TASK-FE-09 · Layout Components
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-08
- **Song song với:** TASK-FE-10, TASK-FE-11
- **Estimated:** 3h
- **Output files:**
  - `src-frontend/src/components/layout/AppShell.tsx`
  - `src-frontend/src/components/layout/Sidebar.tsx`
  - `src-frontend/src/components/layout/TopBar.tsx`
  - `src-frontend/src/components/layout/BottomNav.tsx`
  - `src-frontend/src/components/layout/FloatingActionButton.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `AppShell`: responsive grid layout, mobile=1col, tablet=2col, desktop=3col
  - [ ] `Sidebar`: app name/logo, nav items (All Contacts, Categories list, UD Keys, Stats, Settings), collapse on mobile
  - [ ] `TopBar`: back button (mobile), search bar, sort button, more menu
  - [ ] `BottomNav`: mobile only, icons + labels: Contacts / Search / New / More
  - [ ] `FloatingActionButton`: + button (mobile), opens new contact form
  - [ ] Sidebar nav item active state từ current route

- **Chi tiết Sidebar nav items:**
```
📇 All Contacts     → /
🏷️ Categories       → expandable sub-items từ API
🔑 UD Keys          → /ud-keys
📊 Stats            → /stats
⚙️ Settings         → /settings
```

---

## Nhóm IV — Feature Components
> Phụ thuộc Nhóm III + Nhóm II

---

### TASK-FE-10 · Contact List & Avatar Components
- **Trạng thái:** `[~] THỰC HIỆN MỘT PHẦN`
- **Phụ thuộc:** TASK-FE-06, TASK-FE-07, TASK-FE-08
- **Song song với:** TASK-FE-11, TASK-FE-12
- **Estimated:** 3h
- **Output files:**
  - `src-frontend/src/components/contact/ContactAvatar.tsx`
  - `src-frontend/src/components/contact/ContactListItem.tsx`
  - `src-frontend/src/components/contact/ContactList.tsx`
  - `src-frontend/src/components/contact/ContactActions.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `ContactAvatar`: photo URL → `<img>`, fallback → colored circle với initials; sizes: sm(32px)/md(40px)/lg(56px)/xl(80px)/xxl(120px)
  - [ ] `ContactListItem`: Avatar + displayName + primaryEmail/phone + organization + category badges; selected highlight; swipe actions (mobile)
  - [ ] `ContactList`: nhận `ContactIndex[]`, group by alphabet, sticky letter headers; **TanStack Virtual** cho 30K items; infinite scroll trigger khi scroll đến cuối; loading skeleton; empty state
  - [ ] `ContactActions`: floating action menu (Edit / Call / Email / Delete); ConfirmDialog cho delete

- **Chi tiết ContactList virtualizer:**
```typescript
// useVirtualizer từ @tanstack/react-virtual
// estimateSize: 72px per item
// overscan: 5
// Letter header: 32px, không virtualized (sticky)
// Load more khi item cuối visible
```

---

### TASK-FE-11 · Contact Detail & Form Components
- **Trạng thái:** `[~] THỰC HIỆN MỘT PHẦN`
- **Phụ thuộc:** TASK-FE-06, TASK-FE-08
- **Song song với:** TASK-FE-10, TASK-FE-12
- **Estimated:** 4h
- **Output files:**
  - `src-frontend/src/components/contact/ContactCard.tsx`
  - `src-frontend/src/components/contact/ContactDetail.tsx`
  - `src-frontend/src/components/contact/ContactForm.tsx`
  - `src-frontend/src/components/contact/ContactFormFields.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `ContactCard`: mini card view cho grid layout (avatar + name + email)
  - [ ] `ContactDetail`:
    - Header: large avatar + name + org
    - Action buttons: Edit / Delete / Share (copy vCard)
    - Section: Emails (type badge + value + copy/mailto link)
    - Section: Phones (type badge + value + copy/tel link)
    - Section: Categories (chips)
    - Section: UserDefined keys (key-value pairs, values masked by default, toggle show)
    - Section: Metadata (created, updated, source file)
    - Loading skeleton
  - [ ] `ContactForm`: React Hook Form + Zod validation
    - displayName (required)
    - organization
    - Dynamic email array (add/remove, type select: WORK/HOME/OTHER)
    - Dynamic phone array (add/remove, type select: MOBILE/WORK/HOME)
    - Categories multi-select (từ danh sách hiện có + tạo mới)
    - UserDefined key-value pairs (add/remove)
    - Submit loading state
  - [ ] `ContactFormFields`: reusable dynamic field array component

- **Chi tiết ContactForm validation (Zod):**
```typescript
const contactSchema = z.object({
  contact: z.object({
    displayName: z.string().min(1, 'Tên không được trống'),
    organization: z.string().optional(),
    emails: z.array(z.object({
      value: z.string().email('Email không hợp lệ'),
      type: z.array(z.string()),
    })).optional(),
    phones: z.array(z.object({
      value: z.string().min(1),
      type: z.array(z.string()),
    })).optional(),
    categories: z.array(z.string()).default([]),
  }),
  userDefined: z.record(z.string()).default({}),
})
```

---

### TASK-FE-12 · Search & Filter Components
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-05, TASK-FE-08
- **Song song với:** TASK-FE-10, TASK-FE-11
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/components/search/SearchBar.tsx`
  - `src-frontend/src/components/search/FilterChips.tsx`
  - `src-frontend/src/components/search/FilterDrawer.tsx`
  - `src-frontend/src/components/search/SearchResults.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `SearchBar`: input với debounce 300ms → update filter.store.search; clear button; focus shortcut (Ctrl+K); placeholder "Tìm theo tên, email, tổ chức..."
  - [ ] `FilterChips`: hiển thị active filters dưới search bar; mỗi chip có × button; "Clear all" khi có ≥2 filters
  - [ ] `FilterDrawer`: bottom drawer (mobile) / right panel (desktop); filter controls: Category select, Domain input, Email input, UD Key select, Has UD toggle, Sort + Order; Apply / Reset buttons
  - [ ] `SearchResults`: hiện thị kết quả tìm kiếm với highlight cho phần match (ít nhất bold tên/email match)

---

### TASK-FE-13 · Bulk Import/Export Components
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-06, TASK-FE-08
- **Song song với:** TASK-FE-12
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/components/bulk/ImportButton.tsx`
  - `src-frontend/src/components/bulk/ImportProgress.tsx`
  - `src-frontend/src/components/bulk/ExportButton.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `ImportButton`: file picker (accept .vcf, .json); parse + call API; trigger import job; khi click hiện modal confirm "Import X contacts?"
  - [ ] `ImportProgress`: polling job status → progress bar (done/total); status text; "Done" / "Error" final state; dismiss button
  - [ ] `ExportButton`: dropdown → "Export JSON" / "Export VCF" / "Export VCF (filtered)"; trigger download với `URL.createObjectURL`

---

## Nhóm V — Pages (Routes)
> Phụ thuộc Nhóm IV. Các pages độc lập nhau.

---

### TASK-FE-14 · ContactsPage & ContactDetailPage
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-09, TASK-FE-10, TASK-FE-11, TASK-FE-12
- **Song song với:** TASK-FE-15, TASK-FE-16
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/pages/ContactsPage.tsx`
  - `src-frontend/src/pages/ContactDetailPage.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `ContactsPage` (route: `/`):
    - TopBar với SearchBar + filter button + import/export buttons
    - FilterChips nếu có active filters
    - ContactList với infinite scroll
    - Detail panel bên phải (desktop) hoặc navigate sang `/contacts/:id` (mobile)
    - FloatingActionButton → `/contacts/new`
  - [ ] `ContactDetailPage` (route: `/contacts/:id`):
    - Back button (mobile)
    - ContactDetail component
    - Edit button → `/contacts/:id/edit`
    - Loading + 404 states

---

### TASK-FE-15 · NewContactPage & EditContactPage
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-09, TASK-FE-11
- **Song song với:** TASK-FE-14, TASK-FE-16
- **Estimated:** 1.5h
- **Output files:**
  - `src-frontend/src/pages/NewContactPage.tsx`
  - `src-frontend/src/pages/EditContactPage.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `NewContactPage` (route: `/contacts/new`):
    - Header "Tạo liên hệ mới" + Cancel/Save buttons
    - ContactForm với empty default values
    - onSubmit → createContact mutation → navigate to `/contacts/:newId`
    - Unsaved changes warning khi navigate away
  - [ ] `EditContactPage` (route: `/contacts/:id/edit`):
    - Load contact data → populate form
    - Header "Chỉnh sửa" + Cancel/Save buttons
    - onSubmit → updateContact mutation → navigate to `/contacts/:id`
    - Loading skeleton khi fetch data

---

### TASK-FE-16 · CategoryPage, UdKeysPage, SearchPage
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-09, TASK-FE-10
- **Song song với:** TASK-FE-14, TASK-FE-15
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/pages/CategoryPage.tsx`
  - `src-frontend/src/pages/UdKeysPage.tsx`
  - `src-frontend/src/pages/SearchPage.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `CategoryPage` (route: `/category/:name`):
    - Header "Category: {name}"
    - ContactList filtered by category (set filter.store.category = name)
    - Contact count badge
  - [ ] `UdKeysPage` (route: `/ud-keys`):
    - List tất cả UD keys (từ `useUdKeys`)
    - Mỗi key: icon 🔑 + key name + count badge
    - Click vào key → ContactsPage với udKey filter
    - Search/filter trong list
  - [ ] `SearchPage` (route: `/search`):
    - SearchBar luôn focused
    - Real-time results khi gõ ≥2 ký tự
    - Phân loại kết quả: By Name / By Email / By UD Key
    - Recent searches (localStorage)

---

### TASK-FE-17 · SettingsPage & StatsPage
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-09
- **Song song với:** TASK-FE-14, TASK-FE-15, TASK-FE-16
- **Estimated:** 1.5h
- **Output files:**
  - `src-frontend/src/pages/SettingsPage.tsx`
  - `src-frontend/src/pages/StatsPage.tsx`

- **Mục tiêu hoàn thành:**
  - [ ] `SettingsPage` (route: `/settings`):
    - API Key input (masked by default, toggle show)
    - Test connection button → GET /health check
    - Save button → setApiKey in store
    - API Base URL override
    - App version info
    - Clear cache button
  - [ ] `StatsPage` (route: `/stats`):
    - Stats cards: Total Contacts / Total Emails / With UD Fields
    - Last import info (date + count + file)
    - Categories breakdown (list với count)
    - Import/Export buttons

---

## Nhóm VI — PWA & App Entry
> Phụ thuộc tất cả nhóm trên

---

### TASK-FE-18 · PWA Config, App Router & Final Integration
- **Trạng thái:** `[x] HOÀN THÀNH`
- **Phụ thuộc:** TASK-FE-14, TASK-FE-15, TASK-FE-16, TASK-FE-17
- **Song song với:** Không
- **Estimated:** 2h
- **Output files:**
  - `src-frontend/src/App.tsx` (cập nhật với router)
  - `src-frontend/src/main.tsx` (providers setup)
  - `src-frontend/public/manifest.json`
  - `src-frontend/public/icons/icon-192.png`
  - `src-frontend/public/icons/icon-512.png`
  - `src-frontend/vite.config.ts` (cập nhật với PWA plugin)
  - `src-frontend/README.md`

- **Mục tiêu hoàn thành:**
  - [ ] `main.tsx`: wrap với QueryClientProvider + BrowserRouter + Toaster
  - [ ] `App.tsx`: route definitions, ProtectedRoute (redirect /settings nếu chưa có apiKey), NotFoundPage
  - [ ] `manifest.json`: name, short_name, theme_color (#1a73e8), display standalone, icons
  - [ ] PWA plugin: generateSW strategy, cache: network-first cho API, cache-first cho static assets
  - [ ] Lighthouse PWA score ≥ 90
  - [ ] `README.md`: setup, dev, build, env vars

- **Chi tiết Routes:**
```
/                     → ContactsPage
/contacts/new         → NewContactPage
/contacts/:id         → ContactDetailPage
/contacts/:id/edit    → EditContactPage
/search               → SearchPage
/category/:name       → CategoryPage
/ud-keys              → UdKeysPage
/stats                → StatsPage
/settings             → SettingsPage
*                     → NotFoundPage
```

- **Chi tiết providers trong main.tsx:**
```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <App />
    <Toaster position="bottom-center" />
  </BrowserRouter>
</QueryClientProvider>
```

---

## Dependency Graph

```
TASK-FE-01 (Vite setup)
    │
    ├──► TASK-FE-02 (Tailwind)
    │        │
    │        └──► TASK-FE-08 (UI Primitives)
    │                  │
    │         ┌────────┼────────┐
    │         ▼        ▼        ▼
    │      FE-09    FE-10    FE-11
    │    (Layout)(Contact List)(Form)
    │
    └──► TASK-FE-03 (Types/API foundation)
             │
             ├──► TASK-FE-04 (API functions)
             │         │
             │    ┌────┴────┐
             │    ▼         ▼
             │  FE-05    FE-06    FE-07
             │ (Stores)(Hooks)(Utils)
             │
             └──► FE-12 (Search)
                  FE-13 (Bulk)

[FE-08 + FE-09 + FE-10 + FE-11 + FE-12 + FE-13]
             │
    ┌────────┼────────┬──────────┐
    ▼        ▼        ▼          ▼
  FE-14   FE-15   FE-16       FE-17
(Contact (New/Edit)(Category/ (Settings/
 Page)   Pages)  UD/Search)   Stats)
             │
             ▼
          FE-18
     (PWA + Integration)
```

---

## Nhóm song song có thể chạy cùng lúc

| Đợt | Tasks song song |
|-----|----------------|
| 1   | FE-01 |
| 2   | FE-02, FE-03 |
| 3   | FE-04, FE-05, FE-07, FE-08 |
| 4   | FE-06, FE-09, FE-10, FE-11, FE-12, FE-13 |
| 5   | FE-14, FE-15, FE-16, FE-17 |
| 6   | FE-18 |

---

## Tiêu chí "HOÀN THÀNH" chung

1. ✅ TypeScript: `tsc --noEmit` không có lỗi
2. ✅ `npm run build` thành công
3. ✅ Không có `any` type (trừ trường hợp explicitly justified)
4. ✅ Mọi component có Props interface + JSDoc
5. ✅ Responsive: test ở 375px, 768px, 1280px
6. ✅ API calls đúng endpoint theo backend spec
7. ✅ Loading + Error + Empty states được handle
