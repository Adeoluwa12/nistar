import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nistar_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

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
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('nistar_token')
        window.location.href = '/login'
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
}

export const sessionsApi = {
  getMy: (params?: Record<string, string>) => api.get('/sessions/my', { params }),
  schedule: (data: { counselorId: string; scheduledAt: string; duration?: number; notes?: string }) => api.post('/sessions', data),
  cancel: (id: string, reason?: string) => api.put(`/sessions/${id}/cancel`, { reason }),
  rate: (id: string, data: { rating: number; feedback?: string }) => api.put(`/sessions/${id}/rate`, data),
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
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: Record<string, string>) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, status: string, reason?: string) => api.put(`/admin/users/${id}/status`, { status, reason }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  createCounselor: (data: Record<string, unknown>) => api.post('/admin/counselors', data),
  createDeptAdmin: (data: Record<string, unknown>) => api.post('/admin/department-admins', data),
  getAllPosts: (params?: Record<string, string>) => api.get('/admin/posts', { params }),
  updatePostStatus: (id: string, status: string) => api.put(`/admin/posts/${id}/status`, { status }),
  getPendingComments: (params?: Record<string, string>) => api.get('/admin/comments/pending', { params }),
  moderateComment: (id: string, status: 'approved' | 'rejected') => api.put(`/admin/comments/${id}/moderate`, { status }),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data: Record<string, unknown>) => api.post('/admin/departments', data),
  updateDepartment: (id: string, data: Record<string, unknown>) => api.put(`/admin/departments/${id}`, data),
}
