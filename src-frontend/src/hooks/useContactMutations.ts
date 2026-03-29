// Path: src-frontend/src/hooks/useContactMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createContact, updateContact, patchContact, deleteContact } from '@/api/contacts.api'
import { queryKeys } from '@/constants/queryKeys'
import type { ContactFormData, ContactIndex, ContactWithDetail } from '@/types/contact.types'
import type { ContactsPage } from '@/types/pagination.types'

function removeFromContactsData(data: unknown, id: string) {
  if (!data || typeof data !== 'object') return data

  if ('data' in data && 'meta' in data && Array.isArray((data as ContactsPage).data)) {
    const page = data as ContactsPage
    return {
      ...page,
      data: page.data.filter((contact) => contact.id !== id),
      meta: {
        ...page.meta,
        count: Math.max(0, page.meta.count - (page.data.some((contact) => contact.id === id) ? 1 : 0)),
      },
    }
  }

  if ('contacts' in data && 'pages' in data && Array.isArray((data as { contacts: ContactIndex[] }).contacts)) {
    const infiniteData = data as {
      contacts: ContactIndex[]
      pages: ContactsPage[]
      pageParams: unknown[]
    }

    return {
      ...infiniteData,
      contacts: infiniteData.contacts.filter((contact) => contact.id !== id),
      pages: infiniteData.pages.map((page) => ({
        ...page,
        data: page.data.filter((contact) => contact.id !== id),
        meta: {
          ...page.meta,
          count: page.data.filter((contact) => contact.id !== id).length,
        },
      })),
    }
  }

  return data
}

function patchDetailCache(existing: ContactWithDetail | undefined, payload: ContactFormData | Partial<ContactFormData>) {
  if (!existing?.detail) return existing

  return {
    ...existing,
    displayName: payload.contact?.displayName ?? existing.displayName,
    organization: payload.contact?.organization ?? existing.organization,
    categories: payload.contact?.categories ?? existing.categories,
    detail: {
      ...existing.detail,
      contact: {
        ...existing.detail.contact,
        ...payload.contact,
        displayName: payload.contact?.displayName ?? existing.detail.contact.displayName,
      },
      userDefined: payload.userDefined
        ? { ...existing.detail.userDefined, ...payload.userDefined }
        : existing.detail.userDefined,
      vcfRaw: payload.vcfRaw ?? existing.detail.vcfRaw,
    },
  }
}

export function useContactMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (data: ContactFormData) => createContact(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      toast.success('Đã tạo liên hệ')
    },
    onError: (err: Error) => toast.error(err.message || 'Tạo thất bại'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactFormData }) =>
      updateContact(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.contacts.detail(id) })
      const previousDetail = qc.getQueryData<ContactWithDetail>(queryKeys.contacts.detail(id))
      qc.setQueryData(queryKeys.contacts.detail(id), patchDetailCache(previousDetail, data))
      return { previousDetail }
    },
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      toast.success('Đã cập nhật liên hệ')
    },
    onError: (err: Error, { id }, context) => {
      if (context?.previousDetail) {
        qc.setQueryData(queryKeys.contacts.detail(id), context.previousDetail)
      }
      toast.error(err.message || 'Cập nhật thất bại')
    },
  })

  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactFormData> }) =>
      patchContact(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.contacts.detail(id) })
      const previousDetail = qc.getQueryData<ContactWithDetail>(queryKeys.contacts.detail(id))
      qc.setQueryData(queryKeys.contacts.detail(id), patchDetailCache(previousDetail, data))
      return { previousDetail }
    },
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      toast.success('Đã cập nhật')
    },
    onError: (err: Error, { id }, context) => {
      if (context?.previousDetail) {
        qc.setQueryData(queryKeys.contacts.detail(id), context.previousDetail)
      }
      toast.error(err.message || 'Cập nhật thất bại')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.contacts.lists() })
      await qc.cancelQueries({ queryKey: queryKeys.contacts.detail(id) })

      const previousLists = qc.getQueriesData({ queryKey: queryKeys.contacts.lists() })
      const previousDetail = qc.getQueryData(queryKeys.contacts.detail(id))

      qc.setQueriesData({ queryKey: queryKeys.contacts.lists() }, (current) =>
        removeFromContactsData(current, id)
      )
      qc.removeQueries({ queryKey: queryKeys.contacts.detail(id) })

      return { previousLists, previousDetail }
    },
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: queryKeys.contacts.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      toast.success('Đã xóa liên hệ')
    },
    onError: (err: Error, id, context) => {
      context?.previousLists?.forEach(([key, value]) => {
        qc.setQueryData(key, value)
      })
      if (context?.previousDetail) {
        qc.setQueryData(queryKeys.contacts.detail(id), context.previousDetail)
      }
      toast.error(err.message || 'Xóa thất bại')
    },
  })

  return { create, update, patch, remove }
}
