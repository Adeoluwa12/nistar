import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera, BookOpen, User, Mail, Shield, Lock, FileText, ChevronRight, Settings, CheckCircle,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { postsApi, userApi, counselorsApi, getMediaUrl } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import PostCard from '../../components/posts/PostCard'
import toast from 'react-hot-toast'
import type { Post } from '../../types'

type ProfileTab = 'posts' | 'profile' | 'account' | 'counselor'

const TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { key: 'posts', label: 'My Posts', icon: <BookOpen size={15} /> },
  { key: 'profile', label: 'Profile', icon: <User size={15} /> },
  { key: 'account', label: 'Account', icon: <Settings size={15} /> },
  { key: 'counselor', label: 'Counselor', icon: <Shield size={15} /> },
]

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ProfileTab>('posts')
  const [editBio, setEditBio] = useState(user?.bio ?? '')
  const [editName, setEditName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)
  const [applyStatement, setApplyStatement] = useState('')
  const [applyDocs, setApplyDocs] = useState<File[]>([])

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['my-posts'],
    queryFn: () => postsApi.myPosts({ limit: '20' }),
    enabled: tab === 'posts',
  })
  const myPosts: Post[] = postsData?.data?.data ?? []

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
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
      toast.error(getErrorMessage(err, 'Failed to update photo — please try again'))
    } finally {
      setUploading(false)
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

  const applyMut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('statement', applyStatement)
      applyDocs.forEach(d => fd.append('documents', d))
      return counselorsApi.apply(fd)
    },
    onSuccess: () => {
      toast.success('Application submitted!')
      setApplyStatement('')
      setApplyDocs([])
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Failed to submit application'))
    },
  })

  const roleLabel = user?.role === 'super_admin' ? '⭐ Super Admin'
    : user?.role === 'department_admin' ? '🛡 Department Admin'
    : user?.role === 'counselor' ? 'Counselor'
    : user?.isAuthor ? '✍️ Nistar Author'
    : 'Community Member'

  const showCounselorTab = user?.role === 'user'
  const visibleTabs = showCounselorTab ? TABS : TABS.filter(t => t.key !== 'counselor')

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
      <div className="profile-tabs" role="tablist">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`profile-tab${tab === t.key ? ' profile-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div key="posts" className="profile-tab-content">
          {postsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />)}
            </div>
          ) : myPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden="true" />
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

      {/* Profile tab */}
      {tab === 'profile' && (
        <div key="profile" className="profile-tab-content">
          {/* Account info card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="settings-section-header">
              <Mail size={15} />
              <span>Account Information</span>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <div className="settings-info-row">
                <div className="settings-info-row__left">
                  <User size={14} className="settings-info-row__icon" />
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
        </div>
      )}

      {/* Account tab */}
      {tab === 'account' && (
        <div key="account" className="profile-tab-content">
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
        </div>
      )}

      {/* Counselor tab */}
      {tab === 'counselor' && showCounselorTab && (
        <div key="counselor" className="profile-tab-content">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="settings-section-header">
              <FileText size={15} />
              <span>Become a Counselor</span>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Statement <span style={{ color: 'var(--text-light)' }}>(optional)</span></label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={applyStatement}
                  onChange={e => setApplyStatement(e.target.value)}
                  placeholder="Why do you want to be a counselor?"
                  maxLength={5000}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Supporting documents <span style={{ color: 'var(--text-light)' }}>(PDF, optional, up to 5)</span></label>
                <input
                  ref={docRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => setApplyDocs(Array.from(e.target.files || []))}
                />
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => docRef.current?.click()}
                >
                  {applyDocs.length > 0 ? `${applyDocs.length} file(s) selected` : 'Choose PDFs'}
                </button>
              </div>
              <button
                className="btn btn--primary"
                onClick={() => applyMut.mutate()}
                disabled={applyMut.isPending}
                style={{ alignSelf: 'flex-start' }}
              >
                {applyMut.isPending ? 'Submitting…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
