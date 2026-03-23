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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getListItemProgressText } from './listItemProgress'

interface ListItemCompactProps {
  item: ListItem
  listType: ListEntityType
  mediaType: MediaTypeForPath
  isOwnProfile: boolean
  isMobile: boolean
  onEdit: (item: ListItem) => void
  onRemove: (entityId: number) => void
}

export default function ListItemCompact({
  item,
  listType,
  mediaType,
  isOwnProfile,
  isMobile,
  onEdit,
  onRemove,
}: ListItemCompactProps) {
  const { t } = useTranslation()
  const [tapped, setTapped] = useState(false)
  const media = getMediaFromItem(item, listType)
  if (!media) return null

  const linkPath = getMediaPath(mediaType, media.id, getMediaTitle(media) || media.title)
  const status = item.status as ListStatus
  const StatusIcon = status ? getListStatusIcon(status, mediaType) : null
  const badgeClasses = status ? getListStatusBadgeClasses(status, mediaType) : null
  const isFilmType = listType === 'movies' || listType === 'cartoon-movies' || listType === 'anime-movies'
  const isGameType = listType === 'games'
  const isBookType = listType === 'books' || listType === 'manga' || listType === 'light-novels'
  const rewatchLabel = isGameType
    ? t('lists.playthroughs')
    : isBookType
      ? t('lists.rereadSessions')
      : t('lists.rewatchSessions')
  const watchedAt = item.completedAt ?? item.startedAt
  const progressText = getListItemProgressText(item, listType, t)
  const ratingDisplay =
    item.rating != null && item.rating > 0
      ? item.rating <= 10
        ? Math.min(100, Math.max(1, Math.round(Number(item.rating) * 10)))
        : Math.min(100, Math.max(1, Math.round(Number(item.rating))))
      : null
  return (
    <div
      className="group relative profile-list-item rounded-xl border border-lavender-400/50 shadow-md transition-shadow flex items-center overflow-visible"
      onMouseEnter={() => !isMobile && setTapped(true)}
      onMouseLeave={() => !isMobile && setTapped(false)}
      onClick={() => {
        if (!isMobile) return
        setTapped((prev) => (prev ? prev : true))
      }}
    >
      <div
        className={[
          'absolute inset-0 rounded-xl pointer-events-none z-0 transition-opacity',
          isMobile ? (tapped ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100',
          'bg-space_indigo-500/15',
        ].join(' ')}
      />

      {!isMobile && (
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-x-[105%] -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="w-28 h-40 rounded-lg overflow-hidden shadow-xl bg-[var(--theme-bg-alt)]">
            {media.poster ? (
              <img src={getMediaAssetUrl(media.poster)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[var(--theme-text-muted)] text-xs flex items-center justify-center h-full w-full">
                —
              </span>
            )}
          </div>
        </div>
      )}
      <div className="relative z-10 flex-1 min-w-0 py-3 px-4 flex items-center gap-3">
        <Link to={linkPath} className={`flex-1 min-w-0 ${isMobile && !tapped ? 'pointer-events-none' : ''}`}>
          <span className="title-hover-theme font-medium block truncate">{getMediaTitle(media) || media.title}</span>
          <div className="flex flex-wrap items-center gap-2 mt-1 w-full">
            {status && StatusIcon && badgeClasses && (
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${badgeClasses.bg} ${badgeClasses.text}`}
                title={getListStatusLabel(t, listType, status)}
              >
                <StatusIcon size={10} className="shrink-0" />
                {getListStatusLabel(t, listType, item.status)}
              </span>
            )}
            {ratingDisplay != null && (
              <div className="rating-badge media-card-inline-rating bg-space_indigo-600 backdrop-blur-sm inline-flex items-center gap-1.5">
                {item.titleReaction && (
                  <span className="inline-flex items-center" title={t(`media.reaction.${item.titleReaction}`)}>
                    <TitleReactionDisplay reaction={item.titleReaction} size={14} className="text-lavender-500" />
                  </span>
                )}
                <span className="rating-badge-value text-lavender-500">{ratingDisplay}</span>
              </div>
            )}

            {!ratingDisplay && item.titleReaction && (
              <span className="text-sm" title={t(`media.reaction.${item.titleReaction}`)}>
                <TitleReactionDisplay reaction={item.titleReaction} size={14} />
              </span>
            )}
            {progressText && <span className="text-xs text-[var(--theme-text-muted)] truncate">{progressText}</span>}

            {isFilmType ? (
              watchedAt ? (
                <span className="text-xs text-[var(--theme-text-muted)] truncate">
                  {t('lists.watchedAt')}: {formatListDate(watchedAt)}
                </span>
              ) : null
            ) : (
              <>
                {item.startedAt && (
                  <span className="text-xs text-[var(--theme-text-muted)] truncate">
                    {t('lists.startedAt')}: {formatListDate(item.startedAt)}
                  </span>
                )}
                {item.completedAt && (
                  <span className="text-xs text-[var(--theme-text-muted)] truncate">
                    {t('lists.completedAt')}: {formatListDate(item.completedAt)}
                  </span>
                )}
              </>
            )}

            {item.rewatchSessions?.length ? (
              <span className="text-xs text-[var(--theme-text-muted)] truncate inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-space_indigo-500/10 border border-lavender-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-lavender-500 shrink-0" />
                {rewatchLabel}: {item.rewatchSessions.length}
              </span>
            ) : null}
          </div>
        </Link>

        {isOwnProfile && (
          <div className="flex items-center gap-1 shrink-0">
            {!isMobile && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onEdit(item)
                  }}
                  className="btn-edit list-item-action list-item-action--edit p-2 rounded-lg"
                  title={t('media.editListEntry')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    onRemove(media.id)
                  }}
                  className="list-item-action list-item-action--delete p-2 rounded-lg text-gray-800 bg-[#ffe9f0] hover:bg-soft_blush-300"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {isMobile && !tapped && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setTapped(true)
                }}
                className="p-2 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
                aria-label={t('media.editListEntry')}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {isMobile && tapped && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onEdit(item)
                  }}
                  className="btn-edit list-item-action list-item-action--edit p-2 rounded-lg"
                  title={t('media.editListEntry')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    onRemove(media.id)
                  }}
                  className="list-item-action list-item-action--delete p-2 rounded-lg"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setTapped(false)
                  }}
                  className="p-2 rounded-lg text-[var(--theme-text-muted)] text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
