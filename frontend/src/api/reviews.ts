import apiClient from '@/api/client'
import type { Review, UserReviewsResponse } from '@/types'

/** Оценка из списка пользователя с похожим вкусом (similarityScore 0–1, на UI в %). */
export interface SimilarUserListRating {
  userId: number
  username?: string | null
  name?: string | null
  avatar?: string | null
  similarityScore: number
  rating: number
}

/** Типы медиа, для которых есть рецензии на бэкенде (путь в API). */
export type ReviewMediaType =
  | 'movies'
  | 'tv-series'
  | 'cartoon-series'
  | 'cartoon-movies'
  | 'anime'
  | 'anime-movies'
  | 'games'
  | 'manga'
  | 'books'
  | 'light-novels'

const REVIEW_PATH_BY_TYPE: Record<ReviewMediaType, string> = {
  movies: 'movies',
  'tv-series': 'tv-series',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  anime: 'anime',
  'anime-movies': 'anime-movies',
  games: 'games',
  manga: 'manga',
  books: 'books',
  'light-novels': 'light-novels',
}

export const reviewsApi = {
  getMyReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>('/reviews')
    return response.data
  },

  /** Рецензии пользователя по username (доступно если профиль открыт или вы в друзьях). */
  getUserReviewsByUsername: async (username: string): Promise<UserReviewsResponse> => {
    const response = await apiClient.get<UserReviewsResponse>(`/users/username/${encodeURIComponent(username)}/reviews`)
    return response.data
  },

  getMovieReviews: async (movieId: number, page = 0): Promise<{ data: Review[]; total: number }> => {
    const response = await apiClient.get<Review[]>(`/movies/${movieId}/reviews?page=${page}`)
    return { data: response.data, total: Array.isArray(response.data) ? response.data.length : 0 }
  },

  /** Список рецензий для любого типа медиа (GET /media/:type/:id/reviews). */
  getMediaReviews: async (mediaType: ReviewMediaType, entityId: number): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`/media/${mediaType}/${entityId}/reviews`)
    return Array.isArray(response.data) ? response.data : []
  },

  /** Рецензии на тайтл только от пользователей с похожими вкусами (для авторизованных). */
  getMediaReviewsFromSimilarUsers: async (mediaType: ReviewMediaType, entityId: number): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`/media/${mediaType}/${entityId}/reviews-from-similar-users`)
    return Array.isArray(response.data) ? response.data : []
  },

  /** Оценки тайтла из списков (list item) только от пользователей с похожими вкусами. Без ревью. */
  getSimilarUsersRatings: async (mediaType: ReviewMediaType, entityId: number): Promise<SimilarUserListRating[]> => {
    const response = await apiClient.get<SimilarUserListRating[]>(
      `/media/${mediaType}/${entityId}/similar-users-ratings`,
    )
    return Array.isArray(response.data) ? response.data : []
  },

  createMovieReview: async (
    movieId: number,
    data: { overallRating: number; review?: string; reviewStatus?: string },
  ): Promise<Review> => {
    const response = await apiClient.post<Review>(`/reviews/movies/${movieId}`, data)
    return response.data
  },

  updateMovieReview: async (
    movieId: number,
    data: { overallRating?: number; review?: string; reviewStatus?: string },
  ): Promise<Review> => {
    const response = await apiClient.put<Review>(`/reviews/movies/${movieId}`, data)
    return response.data
  },

  deleteMovieReview: async (movieId: number): Promise<void> => {
    await apiClient.delete(`/reviews/movies/${movieId}`)
  },

  /** Создать рецензию (для anime, games, manga, books, light-novels). */
  createReview: async (
    mediaType: ReviewMediaType,
    entityId: number,
    data: { overallRating: number; review?: string; reviewStatus?: string },
  ): Promise<Review> => {
    const path = REVIEW_PATH_BY_TYPE[mediaType]
    const response = await apiClient.post<Review>(`/reviews/${path}/${entityId}`, data)
    return response.data
  },

  /** Обновить рецензию (для anime, games, manga, books, light-novels, tv-series, cartoon-series, cartoon-movies, anime-movies). */
  updateReview: async (
    mediaType: ReviewMediaType,
    entityId: number,
    data: { overallRating?: number; review?: string; reviewStatus?: string },
  ): Promise<Review> => {
    const path = REVIEW_PATH_BY_TYPE[mediaType]
    const response = await apiClient.put<Review>(`/reviews/${path}/${entityId}`, data)
    return response.data
  },

  /** Удалить рецензию (для всех типов кроме movie). */
  deleteReview: async (mediaType: ReviewMediaType, entityId: number): Promise<void> => {
    const path = REVIEW_PATH_BY_TYPE[mediaType]
    await apiClient.delete(`/reviews/${path}/${entityId}`)
  },
}
