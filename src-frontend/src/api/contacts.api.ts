// Path: src-frontend/src/api/contacts.api.ts

import apiClient from './client'
import type { ContactWithDetail, ContactFormData, ContactWriteResult } from '@/types/contact.types'
import type { ContactsPage, ContactsFilterParams } from '@/types/pagination.types'
import type { ApiEnvelope } from './types'

/**
 * List contacts with optional filters + cursor pagination
 */
export async function getContacts(params: ContactsFilterParams = {}): Promise<ContactsPage> {
  const { data } = await apiClient.get<ContactsPage>('/contacts', { params })
  return data
}

/**
 * Get a single contact (index + detail merged)
 */
export async function getContact(id: string): Promise<ContactWithDetail> {
  const { data } = await apiClient.get<ApiEnvelope<ContactWithDetail>>(`/contacts/${id}`)
  return data.data
}

/**
 * Create a new contact
 */
export async function createContact(body: ContactFormData): Promise<ContactWriteResult> {
  const { data } = await apiClient.post<ApiEnvelope<ContactWriteResult, ContactWriteResult>>('/contacts', body)
  return { ...data.data, ...data.meta }
}

/**
 * Full replace (PUT)
 */
export async function updateContact(id: string, body: ContactFormData): Promise<ContactWriteResult> {
  const { data } = await apiClient.put<ApiEnvelope<ContactWriteResult, ContactWriteResult>>(`/contacts/${id}`, body)
  return { ...data.data, ...data.meta }
}

/**
 * Partial update (PATCH)
 */
export async function patchContact(id: string, body: Partial<ContactFormData>): Promise<ContactWriteResult> {
  const { data } = await apiClient.patch<ApiEnvelope<ContactWriteResult, ContactWriteResult>>(`/contacts/${id}`, body)
  return { ...data.data, ...data.meta }
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<{ contactId: string; deletedEmails: number; cleanedUdKeys: number }> {
  const { data } = await apiClient.delete<
    ApiEnvelope<
      { contactId: string },
      { deletedEmails: number; cleanedUdKeys: number }
    >
  >(`/contacts/${id}`)

  return {
    contactId: data.data.contactId,
    deletedEmails: data.meta?.deletedEmails ?? 0,
    cleanedUdKeys: data.meta?.cleanedUdKeys ?? 0,
  }
}
