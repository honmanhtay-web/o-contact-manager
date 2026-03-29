// Path: src-frontend/src/components/contact/ContactFormFields.tsx

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { ContactFormValues } from '@/utils/validators'
import { EMAIL_TYPES, PHONE_TYPES } from '@/constants/config'

interface EmailFieldsProps {
  control: Control<ContactFormValues>
  register: UseFormRegister<ContactFormValues>
  errors?: FieldErrors<ContactFormValues>
}

export function EmailFields({ control, register, errors }: EmailFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'contact.emails' })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-label text-on-surface font-medium">Email</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ value: '', type: ['INTERNET', 'HOME'] })}
        >
          + Thêm
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              placeholder="email@example.com"
              {...register(`contact.emails.${index}.value`)}
              error={errors?.contact?.emails?.[index]?.value?.message}
            />
          </div>
          <select
            className="h-9 rounded-lg border border-divider bg-white px-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300"
            {...register(`contact.emails.${index}.type.0`)}
          >
            {EMAIL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

interface PhoneFieldsProps {
  control: Control<ContactFormValues>
  register: UseFormRegister<ContactFormValues>
}

export function PhoneFields({ control, register }: PhoneFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'contact.phones' })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-label text-on-surface font-medium">Điện thoại</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ value: '', type: ['CELL'] })}
        >
          + Thêm
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              placeholder="0901234567"
              type="tel"
              {...register(`contact.phones.${index}.value`)}
            />
          </div>
          <select
            className="h-9 rounded-lg border border-divider bg-white px-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300"
            {...register(`contact.phones.${index}.type.0`)}
          >
            {PHONE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

interface UserDefinedFieldsProps {
  watch: UseFormWatch<ContactFormValues>
  setValue: UseFormSetValue<ContactFormValues>
}

export function UserDefinedFields({ watch, setValue }: UserDefinedFieldsProps) {
  const userDefined = (watch('userDefined') as Record<string, string>) ?? {}
  const entries = Object.entries(userDefined)

  const addField = () => {
    const key = `key_${Date.now()}`
    setValue('userDefined', { ...userDefined, [key]: '' })
  }

  const removeField = (key: string) => {
    const updated = { ...userDefined }
    delete updated[key]
    setValue('userDefined', updated)
  }

  const updateKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const updated: Record<string, string> = {}
    for (const [k, v] of Object.entries(userDefined)) {
      updated[k === oldKey ? newKey : k] = v
    }
    setValue('userDefined', updated)
  }

  const updateValue = (key: string, value: string) => {
    setValue('userDefined', { ...userDefined, [key]: value })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-label text-on-surface font-medium">Thông tin tùy chỉnh</label>
        <Button type="button" variant="ghost" size="sm" onClick={addField}>
          + Thêm
        </Button>
      </div>
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2 items-start">
          <input
            className="flex-1 h-9 rounded-lg border border-divider bg-white px-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300 min-w-0"
            placeholder="Tên trường (vd: github.token)"
            defaultValue={key}
            onBlur={(e) => updateKey(key, e.target.value)}
          />
          <input
            className="flex-1 h-9 rounded-lg border border-divider bg-white px-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300 min-w-0 font-mono"
            placeholder="Giá trị"
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeField(key)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
