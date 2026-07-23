import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera, LogOut, Settings, ChevronRight, BookOpen,
  User, Mail, Shield, Lock, Star, CheckCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { postsApi, userApi, authApi, getMediaUrl } from '../../api'
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
  const [uploading, setUploading] = useState(false)
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    const fd = new FormData()
    fd.append('image', file)
    setUploading(true)
    try {
      const { data } = await userApi.updateProfile(fd)
      setUser(data.data)
      toast.success('Profile photo updated!')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to update photo — please try again'
      toast.error(msg)
    } finally {
      setUploading(false)
      // reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) { toast.error('Display name cannot be empty'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', editName.trim())
      fd.append('bio', editBio)
      const { data } = await userApi.updateProfile(fd)
      setUser(data.data)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { /* silent */ }
    clearAuth()
    navigate('/login')
    toast.success('Signed out')
  }

  const roleLabel = user?.role === 'super_admin' ? '⭐ Super Admin'
    : user?.role === 'department_admin' ? '🛡 Department Admin'
    : user?.role === 'counselor' ? '💚 Counselor'
    : '🌱 Community Member'

  if (!user) return null

  return (
    <div>
      {/* Profile header */}
      <div className="profile-header">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Avatar src={getMediaUrl(user.avatar)} name={user.name} size="xl" />
          <button
            className="btn btn--icon"
            style={{
              position: 'absolute', bottom: 0, right: 0,
              background: uploading ? 'var(--text-light)' : 'var(--sage)',
              color: '#fff', width: 28, height: 28,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'background 0.2s',
            }}
            onClick={() => !uploading && fileRef.current?.click()}
            disabled={uploading}
            title={uploading ? 'Uploading…' : 'Change photo'}
          >
            {uploading
              ? <span className="spinner spinner--sm" style={{ width: 12, height: 12, borderTopColor: '#fff', borderWidth: 2 }} />
              : <Camera size={14} />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>
        <h2 className="profile-header__name">{user.name}</h2>
        <div className="profile-header__role">{roleLabel}</div>
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

          {/* Account info card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="settings-section-header">
              <User size={15} />
              <span>Account Information</span>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Email (read-only) */}
              <div className="settings-info-row">
                <div className="settings-info-row__left">
                  <Mail size={14} className="settings-info-row__icon" />
                  <div>
                    <div className="settings-info-row__label">Email address</div>
                    <div className="settings-info-row__value">{user.email}</div>
                  </div>
                </div>
                {user.isEmailVerified && (
                  <span className="settings-badge settings-badge--verified">
                    <CheckCircle size={11} /> Verified
                  </span>
                )}
              </div>
              {/* Role */}
              <div className="settings-info-row">
                <div className="settings-info-row__left">
                  <Star size={14} className="settings-info-row__icon" />
                  <div>
                    <div className="settings-info-row__label">Role</div>
                    <div className="settings-info-row__value">{roleLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile photo card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="settings-section-header">
              <Camera size={15} />
              <span>Profile Photo</span>
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar src={getMediaUrl(user.avatar)} name={user.name} size="lg" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                    JPG, PNG, WebP or GIF · Max 10 MB
                  </p>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading
                      ? <><span className="spinner spinner--sm" style={{ width: 12, height: 12, borderWidth: 2 }} /> Uploading…</>
                      : <><Camera size={14} /> Change photo</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Edit profile card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="settings-section-header">
              <User size={15} />
              <span>Edit Profile</span>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">Display name</label>
                <input
                  id="prof-name"
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="prof-bio">Bio</label>
                <textarea
                  id="prof-bio"
                  className="form-input"
                  rows={3}
                  placeholder="Tell the community a bit about yourself…"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  maxLength={500}
                />
                <span className="form-hint" style={{ textAlign: 'right' }}>
                  {editBio.length}/500
                </span>
              </div>
              <button
                id="save-profile-btn"
                className="btn btn--primary"
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                {saving
                  ? <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff', width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                  : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Security card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="settings-section-header">
              <Shield size={15} />
              <span>Security</span>
            </div>
            <div>
              {[
                {
                  label: 'Change password',
                  sub: 'Update your account password',
                  onClick: () => navigate('/change-password'),
                  icon: <Lock size={18} />,
                },
                ...(user.role === 'super_admin' || user.role === 'department_admin'
                  ? [{
                      label: 'Admin dashboard',
                      sub: 'Manage users, posts & settings',
                      onClick: () => navigate('/admin'),
                      icon: <Shield size={18} />,
                    }]
                  : []),
              ].map((item, idx, arr) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 20px', border: 'none', background: 'none',
                    fontFamily: 'var(--font)', cursor: 'pointer', textAlign: 'left',
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--beige)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--beige)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--sage-dark)', flexShrink: 0,
                  }}>
                    {item.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: 1 }}>
                      {item.sub}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <button
            id="signout-btn"
            className="btn btn--danger btn--full"
            onClick={handleLogout}
            style={{ gap: 8, marginTop: 4 }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
