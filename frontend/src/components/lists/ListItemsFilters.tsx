import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Check } from 'lucide-react'
import { IconCross, IconArrowDown } from '@/components/icons'
import { getEntityName } from '@/utils/localizedText'

interface ListItemsFiltersProps {
  searchQuery: string
  onSearchChange: (v: string) => void
  hideSearch?: boolean
  genreIds: number[]
  onGenreToggle: (id: number) => void
  excludeGenreIds: number[]
  onExcludeGenreToggle: (id: number) => void
  onGenreSwitchToExclude?: (id: number) => void
  onGenreSwitchToInclude?: (id: number) => void
  themeIds: number[]
  onThemeToggle: (id: number) => void
  excludeThemeIds: number[]
  onExcludeThemeToggle: (id: number) => void
  onThemeSwitchToExclude?: (id: number) => void
  onThemeSwitchToInclude?: (id: number) => void
  years: number[]
  onYearToggle: (year: number) => void
  seasons: string[]
  onSeasonToggle: (season: string) => void
  availableGenres: { id: number; name: string; nameI18n?: Record<string, string> }[]
  availableThemes: { id: number; name: string; nameI18n?: Record<string, string> }[]
  availableYears: number[]
  availableSeasons: string[]
  showSeasonFilter: boolean
  matchAllSelected: boolean
  onMatchAllSelectedChange: (v: boolean) => void
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

const SEASON_KEYS: Record<string, string> = {
  winter: 'media.seasonWinter',
  spring: 'media.seasonSpring',
  summer: 'media.seasonSummer',
  autumn: 'media.seasonAutumn',
}

function FilterDropdown<T extends number | string>({
  label,
  options,
  selected,
  onToggle,
  excluded,
  onExcludeToggle,
  onSwitchToExclude,
  onSwitchToInclude,
  getOptionLabel,
  placeholder,
  selectedCountLabel,
  emptyMessage = '—',
}: {
  label: string
  options: T[]
  selected: T[]
  onToggle: (v: T) => void
  excluded?: T[]
  onExcludeToggle?: (v: T) => void
  onSwitchToExclude?: (v: T) => void
  onSwitchToInclude?: (v: T) => void
  getOptionLabel: (v: T) => string
  placeholder?: string
  selectedCountLabel?: (count: number) => string
  emptyMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-[var(--theme-text)] mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-2 text-sm rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] min-h-[2.25rem]"
        aria-expanded={open}
      >
        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
          {selected.length === 0 && (excluded?.length ?? 0) === 0 ? (
            <span className="truncate text-[var(--theme-text-muted)]">{placeholder}</span>
          ) : (
            <>
              {selected.map((opt) => (
                <span
                  key={`sel-${String(opt)}`}
                  className="filter-selected-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-lavender-400 text-white"
                >
                  <span className="truncate max-w-[90px]">{getOptionLabel(opt)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onToggle(opt)
                    }}
                    className="shrink-0 p-0.5 rounded hover:bg-white/20 text-white focus:outline-none"
                    aria-label="Remove"
                  >
                    <IconCross className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {(excluded ?? []).map((opt) => (
                <span
                  key={`exc-${String(opt)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[#ffe9f0] text-gray-800 border border-[#fecaca]"
                >
                  <span className="truncate max-w-[90px]">{getOptionLabel(opt)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onExcludeToggle?.(opt)
                    }}
                    className="shrink-0 p-0.5 rounded hover:bg-[#fecaca]/40 focus:outline-none"
                    aria-label="Remove exclude"
                    disabled={!onExcludeToggle}
                  >
                    <IconCross className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </>
          )}
        </div>
        <IconArrowDown
          className={`w-4 h-4 shrink-0 text-[var(--theme-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-lg max-h-52 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-[var(--theme-text-muted)]">{emptyMessage}</p>
          ) : (
            options.map((opt) => {
              const checked = selected.includes(opt)
              const isExcluded = excluded?.includes(opt) ?? false
              const handleRowClick = () => {
                if (isExcluded && onSwitchToInclude) {
                  onSwitchToInclude(opt)
                } else if (isExcluded) {
                  onExcludeToggle?.(opt)
                  onToggle(opt)
                } else {
                  onToggle(opt)
                }
              }
              const handleExcludeClick = (e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                if (checked && onSwitchToExclude) {
                  onSwitchToExclude(opt)
                } else if (checked) {
                  onToggle(opt)
                  onExcludeToggle?.(opt)
                } else {
                  onExcludeToggle?.(opt)
                }
              }
              return (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={handleRowClick}
                  className={`group w-full flex items-center gap-1.5 px-2.5 py-2 text-sm text-left hover:bg-[var(--theme-surface)] ${
                    checked ? 'bg-[var(--theme-primary)]/20' : isExcluded ? 'bg-red-500/10' : ''
                  }`}
                >
                  <span className={`flex-1 truncate ${isExcluded ? 'line-through' : ''}`}>
                    {getOptionLabel(opt)}
                  </span>
                  {checked && (
                    <span className="filter-option-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lavender-400">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                  {onExcludeToggle && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Exclude"
                      onClick={handleExcludeClick}
                      className={`shrink-0 ml-1 text-xs transition-opacity ${
                        isExcluded
                          ? 'bg-[var(--theme-primary)] text-white rounded px-1 py-[2px]'
                          : 'opacity-0 group-hover:opacity-100 text-[var(--theme-text-muted)]'
                      }`}
                    >
                      ×
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default function ListItemsFilters({
  searchQuery,
  onSearchChange,
  hideSearch = false,
  genreIds,
  onGenreToggle,
  excludeGenreIds,
  onExcludeGenreToggle,
  onGenreSwitchToExclude,
  onGenreSwitchToInclude,
  themeIds,
  onThemeToggle,
  excludeThemeIds,
  onExcludeThemeToggle,
  onThemeSwitchToExclude,
  onThemeSwitchToInclude,
  years: selectedYears,
  onYearToggle,
  seasons: selectedSeasons,
  onSeasonToggle,
  availableGenres,
  availableThemes,
  availableYears,
  availableSeasons,
  showSeasonFilter,
  matchAllSelected,
  onMatchAllSelectedChange,
  hasActiveFilters = false,
  onClearFilters,
}: ListItemsFiltersProps) {
  const { t } = useTranslation()
  const hasGenreOrThemeSelection = genreIds.length > 0 || themeIds.length > 0

  return (
    <div className="flex flex-col gap-3">
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="px-2.5 py-2 text-sm rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--theme-bg)] transition-colors"
        >
          {t('lists.clearFilters')}
        </button>
      )}
      {!hideSearch && (
        <div>
          <label className="block text-xs font-medium text-[var(--theme-text)] mb-1.5">
            {t('common.search')}
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-text-muted)]"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface)]"
                aria-label={t('common.clear')}
              >
                <IconCross className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <FilterDropdown
        label={t('lists.filterGenres')}
        options={availableGenres.map((g) => g.id)}
        selected={genreIds}
        onToggle={onGenreToggle}
        excluded={excludeGenreIds}
        onExcludeToggle={onExcludeGenreToggle}
        onSwitchToExclude={onGenreSwitchToExclude}
        onSwitchToInclude={onGenreSwitchToInclude}
        getOptionLabel={(id) => {
          const g = availableGenres.find((x) => x.id === id)
          return g ? getEntityName(g, g.name) : String(id)
        }}
        placeholder={t('lists.allGenres')}
        selectedCountLabel={(n) => t('lists.selectedCount', { count: n })}
        emptyMessage={t('common.noResults')}
      />

      {availableThemes.length > 0 && (
        <FilterDropdown<number>
          label={t('lists.filterThemes')}
          options={availableThemes.map((th) => th.id)}
          selected={themeIds}
          onToggle={onThemeToggle}
          excluded={excludeThemeIds}
          onExcludeToggle={onExcludeThemeToggle}
          onSwitchToExclude={onThemeSwitchToExclude}
          onSwitchToInclude={onThemeSwitchToInclude}
          getOptionLabel={(id) => {
            const th = availableThemes.find((x) => x.id === id)
            return th ? getEntityName(th, th.name) : String(id)
          }}
          placeholder={t('lists.allThemes')}
          selectedCountLabel={(n) => t('lists.selectedCount', { count: n })}
          emptyMessage={t('common.noResults')}
        />
      )}

      <div className="space-y-1">
        <div className="text-xs font-medium text-[var(--theme-text-muted)]">{t('lists.matchMode')}</div>

        <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMatchAllSelectedChange(false)}
              disabled={!hasGenreOrThemeSelection}
              aria-pressed={!matchAllSelected}
              className={`px-2.5 py-2 rounded-lg border text-sm transition-colors ${
                !hasGenreOrThemeSelection
                  ? 'opacity-50 cursor-not-allowed'
                  : !matchAllSelected
                    ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-bg)]'
              }`}
              title={t('lists.matchAnySelected')}
            >
              {t('lists.matchAny')}
            </button>
            <button
              type="button"
              onClick={() => onMatchAllSelectedChange(true)}
              disabled={!hasGenreOrThemeSelection}
              aria-pressed={matchAllSelected}
              className={`px-2.5 py-2 rounded-lg border text-sm transition-colors ${
                !hasGenreOrThemeSelection
                  ? 'opacity-50 cursor-not-allowed'
                  : matchAllSelected
                    ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:bg-[var(--theme-bg)]'
              }`}
              title={t('lists.matchAllSelected')}
            >
              {t('lists.matchAll')}
            </button>
        </div>
      </div>

      <FilterDropdown<number>
        label={t('lists.filterYears')}
        options={availableYears}
        selected={selectedYears}
        onToggle={onYearToggle}
        getOptionLabel={(y) => String(y)}
        placeholder={t('lists.allYears')}
        selectedCountLabel={(n) => t('lists.selectedCount', { count: n })}
        emptyMessage={t('common.noResults')}
      />

      {showSeasonFilter && (
        <FilterDropdown<string>
          label={t('lists.filterSeasons')}
          options={availableSeasons}
          selected={selectedSeasons}
          onToggle={onSeasonToggle}
          getOptionLabel={(s) => t(SEASON_KEYS[s] ?? s)}
          placeholder={t('lists.allSeasons')}
          selectedCountLabel={(n) => t('lists.selectedCount', { count: n })}
          emptyMessage={t('common.noResults')}
        />
      )}
    </div>
  )
}
