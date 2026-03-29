// Path: src-frontend/src/components/search/SearchResults.tsx

import { clsx } from 'clsx'
import { ContactAvatar } from '@/components/contact/ContactAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import type { ContactIndex } from '@/types/contact.types'

interface SearchResultsProps {
  nameResults: ContactIndex[]
  emailResult?: ContactIndex | null
  udKeyResults: ContactIndex[]
  query: string
  isLoading?: boolean
  isEmailLoading?: boolean
  isUdKeyLoading?: boolean
  onSelect?: (contact: ContactIndex) => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-on-surface font-semibold rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function ResultsSection({
  title,
  contacts,
  query,
  onSelect,
}: {
  title: string
  contacts: ContactIndex[]
  query: string
  onSelect?: (contact: ContactIndex) => void
}) {
  if (contacts.length === 0) return null

  return (
    <section className="border-t border-divider first:border-t-0">
      <div className="px-4 py-2 bg-surface-variant/70">
        <p className="text-label text-on-surface-variant uppercase tracking-wider">
          {title} • {contacts.length}
        </p>
      </div>
      <div className="divide-y divide-divider">
        {contacts.map((contact) => (
          <button
            key={`${title}-${contact.id}`}
            onClick={() => onSelect?.(contact)}
            className={clsx(
              'flex w-full items-center gap-3 px-4 py-3 text-left',
              'hover:bg-surface-container transition-colors duration-100'
            )}
          >
            <ContactAvatar name={contact.displayName} photoUrl={contact.photoUrl} size="md" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-body-md font-medium text-on-surface truncate">
                {highlight(contact.displayName || 'Không tên', query)}
              </p>
              {contact.primaryEmail && (
                <p className="text-body-sm text-on-surface-variant truncate">
                  {highlight(contact.primaryEmail, query)}
                </p>
              )}
              {contact.organization && (
                <p className="text-body-sm text-on-surface-variant/70 truncate">
                  {highlight(contact.organization, query)}
                </p>
              )}
              {contact.userDefinedKeys.length > 0 && (
                <p className="text-body-sm text-on-surface-variant/70 truncate">
                  UD: {highlight(contact.userDefinedKeys.join(', '), query)}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export function SearchResults({
  nameResults,
  emailResult,
  udKeyResults,
  query,
  isLoading,
  isEmailLoading,
  isUdKeyLoading,
  onSelect,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" className="text-primary" />
      </div>
    )
  }

  if (!query || query.length < 2) {
    return (
      <EmptyState
        title="Nhập từ khóa để tìm kiếm"
        description="Tìm theo tên, email, hoặc tổ chức (tối thiểu 2 ký tự)"
        icon={
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        }
      />
    )
  }

  const emailResults = emailResult ? [emailResult] : []
  const hasResults = nameResults.length > 0 || emailResults.length > 0 || udKeyResults.length > 0

  if (!hasResults && !isEmailLoading && !isUdKeyLoading) {
    return (
      <EmptyState
        title="Không tìm thấy kết quả"
        description={`Không có liên hệ nào khớp với "${query}"`}
        icon={
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        }
      />
    )
  }

  return (
    <div className="divide-y divide-divider">
      <p className="px-4 py-2 text-body-sm text-on-surface-variant">
        Kết quả cho &ldquo;<strong className="text-on-surface">{query}</strong>&rdquo;
      </p>
      {isEmailLoading && (
        <div className="px-4 py-3 flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Spinner size="xs" className="text-primary" />
          Đang tra cứu email...
        </div>
      )}
      {isUdKeyLoading && (
        <div className="px-4 py-3 flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Spinner size="xs" className="text-primary" />
          Đang tra cứu UD key...
        </div>
      )}
      <ResultsSection title="Theo tên / tổ chức" contacts={nameResults} query={query} onSelect={onSelect} />
      <ResultsSection title="Theo email" contacts={emailResults} query={query} onSelect={onSelect} />
      <ResultsSection title="Theo UD key" contacts={udKeyResults} query={query} onSelect={onSelect} />
    </div>
  )
}
