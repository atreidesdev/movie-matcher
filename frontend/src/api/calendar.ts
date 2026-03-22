import apiClient from '@/api/client'
import type { CalendarRelease } from '@/types'

export interface CalendarReleasesResponse {
  releases: CalendarRelease[]
}

/**
 * Релизы в диапазоне дат для календаря.
 * @param from - начало периода (YYYY-MM-DD)
 * @param to - конец периода (YYYY-MM-DD)
 * @param mediaType - тип медиа (movie, anime, game, tv-series, manga, book, light-novel, cartoon-series, cartoon-movies, anime-movies)
 */
export async function getCalendarReleases(
  from: string,
  to: string,
  mediaType: string
): Promise<CalendarReleasesResponse> {
  const { data } = await apiClient.get<CalendarReleasesResponse>('/calendar/releases', {
    params: { from, to, mediaType },
  })
  return data
}
