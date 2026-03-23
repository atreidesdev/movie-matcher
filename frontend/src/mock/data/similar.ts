type MediaWithSimilar<T = unknown> = { similar?: T[] }

type Deps = {
  mockMovies: Array<MediaWithSimilar>
  mockAnime: Array<MediaWithSimilar>
  mockGames: Array<MediaWithSimilar>
  mockTVSeries: Array<MediaWithSimilar>
  mockManga: Array<MediaWithSimilar>
  mockLightNovels: Array<MediaWithSimilar>
  mockCartoonSeries: Array<MediaWithSimilar>
  mockCartoonMovies: Array<MediaWithSimilar>
  mockAnimeMovies: Array<MediaWithSimilar>
}

export function assignSimilar(deps: Deps): void {
  const {
    mockMovies,
    mockAnime,
    mockGames,
    mockTVSeries,
    mockManga,
    mockLightNovels,
    mockCartoonSeries,
    mockCartoonMovies,
    mockAnimeMovies,
  } = deps

  if (mockMovies.length >= 3) {
    mockMovies[0].similar = [mockMovies[1], mockMovies[2], mockMovies[4]]
    mockMovies[1].similar = [mockMovies[0], mockMovies[2]]
    mockMovies[4].similar = [mockMovies[0], mockMovies[3]]
    mockMovies[6].similar = [mockMovies[0], mockMovies[1]]
  }
  if (mockAnime.length >= 2) {
    mockAnime[0].similar = [mockAnime[1], mockAnime[3]]
    mockAnime[1].similar = [mockAnime[0], mockAnime[2]]
    mockAnime[3].similar = [mockAnime[0], mockAnime[4]]
  }
  if (mockGames.length >= 2) {
    mockGames[0].similar = [mockGames[1], mockGames[2], mockGames[3]]
    mockGames[4].similar = [mockGames[0], mockGames[1]]
  }
  if (mockTVSeries.length >= 2) {
    mockTVSeries[0].similar = [mockTVSeries[2], mockTVSeries[3]]
    mockTVSeries[4].similar = [mockTVSeries[0], mockTVSeries[1]]
  }
  if (mockManga.length >= 2) {
    mockManga[0].similar = [mockManga[1], mockManga[2]]
    mockManga[1].similar = [mockManga[0], mockManga[2]]
  }
  if (mockLightNovels.length >= 2) {
    mockLightNovels[0].similar = [mockLightNovels[1], mockLightNovels[2]]
    mockLightNovels[2].similar = [mockLightNovels[0], mockLightNovels[1]]
  }
  if (mockCartoonSeries.length >= 2) {
    mockCartoonSeries[0].similar = [mockCartoonSeries[1], mockCartoonSeries[2]]
    mockCartoonSeries[2].similar = [mockCartoonSeries[0], mockCartoonSeries[1]]
  }
  if (mockCartoonMovies.length >= 2) {
    mockCartoonMovies[0].similar = [mockCartoonMovies[1]]
    mockCartoonMovies[2].similar = [mockCartoonMovies[0], mockCartoonMovies[1]]
  }
  if (mockAnimeMovies.length >= 2) {
    mockAnimeMovies[0].similar = [mockAnimeMovies[1], mockAnimeMovies[2]]
    mockAnimeMovies[2].similar = [mockAnimeMovies[0], mockAnimeMovies[1]]
  }
}
