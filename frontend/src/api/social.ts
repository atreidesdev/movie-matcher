import apiClient from '@/api/client'
import { User } from '@/types'

export const socialApi = {
  follow: (userId: number) => apiClient.post(`/social/follow/${userId}`),

  unfollow: (userId: number) => apiClient.delete(`/social/follow/${userId}`),

  getFollowers: (): Promise<User[]> => apiClient.get<User[]>('/social/followers').then((r) => r.data),

  getFollowing: (): Promise<User[]> => apiClient.get<User[]>('/social/following').then((r) => r.data),
}
