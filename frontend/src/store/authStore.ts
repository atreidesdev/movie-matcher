import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { authApi } from '@/api/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  sessionId: number | null
  isLoading: boolean
  error: string | null

  setTokens: (accessToken: string, refreshToken: string, sessionId?: number) => void
  login: (email: string, password: string, deviceName?: string) => Promise<void>
  register: (email: string, password: string, username: string, name?: string, deviceName?: string) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      isLoading: false,
      error: null,

      setTokens: (accessToken: string, refreshToken: string, sessionId?: number) => {
        set({ accessToken, refreshToken, ...(sessionId != null && { sessionId }) })
      },

      login: async (email: string, password: string, deviceName?: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(email, password, deviceName)
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            sessionId: response.sessionId,
            isLoading: false,
          })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Login failed'
          set({ error: message, isLoading: false })
          throw error
        }
      },

      register: async (email: string, password: string, username: string, name?: string, deviceName?: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(email, password, username, name, deviceName)
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            sessionId: response.sessionId,
            isLoading: false,
          })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Registration failed'
          set({ error: message, isLoading: false })
          throw error
        }
      },

      logout: () => {
        const refreshToken = get().refreshToken
        if (refreshToken) {
          authApi.logout(refreshToken).catch(console.error)
        }
        set({ user: null, accessToken: null, refreshToken: null, sessionId: null })
      },

      fetchCurrentUser: async () => {
        if (!get().accessToken) return

        set({ isLoading: true })
        try {
          const user = await authApi.getCurrentUser()
          set({ user, isLoading: false })
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, sessionId: null, isLoading: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionId: state.sessionId,
        user: state.user,
      }),
    }
  )
)
