import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Star, X } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { sessionsApi, getMediaUrl } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import Spinner from '../../components/shared/Spinner'
import toast from 'react-hot-toast'
import type { Session } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  pending: '#E67E22',
  approved: '#3498DB',
  scheduled: 'var(--sage)',
  active: '#27AE60',
  completed: 'var(--text-light)',
  cancelled: 'var(--error)',
}

export default function SessionsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [ratingSession, setRatingSession] = useState<Session | null>(null)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', filter],
    queryFn: () => sessionsApi.getMy(filter !== 'all' ? { status: filter } : {}),
  })
  const sessions: Session[] = data?.data?.data ?? []

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => sessionsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Session cancelled')
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: () => toast.error('Failed to cancel'),
  })

  const rateMut = useMutation({
    mutationFn: ({ id, rating, feedback }: { id: string; rating: number; feedback: string }) =>
      sessionsApi.rate(id, { rating, feedback }),
    onSuccess: () => {
      toast.success('Thank you for your feedback!')
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setRatingSession(null)
      setRating(0)
      setFeedback('')
    },
    onError: () => toast.error('Failed to submit rating'),
  })

  const [showRequest, setShowRequest] = useState(false)
  const [requestedDate, setRequestedDate] = useState('')
  const [requestDesc, setRequestDesc] = useState('')
  const [emotionalState, setEmotionalState] = useState('')
  const [preferredSupport, setPreferredSupport] = useState<'call' | 'chat' | 'follow-up' | ''>('')
  const [availabilityText, setAvailabilityText] = useState('')

  const requestMut = useMutation({
    mutationFn: () => sessionsApi.requestAppointment({
      requestedDate: new Date(requestedDate).toISOString(),
      description: requestDesc,
      emotionalState,
      preferredSupportType: preferredSupport || undefined,
      availability: availabilityText,
    }),
    onSuccess: () => {
      toast.success('Appointment request sent')
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setShowRequest(false)
      setRequestedDate('')
      setRequestDesc('')
      setEmotionalState('')
      setPreferredSupport('')
      setAvailabilityText('')
    },
    onError: () => toast.error('Failed to request appointment'),
  })

  const isUser = user?.role === 'user'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ padding: '20px 16px 12px' }}>
        <h2 style={{ marginBottom: 4 }}>Sessions</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isUser ? 'Your counseling sessions' : 'Sessions with your clients'}
        </p>
      </div>

      {/* Request + Filter */}
      <div style={{ padding: '0 16px 12px' }}>
        {isUser && (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => setShowRequest(s => !s)}
            style={{ marginBottom: 12, width: '100%' }}
          >
            {showRequest ? 'Close' : 'Request appointment'}
          </button>
        )}

        {showRequest && (
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Preferred date & time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={requestedDate}
                onChange={e => setRequestedDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">What would you like support with? <span style={{ color: 'var(--text-light)' }}>(optional)</span></label>
              <textarea
                className="form-input"
                rows={3}
                value={requestDesc}
                onChange={e => setRequestDesc(e.target.value)}
                placeholder="Briefly describe your situation…"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">How are you feeling right now? <span style={{ color: 'var(--text-light)' }}>(optional, private)</span></label>
              <textarea
                className="form-input"
                rows={3}
                value={emotionalState}
                onChange={e => setEmotionalState(e.target.value)}
                placeholder="Shared privately with your assigned counselor…"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Preferred support type <span style={{ color: 'var(--text-light)' }}>(optional)</span></label>
              <select
                className="form-input"
                value={preferredSupport}
                onChange={e => setPreferredSupport(e.target.value as 'call' | 'chat' | 'follow-up' | '')}
              >
                <option value="">No preference</option>
                <option value="call">Call</option>
                <option value="chat">Chat</option>
                <option value="follow-up">Follow-up later</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Availability <span style={{ color: 'var(--text-light)' }}>(optional)</span></label>
              <input
                type="text"
                className="form-input"
                value={availabilityText}
                onChange={e => setAvailabilityText(e.target.value)}
                placeholder="e.g. Weekday evenings"
              />
            </div>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => requestMut.mutate()}
              disabled={!requestedDate || requestMut.isPending}
            >
              {requestMut.isPending ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="feed-filters">
        {['all', 'pending', 'approved', 'scheduled', 'completed', 'cancelled'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <Spinner center />}

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isLoading && sessions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon" aria-hidden="true" />
            <p className="empty-state__title">No sessions found</p>
            <p className="empty-state__text">
              {isUser ? 'Connect with a counselor to schedule your first session.' : 'You have no sessions in this category.'}
            </p>
          </div>
        )}

        {sessions.map(session => {
          const peer = isUser
            ? (session.counselor ?? { name: 'Pending assignment', avatar: undefined })
            : session.user
          const date = session.scheduledAt || session.requestedDate
          const past = isPast(new Date(date))
          const canCancel = ['pending', 'approved', 'scheduled', 'active'].includes(session.status) && !past
          const canRate = isUser && session.status === 'completed' && !session.rating

          return (
            <div key={session._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <Avatar src={getMediaUrl(peer?.avatar)} name={peer?.name ?? '?'} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>{peer?.name}</div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                    background: `${STATUS_COLORS[session.status]}20`,
                    color: STATUS_COLORS[session.status],
                  }}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} style={{ flexShrink: 0, color: 'var(--sage)' }} />
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} style={{ flexShrink: 0, color: 'var(--sage)' }} />
                  {format(new Date(date), 'h:mm a')} · {session.duration ?? 60} minutes
                </div>
              </div>

              {session.description && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--beige)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 14, lineHeight: 1.6 }}>
                  {session.description}
                </div>
              )}

              {session.emotionalState && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--lavender)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 14, lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>How they feel:</strong> {session.emotionalState}
                </div>
              )}

              {session.notes && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--beige)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 14, lineHeight: 1.6 }}>
                  {session.notes}
                </div>
              )}

              {session.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#F59E0B', marginBottom: 10 }}>
                  {'★'.repeat(session.rating)}{'☆'.repeat(5 - session.rating)}
                  {session.feedback && <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{session.feedback}"</span>}
                </div>
              )}

              {session.cancelReason && (
                <div className="alert alert--error" style={{ marginBottom: 10, fontSize: '0.8125rem' }}>
                  Cancellation reason: {session.cancelReason}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {canCancel && (
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => {
                      const reason = prompt('Reason for cancellation (optional):') ?? ''
                      cancelMut.mutate({ id: session._id, reason })
                    }}
                    style={{ gap: 6 }}
                  >
                    <X size={14} /> Cancel
                  </button>
                )}
                {canRate && (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => setRatingSession(session)}
                    style={{ gap: 6 }}
                  >
                    <Star size={14} /> Rate session
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Rating Modal */}
      {ratingSession && (
        <div className="modal-overlay" onClick={() => setRatingSession(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__handle" />
            <h3 className="modal__title">Rate your session</h3>
            <p className="modal__subtitle">How was your session with {ratingSession.counselor?.name ?? 'your counselor'}?</p>

            <div className="star-rating" style={{ justifyContent: 'center', marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  className={`star-rating__star ${s <= rating ? 'star-rating__star--filled' : ''}`}
                  onClick={() => setRating(s)}
                  type="button"
                >★</button>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Feedback (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Share your experience…"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setRatingSession(null)}>Cancel</button>
              <button
                className="btn btn--primary"
                style={{ flex: 1 }}
                disabled={!rating || rateMut.isPending}
                onClick={() => rateMut.mutate({ id: ratingSession._id, rating, feedback })}
              >
                {rateMut.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
