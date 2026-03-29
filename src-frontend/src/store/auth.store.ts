// Path: src-frontend/src/store/auth.store.ts

import { create } from 'zustand'
import { clearApiKey, getApiKey, setApiKey as storeApiKey } from '@/utils/storage'

interface AuthState {
  apiKey: string | null
  isAuthenticated: boolean
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useAuthStore = create<AuthState>()(
  (set) => {
    const apiKey = getApiKey()

    return {
      apiKey,
      isAuthenticated: !!apiKey,
      setApiKey: (key: string) => {
        const normalizedKey = key.trim()
        storeApiKey(normalizedKey)
        set({ apiKey: normalizedKey, isAuthenticated: !!normalizedKey })
      },
      clearApiKey: () => {
        clearApiKey()
        set({ apiKey: null, isAuthenticated: false })
      },
    }
  }
)
