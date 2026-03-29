// Path: src-frontend/src/components/contact/ContactList.tsx

import { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ContactListItem } from './ContactListItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { groupByAlphabet } from '@/utils/groupContacts'
import type { ContactIndex } from '@/types/contact.types'

interface ContactListProps {
  contacts: ContactIndex[]
  selectedId?: string | null
  onSelect?: (contact: ContactIndex) => void
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  fetchNextPage?: () => void
}

type RowItem =
  | { type: 'header'; letter: string }
  | { type: 'contact'; contact: ContactIndex }

function buildRows(contacts: ContactIndex[]): RowItem[] {
  const groups = groupByAlphabet(contacts)
  const rows: RowItem[] = []
  for (const group of groups) {
    rows.push({ type: 'header', letter: group.letter })
    for (const c of group.contacts) {
      rows.push({ type: 'contact', contact: c })
    }
  }
  return rows
}

export function ContactList({
  contacts,
  selectedId,
  onSelect,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
}: ContactListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rows = buildRows(contacts)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (rows[i]?.type === 'header' ? 32 : 72),
    overscan: 5,
  })
  const virtualItems = virtualizer.getVirtualItems()

  // Infinite scroll trigger
  useEffect(() => {
    if (!virtualItems.length) return
    const lastItem = virtualItems[virtualItems.length - 1]
    if (lastItem.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.()
    }
  }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-surface-container animate-skeleton shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-1/2 rounded bg-surface-container animate-skeleton" />
              <div className="h-3 w-1/3 rounded bg-surface-container animate-skeleton" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!contacts.length) {
    return (
      <EmptyState
        icon={
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
          </svg>
        }
        title="Không có liên hệ"
        description="Thêm liên hệ mới hoặc thay đổi bộ lọc"
      />
    )
  }

  return (
    <div ref={parentRef} className="overflow-y-auto flex-1">
      <div
        style={{ height: virtualizer.getTotalSize() }}
        className="relative"
      >
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.type === 'header' ? (
                <div className="sticky top-0 z-10 bg-surface-variant/80 backdrop-blur-sm px-4 py-1">
                  <span className="text-label font-semibold text-on-surface-variant uppercase tracking-wider">
                    {row.letter}
                  </span>
                </div>
              ) : (
                <ContactListItem
                  contact={row.contact}
                  isSelected={row.contact.id === selectedId}
                  onClick={() => onSelect?.(row.contact)}
                />
              )}
            </div>
          )
        })}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" className="text-primary" />
        </div>
      )}
    </div>
  )
}
