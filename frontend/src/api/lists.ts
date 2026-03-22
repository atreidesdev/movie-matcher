import apiClient from '@/api/client'
import { ListItem, ListStatus } from '@/types'

export type ListEntityType =
  | 'movies'
  | 'anime'
  | 'games'
  | 'tv-series'
  | 'cartoon-series'
  | 'cartoon-movies'
  | 'anime-movies'
  | 'manga'
  | 'books'
  | 'light-novels'

export const listsApi = {
  getList: async (type: ListEntityType, status?: ListStatus): Promise<ListItem[]> => {
    const params = status ? `?status=${status}` : ''
    const response = await apiClient.get<ListItem[]>(`/lists/${type}${params}`)
    return response.data
  },

  getListByUsername: async (username: string, type: ListEntityType, status?: ListStatus): Promise<ListItem[]> => {
    const params = status ? `?status=${status}` : ''
    const response = await apiClient.get<ListItem[]>(
      `/users/username/${encodeURIComponent(username)}/lists/${type}${params}`
    )
    return response.data
  },

  addToList: async (
    type: ListEntityType,
    entityId: number,
    payload: {
      status: ListStatus
      comment?: string
      rating?: number
      currentEpisode?: number
      currentProgress?: number
      currentPage?: number
      maxPages?: number
      currentVolume?: number
      currentChapter?: number
      currentVolumeNumber?: number
      currentChapterNumber?: number
      titleReaction?: string
      hoursPlayed?: number
    }
  ): Promise<ListItem> => {
    const response = await apiClient.post<ListItem>(`/lists/${type}/${entityId}`, payload)
    return response.data
  },

  updateInList: async (type: ListEntityType, entityId: number, data: Partial<ListItem>): Promise<ListItem> => {
    const response = await apiClient.put<ListItem>(`/lists/${type}/${entityId}`, data)
    return response.data
  },

  removeFromList: async (type: ListEntityType, entityId: number): Promise<void> => {
    await apiClient.delete(`/lists/${type}/${entityId}`)
  },

  getMovieList: async (status?: ListStatus): Promise<ListItem[]> => {
    return listsApi.getList('movies', status)
  },
  addMovieToList: async (movieId: number, status: ListStatus, comment?: string): Promise<ListItem> => {
    return listsApi.addToList('movies', movieId, { status, comment })
  },
  updateMovieInList: async (movieId: number, data: Partial<ListItem>): Promise<ListItem> => {
    return listsApi.updateInList('movies', movieId, data)
  },
  removeMovieFromList: async (movieId: number): Promise<void> => {
    return listsApi.removeFromList('movies', movieId)
  },

  getAnimeList: async (status?: ListStatus): Promise<ListItem[]> => {
    return listsApi.getList('anime', status)
  },
  addAnimeToList: async (
    animeId: number,
    status: ListStatus,
    comment?: string,
    currentEpisode?: number
  ): Promise<ListItem> => {
    return listsApi.addToList('anime', animeId, { status, comment, currentEpisode })
  },
  updateAnimeInList: async (animeId: number, data: Partial<ListItem>): Promise<ListItem> => {
    return listsApi.updateInList('anime', animeId, data)
  },
  removeAnimeFromList: async (animeId: number): Promise<void> => {
    return listsApi.removeFromList('anime', animeId)
  },
}
