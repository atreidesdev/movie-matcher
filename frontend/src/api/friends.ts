import apiClient from '@/api/client'
import { User } from '@/types'

export interface FriendRequestItem {
  id: number
  sender?: User
  receiver?: User
  createdAt: string
}

export interface FriendRequestsResponse {
  received: FriendRequestItem[]
  sent: FriendRequestItem[]
}

export const friendsApi = {
  getFriends: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/friends')
    return response.data
  },

  getRequests: async (): Promise<FriendRequestsResponse> => {
    const response = await apiClient.get<FriendRequestsResponse>('/friends/requests')
    return response.data
  },

  sendRequest: async (userId: number): Promise<void> => {
    await apiClient.post(`/friends/requests/${userId}`)
  },

  acceptRequest: async (requestId: number): Promise<void> => {
    await apiClient.post(`/friends/requests/${requestId}/accept`)
  },

  rejectRequest: async (requestId: number): Promise<void> => {
    await apiClient.post(`/friends/requests/${requestId}/reject`)
  },

  removeFriend: async (friendId: number): Promise<void> => {
    await apiClient.delete(`/friends/${friendId}`)
  },
}
