import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useListStore } from '@/store/listStore'
import { ListStatus, ListItem } from '@/types'
import TitleReactionDisplay from '@/components/TitleReactionDisplay'
import { ListEntityType } from '@/api/lists'
import { Trash2, Pencil, SlidersHorizontal } from 'lucide-react'
import { IconCross, getListStatusIcon, getListStatusBadgeClasses } from '@/components/icons'
import { getMediaAssetUrl, getMediaPath, MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaTitle } from '@/utils/localizedText'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { formatListDate } from '@/utils/formatListDate'
import { mediaApi } from '@/api/media'
import EditInListModal from '@/components/EditInListModal'
import { Media } from '@/types'

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

/** Берём медиа из элемента списка по типу списка, чтобы во вкладке «Игры» не показывать фильмы и т.д. */
function getMediaFromItem(
  item: ListItem,
  listType: ListEntityType
): { id: number; title: string; poster?: string } | null {
  const keyMap: Record<ListEntityType, keyof ListItem> = {
    movies: 'movie',
    anime: 'animeSeries',
    games: 'game',
    'tv-series': 'tvSeries',
    manga: 'manga',
    books: 'book',
    'light-novels': 'lightNovel',
    'cartoon-series': 'cartoonSeries',
    'cartoon-movies': 'cartoonMovie',
    'anime-movies': 'animeMovie',
  }
  const key = keyMap[listType]
  const m = key ? (item[key] as { id: number; title: string; poster?: string } | undefined) : null
  return m && typeof m === 'object' && m.id ? m : null
}

