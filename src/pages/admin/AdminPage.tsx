import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Users, FileText, MessageCircle, Calendar, Shield, Building2, TrendingUp, CheckCircle, XCircle, Eye, UserCog, Tag, Mail, BarChart3, Plus } from 'lucide-react'
import { adminApi, counselorsApi, getMediaUrl } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import Spinner from '../../components/shared/Spinner'
import TeamPanel from '../../components/admin/TeamPanel'
import CategoriesPanel from '../../components/admin/CategoriesPanel'
import SubscribersPanel from '../../components/admin/SubscribersPanel'
import AnalyticsPanel from '../../components/admin/AnalyticsPanel'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

type AdminTab = 'overview' | 'users' | 'posts' | 'sessions' | 'applications' | 'comments' | 'departments' | 'team' | 'categories' | 'subscribers' | 'analytics'
type AutoPublishedFilter = '' | 'true' | 'false'

interface DashboardData {
  stats?: {
    users?: { total?: number; newThisWeek?: number }
    counselors?: { total?: number }
    posts?: { total?: number }
    comments?: { pending?: number }
    sessions?: { total?: number }
  }
  recentPosts?: Array<{
    _id: string; title: string; slug: string
    viewCount: number; likeCount: number; commentCount: number
  }>
}

interface AdminUser {
  _id: string; name: string; email: string; avatar?: string; role: string; status: string
}

interface AdminPost {
  _id: string; title: string; slug: string; status: string
  autoPublished?: boolean; author?: { name?: string; isAuthor?: boolean }
}

interface PersonRef { _id?: string; name?: string; email?: string; avatar?: string }

interface QueueSession {
  _id: string; user?: PersonRef; requestedDate: string; description?: string
}

interface CounselorOption { _id: string; name: string }

interface Application {
  _id: string; user?: PersonRef; status: string; statement?: string; documents?: string[]
}

interface PendingComment {
  _id: string; content: string
  author?: { _id?: string; name?: string }
  post?: { title?: string; slug?: string }
}

