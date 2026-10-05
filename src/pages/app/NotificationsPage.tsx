import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Star, Check, Heart, MessageCircle, UserCheck, Calendar, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { userApi } from '../../api'
import Spinner from '../../components/shared/Spinner'
import PageHeader from '../../components/shared/PageHeader'
import type { Notification } from '../../types'
import { useNavigate } from 'react-router-dom'

const ICON_MAP: Record<string, React.ReactNode> = {
  post_like: <Heart size={16} style={{ color: '#E74C3C' }} />,
  post_comment: <MessageCircle size={16} style={{ color: 'var(--sage-dark)' }} />,
  new_user_assigned: <UserCheck size={16} style={{ color: 'var(--sage)' }} />,
  session_scheduled: <Calendar size={16} style={{ color: 'var(--sage-dark)' }} />,
  session_cancelled: <AlertCircle size={16} style={{ color: 'var(--warning)' }} />,
  new_message: <MessageCircle size={16} style={{ color: 'var(--sage)' }} />,
  account_suspended: <AlertCircle size={16} style={{ color: 'var(--error)' }} />,
  author_promotion: <Star size={16} style={{ color: '#F59E0B' }} />,
  session_approved: <Calendar size={16} style={{ color: 'var(--sage)' }} />,
  session_assigned: <Calendar size={16} style={{ color: 'var(--sage-dark)' }} />,
  role_changed: <Star size={16} style={{ color: '#F59E0B' }} />,
  application_approved: <Check size={16} style={{ color: 'var(--success)' }} />,
  application_rejected: <AlertCircle size={16} style={{ color: 'var(--error)' }} />,
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: () => userApi.getNotifications({ limit: '50' }),
  })

  const notifications: Notification[] = data?.data?.data?.notifications ?? []
  const unread = data?.data?.data?.unreadCount ?? 0

  const markAllMut = useMutation({
    mutationFn: () => userApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markOneMut = useMutation({
    mutationFn: (id: string) => userApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleClick = (n: Notification) => {
    if (!n.isRead) markOneMut.mutate(n._id)
    const d = n.data as Record<string, string> | undefined
    if (n.type === 'post_like' || n.type === 'post_comment') {
      if (d?.postSlug) navigate(`/posts/${d.postSlug}`)
    } else if (n.type === 'new_message') {
      navigate('/chat')
    } else if (n.type === 'session_scheduled' || n.type === 'session_cancelled') {
      navigate('/sessions')
    }
  }

  return (
    <div>
      {/* Header */}
      <PageHeader
        eyebrow="Stay in the loop"
        title={<>Your <em>notifications</em></>}
        subtitle={unread > 0
          ? `You have ${unread} unread update${unread === 1 ? '' : 's'}: replies, session changes and more.`
          : 'Replies, session updates, and everything worth knowing. All in one place.'}
      >
        {unread > 0 && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            style={{ gap: 6, color: 'var(--sage-dark)', background: 'var(--white)' }}
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </PageHeader>

      {isLoading && <Spinner center />}

      {!isLoading && notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true" />
          <p className="empty-state__title">No notifications yet</p>
          <p className="empty-state__text">We'll let you know when something happens.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {notifications.map(n => (
          <button
            key={n._id}
            onClick={() => handleClick(n)}
            style={{
              display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px',
              background: n.isRead ? 'transparent' : 'rgba(156,175,136,0.07)',
              border: 'none', borderBottom: '1px solid var(--border-light)',
              fontFamily: 'var(--font)', cursor: 'pointer', textAlign: 'left',
              width: '100%', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--beige)')}
            onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(156,175,136,0.07)')}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--beige-warm)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              {ICON_MAP[n.type] ?? <Bell size={16} style={{ color: 'var(--text-light)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.9375rem', marginBottom: 2, color: 'var(--text-primary)' }}>
                {n.title}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </div>
            {!n.isRead && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0, marginTop: 6 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
