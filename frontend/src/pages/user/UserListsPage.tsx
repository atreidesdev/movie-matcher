import { useEffect, useState, useMemo, useRef, type ComponentType } from 'react'
import { useParams, useSearchParams, useOutletContext } from 'react-router-dom'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import { useListStore } from '@/store/listStore'
import { useAuthStore } from '@/store/authStore'
import { listsApi, ListEntityType } from '@/api/lists'
import { ListStatus, ListItem } from '@/types'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { IconProps } from '@/components/icons'
import {
  IconCalendar,
  IconCross,
  IconReviews,
  IconSortAbc,
  IconSortAsc,
  IconSortCompleteDate,
  IconSortDesc,
  IconSortPersonalRating,
} from '@/components/icons'
import { MediaTypeForPath } from '@/utils/mediaPaths'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { mediaApi } from '@/api/media'
import EditInListModal from '@/components/EditInListModal'
import { Media } from '@/types'
import { getMediaFromItem, getMediaFullFromItem } from '@/utils/listItemMedia'
import { useListFilters } from '@/hooks/useListFilters'
import { useIsMobile } from '@/hooks/useIsMobile'
import ListItemsFilters from '@/components/lists/ListItemsFilters'
import ListViewSwitcher, { type ListViewMode } from '@/components/lists/ListViewSwitcher'
import ListItemDetailed from '@/components/lists/ListItemDetailed'
import ListItemCompact from '@/components/lists/ListItemCompact'
import ListItemCard from '@/components/lists/ListItemCard'

type ContentGroupKey = 'cinema' | 'anime' | 'cartoons' | 'books' | 'games'

const LIST_TABS: { key: ListEntityType; labelKey: string; mediaType: MediaTypeForPath }[] = [
  { key: 'movies', labelKey: 'nav.movies', mediaType: 'movie' },
  { key: 'anime', labelKey: 'nav.anime', mediaType: 'anime' },
  { key: 'games', labelKey: 'nav.games', mediaType: 'game' },
  { key: 'tv-series', labelKey: 'nav.tvSeries', mediaType: 'tv-series' },
  { key: 'manga', labelKey: 'nav.manga', mediaType: 'manga' },
  { key: 'books', labelKey: 'nav.books', mediaType: 'book' },
  { key: 'light-novels', labelKey: 'nav.lightNovels', mediaType: 'light-novel' },
  { key: 'cartoon-series', labelKey: 'nav.cartoonSeries', mediaType: 'cartoon-series' },
  { key: 'cartoon-movies', labelKey: 'nav.cartoonMovies', mediaType: 'cartoon-movies' },
  { key: 'anime-movies', labelKey: 'nav.animeMovies', mediaType: 'anime-movies' },
]

function SortDirIcon({ order }: { order: 'asc' | 'desc' }) {
  const Icon = order === 'asc' ? IconSortAsc : IconSortDesc
  return (
    <Icon
      size={16}
      className="shrink-0 text-[var(--theme-text-muted)]"
      aria-hidden
    />
  )
}

const LIST_TYPE_NAV_KEY: Record<ListEntityType, string> = {
  movies: 'movies',
  anime: 'anime',
  games: 'games',
  'tv-series': 'tvSeries',
  manga: 'manga',
  books: 'books',
  'light-novels': 'lightNovels',
  'cartoon-series': 'cartoonSeries',
  'cartoon-movies': 'cartoonMovies',
  'anime-movies': 'animeMovies',
}

const LIST_GROUPS: { key: ContentGroupKey; labelKey: string; types: ListEntityType[] }[] = [
  { key: 'cinema', labelKey: 'profile.mediaTypeMovie', types: ['movies', 'tv-series'] },
  { key: 'anime', labelKey: 'profile.mediaTypeAnime', types: ['anime', 'anime-movies'] },
  { key: 'cartoons', labelKey: 'profile.mediaTypeCartoons', types: ['cartoon-series', 'cartoon-movies'] },
  { key: 'books', labelKey: 'profile.mediaTypeBooks', types: ['books', 'manga', 'light-novels'] },
  { key: 'games', labelKey: 'nav.games', types: ['games'] },
]

