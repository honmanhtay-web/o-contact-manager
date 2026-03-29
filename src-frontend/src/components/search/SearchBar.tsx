// Path: src-frontend/src/components/search/SearchBar.tsx

import { useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { useFilterStore } from '@/store/filter.store'

interface SearchBarProps {
  autoFocus?: boolean
  className?: string
  placeholder?: string
}

export function SearchBar({
  autoFocus = false,
  className,
  placeholder = 'Tìm theo tên, email, tổ chức...',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const search = useFilterStore((s) => s.search)
  const setSearch = useFilterStore((s) => s.setSearch)

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [autoFocus])

  return (
    <div className={clsx('relative flex items-center', className)}>
      <span className="absolute left-3 text-on-surface-variant pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full h-10 pl-10 pr-10 rounded-full border bg-surface-container',
          'text-body-md text-on-surface placeholder:text-on-surface-variant/60',
          'border-transparent focus:border-primary focus:bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-300',
          'transition-colors duration-150'
        )}
      />
      {search && (
        <button
          onClick={() => setSearch('')}
          className="absolute right-3 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Xóa tìm kiếm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {!search && (
        <span className="absolute right-3 text-[10px] text-on-surface-variant/50 font-mono hidden sm:block select-none">
          Ctrl+K
        </span>
      )}
    </div>
  )
}
