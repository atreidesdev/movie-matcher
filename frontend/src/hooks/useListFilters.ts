import { useMemo } from 'react'
import type { ListItem } from '@/types'
import type { ListEntityType } from '@/api/lists'
import {
  getMediaFullFromItem,
  getYearFromReleaseDate,
} from '@/utils/listItemMedia'
import { getMediaTitle } from '@/utils/localizedText'
import { useDebounce } from './useDebounce'

const ANIME_LIST_TYPES: ListEntityType[] = ['anime', 'anime-movies']

export interface ListFiltersState {
  searchQuery: string
  genreIds: number[]
  themeIds: number[]
  excludeGenreIds: number[]
  excludeThemeIds: number[]
  years: number[]
  seasons: string[]
  /** Совпадение выбранных наборов: либо "хотя бы один", либо "все". */
  matchAllSelected: boolean
}

export function useListFilters(
  items: ListItem[],
  listType: ListEntityType,
  filters: ListFiltersState
) {
  const debouncedSearch = useDebounce(filters.searchQuery.trim().toLowerCase(), 300)

  const { filteredItems, availableGenres, availableThemes, availableYears, availableSeasons } = useMemo(() => {
    const genreMap = new Map<number, { id: number; name: string; nameI18n?: Record<string, string> }>()
    const themeMap = new Map<number, { id: number; name: string; nameI18n?: Record<string, string> }>()
    const yearSet = new Set<number>()
    const seasonSet = new Set<string>()
    const validItems: ListItem[] = []

    for (const item of items) {
      const media = getMediaFullFromItem(item, listType)
      if (!media) continue

      const title = getMediaTitle(media) || media.title || ''
      const searchMatch =
        !debouncedSearch || title.toLowerCase().includes(debouncedSearch)
      const year = getYearFromReleaseDate(media.releaseDate)
      const genreMatch =
        filters.genreIds.length === 0
          ? true
          : filters.matchAllSelected
            ? filters.genreIds.every((id) => (media.genres ?? []).some((g) => g.id === id))
            : (media.genres ?? []).some((g) => filters.genreIds.includes(g.id))

      const themeMatch =
        filters.themeIds.length === 0
          ? true
          : filters.matchAllSelected
            ? filters.themeIds.every((id) => (media.themes ?? []).some((th) => th.id === id))
            : (media.themes ?? []).some((th) => filters.themeIds.includes(th.id))
      const yearMatch =
        filters.years.length === 0 || (year != null && filters.years.includes(year))
      const seasonMatch =
        filters.seasons.length === 0 ||
        (media.season && filters.seasons.includes(media.season))

      if (!searchMatch || !yearMatch || !seasonMatch) continue

      // Для выпадающих списков (жанры/темы) собираем опции по core-фильтрам
      // (поиск + годы + сезон), чтобы выбранные значения не исчезали после фильтрации.
      for (const g of media.genres ?? []) {
        const name = (g as { name?: string }).name ?? String(g.id)
        const nameI18n = (g as { nameI18n?: Record<string, string> }).nameI18n
        if (!genreMap.has(g.id)) {
          genreMap.set(g.id, nameI18n ? { id: g.id, name, nameI18n } : { id: g.id, name })
        }
      }

      for (const th of media.themes ?? []) {
        const name = (th as { name?: string }).name ?? String(th.id)
        const nameI18n = (th as { nameI18n?: Record<string, string> }).nameI18n
        if (!themeMap.has(th.id)) {
          themeMap.set(th.id, nameI18n ? { id: th.id, name, nameI18n } : { id: th.id, name })
        }
      }
      if (year != null) yearSet.add(year)
      if (media.season) seasonSet.add(media.season)

      if (!genreMatch || !themeMatch) continue

      const genreExcludedMatch =
        filters.excludeGenreIds.length === 0
          ? false
          : (media.genres ?? []).some((g) => filters.excludeGenreIds.includes(g.id))

      const themeExcludedMatch =
        filters.excludeThemeIds.length === 0
          ? false
          : (media.themes ?? []).some((th) => filters.excludeThemeIds.includes(th.id))

      if (genreExcludedMatch || themeExcludedMatch) continue

      validItems.push(item)
    }

    const genres = Array.from(genreMap.values()).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    )
    const themes = Array.from(themeMap.values()).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    )
    const years = Array.from(yearSet).sort((a, b) => b - a)
    const seasons = Array.from(seasonSet).sort()

    return {
      filteredItems: validItems,
      availableGenres: genres,
      availableThemes: themes,
      availableYears: years,
      availableSeasons: seasons,
    }
  }, [
    items,
    listType,
    debouncedSearch,
    filters.genreIds,
    filters.themeIds,
    filters.excludeGenreIds,
    filters.excludeThemeIds,
    filters.years,
    filters.seasons,
    filters.matchAllSelected,
  ])

  const showSeasonFilter = ANIME_LIST_TYPES.includes(listType)

  return {
    filteredItems,
    availableGenres,
    availableThemes,
    availableYears,
    availableSeasons,
    debouncedSearch,
    showSeasonFilter,
  }
}
