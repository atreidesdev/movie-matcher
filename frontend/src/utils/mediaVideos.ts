import type { MediaVideo } from '@/types'

export interface NormalizedMediaVideo {
  url: string
  name?: string
}

export function normalizeMediaVideos(videos: MediaVideo[] | unknown[] | undefined | null): NormalizedMediaVideo[] {
  if (!Array.isArray(videos)) return []

  const normalized: NormalizedMediaVideo[] = []

  for (const video of videos) {
    if (typeof video === 'string') {
      normalized.push({ url: video })
      continue
    }

    if (!video || typeof video !== 'object') continue

    const url =
      'url' in video && typeof (video as { url?: unknown }).url === 'string' ? (video as { url: string }).url : null

    if (!url) continue

    const name =
      'name' in video && typeof (video as { name?: unknown }).name === 'string'
        ? (video as { name: string }).name
        : undefined

    normalized.push({
      url,
      name: name || undefined,
    })
  }

  return normalized
}
