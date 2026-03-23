import type { RecommendedItem } from '@/types'

type MovieLike = { id: number; title: string; description?: string }
type AnimeLike = { id: number; title: string; description?: string }

export function createMockRecommendations(mockMovies: MovieLike[], mockAnime: AnimeLike[]): RecommendedItem[] {
  return [
    {
      mediaId: mockMovies[1].id,
      title: mockMovies[1].title,
      score: 0.95,
      poster: undefined,
      description: mockMovies[1].description,
    },
    {
      mediaId: mockMovies[4].id,
      title: mockMovies[4].title,
      score: 0.92,
      poster: undefined,
      description: mockMovies[4].description,
    },
    {
      mediaId: mockAnime[1].id,
      title: mockAnime[1].title,
      score: 0.88,
      poster: undefined,
      description: mockAnime[1].description,
    },
  ]
}
