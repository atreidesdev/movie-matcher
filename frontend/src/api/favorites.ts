import apiClient from '@/api/client'

export interface FavoriteMediaEntry {
  movieId?: number
  animeSeriesId?: number
  gameId?: number
  tvSeriesId?: number
  mangaId?: number
  bookId?: number
  lightNovelId?: number
  cartoonSeriesId?: number
  cartoonMovieId?: number
  animeMovieId?: number
}

export interface FavoriteCharacterEntry {
  characterId?: number
  character?: { id: number; name?: string; avatar?: string }
}

export interface FavoritePersonEntry {
  personId?: number
  person?: { id: number; firstName?: string; lastName?: string; avatar?: string }
}

export interface FavoriteCastEntry {
  castId?: number
  cast?: { id: number }
}

export interface FavoritesResponse {
  movies?: FavoriteMediaEntry[]
  tvSeries?: FavoriteMediaEntry[]
  animeSeries?: FavoriteMediaEntry[]
  games?: FavoriteMediaEntry[]
  manga?: FavoriteMediaEntry[]
  books?: FavoriteMediaEntry[]
  lightNovels?: FavoriteMediaEntry[]
  cartoonSeries?: FavoriteMediaEntry[]
  cartoonMovies?: FavoriteMediaEntry[]
  animeMovies?: FavoriteMediaEntry[]
  characters?: FavoriteCharacterEntry[]
  persons?: FavoritePersonEntry[]
  casts?: FavoriteCastEntry[]
}

type FavoriteEntity =
  | 'movies'
  | 'tv-series'
  | 'anime'
  | 'cartoon-series'
  | 'cartoon-movies'
  | 'anime-movies'
  | 'games'
  | 'manga'
  | 'books'
  | 'light-novels'
  | 'characters'
  | 'persons'
  | 'cast'

export const favoritesApi = {
  getAll: async (): Promise<FavoritesResponse> => {
    const response = await apiClient.get<FavoritesResponse>('/favorites')
    return response.data
  },

  /** Избранное пользователя по username (доступно если профиль открыт или вы в друзьях). */
  getByUsername: async (username: string): Promise<FavoritesResponse> => {
    const response = await apiClient.get<FavoritesResponse>(`/users/username/${encodeURIComponent(username)}/favorites`)
    return response.data
  },

  add: async (entity: FavoriteEntity, entityId: number): Promise<void> => {
    await apiClient.post(`/favorites/${entity}/${entityId}`)
  },

  remove: async (entity: FavoriteEntity, entityId: number): Promise<void> => {
    await apiClient.delete(`/favorites/${entity}/${entityId}`)
  },
}
