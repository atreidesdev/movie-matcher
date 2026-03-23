type BaseMedia = { id: number; title: string; poster?: string; releaseDate?: string; season?: string }
type CharacterLike = { id: number; name: string; avatar?: string }
type PersonLike = { id: number; firstName?: string; lastName?: string; avatar?: string }

type Deps = {
  mockMovies: BaseMedia[]
  mockTVSeries: BaseMedia[]
  mockAnime: BaseMedia[]
  mockGames: BaseMedia[]
  mockManga: BaseMedia[]
  mockBooks: BaseMedia[]
  mockCartoonSeries: BaseMedia[]
  mockCartoonMovies: BaseMedia[]
  mockAnimeMovies: BaseMedia[]
  mockLightNovels: BaseMedia[]
  mockCharacters: CharacterLike[]
  mockPersons: PersonLike[]
}

const mkEntry = (key: string, m: BaseMedia, rating: number, listStatus: string, withSeason = false) => ({
  [key]: {
    id: m.id,
    title: m.title,
    poster: m.poster,
    rating,
    listStatus,
    releaseDate: m.releaseDate,
    ...(withSeason ? { season: m.season } : {}),
  },
})

const charEntry = (c: CharacterLike) => ({ characterId: c.id, character: { id: c.id, name: c.name, avatar: c.avatar } })
const personEntry = (p: PersonLike) => ({
  personId: p.id,
  person: { id: p.id, firstName: p.firstName, lastName: p.lastName, avatar: p.avatar },
})

export function createMockFavorites({
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
}: Deps) {
  const mockFavorites = {
    movies: [
      mkEntry('movie', mockMovies[0], 8.5, 'completed'),
      mkEntry('movie', mockMovies[1], 7.2, 'watching'),
      mkEntry('movie', mockMovies[2], 6.4, 'planned'),
      mkEntry('movie', mockMovies[4], 9.1, 'completed'),
      mkEntry('movie', mockMovies[3], 8.0, 'watching'),
      mkEntry('movie', mockMovies[5], 7.9, 'completed'),
      mkEntry('movie', mockMovies[6], 74, 'watching'),
      mkEntry('movie', mockMovies[7], 61, 'planned'),
      mkEntry('movie', mockMovies[8], 88, 'completed'),
      mkEntry('movie', mockMovies[9], 79, 'watching'),
    ],
    tvSeries: [mkEntry('tvSeries', mockTVSeries[0], 7.0, 'watching'), mkEntry('tvSeries', mockTVSeries[1], 8.2, 'completed')],
    animeSeries: [mkEntry('animeSeries', mockAnime[0], 9, 'completed', true), mkEntry('animeSeries', mockAnime[1], 7.5, 'watching', true)],
    games: [mkEntry('game', mockGames[0], 85, 'planned'), mkEntry('game', mockGames[2], 63, 'watching')],
    manga: [mkEntry('manga', mockManga[0], 8.2, 'completed')],
    books: [mkEntry('book', mockBooks[0], 88, 'completed'), mkEntry('book', mockBooks[1], 79, 'watching')],
    cartoonSeries: [mkEntry('cartoonSeries', mockCartoonSeries[0], 7.8, 'watching')],
    cartoonMovies: [mkEntry('cartoonMovie', mockCartoonMovies[0], 6.9, 'completed')],
    animeMovies: [mkEntry('animeMovie', mockAnimeMovies[0], 7.6, 'planned')],
    lightNovels: [mkEntry('lightNovel', mockLightNovels[0], 81, 'watching')],
    characters: [charEntry(mockCharacters[0]), charEntry(mockCharacters[2]), charEntry(mockCharacters[3]), charEntry(mockCharacters[5])],
    persons: [personEntry(mockPersons[0]), personEntry(mockPersons[1]), personEntry(mockPersons[3])],
    casts: [],
  }

  const mockFavoritesBob = {
    movies: [
      mkEntry('movie', mockMovies[1], 7.2, 'watching'),
      mkEntry('movie', mockMovies[2], 6.0, 'planned'),
      mkEntry('movie', mockMovies[3], 8.1, 'watching'),
      mkEntry('movie', mockMovies[5], 7.4, 'completed'),
    ],
    tvSeries: [mkEntry('tvSeries', mockTVSeries[0], 8.0, 'completed'), mkEntry('tvSeries', mockTVSeries[2], 7.4, 'watching')],
    animeSeries: [mkEntry('animeSeries', mockAnime[1], 7.1, 'completed', true)],
    games: [mkEntry('game', mockGames[1], 74, 'watching')],
    manga: [mkEntry('manga', mockManga[1], 7.4, 'planned')],
    books: [mkEntry('book', mockBooks[2], 82, 'completed')],
    cartoonSeries: [mkEntry('cartoonSeries', mockCartoonSeries[1], 6.8, 'planned')],
    cartoonMovies: [mkEntry('cartoonMovie', mockCartoonMovies[0], 6.7, 'completed')],
    animeMovies: [mkEntry('animeMovie', mockAnimeMovies[1], 7.2, 'watching')],
    lightNovels: [mkEntry('lightNovel', mockLightNovels[1], 79, 'watching')],
    characters: [charEntry(mockCharacters[1]), charEntry(mockCharacters[6])],
    persons: [personEntry(mockPersons[2]), personEntry(mockPersons[4])],
    casts: [],
  }

  const mockFavoritesAlice = {
    movies: [
      mkEntry('movie', mockMovies[0], 9.5, 'rewatching'),
      mkEntry('movie', mockMovies[3], 8.1, 'completed'),
      mkEntry('movie', mockMovies[2], 6.8, 'planned'),
      mkEntry('movie', mockMovies[5], 8.3, 'watching'),
    ],
    tvSeries: [mkEntry('tvSeries', mockTVSeries[2], 8.9, 'completed')],
    animeSeries: [mkEntry('animeSeries', mockAnime[0], 72, 'watching', true)],
    games: [mkEntry('game', mockGames[0], 90, 'watching')],
    manga: [mkEntry('manga', mockManga[0], 8.8, 'completed')],
    books: [mkEntry('book', mockBooks[1], 93, 'planned')],
    cartoonSeries: [mkEntry('cartoonSeries', mockCartoonSeries[0], 7.1, 'watching')],
    cartoonMovies: [],
    animeMovies: [mkEntry('animeMovie', mockAnimeMovies[0], 7.0, 'planned')],
    lightNovels: [mkEntry('lightNovel', mockLightNovels[0], 83, 'completed')],
    characters: [charEntry(mockCharacters[4]), charEntry(mockCharacters[8])],
    persons: [personEntry(mockPersons[0]), personEntry(mockPersons[5])],
    casts: [],
  }

  return { mockFavorites, mockFavoritesBob, mockFavoritesAlice }
}
