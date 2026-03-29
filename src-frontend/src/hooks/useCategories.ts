import { useQuery } from '@tanstack/react-query'
import { getContacts } from '@/api/contacts.api'
import { queryKeys } from '@/constants/queryKeys'
import { STALE_TIME } from '@/constants/config'
import type { CategorySummary } from '@/types/contact.types'
import { getCategoryLabel, sortCategorySummary } from '@/utils/categories'

async function getCategoryBreakdown(): Promise<CategorySummary[]> {
  const counts = new Map<string, number>()
  let cursor: string | undefined

  do {
    const page = await getContacts({ limit: 200, cursor })

    for (const contact of page.data) {
      for (const category of contact.categories) {
        counts.set(category, (counts.get(category) ?? 0) + 1)
      }
    }

    cursor = page.meta.hasMore ? page.meta.nextCursor ?? undefined : undefined
  } while (cursor)

  return sortCategorySummary(
    [...counts.entries()].map(([name, count]) => ({
      name,
      label: getCategoryLabel(name),
      count,
    }))
  )
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategoryBreakdown,
    staleTime: STALE_TIME.STATS,
  })
}
