import apiClient from '@/api/client'

/** Тип отзыва на бэкенде (targetType для реакций). */
export type ReviewTargetType =
  | 'movie_review'
  | 'tv_series_review'
  | 'anime_series_review'
  | 'cartoon_series_review'
  | 'cartoon_movie_review'
  | 'anime_movie_review'
  | 'game_review'
  | 'manga_review'
  | 'book_review'
  | 'light_novel_review'

export type ReviewReactionType = 'like' | 'useful' | 'love' | 'laugh' | 'sad' | 'angry' | 'dislike'

export type CommentEmojiType = 'like' | 'heart' | 'laugh' | 'sad' | 'angry' | 'wow'

export interface ReviewReactionsResponse {
  counts: Record<string, number>
  myReaction: string | null
}

export interface CommentEmojiReactionsResponse {
  reactions: Record<string, { counts: Record<string, number>; myReaction: string }>
}

const REVIEW_TARGET_BY_MEDIA: Record<string, ReviewTargetType> = {
  movie: 'movie_review',
  'tv-series': 'tv_series_review',
  anime: 'anime_series_review',
  'cartoon-series': 'cartoon_series_review',
  'cartoon-movies': 'cartoon_movie_review',
  'anime-movies': 'anime_movie_review',
  game: 'game_review',
  manga: 'manga_review',
  book: 'book_review',
  'light-novels': 'light_novel_review',
}

export const reactionsApi = {
  getReviewReactions: async (targetType: ReviewTargetType, targetId: number): Promise<ReviewReactionsResponse> => {
    const response = await apiClient.get<ReviewReactionsResponse>(
      `/review-reactions/${encodeURIComponent(targetType)}/${targetId}`
    )
    return response.data
  },

  /** Пакетная загрузка реакций по списку отзывов. items = "movie_review:1,movie_review:2" */
  getReviewReactionsBatch: async (
    items: string
  ): Promise<{ reactions: Record<string, { counts: Record<string, number>; myReaction: string | null }> }> => {
    const response = await apiClient.get<{
      reactions: Record<string, { counts: Record<string, number>; myReaction: string | null }>
    }>(`/review-reactions/batch?items=${encodeURIComponent(items)}`)
    return response.data
  },

  getReviewTargetType: (mediaType: string): ReviewTargetType | undefined => REVIEW_TARGET_BY_MEDIA[mediaType],

  setReviewReaction: async (
    targetType: ReviewTargetType,
    targetId: number,
    reaction: ReviewReactionType
  ): Promise<{ counts: Record<string, number>; myReaction: string }> => {
    const response = await apiClient.post<{ counts: Record<string, number>; myReaction: string }>('/review-reactions', {
      targetType,
      targetId,
      reaction,
    })
    return response.data
  },

  deleteReviewReaction: async (targetType: ReviewTargetType, targetId: number): Promise<ReviewReactionsResponse> => {
    const response = await apiClient.delete<ReviewReactionsResponse>(
      `/review-reactions/${encodeURIComponent(targetType)}/${targetId}`
    )
    return response.data
  },

  getCommentEmojiReactions: async (
    entityType: string,
    commentIds: number[]
  ): Promise<CommentEmojiReactionsResponse> => {
    if (commentIds.length === 0) return { reactions: {} }
    const params = new URLSearchParams({
      entityType,
      commentIds: commentIds.join(','),
    })
    const response = await apiClient.get<CommentEmojiReactionsResponse>(`/comment-emoji-reactions?${params}`)
    return response.data
  },

  setCommentEmojiReaction: async (
    entityType: string,
    commentId: number,
    emoji: CommentEmojiType
  ): Promise<{ counts: Record<string, number>; myReaction: string }> => {
    const response = await apiClient.post<{ counts: Record<string, number>; myReaction: string }>(
      '/comment-emoji-reactions',
      { entityType, commentId, emoji }
    )
    return response.data
  },

  deleteCommentEmojiReaction: async (
    entityType: string,
    commentId: number
  ): Promise<{ counts: Record<string, number>; myReaction: string }> => {
    const response = await apiClient.delete<{ counts: Record<string, number>; myReaction: string }>(
      `/comment-emoji-reactions/${encodeURIComponent(entityType)}/${commentId}`
    )
    return response.data
  },
}
