import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
const PROXY_BASE = '/api/proxy'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const shouldUseProxy = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL

  // Already pointing to a relative path (e.g., /api/mock)
  if (envUrl && envUrl.startsWith('/')) {
    return false
  }

  if (!envUrl) {
    return true
  }

  try {
    const targetOrigin = new URL(envUrl).origin
    return targetOrigin !== window.location.origin
  } catch {
    return true
  }
}

const resolveBaseUrl = () => {
  if (typeof window === 'undefined') {
    return API_URL
  }

  return shouldUseProxy() ? PROXY_BASE : API_URL
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    config.baseURL = resolveBaseUrl()

    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = Cookies.get('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data

        const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'
        const cookieOptions = {
          expires: 1 / 48,
          secure: isProduction,
          sameSite: 'lax' as const,
          path: '/',
        }
        Cookies.set('access_token', access_token, cookieOptions)
        Cookies.set('refresh_token', refresh_token, { ...cookieOptions, expires: 30 })

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        Cookies.remove('user')
        if (typeof window !== 'undefined') {
          window.location.href = '/login/admin'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

