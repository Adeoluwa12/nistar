import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LifeBuoy, Send, MessageCircle, Calendar, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { complaintsApi } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import PageHeader from '../../components/shared/PageHeader'
import toast from 'react-hot-toast'
import type { Complaint } from '../../types'

const CATEGORIES = [
  { value: 'session', label: 'A session' },
  { value: 'counselor', label: 'A counselor' },
  { value: 'content', label: 'Content on the platform' },
  { value: 'technical', label: 'Something is broken' },
  { value: 'other', label: 'Something else' },
]

export default function SupportPage() {
  const { isAuthenticated } = useAuthStore()
  const [category, setCategory] = useState('session')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: myData } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => complaintsApi.getMy(),
    enabled: isAuthenticated,
  })
  const myComplaints: Complaint[] = myData?.data?.data ?? []

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please add a subject and describe your complaint')
      return
    }
    if (!isAuthenticated && !email.trim()) {
      toast.error('Please add your email so we can follow up')
      return
    }
    setSubmitting(true)
    try {
      await complaintsApi.submit({
        category,
        subject: subject.trim(),
        message: message.trim(),
        ...(isAuthenticated ? {} : { name: name.trim() || undefined, email: email.trim() }),
      })
      toast.success('Complaint submitted — our team will review it shortly')
      setSubject('')
      setMessage('')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit complaint'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>
      <PageHeader
        eyebrow="We're listening"
        title={<>Help & <em>support</em></>}
        subtitle="Something wrong with a session or a counselor, or is something broken? Tell us — we review every report."
      />

      <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { to: '/chat', icon: MessageCircle, label: 'Chat', hint: 'Message your counselor' },
          { to: '/sessions', icon: Calendar, label: 'Sessions', hint: 'Book or manage sessions' },
          { to: '/counselors', icon: Users, label: 'Counselors', hint: 'Find a counselor' },
        ].map(({ to, icon: Icon, label, hint }) => (
          <Link
            key={to}
            to={to}
            className="card"
            style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sage-dark)',
            }}>
              <Icon size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{hint}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="settings-section-header" style={{ marginBottom: 16 }}>
            <LifeBuoy size={15} />
            <span>New complaint</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">This is about</label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {!isAuthenticated && (
              <>
                <div className="form-group">
                  <label className="form-label">Your name</label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Name" maxLength={120} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your email *</label>
                  <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                className="form-input"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Counselor cancelled without notice"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Details *</label>
              <textarea
                className="form-input"
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what happened. Include dates/times if you can."
                maxLength={5000}
              />
            </div>

            <button className="btn btn--primary" onClick={handleSubmit} disabled={submitting} style={{ alignSelf: 'flex-start', gap: 6 }}>
              <Send size={14} /> {submitting ? 'Submitting…' : 'Submit complaint'}
            </button>
          </div>
        </div>

        {isAuthenticated && myComplaints.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 12 }}>Your complaints</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myComplaints.map(c => (
                <div key={c._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{c.subject}</p>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                      background: c.status === 'resolved' ? 'var(--success-bg)' : c.status === 'in_progress' ? 'var(--beige)' : 'var(--error-bg)',
                      color: c.status === 'resolved' ? 'var(--success)' : c.status === 'in_progress' ? 'var(--text-secondary)' : 'var(--error)',
                    }}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })} · {c.category}
                  </p>
                  {!!c.resolutionNote && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--sage-dark)', marginTop: 8, background: 'var(--beige)', padding: 10, borderRadius: 'var(--radius)' }}>
                      {c.resolutionNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
