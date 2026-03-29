// Path: src-frontend/src/pages/ContactsPage.tsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { FloatingActionButton } from '@/components/layout/FloatingActionButton'
import { ContactCard } from '@/components/contact/ContactCard'
import { ContactList } from '@/components/contact/ContactList'
import { ContactDetail } from '@/components/contact/ContactDetail'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterChips } from '@/components/search/FilterChips'
import { FilterDrawer } from '@/components/search/FilterDrawer'
import { ImportButton } from '@/components/bulk/ImportButton'
import { ImportProgress } from '@/components/bulk/ImportProgress'
import { ExportButton } from '@/components/bulk/ExportButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useInfiniteContacts } from '@/hooks/useContacts'
import { useContact } from '@/hooks/useContact'
import { useFilterStore } from '@/store/filter.store'
import { useUIStore } from '@/store/ui.store'
import { ROUTES } from '@/constants/routes'
import type { ContactIndex } from '@/types/contact.types'

export function ContactsPage() {
  const navigate = useNavigate()
  const [filterOpen, setFilterOpen] = useState(false)
  const [importJobId, setImportJobId] = useState<string | null>(null)

  const filters = useFilterStore((s) => s.toApiParams())
  const viewMode = useUIStore((s) => s.viewMode)
  const selectedId = useUIStore((s) => s.selectedContactId)
  const setSelectedId = useUIStore((s) => s.setSelectedContactId)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteContacts(filters)

  const contacts = data?.contacts ?? []

  const { data: selectedContact, isLoading: isDetailLoading } = useContact(selectedId)

  const handleSelect = (contact: ContactIndex) => {
    setSelectedId(contact.id)
    if (window.matchMedia('(max-width: 1023px)').matches) {
      navigate(ROUTES.contactDetail(contact.id))
    }
  }

  const handleCloseDetail = () => {
    setSelectedId(null)
  }

  const topBarActions = (
    <div className="flex items-center gap-1 ml-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setFilterOpen(true)}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="16" y2="6" strokeLinecap="round" />
            <line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round" />
            <line x1="10" y1="18" x2="18" y2="18" strokeLinecap="round" />
          </svg>
        }
      />
      <ImportButton onJobStarted={(id) => setImportJobId(id)} />
      <ExportButton />
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate(ROUTES.contactNew)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        }
        className="hidden sm:flex"
      >
        Tạo mới
      </Button>
    </div>
  )

  return (
    <AppShell>
      {/* Left: list panel */}
      <div className={`flex flex-col flex-1 min-w-0 ${selectedContact ? 'hidden lg:flex' : 'flex'}`}>
        <TopBar
          actions={
            <div className="flex-1 flex items-center gap-2">
              <SearchBar className="flex-1" />
              {topBarActions}
            </div>
          }
        />

        <FilterChips />

        {importJobId && (
          <div className="px-4 pt-3">
            <ImportProgress jobId={importJobId} onDismiss={() => setImportJobId(null)} />
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-primary" />
              </div>
            ) : contacts.length === 0 ? (
              <EmptyState
                title="Không có liên hệ"
                description="Thêm liên hệ mới hoặc thay đổi bộ lọc để thấy dữ liệu."
              />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      isSelected={contact.id === selectedId}
                      onClick={() => handleSelect(contact)}
                    />
                  ))}
                </div>
                {hasNextPage && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => fetchNextPage()}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-body-md hover:bg-primary-600 transition-colors"
                    >
                      {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <ContactList
            contacts={contacts}
            selectedId={selectedId}
            onSelect={handleSelect}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage ?? false}
            fetchNextPage={fetchNextPage}
          />
        )}
      </div>

      {/* Right: detail panel (desktop) */}
      {selectedId && (
        <div className="flex flex-col w-full lg:w-[420px] xl:w-[480px] shrink-0 border-l border-divider">
          {selectedContact ? (
            <ContactDetail
              contact={selectedContact}
              isLoading={isDetailLoading}
              onClose={handleCloseDetail}
            />
          ) : (
            isDetailLoading && (
              <div className="flex items-center justify-center h-full text-on-surface-variant">
                Đang tải...
              </div>
            )
          )}
        </div>
      )}

      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} />
      <FloatingActionButton />
    </AppShell>
  )
}
