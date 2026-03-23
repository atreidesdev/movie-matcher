import type { Genre, ListStatus, Theme } from '@/types'

type ItemWithTags = { genres?: Genre[]; themes?: Theme[] }

type Deps = {
  mockListItems: any[]
  mockGenres: Genre[]
  mockThemes: Theme[]
  byPath: Record<string, ItemWithTags[]>
}

export function paginate<T>(arr: T[], page: number, pageSize: number) {
  const total = arr.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const data = arr.slice(start, start + pageSize)
  return { data, total, page, pageSize, totalPages }
}

export function createListUtils({ mockListItems, mockGenres, mockThemes, byPath }: Deps) {
  function getFiltersGenresAndThemesForMediaType(mediaTypePath: string): { genres: Genre[]; themes: Theme[] } {
    const items = byPath[mediaTypePath]
    if (!items) return { genres: mockGenres, themes: mockThemes }
    const genreIds = new Set<number>()
    const themeIds = new Set<number>()
    for (const item of items) {
      item.genres?.forEach((g) => genreIds.add(g.id))
      item.themes?.forEach((t) => themeIds.add(t.id))
    }
    const genres = mockGenres.filter((g) => genreIds.has(g.id))
    const themes = mockThemes.filter((t) => themeIds.has(t.id))
    return { genres, themes }
  }

  function getListStatusByMediaId(listType: string): Record<number, ListStatus> {
    const map: Record<number, ListStatus> = {}
    for (const item of mockListItems) {
      let id: number | undefined
      if (listType === 'movies' && item.movie) id = item.movie.id
      else if (listType === 'anime' && item.animeSeries) id = item.animeSeries.id
      else if (listType === 'games' && item.game) id = item.game.id
      else if (listType === 'tv-series' && item.tvSeries) id = item.tvSeries.id
      else if (listType === 'manga' && item.manga) id = item.manga.id
      else if (listType === 'books' && item.book) id = item.book.id
      else if (listType === 'light-novels' && item.lightNovel) id = item.lightNovel.id
      else if (listType === 'cartoon-series' && item.cartoonSeries) id = item.cartoonSeries.id
      else if (listType === 'cartoon-movies' && item.cartoonMovie) id = item.cartoonMovie.id
      else if (listType === 'anime-movies' && item.animeMovie) id = item.animeMovie.id
      if (id != null && item.status) map[id] = item.status
    }
    return map
  }

  return { getFiltersGenresAndThemesForMediaType, getListStatusByMediaId }
}
