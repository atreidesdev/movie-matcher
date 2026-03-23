import type { ListEntityType } from '@/api/lists'
import TitleReactionDisplay from '@/components/TitleReactionDisplay'
import { getListStatusBadgeClasses, getListStatusIcon } from '@/components/icons'
import type { ListItem, ListStatus } from '@/types'
import { formatListDate } from '@/utils/formatListDate'
import { getMediaFromItem } from '@/utils/listItemMedia'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getMediaTitle } from '@/utils/localizedText'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaAssetUrl, getMediaPath } from '@/utils/mediaPaths'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

interface ListItemDetailedProps {
  item: ListItem
  listType: ListEntityType
  mediaType: MediaTypeForPath
  isOwnProfile: boolean
  onEdit: (item: ListItem) => void
  onRemove: (entityId: number) => void
}

export default function ListItemDetailed({
  item,
  listType,
  mediaType,
  isOwnProfile,
  onEdit,
  onRemove,
}: ListItemDetailedProps) {
  const { t } = useTranslation()
  const media = getMediaFromItem(item, listType)
  if (!media) return null

  const linkPath = getMediaPath(mediaType, media.id, getMediaTitle(media) || media.title)
  const status = item.status as ListStatus
  const StatusIcon = status ? getListStatusIcon(status, mediaType) : null
  const badgeClasses = status ? getListStatusBadgeClasses(status, mediaType) : null
  const isGameType = listType === 'games'
  const isBookType = listType === 'books' || listType === 'manga' || listType === 'light-novels'
  const rewatchLabel = isGameType
    ? t('lists.playthroughs')
    : isBookType
      ? t('lists.rereadSessions')
      : t('lists.rewatchSessions')
  const isFilmType = listType === 'movies' || listType === 'cartoon-movies' || listType === 'anime-movies'
  const watchedAt = item.completedAt ?? item.startedAt

  return (
    <div className="profile-list-item p-4 rounded-xl bg-lavender-800 border border-lavender-400/50 shadow-md hover:shadow-lg transition-shadow flex gap-4 items-center">
      <Link to={linkPath} className="flex-shrink-0 relative">
        {media.poster ? (
          <img src={getMediaAssetUrl(media.poster)} alt={media.title} className="w-16 h-24 object-cover rounded" />
        ) : (
          <div className="w-16 h-24 bg-[var(--theme-bg-alt)] rounded flex items-center justify-center">
            <span className="text-[var(--theme-text-muted)] text-xs">—</span>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={linkPath} className="title-hover-theme font-medium transition-colors block">
          {getMediaTitle(media) || media.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {status && StatusIcon && badgeClasses && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${badgeClasses.bg} ${badgeClasses.text}`}
              title={getListStatusLabel(t, listType, status)}
            >
              <StatusIcon size={12} className="shrink-0" />
              {getListStatusLabel(t, listType, item.status)}
            </span>
          )}
          {(item.rating != null || item.titleReaction) && (
            <span className="rating-badge inline-flex items-center gap-1 rounded-lg bg-space_indigo-600 backdrop-blur-sm px-2 py-1">
              {item.titleReaction && (
                <span className="text-sm leading-none" title={t(`media.reaction.${item.titleReaction}`)}>
                  <TitleReactionDisplay reaction={item.titleReaction} size={14} />
                </span>
              )}
              {item.rating != null && (
                <span className="rating-badge-value text-sm font-medium text-lavender-500">
                  {item.rating <= 10
                    ? Math.min(100, Math.max(1, Math.round(Number(item.rating) * 10)))
                    : Math.min(100, Math.max(1, Math.round(Number(item.rating))))}
                </span>
              )}
            </span>
          )}
          {(item.currentEpisode != null ||
            item.animeSeries?.episodesCount != null ||
            item.tvSeries?.episodesCount != null ||
            item.cartoonSeries?.episodesCount != null) && (
            <span className="text-xs text-[var(--theme-text-muted)]">
              {t('media.currentEpisode')}: {item.currentEpisode ?? 0} /{' '}
              {(item.animeSeries ?? item.tvSeries ?? item.cartoonSeries)?.episodesCount ?? '?'}
            </span>
          )}
          {(item.currentPage != null || item.maxPages != null) &&
            (item.currentPage !== undefined || item.maxPages !== undefined) && (
              <span className="text-xs text-[var(--theme-text-muted)]">
                {t('media.currentPage')}: {item.currentPage ?? 0} / {item.maxPages ?? item.book?.pages ?? '?'}
              </span>
            )}
          {(item.currentVolume != null || item.currentChapter != null) &&
            (item.currentVolume !== undefined || item.currentChapter !== undefined) && (
              <span className="text-xs text-[var(--theme-text-muted)]">
                {t('media.currentVolume')} {item.currentVolume ?? 0} · {t('media.currentChapter')}{' '}
                {item.currentChapter ?? 0}
              </span>
            )}
          {item.totalTime != null && item.totalTime > 0 && (
            <span className="text-xs text-[var(--theme-text-muted)]">
              {t('media.hoursPlayed')}: {(item.totalTime / 60).toFixed(1)}
            </span>
          )}
          {(item.currentVolumeNumber != null || item.currentChapterNumber != null) &&
            (item.currentVolumeNumber !== undefined || item.currentChapterNumber !== undefined) && (
              <span className="text-xs text-[var(--theme-text-muted)]">
                {t('media.volume')} {item.currentVolumeNumber ?? 0} · {t('media.chapter')}{' '}
                {item.currentChapterNumber ?? 0}
              </span>
            )}
          {isFilmType ? (
            watchedAt ? (
              <span className="text-xs text-[var(--theme-text-muted)]">
                {t('lists.watchedAt')}: {formatListDate(watchedAt)}
              </span>
            ) : null
          ) : (
            <>
              {item.startedAt && (
                <span className="text-xs text-[var(--theme-text-muted)]">
                  {t('lists.startedAt')}: {formatListDate(item.startedAt)}
                </span>
              )}
              {item.completedAt && (
                <span className="text-xs text-[var(--theme-text-muted)]">
                  {t('lists.completedAt')}: {formatListDate(item.completedAt)}
                </span>
              )}
            </>
          )}

          {item.rewatchSessions?.length ? (
            <span className="text-xs text-[var(--theme-text-muted)] inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-space_indigo-500/10 border border-lavender-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-lavender-500 shrink-0" />
              {rewatchLabel}: {item.rewatchSessions.length}
            </span>
          ) : null}
        </div>
        {item.comment && <p className="text-sm text-[var(--theme-text-muted)] mt-2 truncate">{item.comment}</p>}
      </div>

      {isOwnProfile && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="btn-edit list-item-action list-item-action--edit p-2 rounded-lg"
            title={t('media.editListEntry')}
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRemove(media.id)}
            className="list-item-action list-item-action--delete p-2 rounded-lg text-gray-800 bg-[#ffe9f0] hover:bg-soft_blush-300 hover:text-soft_blush-700 transition-colors"
            title={t('common.delete')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
