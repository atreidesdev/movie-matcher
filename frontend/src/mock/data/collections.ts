import type { Collection } from '@/types'

type BaseItem = { id: number; title: string; poster?: string }

type Deps = {
  past: (days: number) => string
  mockCurrentUser: { id: number; username?: string; name?: string; avatar?: string }
  mockMovies: BaseItem[]
  mockTVSeries: BaseItem[]
  mockGames: BaseItem[]
  mockAnime: BaseItem[]
  mockAnimeMovies: BaseItem[]
  mockManga: BaseItem[]
  mockBooks: BaseItem[]
  mockLightNovels: BaseItem[]
  mockCartoonMovies: BaseItem[]
}

export function createMockCollections({
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
}: Deps): Collection[] {
  const mockCollectionOwner: Collection['owner'] = {
    id: mockCurrentUser.id,
    username: mockCurrentUser.username,
    name: mockCurrentUser.name,
    avatar: mockCurrentUser.avatar,
  }

  return [
    {
      id: 1,
      name: 'Любимые фильмы',
      description: 'Топ фильмов для пересмотра',
      isPublic: true,
      createdAt: past(30),
      owner: mockCollectionOwner,
      movies: [
        { movieId: mockMovies[0].id, movie: { id: mockMovies[0].id, title: mockMovies[0].title, poster: mockMovies[0].poster } },
        { movieId: mockMovies[1].id, movie: { id: mockMovies[1].id, title: mockMovies[1].title, poster: mockMovies[1].poster } },
        { movieId: mockMovies[2].id, movie: { id: mockMovies[2].id, title: mockMovies[2].title, poster: mockMovies[2].poster } },
        { movieId: mockMovies[4].id, movie: { id: mockMovies[4].id, title: mockMovies[4].title, poster: mockMovies[4].poster } },
      ],
      tvSeries: [
        { tvSeriesId: mockTVSeries[0].id, tvSeries: { id: mockTVSeries[0].id, title: mockTVSeries[0].title, poster: mockTVSeries[0].poster } },
        { tvSeriesId: mockTVSeries[3].id, tvSeries: { id: mockTVSeries[3].id, title: mockTVSeries[3].title, poster: mockTVSeries[3].poster } },
      ],
      games: [{ gameId: mockGames[1].id, game: { id: mockGames[1].id, title: mockGames[1].title, poster: mockGames[1].poster } }],
      animeSeries: [
        { animeSeriesId: mockAnime[0].id, animeSeries: { id: mockAnime[0].id, title: mockAnime[0].title, poster: mockAnime[0].poster } },
        { animeSeriesId: mockAnime[2].id, animeSeries: { id: mockAnime[2].id, title: mockAnime[2].title, poster: mockAnime[2].poster } },
      ],
      animeMovies: [
        {
          animeMovieId: mockAnimeMovies[0].id,
          animeMovie: { id: mockAnimeMovies[0].id, title: mockAnimeMovies[0].title, poster: mockAnimeMovies[0].poster },
        },
      ],
      manga: [{ mangaId: mockManga[1].id, manga: { id: mockManga[1].id, title: mockManga[1].title, poster: mockManga[1].poster } }],
      books: [{ bookId: mockBooks[0].id, book: { id: mockBooks[0].id, title: mockBooks[0].title, poster: mockBooks[0].poster } }],
      lightNovels: [
        {
          lightNovelId: mockLightNovels[1].id,
          lightNovel: { id: mockLightNovels[1].id, title: mockLightNovels[1].title, poster: mockLightNovels[1].poster },
        },
      ],
    },
    {
      id: 2,
      name: 'К просмотру',
      description: 'В планах',
      isPublic: false,
      createdAt: past(7),
      owner: mockCollectionOwner,
      movies: [
        { movieId: mockMovies[3].id, movie: { id: mockMovies[3].id, title: mockMovies[3].title, poster: mockMovies[3].poster } },
        { movieId: mockMovies[1].id, movie: { id: mockMovies[1].id, title: mockMovies[1].title, poster: mockMovies[1].poster } },
      ],
      games: [
        { gameId: mockGames[0].id, game: { id: mockGames[0].id, title: mockGames[0].title, poster: mockGames[0].poster } },
        { gameId: mockGames[1].id, game: { id: mockGames[1].id, title: mockGames[1].title, poster: mockGames[1].poster } },
      ],
      animeSeries: [
        { animeSeriesId: mockAnime[0].id, animeSeries: { id: mockAnime[0].id, title: mockAnime[0].title, poster: mockAnime[0].poster } },
        { animeSeriesId: mockAnime[1].id, animeSeries: { id: mockAnime[1].id, title: mockAnime[1].title, poster: mockAnime[1].poster } },
      ],
      animeMovies: [
        {
          animeMovieId: mockAnimeMovies[1].id,
          animeMovie: { id: mockAnimeMovies[1].id, title: mockAnimeMovies[1].title, poster: mockAnimeMovies[1].poster },
        },
      ],
      manga: [{ mangaId: mockManga[0].id, manga: { id: mockManga[0].id, title: mockManga[0].title, poster: mockManga[0].poster } }],
      books: [{ bookId: mockBooks[2].id, book: { id: mockBooks[2].id, title: mockBooks[2].title, poster: mockBooks[2].poster } }],
      lightNovels: [
        {
          lightNovelId: mockLightNovels[0].id,
          lightNovel: { id: mockLightNovels[0].id, title: mockLightNovels[0].title, poster: mockLightNovels[0].poster },
        },
      ],
      cartoonMovies: [
        {
          cartoonMovieId: mockCartoonMovies[0].id,
          cartoonMovie: { id: mockCartoonMovies[0].id, title: mockCartoonMovies[0].title, poster: mockCartoonMovies[0].poster },
        },
      ],
    },
  ]
}
