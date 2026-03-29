import { useEffect } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

export function useUnsavedChangesPrompt(when: boolean, message = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?') {
  useBeforeUnload(
    (event) => {
      if (!when) return
      event.preventDefault()
      event.returnValue = ''
    },
    { capture: true }
  )

  const blocker = useBlocker(when)

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    const confirmed = window.confirm(message)
    if (confirmed) blocker.proceed()
    else blocker.reset()
  }, [blocker, message])
}
