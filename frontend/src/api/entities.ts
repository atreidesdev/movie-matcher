import apiClient from '@/api/client'
import type { Developer, Publisher, Studio } from '@/types'

export interface EntityProjectEntry {
  type: string
  id: number
  title: string
  poster?: string
}

export interface EntityProjectSection {
  type: string
  labelKey: string
  entries: EntityProjectEntry[]
}

export interface StudioWithProjects extends Studio {
  projects: EntityProjectSection[]
}

export interface PublisherWithProjects extends Publisher {
  projects: EntityProjectSection[]
}

export interface DeveloperWithProjects extends Developer {
  projects: EntityProjectSection[]
}

/** Элемент для фильтра (id + name, опционально nameI18n). */
export type FilterEntity = { id: number; name: string; nameI18n?: Record<string, string> }

export const entitiesApi = {
  getStudio: async (id: number): Promise<StudioWithProjects> => {
    const { data } = await apiClient.get<StudioWithProjects>(`/studios/${id}`)
    return data
  },

  getPublisher: async (id: number): Promise<PublisherWithProjects> => {
    const { data } = await apiClient.get<PublisherWithProjects>(`/publishers/${id}`)
    return data
  },

  getDeveloper: async (id: number): Promise<DeveloperWithProjects> => {
    const { data } = await apiClient.get<DeveloperWithProjects>(`/developers/${id}`)
    return data
  },

  /** Поиск студий по имени. Без search возвращает []. С ids — по списку id. */
  searchStudios: async (params: { search?: string; ids?: number[] }): Promise<FilterEntity[]> => {
    const p = new URLSearchParams()
    if (params.search?.trim()) p.set('search', params.search.trim())
    if (params.ids?.length) p.set('ids', params.ids.join(','))
    if (!p.toString()) return []
    const { data } = await apiClient.get<FilterEntity[]>(`/studios?${p}`)
    return Array.isArray(data) ? data : []
  },

  /** Поиск издателей по имени. Без search возвращает []. С ids — по списку id. */
  searchPublishers: async (params: { search?: string; ids?: number[] }): Promise<FilterEntity[]> => {
    const p = new URLSearchParams()
    if (params.search?.trim()) p.set('search', params.search.trim())
    if (params.ids?.length) p.set('ids', params.ids.join(','))
    if (!p.toString()) return []
    const { data } = await apiClient.get<FilterEntity[]>(`/publishers?${p}`)
    return Array.isArray(data) ? data : []
  },

  /** Поиск разработчиков по имени. Без search возвращает []. С ids — по списку id. */
  searchDevelopers: async (params: { search?: string; ids?: number[] }): Promise<FilterEntity[]> => {
    const p = new URLSearchParams()
    if (params.search?.trim()) p.set('search', params.search.trim())
    if (params.ids?.length) p.set('ids', params.ids.join(','))
    if (!p.toString()) return []
    const { data } = await apiClient.get<FilterEntity[]>(`/developers?${p}`)
    return Array.isArray(data) ? data : []
  },
}
