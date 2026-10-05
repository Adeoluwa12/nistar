import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Users, MessageCircle, User, Bell, PenSquare,
  LayoutDashboard, Calendar, LogIn, UserPlus, Menu, X,
  ShieldCheck, Heart, PanelLeftClose, PanelLeftOpen, LogOut, LifeBuoy,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../shared/Avatar'
import { userApi, getMediaUrl, authApi } from '../../api'
import { useQuery } from '@tanstack/react-query'
import { disconnectSocket } from '../../lib/socket'
import toast from 'react-hot-toast'

const SIDEBAR_COLLAPSED_KEY = 'nistar_sidebar_collapsed'

export default function AppLayout() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const isLanding = location.pathname === '/'

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed])

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userApi.getNotifications({ limit: '1' }),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })
  const unreadCount = notifData?.data?.data?.unreadCount ?? 0

  const isAdmin = user?.role === 'super_admin' || user?.role === 'department_admin'
  const isCounselor = user?.role === 'counselor'

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const closeDrawer = () => setDrawerOpen(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { /* silent */ }
    disconnectSocket()
    clearAuth()
    navigate('/login')
    toast.success('Signed out')
  }

  return (
    <div
      className={`app-layout${isLanding ? ' is-landing' : ''}${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}
    >
      {/* ── Desktop Header (Landing page only) ─────────────────────────────── */}
      <header className="desktop-header" aria-label="Site header">
        <NavLink to="/" className="desktop-header__logo">
          Nis<span>tar</span>
        </NavLink>
        <nav className="desktop-header__nav" aria-label="Primary">
          <NavLink to="/feed" className="desktop-header__link">Feed</NavLink>
          <NavLink to="/counselors" className="desktop-header__link">Counselors</NavLink>
        </nav>
        <div className="desktop-header__actions">
          {isAuthenticated ? (
            <>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => navigate('/posts/new')}
              >
                <PenSquare size={16} /> Write
              </button>
              <NavLink to="/notifications" className="btn btn--icon btn--ghost" style={{ position: 'relative' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute', top: 2, right: 2, background: 'var(--error)',
                      color: '#fff', fontSize: '0.6rem', fontWeight: 700, width: 14, height: 14,
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/profile" className="desktop-header__avatar">
                <Avatar src={getMediaUrl(user?.avatar)} name={user?.name ?? 'U'} size="sm" />
              </NavLink>
            </>
          ) : (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('/login')}>
                Sign in
              </button>
              <button className="btn btn--primary btn--sm" onClick={() => navigate('/register')}>
                Join Nistar
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Desktop Sidebar (Hidden on landing page) ────────────────────────── */}
      {!isLanding && (
        <aside className="desktop-sidebar" aria-label="Desktop navigation">
          <div className="desktop-sidebar__header">
            <NavLink to="/" className="desktop-sidebar__logo" title="Home">
              <span className="desktop-sidebar__logo-mark">N</span>
              <span className="desktop-sidebar__logo-text">Nis<span>tar</span></span>
            </NavLink>
            <button
              type="button"
              className="desktop-sidebar__collapse-btn"
              onClick={() => setSidebarCollapsed(v => !v)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <p className="desktop-sidebar__tagline">Safe space. Real support.</p>

          <nav className="desktop-sidebar__nav">
            <NavLink
              to="/feed"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
              title="Feed"
            >
              <Home size={20} strokeWidth={1.8} />
              <span className="desktop-sidebar__label">Feed</span>
            </NavLink>

            <NavLink
              to="/counselors"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
              title={isCounselor ? 'My Users' : 'Support'}
            >
              <Users size={20} strokeWidth={1.8} />
              <span className="desktop-sidebar__label">{isCounselor ? 'My Users' : 'Support'}</span>
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
              title="Chat"
            >
              <MessageCircle size={20} strokeWidth={1.8} />
              <span className="desktop-sidebar__label">Chat</span>
            </NavLink>

            <NavLink
              to="/sessions"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
              title="Sessions"
            >
              <Calendar size={20} strokeWidth={1.8} />
              <span className="desktop-sidebar__label">Sessions</span>
            </NavLink>

            <NavLink
              to="/support"
              className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
              title="Support"
            >
              <LifeBuoy size={20} strokeWidth={1.8} />
              <span className="desktop-sidebar__label">Support</span>
            </NavLink>

            {isAuthenticated && (
              <NavLink
                to="/notifications"
                className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
                title="Notifications"
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Bell size={20} strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span className="desktop-sidebar__badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="desktop-sidebar__label">Notifications</span>
              </NavLink>
            )}

            {isAuthenticated && (
              <NavLink
                to="/profile"
                className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
                title="Profile & Settings"
              >
                <User size={20} strokeWidth={1.8} />
                <span className="desktop-sidebar__label">Profile & Settings</span>
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `desktop-sidebar__item${isActive ? ' active' : ''}`}
                title="Admin Dashboard"
              >
                <LayoutDashboard size={20} strokeWidth={1.8} />
                <span className="desktop-sidebar__label">Admin Dashboard</span>
              </NavLink>
            )}
          </nav>

          {isAuthenticated ? (
            <div className="desktop-sidebar__action">
              <button
                className="btn btn--primary btn--full btn--lg desktop-sidebar__write-btn"
                onClick={() => navigate('/posts/new')}
                style={{
                  gap: 10,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 16px rgba(107,142,90,0.25)',
                }}
                title="Write a Story"
              >
                <PenSquare size={18} />
                <span className="desktop-sidebar__label">Write a Story</span>
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
                  <UserPlus size={15} /> <span className="desktop-sidebar__label">Join Nistar</span>
                </button>
                <button
                  className="btn btn--secondary btn--full btn--sm"
                  onClick={() => navigate('/login')}
                  style={{ gap: 6 }}
                >
                  <LogIn size={15} /> <span className="desktop-sidebar__label">Sign in</span>
                </button>
              </div>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="desktop-sidebar__footer">
              <NavLink to="/profile" className="desktop-sidebar__user" title={user.name}>
                <Avatar src={getMediaUrl(user.avatar)} name={user.name} size="md" />
                <div className="desktop-sidebar__user-info">
                  <div className="desktop-sidebar__user-name">{user.name}</div>
                  <div className="desktop-sidebar__user-email">{user.email}</div>
                </div>
              </NavLink>
              <button
                className="btn btn--ghost btn--sm btn--full"
                onClick={() => setLogoutModalOpen(true)}
                style={{ marginTop: 8, color: 'var(--error)' }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </aside>
      )}

      {/* ── Mobile Top Nav (Visible on screens < 768px) ───────────────────────── */}
      <nav className="topnav">
        <NavLink to="/" className="topnav__logo">
          Nis<span>tar</span>
        </NavLink>
        <div className="topnav__actions">
          {isAuthenticated && (
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
          )}
          <button
            type="button"
            className="topnav__menu-btn"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer Sidebar ─────────────────────────────────────────────── */}
      <div
        className={`drawer-overlay${drawerOpen ? ' is-open' : ''}`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />
      <aside
        id="mobile-drawer"
        className={`drawer${drawerOpen ? ' is-open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!drawerOpen}
      >
        <div className="drawer__header">
          <NavLink to="/" className="drawer__logo" onClick={closeDrawer}>
            Nis<span>tar</span>
          </NavLink>
          <button
            type="button"
            className="drawer__close"
            aria-label="Close menu"
            onClick={closeDrawer}
          >
            <X size={20} />
          </button>
        </div>

        {isAuthenticated && user && (
          <NavLink to="/profile" className="drawer__user" onClick={closeDrawer}>
            <Avatar src={getMediaUrl(user.avatar)} name={user.name} size="md" />
            <div className="drawer__user-info">
              <div className="drawer__user-name">{user.name}</div>
              <div className="drawer__user-email">{user.email}</div>
            </div>
          </NavLink>
        )}

        <nav className="drawer__nav">
          <NavLink to="/" end className="drawer__item" onClick={closeDrawer}>
            <Home size={20} strokeWidth={1.8} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/feed" className="drawer__item" onClick={closeDrawer}>
            <Home size={20} strokeWidth={1.8} />
            <span>Feed</span>
          </NavLink>
          <NavLink to="/counselors" className="drawer__item" onClick={closeDrawer}>
            <Users size={20} strokeWidth={1.8} />
            <span>{isCounselor ? 'My Users' : 'Counselors'}</span>
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/chat" className="drawer__item" onClick={closeDrawer}>
              <MessageCircle size={20} strokeWidth={1.8} />
              <span>Chat</span>
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/sessions" className="drawer__item" onClick={closeDrawer}>
              <Calendar size={20} strokeWidth={1.8} />
              <span>Sessions</span>
            </NavLink>
          )}
          <NavLink to="/support" className="drawer__item" onClick={closeDrawer}>
            <LifeBuoy size={20} strokeWidth={1.8} />
            <span>Support</span>
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/notifications" className="drawer__item" onClick={closeDrawer}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="drawer__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>
              <span>Notifications</span>
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/profile" className="drawer__item" onClick={closeDrawer}>
              <User size={20} strokeWidth={1.8} />
              <span>Profile & Settings</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className="drawer__item" onClick={closeDrawer}>
              <LayoutDashboard size={20} strokeWidth={1.8} />
              <span>Admin Dashboard</span>
            </NavLink>
          )}

          {isAuthenticated && (
            <button
              className="btn btn--ghost btn--full"
              onClick={() => setLogoutModalOpen(true)}
              style={{ color: 'var(--error)', justifyContent: 'flex-start' }}
            >
              <LogOut size={18} strokeWidth={1.8} />
              <span>Sign out</span>
            </button>
          )}

          <div className="drawer__divider" />

          {isAuthenticated ? (
            <NavLink to="/posts/new" className="drawer__cta" onClick={closeDrawer}>
              <PenSquare size={18} />
              <span>Write a Story</span>
            </NavLink>
          ) : (
            <div className="drawer__auth">
              <button
                className="btn btn--primary btn--full"
                onClick={() => { closeDrawer(); navigate('/register') }}
              >
                <UserPlus size={16} /> Join Nistar
              </button>
              <button
                className="btn btn--secondary btn--full"
                onClick={() => { closeDrawer(); navigate('/login') }}
              >
                <LogIn size={16} /> Sign in
              </button>
            </div>
          )}
        </nav>

        <div className="drawer__footer">
          <div className="drawer__footer-brand">
            <Heart size={14} fill="var(--sage)" stroke="var(--sage)" />
            <span>Safe space. Real support.</span>
          </div>
          <p className="drawer__footer-text">
            <ShieldCheck size={12} /> Verified counselors · Moderated content
          </p>
        </div>
      </aside>

      {/* ── Main Page Content ─────────────────────────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Site Footer ───────────────────────────────────────────────────────── */}
      {isLanding && (
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <div className="site-footer__logo">
              Nis<span>tar</span>
            </div>
            <p className="site-footer__tagline">
              A safe community for your mental health. Share stories, find support,
              and connect with verified counselors.
            </p>
            <div className="site-footer__badge">
              <ShieldCheck size={14} />
              <span>Verified · Moderated · Private</span>
            </div>
          </div>

          <div className="site-footer__col">
            <h5>Explore</h5>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/feed">Feed</NavLink>
            <NavLink to="/counselors">Counselors</NavLink>
            <NavLink to="/posts/new">Write a Story</NavLink>
          </div>

          <div className="site-footer__col">
            <h5>Account</h5>
            {isAuthenticated ? (
              <>
                <NavLink to="/profile">Profile</NavLink>
                <NavLink to="/sessions">Sessions</NavLink>
                <NavLink to="/notifications">Notifications</NavLink>
                <NavLink to="/change-password">Change Password</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login">Sign in</NavLink>
                <NavLink to="/register">Join Nistar</NavLink>
                <NavLink to="/forgot-password">Forgot password</NavLink>
              </>
            )}
          </div>

          <div className="site-footer__col">
            <h5>Support</h5>
            <NavLink to="/support">Contact us / complaints</NavLink>
            <a href="mailto:hello@nistar.app">Email us</a>
            <a href="#">Community guidelines</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Nistar. Made with care for mental wellness.</span>
          <span className="site-footer__dot" aria-hidden>•</span>
          <span>You are not alone.</span>
        </div>
      </footer>
      )}

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

      {/* ── Logout Confirmation Modal ─────────────────────────────────────────── */}
      {logoutModalOpen && (
        <div className="modal-overlay modal-overlay--center" onClick={() => setLogoutModalOpen(false)}>
          <div className="modal modal--center" onClick={e => e.stopPropagation()}>
            <div className="modal__handle" />
            <h3 className="modal__title">Sign out?</h3>
            <p className="modal__subtitle">
              You will be signed out of your account. You can sign back in anytime.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                className="btn btn--secondary"
                style={{ flex: 1 }}
                onClick={() => setLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                style={{ flex: 1 }}
                onClick={handleLogout}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
