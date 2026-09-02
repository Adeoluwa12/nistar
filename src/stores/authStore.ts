import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, token) => {
        localStorage.setItem('nistar_token', token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => {
        localStorage.removeItem('nistar_token')
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },
    }),
    { name: 'nistar_auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
)
