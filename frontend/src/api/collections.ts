import apiClient from '@/api/client'
import { Collection } from '@/types'

/** Публичные (сайтовые) коллекции — без авторизации */
export interface PublicCollectionListItem {
  id: number
  name: string
  description?: string | null
  poster?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export const publicCollectionsApi = {
  getList: async (): Promise<PublicCollectionListItem[]> => {
    const response = await apiClient.get<PublicCollectionListItem[]>('/public-collections')
    return response.data
  },

  getOne: async (id: number): Promise<Collection> => {
    const response = await apiClient.get<Collection>(`/public-collections/${id}`)
    return response.data
  },
}

export const collectionsApi = {
  getList: async (): Promise<Collection[]> => {
    const response = await apiClient.get<Collection[]>('/collections')
    return response.data
  },

  getListByUsername: async (username: string): Promise<Collection[]> => {
    const response = await apiClient.get<Collection[]>(`/users/username/${encodeURIComponent(username)}/collections`)
    return response.data
  },

  getOne: async (id: number): Promise<Collection> => {
    const response = await apiClient.get<Collection>(`/collections/${id}`)
    return response.data
  },

  create: async (data: { name: string; description?: string; isPublic?: boolean }) => {
    const response = await apiClient.post<Collection>('/collections', data)
    return response.data
  },

  update: async (id: number, data: { name?: string; description?: string; isPublic?: boolean }) => {
    const response = await apiClient.put<Collection>(`/collections/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/collections/${id}`)
  },

  addMovie: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/movies`, { mediaId })
  },
  removeMovie: async (collectionId: number, movieId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/movies/${movieId}`)
  },

  addAnime: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/anime`, { mediaId })
  },
  removeAnime: async (collectionId: number, animeId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/anime/${animeId}`)
  },

  addGame: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/games`, { mediaId })
  },
  removeGame: async (collectionId: number, gameId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/games/${gameId}`)
  },

  addManga: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/manga`, { mediaId })
  },
  removeManga: async (collectionId: number, mangaId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/manga/${mangaId}`)
  },

  addBook: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/books`, { mediaId })
  },
  removeBook: async (collectionId: number, bookId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/books/${bookId}`)
  },

  addLightNovel: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/light-novels`, { mediaId })
  },
  removeLightNovel: async (collectionId: number, novelId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/light-novels/${novelId}`)
  },

  addTvSeries: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/tv-series`, { mediaId })
  },
  removeTvSeries: async (collectionId: number, tvSeriesId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/tv-series/${tvSeriesId}`)
  },
  addCartoonSeries: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/cartoon-series`, { mediaId })
  },
  removeCartoonSeries: async (collectionId: number, cartoonSeriesId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/cartoon-series/${cartoonSeriesId}`)
  },
  addCartoonMovie: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/cartoon-movies`, { mediaId })
  },
  removeCartoonMovie: async (collectionId: number, cartoonMovieId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/cartoon-movies/${cartoonMovieId}`)
  },
  addAnimeMovie: async (collectionId: number, mediaId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/anime-movies`, { mediaId })
  },
  removeAnimeMovie: async (collectionId: number, animeMovieId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/anime-movies/${animeMovieId}`)
  },
}
