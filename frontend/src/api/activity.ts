import apiClient from '@/api/client'

export interface ActivityUser {
  id: number
  username?: string
  name?: string
  avatar?: string
}

export interface ActivityItem {
  id: number
  createdAt: string
  userId: number
  user?: ActivityUser
  type: string
  mediaType: string
  mediaId: number
  mediaTitle: string
  /** URL или ключ постера медиа (если API отдаёт) */
  mediaPoster?: string | null
  extra?: Record<string, unknown>
}

export const activityApi = {
  getMyActivity: (params?: { limit?: number }): Promise<ActivityItem[]> =>
    apiClient.get<ActivityItem[]>('/activity/me', { params }).then((r) => r.data),

  getFeed: (params?: { limit?: number }): Promise<ActivityItem[]> =>
    apiClient.get<ActivityItem[]>('/activity/feed', { params }).then((r) => r.data),
}
