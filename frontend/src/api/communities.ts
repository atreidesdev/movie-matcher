import apiClient from '@/api/client'

export interface CommunityPostAttachment {
  type: 'image' | 'video'
  path: string
}

export interface CommunityListItem {
  id: number
  name: string
  slug: string
  description: string
  avatar?: string
  cover?: string
  creatorId: number
  creatorName?: string
  subscribers: number
  isSubscribed?: boolean
}

export interface CommunityDetail extends CommunityListItem {
  creatorUsername?: string
}

export interface CommunityPostItem {
  id: number
  communityId: number
  communityName?: string
  communitySlug?: string
  authorId: number
  authorName?: string
  authorUsername?: string
  title: string
  previewImage?: string
  attachments?: CommunityPostAttachment[]
  body: string
  createdAt: string
}

export const communitiesApi = {
  getList: () => apiClient.get<{ communities: CommunityListItem[] }>('/communities').then((r) => r.data),

  create: (payload: { name: string; description?: string; avatar?: string; cover?: string }) =>
    apiClient.post<CommunityDetail>('/communities', payload).then((r) => r.data),

  getFeed: () => apiClient.get<{ posts: CommunityPostItem[] }>('/communities/feed').then((r) => r.data),

  getById: (idOrSlug: string) =>
    apiClient.get<CommunityDetail>(`/communities/${encodeURIComponent(idOrSlug)}`).then((r) => r.data),

  update: (id: number, payload: Partial<{ name: string; description: string; avatar: string; cover: string }>) =>
    apiClient.put<CommunityDetail>(`/communities/${id}`, payload).then((r) => r.data),

  delete: (id: number) => apiClient.delete(`/communities/${id}`),

  subscribe: (id: number) =>
    apiClient.post<{ subscribed: boolean }>(`/communities/${id}/subscribe`).then((r) => r.data),

  unsubscribe: (id: number) =>
    apiClient.post<{ subscribed: boolean }>(`/communities/${id}/unsubscribe`).then((r) => r.data),

  getPosts: (communityId: number) =>
    apiClient.get<{ posts: CommunityPostItem[] }>(`/communities/${communityId}/posts`).then((r) => r.data),

  uploadPostImage: (communityId: number, file: File, type: 'image' | 'video', options?: { baseName?: string }) => {
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    if (options?.baseName) form.append('baseName', options.baseName)
    return apiClient
      .post<{ path: string }>(`/communities/${communityId}/posts/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  createPost: (
    communityId: number,
    payload: { title: string; body: string; previewImage?: string; attachments?: CommunityPostAttachment[] },
  ) => apiClient.post<CommunityPostItem>(`/communities/${communityId}/posts`, payload).then((r) => r.data),

  getPost: (communityId: number, postId: number) =>
    apiClient.get<CommunityPostItem>(`/communities/${communityId}/posts/${postId}`).then((r) => r.data),

  updatePost: (
    communityId: number,
    postId: number,
    payload: { title: string; body: string; previewImage?: string; attachments?: CommunityPostAttachment[] },
  ) => apiClient.put<CommunityPostItem>(`/communities/${communityId}/posts/${postId}`, payload).then((r) => r.data),

  deletePost: (communityId: number, postId: number) => apiClient.delete(`/communities/${communityId}/posts/${postId}`),

  getSubscriptionsByUsername: (username: string) =>
    apiClient
      .get<{ communities: CommunityListItem[] }>(
        `/users/username/${encodeURIComponent(username)}/community-subscriptions`,
      )
      .then((r) => r.data),
}
