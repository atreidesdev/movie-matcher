import type { Book, ListItem, ListStatus, PublicProfile } from '@/types'

type BaseMedia = { id: number; pages?: number }

type Deps = {
  past: (days: number) => string
  mockCurrentUser: PublicProfile
  mockUsers: PublicProfile[]
  mockMovies: BaseMedia[]
  mockAnime: BaseMedia[]
  mockGames: BaseMedia[]
  mockTVSeries: BaseMedia[]
  mockManga: BaseMedia[]
  mockBooks: BaseMedia[]
  mockLightNovels: BaseMedia[]
  mockCartoonSeries: BaseMedia[]
  mockCartoonMovies: BaseMedia[]
  mockAnimeMovies: BaseMedia[]
  listCountsFromListItems: (items: ListItem[]) => PublicProfile['listCounts']
}

export function createListProfiles({
  past,
  mockCurrentUser,
  mockUsers,
  mockMovies,
  mockAnime,
  mockGames,
  mockTVSeries,
  mockManga,
  mockBooks,
  mockLightNovels,
  mockCartoonSeries,
  mockCartoonMovies,
  mockAnimeMovies,
  listCountsFromListItems,
}: Deps) {
  const mockListCountsBob: PublicProfile['listCounts'] = {
    byType: {
      movie: { planned: 0, watching: 1, completed: 5, onHold: 0, dropped: 0, rewatching: 0, total: 6 },
      anime: { planned: 1, watching: 2, completed: 1, onHold: 0, dropped: 0, rewatching: 0, total: 4 },
    },
    byStatus: { planned: 1, watching: 3, completed: 6, onHold: 0, dropped: 0, rewatching: 0, total: 10 },
  }

  const mockListCountsAlice: PublicProfile['listCounts'] = {
    byType: {
      movie: { planned: 2, watching: 0, completed: 3, onHold: 1, dropped: 0, rewatching: 0, total: 6 },
      manga: { planned: 1, watching: 0, completed: 0, onHold: 0, dropped: 0, rewatching: 0, total: 1 },
    },
    byStatus: { planned: 3, watching: 0, completed: 3, onHold: 1, dropped: 0, rewatching: 0, total: 7 },
  }

  const STATUS_ORDER: ListStatus[] = ['planned', 'watching', 'completed', 'onHold', 'dropped', 'rewatching']
  const REACTIONS: NonNullable<ListItem['titleReaction']>[] = ['joyful', 'surprised', 'inspiring', 'disappointed', 'inspiring', 'joyful']

  let nextMockListItemId = 1
  function makeId(): number {
    return nextMockListItemId++
  }
  const isStartedStatus = (s: ListStatus) => s === 'watching' || s === 'completed' || s === 'rewatching'
  const isCompletedStatus = (s: ListStatus) => s === 'completed'

  const mockListItems: ListItem[] = (() => {
    const out: ListItem[] = []
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const movie = mockMovies[idx % mockMovies.length] as any
      out.push({
        id: makeId(),
        status,
        movie,
        rating: status === 'planned' ? undefined : 6 + idx,
        titleReaction: status === 'planned' ? undefined : REACTIONS[idx],
        startedAt: isStartedStatus(status) ? past(25 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(3 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(20 + idx) }] : undefined,
        comment: status === 'watching' ? 'Смотрю' : status === 'rewatching' ? 'Пересматриваю' : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const animeSeries = mockAnime[idx % mockAnime.length] as any
      out.push({
        id: makeId(),
        status,
        animeSeries,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
        currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2,
        startedAt: isStartedStatus(status) ? past(30 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(4 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(28 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const game = mockGames[idx % mockGames.length] as any
      out.push({
        id: makeId(),
        status,
        game,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
        totalTime: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 300 + idx * 120,
        currentProgress: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : idx * 10,
        startedAt: isStartedStatus(status) ? past(35 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(6 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(33 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const tvSeries = mockTVSeries[idx % mockTVSeries.length] as any
      out.push({
        id: makeId(),
        status,
        tvSeries,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
        currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2,
        startedAt: isStartedStatus(status) ? past(28 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(5 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(26 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const manga = mockManga[idx % mockManga.length] as any
      out.push({
        id: makeId(),
        status,
        manga,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
        currentVolumeNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx,
        currentChapterNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx * 3,
        startedAt: isStartedStatus(status) ? past(40 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(8 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(38 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const book = mockBooks[idx % mockBooks.length] as Book
      const maxPages = book.pages ?? undefined
      out.push({
        id: makeId(),
        status,
        book: book as any,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
        currentPage: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : Math.min(maxPages ?? 9999, 40 + idx * 60),
        maxPages,
        startedAt: isStartedStatus(status) ? past(45 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(7 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(43 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const lightNovel = mockLightNovels[idx % mockLightNovels.length] as any
      out.push({
        id: makeId(),
        status,
        lightNovel,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
        currentVolumeNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx,
        currentChapterNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2,
        startedAt: isStartedStatus(status) ? past(50 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(9 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(48 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const cartoonSeries = mockCartoonSeries[idx % mockCartoonSeries.length] as any
      out.push({
        id: makeId(),
        status,
        cartoonSeries,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
        currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2,
        startedAt: isStartedStatus(status) ? past(26 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(5 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(24 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const cartoonMovie = mockCartoonMovies[idx % mockCartoonMovies.length] as any
      out.push({
        id: makeId(),
        status,
        cartoonMovie,
        rating: status === 'planned' ? undefined : 6 + idx,
        titleReaction: status === 'planned' ? undefined : REACTIONS[idx],
        startedAt: isStartedStatus(status) ? past(20 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(3 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(18 + idx) }] : undefined,
      })
    }
    for (const [idx, status] of STATUS_ORDER.entries()) {
      const animeMovie = mockAnimeMovies[idx % mockAnimeMovies.length] as any
      out.push({
        id: makeId(),
        status,
        animeMovie,
        rating: status === 'planned' ? undefined : 6 + idx,
        titleReaction: status === 'planned' ? undefined : REACTIONS[idx],
        startedAt: isStartedStatus(status) ? past(20 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(3 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(18 + idx) }] : undefined,
      })
    }
    return out
  })()

  function buildMockListItemsForUser(mediaOffset: number): ListItem[] {
    const out: ListItem[] = []
    const idBase = 1000 + mediaOffset * 100
    const pick = <T,>(arr: T[], idx: number): T => arr[(idx + mediaOffset) % arr.length]
    const push = (idx: number, status: ListStatus, key: string, media: any, extra: Record<string, unknown> = {}) =>
      out.push({
        id: idBase + out.length,
        status,
        [key]: media,
        rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
        titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
        startedAt: isStartedStatus(status) ? past(25 + idx) : undefined,
        completedAt: isCompletedStatus(status) ? past(3 + idx) : undefined,
        rewatchSessions: status === 'rewatching' ? [{ startedAt: past(20 + idx) }] : undefined,
        ...extra,
      } as ListItem)

    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'movie', pick(mockMovies, idx), { comment: status === 'watching' ? 'Смотрю' : status === 'rewatching' ? 'Пересматриваю' : undefined }))
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'animeSeries', pick(mockAnime, idx), { currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2 }))
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'game', pick(mockGames, idx), { totalTime: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 300 + idx * 120, currentProgress: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : idx * 10 }))
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'tvSeries', pick(mockTVSeries, idx), { currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2 }))
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'manga', pick(mockManga, idx), { currentVolumeNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx, currentChapterNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx * 3 }))
    STATUS_ORDER.forEach((status, idx) => {
      const book = pick(mockBooks, idx) as Book
      const maxPages = book.pages ?? 500
      push(idx, status, 'book', book, { currentPage: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : Math.min(maxPages, 40 + idx * 60), maxPages })
    })
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'lightNovel', pick(mockLightNovels, idx), { currentVolumeNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx, currentChapterNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2 }))
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'cartoonSeries', pick(mockCartoonSeries, idx), { currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2 }))
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'cartoonMovie', pick(mockCartoonMovies, idx), {}))
    STATUS_ORDER.forEach((status, idx) => push(idx, status, 'animeMovie', pick(mockAnimeMovies, idx), {}))
    return out
  }

  const mockListItemsAlice: ListItem[] = buildMockListItemsForUser(2)
  const mockListItemsBob: ListItem[] = buildMockListItemsForUser(4)
  const mockListCountsDev = listCountsFromListItems(mockListItems)

  const mockPublicProfile: PublicProfile = {
    ...(mockCurrentUser as PublicProfile),
    lastSeenAt: new Date().toISOString(),
    profileHidden: false,
    listCounts: mockListCountsDev,
    favoritesCount: 23,
    reviewsCount: 2,
    collectionsCount: 2,
    friendsCount: 1,
    followersCount: 1,
  }

  const mockPublicProfileAlice: PublicProfile = {
    ...(mockUsers[1] as PublicProfile),
    lastSeenAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    profileHidden: false,
    listCounts: mockListCountsAlice,
    favoritesCount: 12,
    reviewsCount: 1,
    collectionsCount: 0,
    friendsCount: 1,
    followersCount: 1,
  }

  const mockPublicProfileBob: PublicProfile = {
    ...(mockUsers[2] as PublicProfile),
    lastSeenAt: new Date(Date.now() - 2 * 24 * 60_000).toISOString(),
    profileHidden: false,
    listCounts: mockListCountsBob,
    favoritesCount: 14,
    reviewsCount: 0,
    collectionsCount: 0,
    friendsCount: 1,
    followersCount: 0,
  }

  function getMockProfileByUsername(username: string): PublicProfile | null {
    const u = (username || '').toLowerCase()
    if (u === ((mockCurrentUser as any).username || '').toLowerCase()) return mockPublicProfile
    if (u === 'alice') return mockPublicProfileAlice
    if (u === 'bob') return mockPublicProfileBob
    return null
  }

  return {
    mockListItems,
    mockListItemsAlice,
    mockListItemsBob,
    mockPublicProfile,
    mockPublicProfileAlice,
    mockPublicProfileBob,
    getMockProfileByUsername,
  }
}