export default function MyLists() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo((): ListEntityType => {
    const type = searchParams.get('type')
    return type && VALID_LIST_TYPES.has(type as ListEntityType) ? (type as ListEntityType) : 'movies'
  }, [searchParams])

  const statusFilter = useMemo((): ListStatus | 'all' => {
    const status = searchParams.get('status')
    return status && VALID_STATUSES.has(status as ListStatus | 'all') ? (status as ListStatus | 'all') : 'all'
  }, [searchParams])

  const setActiveTab = (key: ListEntityType) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('type', key)
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

  const { getList, fetchList, updateInList, removeFromList, isLoading } = useListStore()
  const tabConfig = LIST_TABS.find((x) => x.key === activeTab) ?? LIST_TABS[0]

  useEffect(() => {
    LIST_TABS.forEach(({ key }) => fetchList(key))
  }, [fetchList])

  const currentList = getList(activeTab)
  const filteredList = statusFilter === 'all' ? currentList : currentList.filter((item) => item.status === statusFilter)

  const handleRemove = async (entityId: number) => {
    await removeFromList(activeTab, entityId)
  }

  const handleEditClick = (item: ListItem) => {
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
    if (!editingItem) return
    const media = getMediaFromItem(editingItem, activeTab)
    if (!media) return
    await updateInList(activeTab, media.id, data)
    setEditingItem(null)
    setEditingMedia(null)
  }

  const handleEditRemove = async () => {
    if (!editingItem) return
    const media = getMediaFromItem(editingItem, activeTab)
    if (!media) return
    await removeFromList(activeTab, media.id)
    setEditingItem(null)
    setEditingMedia(null)
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 order-2 lg:order-1">
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
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-400">{t('common.noResults')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredList.map((item) => {
                const media = getMediaFromItem(item, activeTab)
                if (!media) return null
                const linkPath = getMediaPath(tabConfig.mediaType, media.id, getMediaTitle(media) || media.title)

                const status = item.status as ListStatus
                const StatusIcon = status ? getListStatusIcon(status, tabConfig.mediaType) : null
                const badgeClasses = status ? getListStatusBadgeClasses(status, tabConfig.mediaType) : null
                const isFilmType = activeTab === 'movies' || activeTab === 'cartoon-movies' || activeTab === 'anime-movies'
                const watchedAt = item.completedAt ?? item.startedAt

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-lavender-800 border border-lavender-400/50 shadow-md hover:shadow-lg transition-shadow flex gap-4 items-center"
                  >
                    <Link to={linkPath} className="flex-shrink-0 relative">
                      {media.poster ? (
                        <img
                          src={getMediaAssetUrl(media.poster)}
                          alt={media.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">—</span>
                        </div>
                      )}
                      {StatusIcon && badgeClasses && (
                        <div
                          className={`absolute top-0.5 left-0.5 z-10 w-6 h-6 rounded-md flex items-center justify-center shadow ${badgeClasses.bg} ${badgeClasses.text}`}
                          title={getListStatusLabel(t, activeTab, status)}
                        >
                          <StatusIcon size={12} className="shrink-0" />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={linkPath} className="font-medium title-hover-theme transition-colors block">
                        {media.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {status && StatusIcon && badgeClasses && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${badgeClasses.bg} ${badgeClasses.text}`}
                            title={getListStatusLabel(t, activeTab, status)}
                          >
                            <StatusIcon size={12} className="shrink-0" />
                            {getListStatusLabel(t, activeTab, item.status)}
                          </span>
                        )}
                        {item.rating != null && (
                          <span className="text-xs text-gray-500">
                            {t('media.listRating')}: {item.rating}
                          </span>
                        )}
                        {item.titleReaction && (
                          <span className="text-lg" title={t(`media.reaction.${item.titleReaction}`)}>
                            <TitleReactionDisplay reaction={item.titleReaction} size={18} />
                          </span>
                        )}
                        {(item.currentEpisode != null ||
                          item.animeSeries?.episodesCount != null ||
                          item.tvSeries?.episodesCount != null ||
                          item.cartoonSeries?.episodesCount != null) && (
                          <span className="text-xs text-gray-500">
                            {t('media.currentEpisode')}: {item.currentEpisode ?? 0} /{' '}
                            {(item.animeSeries ?? item.tvSeries ?? item.cartoonSeries)?.episodesCount ?? '?'}
                          </span>
                        )}
                        {(item.currentPage != null || item.maxPages != null) &&
                          (item.currentPage !== undefined || item.maxPages !== undefined) && (
                            <span className="text-xs text-gray-500">
                              {t('media.currentPage')}: {item.currentPage ?? 0} /{' '}
                              {item.maxPages ?? item.book?.pages ?? '?'}
                            </span>
                          )}
                        {(item.currentVolume != null || item.currentChapter != null) &&
                          (item.currentVolume !== undefined || item.currentChapter !== undefined) && (
                            <span className="text-xs text-gray-500">
                              {t('media.currentVolume')} {item.currentVolume ?? 0} · {t('media.currentChapter')}{' '}
                              {item.currentChapter ?? 0}
                            </span>
                          )}
                        {item.totalTime != null && item.totalTime > 0 && (
                          <span className="text-xs text-gray-500">
                            {t('media.hoursPlayed')}: {(item.totalTime / 60).toFixed(1)}
                          </span>
                        )}
                        {(item.currentVolumeNumber != null || item.currentChapterNumber != null) &&
                          (item.currentVolumeNumber !== undefined || item.currentChapterNumber !== undefined) && (
                            <span className="text-xs text-gray-500">
                              {t('media.volume')} {item.currentVolumeNumber ?? 0} · {t('media.chapter')}{' '}
                              {item.currentChapterNumber ?? 0}
                            </span>
                          )}
                        {isFilmType ? (
                          watchedAt ? (
                            <span className="text-xs text-gray-500">
                              {t('lists.watchedAt')}: {formatListDate(watchedAt)}
                            </span>
                          ) : null
                        ) : (
                          <>
                            {item.startedAt && (
                              <span className="text-xs text-gray-500">
                                {t('lists.startedAt')}: {formatListDate(item.startedAt)}
                              </span>
                            )}
                            {item.completedAt && (
                              <span className="text-xs text-gray-500">
                                {t('lists.completedAt')}: {formatListDate(item.completedAt)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {item.comment && <p className="text-sm text-gray-600 mt-2 truncate">{item.comment}</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-lavender-500 transition-colors"
                        title={t('media.editListEntry')}
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemove(media.id)}
                        className="p-2 rounded-lg text-gray-600 hover:text-soft_blush-400 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Мобильный: кнопка открытия меню выбора типа и статуса */}
        <button
          type="button"
          onClick={() => setListsDrawerOpen(true)}
          className="lg:hidden fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-space_indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-space_indigo-700 transition-colors"
          aria-label={t('lists.listType')}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Мобильный: выдвижная панель типа медиа и статуса */}
        {listsDrawerOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setListsDrawerOpen(false)}
              aria-hidden
            />
            <aside
              className="lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 flex flex-col overflow-hidden"
              aria-modal
              aria-label={t('lists.listType')}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">{t('lists.listType')}</h2>
                <button
                  type="button"
                  onClick={() => setListsDrawerOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={t('common.close')}
                >
                  <IconCross className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('lists.listType')}
                  </p>
                  <div className="flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
                    {LIST_TABS.map(({ key, labelKey }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                          activeTab === key
                            ? 'bg-space_indigo-600 text-white shadow'
                            : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                        }`}
                      >
                        {labelKey.startsWith('nav.') ? t(labelKey) : labelKey}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('lists.statusFilter')}
                  </p>
                  <div className="flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
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
                        onClick={() => {
                          setStatusFilter(value)
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                          statusFilter === value
                            ? 'bg-space_indigo-600 text-white shadow'
                            : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Десктоп: боковая панель справа */}
        <aside className="hidden lg:flex flex-col gap-4 shrink-0 lg:w-52 order-1 lg:order-2">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('lists.listType')}</p>
            <div className="flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
              {LIST_TABS.map(({ key, labelKey }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeTab === key
                      ? 'bg-space_indigo-600 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                  }`}
                >
                  {labelKey.startsWith('nav.') ? t(labelKey) : labelKey}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('lists.statusFilter')}</p>
            <div className="flex flex-col rounded-xl bg-slate-200 p-1 border border-slate-300 shadow gap-1">
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    statusFilter === value
                      ? 'bg-space_indigo-600 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
    </div>
  )
}
