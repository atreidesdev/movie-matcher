import apiClient from '@/api/client'
import { createMockAdapter, isMockEnabled } from '@/mock/mockAdapter'
import type { AuthResponse, Session, User } from '@/types'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const mockEnabled = isMockEnabled()
const getDefaultAdapter = () => axios.defaults.adapter
const noAuthMockAdapter = mockEnabled
  ? (createMockAdapter((config) => {
      const ad = getDefaultAdapter()
      if (typeof ad === 'function') return ad(config)
      return Promise.reject(new Error('axios default adapter not available'))
    }) as typeof axios.defaults.adapter)
  : undefined

/** Прямой axios для refresh, чтобы не попадать в interceptor и не создавать цикл 401. */
const noAuthClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  ...(noAuthMockAdapter ? { adapter: noAuthMockAdapter } : {}),
})

noAuthClient.interceptors.request.use((config) => {
  if (noAuthMockAdapter && mockEnabled) {
    config.adapter = noAuthMockAdapter
  }
  return config
})

export const authApi = {
  register: async (
    email: string,
    password: string,
    username: string,
    name?: string,
    deviceName?: string,
  ): Promise<AuthResponse> => {
    const response = await noAuthClient.post<AuthResponse>('/auth/register', {
      email,
      password,
      username: username.trim().toLowerCase(),
      name,
      deviceName,
    })
    return response.data
  },

  login: async (email: string, password: string, deviceName?: string): Promise<AuthResponse> => {
    const response = await noAuthClient.post<AuthResponse>('/auth/login', {
      email,
      password,
      deviceName,
    })
    return response.data
  },

  refresh: async (refreshToken: string, deviceName?: string): Promise<AuthResponse> => {
    const response = await noAuthClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
      deviceName,
    })
    return response.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await noAuthClient.post('/auth/logout', { refreshToken })
  },

  logoutOthers: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout-others', { refreshToken })
  },

  getSessions: async (): Promise<Session[]> => {
    const response = await apiClient.get<{ sessions: Session[] }>('/auth/sessions')
    return response.data.sessions
  },

  revokeSession: async (sessionId: number): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`)
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/auth/me')
    return response.data.user
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await noAuthClient.post<{ message: string }>('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await noAuthClient.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    })
    return response.data
  },
}
