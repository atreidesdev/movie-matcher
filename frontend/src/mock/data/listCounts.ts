import type { ListCountsByStatus, ListItem, ListStatsResult } from '@/types'

function getListItemMediaTypeKey(item: ListItem): string | null {
  if (item.movie) return 'movie'
  if (item.tvSeries) return 'tvSeries'
  if (item.animeSeries) return 'anime'
  if (item.game) return 'game'
  if (item.manga) return 'manga'
  if (item.book) return 'book'
  if (item.lightNovel) return 'lightNovel'
  if (item.cartoonSeries) return 'cartoonSeries'
  if (item.cartoonMovie) return 'cartoonMovie'
  if (item.animeMovie) return 'animeMovie'
  return null
}

export function listCountsFromListItems(items: ListItem[]): ListStatsResult {
  const byType: Record<string, ListCountsByStatus> = {}
  const byStatus: ListCountsByStatus = {
    planned: 0,
    watching: 0,
    completed: 0,
    onHold: 0,
    dropped: 0,
    rewatching: 0,
    total: 0,
  }

  const STATUS_KEYS = ['planned', 'watching', 'completed', 'onHold', 'dropped', 'rewatching'] as const

  for (const item of items) {
    const typeKey = getListItemMediaTypeKey(item)
    const status = item.status
    if (!typeKey || !status) continue

    if (!byType[typeKey]) {
      byType[typeKey] = { planned: 0, watching: 0, completed: 0, onHold: 0, dropped: 0, rewatching: 0, total: 0 }
    }
    if (STATUS_KEYS.includes(status as (typeof STATUS_KEYS)[number])) {
      const count = (byType[typeKey][status as keyof ListCountsByStatus] as number) ?? 0
      ;(byType[typeKey] as Record<string, number>)[status] = count + 1
    }
    byType[typeKey].total = (byType[typeKey].total ?? 0) + 1

    if (STATUS_KEYS.includes(status as (typeof STATUS_KEYS)[number])) {
      const s = byStatus[status as keyof ListCountsByStatus] as number
      if (typeof s === 'number') (byStatus as Record<string, number>)[status] = s + 1
    }
    byStatus.total = (byStatus.total ?? 0) + 1
  }

  return { byType, byStatus }
}
