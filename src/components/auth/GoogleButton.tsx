import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import { getErrorMessage } from '../../lib/errors'
import toast from 'react-hot-toast'

interface GoogleCredentialResponse { credential?: string }

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client'
const RAW_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
// Ignore the .env.example placeholder so the button stays hidden (and GIS never
// errors) until a real client ID is configured.
const CLIENT_ID = RAW_CLIENT_ID && RAW_CLIENT_ID !== 'your-google-client-id' ? RAW_CLIENT_ID : undefined

const isPlaceholderClientId = (id: string | undefined) =>
  !id || id.includes('your-') || id.includes('placeholder') || id.includes('example')

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return }
    const existing = document.getElementById('gsi-script') as HTMLScriptElement | null
    if (existing) { existing.addEventListener('load', () => resolve()); return }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.id = 'gsi-script'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(s)
  })
}

/**
 * Renders a "Continue with Google" button using Google Identity Services and
 * exchanges the returned ID token with the backend (`POST /auth/google`).
 * Renders nothing when VITE_GOOGLE_CLIENT_ID is not configured.
 */
export default function GoogleButton() {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  useEffect(() => {
    if (isPlaceholderClientId(CLIENT_ID)) return
    const clientId = CLIENT_ID as string
    let cancelled = false

    loadGsi()
      .then(() => {
        if (cancelled || !window.google || !ref.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            if (!resp.credential) return
            try {
              const { data } = await authApi.googleAuth(resp.credential)
              setAuth(data.data.user, data.data.accessToken)
               toast.success(`Welcome, ${data.data.user.name.split(' ')[0]}`)
              const role = data.data.user.role
              navigate(role === 'super_admin' || role === 'department_admin' ? '/admin' : '/feed')
            } catch (err) {
              toast.error(getErrorMessage(err, 'Google sign-in failed'))
            }
          },
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline', size: 'large', width: 320, text: 'continue_with', shape: 'pill',
        })
      })
      .catch(() => { /* script blocked/offline — button simply won't render */ })

    return () => { cancelled = true }
  }, [navigate, setAuth])

  if (isPlaceholderClientId(CLIENT_ID)) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', color: 'var(--text-light)', fontSize: '0.8125rem' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        <span>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
      </div>
      <div ref={ref} />
    </div>
  )
}
