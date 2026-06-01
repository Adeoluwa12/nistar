import { useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { authApi } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

// ─── Shared layout ───────────────────────────────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-topbar">
        <span className="auth-logo">Nis<span>tar</span></span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>Safe space. Real support.</span>
      </div>
      <div className="auth-body">{children}</div>
    </div>
  )
}

// ─── Password input with show/hide ───────────────────────────────────────────
function PasswordInput({
  id, value, onChange, placeholder = 'Enter password', label, error, autoComplete,
}: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string
  label: string; error?: string; autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <span className="input-icon"><Lock size={16} /></span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`form-input ${error ? 'form-input--error' : ''}`}
          style={{ paddingRight: 44 }}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="input-action"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      setAuth(data.data.user, data.data.accessToken)
      toast.success(`Welcome back, ${data.data.user.name.split(' ')[0]} 💚`)
      const role = data.data.user.role
      if (role === 'super_admin' || role === 'department_admin') navigate('/admin')
      else navigate('/feed')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed'
      toast.error(msg)
      if (msg.toLowerCase().includes('verify')) {
        setErrors({ email: 'Please verify your email before logging in.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <p className="auth-card__eyebrow">Welcome back</p>
        <h1 className="auth-card__title" style={{ fontSize: '2rem' }}>Sign in</h1>
        <p className="auth-card__subtitle">You belong here. Let's pick up where you left off.</p>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                id="login-email"
                type="email"
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <PasswordInput
            id="login-pass"
            label="Password"
            value={form.password}
            onChange={v => setForm(f => ({ ...f, password: v }))}
            error={errors.password}
            autoComplete="current-password"
          />

          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--sage-dark)', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
            {loading ? <span className="spinner spinner--sm" style={{ borderTopColor: '#fff' }} /> : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </AuthShell>
  )
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.register({ name: form.name, email: form.email, password: form.password })
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthShell>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💚</div>
          <h2 style={{ marginBottom: 8 }}>Check your inbox</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
            We've sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.
          </p>
          <button className="btn btn--secondary btn--full" onClick={() => navigate('/login')}>
            Back to sign in
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <p className="auth-card__eyebrow">Join Nistar</p>
        <h1 className="auth-card__title" style={{ fontSize: '2rem' }}>Create account</h1>
        <p className="auth-card__subtitle">You don't have to go through this alone.</p>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full name</label>
            <div className="input-wrapper">
              <span className="input-icon"><User size={16} /></span>
              <input
                id="reg-name"
                type="text"
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                id="reg-email"
                type="email"
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <PasswordInput
            id="reg-pass"
            label="Password"
            value={form.password}
            onChange={v => setForm(f => ({ ...f, password: v }))}
            error={errors.password}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          <PasswordInput
            id="reg-confirm"
            label="Confirm password"
            value={form.confirm}
            onChange={v => setForm(f => ({ ...f, confirm: v }))}
            error={errors.confirm}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner spinner--sm" style={{ borderTopColor: '#fff' }} /> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </AuthShell>
  )
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      setSent(true) // Always show success for security
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📬</div>
            <h2 style={{ marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              If an account with <strong>{email}</strong> exists, we've sent a reset link. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <>
            <p className="auth-card__eyebrow">Recovery</p>
            <h1 className="auth-card__title" style={{ fontSize: '2rem' }}>Reset password</h1>
            <p className="auth-card__subtitle">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email address</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Mail size={16} /></span>
                  <input
                    id="forgot-email"
                    type="email"
                    className={`form-input ${error ? 'form-input--error' : ''}`}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {error && <span className="form-error">{error}</span>}
              </div>
              <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
                {loading ? <span className="spinner spinner--sm" style={{ borderTopColor: '#fff' }} /> : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  )
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      setDone(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Reset failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <h2>Invalid link</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn btn--primary btn--full">Request new link</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <p className="auth-card__eyebrow">New password</p>
        <h1 className="auth-card__title" style={{ fontSize: '2rem' }}>Set password</h1>
        <p className="auth-card__subtitle">Choose a strong password for your account.</p>

        {done ? (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <p style={{ color: 'var(--text-secondary)' }}>Password updated. Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PasswordInput
              id="reset-pass"
              label="New password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <PasswordInput
              id="reset-confirm"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              error={errors.confirm}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
            <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner spinner--sm" style={{ borderTopColor: '#fff' }} /> : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  )
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  const verify = useCallback(async () => {
    if (!token) { setStatus('error'); return }
    try {
      await authApi.verifyEmail(token)
      setStatus('success')
      toast.success('Email verified! Welcome to Nistar 💚')
    } catch {
      setStatus('error')
    }
  }, [token])

  useState(() => { verify() })

  return (
    <AuthShell>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="spinner spinner--lg" style={{ margin: '0 auto 20px', borderTopColor: 'var(--sage)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>💚</div>
            <h2 style={{ marginBottom: 8 }}>You're verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your account is ready. Welcome to Nistar.</p>
            <button className="btn btn--primary btn--full btn--lg" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
            <h2 style={{ marginBottom: 8 }}>Link expired</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This verification link has expired or is invalid.</p>
            <Link to="/login" className="btn btn--secondary btn--full" style={{ marginBottom: 12 }}>Back to login</Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}
