import apiClient from '@/api/client'
import type { LocalizedString, PaginatedResponse } from '@/types'

export interface FranchiseLinkItem {
  id: number
  franchiseId: number
  franchiseName: string
  franchiseNameI18n?: LocalizedString
  relationType: string
  relatedType: string
  relatedMediaId: number
  relatedTitle: string
  relatedTitleI18n?: LocalizedString
  relatedPoster?: string | null
  relatedRating?: number | null
  listStatus?: string | null
}

export interface Franchise {
  id: number
  name: string
  nameI18n?: LocalizedString
  description?: string
  poster?: string
  aliases?: string[]
  links?: FranchiseMediaLink[]
}

export interface FranchiseMediaLink {
  id: number
  franchiseId: number
  fromMediaType: string
  fromMediaId: number
  toMediaType: string
  toMediaId: number
  relationType: string
  orderNumber?: number
  note?: string
}

export function getFranchiseLinksByMedia(mediaType: string, mediaId: number): Promise<FranchiseLinkItem[]> {
  return apiClient
    .get<FranchiseLinkItem[]>('/franchises/by-media', { params: { mediaType, mediaId } })
    .then((r) => r.data)
}

export const franchiseApi = {
  getList: (page = 1, pageSize = 50) =>
    apiClient.get<PaginatedResponse<Franchise>>('/franchises', { params: { page, pageSize } }).then((r) => r.data),
  search: (q: string) =>
    apiClient.get<Franchise[]>('/franchises/search', { params: { q: q.trim() } }).then((r) => r.data),
  getOne: (id: number) => apiClient.get<Franchise>(`/franchises/${id}`).then((r) => r.data),
  getMedia: (id: number) => apiClient.get<FranchiseMediaLink[]>(`/franchises/${id}/media`).then((r) => r.data),
  create: (data: {
    name: string
    nameI18n?: LocalizedString
    description?: string
    poster?: string
    aliases?: string[]
  }) => apiClient.post<Franchise>('/admin/franchises', data).then((r) => r.data),
  update: (
    id: number,
    data: { name?: string; nameI18n?: LocalizedString; description?: string; poster?: string; aliases?: string[] },
  ) => apiClient.put<Franchise>(`/admin/franchises/${id}`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/admin/franchises/${id}`),
  addLink: (
    franchiseId: number,
    data: {
      fromMediaType: string
      fromMediaId: number
      toMediaType: string
      toMediaId: number
      relationType: string
      orderNumber?: number
      note?: string
    },
  ) => apiClient.post<FranchiseMediaLink>(`/admin/franchises/${franchiseId}/links`, data).then((r) => r.data),
  updateLink: (linkId: number, data: { relationType?: string; orderNumber?: number; note?: string }) =>
    apiClient.put<FranchiseMediaLink>(`/admin/franchises/links/${linkId}`, data).then((r) => r.data),
  deleteLink: (linkId: number) => apiClient.delete(`/admin/franchises/links/${linkId}`),
}
