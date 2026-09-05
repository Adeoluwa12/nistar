import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import { disconnectSocket } from '../lib/socket'
import type { CreateCounselorPayload, CreateDeptAdminPayload, UpdateDepartmentPayload, UpdateCategoryPayload } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''

const api = axios.create({
  baseURL: API_BASE + '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Returns the full URL for a media path. Cloudinary URLs are passed through
 * as-is. Server-relative paths are resolved against the API base. Returns
 * undefined when the value is falsy so it is safe to pass directly to <img src>.
 */
export function getMediaUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path}`
}

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nistar_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

// Unauthenticated auth flows must never trigger a token refresh: a 401 here
// (e.g. wrong password on /auth/login) is the real, final answer and should be
// surfaced to the caller as-is instead of firing a spurious /auth/refresh.
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
]

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url: string = originalRequest?.url || ''
    const isAuthFlow = NO_REFRESH_PATHS.some((p) => url.includes(p))
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthFlow) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.data.accessToken
        localStorage.setItem('nistar_token', newToken)
        // Keep the persisted auth store in sync with the refreshed token.
        const { user, setAuth } = useAuthStore.getState()
        if (user) setAuth(user, newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        // Fully clear auth (store + token) so the app doesn't rehydrate as
        // "authenticated" with a dead token and loop on protected routes.
        useAuthStore.getState().clearAuth()
        disconnectSocket()
        if (window.location.pathname !== '/login') window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api

// API helpers
export const authApi = {
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  googleAuth: (idToken: string) => api.post('/auth/google', { idToken }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
}

export const postsApi = {
  getAll: (params?: Record<string, string>) => api.get('/posts', { params }),
  getOne: (slug: string) => api.get(`/posts/${slug}`),
  create: (data: FormData) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | Record<string, unknown>) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  like: (id: string) => api.post(`/posts/${id}/like`),
  share: (id: string) => api.post(`/posts/${id}/share`),
  myPosts: (params?: Record<string, string>) => api.get('/posts/my-posts', { params }),
}

export const commentsApi = {
  getForPost: (postId: string, params?: Record<string, string>) => api.get(`/comments/post/${postId}`, { params }),
  add: (data: { postId: string; content: string; parentComment?: string; isAnonymous?: boolean }) => api.post('/comments', data),
  like: (id: string) => api.post(`/comments/${id}/like`),
  delete: (id: string) => api.delete(`/comments/${id}`),
}

export const counselorsApi = {
  getAll: (params?: Record<string, string>) => api.get('/counselors', { params }),
  getOne: (id: string) => api.get(`/counselors/${id}`),
  request: (data: { counselorId?: string; departmentId?: string }) => api.post('/counselors/request', data),
  getMyUsers: (params?: Record<string, string>) => api.get('/counselors/my-users', { params }),
  apply: (data: FormData) => api.post('/counselors/apply', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const sessionsApi = {
  getMy: (params?: Record<string, string>) => api.get('/sessions/my', { params }),
  schedule: (data: { counselorId: string; scheduledAt: string; duration?: number; notes?: string }) => api.post('/sessions', data),
  requestAppointment: (data: { requestedDate: string; description?: string; emotionalState?: string; preferredSupportType?: 'call' | 'chat' | 'follow-up'; availability?: string; duration?: number }) => api.post('/sessions', data),
  cancel: (id: string, reason?: string) => api.put(`/sessions/${id}/cancel`, { reason }),
  rate: (id: string, data: { rating: number; feedback?: string }) => api.put(`/sessions/${id}/rate`, data),
  setMeeting: (id: string, meetingLink: string) => api.put(`/sessions/${id}/meeting`, { meetingLink }),
  complete: (id: string) => api.put(`/sessions/${id}/complete`),
}

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (convId: string, params?: Record<string, string>) => api.get(`/chat/conversations/${convId}/messages`, { params }),
  sendMessage: (convId: string, data: { content: string; type?: string }) => api.post(`/chat/conversations/${convId}/messages`, data),
}

export const userApi = {
  updateProfile: (data: FormData) => api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCounselorProfile: (data: FormData) => api.put('/users/counselor-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getNotifications: (params?: Record<string, string>) => api.get('/users/notifications', { params }),
  markAllRead: () => api.put('/users/notifications/read-all'),
  markRead: (id: string) => api.put(`/users/notifications/${id}/read`),
  getMyStats: () => api.get('/users/me/stats'),
}

export const categoriesApi = {
  getAll: () => api.get('/categories'),
}

export const libraryApi = {
  getAll: (params?: Record<string, string>) => api.get('/library', { params }),
  getOne: (slug: string) => api.get(`/library/${slug}`),
  download: (slug: string) => api.get(`/library/${slug}/download`, { responseType: 'blob' }),
}

export const subscribeApi = {
  subscribe: (email: string) => api.post('/subscribe', { email }),
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: Record<string, string>) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, status: string, reason?: string) => api.put(`/admin/users/${id}/status`, { status, reason }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  createCounselor: (data: CreateCounselorPayload) => api.post('/admin/counselors', data),
  createDeptAdmin: (data: CreateDeptAdminPayload) => api.post('/admin/department-admins', data),
  getAllPosts: (params?: Record<string, string>) => api.get('/admin/posts', { params }),
  updatePostStatus: (id: string, status: string) => api.put(`/admin/posts/${id}/status`, { status }),
  promoteToAdmin: (email: string) => api.post('/admin/promote', { email }),
  getPendingComments: (params?: Record<string, string>) => api.get('/admin/comments/pending', { params }),
  moderateComment: (id: string, status: 'approved' | 'rejected') => api.put(`/admin/comments/${id}/moderate`, { status }),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data: { name: string; description?: string; icon?: string; color?: string }) => api.post('/admin/departments', data),
  updateDepartment: (id: string, data: UpdateDepartmentPayload) => api.put(`/admin/departments/${id}`, data),
  getSessionQueue: () => api.get('/admin/sessions/queue'),
  assignSession: (id: string, counselorId: string) => api.put(`/admin/sessions/${id}/assign`, { counselorId }),
  getApplications: (params?: Record<string, string>) => api.get('/admin/applications', { params }),
  reviewApplication: (id: string, status: 'approved' | 'rejected', note?: string) => api.put(`/admin/applications/${id}/review`, { status, note }),
  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: { name: string; description?: string; icon?: string; color?: string }) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: UpdateCategoryPayload) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  // Library
  createLibraryWork: (data: FormData) => api.post('/admin/library', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteLibraryWork: (id: string) => api.delete(`/admin/library/${id}`),
  // Mailing list + compliance + analytics
  getSubscribers: (params?: Record<string, string>) => api.get('/admin/subscribers', { params }),
  getAnalytics: () => api.get('/admin/analytics'),
  getConversationsMeta: (params?: Record<string, string>) => api.get('/admin/conversations', { params }),
  getAuditLogs: (params?: Record<string, string>) => api.get('/admin/audit-logs', { params }),
}
