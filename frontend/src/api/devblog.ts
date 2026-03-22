import { apiClient } from '@/api/client'
import type { DevBlogPost } from '@/types'

export interface DevBlogListResponse {
  posts: DevBlogPost[]
}

export const devblogApi = {
  getList(): Promise<DevBlogListResponse> {
    return apiClient.get<DevBlogListResponse>('/devblog').then((r) => r.data)
  },

  getById(id: number): Promise<DevBlogPost> {
    return apiClient.get<DevBlogPost>(`/devblog/${id}`).then((r) => r.data)
  },
}

export interface DevBlogCreateInput {
  title: string
  body: string
  slug?: string
}

export const adminDevblogApi = {
  create(payload: DevBlogCreateInput): Promise<DevBlogPost> {
    return apiClient.post<DevBlogPost>('/admin/devblog', payload).then((r) => r.data)
  },

  update(id: number, payload: DevBlogCreateInput): Promise<DevBlogPost> {
    return apiClient.put<DevBlogPost>(`/admin/devblog/${id}`, payload).then((r) => r.data)
  },

  delete(id: number): Promise<void> {
    return apiClient.delete(`/admin/devblog/${id}`).then(() => undefined)
  },
}
