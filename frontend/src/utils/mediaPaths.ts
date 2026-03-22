import { titleToSlug } from '@/utils/slug'

export type MediaTypeForPath =
  | 'movie'
  | 'anime'
  | 'game'
  | 'tv-series'
  | 'manga'
  | 'book'
  | 'light-novel'
  | 'cartoon-series'
  | 'cartoon-movies'
  | 'anime-movies'

const MEDIA_TYPE_TO_PATH: Record<MediaTypeForPath, string> = {
  movie: 'movies',
  anime: 'anime',
  game: 'games',
  'tv-series': 'tv-series',
  manga: 'manga',
  book: 'books',
  'light-novel': 'light-novels',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

/** Сегмент пути для медиа: "1" или "1-inception" при наличии title */
function getMediaPathSegment(id: number, title?: string | null): string {
  const slug = title ? titleToSlug(title) : ''
  return slug ? `${id}-${slug}` : String(id)
}

/**
 * Путь к странице медиа. С title — красивый URL: /movies/1-Inception, /movies/1-Nachalo
 */
export function getMediaPath(type: MediaTypeForPath, id: number, title?: string | null): string {
  const segment = getMediaPathSegment(id, title)
  return `/${MEDIA_TYPE_TO_PATH[type]}/${segment}`
}

/** Ссылка на каталог с фильтром по жанру (для бейджей жанров в списке). */
export function getCatalogGenreLink(type: MediaTypeForPath, genreId: number): string {
  return `/${MEDIA_TYPE_TO_PATH[type]}?genres=${genreId}`
}

/** Ссылка на каталог с фильтром по теме. */
export function getCatalogThemeLink(type: MediaTypeForPath, themeId: number): string {
  return `/${MEDIA_TYPE_TO_PATH[type]}?themes=${themeId}`
}

/** Путь к подстранице «Каст» для медиа */
export function getMediaCastPath(type: MediaTypeForPath, id: number, title?: string | null): string {
  return getMediaPath(type, id, title) + '/cast'
}

/** Путь к подстранице «Персонал» (режиссёры, сценаристы, авторы и т.д.) */
export function getMediaStaffPath(type: MediaTypeForPath, id: number, title?: string | null): string {
  return getMediaPath(type, id, title) + '/staff'
}

/** Путь к подстранице «Похожее» */
export function getMediaSimilarPath(type: MediaTypeForPath, id: number, title?: string | null): string {
  return getMediaPath(type, id, title) + '/similar'
}

/** Путь к подстранице «Франшиза» (все медиа франшизы) */
export function getMediaFranchisePath(type: MediaTypeForPath, id: number, title?: string | null): string {
  return getMediaPath(type, id, title) + '/franchise'
}

/** Путь к подстранице «Галерея» */
export function getMediaGalleryPath(type: MediaTypeForPath, id: number, title?: string | null): string {
  return getMediaPath(type, id, title) + '/gallery'
}

/** Путь к подстранице «Трейлеры» */
export function getMediaTrailersPath(type: MediaTypeForPath, id: number, title?: string | null): string {
  return getMediaPath(type, id, title) + '/trailers'
}

/** Путь к странице студии */
export function getStudioPath(id: number): string {
  return `/studios/${id}`
}

/** Путь к странице издателя */
export function getPublisherPath(id: number): string {
  return `/publishers/${id}`
}

/** Путь к странице разработчика */
export function getDeveloperPath(id: number): string {
  return `/developers/${id}`
}

const API_MEDIA_TYPE_TO_PATH: Record<string, string> = {
  movie: 'movies',
  movies: 'movies',
  anime: 'anime',
  animeSeries: 'anime',
  game: 'games',
  games: 'games',
  tv_series: 'tv-series',
  tvSeries: 'tv-series',
  'tv-series': 'tv-series',
  manga: 'manga',
  book: 'books',
  light_novel: 'light-novels',
  lightNovel: 'light-novels',
  'light-novels': 'light-novels',
  cartoon_series: 'cartoon-series',
  cartoonSeries: 'cartoon-series',
  'cartoon-series': 'cartoon-series',
  cartoon_movies: 'cartoon-movies',
  cartoonMovie: 'cartoon-movies',
  'cartoon-movies': 'cartoon-movies',
  anime_movies: 'anime-movies',
  animeMovie: 'anime-movies',
  'anime-movies': 'anime-movies',
}

export function getMediaPathFromApiType(apiType: string, id: number): string {
  const segment = API_MEDIA_TYPE_TO_PATH[apiType] ?? 'movies'
  return `/${segment}/${id}`
}

/** Базовый URL бэкенда (без /api/v1) для раздачи загрузок /uploads/... */
function getUploadsBase(): string {
  const explicitBackendOrigin = import.meta.env.VITE_BACKEND_ORIGIN || ''
  if (explicitBackendOrigin) {
    return explicitBackendOrigin.replace(/\/$/, '')
  }

  const api = import.meta.env.VITE_API_URL || ''
  if (/^https?:\/\//i.test(api)) {
    return api.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8080`
  }

  return 'http://localhost:8080'
}

/**
 * URL для постеров, аватарок, задников и т.д.
 * — Пути /assets/... и /src/assets/... (моки, статика фронта) — как есть, без префикса бэкенда.
 * — Остальные пути с / — с бэкенда (подставляется getUploadsBase()).
 * — Полные URL (https?://) — без изменений.
 */
export function getMediaAssetUrl(path: string | undefined | null): string {
  if (!path) return ''
  if (path.startsWith('/assets/') || path.startsWith('/src/assets/')) return path
  if (path.startsWith('/')) return getUploadsBase() + path
  return path
}
