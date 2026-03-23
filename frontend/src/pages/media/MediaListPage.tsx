import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, SlidersHorizontal, LayoutGrid, List, LayoutList } from 'lucide-react'
import { IconCross } from '@/components/icons'
import { mediaApi, MEDIA_GRID_PAGE_SIZE, type MediaListParams, type MediaFiltersResponse } from '@/api/media'
import { Media, ListStatus, ListItem } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useListStore } from '@/store/listStore'
import { useToastStore } from '@/store/toastStore'
import MediaGrid from '@/components/MediaGrid'
import MediaCardHorizontal from '@/components/MediaCardHorizontal'
import MediaCardDetailed from '@/components/MediaCardDetailed'
import MediaListFilters from '@/components/MediaListFilters'
import AddToListModal from '@/components/AddToListModal'
import EditInListModal from '@/components/EditInListModal'
import { MediaTypeForPath } from '@/utils/mediaPaths'
import { titleToSlug } from '@/utils/slug'
import { getLocalizedString, getMediaTitle } from '@/utils/localizedText'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { motion } from 'framer-motion'
import { useCanHover } from '@/hooks/useCanHover'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import type { ListEntityType } from '@/api/lists'
import type { Genre } from '@/types'

const TYPE_TO_LIST_ENTITY: Record<MediaTypeForPath, ListEntityType> = {
  movie: 'movies',
  anime: 'anime',
  game: 'games',
  'tv-series': 'tv-series',
  manga: 'manga',
  book: 'books',
  'light-novel': 'light-novels',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

function getMediaIdFromListItem(item: ListItem): number | undefined {
  const m =
    item.movie ??
    item.animeSeries ??
    item.game ??
    item.tvSeries ??
    item.manga ??
    item.book ??
    item.lightNovel ??
    item.cartoonSeries ??
    item.cartoonMovie ??
    item.animeMovie
  return m?.id
}

export type MediaListViewMode = 'grid' | 'horizontal' | 'detailed'

const TYPE_LABEL: Record<MediaTypeForPath, string> = {
  movie: 'nav.movies',
  'tv-series': 'nav.tvSeries',
  anime: 'nav.anime',
  'anime-movies': 'nav.animeMovies',
  'cartoon-series': 'nav.cartoonSeries',
  'cartoon-movies': 'nav.cartoonMovies',
  book: 'nav.books',
  manga: 'nav.manga',
  'light-novel': 'nav.lightNovels',
  game: 'nav.games',
}

const TYPES_WITH_STUDIO_FILTER: MediaTypeForPath[] = [
  'movie',
  'tv-series',
  'anime',
  'cartoon-series',
  'cartoon-movies',
  'anime-movies',
]
const TYPES_WITH_PUBLISHER_FILTER: MediaTypeForPath[] = ['manga', 'book', 'light-novel', 'game']
const TYPES_WITH_DEVELOPER_FILTER: MediaTypeForPath[] = ['game']

const defaultListParams: MediaListParams = {
  page: 1,
  pageSize: MEDIA_GRID_PAGE_SIZE,
  sortBy: 'created_at',
  order: 'desc',
}

const QUERY_PAGE = 'page'
const QUERY_SORT = 'sortBy'
const QUERY_ORDER = 'order'
/** В URL пишем слаг (транслитерация), для обратной совместимости читаем и genreIds, и genres */
const QUERY_GENRES = 'genres'
const QUERY_THEMES = 'themes'
const QUERY_GENRE_IDS_LEGACY = 'genreIds'
const QUERY_THEME_IDS_LEGACY = 'themeIds'
const QUERY_GENRE_MODE = 'genreMode'
const QUERY_THEME_MODE = 'themeMode'
const QUERY_EXCLUDE_GENRES = 'excludeGenres'
const QUERY_EXCLUDE_THEMES = 'excludeThemes'
const QUERY_STUDIOS = 'studioIds'
const QUERY_PUBLISHERS = 'publisherIds'
const QUERY_DEVELOPERS = 'developerIds'
const QUERY_COUNTRIES = 'countries'
const QUERY_YEAR_FROM = 'yearFrom'
const QUERY_YEAR_TO = 'yearTo'
const QUERY_SEASONS = 'seasons'

function parseIdList(s: string | null): number[] {
  if (!s?.trim()) return []
  return s
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n))
}

