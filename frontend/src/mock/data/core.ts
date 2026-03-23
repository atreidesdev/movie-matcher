import { createCatalogMocks } from '@/mock/data/catalogs'
import { createPeopleMocks } from '@/mock/data/people'
import { createMockMovies } from '@/mock/data/movies'
import { createPersonWorksMocks } from '@/mock/data/personWorks'
import { createMockAnime } from '@/mock/data/anime'
import { createMockGames } from '@/mock/data/games'
import { createMockTVSeries } from '@/mock/data/tvSeries'
import { createMockManga } from '@/mock/data/manga'
import { createMockBooks } from '@/mock/data/books'
import { createMockLightNovels } from '@/mock/data/lightNovels'
import { createMockCartoonSeries } from '@/mock/data/cartoonSeries'
import { createMockCartoonMovies } from '@/mock/data/cartoonMovies'
import { createMockAnimeMovies } from '@/mock/data/animeMovies'
import { enrichPersonWorks } from '@/mock/data/personWorksEnrichment'
import { assignSimilar } from '@/mock/data/similar'
import { createEntityHelpers } from '@/mock/data/entityHelpers'
import { mockVideos, mockVideosWithBackendPath, mockImages, applyMockPosters, applyMockBackdrops } from '@/mock/data/mediaAssets'
import { createUserMocks } from '@/mock/data/users'

type Deps = {
  past: (days: number) => string
  mockGenres: any[]
  mockThemes: any[]
}

export function createCoreMocks({ past, mockGenres, mockThemes }: Deps) {
  const catalogMocks = createCatalogMocks()
  const mockStudios = catalogMocks.mockStudios
  const mockPublishers = catalogMocks.mockPublishers
  const mockPlatforms = catalogMocks.mockPlatforms
  const mockSites = catalogMocks.mockSites
  const mockDevelopers = catalogMocks.mockDevelopers
  const studio1 = mockStudios[0]
  const studio2 = mockStudios[1]
  const studio3 = mockStudios[2]
  const studio4 = mockStudios[3]
  const studio5 = mockStudios[4]

  const peopleMocks = createPeopleMocks()
  const mockPersons = peopleMocks.mockPersons
  const mockCharacters = peopleMocks.mockCharacters
  const mockCast = peopleMocks.mockCast
  const mockDubbings = peopleMocks.mockDubbings
  const mockCastByMovieId = peopleMocks.mockCastByMovieId

  const mockMovies = createMockMovies({ mockGenres, mockThemes, studio1, studio3, mockImages, mockVideos, mockVideosWithBackendPath, applyMockPosters, applyMockBackdrops })
  const personWorksMocks = createPersonWorksMocks({ mockCastByMovieId, mockMovies, mockDubbings })
  const mockPersonWorksByPersonId = personWorksMocks.mockPersonWorksByPersonId
  const mockAnime = createMockAnime({ mockGenres, mockStudios, studio2, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })
  const mockGames = createMockGames({ mockGenres, mockDevelopers, mockPublishers, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })
  const mockTVSeries = createMockTVSeries({ mockGenres, studio1, studio3, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })
  const mockManga = createMockManga({ mockGenres, mockPersons, mockPublishers, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })
  const mockBooks = createMockBooks({ mockGenres, mockPersons, mockPublishers, mockImages, applyMockPosters, applyMockBackdrops })
  const mockLightNovels = createMockLightNovels({ mockGenres, mockPersons, mockPublishers, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })
  const mockCartoonSeries = createMockCartoonSeries({ mockGenres, studio1, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })
  const mockCartoonMovies = createMockCartoonMovies({ mockGenres, studio1, studio4, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })
  const mockAnimeMovies = createMockAnimeMovies({ mockGenres, studio2, studio5, mockImages, mockVideos, applyMockPosters, applyMockBackdrops })

  enrichPersonWorks({
    mockPersonWorksByPersonId,
    mockManga,
    mockBooks,
    mockLightNovels,
    mockCartoonSeries,
    mockTVSeries,
    mockAnime,
    mockAnimeMovies,
    mockCartoonMovies,
  })

  assignSimilar({
    mockMovies,
    mockAnime,
    mockGames,
    mockTVSeries,
    mockManga,
    mockLightNovels,
    mockCartoonSeries,
    mockCartoonMovies,
    mockAnimeMovies,
  })

  const entityHelpers = createEntityHelpers({
    mockCastByMovieId,
    mockMovies,
    mockTVSeries,
    mockAnime,
    mockAnimeMovies,
    mockCartoonSeries,
    mockCartoonMovies,
    mockGames,
    mockManga,
    mockBooks,
    mockLightNovels,
  })

  const userMocks = createUserMocks(past)
  const mockCurrentUser = userMocks.mockCurrentUser
  const mockSessions = userMocks.mockSessions
  const mockUsers = userMocks.mockUsers

  return {
    mockStudios,
    mockPublishers,
    mockPlatforms,
    mockSites,
    mockDevelopers,
    mockPersons,
    mockCharacters,
    mockCast,
    mockDubbings,
    mockCastByMovieId,
    mockMovies,
    mockPersonWorksByPersonId,
    mockAnime,
    mockGames,
    mockTVSeries,
    mockManga,
    mockBooks,
    mockLightNovels,
    mockCartoonSeries,
    mockCartoonMovies,
    mockAnimeMovies,
    getMockCharacterAppearances: entityHelpers.getMockCharacterAppearances,
    getStudioProjects: entityHelpers.getStudioProjects,
    getPublisherProjects: entityHelpers.getPublisherProjects,
    getDeveloperProjects: entityHelpers.getDeveloperProjects,
    mockCurrentUser,
    mockSessions,
    mockUsers,
  }
}
