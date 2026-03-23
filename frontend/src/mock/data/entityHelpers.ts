import type {
  AnimeMovie,
  AnimeSeries,
  CartoonMovie,
  CartoonSeries,
  Game,
  Manga,
  Movie,
  TVSeries,
} from '@/types'

type CharacterAppearanceEntry = {
  characterId: number
  mediaType: 'tvSeries' | 'animeSeries' | 'animeMovies' | 'cartoonSeries' | 'cartoonMovies' | 'games' | 'manga'
  mediaId: number
}

export type EntityProjectEntry = { type: string; id: number; title: string; poster?: string }
export type EntityProjectSection = { type: string; labelKey: string; entries: EntityProjectEntry[] }

type EntityHelpersDeps = {
  mockCastByMovieId: Record<number, { characterId?: number }[]>
  mockMovies: Movie[]
  mockTVSeries: TVSeries[]
  mockAnime: AnimeSeries[]
  mockAnimeMovies: AnimeMovie[]
  mockCartoonSeries: CartoonSeries[]
  mockCartoonMovies: CartoonMovie[]
  mockGames: Game[]
  mockManga: Manga[]
  mockBooks: { id: number; title: string; poster?: string; publishers?: { id: number }[] }[]
  mockLightNovels: { id: number; title: string; poster?: string; publishers?: { id: number }[] }[]
}

const mockCharacterAppearancesInMedia: CharacterAppearanceEntry[] = [
  { characterId: 1, mediaType: 'animeSeries', mediaId: 1 },
  { characterId: 1, mediaType: 'animeMovies', mediaId: 1 },
  { characterId: 2, mediaType: 'tvSeries', mediaId: 1 },
  { characterId: 2, mediaType: 'games', mediaId: 1 },
  { characterId: 3, mediaType: 'animeSeries', mediaId: 2 },
  { characterId: 3, mediaType: 'animeSeries', mediaId: 3 },
  { characterId: 4, mediaType: 'cartoonMovies', mediaId: 1 },
  { characterId: 4, mediaType: 'cartoonMovies', mediaId: 2 },
  { characterId: 5, mediaType: 'games', mediaId: 2 },
  { characterId: 5, mediaType: 'games', mediaId: 3 },
  { characterId: 5, mediaType: 'tvSeries', mediaId: 2 },
  { characterId: 6, mediaType: 'animeSeries', mediaId: 1 },
  { characterId: 7, mediaType: 'manga', mediaId: 1 },
  { characterId: 8, mediaType: 'manga', mediaId: 2 },
  { characterId: 8, mediaType: 'animeSeries', mediaId: 5 },
  { characterId: 9, mediaType: 'animeMovies', mediaId: 1 },
  { characterId: 10, mediaType: 'games', mediaId: 1 },
  { characterId: 11, mediaType: 'animeSeries', mediaId: 3 },
  { characterId: 11, mediaType: 'animeSeries', mediaId: 1 },
  { characterId: 11, mediaType: 'manga', mediaId: 3 },
  { characterId: 11, mediaType: 'manga', mediaId: 1 },
]

function hasStudioId(media: { studios?: { id: number }[] }, studioId: number): boolean {
  return media.studios?.some((s) => s.id === studioId) ?? false
}
function hasPublisherId(media: { publishers?: { id: number }[] }, publisherId: number): boolean {
  return media.publishers?.some((p) => p.id === publisherId) ?? false
}
function hasDeveloperId(media: { developers?: { id: number }[] }, developerId: number): boolean {
  return media.developers?.some((d) => d.id === developerId) ?? false
}

