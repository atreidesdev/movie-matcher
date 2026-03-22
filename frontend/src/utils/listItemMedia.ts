import type { ListItem } from '@/types'
import type { ListEntityType } from '@/api/lists'
import type { Genre } from '@/types'
import type { AnimeSeason } from '@/types'
import type { Theme } from '@/types'

const ENTITY_KEY_MAP: Record<ListEntityType, keyof ListItem> = {
  movies: 'movie',
  anime: 'animeSeries',
  games: 'game',
  'tv-series': 'tvSeries',
  manga: 'manga',
  books: 'book',
  'light-novels': 'lightNovel',
  'cartoon-series': 'cartoonSeries',
  'cartoon-movies': 'cartoonMovie',
  'anime-movies': 'animeMovie',
}

export interface MediaFromListItem {
  id: number
  title: string
  titleI18n?: Record<string, string>
  poster?: string
  genres?: Genre[]
  themes?: Theme[]
  releaseDate?: string
  season?: AnimeSeason
  episodesCount?: number
  pages?: number
  volumes?: number
  volumesCount?: number
  volumesList?: { chapters?: number }[]
  /** Общий рейтинг медиа (из Media.rating). */
  rating?: number
}

/** Returns basic media info (id, title, poster) from a list item. */
export function getMediaFromItem(
  item: ListItem,
  listType: ListEntityType
): { id: number; title: string; poster?: string } | null {
  const key = ENTITY_KEY_MAP[listType]
  const m = key ? (item[key] as { id: number; title: string; poster?: string } | undefined) : null
  return m && typeof m === 'object' && m.id ? m : null
}

/** Returns full media object from a list item (includes genres, releaseDate, season for filtering). */
export function getMediaFullFromItem(
  item: ListItem,
  listType: ListEntityType
): MediaFromListItem | null {
  const key = ENTITY_KEY_MAP[listType]
  const m = key ? (item[key] as MediaFromListItem | undefined) : null
  return m && typeof m === 'object' && m.id ? m : null
}

/** Extract year from releaseDate string. */
export function getYearFromReleaseDate(releaseDate?: string): number | null {
  if (!releaseDate) return null
  const year = new Date(releaseDate).getFullYear()
  return Number.isNaN(year) ? null : year
}
