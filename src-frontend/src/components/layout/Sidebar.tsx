// Path: src-frontend/src/components/layout/Sidebar.tsx

import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { ROUTES } from '@/constants/routes'
import { useCategories } from '@/hooks/useCategories'
import { useUIStore } from '@/store/ui.store'
import { useFilterStore } from '@/store/filter.store'
import { useStats } from '@/hooks/useStats'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  count?: number
  onClick?: () => void
}

function NavItem({ to, icon, label, count, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-md font-medium transition-colors duration-150',
          isActive
            ? 'bg-primary-50 text-primary'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        )
      }
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-label bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {count > 999 ? '999+' : count}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const setCategory = useFilterStore((s) => s.setCategory)
  const resetFilters = useFilterStore((s) => s.resetFilters)
  const { data: stats } = useStats()
  const { data: categories } = useCategories()

  if (!sidebarOpen) return null

  return (
    <aside className="flex flex-col h-full bg-white border-r border-divider w-64 shrink-0">
      {/* App Brand */}
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
        <span className="text-title-md text-on-surface font-semibold">O Contacts</span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors lg:hidden"
          aria-label="Đóng sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <NavItem
          to={ROUTES.home}
          onClick={resetFilters}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
            </svg>
          }
          label="Tất cả liên hệ"
          count={stats?.totalContacts}
        />

        {/* Categories */}
        <div className="pt-3 pb-1">
          <p className="text-label text-on-surface-variant/70 px-3 mb-1 uppercase tracking-wider">Nhóm</p>
        </div>
        {(categories ?? []).map((cat) => (
          <NavItem
            key={cat.name}
            to={ROUTES.category(cat.name)}
            onClick={() => setCategory(cat.name)}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round"/>
                <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" strokeWidth="2.5"/>
              </svg>
            }
            label={cat.label}
            count={cat.count}
          />
        ))}

        <div className="pt-3 pb-1">
          <p className="text-label text-on-surface-variant/70 px-3 mb-1 uppercase tracking-wider">Khác</p>
        </div>
        <NavItem
          to={ROUTES.udKeys}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" strokeLinecap="round"/>
            </svg>
          }
          label="UserDefined Keys"
        />
        <NavItem
          to={ROUTES.stats}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round"/>
            </svg>
          }
          label="Thống kê"
        />
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-4 pt-2 border-t border-divider">
        <NavItem
          to={ROUTES.settings}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round"/>
            </svg>
          }
          label="Cài đặt"
        />
      </div>
    </aside>
  )
}
