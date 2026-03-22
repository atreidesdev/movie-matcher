import apiClient from '@/api/client'

export interface NotificationItem {
  id: number
  createdAt: string
  type: string
  title: string
  body?: string
  readAt?: string
  relatedType?: string
  relatedId?: number
  extra?: Record<string, unknown>
}

/** Подписка на push (ключи из PushSubscription.toJSON()). */
export interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

export interface PushSubscriptionPayload {
  endpoint: string
  keys: PushSubscriptionKeys
}

export const notificationsApi = {
  getList: (params?: { limit?: number }) =>
    apiClient.get<NotificationItem[]>('/notifications', { params }).then((r) => r.data),

  markRead: (id: number) => apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () => apiClient.post('/notifications/read-all'),

  /** Подписаться на браузерные push-уведомления (требует VAPID public key и авторизацию). */
  pushSubscribe: (subscription: PushSubscriptionPayload) =>
    apiClient.post('/notifications/push-subscribe', subscription),
}