const LIST_TYPE_TO_GROUP: Record<ListEntityType, ContentGroupKey> = {
  movies: 'cinema',
  'tv-series': 'cinema',
  anime: 'anime',
  'anime-movies': 'anime',
  'cartoon-series': 'cartoons',
  'cartoon-movies': 'cartoons',
  books: 'books',
  manga: 'books',
  'light-novels': 'books',
  games: 'games',
}

const VALID_LIST_TYPES = new Set(LIST_TABS.map((t) => t.key))
const VALID_STATUSES = new Set<ListStatus | 'all'>([
  'all',
  'planned',
  'watching',
  'completed',
  'onHold',
  'dropped',
  'rewatching',
])

const LIST_VIEW_STORAGE_KEY = 'user-lists-view-mode'
const LIST_SORT_BY_STORAGE_KEY = 'user-lists-sort-by'
const LIST_SORT_ORDER_STORAGE_KEY = 'user-lists-sort-order'

type ListSortBy = 'releaseDate' | 'title' | 'overallRating' | 'yourRating' | 'watchedAt'
type ListSortOrder = 'asc' | 'desc'

function getStoredViewMode(): ListViewMode {
  try {
    const v = localStorage.getItem(LIST_VIEW_STORAGE_KEY)
    if (v === 'detailed' || v === 'compact' || v === 'cards') return v
  } catch {
    /* ignore */
  }
  return 'detailed'
}

function getStoredSortBy(): ListSortBy {
  try {
    const v = localStorage.getItem(LIST_SORT_BY_STORAGE_KEY)
    if (v === 'releaseDate' || v === 'title' || v === 'overallRating' || v === 'yourRating' || v === 'watchedAt') return v
  } catch {
    /* ignore */
  }
  return 'releaseDate'
}

function getStoredSortOrder(): ListSortOrder {
  try {
    const v = localStorage.getItem(LIST_SORT_ORDER_STORAGE_KEY)
    if (v === 'asc' || v === 'desc') return v
  } catch {
    /* ignore */
  }
  return 'desc'
}

