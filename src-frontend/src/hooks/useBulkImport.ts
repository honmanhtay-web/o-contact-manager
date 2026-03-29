// Path: src-frontend/src/hooks/useBulkImport.ts

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { importContacts, getImportJobStatus } from '@/api/bulk.api'
import { queryKeys } from '@/constants/queryKeys'
import { JOB_POLL_INTERVAL_MS } from '@/constants/config'
import type { ContactFormData, ImportJobStatus } from '@/types/contact.types'

export function useBulkImport() {
  const [jobId, setJobId] = useState<string | null>(null)

  const startImport = useMutation({
    mutationFn: ({ contacts, sourceFile }: { contacts: ContactFormData[]; sourceFile?: string }) =>
      importContacts(contacts, sourceFile),
    onSuccess: (result) => {
      setJobId(result.jobId)
    },
  })

  const jobStatus = useImportJobStatus(jobId)

  const reset = () => setJobId(null)

  return { startImport, jobId, jobStatus, reset }
}

export function useImportJobStatus(jobId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.importJob(jobId ?? ''),
    queryFn: () => getImportJobStatus(jobId!),
    enabled: !!jobId,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data as ImportJobStatus | undefined
      if (!data) return JOB_POLL_INTERVAL_MS
      return data.status === 'running' ? JOB_POLL_INTERVAL_MS : false
    },
  })
}
