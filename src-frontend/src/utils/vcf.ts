import type { ContactFormData, ContactWithDetail } from '@/types/contact.types'

function decodeVcfValue(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function parseTypes(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) return fallback

  const tokens = raw
    .split(';')
    .flatMap((segment) => {
      const [, value = ''] = segment.split('=')
      return segment.startsWith('TYPE=')
        ? value.split(',')
        : []
    })
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean)

  return tokens.length > 0 ? tokens : fallback
}

function unfoldVcf(text: string): string {
  return text.replace(/\r?\n[ \t]/g, '')
}

export function parseVcfContacts(text: string): ContactFormData[] {
  const unfolded = unfoldVcf(text)
  const blocks = unfolded.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) ?? []

  return blocks
    .map((block) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

      const emails: NonNullable<ContactFormData['contact']['emails']> = []
      const phones: NonNullable<ContactFormData['contact']['phones']> = []
      const categories = new Set<string>()
      const contact: ContactFormData['contact'] = {
        displayName: '',
        emails,
        phones,
        categories: [],
      }

      for (const line of lines) {
        const separatorIndex = line.indexOf(':')
        if (separatorIndex < 0) continue

        const rawKey = line.slice(0, separatorIndex)
        const rawValue = decodeVcfValue(line.slice(separatorIndex + 1))
        const [field, ...params] = rawKey.split(';')
        const upperField = field.toUpperCase()
        const typeParams = params.join(';')

        if (upperField === 'FN') {
          contact.displayName = rawValue
          continue
        }

        if (upperField === 'N') {
          const [family, given, middle, prefix, suffix] = rawValue.split(';')
          contact.name = {
            family: family || undefined,
            given: given || undefined,
            middle: middle || undefined,
            prefix: prefix || undefined,
            suffix: suffix || undefined,
          }
          continue
        }

        if (upperField === 'EMAIL' && rawValue) {
          emails.push({
            value: rawValue.toLowerCase(),
            type: parseTypes(typeParams, ['INTERNET', 'HOME']),
          })
          continue
        }

        if (upperField === 'TEL' && rawValue) {
          phones.push({
            value: rawValue,
            type: parseTypes(typeParams, ['CELL']),
          })
          continue
        }

        if (upperField === 'ORG' && rawValue) {
          contact.organization = rawValue
          continue
        }

        if (upperField === 'CATEGORIES' && rawValue) {
          rawValue
            .split(',')
            .map((category) => category.trim())
            .filter(Boolean)
            .forEach((category) => categories.add(category))
          continue
        }

        if (upperField === 'NOTE' && rawValue) {
          contact.note = rawValue
          continue
        }
      }

      contact.categories = [...categories]

      if (!contact.displayName) {
        const given = contact.name?.given?.trim()
        const family = contact.name?.family?.trim()
        contact.displayName = [given, family].filter(Boolean).join(' ') || emails[0]?.value || 'Không tên'
      }

      return {
        contact,
        userDefined: {},
        vcfRaw: block,
      }
    })
    .filter((entry) => entry.contact.displayName || entry.contact.emails?.length)
}

export function contactToVcf(contact: ContactWithDetail): string {
  if (contact.detail?.vcfRaw) return contact.detail.vcfRaw

  const detail = contact.detail?.contact
  const displayName = detail?.displayName || contact.displayName || 'Unknown'
  const name = detail?.name
  const emails = detail?.emails ?? contact.allEmails.map((value) => ({ value, type: ['INTERNET'] }))
  const phones = detail?.phones ?? (contact.primaryPhone ? [{ value: contact.primaryPhone, type: ['VOICE'] }] : [])
  const categories = detail?.categories ?? contact.categories
  const organization = detail?.organization ?? contact.organization

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${displayName}`]

  if (name) {
    lines.push(
      `N:${name.family || ''};${name.given || ''};${name.middle || ''};${name.prefix || ''};${name.suffix || ''}`
    )
  }

  if (organization) lines.push(`ORG:${organization}`)
  if (categories.length > 0) lines.push(`CATEGORIES:${categories.join(',')}`)
  if (detail?.note) lines.push(`NOTE:${detail.note.replace(/\n/g, '\\n')}`)

  for (const email of emails) {
    lines.push(`EMAIL;TYPE=${(email.type || ['INTERNET']).join(',')}:${email.value}`)
  }

  for (const phone of phones) {
    lines.push(`TEL;TYPE=${(phone.type || ['VOICE']).join(',')}:${phone.value}`)
  }

  lines.push('END:VCARD')
  return lines.join('\r\n')
}
