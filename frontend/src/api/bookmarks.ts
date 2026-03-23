import apiClient from '@/api/client'
import type { Collection, NewsDetail } from '@/types'

export type BookmarkTargetType = 'collection' | 'news'

export interface BookmarkItem {
  id: number
  targetType: BookmarkTargetType
  targetId: number
  createdAt: string
  target?: Collection | NewsDetail
}

export interface BookmarksResponse {
  bookmarks: BookmarkItem[]
}

export const bookmarksApi = {
  getList: async (): Promise<BookmarkItem[]> => {
    const response = await apiClient.get<BookmarksResponse>('/bookmarks')
    return response.data.bookmarks ?? []
  },

  check: async (targetType: BookmarkTargetType, targetId: number): Promise<boolean> => {
    const response = await apiClient.get<{ bookmarked: boolean }>(`/bookmarks/check/${targetType}/${targetId}`)
    return response.data.bookmarked
  },

  add: async (
    targetType: BookmarkTargetType,
    targetId: number,
  ): Promise<{ bookmark: { id: number; userId: number; targetType: string; targetId: number }; message?: string }> => {
    const response = await apiClient.post<{
      bookmark: { id: number; userId: number; targetType: string; targetId: number }
      message?: string
    }>('/bookmarks', { targetType, targetId })
    return response.data
  },

  remove: async (targetType: BookmarkTargetType, targetId: number): Promise<void> => {
    await apiClient.delete(`/bookmarks/${targetType}/${targetId}`)
  },
}
