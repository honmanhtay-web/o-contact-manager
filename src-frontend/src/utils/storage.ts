// Path: src-frontend/src/utils/storage.ts

import {
  STORAGE_KEY_API,
  STORAGE_KEY_API_BASE_URL,
  STORAGE_KEY_RECENT_SEARCHES,
  MAX_RECENT_SEARCHES,
} from '@/constants/config'

/**
 * Get the stored API key from localStorage
 */
export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_API)
  } catch {
    return null
  }
}

/**
 * Save API key to localStorage
 */
export function setApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_API, key)
  } catch {
    // ignore storage errors
  }
}

/**
 * Clear API key from localStorage
 */
export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API)
  } catch {
    // ignore storage errors
  }
}

/**
 * Get the stored API base URL override
 */
export function getApiBaseUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_API_BASE_URL)
  } catch {
    return null
  }
}

/**
 * Save API base URL override
 */
export function setApiBaseUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_BASE_URL, url)
  } catch {
    // ignore storage errors
  }
}

/**
 * Clear stored API base URL override
 */
export function clearApiBaseUrl(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API_BASE_URL)
  } catch {
    // ignore storage errors
  }
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

/**
 * Add a search term to recent searches (dedup + max limit)
 */
export function addRecentSearch(term: string): void {
  if (!term.trim()) return
  try {
    const searches = getRecentSearches().filter(s => s !== term)
    searches.unshift(term)
    localStorage.setItem(
      STORAGE_KEY_RECENT_SEARCHES,
      JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES))
    )
  } catch {
    // ignore
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_RECENT_SEARCHES)
  } catch {
    // ignore
  }
}