export function createEntityHelpers({
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
}: EntityHelpersDeps) {
  const getMockCharacterAppearances = (characterId: number) => {
    const movieIds = new Set<number>()
    for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
      const movieId = Number(movieIdStr)
      if (casts.some((c) => c.characterId === characterId)) movieIds.add(movieId)
    }
    const movies = mockMovies.filter((m) => movieIds.has(m.id))

    const byType: {
      tvSeries: TVSeries[]
      animeSeries: AnimeSeries[]
      animeMovies: AnimeMovie[]
      cartoonSeries: CartoonSeries[]
      cartoonMovies: CartoonMovie[]
      games: Game[]
      manga: Manga[]
    } = { tvSeries: [], animeSeries: [], animeMovies: [], cartoonSeries: [], cartoonMovies: [], games: [], manga: [] }
    const mediaByType = {
      tvSeries: mockTVSeries,
      animeSeries: mockAnime,
      animeMovies: mockAnimeMovies,
      cartoonSeries: mockCartoonSeries,
      cartoonMovies: mockCartoonMovies,
      games: mockGames,
      manga: mockManga,
    }
    for (const entry of mockCharacterAppearancesInMedia) {
      if (entry.characterId !== characterId) continue
      const arr = mediaByType[entry.mediaType]
      const item = arr.find((m: { id: number }) => m.id === entry.mediaId)
      if (item && !(byType[entry.mediaType] as { id: number }[]).some((x) => x.id === entry.mediaId))
        (byType[entry.mediaType] as { id: number }[]).push(item)
    }
    const result: {
      movies?: Movie[]
      tvSeries?: TVSeries[]
      animeSeries?: AnimeSeries[]
      animeMovies?: AnimeMovie[]
      cartoonSeries?: CartoonSeries[]
      cartoonMovies?: CartoonMovie[]
      games?: Game[]
      manga?: Manga[]
    } = {}
    if (movies.length) result.movies = movies
    if (byType.tvSeries.length) result.tvSeries = byType.tvSeries
    if (byType.animeSeries.length) result.animeSeries = byType.animeSeries
    if (byType.animeMovies.length) result.animeMovies = byType.animeMovies
    if (byType.cartoonSeries.length) result.cartoonSeries = byType.cartoonSeries
    if (byType.cartoonMovies.length) result.cartoonMovies = byType.cartoonMovies
    if (byType.games.length) result.games = byType.games
    if (byType.manga.length) result.manga = byType.manga
    return result
  }

  const getStudioProjects = (studioId: number): EntityProjectSection[] => {
    const sections: EntityProjectSection[] = []
    const movies = mockMovies
      .filter((m) => hasStudioId(m, studioId))
      .map((m) => ({ type: 'movie', id: m.id, title: m.title, poster: m.poster }))
    if (movies.length) sections.push({ type: 'movie', labelKey: 'nav.movies', entries: movies })
    const tvSeries = mockTVSeries
      .filter((m) => hasStudioId(m, studioId))
      .map((m) => ({ type: 'tv-series', id: m.id, title: m.title, poster: m.poster }))
    if (tvSeries.length) sections.push({ type: 'tv-series', labelKey: 'nav.tvSeries', entries: tvSeries })
    const anime = mockAnime
      .filter((m) => hasStudioId(m, studioId))
      .map((m) => ({ type: 'anime', id: m.id, title: m.title, poster: m.poster }))
    if (anime.length) sections.push({ type: 'anime', labelKey: 'nav.anime', entries: anime })
    const cartoonSeries = mockCartoonSeries
      .filter((m) => hasStudioId(m, studioId))
      .map((m) => ({ type: 'cartoon-series', id: m.id, title: m.title, poster: m.poster }))
    if (cartoonSeries.length)
      sections.push({ type: 'cartoon-series', labelKey: 'nav.cartoonSeries', entries: cartoonSeries })
    const cartoonMovies = mockCartoonMovies
      .filter((m) => hasStudioId(m, studioId))
      .map((m) => ({ type: 'cartoon-movies', id: m.id, title: m.title, poster: m.poster }))
    if (cartoonMovies.length)
      sections.push({ type: 'cartoon-movies', labelKey: 'nav.cartoonMovies', entries: cartoonMovies })
    const animeMovies = mockAnimeMovies
      .filter((m) => hasStudioId(m, studioId))
      .map((m) => ({ type: 'anime-movies', id: m.id, title: m.title, poster: m.poster }))
    if (animeMovies.length) sections.push({ type: 'anime-movies', labelKey: 'nav.animeMovies', entries: animeMovies })
    return sections
  }

  const getPublisherProjects = (publisherId: number): EntityProjectSection[] => {
    const sections: EntityProjectSection[] = []
    const games = mockGames
      .filter((m) => hasPublisherId(m, publisherId))
      .map((m) => ({ type: 'game', id: m.id, title: m.title, poster: m.poster }))
    if (games.length) sections.push({ type: 'game', labelKey: 'nav.games', entries: games })
    const manga = mockManga
      .filter((m) => hasPublisherId(m, publisherId))
      .map((m) => ({ type: 'manga', id: m.id, title: m.title, poster: m.poster }))
    if (manga.length) sections.push({ type: 'manga', labelKey: 'nav.manga', entries: manga })
    const books = mockBooks
      .filter((m) => hasPublisherId(m, publisherId))
      .map((m) => ({ type: 'book', id: m.id, title: m.title, poster: m.poster }))
    if (books.length) sections.push({ type: 'book', labelKey: 'nav.books', entries: books })
    const lightNovels = mockLightNovels
      .filter((m) => hasPublisherId(m, publisherId))
      .map((m) => ({ type: 'light-novel', id: m.id, title: m.title, poster: m.poster }))
    if (lightNovels.length) sections.push({ type: 'light-novel', labelKey: 'nav.lightNovels', entries: lightNovels })
    return sections
  }

  const getDeveloperProjects = (developerId: number): EntityProjectSection[] => {
    const sections: EntityProjectSection[] = []
    const games = mockGames
      .filter((m) => hasDeveloperId(m, developerId))
      .map((m) => ({ type: 'game', id: m.id, title: m.title, poster: m.poster }))
    if (games.length) sections.push({ type: 'game', labelKey: 'nav.games', entries: games })
    return sections
  }

  return { getMockCharacterAppearances, getStudioProjects, getPublisherProjects, getDeveloperProjects }
}