interface AdminDept {
  _id: string; name: string; icon?: string; color?: string
  description?: string; isActive?: boolean; counselors?: unknown[]
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [autoPublished, setAutoPublished] = useState<AutoPublishedFilter>('')
  const [newDept, setNewDept] = useState({ name: '', description: '', icon: '', color: '#9CAF88' })
  const [promoteTarget, setPromoteTarget] = useState<AdminUser | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{ application: Application; status: 'approved' | 'rejected'; note: string } | null>(null)
  const isSuperAdmin = user?.role === 'super_admin'

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
    enabled: tab === 'overview',
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userSearch, userRole],
    queryFn: () => adminApi.getUsers({ search: userSearch, role: userRole, limit: '30' }),
    enabled: tab === 'users',
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts', autoPublished],
    queryFn: () => adminApi.getAllPosts({ limit: '30', ...(autoPublished ? { autoPublished } : {}) }),
    enabled: tab === 'posts',
  })

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-pending-comments'],
    queryFn: () => adminApi.getPendingComments({ limit: '30' }),
    enabled: tab === 'comments',
  })

  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => adminApi.getApplications({ limit: '30' }),
    enabled: tab === 'applications',
  })

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-sessions-queue'],
    queryFn: () => adminApi.getSessionQueue(),
    enabled: tab === 'sessions',
  })

  const { data: counselorsData } = useQuery({
    queryKey: ['counselors-list'],
    queryFn: () => counselorsApi.getAll({ limit: '100' }),
    enabled: tab === 'sessions',
  })

  const { data: deptsData, isLoading: deptsLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => adminApi.getDepartments(),
    enabled: tab === 'departments',
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
    onError: () => toast.error('Failed to update status'),
  })

  const postStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updatePostStatus(id, status),
    onSuccess: () => { toast.success('Post updated'); qc.invalidateQueries({ queryKey: ['admin-posts'] }) },
    onError: () => toast.error('Failed to update post'),
  })

  const moderateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => adminApi.moderateComment(id, status),
    onSuccess: () => { toast.success('Comment moderated'); qc.invalidateQueries({ queryKey: ['admin-pending-comments'] }) },
    onError: () => toast.error('Failed to moderate'),
  })

  const promoteMut = useMutation({
    mutationFn: (email: string) => adminApi.promoteToAdmin(email),
    onSuccess: () => {
      toast.success('User promoted to department admin')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Failed to promote user'))
    },
  })

  const assignSessionMut = useMutation({
    mutationFn: ({ id, counselorId }: { id: string; counselorId: string }) => adminApi.assignSession(id, counselorId),
    onSuccess: () => {
      toast.success('Counselor assigned')
      qc.invalidateQueries({ queryKey: ['admin-sessions-queue'] })
    },
    onError: () => toast.error('Failed to assign counselor'),
  })

  const reviewAppMut = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: 'approved' | 'rejected'; note?: string }) =>
      adminApi.reviewApplication(id, status, note),
    onSuccess: () => {
      toast.success('Application reviewed')
      qc.invalidateQueries({ queryKey: ['admin-applications'] })
    },
    onError: () => toast.error('Failed to review application'),
  })

  const createDeptMut = useMutation({
    mutationFn: () => adminApi.createDepartment({
      name: newDept.name,
      description: newDept.description || undefined,
      icon: newDept.icon || undefined,
      color: newDept.color || undefined,
    }),
    onSuccess: () => {
      toast.success('Department created')
      setNewDept({ name: '', description: '', icon: '', color: '#9CAF88' })
      qc.invalidateQueries({ queryKey: ['admin-departments'] })
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create department')),
  })

  const updateDeptMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminApi.updateDepartment(id, data),
    onSuccess: () => {
      toast.success('Department updated')
      qc.invalidateQueries({ queryKey: ['admin-departments'] })
    },
    onError: () => toast.error('Failed to update department'),
  })

  const dash: DashboardData | undefined = dashData?.data?.data
  const adminUsers: AdminUser[] = usersData?.data?.data ?? []
  const adminPosts: AdminPost[] = postsData?.data?.data ?? []
  const pendingComments: PendingComment[] = commentsData?.data?.data ?? []
  const queueSessions: QueueSession[] = sessionsData?.data?.data ?? []
  const counselorOptions: CounselorOption[] = counselorsData?.data?.data ?? []
  const applications: Application[] = applicationsData?.data?.data ?? []
  const departments: AdminDept[] = deptsData?.data?.data ?? []

  const baseTabs: { key: AdminTab; label: string; icon: React.JSX.Element }[] = [
    { key: 'overview', label: 'Overview', icon: <TrendingUp size={15} /> },
    { key: 'users', label: 'Users', icon: <Users size={15} /> },
    { key: 'posts', label: 'Posts', icon: <FileText size={15} /> },
    { key: 'sessions', label: 'Sessions', icon: <Calendar size={15} /> },
    { key: 'applications', label: 'Applications', icon: <FileText size={15} /> },
    { key: 'comments', label: 'Comments', icon: <MessageCircle size={15} /> },
    { key: 'subscribers', label: 'Subscribers', icon: <Mail size={15} /> },
  ]
  const adminTabs: { key: AdminTab; label: string; icon: React.JSX.Element }[] = [
    { key: 'team', label: 'Team', icon: <UserCog size={15} /> },
    { key: 'departments', label: 'Departments', icon: <Building2 size={15} /> },
    { key: 'categories', label: 'Categories', icon: <Tag size={15} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
  ]
  const TABS = isSuperAdmin ? [...baseTabs, ...adminTabs] : baseTabs

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', background: 'linear-gradient(135deg, var(--sage-light) 0%, var(--beige-warm) 100%)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Shield size={20} style={{ color: 'var(--sage-dark)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Admin Dashboard</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                border: 'none', background: tab === t.key ? 'var(--white)' : 'transparent',
                fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.8125rem',
                color: tab === t.key ? 'var(--sage-dark)' : 'var(--text-secondary)',
                borderRadius: '8px 8px 0 0', cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: tab === t.key ? '2px solid var(--sage)' : '2px solid transparent',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* OVERVIEW */}
        {tab === 'overview' && (
          dashLoading ? <Spinner center /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { label: 'Active Users', value: dash?.stats?.users?.total ?? 0, icon: <Users size={20} />, color: 'var(--sage)' },
                  { label: 'Counselors', value: dash?.stats?.counselors?.total ?? 0, icon: <Shield size={20} />, color: 'var(--sage-dark)' },
                  { label: 'Published Posts', value: dash?.stats?.posts?.total ?? 0, icon: <FileText size={20} />, color: '#E67E22' },
                  { label: 'Pending Comments', value: dash?.stats?.comments?.pending ?? 0, icon: <MessageCircle size={20} />, color: '#E74C3C' },
                  { label: 'Total Sessions', value: dash?.stats?.sessions?.total ?? 0, icon: <Calendar size={20} />, color: 'var(--beige-rich)' },
                  { label: 'New This Week', value: dash?.stats?.users?.newThisWeek ?? 0, icon: <TrendingUp size={20} />, color: '#27AE60' },
                ].map(stat => (
                  <div key={stat.label} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
                      {stat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent posts */}
              {(dash?.recentPosts?.length ?? 0) > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 14 }}>Recent Posts</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {dash?.recentPosts?.map((p) => (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>👁 {p.viewCount} · ❤️ {p.likeCount} · 💬 {p.commentCount}</p>
                        </div>
                        <button className="btn btn--ghost btn--icon" onClick={() => navigate(`/posts/${p.slug}`)}>
                          <Eye size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="search"
                className="form-input"
                placeholder="Search name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <select className="form-input" style={{ width: 'auto' }} value={userRole} onChange={e => setUserRole(e.target.value)}>
                <option value="">All roles</option>
                <option value="user">Users</option>
                <option value="counselor">Counselors</option>
                <option value="department_admin">Dept Admins</option>
              </select>
            </div>

            {usersLoading ? <Spinner center /> : (
              adminUsers.map((u) => (
                <div key={u._id} className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar src={getMediaUrl(u.avatar)} name={u.name} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{u.email}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span className="tag tag--sage" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{u.role}</span>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                        background: u.status === 'active' ? 'var(--success-bg)' : u.status === 'suspended' ? 'var(--error-bg)' : 'var(--beige)',
                        color: u.status === 'active' ? 'var(--success)' : u.status === 'suspended' ? 'var(--error)' : 'var(--text-secondary)',
                      }}>{u.status}</span>
                    </div>
                  </div>
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '0.8125rem', padding: '6px 10px' }}
                    value={u.status}
                    onChange={e => statusMut.mutate({ id: u._id, status: e.target.value })}
                    disabled={u.role === 'super_admin'}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  {u._id !== user?._id && !['super_admin', 'department_admin'].includes(u.role) && (
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => setPromoteTarget(u)}
                      disabled={promoteMut.isPending}
                    >
                      Grant admin
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* POSTS */}
        {tab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select
              className="form-input"
              style={{ width: 'auto', alignSelf: 'flex-start' }}
              value={autoPublished}
              onChange={e => setAutoPublished(e.target.value as AutoPublishedFilter)}
            >
              <option value="">All posts</option>
              <option value="true">Auto-published (Authors)</option>
              <option value="false">Manually approved</option>
            </select>
            {postsLoading ? <Spinner center /> : adminPosts.map((p) => {
              const author = p.author
              return (
                <div key={p._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4, lineHeight: 1.35 }}>{p.title}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        by {author?.name}
                        {author?.isAuthor && <span className="author-badge author-badge--sm">Author</span>}
                      </p>
                      {p.autoPublished === true && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--sage-dark)', marginTop: 2 }}>✍️ Auto-published by author</p>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
                      background: p.status === 'published' ? 'var(--success-bg)' : p.status === 'archived' || p.status === 'rejected' ? 'var(--error-bg)' : 'var(--beige)',
                      color: p.status === 'published' ? 'var(--success)' : p.status === 'archived' || p.status === 'rejected' ? 'var(--error)' : 'var(--text-secondary)',
                    }}>{p.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/posts/${p.slug}`)} style={{ gap: 4 }}>
                      <Eye size={13} /> View
                    </button>
                    {p.status !== 'published' && (
                      <>
                        <button className="btn btn--secondary btn--sm" onClick={() => postStatusMut.mutate({ id: p._id, status: 'published' })}>
                          Publish
                        </button>
                        {p.status !== 'rejected' && (
                          <button className="btn btn--danger btn--sm" onClick={() => postStatusMut.mutate({ id: p._id, status: 'rejected' })}>
                            Reject
                          </button>
                        )}
                      </>
                    )}
                    {p.status === 'published' && (
                      <button className="btn btn--secondary btn--sm" onClick={() => postStatusMut.mutate({ id: p._id, status: 'archived' })}>
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SESSIONS */}
        {tab === 'sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessionsLoading ? <Spinner center /> : queueSessions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon" aria-hidden="true" />
                <p className="empty-state__title">Queue clear</p>
                <p className="empty-state__text">No pending appointment requests.</p>
              </div>
            ) : queueSessions.map((s) => {
              const u = s.user
              return (
                <div key={s._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <Avatar src={getMediaUrl(u?.avatar)} name={u?.name ?? '?'} size="md" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>{u?.name}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{u?.email}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {format(new Date(s.requestedDate), 'EEEE, MMMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  {!!s.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--beige)', padding: 10, borderRadius: 'var(--radius)', marginBottom: 12, lineHeight: 1.6 }}>
                      {s.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.875rem' }}
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) assignSessionMut.mutate({ id: s._id, counselorId: e.target.value })
                      }}
                      disabled={assignSessionMut.isPending}
                    >
                      <option value="" disabled>Assign counselor…</option>
                      {counselorOptions.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* APPLICATIONS */}
        {tab === 'applications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {applicationsLoading ? <Spinner center /> : applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon" aria-hidden="true" />
                <p className="empty-state__title">No applications</p>
                <p className="empty-state__text">No counselor applications to review.</p>
              </div>
            ) : applications.map((a) => {
              const u = a.user
              return (
                <div key={a._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <Avatar src={getMediaUrl(u?.avatar)} name={u?.name ?? '?'} size="md" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>{u?.name}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{u?.email}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>Status: {a.status}</p>
                    </div>
                  </div>
                  {!!a.statement && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--beige)', padding: 10, borderRadius: 'var(--radius)', marginBottom: 12, lineHeight: 1.6 }}>
                      {a.statement}
                    </p>
                  )}
                  {(a.documents?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {a.documents?.map((d, i) => (
                        <a key={i} href={getMediaUrl(d)} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                          Document {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  {a.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => setReviewTarget({ application: a, status: 'approved', note: '' })}
                        disabled={reviewAppMut.isPending}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => setReviewTarget({ application: a, status: 'rejected', note: '' })}
                        disabled={reviewAppMut.isPending}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* COMMENTS */}
        {tab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {commentsLoading ? <Spinner center /> : (
              pendingComments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon" aria-hidden="true" />
                  <p className="empty-state__title">All clear!</p>
                  <p className="empty-state__text">No pending comments to review.</p>
                </div>
              ) : (
                pendingComments.map((c) => {
                  const author = c.author
                  const post = c.post
                  return (
                    <div key={c._id} className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: 6 }}>
                        On: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{post?.title}</span>
                        {' · '}by <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{author?.name}</span>
                      </div>
                      <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: 12 }}>{c.content}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn--primary btn--sm"
                          style={{ gap: 6 }}
                          onClick={() => moderateMut.mutate({ id: c._id, status: 'approved' })}
                          disabled={moderateMut.isPending}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          style={{ gap: 6 }}
                          onClick={() => moderateMut.mutate({ id: c._id, status: 'rejected' })}
                          disabled={moderateMut.isPending}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )
                })
              )
            )}
          </div>
        )}

        {/* DEPARTMENTS */}
        {tab === 'departments' && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 12 }}>New department</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="form-input" placeholder="Name" value={newDept.name} onChange={e => setNewDept(d => ({ ...d, name: e.target.value }))} />
                <input className="form-input" placeholder="Description (optional)" value={newDept.description} onChange={e => setNewDept(d => ({ ...d, description: e.target.value }))} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="form-input" style={{ flex: 1 }} placeholder="Icon (emoji)" value={newDept.icon} onChange={e => setNewDept(d => ({ ...d, icon: e.target.value }))} />
                  <input type="color" value={newDept.color} onChange={e => setNewDept(d => ({ ...d, color: e.target.value }))} style={{ width: 48, height: 40, border: '1px solid var(--border)', borderRadius: 8, background: 'none' }} />
                </div>
                <button className="btn btn--primary" style={{ alignSelf: 'flex-start', gap: 6 }} disabled={createDeptMut.isPending || !newDept.name.trim()} onClick={() => createDeptMut.mutate()}>
                  <Plus size={15} /> {createDeptMut.isPending ? 'Adding…' : 'Add department'}
                </button>
              </div>
            </div>

            {deptsLoading ? <Spinner center /> : departments.map((d) => {
              const dCounselors = d.counselors
              const dName = d.name ?? ''
              const dIcon = d.icon ?? ''
              const dColor = d.color ?? '#9CAF88'
              const dDescription = d.description ? d.description : null
              const dActive = Boolean(d.isActive)
              return (
                <div key={d._id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${dColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      {dIcon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{dName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{dCounselors?.length ?? 0} counselors</div>
                    </div>
                    <button
                      onClick={() => updateDeptMut.mutate({ id: d._id, data: { isActive: !dActive } })}
                      disabled={updateDeptMut.isPending}
                      className="btn btn--ghost btn--sm"
                      style={{ marginLeft: 'auto', fontWeight: 600, color: dActive ? 'var(--success)' : 'var(--text-light)' }}
                    >{dActive ? 'Active' : 'Inactive'}</button>
                  </div>
                  {dDescription && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{dDescription}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* TEAM (super admin) */}
        {tab === 'team' && isSuperAdmin && <TeamPanel />}

        {/* CATEGORIES (super admin) */}
        {tab === 'categories' && isSuperAdmin && <CategoriesPanel />}

        {/* SUBSCRIBERS */}
        {tab === 'subscribers' && <SubscribersPanel />}

        {/* ANALYTICS (super admin) */}
        {tab === 'analytics' && isSuperAdmin && <AnalyticsPanel />}
      </div>

      {/* Promote confirmation modal */}
      {promoteTarget && (
        <div className="modal-overlay modal-overlay--center" onClick={() => setPromoteTarget(null)}>
          <div className="modal modal--center" onClick={e => e.stopPropagation()}>
            <div className="modal__handle" />
            <h3 className="modal__title">Grant admin access?</h3>
            <p className="modal__subtitle">
              Promote <strong>{promoteTarget.name}</strong> to department admin?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn--secondary" onClick={() => setPromoteTarget(null)}>Cancel</button>
              <button
                className="btn btn--primary"
                disabled={promoteMut.isPending}
                onClick={() => { promoteMut.mutate(promoteTarget.email); setPromoteTarget(null) }}
              >
                {promoteMut.isPending ? 'Promoting…' : 'Promote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application review modal */}
      {reviewTarget && (
        <div className="modal-overlay modal-overlay--center" onClick={() => setReviewTarget(null)}>
          <div className="modal modal--center" onClick={e => e.stopPropagation()}>
            <div className="modal__handle" />
            <h3 className="modal__title">{reviewTarget.status === 'approved' ? 'Approve' : 'Reject'} application</h3>
            <p className="modal__subtitle">
              {reviewTarget.status === 'approved'
                ? 'Add an optional note for the applicant.'
                : 'Add an optional reason for rejection.'}
            </p>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Note</label>
              <textarea
                className="form-input"
                rows={3}
                value={reviewTarget.note}
                onChange={e => setReviewTarget(t => t ? { ...t, note: e.target.value } : null)}
                placeholder={reviewTarget.status === 'approved' ? 'Optional note…' : 'Optional reason…'}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn--secondary" onClick={() => setReviewTarget(null)}>Cancel</button>
              <button
                className={`btn ${reviewTarget.status === 'approved' ? 'btn--primary' : 'btn--danger'}`}
                disabled={reviewAppMut.isPending}
                onClick={() => {
                  reviewAppMut.mutate({ id: reviewTarget.application._id, status: reviewTarget.status, note: reviewTarget.note })
                  setReviewTarget(null)
                }}
              >
                {reviewAppMut.isPending ? 'Saving…' : reviewTarget.status === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
