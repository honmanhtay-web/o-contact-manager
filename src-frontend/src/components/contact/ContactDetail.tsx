// Path: src-frontend/src/components/contact/ContactDetail.tsx

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { ContactAvatar } from './ContactAvatar'
import { ContactActions } from './ContactActions'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { formatDate, formatPhone } from '@/utils/format'
import { contactToVcf } from '@/utils/vcf'
import { ROUTES } from '@/constants/routes'
import type { ContactWithDetail } from '@/types/contact.types'

interface ContactDetailProps {
  contact: ContactWithDetail
  isLoading?: boolean
  onClose?: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
      title="Sao chép"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-divider last:border-0">
      <p className="text-label text-on-surface-variant mb-2 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  )
}

export function ContactDetail({ contact, isLoading = false, onClose }: ContactDetailProps) {
  const navigate = useNavigate()
  const [showUdValues, setShowUdValues] = useState<Record<string, boolean>>({})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  const detail = contact.detail
  const emails = detail?.contact?.emails ?? contact.allEmails.map(v => ({ value: v, type: ['INTERNET'] as string[] }))
  const phones = detail?.contact?.phones ?? (contact.primaryPhone ? [{ value: contact.primaryPhone, type: ['VOICE'] as string[] }] : [])
  const userDefined = detail?.userDefined ?? {}
  const categories = detail?.contact?.categories ?? contact.categories
  const org = detail?.contact?.organization ?? contact.organization

  const toggleUd = (key: string) =>
    setShowUdValues(prev => ({ ...prev, [key]: !prev[key] }))

  const handleShareVcf = async () => {
    try {
      await navigator.clipboard.writeText(contactToVcf(contact))
      toast.success('Đã sao chép vCard vào clipboard')
    } catch {
      toast.error('Không thể sao chép vCard')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-divider shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareVcf}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" strokeLinecap="round" />
                <path d="M16 6l-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 2v14" strokeLinecap="round" />
              </svg>
            }
          >
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.contactEdit(contact.id))}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
              </svg>
            }
          >
            Chỉnh sửa
          </Button>
          <ContactActions contact={contact} onDeleted={onClose} />
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 px-5 py-6 border-b border-divider">
        <ContactAvatar name={contact.displayName} photoUrl={contact.photoUrl} size="xxl" />
        <div className="text-center">
          <h2 className="text-headline text-on-surface font-medium">
            {contact.displayName || 'Không tên'}
          </h2>
          {org && (
            <p className="text-body-md text-on-surface-variant mt-0.5">{org}</p>
          )}
        </div>
      </div>

      {/* Emails */}
      {emails.length > 0 && (
        <Section title="Email">
          <div className="space-y-2">
            {emails.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <a href={`mailto:${e.value}`} className="text-body-md text-primary hover:underline truncate block">
                    {e.value}
                  </a>
                  <span className="text-body-sm text-on-surface-variant capitalize">
                    {e.type.filter(t => t !== 'INTERNET').join(', ') || 'email'}
                  </span>
                </div>
                <CopyButton text={e.value} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Phones */}
      {phones.length > 0 && (
        <Section title="Điện thoại">
          <div className="space-y-2">
            {phones.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <a href={`tel:${p.value}`} className="text-body-md text-primary hover:underline">
                    {formatPhone(p.value)}
                  </a>
                  <span className="text-body-sm text-on-surface-variant block capitalize">
                    {p.type.filter(t => t !== 'VOICE').join(', ') || 'điện thoại'}
                  </span>
                </div>
                <CopyButton text={p.value} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <Section title="Nhóm">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge key={cat} variant="primary" size="md">{cat}</Badge>
            ))}
          </div>
        </Section>
      )}

      {/* UserDefined */}
      {Object.keys(userDefined).length > 0 && (
        <Section title="Thông tin tùy chỉnh">
          <div className="space-y-2">
            {Object.entries(userDefined).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-on-surface-variant">{key}</p>
                  <p className="text-body-md text-on-surface font-mono truncate">
                    {showUdValues[key] ? value : '••••••••••••'}
                  </p>
                </div>
                <button
                  onClick={() => toggleUd(key)}
                  className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                  title={showUdValues[key] ? 'Ẩn' : 'Hiện'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showUdValues[key] ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" strokeLinecap="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
                <CopyButton text={value} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Metadata */}
      <Section title="Thông tin khác">
        <div className="space-y-1 text-body-sm text-on-surface-variant">
          <p>Tạo lúc: {formatDate(contact.createdAt)}</p>
          <p>Cập nhật: {formatDate(contact.updatedAt)}</p>
          {contact.sourceFile && <p>Nguồn: {contact.sourceFile}</p>}
          {contact.emailCount > 0 && <p>{contact.emailCount} email • {contact.phoneCount} SĐT</p>}
        </div>
      </Section>
    </div>
  )
}
