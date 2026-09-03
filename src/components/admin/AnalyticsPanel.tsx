import { useQuery } from '@tanstack/react-query'
import { Users, FileText, Download, Mail, BookOpen, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api'
import Spinner from '../shared/Spinner'

interface Analytics {
  usersByRole: Record<string, number>
  postsByStatus: Record<string, number>
  totalDownloads: number
  subscribers: number
  totalWorks: number
  topPosts: Array<{ _id: string; title: string; slug: string; viewCount: number; likeCount: number; commentCount: number }>
}

export default function AnalyticsPanel() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.getAnalytics(),
  })
  const a: Analytics | undefined = data?.data?.data

  if (isLoading) return <Spinner center />
  if (!a) return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true" />
      <p className="empty-state__title">No analytics available</p>
    </div>
  )

  const roleEntries = Object.entries(a.usersByRole || {})
  const statusEntries = Object.entries(a.postsByStatus || {})

  const cards = [
    { label: 'EPUB downloads', value: a.totalDownloads, icon: <Download size={18} />, color: 'var(--sage-dark)' },
    { label: 'Library works', value: a.totalWorks, icon: <BookOpen size={18} />, color: '#E67E22' },
    { label: 'Subscribers', value: a.subscribers, icon: <Mail size={18} />, color: '#27AE60' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {cards.map(c => (
          <div key={c.label} className="card" style={{ padding: 16 }}>
            <div style={{ color: c.color, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{c.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} /> Users by role</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {roleEntries.length === 0 ? <span style={{ color: 'var(--text-light)' }}>No data</span> : roleEntries.map(([role, count]) => (
            <span key={role} className="tag tag--sage" style={{ fontSize: '0.8rem' }}>{role}: <strong>{count}</strong></span>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /> Posts by status</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {statusEntries.length === 0 ? <span style={{ color: 'var(--text-light)' }}>No data</span> : statusEntries.map(([status, count]) => (
            <span key={status} className="tag tag--beige" style={{ fontSize: '0.8rem' }}>{status}: <strong>{count}</strong></span>
          ))}
        </div>
      </div>

      {a.topPosts?.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginBottom: 12 }}>Top posts by views</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {a.topPosts.map(p => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>👁 {p.viewCount} · ❤️ {p.likeCount} · 💬 {p.commentCount}</p>
                </div>
                <button className="btn btn--ghost btn--icon" onClick={() => navigate(`/posts/${p.slug}`)}><Eye size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
