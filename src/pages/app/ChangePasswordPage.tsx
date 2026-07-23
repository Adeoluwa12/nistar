import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { authApi } from '../../api'
import toast from 'react-hot-toast'

function PasswordField({
  id, label, value, onChange, placeholder, error, autoComplete,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  placeholder?: string; error?: string; autoComplete?: string
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
          placeholder={placeholder ?? 'Enter password'}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="input-action"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.current) e.current = 'Current password is required'
    if (!form.next) e.next = 'New password is required'
    else if (form.next.length < 8) e.next = 'Must be at least 8 characters'
    if (form.next !== form.confirm) e.confirm = 'Passwords do not match'
    if (form.current && form.next && form.current === form.next)
      e.next = 'New password must differ from current password'
    setErrors(e)
    return !Object.keys(e).length
  }

  const getStrengthScore = (pw: string) =>
    [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)]
      .filter(Boolean).length

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.changePassword({ currentPassword: form.current, newPassword: form.next })
      setDone(true)
      toast.success('Password changed successfully!')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to change password'
      toast.error(msg)
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('current')) {
        setErrors({ current: 'Current password is incorrect' })
      }
    } finally {
      setLoading(false)
    }
  }

  const score = getStrengthScore(form.next)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const strengthColor = ['', '#C0392B', '#E67E22', '#F1C40F', '#27AE60'][score]

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Back header */}
      <div style={{ padding: '12px 16px 0' }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'var(--text-light)',
            fontSize: '0.875rem', fontFamily: 'var(--font)', cursor: 'pointer',
            padding: '6px 0', marginBottom: 8,
          }}
        >
          <ArrowLeft size={16} /> Back to Profile
        </button>
      </div>

      {/* Hero */}
      <div className="change-pw-hero">
        <div className="change-pw-hero__icon">
          <ShieldCheck size={32} />
        </div>
        <h1 className="change-pw-hero__title">Change Password</h1>
        <p className="change-pw-hero__sub">
          Keep your account secure with a strong, unique password.
        </p>
      </div>

      <div style={{ padding: '0 16px', maxWidth: 500, margin: '0 auto' }}>
        {done ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ marginBottom: 8, fontWeight: 600 }}>Password updated!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Your password has been changed successfully.
            </p>
            <button
              className="btn btn--primary btn--full"
              onClick={() => navigate('/profile')}
            >
              Back to profile
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 24 }}>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <PasswordField
                id="cp-current"
                label="Current password"
                value={form.current}
                onChange={v => setForm(f => ({ ...f, current: v }))}
                error={errors.current}
                autoComplete="current-password"
                placeholder="Your current password"
              />

              <div style={{ height: 1, background: 'var(--border-light)' }} />

              <PasswordField
                id="cp-new"
                label="New password"
                value={form.next}
                onChange={v => {
                  setForm(f => ({ ...f, next: v }))
                  if (errors.next) setErrors(e => ({ ...e, next: '' }))
                }}
                error={errors.next}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />

              {/* Password strength */}
              {form.next.length > 0 && (
                <div style={{ marginTop: -12 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i <= score ? strengthColor : 'var(--border-light)',
                          transition: 'background 0.3s',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: strengthColor, fontWeight: 600 }}>
                    {strengthLabel}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 8 }}>
                    {score < 4 && '— Add uppercase, numbers & symbols to strengthen'}
                  </span>
                </div>
              )}

              <PasswordField
                id="cp-confirm"
                label="Confirm new password"
                value={form.confirm}
                onChange={v => {
                  setForm(f => ({ ...f, confirm: v }))
                  if (errors.confirm) setErrors(e => ({ ...e, confirm: '' }))
                }}
                error={errors.confirm}
                autoComplete="new-password"
                placeholder="Repeat new password"
              />

              <button
                type="submit"
                id="cp-submit"
                className="btn btn--primary btn--full"
                disabled={loading}
                style={{ marginTop: 4, gap: 8 }}
              >
                {loading
                  ? <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff' }} /> Updating…</>
                  : <><ShieldCheck size={16} /> Update password</>}
              </button>
            </form>

            <p style={{
              marginTop: 20, padding: '12px 14px',
              background: 'var(--beige)', borderRadius: 'var(--radius)',
              fontSize: '0.8125rem', color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              💡 Tip: Use a mix of uppercase letters, numbers, and symbols for a stronger password.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
