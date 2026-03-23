import { createGetMockAchievements } from '@/mock/data/achievements'
import { createDerivedMocks } from '@/mock/data/derived'
import { createListProfiles } from '@/mock/data/listProfiles'
import { createListUtils } from '@/mock/data/listUtils'
import { listCountsFromListItems } from '@/mock/data/listCounts'
import { createModerationMocks } from '@/mock/data/moderation'
import type { Genre, PublicProfile, Theme } from '@/types'

type Deps = {
  past: (days: number) => string
  mockGenres: Genre[]
  mockThemes: Theme[]
  core: {
    mockCurrentUser: unknown
    mockUsers: unknown[]
    mockMovies: unknown[]
    mockAnime: unknown[]
    mockGames: unknown[]
    mockTVSeries: unknown[]
    mockManga: unknown[]
    mockBooks: unknown[]
    mockLightNovels: unknown[]
    mockCartoonSeries: unknown[]
    mockCartoonMovies: unknown[]
    mockAnimeMovies: unknown[]
    mockCharacters: unknown[]
    mockPersons: unknown[]
  }
}

export function createAssembledMocks({ past, mockGenres, mockThemes, core }: Deps) {
  const listProfiles = createListProfiles({
    past,
    mockCurrentUser: core.mockCurrentUser as PublicProfile,
    mockUsers: core.mockUsers as PublicProfile[],
    mockMovies: core.mockMovies,
    mockAnime: core.mockAnime,
    mockGames: core.mockGames,
    mockTVSeries: core.mockTVSeries,
    mockManga: core.mockManga,
    mockBooks: core.mockBooks,
    mockLightNovels: core.mockLightNovels,
    mockCartoonSeries: core.mockCartoonSeries,
    mockCartoonMovies: core.mockCartoonMovies,
    mockAnimeMovies: core.mockAnimeMovies,
    listCountsFromListItems,
  })

  const derivedMocks = createDerivedMocks({
    past,
    mockCurrentUser: core.mockCurrentUser,
    mockUsers: core.mockUsers,
    mockMovies: core.mockMovies,
    mockTVSeries: core.mockTVSeries,
    mockGames: core.mockGames,
    mockAnime: core.mockAnime,
    mockAnimeMovies: core.mockAnimeMovies,
    mockManga: core.mockManga,
    mockBooks: core.mockBooks,
    mockLightNovels: core.mockLightNovels,
    mockCartoonSeries: core.mockCartoonSeries,
    mockCartoonMovies: core.mockCartoonMovies,
    mockCharacters: core.mockCharacters,
    mockPersons: core.mockPersons,
  })

  const listUtils = createListUtils({
    mockListItems: listProfiles.mockListItems,
    mockGenres,
    mockThemes,
    byPath: {
      movies: core.mockMovies as { genres?: Genre[]; themes?: Theme[] }[],
      anime: core.mockAnime as { genres?: Genre[]; themes?: Theme[] }[],
      games: core.mockGames as { genres?: Genre[]; themes?: Theme[] }[],
      'tv-series': core.mockTVSeries as { genres?: Genre[]; themes?: Theme[] }[],
      manga: core.mockManga as { genres?: Genre[]; themes?: Theme[] }[],
      books: core.mockBooks as { genres?: Genre[]; themes?: Theme[] }[],
      'light-novels': core.mockLightNovels as { genres?: Genre[]; themes?: Theme[] }[],
      'cartoon-series': core.mockCartoonSeries as { genres?: Genre[]; themes?: Theme[] }[],
      'cartoon-movies': core.mockCartoonMovies as { genres?: Genre[]; themes?: Theme[] }[],
      'anime-movies': core.mockAnimeMovies as { genres?: Genre[]; themes?: Theme[] }[],
    },
  })

  const getMockAchievements = createGetMockAchievements(mockGenres, derivedMocks.franchiseMocks.mockFranchises)
  const moderationMocks = createModerationMocks(past)

  return {
    listProfiles,
    derivedMocks,
    getMockAchievements,
    moderationMocks,
    getFiltersGenresAndThemesForMediaType: listUtils.getFiltersGenresAndThemesForMediaType,
    getListStatusByMediaId: listUtils.getListStatusByMediaId,
  }
}
