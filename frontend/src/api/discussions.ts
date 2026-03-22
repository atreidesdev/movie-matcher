import apiClient from '@/api/client'
import type { Comment } from '@/types'

export interface Discussion {
  id: number
  entityType: string
  entityId: number
  title: string
  description: string
  userId: number
  user?: { id: number; name?: string; username?: string; avatar?: string }
  createdAt: string
  updatedAt: string
  commentsCount?: number
}

export interface ListDiscussionsResponse {
  discussions: Discussion[]
  total: number
}

export interface GetCommentsResponse {
  emojiReactions: boolean
  comments: Comment[]
  total: number
}

export interface GetRepliesResponse {
  replies: Comment[]
  total: number
}

/** Тип медиа для URL (tv-series, movies, anime, ...) */
export type DiscussionEntityType =
  | 'movies'
  | 'tv-series'
  | 'cartoon-series'
  | 'cartoon-movies'
  | 'anime'
  | 'anime-movies'
  | 'games'
  | 'manga'
  | 'books'
  | 'light-novels'

export const discussionsApi = {
  list: async (entityType: string, entityId: number, page = 0, pageSize = 20): Promise<ListDiscussionsResponse> => {
    const { data } = await apiClient.get<ListDiscussionsResponse>('/discussions', {
      params: { entityType, entityId, page, pageSize },
    })
    return data
  },

  get: async (id: number): Promise<Discussion> => {
    const { data } = await apiClient.get<Discussion>(`/discussions/${id}`)
    return data
  },

  create: async (payload: {
    entityType: string
    entityId: number
    title: string
    description?: string
  }): Promise<Discussion> => {
    const { data } = await apiClient.post<Discussion>('/discussions', payload)
    return data
  },

  getComments: async (discussionId: number, page = 0, pageSize = 10): Promise<GetCommentsResponse> => {
    const { data } = await apiClient.get<GetCommentsResponse>(`/discussions/${discussionId}/comments`, {
      params: { page, pageSize },
    })
    return data
  },

  getReplies: async (
    discussionId: number,
    commentId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<GetRepliesResponse> => {
    const params = new URLSearchParams()
    if (options?.limit != null) params.set('limit', String(options.limit))
    if (options?.offset != null) params.set('offset', String(options.offset))
    const qs = params.toString()
    const url = `/discussions/${discussionId}/comments/${commentId}/replies${qs ? `?${qs}` : ''}`
    const { data } = await apiClient.get<GetRepliesResponse>(url)
    return data
  },

  createComment: async (discussionId: number, text: string, parentId?: number): Promise<Comment> => {
    const { data } = await apiClient.post<Comment>(`/discussions/${discussionId}/comments`, { text, parentId })
    return data
  },

  updateComment: async (discussionId: number, commentId: number, text: string): Promise<Comment> => {
    const { data } = await apiClient.put<Comment>(`/discussions/${discussionId}/comments/${commentId}`, { text })
    return data
  },

  deleteComment: async (discussionId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/discussions/${discussionId}/comments/${commentId}`)
  },
}
