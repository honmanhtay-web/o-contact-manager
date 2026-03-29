// Path: src-frontend/src/pages/StatsPage.tsx

import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Spinner } from '@/components/ui/Spinner'
import { ImportButton } from '@/components/bulk/ImportButton'
import { ExportButton } from '@/components/bulk/ExportButton'
import { ImportProgress } from '@/components/bulk/ImportProgress'
import { useCategories } from '@/hooks/useCategories'
import { useStats } from '@/hooks/useStats'
import { formatDate } from '@/utils/format'
import { ROUTES } from '@/constants/routes'
import { useState } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: string
}

function StatCard({ label, value, icon, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-4">
      <div className={`${color} bg-current/10 rounded-xl p-3 shrink-0`}>
        <div className={color}>{icon}</div>
      </div>
      <div>
        <p className="text-display font-semibold text-on-surface leading-none">{value}</p>
        <p className="text-body-sm text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  )
}

export function StatsPage() {
  const { data: stats, isLoading, refetch } = useStats()
  const { data: categories, isLoading: isCategoriesLoading } = useCategories()
  const navigate = useNavigate()
  const [importJobId, setImportJobId] = useState<string | null>(null)
  const categoryItems = categories ?? []

  return (
    <AppShell>
      <TopBar
        title="Thống kê"
        actions={
          <div className="flex items-center gap-2 ml-auto">
            <ImportButton onJobStarted={(id) => { setImportJobId(id); setTimeout(() => refetch(), 5000) }} />
            <ExportButton />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">

        {importJobId && (
          <ImportProgress jobId={importJobId} onDismiss={() => { setImportJobId(null); refetch() }} />
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard
                label="Tổng liên hệ"
                value={stats?.totalContacts ?? 0}
                color="text-primary"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
                  </svg>
                }
              />
              <StatCard
                label="Tổng email"
                value={stats?.totalEmails ?? 0}
                color="text-warning"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" />
                    <polyline points="22 6 12 13 2 6" />
                  </svg>
                }
              />
              <StatCard
                label="Có trường tùy chỉnh"
                value={stats?.totalWithUserDefined ?? 0}
                color="text-success"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" strokeLinecap="round" />
                  </svg>
                }
              />
              <StatCard
                label="Import gần nhất"
                value={stats?.lastImportCount ?? 0}
                color="text-info"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                  </svg>
                }
              />
            </div>

            {/* Last import info */}
            {stats?.lastImportAt && (
              <div className="bg-white rounded-2xl shadow-card p-4">
                <h3 className="text-title-sm text-on-surface font-medium mb-2">Import gần nhất</h3>
                <div className="space-y-1 text-body-sm text-on-surface-variant">
                  <p>📅 Ngày: <span className="text-on-surface">{formatDate(stats.lastImportAt)}</span></p>
                  {stats.lastImportFile && (
                    <p>📄 File: <span className="font-mono text-on-surface">{stats.lastImportFile}</span></p>
                  )}
                  <p>✅ Đã import: <span className="text-on-surface">{stats.lastImportCount} contacts</span></p>
                </div>
              </div>
            )}

            {/* Category breakdown */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <h3 className="text-title-sm text-on-surface font-medium mb-3">Nhóm liên hệ</h3>
              <div className="space-y-1">
                {categoryItems.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => navigate(ROUTES.category(cat.name))}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container transition-colors text-left"
                  >
                    <span className="text-primary shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" />
                        <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" strokeWidth="2.5" />
                      </svg>
                    </span>
                    <span className="flex-1 text-body-md text-on-surface">{cat.label}</span>
                    <span className="shrink-0 text-label bg-primary-50 text-primary rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
                      {cat.count}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-on-surface-variant">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                    </svg>
                  </button>
                ))}
                {!isCategoriesLoading && categoryItems.length === 0 && (
                  <p className="px-3 py-2 text-body-sm text-on-surface-variant">
                    Chưa có nhóm liên hệ nào.
                  </p>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </AppShell>
  )
}
