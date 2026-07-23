import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home, Users, MessageCircle, User, Bell, PenSquare,
  LayoutDashboard, Calendar, LogIn, UserPlus,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../shared/Avatar'
import { userApi, getMediaUrl } from '../../api'
import { useQuery } from '@tanstack/react-query'

export default function AppLayout() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userApi.getNotifications({ limit: '1' }),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })
  const unreadCount = notifData?.data?.data?.unreadCount ?? 0

  const isAdmin = user?.role === 'super_admin' || user?.role === 'department_admin'
  const isCounselor = user?.role === 'counselor'

  return (
    <div className="app-layout">
      {/* ── Desktop Sidebar (Visible on min-width: 768px) ────────────────────── */}
      <aside className="desktop-sidebar" aria-label="Desktop navigation">
        <div className="desktop-sidebar__header">
          <NavLink to="/feed" className="desktop-sidebar__logo">
            Nis<span>tar</span>
          </NavLink>
          <p className="desktop-sidebar__tagline">Safe space. Real support.</p>
        </div>

        <nav className="desktop-sidebar__nav">
          <NavLink
            to="/feed"
            className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
          >
            <Home size={20} strokeWidth={1.8} />
            <span>Feed</span>
          </NavLink>

          <NavLink
            to="/counselors"
            className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
          >
            <Users size={20} strokeWidth={1.8} />
            <span>{isCounselor ? 'My Users' : 'Support'}</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
          >
            <MessageCircle size={20} strokeWidth={1.8} />
            <span>Chat</span>
          </NavLink>

          <NavLink
            to="/sessions"
            className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
          >
            <Calendar size={20} strokeWidth={1.8} />
            <span>Sessions</span>
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/notifications"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="desktop-sidebar__badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </NavLink>
          )}

          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
            >
              <User size={20} strokeWidth={1.8} />
              <span>Profile & Settings</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
            >
              <LayoutDashboard size={20} strokeWidth={1.8} />
              <span>Admin Dashboard</span>
            </NavLink>
          )}
        </nav>

        {isAuthenticated ? (
          <div className="desktop-sidebar__action">
            <button
              className="btn btn--primary btn--full btn--lg"
              onClick={() => navigate('/posts/new')}
              style={{
                gap: 10,
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px rgba(107,142,90,0.25)',
              }}
            >
              <PenSquare size={18} />
              <span>Write a Story</span>
            </button>
          </div>
        ) : (
          <div className="desktop-sidebar__auth-cta card" style={{ padding: 16, marginTop: 'auto' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Join our safe community to share, connect, and receive support.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn--primary btn--full btn--sm"
                onClick={() => navigate('/register')}
                style={{ gap: 6 }}
              >
                <UserPlus size={15} /> Join Nistar
              </button>
              <button
                className="btn btn--secondary btn--full btn--sm"
                onClick={() => navigate('/login')}
                style={{ gap: 6 }}
              >
                <LogIn size={15} /> Sign in
              </button>
            </div>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="desktop-sidebar__footer">
            <NavLink to="/profile" className="desktop-sidebar__user">
              <Avatar src={getMediaUrl(user.avatar)} name={user.name} size="md" />
              <div className="desktop-sidebar__user-info">
                <div className="desktop-sidebar__user-name">{user.name}</div>
                <div className="desktop-sidebar__user-email">{user.email}</div>
              </div>
            </NavLink>
          </div>
        )}
      </aside>

      {/* ── Mobile Top Nav (Visible on screens < 768px) ───────────────────────── */}
      <nav className="topnav">
        <NavLink to="/feed" className="topnav__logo">
          Nis<span>tar</span>
        </NavLink>
        <div className="topnav__actions">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/notifications"
                className="btn btn--icon btn--ghost"
                style={{ position: 'relative' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'var(--error)',
                      color: '#fff',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/profile">
                <Avatar src={getMediaUrl(user?.avatar)} name={user?.name ?? 'U'} size="sm" />
              </NavLink>
            </>
          ) : (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('/login')}>
                Sign in
              </button>
              <button className="btn btn--primary btn--sm" onClick={() => navigate('/register')}>
                Join
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Main Page Content ─────────────────────────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav (Visible on screens < 768px) ────────────────────── */}
      {isAuthenticated && (
        <nav className="bottom-nav" aria-label="Main navigation">
          <NavLink
            to="/feed"
            className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
          >
            <Home size={22} strokeWidth={1.8} />
            <span>Feed</span>
          </NavLink>

          <NavLink
            to="/counselors"
            className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
          >
            <Users size={22} strokeWidth={1.8} />
            <span>{isCounselor ? 'My Users' : 'Support'}</span>
          </NavLink>

          <NavLink
            to="/posts/new"
            className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
          >
            <PenSquare size={22} strokeWidth={1.8} />
            <span>Write</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
          >
            <MessageCircle size={22} strokeWidth={1.8} />
            <span>Chat</span>
          </NavLink>

          {isAdmin ? (
            <NavLink
              to="/admin"
              className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
            >
              <LayoutDashboard size={22} strokeWidth={1.8} />
              <span>Admin</span>
            </NavLink>
          ) : (
            <NavLink
              to="/profile"
              className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
            >
              <User size={22} strokeWidth={1.8} />
              <span>Me</span>
            </NavLink>
          )}
        </nav>
      )}
    </div>
  )
}
