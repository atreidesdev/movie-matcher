import type { Media, VolumeChaptersItem } from '@/types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isVolumeChaptersItem(value: unknown): value is VolumeChaptersItem {
  return isRecord(value) && (value.chapters === undefined || typeof value.chapters === 'number')
}

export function getMediaEpisodesCount(media: Media): number | undefined {
  return 'episodesCount' in media && typeof media.episodesCount === 'number' ? media.episodesCount : undefined
}

export function getMediaEpisodeDuration(media: Media): number | undefined {
  return 'episodeDuration' in media && typeof media.episodeDuration === 'number' ? media.episodeDuration : undefined
}

export function getMediaSeasonNumber(media: Media): number | undefined {
  return 'seasonNumber' in media && typeof media.seasonNumber === 'number' ? media.seasonNumber : undefined
}

export function getMediaCurrentEpisode(media: Media): number | undefined {
  return 'currentEpisode' in media && typeof media.currentEpisode === 'number' ? media.currentEpisode : undefined
}

export function getMediaVolumes(media: Media): number | undefined {
  return 'volumes' in media && typeof media.volumes === 'number' ? media.volumes : undefined
}

export function getMediaVolumesCount(media: Media): number | undefined {
  return 'volumesCount' in media && typeof media.volumesCount === 'number' ? media.volumesCount : undefined
}

export function getMediaCurrentVolume(media: Media): number | undefined {
  return 'currentVolume' in media && typeof media.currentVolume === 'number' ? media.currentVolume : undefined
}

export function getMediaChaptersCount(media: Media): number | undefined {
  return 'chaptersCount' in media && typeof media.chaptersCount === 'number' ? media.chaptersCount : undefined
}

export function getMediaCurrentChapter(media: Media): number | undefined {
  return 'currentChapter' in media && typeof media.currentChapter === 'number' ? media.currentChapter : undefined
}

export function getMediaPages(media: Media): number | undefined {
  return 'pages' in media && typeof media.pages === 'number' ? media.pages : undefined
}

export function getMediaReadingDurationMinutes(media: Media): number | undefined {
  return 'readingDurationMinutes' in media && typeof media.readingDurationMinutes === 'number'
    ? media.readingDurationMinutes
    : undefined
}

export function getMediaVolumesList(media: Media): VolumeChaptersItem[] {
  if (!('volumesList' in media) || !Array.isArray(media.volumesList)) return []
  return media.volumesList.filter(isVolumeChaptersItem)
}

export function getMediaChaptersFromVolumes(media: Media): number {
  return getMediaVolumesList(media).reduce((sum, item) => sum + (item.chapters ?? 0), 0)
}

export function getMediaCountries(media: Media): string[] | undefined {
  if (!('countries' in media) || !Array.isArray(media.countries)) return undefined
  return media.countries.filter((country): country is string => typeof country === 'string')
}
