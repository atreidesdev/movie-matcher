import type { ListEntityType } from '@/api/lists'
import TitleReactionDisplay from '@/components/TitleReactionDisplay'
import { getListStatusBadgeClasses, getListStatusIcon } from '@/components/icons'
import { useIsMobile } from '@/hooks/useIsMobile'
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

interface ListItemCardProps {
  item: ListItem
  listType: ListEntityType
  mediaType: MediaTypeForPath
  isOwnProfile: boolean
  onEdit: (item: ListItem) => void
  onRemove: (entityId: number) => void
}

export default function ListItemCard({ item, listType, mediaType, isOwnProfile, onEdit, onRemove }: ListItemCardProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const media = getMediaFromItem(item, listType)
  if (!media) return null

  const linkPath = getMediaPath(mediaType, media.id, getMediaTitle(media) || media.title)
  const status = item.status as ListStatus
  const StatusIcon = status ? getListStatusIcon(status, mediaType) : null
  const badgeClasses = status ? getListStatusBadgeClasses(status, mediaType) : null
  const progressText = getListItemProgressText(item, listType, t)
  const [tapped, setTapped] = useState(false)
  const isFilmType = listType === 'movies' || listType === 'cartoon-movies' || listType === 'anime-movies'
  const isGameType = listType === 'games'
  const isBookType = listType === 'books' || listType === 'manga' || listType === 'light-novels'
  const rewatchLabel = isGameType
    ? t('lists.playthroughs')
    : isBookType
      ? t('lists.rereadSessions')
      : t('lists.rewatchSessions')
  const watchedAt = item.completedAt ?? item.startedAt
  const ratingDisplay =
    item.rating != null && item.rating > 0
      ? item.rating <= 10
        ? Math.round(item.rating * 10)
        : Math.round(item.rating)
      : null

  const rewatchCount = item.rewatchSessions?.length ?? 0
  const startedPart = item.startedAt ? `${t('lists.startedAt')}: ${formatListDate(item.startedAt)}` : null
  const completedPart = item.completedAt ? `${t('lists.completedAt')}: ${formatListDate(item.completedAt)}` : null
  const timelineTextBase = isFilmType
    ? watchedAt
      ? `${t('lists.watchedAt')}: ${formatListDate(watchedAt)}`
      : null
    : completedPart
      ? startedPart
        ? `${startedPart} · ${completedPart}`
        : completedPart
      : startedPart
        ? startedPart
        : null
  const timelineText =
    timelineTextBase && rewatchCount > 0 ? `${timelineTextBase} · ${rewatchLabel}: ${rewatchCount}` : timelineTextBase

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-lavender-400/50 shadow-md hover:shadow-lg transition-shadow aspect-[2/3] min-h-[180px]"
      onClick={() => {
        if (!isMobile) return
        if (!tapped) setTapped(true)
      }}
    >
      <Link to={linkPath} className={`block absolute inset-0 ${isMobile && !tapped ? 'pointer-events-none' : ''}`}>
        {media.poster ? (
          <img src={getMediaAssetUrl(media.poster)} alt={media.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[var(--theme-bg-alt)] flex items-center justify-center">
            <span className="text-[var(--theme-text-muted)] text-2xl">—</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 p-3 flex flex-col justify-end">
          <h3 className="font-medium text-white text-sm line-clamp-2 drop-shadow-sm">
            {getMediaTitle(media) || media.title}
          </h3>
          {(progressText || ratingDisplay || item.titleReaction) && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {progressText && <span className="text-xs text-white/90 drop-shadow-sm">{progressText}</span>}
              {ratingDisplay != null && (
                <span className="text-xs font-medium text-white/95 drop-shadow-sm">{ratingDisplay}</span>
              )}
              {item.titleReaction && (
                <span className="drop-shadow-sm">
                  <TitleReactionDisplay reaction={item.titleReaction} size={14} />
                </span>
              )}
              {timelineText && <span className="text-[11px] text-white/90 drop-shadow-sm">{timelineText}</span>}
            </div>
          )}
          {StatusIcon && badgeClasses && (
            <div
              className={`absolute top-2 left-2 w-7 h-7 rounded-md flex items-center justify-center shadow ${badgeClasses.bg} ${badgeClasses.text}`}
              title={getListStatusLabel(t, listType, status)}
            >
              <StatusIcon size={14} className="shrink-0" />
            </div>
          )}
        </div>
      </Link>
      {isOwnProfile && (
        <div
          className={[
            'absolute top-2 right-2 flex items-center gap-1 transition-opacity',
            isMobile ? (tapped ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit(item)
            }}
            className="btn-edit list-item-action list-item-action--edit p-1.5 rounded-lg"
            title={t('media.editListEntry')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove(media.id)
            }}
            className="list-item-action list-item-action--delete p-1.5 rounded-lg text-gray-800 bg-[#ffe9f0] hover:bg-soft_blush-300 hover:text-soft_blush-700 transition-colors"
            title={t('common.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
