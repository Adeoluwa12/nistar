import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { useAuthStore } from './stores/authStore'
import { authApi } from './api'

// Auth pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/auth/index'

// App pages
import LandingPage from './pages/app/LandingPage'
import FeedPage from './pages/app/FeedPage'
import PostPage from './pages/app/PostPage'
import WritePostPage from './pages/app/WritePostPage'
import CounselorsPage from './pages/app/CounselorsPage'
import ChatPage from './pages/app/ChatPage'
import ProfilePage from './pages/app/ProfilePage'
import NotificationsPage from './pages/app/NotificationsPage'
import SessionsPage from './pages/app/SessionsPage'
import SupportPage from './pages/app/SupportPage'
import ChangePasswordPage from './pages/app/ChangePasswordPage'

// Admin
import AdminPage from './pages/admin/AdminPage'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Validates the persisted session on load. If a token exists we re-fetch the
 * current user so a stale/expired session is reconciled instead of blindly
 * trusting localStorage. Real auth failures (401) are handled by the axios
 * interceptor, so transient errors here are ignored to avoid spurious logouts.
 */
function AuthBootstrap() {
  const token = useAuthStore(s => s.token)
  const setUser = useAuthStore(s => s.setUser)
  const setLoading = useAuthStore(s => s.setLoading)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    authApi.getMe()
      .then(({ data }) => { if (!cancelled) setUser(data.data) })
      .catch(() => { /* interceptor handles auth failures */ })
      // Always clear loading (it is global app state, not tied to this mount)
      // so the app never gets stuck on the splash spinner.
      .finally(() => setLoading(false))
    return () => { cancelled = true }
  }, [token, setUser, setLoading])

  return null
}

export default function App() {
  const isLoading = useAuthStore(s => s.isLoading)

  return (
    <QueryClientProvider client={qc}>
      {/* Mounted unconditionally so the splash spinner can never orphan the
          component responsible for turning it off. */}
      <AuthBootstrap />

      {isLoading ? (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, var(--beige) 0%, var(--white) 100%)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner spinner--lg" style={{ margin: '0 auto 16px', borderTopColor: 'var(--sage)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Loading…</p>
          </div>
        </div>
      ) : (
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* App shell routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/posts/:slug" element={<PostPage />} />
              <Route path="/counselors" element={<CounselorsPage />} />
              <Route path="/support" element={<SupportPage />} />

              {/* Protected routes */}
              <Route path="/posts/new" element={
                <ProtectedRoute><WritePostPage /></ProtectedRoute>
              } />
              <Route path="/posts/:slug/edit" element={
                <ProtectedRoute><WritePostPage /></ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute><ChatPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute><NotificationsPage /></ProtectedRoute>
              } />
              <Route path="/sessions" element={
                <ProtectedRoute><SessionsPage /></ProtectedRoute>
              } />
              <Route path="/change-password" element={
                <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['super_admin', 'department_admin']}>
                  <AdminPage />
                </ProtectedRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/feed" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Spectral, Georgia, serif',
            fontSize: '0.9375rem',
            background: '#fff',
            color: '#2C2C2C',
            border: '1px solid #E6D7C3',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(107,142,90,0.12)',
            padding: '12px 16px',
            maxWidth: '360px',
          },
          success: {
            iconTheme: { primary: '#9CAF88', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#C0392B', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  )
}
