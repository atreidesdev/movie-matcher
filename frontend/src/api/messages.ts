import apiClient from '@/api/client'
import type { User } from '@/types'

export interface ConversationItem {
  id: number
  otherUser: User | null
  lastBody: string
  lastAt: string
  unread: number
  updatedAt: string
}

export interface Conversation {
  id: number
  user1Id: number
  user2Id: number
  user1?: User
  user2?: User
  createdAt: string
  updatedAt: string
}

export interface MessageItem {
  id: number
  conversationId: number
  senderId: number
  body: string
  createdAt: string
  readAt: string | null
  sender?: User
}

export interface GetMessagesResponse {
  messages: MessageItem[]
}

export const messagesApi = {
  getConversations: async (): Promise<ConversationItem[]> => {
    const { data } = await apiClient.get<ConversationItem[]>('/messages/conversations')
    return data
  },

  getOrCreateConversation: async (friendId: number): Promise<Conversation> => {
    const { data } = await apiClient.get<Conversation>(`/messages/conversations/with/${friendId}`)
    return data
  },

  getMessages: async (conversationId: number, page = 1, pageSize = 50): Promise<GetMessagesResponse> => {
    const { data } = await apiClient.get<GetMessagesResponse>(`/messages/conversations/${conversationId}/messages`, {
      params: { page, pageSize },
    })
    return data
  },

  sendMessage: async (conversationId: number, body: string): Promise<MessageItem> => {
    const { data } = await apiClient.post<MessageItem>(`/messages/conversations/${conversationId}/messages`, { body })
    return data
  },

  markConversationRead: async (conversationId: number): Promise<void> => {
    await apiClient.post(`/messages/conversations/${conversationId}/read`)
  },
}
