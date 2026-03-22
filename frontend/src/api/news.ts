import { apiClient } from '@/api/client'
import type { NewsDetail, NewsListItem, NewsComment, NewsAttachment } from '@/types'

export interface NewsListResponse {
  news: NewsListItem[]
}

export interface NewsTagsResponse {
  tags: string[]
}

export const newsApi = {
  getList(params?: { tags?: string[] }): Promise<NewsListResponse> {
    const search = params?.tags?.length ? new URLSearchParams({ tags: params.tags.join(',') }).toString() : ''
    return apiClient.get<NewsListResponse>(`/news${search ? `?${search}` : ''}`).then((r) => r.data)
  },

  getTags(): Promise<NewsTagsResponse> {
    return apiClient.get<NewsTagsResponse>('/news/tags').then((r) => r.data)
  },

  getById(id: number): Promise<NewsDetail> {
    return apiClient.get<NewsDetail>(`/news/${id}`).then((r) => r.data)
  },
}

export interface NewsCommentsResponse {
  comments: NewsComment[]
}

export const newsCommentsApi = {
  getList(newsId: number): Promise<NewsCommentsResponse> {
    return apiClient.get<NewsCommentsResponse>(`/news/${newsId}/comments`).then((r) => r.data)
  },

  create(newsId: number, payload: { text: string; parentId?: number }): Promise<NewsComment> {
    return apiClient.post<NewsComment>(`/news/${newsId}/comments`, payload).then((r) => r.data)
  },

  update(newsId: number, commentId: number, text: string): Promise<NewsComment> {
    return apiClient.put<NewsComment>(`/news/${newsId}/comments/${commentId}`, { text }).then((r) => r.data)
  },

  delete(newsId: number, commentId: number): Promise<void> {
    return apiClient.delete(`/news/${newsId}/comments/${commentId}`).then(() => undefined)
  },
}

export interface NewsCreateInput {
  title: string
  slug?: string
  previewImage?: string
  previewTitle?: string
  body: string
  tags?: string
  attachments?: NewsAttachment[]
}

export const adminNewsApi = {
  upload(file: File, type: 'image' | 'video', options?: { baseName?: string }): Promise<{ path: string }> {
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    if (options?.baseName) form.append('baseName', options.baseName)
    return apiClient
      .post<{ path: string }>('/admin/news/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  create(payload: NewsCreateInput): Promise<NewsDetail> {
    return apiClient.post<NewsDetail>('/admin/news', payload).then((r) => r.data)
  },

  update(id: number, payload: NewsCreateInput): Promise<NewsDetail> {
    return apiClient.put<NewsDetail>(`/admin/news/${id}`, payload).then((r) => r.data)
  },

  delete(id: number): Promise<void> {
    return apiClient.delete(`/admin/news/${id}`).then(() => undefined)
  },
}
