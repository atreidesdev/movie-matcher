import apiClient from '@/api/client'
import type { Character, Media } from '@/types'
import type { PaginatedResponse } from '@/types'

export interface CharactersListParams {
  search?: string
  /** Filter: characters that appear in this media type */
  mediaType?: string
}

export interface CharacterAppearances {
  movies?: Media[]
  tvSeries?: Media[]
  animeSeries?: Media[]
  animeMovies?: Media[]
  cartoonSeries?: Media[]
  cartoonMovies?: Media[]
  games?: Media[]
}

export const charactersApi = {
  getById: async (id: number): Promise<Character> => {
    const response = await apiClient.get<Character>(`/characters/${id}`)
    return response.data
  },

  getAppearances: async (id: number): Promise<CharacterAppearances> => {
    const response = await apiClient.get<CharacterAppearances>(`/characters/${id}/appearances`)
    return response.data
  },

  getList: async (
    page = 1,
    pageSize = 200,
    search?: string,
    listParams?: CharactersListParams
  ): Promise<PaginatedResponse<Character>> => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    const searchTerm = listParams?.search ?? search
    if (searchTerm?.trim()) params.set('search', searchTerm.trim())
    if (listParams?.mediaType) params.set('mediaType', listParams.mediaType)
    const response = await apiClient.get<PaginatedResponse<Character>>(`/characters?${params}`)
    return response.data
  },
}
