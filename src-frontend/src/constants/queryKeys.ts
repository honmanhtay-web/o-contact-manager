// Path: src-frontend/src/constants/queryKeys.ts

import type { ContactsFilterParams } from '@/types/pagination.types'

/**
 * Centralized query key factory for TanStack Query.
 * Using typed const arrays ensures cache invalidation is scoped correctly.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
 *   useQuery({ queryKey: queryKeys.contacts.detail(id) })
 */
export const queryKeys = {
  contacts: {
    /** Invalidate all contacts (list + detail) */
    all: ['contacts'] as const,

    /** Contacts list with specific filters */
    list: (filters: ContactsFilterParams) =>
      ['contacts', 'list', filters] as const,

    /** All list queries (for broader invalidation after mutations) */
    lists: () => ['contacts', 'list'] as const,

    /** Single contact detail (index + detail merged) */
    detail: (id: string) => ['contacts', 'detail', id] as const,

    /** All detail queries */
    details: () => ['contacts', 'detail'] as const,
  },

  /** Meta stats */
  stats: ['stats'] as const,

  /** Category breakdown */
  categories: ['categories'] as const,

  /** All userDefined keys */
  udKeys: ['udKeys'] as const,

  /** UD key lookup results */
  udKeyLookup: (key: string) => ['udKeyLookup', key] as const,

  /** Email lookup */
  emailLookup: (email: string) => ['emailLookup', email] as const,

  /** Import job status (polled) */
  importJob: (jobId: string) => ['importJob', jobId] as const,
} as const
