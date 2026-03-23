import { createMockCollections } from '@/mock/data/collections'
import { createMockFavorites } from '@/mock/data/favorites'
import { createFranchiseMocks } from '@/mock/data/franchises'
import { createMockRecommendations } from '@/mock/data/recommendations'
import { createReviewsCommentsMocks } from '@/mock/data/reviewsComments'
import { createSocialMocks } from '@/mock/data/social'
import type { Collection, RecommendedItem } from '@/types'

type Deps = {
  past: (days: number) => string
  mockCurrentUser: any
  mockUsers: any[]
  mockMovies: any[]
  mockTVSeries: any[]
  mockGames: any[]
  mockAnime: any[]
  mockAnimeMovies: any[]
  mockManga: any[]
  mockBooks: any[]
  mockLightNovels: any[]
  mockCartoonSeries: any[]
  mockCartoonMovies: any[]
  mockCharacters: any[]
  mockPersons: any[]
}

export function createDerivedMocks(deps: Deps) {
  const {
    past,
    mockCurrentUser,
    mockUsers,
    mockMovies,
    mockTVSeries,
    mockGames,
    mockAnime,
    mockAnimeMovies,
    mockManga,
    mockBooks,
    mockLightNovels,
    mockCartoonSeries,
    mockCartoonMovies,
    mockCharacters,
    mockPersons,
  } = deps

  const favoritesData = createMockFavorites({
    mockMovies,
    mockTVSeries,
    mockAnime,
    mockGames,
    mockManga,
    mockBooks,
    mockCartoonSeries,
    mockCartoonMovies,
    mockAnimeMovies,
    mockLightNovels,
    mockCharacters,
    mockPersons,
  })

  const mockCollections: Collection[] = createMockCollections({
    past,
    mockCurrentUser,
    mockMovies,
    mockTVSeries,
    mockGames,
    mockAnime,
    mockAnimeMovies,
    mockManga,
    mockBooks,
    mockLightNovels,
    mockCartoonMovies,
  })

  const mockRecommendations: RecommendedItem[] = createMockRecommendations(mockMovies, mockAnime)

  const franchiseMocks = createFranchiseMocks({
    mockMovies,
    mockAnime,
    mockGames,
    mockTVSeries,
  })

  const reviewsCommentsMocks = createReviewsCommentsMocks({
    past,
    mockCurrentUser,
    mockUsers,
  })

  const socialMocks = createSocialMocks({
    past,
    mockUsers,
    mockCurrentUser,
    mockMovies,
    mockAnime,
    mockGames,
    mockCollections,
  })

  return {
    favoritesData,
    mockCollections,
    mockRecommendations,
    franchiseMocks,
    reviewsCommentsMocks,
    socialMocks,
  }
}