function parseStringList(s: string | null): string[] {
  if (!s?.trim()) return []
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

/** Слаг жанра/темы для URL (транслитерация названия). */
function entityToSlug(entity: { name?: string; nameI18n?: Record<string, string> } | null, locale: string): string {
  if (!entity) return ''
  const name = getLocalizedString(entity.nameI18n, entity.name, locale) || entity.name || ''
  return titleToSlug(name).toLowerCase().replace(/-+/g, '-') || ''
}

/** Разрешает слаг в id: число трактуем как id, иначе ищем по транслитерированному названию в list. */
function resolveSlugsToIds<T extends { id: number; name?: string; nameI18n?: Record<string, string> }>(
  slugs: string[],
  list: T[],
  locale: string
): number[] {
  if (!slugs.length) return []
  const ids: number[] = []
  for (const slug of slugs) {
    const norm = slug.trim().toLowerCase()
    if (!norm) continue
    const asNum = parseInt(norm, 10)
    if (!Number.isNaN(asNum)) {
      if (list.length && list.some((e) => e.id === asNum)) ids.push(asNum)
      else if (!list.length) ids.push(asNum)
      continue
    }
    if (list.length) {
      const found = list.find((e) => entityToSlug(e, locale).toLowerCase() === norm)
      if (found) ids.push(found.id)
    }
  }
  return ids
}

/** Читает фильтры из query: жанры/темы по слагам (genres=komediya,drama) или по старым genreIds для совместимости. */
function searchToParams(
  search: URLSearchParams,
  filtersMeta: MediaFiltersResponse | null,
  locale: string
): MediaListParams {
  const page = Math.max(1, parseInt(search.get(QUERY_PAGE) ?? '1', 10) || 1)
  const sortBy = search.get(QUERY_SORT) || defaultListParams.sortBy
  const order = (search.get(QUERY_ORDER) === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
  let genreIds: number[] = parseIdList(search.get(QUERY_GENRE_IDS_LEGACY))
  let themeIds: number[] = parseIdList(search.get(QUERY_THEME_IDS_LEGACY))
  if (genreIds.length === 0) {
    const genreSlugs = parseStringList(search.get(QUERY_GENRES))
    if (genreSlugs.length && filtersMeta?.genres?.length) {
      genreIds = resolveSlugsToIds(genreSlugs, filtersMeta.genres as Genre[], locale)
    }
  }
  if (themeIds.length === 0) {
    const themeSlugs = parseStringList(search.get(QUERY_THEMES))
    if (themeSlugs.length && filtersMeta?.themes?.length) {
      themeIds = resolveSlugsToIds(themeSlugs, filtersMeta.themes, locale)
    }
  }
  let excludeGenreIds: number[] = parseIdList(search.get(QUERY_EXCLUDE_GENRES))
  let excludeThemeIds: number[] = parseIdList(search.get(QUERY_EXCLUDE_THEMES))
  if (excludeGenreIds.length === 0) {
    const slugs = parseStringList(search.get(QUERY_EXCLUDE_GENRES))
    if (slugs.length && filtersMeta?.genres?.length) {
      excludeGenreIds = resolveSlugsToIds(slugs, filtersMeta.genres as Genre[], locale)
    }
  }
  if (excludeThemeIds.length === 0) {
    const slugs = parseStringList(search.get(QUERY_EXCLUDE_THEMES))
    if (slugs.length && filtersMeta?.themes?.length) {
      excludeThemeIds = resolveSlugsToIds(slugs, filtersMeta.themes, locale)
    }
  }
  const genreMode = (search.get(QUERY_GENRE_MODE) === 'and' ? 'and' : 'or') as 'and' | 'or'
  const themeMode = (search.get(QUERY_THEME_MODE) === 'and' ? 'and' : 'or') as 'and' | 'or'
  const studioIds = parseIdList(search.get(QUERY_STUDIOS))
  const publisherIds = parseIdList(search.get(QUERY_PUBLISHERS))
  const developerIds = parseIdList(search.get(QUERY_DEVELOPERS))
  const countries = parseStringList(search.get(QUERY_COUNTRIES))
  const yearFrom = parseInt(search.get(QUERY_YEAR_FROM) ?? '', 10)
  const yearTo = parseInt(search.get(QUERY_YEAR_TO) ?? '', 10)
  const seasons = parseStringList(search.get(QUERY_SEASONS)).filter((s) =>
    ['winter', 'spring', 'summer', 'autumn'].includes(s)
  )
  return {
    page,
    pageSize: MEDIA_GRID_PAGE_SIZE,
    sortBy,
    order,
    ...(genreIds.length ? { genreIds } : {}),
    ...(themeIds.length ? { themeIds } : {}),
    ...(excludeGenreIds.length ? { excludeGenreIds } : {}),
    ...(excludeThemeIds.length ? { excludeThemeIds } : {}),
    ...(genreMode !== 'or' ? { genreMode } : {}),
    ...(themeMode !== 'or' ? { themeMode } : {}),
    ...(studioIds.length ? { studioIds } : {}),
    ...(publisherIds.length ? { publisherIds } : {}),
    ...(developerIds.length ? { developerIds } : {}),
    ...(countries.length ? { countries } : {}),
    ...(!Number.isNaN(yearFrom) && yearFrom > 0 ? { yearFrom } : {}),
    ...(!Number.isNaN(yearTo) && yearTo > 0 ? { yearTo } : {}),
    ...(seasons.length ? { seasons } : {}),
  }
}

/** Пишет фильтры в query: жанры и темы — транслитерацией (слагами), остальное как раньше. */
function paramsToSearch(
  params: MediaListParams,
  filtersMeta: MediaFiltersResponse | null,
  locale: string
): URLSearchParams {
  const p = new URLSearchParams()
  const page = Math.max(1, params.page ?? 1)
  if (page > 1) p.set(QUERY_PAGE, String(page))
  const sortBy = params.sortBy ?? defaultListParams.sortBy ?? 'created_at'
  if (sortBy !== defaultListParams.sortBy) p.set(QUERY_SORT, sortBy)
  const order = params.order ?? defaultListParams.order ?? 'desc'
  if (order !== defaultListParams.order) p.set(QUERY_ORDER, order)
  if (params.genreIds?.length && filtersMeta?.genres?.length) {
    const slugs = params.genreIds
      .map((id) => filtersMeta.genres!.find((g) => g.id === id))
      .filter(Boolean)
      .map((g) => entityToSlug(g!, locale))
      .filter(Boolean)
    if (slugs.length) p.set(QUERY_GENRES, slugs.join(','))
  } else if (params.genreIds?.length) {
    p.set(QUERY_GENRES, params.genreIds.join(','))
  }
  if (params.themeIds?.length && filtersMeta?.themes?.length) {
    const slugs = params.themeIds
      .map((id) => filtersMeta.themes!.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => entityToSlug(t!, locale))
      .filter(Boolean)
    if (slugs.length) p.set(QUERY_THEMES, slugs.join(','))
  } else if (params.themeIds?.length) {
    p.set(QUERY_THEMES, params.themeIds.join(','))
  }
  if (params.excludeGenreIds?.length && filtersMeta?.genres?.length) {
    const slugs = params.excludeGenreIds
      .map((id) => filtersMeta!.genres!.find((g) => g.id === id))
      .filter(Boolean)
      .map((g) => entityToSlug(g!, locale))
      .filter(Boolean)
    if (slugs.length) p.set(QUERY_EXCLUDE_GENRES, slugs.join(','))
  } else if (params.excludeGenreIds?.length) {
    p.set(QUERY_EXCLUDE_GENRES, params.excludeGenreIds.join(','))
  }
  if (params.excludeThemeIds?.length && filtersMeta?.themes?.length) {
    const slugs = params.excludeThemeIds
      .map((id) => filtersMeta!.themes!.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => entityToSlug(t!, locale))
      .filter(Boolean)
    if (slugs.length) p.set(QUERY_EXCLUDE_THEMES, slugs.join(','))
  } else if (params.excludeThemeIds?.length) {
    p.set(QUERY_EXCLUDE_THEMES, params.excludeThemeIds.join(','))
  }
  if (params.genreMode && params.genreMode !== 'or') p.set(QUERY_GENRE_MODE, params.genreMode)
  if (params.themeMode && params.themeMode !== 'or') p.set(QUERY_THEME_MODE, params.themeMode)
  if (params.studioIds?.length) p.set(QUERY_STUDIOS, params.studioIds.join(','))
  if (params.publisherIds?.length) p.set(QUERY_PUBLISHERS, params.publisherIds.join(','))
  if (params.developerIds?.length) p.set(QUERY_DEVELOPERS, params.developerIds.join(','))
  if (params.countries?.length) p.set(QUERY_COUNTRIES, params.countries.join(','))
  if (params.yearFrom != null && params.yearFrom > 0) p.set(QUERY_YEAR_FROM, String(params.yearFrom))
  if (params.yearTo != null && params.yearTo > 0) p.set(QUERY_YEAR_TO, String(params.yearTo))
  if (params.seasons?.length) p.set(QUERY_SEASONS, params.seasons.join(','))
  return p
}

/** Формирует массив номеров страниц для отображения с многоточием (1 … 4 5 6 … 12). */
function getPaginationPages(current: number, total: number, delta = 2): (number | 'ellipsis')[] {
  if (total <= 1) return []
  const pages: (number | 'ellipsis')[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)
  if (left > 1) pages.push(1)
  if (left > 2) pages.push('ellipsis')
  for (let p = left; p <= right; p++) pages.push(p)
  if (right < total - 1) pages.push('ellipsis')
  if (total > 1) pages.push(total)
  return pages
}

interface MediaListPageProps {
  type: MediaTypeForPath
}

export default function MediaListPage({ type }: MediaListPageProps) {
  const { t, i18n } = useTranslation()
  const canHover = useCanHover()
  const locale = i18n.language || 'ru'
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const fetchList = useListStore((s) => s.fetchList)
  const [items, setItems] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<MediaListViewMode>('grid')
  /** Применённые фильтры — по ним идёт загрузка списка; синхронизированы с URL. */
  const [filters, setFiltersState] = useState<MediaListParams>(defaultListParams)
  /** Черновик в форме — загрузка только после нажатия «Применить». */
  const [filtersDraft, setFiltersDraft] = useState<MediaListParams>(defaultListParams)
  const [filtersMeta, setFiltersMeta] = useState<MediaFiltersResponse | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)
  const ratingRankOffset = ((filters.page ?? 1) - 1) * (filters.pageSize ?? MEDIA_GRID_PAGE_SIZE)
  const showRatingRank = filters.sortBy === 'rating'

  /** Синхронизация URL → state: при смене типа, query или появлении filtersMeta (разрешаем слагы жанров/тем). */
  useEffect(() => {
    const p = searchToParams(searchParams, filtersMeta, locale)
    setFiltersState(p)
    setFiltersDraft(p)
  }, [type, searchParams, filtersMeta, locale])

  const setFilters = useCallback(
    (arg: MediaListParams | ((prev: MediaListParams) => MediaListParams)) => {
      setFiltersState((prev) => {
        const next = typeof arg === 'function' ? arg(prev) : arg
        setSearchParams(paramsToSearch(next, filtersMeta, locale), { replace: true })
        return next
      })
    },
    [setSearchParams, filtersMeta, locale]
  )

  /** При изменении выбора в форме — только обновляем черновик; применение по кнопке «Применить». */
  const onFiltersChange = useCallback((newDraft: MediaListParams) => {
    setFiltersDraft(newDraft)
  }, [])

  const listEntityType = TYPE_TO_LIST_ENTITY[type]
  const listItems = useListStore((s) => s.listByType[listEntityType] ?? [])
  const addToList = useListStore((s) => s.addToList)
  const updateInList = useListStore((s) => s.updateInList)
  const removeFromList = useListStore((s) => s.removeFromList)
  const getList = useListStore((s) => s.getList)
  const [mediaForListModal, setMediaForListModal] = useState<Media | null>(null)
  /** Запись в списке для выбранного медиа (если уже в списке — показываем EditInListModal) */
  const listItemForModal = useMemo((): ListItem | undefined => {
    if (!mediaForListModal || !listEntityType) return undefined
    return getList(listEntityType).find((item) => getMediaIdFromListItem(item) === mediaForListModal.id)
  }, [mediaForListModal, listEntityType, getList])
  /** Для авторизованного пользователя: статус в списке по mediaId (иконка на карточке) */
  const listStatusByMediaId = useMemo((): Record<number, ListStatus> | undefined => {
    if (!user || !listItems.length) return undefined
    const map: Record<number, ListStatus> = {}
    for (const item of listItems) {
      const id = getMediaIdFromListItem(item)
      if (id != null && item.status) map[id] = item.status
    }
    return Object.keys(map).length ? map : undefined
  }, [user, listItems])

  const handleQuickStatus = useCallback(
    async (media: Media, status: ListStatus) => {
      if (!listEntityType) return
      const list = getList(listEntityType)
      const existing = list.find((item) => getMediaIdFromListItem(item) === media.id)
      const mediaTitle = getMediaTitle(media, locale) || media.title
      const statusLabel = getListStatusLabel(t, listEntityType, status)
      try {
        if (existing) {
          await updateInList(listEntityType, media.id, { status })
          useToastStore.getState().show({
            title: t('toast.statusChanged'),
            description: `${mediaTitle} · ${statusLabel}`,
          })
        } else {
          await addToList(listEntityType, media.id, status)
          useToastStore.getState().show({
            title: t('toast.addedToList'),
            description: `${mediaTitle} · ${statusLabel}`,
          })
        }
      } catch (err) {
        console.error('[MediaListPage] Quick status failed:', err)
      }
    },
    [listEntityType, getList, addToList, updateInList, t, locale]
  )

  useEffect(() => {
    mediaApi
      .getMediaFilters(type)
      .then(setFiltersMeta)
      .catch(() => {
        setFiltersMeta({ genres: [], themes: [], sortOptions: [], orderOptions: [] })
      })
  }, [type])

  useEffect(() => {
    if (user && listEntityType) void fetchList(listEntityType)
  }, [user, listEntityType, fetchList])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await mediaApi.getMediaList<Media>(type, { ...filters, pageSize: MEDIA_GRID_PAGE_SIZE })
        const list = Array.isArray(res.data) ? res.data : []
        setItems(list)
        setTotal(res.total ?? 0)
        setTotalPages(res.totalPages ?? 1)
      } catch (error) {
        console.error('[MediaListPage] Failed to fetch media:', error)
        setItems([])
        setTotal(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [type, filters])

  const title = t('home.popular') + ' — ' + t(TYPE_LABEL[type])

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pt-6 lg:pt-8">
      {/* Основной контент: заголовок, переключатель вида, список — слева */}
      <div className="flex-1 min-w-0 order-1 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div
            className="view-mode-group flex rounded-xl p-1 border shadow"
            role="group"
            aria-label={t('media.viewMode')}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`view-mode-btn p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'view-mode-btn--active' : ''}`}
              title={canHover ? t('media.viewGrid') : undefined}
              aria-label={t('media.viewGrid')}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('horizontal')}
              className={`view-mode-btn p-2 rounded-lg transition-colors ${viewMode === 'horizontal' ? 'view-mode-btn--active' : ''}`}
              title={canHover ? t('media.viewHorizontal') : undefined}
              aria-label={t('media.viewHorizontal')}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`view-mode-btn p-2 rounded-lg transition-colors ${viewMode === 'detailed' ? 'view-mode-btn--active' : ''}`}
              title={canHover ? t('media.viewDetailed') : undefined}
              aria-label={t('media.viewDetailed')}
            >
              <LayoutList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 min-[1920px]:grid-cols-6 gap-4">
            {Array.from({ length: MEDIA_GRID_PAGE_SIZE }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-gray-200 rounded-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center py-12 text-gray-400">{t('common.noResults')}</p>
        ) : viewMode === 'grid' ? (
          <MediaGrid
            items={items}
            type={type}
            loading={false}
            listStatusByMediaId={listStatusByMediaId}
            rankOffset={showRatingRank ? ratingRankOffset : undefined}
            onOpenListEditor={user ? (media) => setMediaForListModal(media) : undefined}
            onQuickStatus={user ? handleQuickStatus : undefined}
          />
        ) : viewMode === 'horizontal' ? (
          <motion.ul className="space-y-3" variants={staggerContainerVariants} initial="hidden" animate="visible">
            {items.map((item, index) => (
              <motion.li key={item.id} variants={staggerItemVariants}>
                <MediaCardHorizontal
                  media={item}
                  type={type}
                  listStatus={listStatusByMediaId?.[item.id] ?? item.listStatus}
                  rankNumber={showRatingRank ? ratingRankOffset + index + 1 : undefined}
                />
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {items.map((item, index) => (
              <motion.div key={item.id} variants={staggerItemVariants}>
                <MediaCardDetailed
                  media={item}
                  type={type}
                  listStatus={listStatusByMediaId?.[item.id] ?? item.listStatus}
                  rankNumber={showRatingRank ? ratingRankOffset + index + 1 : undefined}
                  onOpenListEditor={
                    user
                      ? (e) => {
                          e.preventDefault()
                          setMediaForListModal(item)
                        }
                      : undefined
                  }
                  onQuickStatus={
                    user
                      ? (e, status) => {
                          e.preventDefault()
                          handleQuickStatus(item, status)
                        }
                      : undefined
                  }
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && (total > 0 || totalPages > 1) && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-2" aria-label={t('common.pagination')}>
              <button
                type="button"
                disabled={(filters.page ?? 1) <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
                className="media-pagination-button"
                aria-label={t('common.pagePrev')}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {getPaginationPages(filters.page ?? 1, totalPages).map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e-${i}`} className="media-pagination-ellipsis" aria-hidden>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    className={`media-pagination-button ${p === (filters.page ?? 1) ? 'media-pagination-button--active' : ''}`}
                    aria-label={t('common.pageOfTotal', { page: p, total: totalPages })}
                    aria-current={p === (filters.page ?? 1) ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                disabled={(filters.page ?? 1) >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
                className="media-pagination-button"
                aria-label={t('common.pageNext')}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
            <p className="media-pagination-summary text-sm">
              {t('common.pageOfTotal', { page: filters.page ?? 1, total: totalPages })}
              {total > 0 && (
                <>
                  {' '}
                  · <AnimatedNumber value={total} /> {t('media.paginationItems')}
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* На мобильном: кнопка фильтров справа по центру */}
      {filtersMeta && (
        <>
          <button
            type="button"
            onClick={() => setFiltersDrawerOpen(true)}
            className="media-list-filter-fab lg:hidden fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
            aria-label={t('media.filters')}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          {/* Выдвижная панель фильтров (мобильный) */}
          {filtersDrawerOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/40 z-40"
                onClick={() => setFiltersDrawerOpen(false)}
                aria-hidden
              />
              <aside
                className="media-list-filter-drawer lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-xl z-50 flex flex-col overflow-hidden"
                aria-modal
                aria-label={t('media.filters')}
              >
                <div className="media-list-filter-drawer-header flex items-center justify-between p-4 border-b">
                  <h2 className="media-list-filter-title text-lg font-semibold">{t('media.filters')}</h2>
                  <button
                    type="button"
                    onClick={() => setFiltersDrawerOpen(false)}
                    className="media-list-filter-close p-2 rounded-lg"
                    aria-label={t('common.close')}
                  >
                    <IconCross className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <MediaListFilters
                    genres={filtersMeta.genres ?? []}
                    themes={filtersMeta.themes ?? []}
                    showHeader={false}
                    showStudioFilter={TYPES_WITH_STUDIO_FILTER.includes(type)}
                    showPublisherFilter={TYPES_WITH_PUBLISHER_FILTER.includes(type)}
                    showDeveloperFilter={TYPES_WITH_DEVELOPER_FILTER.includes(type)}
                    showSeasonFilter={type === 'anime'}
                    countries={filtersMeta.countries ?? []}
                    sortOptions={filtersMeta.sortOptions ?? []}
                    filters={filtersDraft}
                    onFiltersChange={onFiltersChange}
                    onApply={() => {
                      setFilters({ ...filtersDraft, page: 1 })
                      setFiltersDrawerOpen(false)
                    }}
                    onReset={() => {
                      const reset = { ...defaultListParams, page: 1 }
                      setFiltersDraft(reset)
                      setFilters(reset)
                    }}
                  />
                </div>
              </aside>
            </>
          )}

          {/* Десктоп: боковая панель справа */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0 order-2 lg:order-2">
            <div className="lg:sticky lg:top-4">
              <MediaListFilters
                genres={filtersMeta.genres ?? []}
                themes={filtersMeta.themes ?? []}
                showStudioFilter={TYPES_WITH_STUDIO_FILTER.includes(type)}
                showPublisherFilter={TYPES_WITH_PUBLISHER_FILTER.includes(type)}
                showDeveloperFilter={TYPES_WITH_DEVELOPER_FILTER.includes(type)}
                showSeasonFilter={type === 'anime'}
                countries={filtersMeta.countries ?? []}
                sortOptions={filtersMeta.sortOptions ?? []}
                filters={filtersDraft}
                onFiltersChange={onFiltersChange}
                onApply={() => setFilters({ ...filtersDraft, page: 1 })}
                onReset={() => {
                  const reset = { ...defaultListParams, page: 1 }
                  setFiltersDraft(reset)
                  setFilters(reset)
                }}
              />
            </div>
          </aside>
        </>
      )}

      {mediaForListModal && listItemForModal && (
        <EditInListModal
          isOpen={!!mediaForListModal && !!listItemForModal}
          onClose={() => setMediaForListModal(null)}
          listItem={listItemForModal}
          media={mediaForListModal}
          type={type}
          listName={t(TYPE_LABEL[type])}
          onSave={async (data) => {
            if (!mediaForListModal || !listEntityType) return
            await updateInList(listEntityType, mediaForListModal.id, data)
            const mediaTitle = getMediaTitle(mediaForListModal, locale) || mediaForListModal.title
            const isRatingOnly = Object.keys(data).length === 1 && 'rating' in data
            const statusLabel = data.status != null ? getListStatusLabel(t, listEntityType, data.status) : null
            useToastStore.getState().show({
              title: isRatingOnly ? t('toast.ratingUpdated') : t('toast.listUpdated'),
              description: statusLabel
                ? `${mediaTitle} · ${statusLabel}`
                : `${mediaTitle} · ${isRatingOnly ? t('toast.ratingUpdatedDescription') : t('toast.listUpdatedDescription')}`,
            })
            setMediaForListModal(null)
          }}
          onRemove={async () => {
            if (!mediaForListModal || !listEntityType) return
            await removeFromList(listEntityType, mediaForListModal.id)
            useToastStore.getState().show({
              title: t('toast.removedFromList'),
              description: getMediaTitle(mediaForListModal, locale) || mediaForListModal.title,
            })
            setMediaForListModal(null)
          }}
        />
      )}

      {mediaForListModal && !listItemForModal && (
        <AddToListModal
          isOpen={!!mediaForListModal}
          onClose={() => setMediaForListModal(null)}
          onSubmit={async (status, comment, currentEpisode) => {
            if (!mediaForListModal || !listEntityType) return
            await addToList(listEntityType, mediaForListModal.id, status, comment, currentEpisode)
            const mediaTitle = getMediaTitle(mediaForListModal, locale) || mediaForListModal.title
            const statusLabel = getListStatusLabel(t, listEntityType, status)
            useToastStore.getState().show({
              title: t('toast.addedToList'),
              description: `${mediaTitle} · ${statusLabel}`,
            })
            setMediaForListModal(null)
          }}
          title={getMediaTitle(mediaForListModal, locale) || mediaForListModal.title}
          listType={listEntityType}
          type={type}
          episodesCount={
            'episodesCount' in mediaForListModal && typeof mediaForListModal.episodesCount === 'number'
              ? mediaForListModal.episodesCount
              : undefined
          }
        />
      )}
    </div>
  )
}
