import type { ListItem } from '@/types'
import type { ListEntityType } from '@/api/lists'
import { getMediaChaptersFromVolumes } from '@/utils/typeGuards'
import type { Media } from '@/types'

const SERIES_TYPES: ListEntityType[] = [
  'anime',
  'tv-series',
  'cartoon-series',
  'anime-movies',
  'cartoon-movies',
]

export function getListItemProgressText(
  item: ListItem,
  listType: ListEntityType,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  // Multi-episode (anime, tv, cartoons)
  const seriesMedia = item.animeSeries ?? item.tvSeries ?? item.cartoonSeries
  if (seriesMedia && SERIES_TYPES.includes(listType)) {
    const ep = item.currentEpisode ?? 0
    const total = seriesMedia.episodesCount
    if (total != null && total > 0) {
      return t('media.episodeOfEpisodes', { current: ep, total })
    }
    if (ep > 0) return t('media.currentEpisode') + `: ${ep}`
  }

  // Games - hours played
  if (listType === 'games' && item.totalTime != null && item.totalTime > 0) {
    const hours = (item.totalTime / 60).toFixed(1)
    return t('media.hoursPlayed') + `: ${hours}`
  }

  // Books - pages
  if (listType === 'books') {
    const page = item.currentPage ?? 0
    const total = item.maxPages ?? item.book?.pages
    if (total != null && total > 0) {
      return `${page} / ${total}`
    }
    if (page > 0) return String(page)
  }

  // Manga - volumes/chapters
  if (listType === 'manga') {
    const vol = item.currentVolumeNumber ?? item.currentVolume ?? 0
    const ch = item.currentChapterNumber ?? item.currentChapter ?? 0
    const totalVol = item.manga?.volumes ?? item.manga?.volumesCount
    const totalCh = item.manga?.volumesList
      ? getMediaChaptersFromVolumes(item.manga as Media)
      : item.manga?.currentChapter
    if (totalVol != null && totalVol > 0) {
      return t('media.volume') + ` ${vol} / ${totalVol}`
    }
    if (totalCh != null && totalCh > 0 && ch > 0) {
      return t('media.chapter') + ` ${ch} / ${totalCh}`
    }
    if (vol > 0 || ch > 0) {
      return (vol > 0 ? t('media.volume') + ` ${vol} ` : '') + (ch > 0 ? t('media.chapter') + ` ${ch}` : '')
    }
  }

  // Light novel - volumes and chapter
  if (listType === 'light-novels') {
    const vol = item.currentVolumeNumber ?? item.currentVolume ?? 0
    const ch = item.currentChapterNumber ?? item.currentChapter ?? 0
    const totalVol = item.lightNovel?.volumes
    if (totalVol != null && totalVol > 0) {
      const chText = ch > 0 ? ` · ${t('media.chapter')} ${ch}` : ''
      return t('media.volume') + ` ${vol} / ${totalVol}${chText}`
    }
    if (vol > 0 || ch > 0) {
      return (vol > 0 ? t('media.volume') + ` ${vol} ` : '') + (ch > 0 ? t('media.chapter') + ` ${ch}` : '')
    }
  }

  return ''
}
