import apiClient from '@/api/client'
import type { Comment } from '@/types'

const entityCommentPaths: Record<string, string> = {
  movies: 'movies',
  'tv-series': 'tv-series',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  anime: 'anime',
  'anime-movies': 'anime-movies',
  games: 'games',
  manga: 'manga',
  books: 'books',
  'light-novels': 'light-novels',
}

export type CommentEntityType = keyof typeof entityCommentPaths

export type CommentEmojiReactionsMap = Record<string, { counts: Record<string, number>; myReaction: string }>

export type GetCommentsResponse = {
  comments: Comment[]
  total: number
  emojiReactions?: CommentEmojiReactionsMap
}

export const commentsApi = {
  getComments: async (
    entityType: CommentEntityType,
    entityId: number,
    page = 0,
    pageSize = 10,
  ): Promise<GetCommentsResponse> => {
    const path = entityCommentPaths[entityType] ?? entityType
    const response = await apiClient.get<GetCommentsResponse>(
      `/${path}/${entityId}/comments?page=${page}&pageSize=${pageSize}`,
    )
    return response.data
  },

  getReplies: async (
    entityType: CommentEntityType,
    entityId: number,
    commentId: number,
    options?: { limit?: number; offset?: number },
  ): Promise<{ replies: Comment[]; total: number }> => {
    const path = entityCommentPaths[entityType] ?? entityType
    const params = new URLSearchParams()
    if (options?.limit != null) params.set('limit', String(options.limit))
    if (options?.offset != null) params.set('offset', String(options.offset))
    const qs = params.toString()
    const url = `/${path}/${entityId}/comments/${commentId}/replies${qs ? `?${qs}` : ''}`
    const response = await apiClient.get<{ replies: Comment[]; total: number }>(url)
    return response.data
  },

  createComment: async (
    entityType: CommentEntityType,
    entityId: number,
    text: string,
    parentId?: number,
  ): Promise<Comment> => {
    const path = entityCommentPaths[entityType] ?? entityType
    const response = await apiClient.post<Comment>(`/comments/${path}/${entityId}`, {
      text,
      parentId,
    })
    return response.data
  },

  updateComment: async (entityType: CommentEntityType, commentId: number, text: string): Promise<Comment> => {
    const path = entityCommentPaths[entityType] ?? entityType
    const response = await apiClient.put<Comment>(`/comments/${path}/${commentId}`, { text })
    return response.data
  },

  deleteComment: async (entityType: CommentEntityType, commentId: number): Promise<void> => {
    const path = entityCommentPaths[entityType] ?? entityType
    await apiClient.delete(`/comments/${path}/${commentId}`)
  },

  setReaction: async (
    entityType: CommentEntityType,
    entityId: number,
    commentId: number,
    value: 1 | -1,
  ): Promise<{ plusCount: number; minusCount: number }> => {
    const path = entityCommentPaths[entityType] ?? entityType
    const base = path === 'light-novels' ? 'light-novels' : path
    const res = await apiClient.post<{ plusCount: number; minusCount: number }>(
      `/${base}/${entityId}/comments/${commentId}/reaction`,
      { value },
    )
    return res.data
  },
}
