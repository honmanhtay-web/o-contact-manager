/**
 * Email entry matching backend contacts_detail.contact.emails[] schema
 */
export interface EmailEntry {
  type: string[]
  value: string
  label?: string | null
}

/**
 * Phone entry matching backend contacts_detail.contact.phones[] schema
 */
export interface PhoneEntry {
  type: string[]
  value: string
}

/**
 * Structured name parts from vCard N property
 */
export interface NameParts {
  family?: string
  given?: string
  middle?: string
  prefix?: string
  suffix?: string
}

export interface AddressEntry {
  type: string[]
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface ContactIndex {
  id: string
  displayName: string
  nameNormalized: string
  primaryEmail: string
  emailDomain: string
  allEmails: string[]
  allDomains: string[]
  primaryPhone: string
  organization?: string
  photoUrl?: string
  categories: string[]
  tags: string[]
  searchTokens: string[]
  userDefinedKeys: string[]
  hasUserDefined: boolean
  udKeyCount: number
  emailCount: number
  phoneCount: number
  createdAt: string
  updatedAt: string
  importedAt?: string
  sourceFile?: string
  version: number
}

export interface ContactDetailInner {
  displayName: string
  name?: NameParts
  emails: EmailEntry[]
  phones: PhoneEntry[]
  addresses?: AddressEntry[]
  organization?: string
  categories: string[]
  note?: string
  birthday?: string
  extensions?: Record<string, string>
}

export interface ContactDetail {
  id: string
  contact: ContactDetailInner
  userDefined: Record<string, string>
  vcfRaw?: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface ContactWithDetail extends ContactIndex {
  detail: ContactDetail | null
}

export interface ContactFormData {
  contact: {
    displayName: string
    name?: NameParts
    emails?: EmailEntry[]
    phones?: PhoneEntry[]
    organization?: string
    categories?: string[]
    note?: string
    birthday?: string
  }
  userDefined?: Record<string, string>
  vcfRaw?: string
}

export interface EmailLookupResult {
  contactId: string
  email: string
  isPrimary: boolean
  type: string[]
  label: string | null
  contact: ContactIndex
  detail: ContactDetail | null
}

export interface UdKeyEntry {
  key: string
  count: number
  updatedAt: string | null
}

export interface UdKeyLookupResult {
  data: ContactIndex[]
  meta: {
    key: string
    count: number
    totalInLookup: number
  }
}

export interface StatsData {
  totalContacts: number
  totalEmails?: number
  totalWithUserDefined?: number
  lastImportAt: string | null
  lastImportCount: number
  lastImportFile?: string
  migratedAt?: string
}

export interface CategorySummary {
  name: string
  label: string
  count: number
}

export interface ImportJobStatus {
  status: 'running' | 'completed' | 'failed'
  total: number
  done: number
  success: number
  errors: Array<{ index: number; error: string }>
  sourceFile: string | null
  startedAt: string
  finishedAt: string | null
  error?: string
}

export interface ContactWriteResult {
  contactId: string
  emailCount?: number
  udKeyCount?: number
}

export interface BulkImportResult {
  jobId: string
  statusUrl: string
  total: number
  message: string
}
