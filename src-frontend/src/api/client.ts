// Path: src-frontend/src/api/client.ts

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/constants/config'
import { getApiBaseUrl, getApiKey, setApiBaseUrl as storeApiBaseUrl } from '@/utils/storage'

/**
 * Axios instance configured for O Contact Manager API.
 *
 * Features:
 * - Auto-attach Authorization: Bearer <apiKey> header from localStorage
 * - JSON request/response handling
 * - Error normalization (extracts message from API error response)
 * - 401 redirect to /settings
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl() ?? API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ─── Request Interceptor: attach API key ──────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const apiKey = getApiKey()
    if (apiKey) {
      config.headers['Authorization'] = `Bearer ${apiKey}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ─── Response Interceptor: error normalization ────────────────────────────────

apiClient.interceptors.response.use(
  // Pass through successful responses
  (response) => response,

  // Normalize errors
  (error: AxiosError<{ error: string; message: string }>) => {
    if (error.response) {
      const { status, data } = error.response

      // 401 Unauthorized: redirect to settings if not already there
      if (status === 401) {
        if (!window.location.pathname.includes('/settings')) {
          window.location.href = '/settings'
        }
      }

      // Extract server error message if available
      const serverMessage = data?.message ?? data?.error ?? `HTTP ${status}`
      const enhancedError = new Error(serverMessage) as Error & { status: number; code: string }
      enhancedError.status = status
      enhancedError.code = data?.error ?? 'API_ERROR'
      return Promise.reject(enhancedError)
    }

    if (error.request) {
      // Request made but no response received (network error)
      return Promise.reject(new Error('Không thể kết nối đến server. Kiểm tra API URL và kết nối mạng.'))
    }

    return Promise.reject(error)
  }
)

export default apiClient

/**
 * Helper: update base URL at runtime (e.g. when user changes API URL in settings)
 */
export function setApiBaseUrl(url: string): void {
  const normalizedUrl = url.trim()
  storeApiBaseUrl(normalizedUrl)
  apiClient.defaults.baseURL = normalizedUrl
}
