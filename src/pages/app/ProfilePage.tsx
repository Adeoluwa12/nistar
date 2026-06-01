import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, LogOut, Settings, ChevronRight, BookOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { postsApi, userApi, authApi } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import PostCard from '../../components/posts/PostCard'
import toast from 'react-hot-toast'
import type { Post } from '../../types'

export default function ProfilePage() {
  const { user, setUser, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'posts' | 'settings'>('posts')
  const [editBio, setEditBio] = useState(user?.bio ?? '')
  const [editName, setEditName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['my-posts'],
    queryFn: () => postsApi.myPosts({ limit: '20' }),
    enabled: tab === 'posts',
  })
  const myPosts: Post[] = postsData?.data?.data ?? []

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      const { data } = await userApi.updateProfile(fd)
      setUser(data.data)
      toast.success('Photo updated!')
    } catch { toast.error('Failed to update photo') }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', editName)
      fd.append('bio', editBio)
      const { data } = await userApi.updateProfile(fd)
      setUser(data.data)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to save changes') }
    finally { setSaving(false) }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { /* silent */ }
    clearAuth()
    navigate('/login')
    toast.success('Signed out')
  }

  if (!user) return null

  return (
    <div>
      {/* Profile header */}
      <div className="profile-header">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Avatar src={user.avatar} name={user.name} size="xl" />
          <button
            className="btn btn--icon"
            style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--sage)', color: '#fff', width: 28, height: 28,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <h2 className="profile-header__name">{user.name}</h2>
        <div className="profile-header__role">
          {user.role === 'super_admin' ? '⭐ Super Admin'
            : user.role === 'department_admin' ? '🛡 Department Admin'
            : user.role === 'counselor' ? '💚 Counselor'
            : '🌱 Community Member'}
        </div>
        {user.bio && <p className="profile-header__bio">{user.bio}</p>}
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat__value">{myPosts.length}</div>
          <div className="profile-stat__label">Posts</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat__value">
            {myPosts.reduce((s, p) => s + p.likeCount, 0)}
          </div>
          <div className="profile-stat__label">Likes</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat__value">
            {myPosts.reduce((s, p) => s + p.commentCount, 0)}
          </div>
          <div className="profile-stat__label">Comments</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
        {[
          { key: 'posts', label: 'My Posts', icon: <BookOpen size={15} /> },
          { key: 'settings', label: 'Settings', icon: <Settings size={15} /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'posts' | 'settings')}
            style={{
              flex: 1, padding: '14px 8px', border: 'none', background: 'none',
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.9rem',
              color: tab === t.key ? 'var(--sage-dark)' : 'var(--text-light)',
              borderBottom: tab === t.key ? '2px solid var(--sage)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', transition: 'color 0.2s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div style={{ padding: 16 }}>
          {postsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />)}
            </div>
          ) : myPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">✏️</div>
              <p className="empty-state__title">No posts yet</p>
              <p className="empty-state__text">Share your first story with the community.</p>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => navigate('/posts/new')}>
                Write a post
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myPosts.map(p => <PostCard key={p._id} post={p} />)}
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginBottom: 16 }}>Edit Profile</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Display name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Tell the community a bit about yourself…"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  maxLength={500}
                />
              </div>
              <button className="btn btn--primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              { label: 'Change password', onClick: () => navigate('/change-password'), icon: '🔒' },
              ...(user.role === 'super_admin' || user.role === 'department_admin'
                ? [{ label: 'Admin dashboard', onClick: () => navigate('/admin'), icon: '⚙️' }]
                : []),
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 20px', border: 'none', background: 'none', fontFamily: 'var(--font)',
                  fontSize: '0.9375rem', color: 'var(--text-primary)', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-light)', textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--beige)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <ChevronRight size={16} style={{ color: 'var(--text-light)' }} />
              </button>
            ))}
          </div>

          <button
            className="btn btn--danger btn--full"
            onClick={handleLogout}
            style={{ gap: 8, marginTop: 8 }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
