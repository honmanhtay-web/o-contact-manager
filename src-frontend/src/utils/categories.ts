import type { CategorySummary } from '@/types/contact.types'

const CATEGORY_LABELS: Record<string, string> = {
  myContacts: 'Liên hệ của tôi',
  friends: 'Bạn bè',
  family: 'Gia đình',
  work: 'Công việc',
  starred: 'Đã gắn sao',
}

export function getCategoryLabel(name: string): string {
  if (CATEGORY_LABELS[name]) return CATEGORY_LABELS[name]

  return name
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function sortCategorySummary(categories: CategorySummary[]): CategorySummary[] {
  return [...categories].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.label.localeCompare(b.label, 'vi', { sensitivity: 'base' })
  })
}
