import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { getDeviceName } from '@/utils/device'
import { authApi } from '@/api/auth'
import { createMockAdapter, isMockEnabled } from '@/mock/mockAdapter'
import i18n from '@/i18n'
import { recordRequest } from '@/utils/clientMetrics'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// В dev можно проверить в консоли, на какой адрес уходят запросы и включены ли моки
const mockEnabled = isMockEnabled()
if (import.meta.env.DEV) {
  const full = API_BASE_URL.startsWith('http')
    ? API_BASE_URL
    : `${typeof location !== 'undefined' ? location.origin : ''}${API_BASE_URL}`
  console.debug('[API] baseURL:', API_BASE_URL, '→ полный адрес:', full, '| MODE:', import.meta.env.MODE)
  if (mockEnabled) {
    console.info(
      '[API] Mock mode ON — запросы перехватываются axios mock adapter (данные из src/mock/mockData.ts). Запуск: npm run dev:mock или vite --mode mock'
    )
  }
}

// Реальный адаптер берём в момент вызова (на момент загрузки модуля может быть ещё не задан)
const getDefaultAdapter = () => axios.defaults.adapter
const mockAdapter = mockEnabled
  ? (createMockAdapter((config) => {
      const ad = getDefaultAdapter()
      if (typeof ad === 'function') return ad(config)
      return Promise.reject(new Error('axios default adapter not available'))
    }) as typeof axios.defaults.adapter)
  : undefined

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(mockAdapter ? { adapter: mockAdapter } : {}),
})

apiClient.interceptors.request.use((config) => {
  if (mockAdapter && mockEnabled) {
    config.adapter = mockAdapter
  }
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  const lang = i18n.language || 'en'
  config.headers['Accept-Language'] = lang
  ;(config as InternalAxiosRequestConfig & { __metricsStart?: number }).__metricsStart = Date.now()
  return config
})

let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    useAuthStore.getState().logout()
    return false
  }
  try {
    const data = await authApi.refresh(refreshToken, getDeviceName())
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken, data.sessionId)
    return true
  } catch {
    useAuthStore.getState().logout()
    return false
  }
}

function recordMetrics(config: InternalAxiosRequestConfig & { __metricsStart?: number }, status: number) {
  const start = config?.__metricsStart
  if (typeof start === 'number') {
    const url = config.url ?? ''
    const base = config.baseURL ?? ''
    recordRequest({
      url: base ? base.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url) : url,
      method: (config.method ?? 'get').toUpperCase(),
      durationMs: Math.round(Date.now() - start),
      status,
    })
  }
}

apiClient.interceptors.response.use(
  (response) => {
    recordMetrics(response.config as InternalAxiosRequestConfig & { __metricsStart?: number }, response.status)
    return response
  },
  async (error) => {
    const config = error.config as (InternalAxiosRequestConfig & { __metricsStart?: number }) | undefined
    if (config) {
      recordMetrics(config, error.response?.status ?? 0)
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null
      })
    }
    const refreshed = await refreshPromise
    if (!refreshed) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    originalRequest.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`
    return apiClient(originalRequest)
  }
)

export default apiClient
