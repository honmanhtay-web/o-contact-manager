// Path: src-frontend/src/components/bulk/ImportProgress.tsx

import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useImportJobStatus } from '@/hooks/useBulkImport'

interface ImportProgressProps {
  jobId: string
  onDismiss?: () => void
}

export function ImportProgress({ jobId, onDismiss }: ImportProgressProps) {
  const jobStatus = useImportJobStatus(jobId)
  const status = jobStatus.data

  if (!status && jobStatus.isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl">
        <Spinner size="sm" className="text-primary" />
        <span className="text-body-sm text-on-surface-variant">Đang tải trạng thái...</span>
      </div>
    )
  }

  if (!status) return null

  const percent = status.total > 0 ? Math.round((status.done / status.total) * 100) : 0
  const isRunning = status.status === 'running'
  const isDone = status.status === 'completed'
  const isFailed = status.status === 'failed'

  return (
    <div
      className={clsx(
        'px-4 py-3 rounded-xl border text-body-sm',
        isDone && 'bg-green-50 border-green-200',
        isFailed && 'bg-red-50 border-red-200',
        isRunning && 'bg-surface-container border-divider'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isRunning && <Spinner size="xs" className="text-primary" />}
          {isDone && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isFailed && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-error">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          )}
          <span className={clsx(
            'font-medium',
            isDone && 'text-success',
            isFailed && 'text-error',
            isRunning && 'text-on-surface'
          )}>
            {isRunning && `Đang import... ${percent}%`}
            {isDone && `Hoàn thành! ${status.success}/${status.total} contacts`}
            {isFailed && `Lỗi: ${status.error ?? 'Import thất bại'}`}
          </span>
        </div>
        {(isDone || isFailed) && onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Đóng
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="h-1.5 bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {/* Error details */}
      {isDone && status.errors.length > 0 && (
        <p className="text-body-sm text-warning mt-1">
          {status.errors.length} lỗi nhỏ — một số contacts có thể không được import.
        </p>
      )}
    </div>
  )
}
