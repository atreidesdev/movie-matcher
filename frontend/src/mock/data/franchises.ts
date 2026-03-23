type MediaItem = {
  id: number
  title?: string
  poster?: string
  titleI18n?: Record<string, string>
}

type Deps = {
  mockMovies: MediaItem[]
  mockAnime: MediaItem[]
  mockGames: MediaItem[]
  mockTVSeries: MediaItem[]
}

type FranchiseLinkRaw = {
  id: number
  franchiseId: number
  franchiseName: string
  fromType: string
  fromId: number
  toType: string
  toId: number
  relationType: string
}

export function createFranchiseMocks({ mockMovies, mockAnime, mockGames, mockTVSeries }: Deps) {
  const MEDIA_TYPE_TO_PATH: Record<string, string> = {
    movie: 'movies',
    movies: 'movies',
    anime: 'anime',
    'tv-series': 'tv-series',
    game: 'games',
    games: 'games',
    manga: 'manga',
    book: 'books',
    books: 'books',
    'light-novel': 'light-novels',
    'light-novels': 'light-novels',
    'cartoon-series': 'cartoon-series',
    'cartoon-movies': 'cartoon-movies',
    'anime-movies': 'anime-movies',
  }

  const getMockMediaTitle = (mediaType: string, mediaId: number): string => {
    const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
    if (path === 'movies') return mockMovies.find((x) => x.id === mediaId)?.title ?? `Фильм #${mediaId}`
    if (path === 'anime') return mockAnime.find((x) => x.id === mediaId)?.title ?? `Аниме #${mediaId}`
    if (path === 'games') return mockGames.find((x) => x.id === mediaId)?.title ?? `Игра #${mediaId}`
    if (path === 'tv-series') return mockTVSeries.find((x) => x.id === mediaId)?.title ?? `Сериал #${mediaId}`
    return `Медиа #${mediaId}`
  }

  const getMockMediaPoster = (mediaType: string, mediaId: number): string | undefined => {
    const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
    if (path === 'movies') return mockMovies.find((x) => x.id === mediaId)?.poster
    if (path === 'tv-series') return mockTVSeries.find((x) => x.id === mediaId)?.poster
    return undefined
  }

  const getMockMediaTitleI18n = (mediaType: string, mediaId: number): Record<string, string> | undefined => {
    const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
    if (path === 'movies') return mockMovies.find((x) => x.id === mediaId)?.titleI18n
    if (path === 'anime') return mockAnime.find((x) => x.id === mediaId)?.titleI18n
    if (path === 'games') return mockGames.find((x) => x.id === mediaId)?.titleI18n
    if (path === 'tv-series') return mockTVSeries.find((x) => x.id === mediaId)?.titleI18n
    return undefined
  }

  const mockFranchiseNameI18nByFranchiseId: Record<number, Record<string, string>> = {
    1: { ru: 'Научная фантастика', en: 'Science Fiction' },
    2: { ru: 'Матрица', en: 'The Matrix' },
    3: { ru: 'Игра престолов', en: 'Game of Thrones' },
  }

  const mockFranchiseLinksRaw: FranchiseLinkRaw[] = [
    { id: 1, franchiseId: 1, franchiseName: 'Научная фантастика', fromType: 'movie', fromId: 1, toType: 'movie', toId: 2, relationType: 'sequel' },
    { id: 2, franchiseId: 1, franchiseName: 'Научная фантастика', fromType: 'movie', fromId: 2, toType: 'movie', toId: 3, relationType: 'sequel' },
    { id: 3, franchiseId: 1, franchiseName: 'Научная фантастика', fromType: 'movie', fromId: 2, toType: 'movie', toId: 1, relationType: 'prequel' },
    { id: 4, franchiseId: 2, franchiseName: 'Матрица', fromType: 'movie', fromId: 5, toType: 'movie', toId: 4, relationType: 'adaptation' },
    { id: 5, franchiseId: 2, franchiseName: 'Матрица', fromType: 'movie', fromId: 4, toType: 'movie', toId: 5, relationType: 'sequel' },
    { id: 6, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 1, toType: 'tv-series', toId: 3, relationType: 'sequel' },
    { id: 7, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 3, toType: 'tv-series', toId: 4, relationType: 'sequel' },
    { id: 8, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 4, toType: 'tv-series', toId: 6, relationType: 'spinOff' },
    { id: 9, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 1, toType: 'tv-series', toId: 6, relationType: 'prequel' },
    { id: 10, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 4, toType: 'tv-series', toId: 7, relationType: 'spinOff' },
    { id: 11, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 6, toType: 'tv-series', toId: 7, relationType: 'sideStory' },
    { id: 12, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 4, toType: 'tv-series', toId: 8, relationType: 'sideStory' },
    { id: 13, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 1, toType: 'tv-series', toId: 9, relationType: 'alternativeVersion' },
    { id: 14, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 7, toType: 'tv-series', toId: 10, relationType: 'prequel' },
    { id: 15, franchiseId: 3, franchiseName: 'Игра престолов', fromType: 'tv-series', fromId: 6, toType: 'tv-series', toId: 8, relationType: 'sideStory' },
  ]

  const mockFranchises = [
    { id: 1, name: 'Научная фантастика', nameI18n: { ru: 'Научная фантастика', en: 'Science Fiction' } as Record<string, string>, description: null as string | null, poster: null as string | null, aliases: [] as string[] },
    { id: 2, name: 'Матрица', nameI18n: { ru: 'Матрица', en: 'The Matrix' } as Record<string, string>, description: null as string | null, poster: null as string | null, aliases: [] as string[] },
    { id: 3, name: 'Игра престолов', nameI18n: { ru: 'Игра престолов', en: 'Game of Thrones' } as Record<string, string>, description: null as string | null, poster: null as string | null, aliases: [] as string[] },
  ]

  const pathToBackendMediaType: Record<string, string> = {
    movie: 'movie',
    'tv-series': 'tvSeries',
    anime: 'animeSeries',
    'anime-movies': 'animeMovie',
    'cartoon-series': 'cartoonSeries',
    'cartoon-movies': 'cartoonMovie',
    game: 'game',
    manga: 'manga',
    book: 'book',
    'light-novel': 'lightNovel',
  }

  const getMockFranchiseLinksByFranchiseId = (franchiseId: number) =>
    mockFranchiseLinksRaw
      .filter((l) => l.franchiseId === franchiseId)
      .map((l) => ({
        id: l.id,
        franchiseId: l.franchiseId,
        fromMediaType: pathToBackendMediaType[l.fromType] || l.fromType,
        fromMediaId: l.fromId,
        toMediaType: pathToBackendMediaType[l.toType] || l.toType,
        toMediaId: l.toId,
        relationType: l.relationType,
      }))

  const getMockFranchiseLinksByMedia = (mediaType: string, mediaId: number) => {
    const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
    const out: Array<{
      id: number
      franchiseId: number
      franchiseName: string
      franchiseNameI18n?: Record<string, string>
      relationType: string
      relatedType: string
      relatedMediaId: number
      relatedTitle: string
      relatedTitleI18n?: Record<string, string>
      relatedPoster?: string | null
    }> = []

    for (const link of mockFranchiseLinksRaw) {
      const fromMatch = (MEDIA_TYPE_TO_PATH[link.fromType] || link.fromType) === path && link.fromId === mediaId
      const toMatch = (MEDIA_TYPE_TO_PATH[link.toType] || link.toType) === path && link.toId === mediaId
      const franchiseNameI18n = mockFranchiseNameI18nByFranchiseId[link.franchiseId]
      if (fromMatch) {
        out.push({
          id: link.id,
          franchiseId: link.franchiseId,
          franchiseName: link.franchiseName,
          franchiseNameI18n,
          relationType: link.relationType,
          relatedType: MEDIA_TYPE_TO_PATH[link.toType] || link.toType,
          relatedMediaId: link.toId,
          relatedTitle: getMockMediaTitle(link.toType, link.toId),
          relatedTitleI18n: getMockMediaTitleI18n(link.toType, link.toId),
          relatedPoster: getMockMediaPoster(link.toType, link.toId),
        })
      } else if (toMatch) {
        const reverseRelation = link.relationType === 'sequel' ? 'prequel' : link.relationType === 'prequel' ? 'sequel' : link.relationType
        out.push({
          id: link.id,
          franchiseId: link.franchiseId,
          franchiseName: link.franchiseName,
          franchiseNameI18n,
          relationType: reverseRelation,
          relatedType: MEDIA_TYPE_TO_PATH[link.fromType] || link.fromType,
          relatedMediaId: link.fromId,
          relatedTitle: getMockMediaTitle(link.fromType, link.fromId),
          relatedTitleI18n: getMockMediaTitleI18n(link.fromType, link.fromId),
          relatedPoster: getMockMediaPoster(link.fromType, link.fromId),
        })
      }
    }
    return out
  }

  return {
    mockFranchises,
    getMockFranchiseLinksByFranchiseId,
    getMockFranchiseLinksByMedia,
  }
}