export default function UserListsPage() {
  const { t } = useTranslation()
  const { username } = useParams<{ username: string }>()
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useOutletContext<UserProfileLayoutContext>()

  const isOwnProfile = Boolean(username && user?.username === username)

  const activeTab = useMemo((): ListEntityType => {
    const type = searchParams.get('type')
    return type && VALID_LIST_TYPES.has(type as ListEntityType) ? (type as ListEntityType) : 'movies'
  }, [searchParams])

  const activeGroup: ContentGroupKey = useMemo(() => {
    const groupParam = searchParams.get('group') as ContentGroupKey | null
    if (groupParam && LIST_GROUPS.some((g) => g.key === groupParam)) {
      return groupParam
    }
    return LIST_TYPE_TO_GROUP[activeTab] ?? 'cinema'
  }, [searchParams, activeTab])

  const statusFilter = useMemo((): ListStatus | 'all' => {
    const status = searchParams.get('status')
    return status && VALID_STATUSES.has(status as ListStatus | 'all') ? (status as ListStatus | 'all') : 'all'
  }, [searchParams])

  const setActiveTab = (key: ListEntityType) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('type', key)
      const group = LIST_TYPE_TO_GROUP[key]
      if (group) next.set('group', group)
      return next
    })
  }

  const setActiveGroup = (groupKey: ContentGroupKey) => {
    const group = LIST_GROUPS.find((g) => g.key === groupKey)
    if (!group) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('group', groupKey)
      const currentType = next.get('type') as ListEntityType | null
      if (!currentType || !group.types.includes(currentType)) {
        next.set('type', group.types[0])
      }
      return next
    })
  }

  const setStatusFilter = (value: ListStatus | 'all') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all') next.delete('status')
      else next.set('status', value)
      return next
    })
  }

  const [editingItem, setEditingItem] = useState<ListItem | null>(null)
  const [editingMedia, setEditingMedia] = useState<Media | null>(null)
  const [editingMediaLoading, setEditingMediaLoading] = useState(false)
  const [listsDrawerOpen, setListsDrawerOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ListViewMode>(getStoredViewMode)
  const [sortBy, setSortBy] = useState<ListSortBy>(getStoredSortBy)
  const [sortOrder, setSortOrder] = useState<ListSortOrder>(getStoredSortOrder)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useIsMobile()
  const [listFilters, setListFilters] = useState({
    searchQuery: '',
    genreIds: [] as number[],
    themeIds: [] as number[],
    excludeGenreIds: [] as number[],
    excludeThemeIds: [] as number[],
    years: [] as number[],
    seasons: [] as string[],
    matchAllSelected: false,
  })
  const hasActiveFilters =
    listFilters.searchQuery.trim().length > 0 ||
    listFilters.genreIds.length > 0 ||
    listFilters.themeIds.length > 0 ||
    listFilters.excludeGenreIds.length > 0 ||
    listFilters.excludeThemeIds.length > 0 ||
    listFilters.years.length > 0 ||
    listFilters.seasons.length > 0

  const { getList, fetchList, updateInList, removeFromList, isLoading: storeLoading } = useListStore()

  const [otherUserList, setOtherUserList] = useState<ListItem[]>([])
  const [otherUserLoading, setOtherUserLoading] = useState(false)

  useEffect(() => {
    if (isOwnProfile) {
      LIST_TABS.forEach(({ key }) => fetchList(key))
    }
  }, [isOwnProfile, fetchList])

  useEffect(() => {
    if (!isOwnProfile && username) {
      setOtherUserLoading(true)
      const status = statusFilter === 'all' ? undefined : statusFilter
      listsApi
        .getListByUsername(username, activeTab, status)
        .then((data) => setOtherUserList(Array.isArray(data) ? data : []))
        .catch(() => setOtherUserList([]))
        .finally(() => setOtherUserLoading(false))
    }
  }, [isOwnProfile, username, activeTab, statusFilter])

  const rawList = isOwnProfile ? getList(activeTab) : otherUserList
  const currentList = Array.isArray(rawList) ? rawList : []
  const statusFilteredList =
    isOwnProfile && statusFilter === 'all'
      ? currentList
      : isOwnProfile
        ? currentList.filter((item) => item.status === statusFilter)
        : currentList
  const {
    filteredItems,
    availableGenres,
    availableThemes,
    availableYears,
    availableSeasons,
    showSeasonFilter,
  } = useListFilters(statusFilteredList, activeTab, listFilters)

  const sortedItems = useMemo(() => {
    const missingNumber = sortOrder === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
    const sign = sortOrder === 'asc' ? 1 : -1

    type WithValues = {
      item: ListItem
      title: string
      releaseTs?: number
      overallRating?: number
      yourRating?: number
      watchedTs?: number
    }

    const toNum = (v: unknown): number | undefined => {
      if (v == null || v === '') return undefined
      const n = typeof v === 'number' ? v : parseFloat(String(v))
      return Number.isNaN(n) ? undefined : n
    }

    const withValues: WithValues[] = filteredItems.map((item) => {
      const media = getMediaFullFromItem(item, activeTab)
      const title = (media?.title ?? item.id.toString()) || ''
      const releaseTs = media?.releaseDate ? new Date(media.releaseDate).getTime() : undefined
      const overallRating = toNum(media?.rating)
      const yourRating = toNum(item.rating)
      /** Сортировка по дате: сначала дата завершения, иначе дата начала */
      const watchedDate = item.completedAt ?? item.startedAt
      const watchedTs = watchedDate ? new Date(watchedDate).getTime() : undefined

      return { item, title, releaseTs, overallRating, yourRating, watchedTs }
    })

    const getNum = (v?: number): number => {
      if (v == null || Number.isNaN(v)) return missingNumber
      return Number(v)
    }

    withValues.sort((a, b) => {
      if (sortBy === 'title') {
        const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
        if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp
        return a.item.id - b.item.id
      }

      const av =
        sortBy === 'releaseDate'
          ? getNum(a.releaseTs)
          : sortBy === 'overallRating'
            ? getNum(a.overallRating)
            : sortBy === 'yourRating'
              ? getNum(a.yourRating)
              : getNum(a.watchedTs)
      const bv =
        sortBy === 'releaseDate'
          ? getNum(b.releaseTs)
          : sortBy === 'overallRating'
            ? getNum(b.overallRating)
            : sortBy === 'yourRating'
              ? getNum(b.yourRating)
              : getNum(b.watchedTs)

      const diff = Number(av) - Number(bv)
      if (diff !== 0) return diff * sign

      const titleCmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      if (titleCmp !== 0) return sortOrder === 'asc' ? titleCmp : -titleCmp
      return a.item.id - b.item.id
    })

    return withValues.map((x) => x.item)
  }, [filteredItems, activeTab, sortBy, sortOrder])

  const isLoading = isOwnProfile ? storeLoading : otherUserLoading

  const setViewModePersisted = (mode: ListViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem(LIST_VIEW_STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }

  const setSortByPersisted = (v: ListSortBy) => {
    setSortBy(v)
    try {
      localStorage.setItem(LIST_SORT_BY_STORAGE_KEY, v)
    } catch {
      /* ignore */
    }
  }

  const setSortOrderPersisted = (v: ListSortOrder) => {
    setSortOrder(v)
    try {
      localStorage.setItem(LIST_SORT_ORDER_STORAGE_KEY, v)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!sortDropdownOpen) return
    const onDown = (e: MouseEvent) => {
      const el = sortDropdownRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setSortDropdownOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [sortDropdownOpen])

  const toggleGenre = (id: number) => {
    setListFilters((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id) ? f.genreIds.filter((x) => x !== id) : [...f.genreIds, id],
    }))
  }
  const toggleTheme = (id: number) => {
    setListFilters((f) => ({
      ...f,
      themeIds: f.themeIds.includes(id) ? f.themeIds.filter((x) => x !== id) : [...f.themeIds, id],
    }))
  }
  const toggleExcludeGenre = (id: number) => {
    setListFilters((f) => ({
      ...f,
      excludeGenreIds: f.excludeGenreIds.includes(id)
        ? f.excludeGenreIds.filter((x) => x !== id)
        : [...f.excludeGenreIds, id],
    }))
  }
  const toggleExcludeTheme = (id: number) => {
    setListFilters((f) => ({
      ...f,
      excludeThemeIds: f.excludeThemeIds.includes(id)
        ? f.excludeThemeIds.filter((x) => x !== id)
        : [...f.excludeThemeIds, id],
    }))
  }
  const switchGenreToExclude = (id: number) => {
    setListFilters((f) => ({
      ...f,
      genreIds: f.genreIds.filter((x) => x !== id),
      excludeGenreIds: f.excludeGenreIds.includes(id) ? f.excludeGenreIds : [...f.excludeGenreIds, id],
    }))
  }
  const switchGenreToInclude = (id: number) => {
    setListFilters((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id) ? f.genreIds : [...f.genreIds, id],
      excludeGenreIds: f.excludeGenreIds.filter((x) => x !== id),
    }))
  }
  const switchThemeToExclude = (id: number) => {
    setListFilters((f) => ({
      ...f,
      themeIds: f.themeIds.filter((x) => x !== id),
      excludeThemeIds: f.excludeThemeIds.includes(id) ? f.excludeThemeIds : [...f.excludeThemeIds, id],
    }))
  }
  const switchThemeToInclude = (id: number) => {
    setListFilters((f) => ({
      ...f,
      themeIds: f.themeIds.includes(id) ? f.themeIds : [...f.themeIds, id],
      excludeThemeIds: f.excludeThemeIds.filter((x) => x !== id),
    }))
  }
  const toggleYear = (year: number) => {
    setListFilters((f) => ({
      ...f,
      years: f.years.includes(year) ? f.years.filter((x) => x !== year) : [...f.years, year],
    }))
  }
  const toggleSeason = (season: string) => {
    setListFilters((f) => ({
      ...f,
      seasons: f.seasons.includes(season) ? f.seasons.filter((x) => x !== season) : [...f.seasons, season],
    }))
  }
  const clearFilters = () => {
    setListFilters({
      searchQuery: '',
      genreIds: [],
      themeIds: [],
      excludeGenreIds: [],
      excludeThemeIds: [],
      years: [],
      seasons: [],
      matchAllSelected: false,
    })
  }

  const handleRemove = async (entityId: number) => {
    if (!isOwnProfile) return
    await removeFromList(activeTab, entityId)
  }

  const tabConfig = LIST_TABS.find((x) => x.key === activeTab) ?? LIST_TABS[0]

  const handleEditClick = (item: ListItem) => {
    if (!isOwnProfile) return
    const media = getMediaFromItem(item, activeTab)
    if (!media) return
    setEditingItem(item)
    setEditingMedia(null)
    setEditingMediaLoading(true)
    mediaApi
      .getMediaByType(tabConfig.mediaType, media.id)
      .then((data) => setEditingMedia(data as Media))
      .catch(() => setEditingItem(null))
      .finally(() => setEditingMediaLoading(false))
  }

  const handleEditModalClose = () => {
    setEditingItem(null)
    setEditingMedia(null)
  }

  const handleEditSave = async (data: Partial<ListItem>) => {
    if (!editingItem || !isOwnProfile) return
    const media = getMediaFromItem(editingItem, activeTab)
    if (!media) return
    await updateInList(activeTab, media.id, data)
    setEditingItem(null)
    setEditingMedia(null)
  }

  const handleEditRemove = async () => {
    if (!editingItem || !isOwnProfile) return
    const media = getMediaFromItem(editingItem, activeTab)
    if (!media) return
    await removeFromList(activeTab, media.id)
    setEditingItem(null)
    setEditingMedia(null)
  }

  if (!username || !profile) return null

  const watchedSortLabel =
    activeTab === 'games'
      ? t('lists.sortDateCompleted')
      : activeTab === 'books' || activeTab === 'manga' || activeTab === 'light-novels'
        ? t('lists.sortDateRead')
        : t('lists.sortDateViewed')

  const sortFieldOptions: { key: ListSortBy; Icon: ComponentType<IconProps>; label: string }[] = [
    { key: 'releaseDate', Icon: IconCalendar, label: t('media.sortReleaseDate') },
    { key: 'title', Icon: IconSortAbc, label: t('media.sortTitle') },
    { key: 'overallRating', Icon: IconReviews, label: t('media.sortRating') },
    { key: 'yourRating', Icon: IconSortPersonalRating, label: t('media.yourRating') },
    { key: 'watchedAt', Icon: IconSortCompleteDate, label: watchedSortLabel },
  ]

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 mt-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 order-2 lg:order-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <ListViewSwitcher value={viewMode} onChange={setViewModePersisted} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-text-muted)]"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={listFilters.searchQuery}
                    onChange={(e) => setListFilters((f) => ({ ...f, searchQuery: e.target.value }))}
                    placeholder={t('common.search')}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
                    autoComplete="off"
                  />
                  {listFilters.searchQuery && (
                    <button
                      type="button"
                      onClick={() => setListFilters((f) => ({ ...f, searchQuery: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface)]"
                      aria-label={t('common.clear')}
                    >
                      <IconCross className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-[200px]" ref={sortDropdownRef}>
                <div className="relative">
                  {(() => {
                    const activeOpt = sortFieldOptions.find((o) => o.key === sortBy)
                    const ActiveFieldIcon = activeOpt?.Icon
                    return (
                      <button
                        type="button"
                        onClick={() => setSortDropdownOpen((v) => !v)}
                        onDoubleClick={() => setSortOrderPersisted(sortOrder === 'asc' ? 'desc' : 'asc')}
                        aria-expanded={sortDropdownOpen}
                        className={`w-full px-2.5 py-2 rounded-lg border text-sm flex items-center justify-between gap-2 transition-colors ${
                          sortDropdownOpen
                            ? 'bg-[var(--theme-bg)] border-[var(--theme-primary)]'
                            : 'bg-[var(--theme-surface)] border-[var(--theme-border)] hover:bg-[var(--theme-bg)]'
                        }`}
                        title={activeOpt?.label}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {ActiveFieldIcon ? (
                            <ActiveFieldIcon size={18} className="shrink-0 text-[var(--theme-text-muted)]" />
                          ) : null}
                          <span className="truncate">{activeOpt?.label}</span>
                        </div>
                        <SortDirIcon order={sortOrder} />
                      </button>
                    )
                  })()}

                  {sortDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-lg max-h-64 overflow-y-auto">
                      {sortFieldOptions.map((opt) => {
                        const active = opt.key === sortBy
                        const OptIcon = opt.Icon
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              if (active) {
                                setSortOrderPersisted(sortOrder === 'asc' ? 'desc' : 'asc')
                              } else {
                                setSortByPersisted(opt.key)
                              }
                              setSortDropdownOpen(false)
                            }}
                            onDoubleClick={() => {
                              setSortByPersisted(opt.key)
                              setSortOrderPersisted(sortOrder === 'asc' ? 'desc' : 'asc')
                              setSortDropdownOpen(false)
                            }}
                            className={`w-full px-2.5 py-2 text-sm text-left flex items-center gap-1.5 transition-colors ${
                              active ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-text)]' : 'hover:bg-[var(--theme-surface)]'
                            }`}
                            title={opt.label}
                            aria-pressed={active}
                          >
                            <OptIcon size={18} className="shrink-0 text-[var(--theme-text-muted)]" />
                            <span className="flex-1 truncate">{opt.label}</span>
                            {active ? (
                              <SortDirIcon order={sortOrder} />
                            ) : (
                              <span className="inline-flex w-4 h-4 shrink-0" aria-hidden />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-24 bg-gray-200 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="text-center py-12 bg-[var(--theme-surface)] rounded-xl">
              <p className="text-[var(--theme-text-muted)]">{t('common.noResults')}</p>
            </div>
          ) : (
            viewMode === 'cards' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {sortedItems.map((item) => {
                  const media = getMediaFromItem(item, activeTab)
                  if (!media) return null
                  return (
                    <ListItemCard
                      key={item.id}
                      item={item}
                      listType={activeTab}
                      mediaType={tabConfig.mediaType}
                      isOwnProfile={isOwnProfile}
                      onEdit={handleEditClick}
                      onRemove={handleRemove}
                    />
                  )
                })}
              </div>
            ) : (
              <motion.div
                className={viewMode === 'compact' ? 'space-y-2' : 'space-y-4'}
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {sortedItems.map((item) => {
                  const media = getMediaFromItem(item, activeTab)
                  if (!media) return null
                  return (
                    <motion.div key={item.id} variants={staggerItemVariants}>
                      {viewMode === 'compact' ? (
                        <ListItemCompact
                          item={item}
                          listType={activeTab}
                          mediaType={tabConfig.mediaType}
                          isOwnProfile={isOwnProfile}
                          isMobile={isMobile}
                          onEdit={handleEditClick}
                          onRemove={handleRemove}
                        />
                      ) : (
                        <ListItemDetailed
                          item={item}
                          listType={activeTab}
                          mediaType={tabConfig.mediaType}
                          isOwnProfile={isOwnProfile}
                          onEdit={handleEditClick}
                          onRemove={handleRemove}
                        />
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setListsDrawerOpen(true)}
          className="lg:hidden fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-space_indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-space_indigo-700 transition-colors"
          aria-label={t('lists.listType')}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {listsDrawerOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setListsDrawerOpen(false)}
              aria-hidden
            />
            <aside
              className="list-drawer lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 flex flex-col overflow-hidden"
              aria-modal
              aria-label={t('lists.listType')}
            >
              <div className="list-drawer-header flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="list-drawer-title text-lg font-semibold text-gray-800">{t('lists.listType')}</h2>
                <button
                  type="button"
                  onClick={() => setListsDrawerOpen(false)}
                  className="list-drawer-close p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={t('common.close')}
                >
                  <IconCross className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <p className="list-filter-label text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('lists.listType')}
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="list-filter-group flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
                      {LIST_GROUPS.map(({ key, labelKey }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveGroup(key)}
                          className={`list-filter-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                            activeGroup === key
                              ? 'list-filter-btn-active bg-space_indigo-600 text-white shadow'
                              : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                          }`}
                        >
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                    {LIST_GROUPS.find((g) => g.key === activeGroup)?.types.length &&
                      LIST_GROUPS.find((g) => g.key === activeGroup)!.types.length > 1 && (
                        <div className="list-filter-group list-subtype-group flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
                          {LIST_TABS.filter(({ key }) => LIST_TYPE_TO_GROUP[key] === activeGroup).map(
                            ({ key, labelKey }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                className={`list-filter-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                  activeTab === key
                                    ? 'list-filter-btn-active bg-space_indigo-600 text-white shadow'
                                    : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                                }`}
                              >
                                {labelKey.startsWith('nav.') ? t(labelKey) : labelKey}
                              </button>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </div>
                <div>
                  <p className="list-filter-label text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('lists.statusFilter')}
                  </p>
                  <div className="list-filter-group flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
                    {(
                      [
                        ['all', t('lists.allStatus')],
                        ['planned', getListStatusLabel(t, activeTab, 'planned')],
                        ['watching', getListStatusLabel(t, activeTab, 'watching')],
                        ['completed', getListStatusLabel(t, activeTab, 'completed')],
                        ['onHold', getListStatusLabel(t, activeTab, 'onHold')],
                        ['dropped', getListStatusLabel(t, activeTab, 'dropped')],
                        ['rewatching', getListStatusLabel(t, activeTab, 'rewatching')],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatusFilter(value)}
                        className={`list-filter-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                          statusFilter === value
                            ? 'list-filter-btn-active bg-space_indigo-600 text-white shadow'
                            : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <ListItemsFilters
                    searchQuery={listFilters.searchQuery}
                    onSearchChange={(v) => setListFilters((f) => ({ ...f, searchQuery: v }))}
                    genreIds={listFilters.genreIds}
                    onGenreToggle={toggleGenre}
                    excludeGenreIds={listFilters.excludeGenreIds}
                    onExcludeGenreToggle={toggleExcludeGenre}
                    onGenreSwitchToExclude={switchGenreToExclude}
                    onGenreSwitchToInclude={switchGenreToInclude}
                    themeIds={listFilters.themeIds}
                    onThemeToggle={toggleTheme}
                    excludeThemeIds={listFilters.excludeThemeIds}
                    onExcludeThemeToggle={toggleExcludeTheme}
                    onThemeSwitchToExclude={switchThemeToExclude}
                    onThemeSwitchToInclude={switchThemeToInclude}
                    years={listFilters.years}
                    onYearToggle={toggleYear}
                    seasons={listFilters.seasons}
                    onSeasonToggle={toggleSeason}
                    availableGenres={availableGenres}
                    availableThemes={availableThemes}
                    availableYears={availableYears}
                    availableSeasons={availableSeasons}
                    showSeasonFilter={showSeasonFilter}
                    matchAllSelected={listFilters.matchAllSelected}
                    onMatchAllSelectedChange={(v) => setListFilters((f) => ({ ...f, matchAllSelected: v }))}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                  />
                </div>
              </div>
            </aside>
          </>
        )}

        <aside className="hidden lg:flex flex-col gap-4 shrink-0 lg:w-52 order-1 lg:order-1">
          <div>
            <p className="list-filter-label text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {t('lists.listType')}
            </p>
            <div className="flex flex-col gap-3">
              <div className="list-filter-group flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
                {LIST_GROUPS.map(({ key, labelKey }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveGroup(key)}
                    className={`list-filter-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeGroup === key
                        ? 'list-filter-btn-active bg-space_indigo-600 text-white shadow'
                        : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              {LIST_GROUPS.find((g) => g.key === activeGroup)?.types.length &&
                LIST_GROUPS.find((g) => g.key === activeGroup)!.types.length > 1 && (
                  <div className="list-filter-group list-subtype-group flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
                    {LIST_TABS.filter(({ key }) => LIST_TYPE_TO_GROUP[key] === activeGroup).map(({ key, labelKey }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`list-filter-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                          activeTab === key
                            ? 'list-filter-btn-active bg-space_indigo-600 text-white shadow'
                            : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                        }`}
                      >
                        {labelKey.startsWith('nav.') ? t(labelKey) : labelKey}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>

          <div>
            <p className="list-filter-label text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {t('lists.statusFilter')}
            </p>
            <div className="list-filter-group flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
              {(
                [
                  ['all', t('lists.allStatus')],
                  ['planned', getListStatusLabel(t, activeTab, 'planned')],
                  ['watching', getListStatusLabel(t, activeTab, 'watching')],
                  ['completed', getListStatusLabel(t, activeTab, 'completed')],
                  ['onHold', getListStatusLabel(t, activeTab, 'onHold')],
                  ['dropped', getListStatusLabel(t, activeTab, 'dropped')],
                  ['rewatching', getListStatusLabel(t, activeTab, 'rewatching')],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`list-filter-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    statusFilter === value
                      ? 'list-filter-btn-active bg-space_indigo-600 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <aside className="hidden lg:flex flex-col gap-4 shrink-0 lg:w-56 order-2 lg:order-3">
          <div>
            <ListItemsFilters
              searchQuery={listFilters.searchQuery}
              onSearchChange={(v) => setListFilters((f) => ({ ...f, searchQuery: v }))}
              genreIds={listFilters.genreIds}
              onGenreToggle={toggleGenre}
              excludeGenreIds={listFilters.excludeGenreIds}
              onExcludeGenreToggle={toggleExcludeGenre}
              onGenreSwitchToExclude={switchGenreToExclude}
              onGenreSwitchToInclude={switchGenreToInclude}
              themeIds={listFilters.themeIds}
              onThemeToggle={toggleTheme}
              excludeThemeIds={listFilters.excludeThemeIds}
              onExcludeThemeToggle={toggleExcludeTheme}
              onThemeSwitchToExclude={switchThemeToExclude}
              onThemeSwitchToInclude={switchThemeToInclude}
              years={listFilters.years}
              onYearToggle={toggleYear}
              seasons={listFilters.seasons}
              onSeasonToggle={toggleSeason}
              availableGenres={availableGenres}
              availableThemes={availableThemes}
              availableYears={availableYears}
              availableSeasons={availableSeasons}
              showSeasonFilter={showSeasonFilter}
              hideSearch
              matchAllSelected={listFilters.matchAllSelected}
              onMatchAllSelectedChange={(v) => setListFilters((f) => ({ ...f, matchAllSelected: v }))}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          </div>
        </aside>
      </div>

      {editingMediaLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4">{t('common.loading')}</div>
        </div>
      )}

      {editingItem && editingMedia && !editingMediaLoading && (
        <EditInListModal
          isOpen={true}
          onClose={handleEditModalClose}
          listItem={editingItem}
          media={editingMedia}
          type={tabConfig.mediaType}
          listName={t(`nav.${LIST_TYPE_NAV_KEY[activeTab]}`)}
          onSave={handleEditSave}
          onRemove={handleEditRemove}
        />
      )}
    </>
  )
}
