import { useQuery } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { adminApi } from '../../api'
import Spinner from '../shared/Spinner'
import { format } from 'date-fns'
import type { Subscriber } from '../../types'

export default function SubscribersPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: () => adminApi.getSubscribers({ limit: '100' }),
  })
  const subscribers: Subscriber[] = data?.data?.data ?? []
  const total = data?.data?.pagination?.total ?? subscribers.length

  const copyAll = () => {
    const emails = subscribers.map(s => s.email).join(', ')
    navigator.clipboard.writeText(emails).catch(() => {})
  }

  if (isLoading) return <Spinner center />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={18} style={{ color: 'var(--sage-dark)' }} />
          <span style={{ fontWeight: 600 }}>{total} subscriber{total === 1 ? '' : 's'}</span>
        </div>
        {subscribers.length > 0 && (
          <button className="btn btn--ghost btn--sm" onClick={copyAll}>Copy all emails</button>
        )}
      </div>

      {subscribers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true" />
          <p className="empty-state__title">No subscribers yet</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {subscribers.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
              <span>{s.email}</span>
              <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{format(new Date(s.createdAt), 'MMM d, yyyy')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
