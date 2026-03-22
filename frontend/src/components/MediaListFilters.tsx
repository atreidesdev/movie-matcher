import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { IconCross, IconSearch, IconArrowDown } from '@/components/icons'
import CustomSelect from '@/components/CustomSelect'
import type { Genre } from '@/types'
import type { MediaListParams } from '@/api/media'
import { getLocalizedString } from '@/utils/localizedText'
import { useDebounce } from '@/hooks/useDebounce'
import { entitiesApi, type FilterEntity } from '@/api/entities'

const SORT_KEYS: Record<string, string> = {
  created_at: 'media.sortCreated',
  updated_at: 'media.sortCreated',
  title: 'media.sortTitle',
  rating: 'media.sortRating',
  release_date: 'media.sortReleaseDate',
  popularity: 'media.sortPopularity',
}

/** Выпадающий мультиселект с полным списком (жанры, темы). Опционально: excludedIds + onExcludeToggle — при наведении появляется крестик для исключения.
 *  onSwitchToExclude/onSwitchToInclude — для переключения между включением и исключением одним вызовом (избегает гонки состояний). */
function FilterSelectFullList({
  labelKey,
  options,
  selectedIds,
  onToggle,
  getOptionName,
  excludedIds = [],
  onExcludeToggle,
  onSwitchToExclude,
  onSwitchToInclude,
}: {
  labelKey: string
  options: { id: number; name?: string }[]
  selectedIds: number[]
  onToggle: (id: number) => void
  getOptionName: (opt: { id: number; name?: string }) => string
  excludedIds?: number[]
  onExcludeToggle?: (id: number) => void
  onSwitchToExclude?: (id: number) => void
  onSwitchToInclude?: (id: number) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const hasExclude = onExcludeToggle != null

  const selectedOptions = options.filter((o) => selectedIds.includes(o.id))
  const excludedOptions = options.filter((o) => excludedIds.includes(o.id))
  const filterLower = filter.trim().toLowerCase()
  const filteredOptions = filterLower
    ? options.filter((o) => getOptionName(o).toLowerCase().includes(filterLower))
    : options

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [open])

  const handleInclude = (id: number) => {
    if (excludedIds.includes(id)) {
      onSwitchToInclude ? onSwitchToInclude(id) : (onExcludeToggle?.(id), onToggle(id))
    } else {
      onToggle(id)
    }
  }

  const handleExclude = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      onSwitchToExclude ? onSwitchToExclude(id) : (onToggle(id), onExcludeToggle?.(id))
    } else {
      onExcludeToggle?.(id)
    }
  }

  return (
    <div ref={ref}>
      <label className="block text-xs font-medium text-[var(--theme-text)] mb-1.5">{t(labelKey)}</label>
      <div className="rounded-lg border border-theme bg-theme-surface shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm min-h-[2.25rem]"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {selectedOptions.length === 0 && excludedOptions.length === 0 && (
              <span className="text-[var(--theme-text-muted)]">{t('media.searchFilter')}</span>
            )}
            {selectedOptions.map((opt) => (
              <span
                key={opt.id}
                className="filter-selected-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-lavender-400 text-white"
              >
                <span className="truncate max-w-[120px]">{getOptionName(opt)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(opt.id)
                  }}
                  className="shrink-0 p-0.5 rounded hover:bg-white/20 text-white focus:outline-none"
                  aria-label={t('common.remove')}
                >
                  <IconCross className="w-3 h-3" />
                </button>
              </span>
            ))}
            {excludedOptions.map((opt) => (
              <span
                key={opt.id}
                className="filter-excluded-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600/50"
              >
                <span className="truncate max-w-[120px] line-through">{getOptionName(opt)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onExcludeToggle?.(opt.id)
                  }}
                  className="shrink-0 p-0.5 rounded hover:bg-red-500/20 focus:outline-none"
                  aria-label={t('common.remove')}
                >
                  <IconCross className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <IconArrowDown
            className={`w-4 h-4 shrink-0 text-[var(--theme-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="border-t border-[var(--theme-border)] py-1 max-h-52 flex flex-col">
            <input
              type="search"
              autoComplete="off"
              placeholder={t('media.searchFilter')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mx-2 mb-1 px-2 py-1.5 text-sm border border-[var(--theme-border)] rounded-md bg-[var(--theme-bg)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
            />
            <div className="overflow-y-auto px-1" role="listbox">
              {filteredOptions.length === 0 ? (
                <p className="text-xs text-[var(--theme-text-muted)] py-2 px-2">{t('common.noResults')}</p>
              ) : (
                filteredOptions.map((opt) => {
                  const name = getOptionName(opt)
                  const checked = selectedIds.includes(opt.id)
                  const excluded = excludedIds.includes(opt.id)
                  const showExcludeBtn = hasExclude && (hoveredId === opt.id || excluded)
                  return (
                    <div
                      key={opt.id}
                      role="option"
                      aria-selected={checked || excluded}
                      onMouseEnter={() => setHoveredId(opt.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-[var(--theme-text)] ${checked ? 'bg-[var(--theme-primary)]/30' : excluded ? 'bg-red-500/10' : 'hover:bg-[var(--theme-surface)]'}`}
                    >
                      <button
                        type="button"
                        className="flex-1 truncate text-left min-w-0"
                        onClick={() => handleInclude(opt.id)}
                      >
                        <span className={excluded ? 'line-through' : ''}>{name}</span>
                      </button>
                      <span className="flex items-center gap-0.5 shrink-0">
                        {checked && (
                          <span className="filter-option-check flex h-5 w-5 items-center justify-center rounded-full bg-lavender-400">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </span>
                        )}
                        {showExcludeBtn && (
                          <button
                            type="button"
                            onClick={(e) => handleExclude(e, opt.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-500 focus:outline-none"
                            title={excluded ? t('common.remove') : t('media.exclude')}
                            aria-label={excluded ? t('common.remove') : t('media.exclude')}
                          >
                            <IconCross className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getOptionalEntityName(
  entity: { name?: string; nameI18n?: unknown } | null | undefined,
  locale?: string
): string {
  if (!entity) return ''
  return getLocalizedString(
    entity.nameI18n && typeof entity.nameI18n === 'object' ? (entity.nameI18n as Record<string, string>) : undefined,
    entity.name,
    locale
  )
}

/** Подгрузка по поиску: выбранные по ids, результаты по search. */
function useEntityFilterSearch(
  selectedIds: number[],
  onToggle: (id: number) => void,
  searchFn: (q: string) => Promise<FilterEntity[]>,
  getByIdsFn: (ids: number[]) => Promise<FilterEntity[]>
) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FilterEntity[]>([])
  const [selectedNames, setSelectedNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(searchQuery, 350)

  useEffect(() => {
    if (selectedIds.length === 0) {
      setSelectedNames({})
      return
    }
    const missing = selectedIds.filter((id) => selectedNames[id] === undefined)
    if (missing.length === 0) return
    let cancelled = false
    getByIdsFn(missing).then((list) => {
      if (cancelled) return
      setSelectedNames((prev) => {
        const next = { ...prev }
        list.forEach((e) => {
          next[e.id] = e.name
        })
        return next
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getByIdsFn is stable from parent
  }, [selectedIds.join(',')])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([])
      return
    }
    let cancelled = false
    setLoading(true)
    searchFn(debouncedQuery)
      .then((list) => {
        if (cancelled) return
        setSearchResults(list)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchFn is stable from parent
  }, [debouncedQuery])

  const toggle = useCallback(
    (id: number, name: string) => {
      const wasSelected = selectedIds.includes(id)
      onToggle(id)
      setSelectedNames((prev) => {
        const next = { ...prev }
        if (wasSelected) delete next[id]
        else next[id] = name
        return next
      })
    },
    [onToggle, selectedIds]
  )

  const selectedItems = selectedIds.map((id) => ({ id, name: selectedNames[id] ?? '…' }))
  return { searchQuery, setSearchQuery, searchResults, selectedItems, loading, toggle }
}

/** Выпадающий мультиселект с поиском по API (студии, издатели, разработчики): в блоке — теги выбранных, по клику — поиск и список. */
function EntityFilterDropdown({
  labelKey,
  selectedItems,
  selectedIds,
  searchQuery,
  onSearchChange,
  searchResults,
  loading,
  onToggle,
  open,
  onOpenChange,
}: {
  labelKey: string
  selectedItems: { id: number; name: string }[]
  selectedIds: number[]
  searchQuery: string
  onSearchChange: (v: string) => void
  searchResults: FilterEntity[]
  loading: boolean
  onToggle: (id: number, name: string) => void
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const selectedSet = new Set(selectedIds)
  const resultsWithoutSelected = searchResults.filter((e) => !selectedSet.has(e.id))
  const listItems = [...selectedItems, ...resultsWithoutSelected]

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false)
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [open, onOpenChange])

  return (
    <div ref={ref}>
      <label className="block text-xs font-medium text-[var(--theme-text)] mb-1.5">{t(labelKey)}</label>
      <div className="rounded-lg border border-theme bg-theme-surface shadow-sm">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm min-h-[2.25rem]"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {selectedItems.length === 0 && (
              <span className="text-[var(--theme-text-muted)]">{t('media.searchFilter')}</span>
            )}
            {selectedItems.map(({ id, name }) => (
              <span
                key={id}
                className="filter-selected-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-lavender-400 text-white"
              >
                <span className="truncate max-w-[120px]">{name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(id, name)
                  }}
                  className="shrink-0 p-0.5 rounded hover:bg-white/20 text-white focus:outline-none"
                  aria-label={t('common.remove')}
                >
                  <IconCross className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <IconArrowDown
            className={`w-4 h-4 shrink-0 text-[var(--theme-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="border-t border-[var(--theme-border)] py-1 max-h-52 flex flex-col">
            <input
              type="search"
              autoComplete="off"
              placeholder={t('media.searchFilter')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="mx-2 mb-1 px-2 py-1.5 text-sm border border-[var(--theme-border)] rounded-md bg-[var(--theme-bg)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
            />
            <div className="overflow-y-auto px-1" role="listbox">
              {loading && <p className="text-xs text-[var(--theme-text-muted)] py-2 px-2">{t('common.loading')}</p>}
              {!loading && searchQuery.trim() && listItems.length === 0 && (
                <p className="text-xs text-[var(--theme-text-muted)] py-2 px-2">{t('common.noResults')}</p>
              )}
              {!loading &&
                listItems.map((e) => {
                  const checked = selectedIds.includes(e.id)
                  return (
                    <button
                      key={e.id}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => onToggle(e.id, e.name)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md text-[var(--theme-text)] ${checked ? 'bg-[var(--theme-primary)]/30' : 'hover:bg-[var(--theme-surface)]'}`}
                    >
                      <span className="flex-1 truncate">{e.name}</span>
                      {checked && (
                        <span className="filter-option-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lavender-400">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export interface MediaListFiltersProps {
  genres: Genre[]
  themes: { id: number; name: string }[]
  showHeader?: boolean
  /** Показывать фильтр по студиям (подгрузка по поиску). */
  showStudioFilter?: boolean
  /** Показывать фильтр по издателям (подгрузка по поиску). */
  showPublisherFilter?: boolean
  /** Показывать фильтр по разработчикам (подгрузка по поиску). */
  showDeveloperFilter?: boolean
  /** Список стран для фильтра (показывается, если не пустой). */
  countries?: string[]
  /** Показывать фильтр по сезону выхода (зима/весна/лето/осень) — только для аниме. */
  showSeasonFilter?: boolean
  sortOptions: string[]
  filters: MediaListParams
  onFiltersChange: (f: MediaListParams) => void
  onApply: () => void
  onReset: () => void
}

function MediaListFilters({
  genres,
  themes,
  showStudioFilter = false,
  showPublisherFilter = false,
  showDeveloperFilter = false,
  showHeader = true,
  countries = [],
  showSeasonFilter = false,
  sortOptions,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: MediaListFiltersProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [studioDropdownOpen, setStudioDropdownOpen] = useState(false)
  const [publisherDropdownOpen, setPublisherDropdownOpen] = useState(false)
  const [developerDropdownOpen, setDeveloperDropdownOpen] = useState(false)
  const genreIds = filters.genreIds ?? []
  const themeIds = filters.themeIds ?? []
  const excludeGenreIds = filters.excludeGenreIds ?? []
  const excludeThemeIds = filters.excludeThemeIds ?? []
  const genreMode = filters.genreMode ?? 'or'
  const themeMode = filters.themeMode ?? 'or'
  const studioIds = filters.studioIds ?? []
  const publisherIds = filters.publisherIds ?? []
  const developerIds = filters.developerIds ?? []
  const countryValues = filters.countries ?? []
  const seasonValue = filters.seasons?.[0] ?? ''
  const safeGenres = genres ?? []
  const safeThemes = themes ?? []
  const safeCountries = countries ?? []
  const safeSortOptions = sortOptions ?? []

  const toggleStudio = useCallback(
    (id: number) => {
      const next = studioIds.includes(id) ? studioIds.filter((x) => x !== id) : [...studioIds, id]
      onFiltersChange({ ...filters, studioIds: next.length ? next : undefined, page: 1 })
    },
    [filters, studioIds, onFiltersChange]
  )

  const togglePublisher = useCallback(
    (id: number) => {
      const next = publisherIds.includes(id) ? publisherIds.filter((x) => x !== id) : [...publisherIds, id]
      onFiltersChange({ ...filters, publisherIds: next.length ? next : undefined, page: 1 })
    },
    [filters, publisherIds, onFiltersChange]
  )

  const toggleDeveloper = useCallback(
    (id: number) => {
      const next = developerIds.includes(id) ? developerIds.filter((x) => x !== id) : [...developerIds, id]
      onFiltersChange({ ...filters, developerIds: next.length ? next : undefined, page: 1 })
    },
    [filters, developerIds, onFiltersChange]
  )

  const studioSearch = useEntityFilterSearch(
    studioIds,
    toggleStudio,
    (q) => entitiesApi.searchStudios({ search: q }),
    (ids) => entitiesApi.searchStudios({ ids })
  )
  const publisherSearch = useEntityFilterSearch(
    publisherIds,
    togglePublisher,
    (q) => entitiesApi.searchPublishers({ search: q }),
    (ids) => entitiesApi.searchPublishers({ ids })
  )
  const developerSearch = useEntityFilterSearch(
    developerIds,
    toggleDeveloper,
    (q) => entitiesApi.searchDevelopers({ search: q }),
    (ids) => entitiesApi.searchDevelopers({ ids })
  )

  const toggleGenre = (id: number) => {
    const next = genreIds.includes(id) ? genreIds.filter((x) => x !== id) : [...genreIds, id]
    onFiltersChange({ ...filters, genreIds: next.length ? next : undefined, page: 1 })
  }

  const toggleTheme = (id: number) => {
    const next = themeIds.includes(id) ? themeIds.filter((x) => x !== id) : [...themeIds, id]
    onFiltersChange({ ...filters, themeIds: next.length ? next : undefined, page: 1 })
  }

  const toggleExcludeGenre = (id: number) => {
    const next = excludeGenreIds.includes(id)
      ? excludeGenreIds.filter((x) => x !== id)
      : [...excludeGenreIds, id]
    onFiltersChange({ ...filters, excludeGenreIds: next.length ? next : undefined, page: 1 })
  }

  const toggleExcludeTheme = (id: number) => {
    const next = excludeThemeIds.includes(id)
      ? excludeThemeIds.filter((x) => x !== id)
      : [...excludeThemeIds, id]
    onFiltersChange({ ...filters, excludeThemeIds: next.length ? next : undefined, page: 1 })
  }

  /** Выбранное → исключить: убрать из genreIds, добавить в excludeGenreIds — одним вызовом */
  const switchGenreToExclude = (id: number) => {
    const nextGenre = genreIds.filter((x) => x !== id)
    const nextExclude =
      excludeGenreIds.includes(id) ? excludeGenreIds : [...excludeGenreIds, id]
    onFiltersChange({
      ...filters,
      genreIds: nextGenre.length ? nextGenre : undefined,
      excludeGenreIds: nextExclude.length ? nextExclude : undefined,
      page: 1,
    })
  }

  /** Исключённое → включить: убрать из excludeGenreIds, добавить в genreIds — одним вызовом */
  const switchGenreToInclude = (id: number) => {
    const nextExclude = excludeGenreIds.filter((x) => x !== id)
    const nextGenre = genreIds.includes(id) ? genreIds : [...genreIds, id]
    onFiltersChange({
      ...filters,
      genreIds: nextGenre.length ? nextGenre : undefined,
      excludeGenreIds: nextExclude.length ? nextExclude : undefined,
      page: 1,
    })
  }

  const switchThemeToExclude = (id: number) => {
    const nextTheme = themeIds.filter((x) => x !== id)
    const nextExclude =
      excludeThemeIds.includes(id) ? excludeThemeIds : [...excludeThemeIds, id]
    onFiltersChange({
      ...filters,
      themeIds: nextTheme.length ? nextTheme : undefined,
      excludeThemeIds: nextExclude.length ? nextExclude : undefined,
      page: 1,
    })
  }

  const switchThemeToInclude = (id: number) => {
    const nextExclude = excludeThemeIds.filter((x) => x !== id)
    const nextTheme = themeIds.includes(id) ? themeIds : [...themeIds, id]
    onFiltersChange({
      ...filters,
      themeIds: nextTheme.length ? nextTheme : undefined,
      excludeThemeIds: nextExclude.length ? nextExclude : undefined,
      page: 1,
    })
  }

  const setCountryFilter = (country: string) => {
    onFiltersChange({ ...filters, countries: country ? [country] : undefined, page: 1 })
  }

  const hasActiveFilters =
    (genreIds?.length ?? 0) > 0 ||
    (themeIds?.length ?? 0) > 0 ||
    (excludeGenreIds?.length ?? 0) > 0 ||
    (excludeThemeIds?.length ?? 0) > 0 ||
    genreMode !== 'or' ||
    themeMode !== 'or' ||
    (studioIds?.length ?? 0) > 0 ||
    (publisherIds?.length ?? 0) > 0 ||
    (developerIds?.length ?? 0) > 0 ||
    (countryValues?.length ?? 0) > 0 ||
    (filters.yearFrom != null && filters.yearFrom > 0) ||
    (filters.yearTo != null && filters.yearTo > 0) ||
    (filters.seasons?.length ?? 0) > 0 ||
    (filters.sortBy && filters.sortBy !== 'created_at') ||
    filters.order === 'asc'

  return (
    <div className="rounded-xl border-2 border-theme bg-theme-surface shadow-sm p-4 w-full space-y-5">
      {showHeader && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--theme-text)]">{t('media.filters')}</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-[var(--theme-primary)] hover:underline flex items-center gap-1"
            >
              <IconCross className="w-3.5 h-3.5" />
              {t('media.resetFilters')}
            </button>
          )}
        </div>
      )}

      <div className="space-y-5">
        {/* Сортировка — первой */}
        <div className="space-y-2">
          <CustomSelect
            label={t('media.sortBy')}
            value={filters.sortBy ?? 'created_at'}
            onChange={(v) => onFiltersChange({ ...filters, sortBy: v || undefined, page: 1 })}
            options={(safeSortOptions.length
              ? safeSortOptions
              : ['created_at', 'title', 'rating', 'release_date', 'popularity']
            ).map((key) => ({ value: key, label: t(SORT_KEYS[key] ?? 'media.sortCreated') }))}
          />
          <CustomSelect
            value={filters.order ?? 'desc'}
            onChange={(v) => onFiltersChange({ ...filters, order: (v as 'asc' | 'desc') || 'desc', page: 1 })}
            options={[
              { value: 'desc', label: t('media.orderDesc') },
              { value: 'asc', label: t('media.orderAsc') },
            ]}
          />
        </div>

        {/* Жанры — включение по клику, исключение по крестику при наведении */}
        <FilterSelectFullList
          labelKey="media.filterGenres"
          options={safeGenres}
          selectedIds={genreIds}
          onToggle={toggleGenre}
          getOptionName={(g) => getOptionalEntityName(g, locale) || g.name || ''}
          excludedIds={excludeGenreIds}
          onExcludeToggle={toggleExcludeGenre}
          onSwitchToExclude={switchGenreToExclude}
          onSwitchToInclude={switchGenreToInclude}
        />
        {safeGenres.length > 0 && (
          <CustomSelect
            label={t('media.filterGenreMode')}
            value={genreMode}
            onChange={(v) =>
              onFiltersChange({ ...filters, genreMode: (v as 'and' | 'or') || 'or', page: 1 })
            }
            options={[
              { value: 'or', label: t('media.genreModeOr') },
              { value: 'and', label: t('media.genreModeAnd') },
            ]}
          />
        )}

        {/* Темы — включение по клику, исключение по крестику при наведении */}
        {safeThemes.length > 0 && (
          <>
            <FilterSelectFullList
              labelKey="media.filterThemes"
              options={safeThemes}
              selectedIds={themeIds}
              onToggle={toggleTheme}
              getOptionName={(th) => getOptionalEntityName(th, locale) || th.name || ''}
              excludedIds={excludeThemeIds}
              onExcludeToggle={toggleExcludeTheme}
              onSwitchToExclude={switchThemeToExclude}
              onSwitchToInclude={switchThemeToInclude}
            />
            <CustomSelect
              label={t('media.filterThemeMode')}
              value={themeMode}
              onChange={(v) =>
                onFiltersChange({ ...filters, themeMode: (v as 'and' | 'or') || 'or', page: 1 })
              }
              options={[
                { value: 'or', label: t('media.themeModeOr') },
                { value: 'and', label: t('media.themeModeAnd') },
              ]}
            />
          </>
        )}

        {/* Студии — выпадающий список с поиском */}
        {showStudioFilter && (
          <EntityFilterDropdown
            labelKey="media.filterStudios"
            selectedItems={studioSearch.selectedItems}
            selectedIds={studioIds}
            searchQuery={studioSearch.searchQuery}
            onSearchChange={studioSearch.setSearchQuery}
            searchResults={studioSearch.searchResults}
            loading={studioSearch.loading}
            onToggle={studioSearch.toggle}
            open={studioDropdownOpen}
            onOpenChange={setStudioDropdownOpen}
          />
        )}

        {/* Издатели — выпадающий список с поиском */}
        {showPublisherFilter && (
          <EntityFilterDropdown
            labelKey="media.filterPublishers"
            selectedItems={publisherSearch.selectedItems}
            selectedIds={publisherIds}
            searchQuery={publisherSearch.searchQuery}
            onSearchChange={publisherSearch.setSearchQuery}
            searchResults={publisherSearch.searchResults}
            loading={publisherSearch.loading}
            onToggle={publisherSearch.toggle}
            open={publisherDropdownOpen}
            onOpenChange={setPublisherDropdownOpen}
          />
        )}

        {/* Разработчики — выпадающий список с поиском */}
        {showDeveloperFilter && (
          <EntityFilterDropdown
            labelKey="media.filterDevelopers"
            selectedItems={developerSearch.selectedItems}
            selectedIds={developerIds}
            searchQuery={developerSearch.searchQuery}
            onSearchChange={developerSearch.setSearchQuery}
            searchResults={developerSearch.searchResults}
            loading={developerSearch.loading}
            onToggle={developerSearch.toggle}
            open={developerDropdownOpen}
            onOpenChange={setDeveloperDropdownOpen}
          />
        )}

        {/* Страны — выпадающий список (для типов медиа, где есть country: фильмы и др.) */}
        {safeCountries.length > 0 && (
          <CustomSelect
            label={t('media.filterCountries')}
            value={countryValues[0] ?? ''}
            onChange={setCountryFilter}
            placeholder={t('media.allCountries')}
            options={[
              { value: '', label: t('media.allCountries') },
              ...safeCountries.map((country) => ({ value: country, label: country })),
            ]}
          />
        )}

        {/* Сезон выхода (только для аниме) */}
        {showSeasonFilter && (
          <CustomSelect
            label={t('media.filterSeason')}
            value={seasonValue}
            onChange={(v) => onFiltersChange({ ...filters, seasons: v ? [v] : undefined, page: 1 })}
            placeholder={t('media.allSeasons')}
            options={[
              { value: '', label: t('media.allSeasons') },
              { value: 'winter', label: t('media.seasonWinter') },
              { value: 'spring', label: t('media.seasonSpring') },
              { value: 'summer', label: t('media.seasonSummer') },
              { value: 'autumn', label: t('media.seasonAutumn') },
            ]}
          />
        )}

        {/* Год от / до */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[var(--theme-text)]">{t('media.yearFrom')}</label>
          <input
            type="number"
            min={1900}
            max={2100}
            placeholder="—"
            value={filters.yearFrom ?? ''}
            onChange={(e) => {
              const v = e.target.value ? parseInt(e.target.value, 10) : undefined
              onFiltersChange({ ...filters, yearFrom: v, page: 1 })
            }}
            className="input w-full text-sm"
          />
          <label className="block text-xs font-medium text-[var(--theme-text)]">{t('media.yearTo')}</label>
          <input
            type="number"
            min={1900}
            max={2100}
            placeholder="—"
            value={filters.yearTo ?? ''}
            onChange={(e) => {
              const v = e.target.value ? parseInt(e.target.value, 10) : undefined
              onFiltersChange({ ...filters, yearTo: v, page: 1 })
            }}
            className="input w-full text-sm"
          />
        </div>

        {/* Кнопка применить — загрузка списка только после нажатия */}
        <button
          type="button"
          onClick={onApply}
          className="filter-apply-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-space_indigo-600 text-lavender-500 font-medium hover:bg-space_indigo-700 transition-colors"
        >
          <IconSearch className="w-4 h-4" />
          {t('media.applyFilters')}
        </button>
      </div>
    </div>
  )
}

export default MediaListFilters
