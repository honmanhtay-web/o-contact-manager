// Path: src-frontend/src/components/bulk/ImportButton.tsx

import { useRef } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { useBulkImport } from '@/hooks/useBulkImport'
import type { ContactFormData } from '@/types/contact.types'
import { parseVcfContacts } from '@/utils/vcf'

interface ImportButtonProps {
  onJobStarted?: (jobId: string) => void
}

async function parseJsonContacts(text: string): Promise<ContactFormData[]> {
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : parsed.contacts ?? parsed.data ?? []
}

export function ImportButton({ onJobStarted }: ImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { startImport } = useBulkImport()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset để cho phép chọn lại cùng file

    try {
      const text = await file.text()
      let contacts: ContactFormData[] = []
      const sourceFile = file.name

      if (file.name.endsWith('.json')) {
        contacts = await parseJsonContacts(text)
      } else if (file.name.endsWith('.vcf')) {
        contacts = parseVcfContacts(text)
      } else {
        toast.error('Định dạng file chưa được hỗ trợ')
        return
      }

      if (contacts.length === 0) {
        toast.error('File không có dữ liệu contacts')
        return
      }

      const confirmed = window.confirm(
        `Import ${contacts.length} contacts từ "${file.name}"?\nThao tác này không thể hoàn tác.`
      )
      if (!confirmed) return

      startImport.mutate(
        { contacts, sourceFile },
        {
          onSuccess: (result) => {
            onJobStarted?.(result.jobId)
          },
          onError: (err) => {
            toast.error(`Import thất bại: ${err.message}`)
          },
        }
      )
    } catch (err) {
      toast.error('Không thể đọc file. Kiểm tra định dạng.')
      console.error(err)
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.vcf"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="secondary"
        size="sm"
        loading={startImport.isPending}
        onClick={() => fileRef.current?.click()}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
          </svg>
        }
      >
        Import
      </Button>
    </>
  )
}
