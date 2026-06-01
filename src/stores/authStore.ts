import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('nistar_token', token)
        set({ user, token, isAuthenticated: true })
      },
      setUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem('nistar_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    { name: 'nistar_auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
)
