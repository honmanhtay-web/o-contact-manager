// Path: src-frontend/src/constants/config.ts

import packageJson from '../../package.json'

/**
 * Application configuration constants.
 * VITE_ prefixed env vars are exposed to client by Vite.
 */

/** Backend API base URL — override via VITE_API_BASE_URL in .env */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

/** App display name */
export const APP_NAME = import.meta.env.VITE_APP_TITLE ?? 'O Contacts'

/** App version */
export const APP_VERSION = packageJson.version ?? '1.0.0'

/** Default contacts per page */
export const DEFAULT_PAGE_SIZE = 50

/** Max contacts per page */
export const MAX_PAGE_SIZE = 200

/** Search debounce delay in ms */
export const SEARCH_DEBOUNCE_MS = 300

/** Import job poll interval in ms */
export const JOB_POLL_INTERVAL_MS = 2000

/** localStorage key for API key */
export const STORAGE_KEY_API = 'o-contact-api-key'

/** localStorage key for API base URL override */
export const STORAGE_KEY_API_BASE_URL = 'o-contact-api-base-url'

/** localStorage key for recent searches */
export const STORAGE_KEY_RECENT_SEARCHES = 'o-contact-recent-searches'

/** Max recent search items to store */
export const MAX_RECENT_SEARCHES = 10

/** TanStack Query stale times */
export const STALE_TIME = {
  CONTACTS_LIST: 30 * 1000,         // 30s
  CONTACT_DETAIL: 60 * 1000,        // 1m
  STATS: 5 * 60 * 1000,             // 5m
  UD_KEYS: 2 * 60 * 1000,           // 2m
  IMPORT_JOB: 0,                     // always fresh
} as const

/** Avatar accent colors — deterministic based on name hash */
export const AVATAR_COLORS = [
  '#4285f4', // blue
  '#ea4335', // red
  '#fbbc04', // yellow
  '#34a853', // green
  '#ff6d00', // orange
  '#46bdc6', // teal
  '#7b1fa2', // purple
  '#c62828', // crimson
] as const

/** Email type options for form select */
export const EMAIL_TYPES = [
  { label: 'Công việc', value: 'WORK' },
  { label: 'Cá nhân', value: 'HOME' },
  { label: 'Khác', value: 'OTHER' },
] as const

/** Phone type options for form select */
export const PHONE_TYPES = [
  { label: 'Di động', value: 'CELL' },
  { label: 'Công việc', value: 'WORK' },
  { label: 'Nhà', value: 'HOME' },
  { label: 'Fax', value: 'FAX' },
  { label: 'Khác', value: 'OTHER' },
] as const
