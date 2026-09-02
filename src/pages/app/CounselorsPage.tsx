import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Users, CheckCircle, MessageCircle } from 'lucide-react'
import { counselorsApi, getMediaUrl } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import Spinner from '../../components/shared/Spinner'
import toast from 'react-hot-toast'
import type { Counselor } from '../../types'
import { useNavigate } from 'react-router-dom'

export default function CounselorsPage() {
  const { user, isAuthenticated, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null)

  const hasAssigned = !!user?.assignedCounselor

  const { data, isLoading } = useQuery({
    queryKey: ['counselors'],
    queryFn: () => counselorsApi.getAll(),
  })

  const counselors: Counselor[] = data?.data?.data ?? []

  const requestMut = useMutation({
    mutationFn: (counselorId: string) => counselorsApi.request({ counselorId }),
    onSuccess: (res) => {
      toast.success('Counselor assigned! 💚')
      setUser({ ...user!, assignedCounselor: res.data.data.counselor })
      setSelectedCounselor(null)
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Request failed'))
    },
  })

  // If user already has a counselor, show their counselor profile
  if (hasAssigned && user?.assignedCounselor) {
    const c = user.assignedCounselor
    return (
      <div>
        <div className="feed-header">
          <p className="feed-header__greeting">Your support</p>
          <h1 className="feed-header__title">Your <em>counselor</em></h1>
        </div>

        <div style={{ padding: 16 }}>
          <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}>
            <Avatar src={getMediaUrl(c.avatar)} name={c.name} size="xl" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 4 }}>{c.name}</h2>
            {c.department && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--beige)', borderRadius: 20, fontSize: '0.875rem', color: 'var(--sage-dark)', fontWeight: 600, marginBottom: 12 }}>
                {c.department.icon} {c.department.name}
              </div>
            )}
            {c.bio && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{c.bio}</p>}

            {c.specializations && c.specializations.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
                {c.specializations.map(s => (
                  <span key={s} className="tag tag--sage">{s}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn--primary"
                style={{ flex: 1, gap: 8 }}
                onClick={() => navigate('/chat')}
              >
                <MessageCircle size={16} /> Message
              </button>
              <button
                className="btn btn--secondary"
                style={{ flex: 1, gap: 8 }}
                onClick={() => navigate('/sessions')}
              >
                📅 Book session
              </button>
            </div>
          </div>

          <div className="alert alert--info">
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>You are connected with {c.name}. They are here to support you on your journey.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="feed-header">
        <p className="feed-header__greeting">Find support</p>
        <h1 className="feed-header__title">Our <em>counselors</em></h1>
      </div>

      <div style={{ padding: '12px 16px 0', borderBottom: '1px solid var(--border-light)' }}>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Connect with a professional counselor. All sessions are confidential.
        </p>
      </div>

      {isLoading ? (
        <Spinner center />
      ) : (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {counselors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">👥</div>
              <p className="empty-state__title">No counselors available right now</p>
              <p className="empty-state__text">Please check back soon.</p>
            </div>
          ) : (
            counselors.map(c => (
              <div
                key={c._id}
                className="counselor-card card--hoverable"
                onClick={() => setSelectedCounselor(c)}
              >
                <Avatar src={getMediaUrl(c.avatar)} name={c.name} size="lg" />
                <div className="counselor-card__info">
                  <div className="counselor-card__name">{c.name}</div>
                  {c.department && (
                    <div className="counselor-card__dept">{c.department.icon} {c.department.name}</div>
                  )}
                  {c.bio && <p className="counselor-card__bio">{c.bio}</p>}
                  <div className="counselor-card__meta">
                    <span className={`counselor-card__badge ${c.isAvailable ? 'badge--available' : 'badge--unavailable'}`}>
                      {c.isAvailable ? '● Available' : '● Busy'}
                    </span>
                    {c.rating !== undefined && c.rating > 0 && (
                      <span className="rating">
                        <span className="rating__star">★</span>
                        {c.rating.toFixed(1)}
                      </span>
                    )}
                    {c.sessionCount !== undefined && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={12} /> {c.sessionCount} sessions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Counselor Detail Modal */}
      {selectedCounselor && (
        <div className="modal-overlay" onClick={() => setSelectedCounselor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__handle" />
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar src={getMediaUrl(selectedCounselor.avatar)} name={selectedCounselor.name} size="xl" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ marginBottom: 4 }}>{selectedCounselor.name}</h3>
              {selectedCounselor.department && (
                <span className="tag tag--sage">{selectedCounselor.department.icon} {selectedCounselor.department.name}</span>
              )}
            </div>

            {selectedCounselor.bio && (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16, fontSize: '0.9375rem' }}>
                {selectedCounselor.bio}
              </p>
            )}

            {selectedCounselor.specializations && selectedCounselor.specializations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Specializations</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedCounselor.specializations.map(s => (
                    <span key={s} className="tag tag--beige">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedCounselor.qualifications && selectedCounselor.qualifications.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Qualifications</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selectedCounselor.qualifications.map(q => (
                    <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={14} style={{ color: 'var(--sage)', flexShrink: 0 }} /> {q}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isAuthenticated ? (
              <button className="btn btn--primary btn--full btn--lg" onClick={() => navigate('/login')}>
                Sign in to connect
              </button>
            ) : selectedCounselor.isAvailable ? (
              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={() => requestMut.mutate(selectedCounselor._id)}
                disabled={requestMut.isPending}
              >
                {requestMut.isPending ? 'Connecting…' : `Connect with ${selectedCounselor.name.split(' ')[0]}`}
              </button>
            ) : (
              <div className="alert alert--error">This counselor is currently unavailable. Please choose another.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
