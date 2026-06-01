import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, FileText, MessageCircle, Calendar, Shield, Building2, TrendingUp, CheckCircle, XCircle, Eye } from 'lucide-react'
import { adminApi } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import Spinner from '../../components/shared/Spinner'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

type AdminTab = 'overview' | 'users' | 'posts' | 'comments' | 'departments'

export default function AdminPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('')
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
    queryKey: ['admin-posts'],
    queryFn: () => adminApi.getAllPosts({ limit: '30' }),
    enabled: tab === 'posts',
  })

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-pending-comments'],
    queryFn: () => adminApi.getPendingComments({ limit: '30' }),
    enabled: tab === 'comments',
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

  const dash = dashData?.data?.data
  const adminUsers = usersData?.data?.data ?? []
  const adminPosts = postsData?.data?.data ?? []
  const pendingComments = commentsData?.data?.data ?? []
  const departments = deptsData?.data?.data ?? []

  const TABS: { key: AdminTab; label: string; icon: React.JSX.Element }[] = [
    { key: 'overview', label: 'Overview', icon: <TrendingUp size={15} /> },
    { key: 'users', label: 'Users', icon: <Users size={15} /> },
    { key: 'posts', label: 'Posts', icon: <FileText size={15} /> },
    { key: 'comments', label: 'Comments', icon: <MessageCircle size={15} /> },
  ]
  if (isSuperAdmin) {
    TABS.push({ key: 'departments', label: 'Departments', icon: <Building2 size={15} /> })
  }

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
              {dash?.recentPosts?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 14 }}>Recent Posts</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {dash.recentPosts.map((p: Record<string, unknown>) => (
                      <div key={p._id as string} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title as string}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>👁 {p.viewCount as number} · ❤️ {p.likeCount as number} · 💬 {p.commentCount as number}</p>
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
              adminUsers.map((u: Record<string, unknown>) => (
                <div key={u._id as string} className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar src={u.avatar as string | undefined} name={u.name as string} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name as string}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{u.email as string}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span className="tag tag--sage" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{u.role as string}</span>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                        background: u.status === 'active' ? 'var(--success-bg)' : u.status === 'suspended' ? 'var(--error-bg)' : 'var(--beige)',
                        color: u.status === 'active' ? 'var(--success)' : u.status === 'suspended' ? 'var(--error)' : 'var(--text-secondary)',
                      }}>{u.status as string}</span>
                    </div>
                  </div>
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '0.8125rem', padding: '6px 10px' }}
                    value={u.status as string}
                    onChange={e => statusMut.mutate({ id: u._id as string, status: e.target.value })}
                    disabled={u.role === 'super_admin'}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              ))
            )}
          </div>
        )}

        {/* POSTS */}
        {tab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {postsLoading ? <Spinner center /> : adminPosts.map((p: Record<string, unknown>) => {
              const author = p.author as Record<string, unknown>
              return (
                <div key={p._id as string} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4, lineHeight: 1.35 }}>{p.title as string}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>by {author?.name as string}</p>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
                      background: p.status === 'published' ? 'var(--success-bg)' : p.status === 'archived' ? 'var(--error-bg)' : 'var(--beige)',
                      color: p.status === 'published' ? 'var(--success)' : p.status === 'archived' ? 'var(--error)' : 'var(--text-secondary)',
                    }}>{p.status as string}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/posts/${p.slug}`)} style={{ gap: 4 }}>
                      <Eye size={13} /> View
                    </button>
                    {p.status !== 'published' && (
                      <button className="btn btn--secondary btn--sm" onClick={() => postStatusMut.mutate({ id: p._id as string, status: 'published' })}>
                        Publish
                      </button>
                    )}
                    {p.status === 'published' && (
                      <button className="btn btn--secondary btn--sm" onClick={() => postStatusMut.mutate({ id: p._id as string, status: 'archived' })}>
                        Archive
                      </button>
                    )}
                  </div>
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
                  <CheckCircle size={36} style={{ color: 'var(--sage)', marginBottom: 12 }} />
                  <p className="empty-state__title">All clear!</p>
                  <p className="empty-state__text">No pending comments to review.</p>
                </div>
              ) : (
                pendingComments.map((c: Record<string, unknown>) => {
                  const author = c.author as Record<string, unknown>
                  const post = c.post as Record<string, unknown>
                  return (
                    <div key={c._id as string} className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: 6 }}>
                        On: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{post?.title as string}</span>
                        {' · '}by <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{author?.name as string}</span>
                      </div>
                      <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: 12 }}>{c.content as string}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn--primary btn--sm"
                          style={{ gap: 6 }}
                          onClick={() => moderateMut.mutate({ id: c._id as string, status: 'approved' })}
                          disabled={moderateMut.isPending}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          style={{ gap: 6 }}
                          onClick={() => moderateMut.mutate({ id: c._id as string, status: 'rejected' })}
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
            {deptsLoading ? <Spinner center /> : departments.map((d: Record<string, unknown>) => {
              const dCounselors = d.counselors as unknown[]
              const dName = String(d.name ?? '')
              const dIcon = String(d.icon ?? '')
              const dColor = String(d.color ?? '#9CAF88')
              const dDescription = d.description ? String(d.description) : null
              const dActive = Boolean(d.isActive)
              const dId = String(d._id ?? '')
              return (
                <div key={dId} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${dColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      {dIcon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{dName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{dCounselors?.length ?? 0} counselors</div>
                    </div>
                    <span style={{
                      marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: dActive ? 'var(--success-bg)' : 'var(--error-bg)',
                      color: dActive ? 'var(--success)' : 'var(--error)',
                    }}>{dActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  {dDescription && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{dDescription}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
