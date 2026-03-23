import { type ActivityItem, activityApi } from '@/api/activity'
import { IconCollection, IconFavorite, IconTypeBook, IconTypeCartoon, IconTypeMovie } from '@/components/icons'
import type { IconProps } from '@/components/icons'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getMediaAssetUrl, getMediaPathFromApiType } from '@/utils/mediaPaths'
import { ListPlus, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

const MEDIA_TYPE_TO_LIST_TYPE: Record<string, string> = {
  movies: 'movie',
  anime: 'anime',
  games: 'game',
  'tv-series': 'tv-series',
  manga: 'manga',
  books: 'book',
  'light-novels': 'light-novel',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

function getActivityTypeLabel(t: (key: string) => string, type: string): string {
  switch (type) {
    case 'list_add':
      return t('activity.typeListAdd')
    case 'list_update':
      return t('activity.typeListUpdate')
    case 'favorite_add':
      return t('activity.typeFavoriteAdd')
    case 'collection_add':
      return t('activity.typeCollectionAdd')
    case 'review':
      return t('activity.typeReview')
    default:
      return type
  }
}

function getActivityTypeIcon(type: string): React.ComponentType<IconProps> {
  switch (type) {
    case 'list_add':
      return ListPlus as React.ComponentType<IconProps>
    case 'list_update':
      return ListPlus as React.ComponentType<IconProps>
    case 'favorite_add':
      return IconFavorite
    case 'collection_add':
      return IconCollection
    case 'review':
      return Pencil as React.ComponentType<IconProps>
    default:
      return ListPlus as React.ComponentType<IconProps>
  }
}

/** Краткая фраза статуса как в профиле (для карточки). */
function getStatusPhrase(t: (key: string, opts?: Record<string, unknown>) => string, item: ActivityItem): string {
  const extra = item.extra as
    | { status?: string; toStatus?: string; fromEpisode?: number; toEpisode?: number; totalEpisodes?: number }
    | undefined
  const listType = MEDIA_TYPE_TO_LIST_TYPE[item.mediaType] || item.mediaType
  if (item.type === 'list_add' && extra?.status) return getListStatusLabel(t, listType, extra.status)
  if (
    item.type === 'list_update' &&
    extra?.fromEpisode != null &&
    extra?.toEpisode != null &&
    extra.fromEpisode !== extra.toEpisode
  ) {
    const count = extra.toEpisode - extra.fromEpisode + 1
    const total = extra.totalEpisodes
    return total != null
      ? t('activity.episodesWatchedFromTo', { count, from: extra.fromEpisode, to: extra.toEpisode, total })
      : t('activity.episodesWatchedFromToNoTotal', { count, from: extra.fromEpisode, to: extra.toEpisode })
  }
  if (item.type === 'list_update' && extra?.toEpisode != null) {
    const total = extra.totalEpisodes
    return total != null
      ? t('activity.episodeWatchedOfTotal', { episode: extra.toEpisode, total })
      : t('activity.episodeWatched', { episode: extra.toEpisode })
  }
  if (item.type === 'list_update' && extra?.toStatus) return getListStatusLabel(t, listType, extra.toStatus)
  if (item.type === 'favorite_add') return t('activity.typeFavoriteAdd')
  if (item.type === 'review') return t('activity.typeReview')
  if (item.type === 'collection_add') return t('activity.typeCollectionAdd')
  return getActivityTypeLabel(t, item.type)
}

export default function Activity() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'me' // 'me' | 'feed'
  const [list, setList] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (mode === 'feed') {
      activityApi
        .getFeed({ limit: 50 })
        .then(setList)
        .catch(() => setList([]))
        .finally(() => setLoading(false))
    } else {
      activityApi
        .getMyActivity({ limit: 50 })
        .then(setList)
        .catch(() => setList([]))
        .finally(() => setLoading(false))
    }
  }, [mode])

  const isOwn = mode === 'me'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-xl bg-theme-surface p-1 border border-theme shadow">
          <Link
            to="/activity?mode=me"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'me' ? 'bg-theme-primary text-[var(--theme-nav-text-hover)] shadow' : 'text-theme-muted hover:bg-theme-bg-alt hover:text-theme'}`}
          >
            {t('activity.myActivity')}
          </Link>
          <Link
            to="/activity?mode=feed"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'feed' ? 'bg-theme-primary text-[var(--theme-nav-text-hover)] shadow' : 'text-theme-muted hover:bg-theme-bg-alt hover:text-theme'}`}
          >
            {t('activity.friendsFeed')}
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-theme-muted">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="text-theme-muted">{mode === 'feed' ? t('activity.emptyFeed') : t('activity.emptyMy')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((item) => {
            const mediaHref = getMediaPathFromApiType(item.mediaType, item.mediaId)
            const badgeLabel = getActivityTypeLabel(t, item.type)
            const ActionIcon = getActivityTypeIcon(item.type)
            const listType = MEDIA_TYPE_TO_LIST_TYPE[item.mediaType] || item.mediaType
            const extra = item.extra as Record<string, unknown> | undefined
            const hasEpisodeRange = extra && 'fromEpisode' in extra && 'toEpisode' in extra
            const episodeRangePhrase =
              item.type === 'list_update' &&
              hasEpisodeRange &&
              extra &&
              Number(extra.fromEpisode) !== Number(extra.toEpisode)
                ? getStatusPhrase(t, item)
                : null
            return (
              <li
                key={item.id}
                className="p-3 sm:p-4 rounded-xl bg-theme-surface border border-theme shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-3 sm:gap-4">
                  <Link
                    to={mediaHref}
                    className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-36 rounded-lg overflow-hidden bg-theme-bg-alt"
                    style={
                      item.mediaPoster
                        ? {
                            backgroundImage: `url(${getMediaAssetUrl(item.mediaPoster)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    {!item.mediaPoster && (
                      <span className="w-full h-full flex items-center justify-center text-theme-muted text-xs">—</span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-theme-bg-alt text-theme text-xs font-medium">
                        <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                        {badgeLabel}
                      </span>
                    </div>
                    {item.mediaTitle && (
                      <Link
                        to={mediaHref}
                        className="text-theme font-medium break-words line-clamp-2 hover:text-[var(--theme-primary)] transition-colors"
                      >
                        {item.mediaTitle}
                      </Link>
                    )}
                    {item.type === 'collection_add' && item.extra?.collectionName && (
                      <p className="text-sm text-theme-muted mt-1">
                        <Link
                          to={item.extra.collectionId != null ? `/collections/${Number(item.extra.collectionId)}` : '#'}
                          className="link-underline-animate text-theme hover:text-[var(--theme-primary)] transition-colors"
                        >
                          {String(item.extra.collectionName)}
                        </Link>
                      </p>
                    )}
                    {!isOwn && item.user && (
                      <p className="text-xs text-theme-muted mt-1">{item.user.name || item.user.username}</p>
                    )}
                    {(episodeRangePhrase || (item.extra && Object.keys(item.extra).length > 0)) && (
                      <div className="text-sm text-theme-muted mt-2 space-y-0.5">
                        {episodeRangePhrase && <p className="block">{episodeRangePhrase}</p>}
                        {item.extra && 'fromStatus' in item.extra && 'toStatus' in item.extra && (
                          <p className="block">
                            {t('activity.statusChange', {
                              from: getListStatusLabel(t, listType, String(item.extra.fromStatus)),
                              to: getListStatusLabel(t, listType, String(item.extra.toStatus)),
                            })}
                          </p>
                        )}
                        {item.extra &&
                          !hasEpisodeRange &&
                          'currentEpisode' in item.extra &&
                          item.extra.currentEpisode != null && (
                            <p className="block">
                              {t('activity.detailEpisode')}: {Number(item.extra.currentEpisode)}
                            </p>
                          )}
                        {'fromPage' in item.extra && 'toPage' in item.extra ? (
                          <p className="block">
                            {t('activity.pageFromTo', {
                              from: Number(item.extra.fromPage),
                              to: Number(item.extra.toPage),
                            })}
                          </p>
                        ) : (
                          'currentPage' in item.extra &&
                          item.extra.currentPage != null && (
                            <p className="block">
                              {t('activity.detailPage')}: {Number(item.extra.currentPage)}
                              {'maxPages' in item.extra && item.extra.maxPages != null
                                ? ` / ${Number(item.extra.maxPages)}`
                                : ''}
                            </p>
                          )
                        )}
                        {'fromVolume' in item.extra && 'toVolume' in item.extra ? (
                          <p className="block">
                            {t('activity.volumeFromTo', {
                              from: Number(item.extra.fromVolume),
                              to: Number(item.extra.toVolume),
                            })}
                          </p>
                        ) : (
                          'currentVolume' in item.extra &&
                          item.extra.currentVolume != null && (
                            <p className="block">
                              {t('activity.detailVolume')}: {Number(item.extra.currentVolume)}
                            </p>
                          )
                        )}
                        {'fromChapter' in item.extra && 'toChapter' in item.extra ? (
                          <p className="block">
                            {t('activity.chapterFromTo', {
                              from: Number(item.extra.fromChapter),
                              to: Number(item.extra.toChapter),
                            })}
                          </p>
                        ) : (
                          'currentChapter' in item.extra &&
                          item.extra.currentChapter != null && (
                            <p className="block">
                              {t('activity.detailChapter')}: {Number(item.extra.currentChapter)}
                            </p>
                          )
                        )}
                        {'fromVolumeNumber' in item.extra && 'toVolumeNumber' in item.extra ? (
                          <p className="block">
                            {t('activity.volumeFromTo', {
                              from: Number(item.extra.fromVolumeNumber),
                              to: Number(item.extra.toVolumeNumber),
                            })}
                          </p>
                        ) : (
                          'currentVolumeNumber' in item.extra &&
                          item.extra.currentVolumeNumber != null && (
                            <p className="block">
                              {t('activity.detailVolume')}: {Number(item.extra.currentVolumeNumber)}
                            </p>
                          )
                        )}
                        {'fromChapterNumber' in item.extra && 'toChapterNumber' in item.extra ? (
                          <p className="block">
                            {t('activity.chapterFromTo', {
                              from: Number(item.extra.fromChapterNumber),
                              to: Number(item.extra.toChapterNumber),
                            })}
                          </p>
                        ) : (
                          'currentChapterNumber' in item.extra &&
                          item.extra.currentChapterNumber != null && (
                            <p className="block">
                              {t('activity.detailChapter')}: {Number(item.extra.currentChapterNumber)}
                            </p>
                          )
                        )}
                        {'fromRating' in item.extra && 'toRating' in item.extra ? (
                          <p className="block">
                            {t('activity.ratingFromTo', {
                              from: Number(item.extra.fromRating),
                              to: Number(item.extra.toRating),
                            })}
                          </p>
                        ) : (
                          'rating' in item.extra &&
                          item.extra.rating != null && (
                            <p className="block">{t('activity.ratingSet', { rating: Number(item.extra.rating) })}</p>
                          )
                        )}
                        {'fromHoursPlayed' in item.extra && 'toHoursPlayed' in item.extra ? (
                          <p className="block">
                            {t('activity.hoursFromTo', {
                              from: Number(item.extra.fromHoursPlayed),
                              to: Number(item.extra.toHoursPlayed),
                            })}
                          </p>
                        ) : (
                          'hoursPlayed' in item.extra &&
                          item.extra.hoursPlayed != null && (
                            <p className="block">
                              {t('activity.detailHours')}: {Number(item.extra.hoursPlayed)} ч
                            </p>
                          )
                        )}
                      </div>
                    )}
                    <time
                      className="text-xs text-theme-muted mt-auto pt-2 shrink-0"
                      dateTime={item.createdAt}
                      title={new Date(item.createdAt).toLocaleString()}
                    >
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
