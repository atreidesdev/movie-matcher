/** Если url — YouTube, возвращает embed-URL для iframe; иначе null (используем <video>). */
export function getYouTubeEmbedUrl(url: string): string | null {
  const m1 = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (m1) return `https://www.youtube.com/embed/${m1[1]}?autoplay=1`
  const m2 = url.match(/youtu\.be\/([^?]+)/)
  if (m2) return `https://www.youtube.com/embed/${m2[1]}?autoplay=1`
  return null
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

/** Базовый URL API без завершающего слэша (для стриминга). */
function getApiBase(): string {
  const base =
    typeof location !== 'undefined' && API_BASE_URL.startsWith('/') ? `${location.origin}${API_BASE_URL}` : API_BASE_URL
  return base.replace(/\/?$/, '')
}

/**
 * URL для стриминга видео с сервера (поддержка Range, перемотка).
 * pathFromApi — путь из API, например /uploads/trailers/xxx.mp4.
 * quality — опционально 720, 480, 360 (транскодированные варианты с сервера).
 * Внешние URL (http/https) возвращаются как есть (quality игнорируется).
 */
export function getVideoStreamUrl(
  pathFromApi: string | undefined | null,
  quality?: '1080' | '720' | '480' | '360'
): string {
  if (!pathFromApi) return ''
  if (pathFromApi.startsWith('http://') || pathFromApi.startsWith('https://')) return pathFromApi
  const relative = pathFromApi.startsWith('/uploads/')
    ? pathFromApi.replace(/^\/uploads\//, '')
    : pathFromApi.replace(/^\//, '')
  let url = `${getApiBase()}/stream/video?path=${encodeURIComponent(relative)}`
  if (quality) url += `&quality=${quality}`
  return url
}

export type VideoQualitySource = { label: string; url: string }

/** Варианты качества для своего видео: оригинал + 1080p, 720p, 480p, 360p (сервер генерирует по запросу). */
const STREAM_QUALITIES: { q: '1080' | '720' | '480' | '360'; labelKey: string }[] = [
  { q: '1080', labelKey: 'video.quality1080' },
  { q: '720', labelKey: 'video.quality720' },
  { q: '480', labelKey: 'video.quality480' },
  { q: '360', labelKey: 'video.quality360' },
]

/**
 * Список источников для выбора качества (только для своих видео, path /uploads/...).
 * Первый элемент — оригинал (Авто), далее 720p, 480p, 360p.
 * Для внешних URL возвращает пустой массив (использовать один src).
 */
export function getVideoStreamQualitySources(
  pathFromApi: string | undefined | null,
  t: (key: string) => string
): VideoQualitySource[] {
  if (!pathFromApi || pathFromApi.startsWith('http')) return []
  const baseUrl = getVideoStreamUrl(pathFromApi)
  const sources: VideoQualitySource[] = [{ label: t('video.qualityAuto'), url: baseUrl }]
  for (const { q, labelKey } of STREAM_QUALITIES) {
    sources.push({ label: t(labelKey), url: getVideoStreamUrl(pathFromApi, q) })
  }
  return sources
}
