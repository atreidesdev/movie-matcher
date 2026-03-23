import apiClient from '@/api/client'
import type { PublicProfile, User } from '@/types'
import type { AchievementWithProgress } from '@/types'

/** Элемент списка пользователей (поиск, активность): id, username, name, avatar, lastSeenAt */
export interface UserListItem {
  id: number
  username?: string
  name?: string
  avatar?: string
  lastSeenAt?: string
}

/** Похожий пользователь по вкусам (списки/оценки), ответ бэкенда */
export interface SimilarUserEnriched {
  userId: number
  score: number
  username?: string
  name?: string
  avatar?: string
}

export interface UserSettings {
  theme?: string
  emailNotifications?: boolean
  notifyNewFollowers?: boolean
  notifyCommentReplies?: boolean
  profileVisibility?: string
  locale?: string
}

export const usersApi = {
  /** Поиск пользователей по никнейму или имени. */
  searchUsers: async (q: string, limit = 20): Promise<UserListItem[]> => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    params.set('limit', String(limit))
    const response = await apiClient.get<UserListItem[]>(`/users/search?${params.toString()}`)
    return response.data
  },

  /** Список пользователей, отсортированный по последнему онлайну (для страницы активности). */
  getActivityUsers: async (limit = 50, offset = 0): Promise<UserListItem[]> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const response = await apiClient.get<UserListItem[]>(`/users?${params.toString()}`)
    return response.data
  },

  /** Пользователи с похожими вкусами (по спискам и оценкам). Требует авторизации. */
  getSimilarUsers: async (limit = 20): Promise<SimilarUserEnriched[]> => {
    const response = await apiClient.get<{ similarUsers: SimilarUserEnriched[] }>(
      `/recommendations/similar-users?limit=${limit}`,
    )
    return response.data.similarUsers ?? []
  },

  getByUsername: async (username: string): Promise<PublicProfile> => {
    const response = await apiClient.get<PublicProfile>(`/users/username/${encodeURIComponent(username)}`)
    return response.data
  },

  getFriendsByUsername: async (username: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/users/username/${encodeURIComponent(username)}/friends`)
    return response.data
  },

  getFollowersByUsername: async (username: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/users/username/${encodeURIComponent(username)}/followers`)
    return response.data
  },

  /** Ачивки пользователя с прогрессом. Доступно только если профиль не скрыт или мы в друзьях. */
  getAchievementsByUsername: async (username: string): Promise<{ achievements: AchievementWithProgress[] }> => {
    const response = await apiClient.get<{ achievements: AchievementWithProgress[] }>(
      `/users/username/${encodeURIComponent(username)}/achievements`,
    )
    return response.data
  },

  /** Обновить «последний раз онлайн» на сервере. Вызывать при заходе и раз в минуту. */
  ping: async (): Promise<void> => {
    await apiClient.post('/users/me/ping')
  },

  getMySettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get<UserSettings>('/users/me/settings')
    return response.data
  },

  updateMySettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiClient.patch<UserSettings>('/users/me/settings', data)
    return response.data
  },

  uploadAvatar: async (file: File): Promise<{ path: string; user: User }> => {
    const form = new FormData()
    form.append('file', file)
    const response = await apiClient.post<{ path: string; user: User }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  /** Обновить профиль (ник, имя, почта, соцссылки). */
  updateProfile: async (data: {
    username?: string
    name?: string
    email?: string
    socialLinks?: Record<string, string>
  }): Promise<{ user: User }> => {
    const response = await apiClient.patch<{ user: User }>('/users/me', data)
    return response.data
  },

  /** Сменить пароль (текущий + новый). */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/users/me/change-password', { currentPassword, newPassword })
  },
}
