// Path: src-frontend/src/components/search/FilterDrawer.tsx

import { useEffect, useState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCategories } from '@/hooks/useCategories'
import { useFilterStore } from '@/store/filter.store'
import { useUdKeys } from '@/hooks/useStats'

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
}

export function FilterDrawer({ open, onClose }: FilterDrawerProps) {
  const store = useFilterStore()
  const { data: udKeysData } = useUdKeys()
  const { data: categories } = useCategories()

  // Local draft state — apply on confirm
  const [draft, setDraft] = useState({
    category: store.category ?? '',
    domain: store.domain ?? '',
    email: store.email ?? '',
    udKey: store.udKey ?? '',
    hasUD: store.hasUD,
    sort: store.sort,
    order: store.order,
  })

  useEffect(() => {
    if (!open) return

    setDraft({
      category: store.category ?? '',
      domain: store.domain ?? '',
      email: store.email ?? '',
      udKey: store.udKey ?? '',
      hasUD: store.hasUD,
      sort: store.sort,
      order: store.order,
    })
  }, [open, store.category, store.domain, store.email, store.udKey, store.hasUD, store.sort, store.order])

  const handleApply = () => {
    store.setCategory(draft.category || null)
    store.setDomain(draft.domain || null)
    store.setEmail(draft.email || null)
    store.setUdKey(draft.udKey || null)
    store.setHasUD(draft.hasUD)
    store.setSort(draft.sort, draft.order)
    onClose()
  }

  const handleReset = () => {
    setDraft({ category: '', domain: '', email: '', udKey: '', hasUD: null, sort: 'updatedAt', order: 'desc' })
    store.resetFilters()
    onClose()
  }

  const udKeys = udKeysData?.data ?? []

  return (
    <Drawer open={open} onClose={onClose} title="Bộ lọc" side="bottom">
      <div className="flex flex-col gap-4 p-5 pb-safe-bottom">
        {/* Category */}
        <div>
          <label className="text-label text-on-surface font-medium block mb-1">Nhóm</label>
          <input
            list="category-list"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            placeholder="Nhập tên nhóm..."
            className="w-full h-9 rounded-lg border border-divider bg-white px-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <datalist id="category-list">
            {(categories ?? []).map((category) => (
              <option key={category.name} value={category.name} />
            ))}
          </datalist>
        </div>

        {/* Domain */}
        <Input
          label="Email domain"
          placeholder="gmail.com"
          value={draft.domain}
          onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))}
          clearable
          onClear={() => setDraft((d) => ({ ...d, domain: '' }))}
        />

        {/* Email */}
        <Input
          label="Email cụ thể"
          placeholder="user@example.com"
          type="email"
          value={draft.email}
          onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          clearable
          onClear={() => setDraft((d) => ({ ...d, email: '' }))}
        />

        {/* UD Key */}
        <div>
          <label className="text-label text-on-surface font-medium block mb-1">
            UserDefined Key
          </label>
          <select
            value={draft.udKey}
            onChange={(e) => setDraft((d) => ({ ...d, udKey: e.target.value }))}
            className="w-full h-9 rounded-lg border border-divider bg-white px-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">-- Tất cả --</option>
            {udKeys.map((k) => (
              <option key={k.key} value={k.key}>
                {k.key} ({k.count})
              </option>
            ))}
          </select>
        </div>

        {/* Has UD toggle */}
        <div>
          <label className="text-label text-on-surface font-medium block mb-1">
            Trường tùy chỉnh
          </label>
          <div className="flex gap-2">
            {[
              { label: 'Tất cả', value: null },
              { label: 'Có', value: true },
              { label: 'Không', value: false },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => setDraft((d) => ({ ...d, hasUD: opt.value as boolean | null }))}
                className={`flex-1 py-2 rounded-lg text-body-sm font-medium border transition-colors ${
                  draft.hasUD === opt.value
                    ? 'bg-primary-50 text-primary border-primary'
                    : 'bg-white text-on-surface-variant border-divider hover:bg-surface-container'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-label text-on-surface font-medium block mb-1">Sắp xếp theo</label>
            <select
              value={draft.sort}
              onChange={(e) => setDraft((d) => ({ ...d, sort: e.target.value as typeof d.sort }))}
              className="w-full h-9 rounded-lg border border-divider bg-white px-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="updatedAt">Cập nhật</option>
              <option value="createdAt">Tạo</option>
              <option value="displayName">Tên</option>
            </select>
          </div>
          <div>
            <label className="text-label text-on-surface font-medium block mb-1">Thứ tự</label>
            <select
              value={draft.order}
              onChange={(e) => setDraft((d) => ({ ...d, order: e.target.value as 'asc' | 'desc' }))}
              className="w-full h-9 rounded-lg border border-divider bg-white px-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleReset} className="flex-1">
            Đặt lại
          </Button>
          <Button variant="primary" onClick={handleApply} className="flex-1">
            Áp dụng
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
