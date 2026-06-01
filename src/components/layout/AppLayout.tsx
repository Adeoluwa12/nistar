import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Users, MessageCircle, User, Bell, PenSquare, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../shared/Avatar'
import { userApi } from '../../api'
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
      {/* Top Nav */}
      <nav className="topnav">
        <NavLink to="/feed" className="topnav__logo">Nis<span>tar</span></NavLink>
        <div className="topnav__actions">
          {isAuthenticated ? (
            <>
              <NavLink to="/notifications" className="btn btn--icon btn--ghost" style={{ position: 'relative' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2, background: 'var(--error)', color: '#fff',
                    fontSize: '0.6rem', fontWeight: 700, width: 14, height: 14, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </NavLink>
              <NavLink to="/profile">
                <Avatar src={user?.avatar} name={user?.name ?? 'U'} size="sm" />
              </NavLink>
            </>
          ) : (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('/login')}>Sign in</button>
              <button className="btn btn--primary btn--sm" onClick={() => navigate('/register')}>Join</button>
            </>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Nav — mobile only */}
      {isAuthenticated && (
        <nav className="bottom-nav" aria-label="Main navigation">
          <NavLink to="/feed" className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}>
            <Home size={22} strokeWidth={1.8} />
            <span>Feed</span>
          </NavLink>

          <NavLink to="/counselors" className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}>
            <Users size={22} strokeWidth={1.8} />
            <span>{isCounselor ? 'My Users' : 'Support'}</span>
          </NavLink>

          <NavLink to="/posts/new" className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}>
            <PenSquare size={22} strokeWidth={1.8} />
            <span>Write</span>
          </NavLink>

          <NavLink to="/chat" className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}>
            <MessageCircle size={22} strokeWidth={1.8} />
            <span>Chat</span>
          </NavLink>

          {isAdmin ? (
            <NavLink to="/admin" className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={22} strokeWidth={1.8} />
              <span>Admin</span>
            </NavLink>
          ) : (
            <NavLink to="/profile" className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}>
              <User size={22} strokeWidth={1.8} />
              <span>Me</span>
            </NavLink>
          )}
        </nav>
      )}
    </div>
  )
}
