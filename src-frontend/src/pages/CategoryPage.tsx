// Path: src-frontend/src/pages/CategoryPage.tsx

import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { ContactCard } from '@/components/contact/ContactCard'
import { ContactList } from '@/components/contact/ContactList'
import { ContactDetail } from '@/components/contact/ContactDetail'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ROUTES } from '@/constants/routes'
import { useCategories } from '@/hooks/useCategories'
import { useInfiniteContacts } from '@/hooks/useContacts'
import { useContact } from '@/hooks/useContact'
import { useFilterStore } from '@/store/filter.store'
import { useUIStore } from '@/store/ui.store'
import type { ContactIndex } from '@/types/contact.types'

export function CategoryPage() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const setCategory = useFilterStore((s) => s.setCategory)
  const resetFilters = useFilterStore((s) => s.resetFilters)
  const viewMode = useUIStore((s) => s.viewMode)
  const selectedId = useUIStore((s) => s.selectedContactId)
  const setSelectedId = useUIStore((s) => s.setSelectedContactId)
  const { data: categories } = useCategories()

  useEffect(() => {
    if (name) setCategory(decodeURIComponent(name))
    return () => resetFilters()
  }, [name, resetFilters, setCategory])

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteContacts({ category: name ? decodeURIComponent(name) : undefined })

  const contacts = data?.contacts ?? []
  const { data: selectedContact, isLoading: isDetailLoading } = useContact(selectedId)
  const categoryMeta = categories?.find((category) => category.name === name)
  const handleSelect = (contact: ContactIndex) => {
    setSelectedId(contact.id)
    if (window.matchMedia('(max-width: 1023px)').matches) {
      navigate(ROUTES.contactDetail(contact.id))
    }
  }

  return (
    <AppShell>
      <div className={`flex flex-col flex-1 min-w-0 ${selectedContact ? 'hidden lg:flex' : 'flex'}`}>
        <TopBar
          showBack
          title={`Nhóm: ${name ? decodeURIComponent(name) : ''}`}
          actions={
            <span className="ml-2 text-body-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {categoryMeta?.count ?? contacts.length}
            </span>
          }
        />
        {viewMode === 'grid' ? (
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-primary" />
              </div>
            ) : contacts.length === 0 ? (
              <EmptyState
                title="Không có liên hệ trong nhóm này"
                description="Hãy chọn nhóm khác hoặc tạo thêm liên hệ."
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

      {selectedId && selectedContact && (
        <div className="flex flex-col w-full lg:w-[420px] xl:w-[480px] shrink-0 border-l border-divider">
          <ContactDetail
            contact={selectedContact}
            isLoading={isDetailLoading}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </AppShell>
  )
}
