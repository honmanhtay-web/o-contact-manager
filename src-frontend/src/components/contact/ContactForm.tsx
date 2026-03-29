// Path: src-frontend/src/components/contact/ContactForm.tsx

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmailFields, PhoneFields, UserDefinedFields } from './ContactFormFields'
import { useCategories } from '@/hooks/useCategories'
import { contactFormSchema, type ContactFormValues } from '@/utils/validators'
import type { ContactWithDetail } from '@/types/contact.types'

interface ContactFormProps {
  defaultValues?: Partial<ContactFormValues>
  contact?: ContactWithDetail | null
  onSubmit: (data: ContactFormValues) => void
  onCancel?: () => void
  isLoading?: boolean
  onDirtyChange?: (dirty: boolean) => void
}

export function ContactForm({
  defaultValues,
  contact,
  onSubmit,
  onCancel,
  isLoading = false,
  onDirtyChange,
}: ContactFormProps) {
  const { data: categories } = useCategories()
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultValues ?? {
      contact: {
        displayName: '',
        organization: '',
        emails: [{ value: '', type: ['INTERNET', 'HOME'] }],
        phones: [],
        categories: [],
        note: '',
      },
      userDefined: {},
    },
  })

  // Populate form từ contact data nếu có
  useEffect(() => {
    if (contact?.detail) {
      const d = contact.detail
      reset({
        contact: {
          displayName: d.contact.displayName ?? '',
          organization: d.contact.organization ?? '',
          emails: d.contact.emails?.length
            ? d.contact.emails
            : [{ value: '', type: ['INTERNET', 'HOME'] }],
          phones: d.contact.phones ?? [],
          categories: d.contact.categories ?? [],
          note: d.contact.note ?? '',
        },
        userDefined: d.userDefined ?? {},
      })
    }
  }, [contact, reset])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Display Name */}
      <Input
        label="Tên hiển thị"
        placeholder="Nguyễn Văn An"
        required
        error={errors.contact?.displayName?.message}
        {...register('contact.displayName')}
      />

      {/* Organization */}
      <Input
        label="Tổ chức"
        placeholder="Công ty TNHH ABC"
        error={errors.contact?.organization?.message}
        {...register('contact.organization')}
      />

      {/* Emails */}
      <EmailFields control={control} register={register} errors={errors} />

      {/* Phones */}
      <PhoneFields control={control} register={register} />

      {/* Categories */}
      <div className="flex flex-col gap-1">
        <label className="text-label text-on-surface font-medium">Nhóm</label>
        <Input
          list="contact-category-list"
          placeholder="myContacts, friends, work (cách nhau bằng dấu phẩy)"
          {...register('contact.categories', {
            setValueAs: (v: string | string[]) =>
              typeof v === 'string'
                ? v.split(',').map((s) => s.trim()).filter(Boolean)
                : v,
          })}
        />
        <datalist id="contact-category-list">
          {(categories ?? []).map((category) => (
            <option key={category.name} value={category.name} />
          ))}
        </datalist>
        <p className="text-body-sm text-on-surface-variant">
          Nhập các nhóm cách nhau bằng dấu phẩy
        </p>
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1">
        <label className="text-label text-on-surface font-medium">Ghi chú</label>
        <textarea
          rows={3}
          placeholder="Ghi chú tùy chỉnh..."
          className="w-full rounded-lg border border-divider bg-white px-3 py-2 text-body-md text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-colors placeholder:text-on-surface-variant/60"
          {...register('contact.note')}
        />
      </div>

      {/* UserDefined */}
      <UserDefinedFields watch={watch} setValue={setValue} />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-divider">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Hủy
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading} disabled={!isDirty && !!contact}>
          {contact ? 'Cập nhật' : 'Tạo liên hệ'}
        </Button>
      </div>
    </form>
  )
}
