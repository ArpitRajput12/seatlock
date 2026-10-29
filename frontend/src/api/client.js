import axios from 'axios'

export const RENDER_API_BASE_URL = 'https://seatlock-backend-y8ce.onrender.com/api/v1'

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

  // When deployed on Vercel or any non-localhost host, ensure we always target Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (envUrl && typeof envUrl === 'string' && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.trim().replace(/\/+$/, '')
    }
    return RENDER_API_BASE_URL
  }

  // Local development
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '')
  }

  return RENDER_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

const getAccessToken = () => localStorage.getItem('seatlock_access_token')
const getRefreshToken = () => localStorage.getItem('seatlock_refresh_token')

export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('seatlock_access_token', accessToken)
  if (refreshToken) localStorage.setItem('seatlock_refresh_token', refreshToken)
}

export const clearTokens = () => {
  localStorage.removeItem('seatlock_access_token')
  localStorage.removeItem('seatlock_refresh_token')
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.url) {
    // Sanitize any malformed UUIDs with spaces in URL path
    config.url = config.url.replace(/\/shows\/([0-9a-fA-F\s-]+)(\/|$)/g, (match, id, tail) => {
      return `/shows/${id.trim().replace(/\s+/g, '-')}${tail}`
    })
  }
  return config
})

let refreshRequest = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthRequest = originalRequest?.url?.includes('/auth/')

    if (error.response?.status !== 401 || originalRequest?._retry || isAuthRequest || !getRefreshToken()) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    refreshRequest ||= axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken: getRefreshToken(),
    })
      .then(({ data }) => {
        setTokens({ accessToken: data.data.accessToken })
        return data.data.accessToken
      })
      .catch((refreshError) => {
        clearTokens()
        throw refreshError
      })
      .finally(() => {
        refreshRequest = null
      })

    const token = await refreshRequest
    originalRequest.headers.Authorization = `Bearer ${token}`
    return api(originalRequest)
  },
)

export const unwrap = (request) => request.then(({ data }) => data)

export const getApiError = (error) => {
  const response = error?.response?.data
  if (response?.errors?.length) return response.errors.map((item) => item.message).join(' ')
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'The SeatLock API did not respond. Check that PostgreSQL and Redis are running, then try again.'
  }
  if (!error?.response && error?.request) {
    return 'The SeatLock API is currently unreachable. Please verify your connection and try again.'
  }
  return response?.message || error?.message || 'Something went wrong. Please try again.'
}

export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
  logout: (refreshToken) => unwrap(api.post('/auth/logout', { refreshToken })),
}

export const movieApi = {
  list: (params = {}) => unwrap(api.get('/movies', { params })),
  get: (movieId) => unwrap(api.get(`/movies/${movieId}`)),
  create: (payload) => unwrap(api.post('/admin/movies', payload)),
  update: (movieId, payload) => unwrap(api.put(`/admin/movies/${movieId}`, payload)),
  remove: (movieId) => unwrap(api.delete(`/admin/movies/${movieId}`)),
}

export const catalogApi = {
  theaters: (params = {}) => unwrap(api.get('/theaters', { params })),
  screens: (theaterId) => unwrap(api.get(`/screens/theater/${String(theaterId).trim().replace(/\s+/g, '-')}`)),
  shows: (params = {}) => unwrap(api.get('/shows', { params })),
  show: (showId) => unwrap(api.get(`/shows/${String(showId).trim().replace(/\s+/g, '-')}`)),
  showSeats: (showId, available = false) => unwrap(api.get(`/show-seats/show/${String(showId).trim().replace(/\s+/g, '-')}${available ? '/available' : ''}`)),
  holdSeats: (showId, payload) => {
    const cleanId = String(showId).trim().replace(/\s+/g, '-')
    return unwrap(api.post(`/shows/${cleanId}/seats/hold`, payload))
  },
  releaseSeats: (showId, payload) => {
    const cleanId = String(showId).trim().replace(/\s+/g, '-')
    return unwrap(api.post(`/shows/${cleanId}/seats/release`, payload))
  },
}

export const bookingApi = {
  create: (payload) => unwrap(api.post('/bookings', payload)),
  mine: () => unwrap(api.get('/bookings/my')),
  get: (bookingId) => {
    const cleanId = String(bookingId).trim().replace(/\s+/g, '-')
    return unwrap(api.get(`/bookings/${cleanId}`))
  },
  cancel: (bookingId, reason = 'User requested cancellation') => {
    const cleanId = String(bookingId).trim().replace(/\s+/g, '-')
    return unwrap(api.post(`/bookings/${cleanId}/cancel`, { reason }))
  },
}

export const paymentApi = {
  createRazorpayOrder: (payload) => {
    const body = typeof payload === 'object' && payload !== null ? payload : { bookingId: payload }
    return unwrap(api.post('/payments/razorpay/create-order', body))
  },
  verifyRazorpayPayment: (payload) => unwrap(api.post('/payments/razorpay/verify-payment', payload)),
  get: (paymentId) => unwrap(api.get(`/payments/${paymentId}`)),
}

export const adminApi = {
  stats: () => unwrap(api.get('/admin/stats')),
  recentBookings: (limit = 10) => unwrap(api.get('/admin/bookings', { params: { limit } })),
  uploadMedia: (formData) => unwrap(api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })),
  // Movies CRUD
  movies: () => unwrap(api.get('/admin/movies')),
  createMovie: (payload) => unwrap(api.post('/admin/movies', payload)),
  updateMovie: (id, payload) => unwrap(api.put(`/admin/movies/${id}`, payload)),
  deleteMovie: (id) => unwrap(api.delete(`/admin/movies/${id}`)),
  // Theaters CRUD
  theaters: () => unwrap(api.get('/admin/theaters')),
  createTheater: (payload) => unwrap(api.post('/admin/theaters', payload)),
  updateTheater: (id, payload) => unwrap(api.put(`/admin/theaters/${id}`, payload)),
  deleteTheater: (id) => unwrap(api.delete(`/admin/theaters/${id}`)),
  // Screens & Dynamic Seats
  createScreen: (theaterId, payload) => unwrap(api.post(`/admin/theaters/${theaterId}/screens`, payload)),
  getScreen: (screenId) => unwrap(api.get(`/admin/screens/${screenId}`)),
  updateScreenSeats: (screenId, payload) => unwrap(api.put(`/admin/screens/${screenId}/seats`, payload)),
  // Shows CRUD
  shows: () => unwrap(api.get('/admin/shows')),
  scheduleShow: (payload) => unwrap(api.post('/admin/shows', payload)),
  deleteShow: (id) => unwrap(api.delete(`/admin/shows/${id}`)),
}

