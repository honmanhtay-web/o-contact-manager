// Path: src-frontend/src/pages/SettingsPage.tsx

import { useState } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { setApiBaseUrl } from '@/api/client'
import { API_BASE_URL, APP_NAME, APP_VERSION } from '@/constants/config'
import { getApiBaseUrl } from '@/utils/storage'

export function SettingsPage() {
  const { apiKey, setApiKey, clearApiKey } = useAuthStore()
  const [keyInput, setKeyInput] = useState(apiKey ?? '')
  const [showKey, setShowKey] = useState(false)
  const [baseUrl, setBaseUrl] = useState(getApiBaseUrl() ?? API_BASE_URL)
  const [testing, setTesting] = useState(false)

  const handleSave = () => {
    if (!keyInput.trim()) {
      toast.error('API key không được để trống')
      return
    }
    setApiKey(keyInput.trim())
    setApiBaseUrl(baseUrl)
    toast.success('Đã lưu cài đặt')
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await fetch(`${baseUrl}/health`)
      if (res.ok) {
        const data = await res.json()
        toast.success(`✅ Server OK — version ${data.version ?? 'unknown'}`)
      } else {
        toast.error(`❌ Server trả về ${res.status}`)
      }
    } catch {
      toast.error('❌ Không kết nối được server')
    } finally {
      setTesting(false)
    }
  }

  const handleClear = () => {
    if (window.confirm('Xóa API key? Bạn sẽ cần nhập lại để sử dụng.')) {
      clearApiKey()
      setKeyInput('')
      toast.success('Đã xóa API key')
    }
  }

  return (
    <AppShell>
      <TopBar showBack title="Cài đặt" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-6">

          {/* API Config */}
          <section className="bg-white rounded-2xl shadow-card p-5 space-y-4">
            <h2 className="text-title-md text-on-surface font-medium">Kết nối API</h2>

            <div>
              <label className="text-label text-on-surface font-medium block mb-1">API Base URL</label>
              <div className="flex gap-2">
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="flex-1 h-9 rounded-lg border border-divider bg-white px-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary font-mono text-sm"
                  placeholder="http://localhost:3000"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTest}
                  loading={testing}
                >
                  Test
                </Button>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Mặc định: <code className="font-mono bg-surface-container px-1 rounded">{API_BASE_URL}</code>
              </p>
            </div>

            <div>
              <label className="text-label text-on-surface font-medium block mb-1">API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full h-9 rounded-lg border border-divider bg-white px-3 pr-9 text-body-md text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                    placeholder="Nhập API key..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showKey ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" strokeLinecap="round" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" strokeLinecap="round" />
                          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Tạo key: <code className="font-mono bg-surface-container px-1 rounded">npm run create-key</code>
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="primary" onClick={handleSave} className="flex-1">
                Lưu cài đặt
              </Button>
              {apiKey && (
                <Button variant="secondary" onClick={handleClear}>
                  Xóa key
                </Button>
              )}
            </div>
          </section>

          {/* Cache */}
          <section className="bg-white rounded-2xl shadow-card p-5 space-y-3">
            <h2 className="text-title-md text-on-surface font-medium">Cache & Dữ liệu</h2>
            <Button
              variant="secondary"
              onClick={() => {
                localStorage.clear()
                toast.success('Đã xóa cache')
              }}
            >
              Xóa toàn bộ cache
            </Button>
            <p className="text-body-sm text-on-surface-variant">
              Xóa tất cả dữ liệu lưu trong trình duyệt (API key, recent searches).
            </p>
          </section>

          {/* About */}
          <section className="bg-white rounded-2xl shadow-card p-5 space-y-1 text-body-sm text-on-surface-variant">
            <h2 className="text-title-md text-on-surface font-medium mb-2">Thông tin</h2>
            <p>📱 {APP_NAME}</p>
            <p>🏷️ Version: {APP_VERSION}</p>
            <p>🔗 API: <span className="font-mono">{baseUrl}</span></p>
            <p>⚡ React 18 + Vite + TailwindCSS</p>
            <p>📦 Firebase Firestore + Realtime DB</p>
          </section>

        </div>
      </div>
    </AppShell>
  )
}
