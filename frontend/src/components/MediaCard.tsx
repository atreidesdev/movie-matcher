import { useRef, useState, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Media, ListStatus } from '@/types'
import {
  getListStatusIcon,
  getListStatusBadgeClasses,
  IconStatusAdd,
  IconStatusEdit,
  IconStatusPlanned,
  IconStatusCompleted,
  IconFavorite,
  IconCross,
} from '@/components/icons'
import RatingEmoji from '@/components/RatingEmoji'
import { getMediaPath, getMediaAssetUrl, MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaTitle, getLocalizedString, getMediaYearSeason } from '@/utils/localizedText'
import { getMediaChaptersFromVolumes, getMediaEpisodesCount, getMediaPages, getMediaVolumes } from '@/utils/typeGuards'
import { usePosterCardTheme } from '@/hooks/usePosterCardTheme'
const TYPE_LABEL: Record<MediaTypeForPath, string> = {
  movie: 'media.typeMovie',
  'tv-series': 'media.typeTvSeries',
  anime: 'media.typeAnime',
  'anime-movies': 'media.typeAnimeMovies',
  'cartoon-series': 'media.typeCartoonSeries',
  'cartoon-movies': 'media.typeCartoonMovies',
  book: 'media.typeBook',
  manga: 'media.typeManga',
  'light-novel': 'media.typeLightNovel',
  game: 'media.typeGame',
}

const SERIES_TYPES: MediaTypeForPath[] = ['anime', 'tv-series', 'cartoon-series']
const FILM_TYPES: MediaTypeForPath[] = ['movie', 'anime-movies', 'cartoon-movies']

function getHoverMeta(
  media: Media,
  type: MediaTypeForPath,
  t: (key: string, opts?: Record<string, number | string>) => string
): string {
  if (SERIES_TYPES.includes(type)) {
    const count = getMediaEpisodesCount(media)
    return count != null ? t('media.episodesShort', { count }) : '—'
  }
  if (FILM_TYPES.includes(type)) {
    return media.duration != null ? `${media.duration} ${t('media.minutes')}` : '—'
  }
  if (type === 'manga' || type === 'light-novel') {
    const vol = getMediaVolumes(media)
    const ch = getMediaChaptersFromVolumes(media)
    const parts = []
    if (vol != null) parts.push(t('media.volumesShort', { count: vol }))
    if (ch > 0) parts.push(t('media.chaptersShort', { count: ch }))
    return parts.length > 0 ? parts.join(' · ') : '—'
  }
  if (type === 'book') {
    const pages = getMediaPages(media)
    return pages != null ? t('media.pagesShort', { count: pages }) : '—'
  }
  return '—'
}
import { balanceByLength } from '@/utils/balanceByLength'
import { normalizeRatingToPercent } from '@/utils/rating'
import { useCanHover } from '@/hooks/useCanHover'
import clsx from 'clsx'

type GenreThemeItem =
  | { type: 'genre'; item: { id: number; name?: string } }
  | { type: 'theme'; item: { id: number; name?: string } }

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

function GenreBadgesRow({ items, getLabel }: { items: GenreThemeItem[]; getLabel: (x: GenreThemeItem) => string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const maxFitsRef = useRef<number>(Infinity)
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [containerWidth, setContainerWidth] = useState(0)

  useLayoutEffect(() => {
    setVisibleCount(items.length)
    maxFitsRef.current = Infinity
  }, [items.length, items])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth)
      maxFitsRef.current = Infinity
    })
    ro.observe(el)
    setContainerWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    const row = rowRef.current
    if (!container || !row || items.length === 0) return
    const total = items.length
    const rowWidth = row.scrollWidth
    const maxWidth = container.clientWidth
    if (rowWidth > maxWidth && visibleCount > 0) {
      const next = visibleCount - 1
      maxFitsRef.current = next
      setVisibleCount(next)
    } else if (rowWidth <= maxWidth && visibleCount < total && visibleCount < maxFitsRef.current) {
      setVisibleCount((n) => n + 1)
    }
  }, [items.length, visibleCount, containerWidth])

  const toShow = items.slice(0, visibleCount)
  if (toShow.length === 0) return null

  return (
    <div ref={containerRef} className="mt-2 min-w-0 overflow-hidden">
      <div ref={rowRef} className="flex flex-nowrap gap-1 w-max">
        {toShow.map((x) => (
          <span
            key={x.type === 'genre' ? `g-${x.item.id}` : `t-${x.item.id}`}
            className="media-card-genre genre-badge text-xs px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap"
          >
            {getLabel(x)}
          </span>
        ))}
      </div>
    </div>
  )
}

interface MediaCardProps {
  media: Media
  type: MediaTypeForPath
  listStatus?: ListStatus
  className?: string
  rankNumber?: number
  /** Компактный вид (страницы персон/персонажей): меньшие иконки и рейтинг */
  compact?: boolean
  /** Показывать блок с жанрами (в сетке каталога не показываем) */
  showGenres?: boolean
  /** При наведении: открыть редактор списка (модалка) */
  onOpenListEditor?: (e: React.MouseEvent) => void
  /** Быстрое добавление в список: (e, status) => void */
  onQuickStatus?: (e: React.MouseEvent, status: ListStatus) => void
  /** Показать кнопку «удалить из избранного» вместо бейджа статуса и кнопок списка */
  showFavoriteButton?: boolean
  /** Клик по кнопке избранного (удаление из избранного) */
  onRemoveFromFavorites?: (e: React.MouseEvent) => void
  /** Универсальная кнопка удаления (для коллекций и т.п.) */
  onRemove?: (e: React.MouseEvent) => void
  /** Aria-label для кнопки onRemove */
  removeButtonLabel?: string
}

export default function MediaCard({
  media,
  type,
  listStatus,
  className,
  rankNumber,
  compact,
  showGenres = true,
  onOpenListEditor,
  onQuickStatus,
  showFavoriteButton,
  onRemoveFromFavorites,
  onRemove,
  removeButtonLabel,
}: MediaCardProps) {
  const { i18n, t } = useTranslation()
  const canHover = useCanHover()
  const locale = i18n.language
  const title = getMediaTitle(media, locale) || media.title
  const posterUrl = media.poster ? getMediaAssetUrl(media.poster) : null
  const linkPath = getMediaPath(type, media.id, title)
  const status = listStatus ?? media.listStatus
  const StatusIcon = status ? getListStatusIcon(status, type) : null
  const badgeClasses = status ? getListStatusBadgeClasses(status, type) : null
  const ratingDisplay = normalizeRatingToPercent(media.rating)
  const showRatingRank = rankNumber != null
  const accentVariant = media.id % 10
  const dynamicCardStyle = usePosterCardTheme(posterUrl)

  const cardRef = useRef<HTMLDivElement | null>(null)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    const maxRotate = 6
    const rotateX = -y * maxRotate
    const rotateY = x * maxRotate
    setTilt({ rotateX, rotateY })
  }

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 })
  }

  const yearSeason = getMediaYearSeason(media, t)
  const metaLine = getHoverMeta(media, type, t)
  const studiosLine =
    'studios' in media && Array.isArray(media.studios) && media.studios.length > 0
      ? (media.studios as { name?: string; nameI18n?: unknown }[])
          .map((s) => getOptionalEntityName(s, locale) || s.name || '')
          .filter(Boolean)
          .join(', ')
      : ''

  return (
    <motion.div
      ref={cardRef}
      className={clsx('block min-w-0 rounded-xl overflow-hidden', className)}
      style={
        canHover
          ? {
              rotateX: tilt.rotateX,
              rotateY: tilt.rotateY,
              transformPerspective: 800,
            }
          : undefined
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={
        canHover
          ? {
              scale: 1.02,
              boxShadow: '0 18px 30px -8px rgb(15 23 42 / 0.45), 0 8px 16px -8px rgb(15 23 42 / 0.35)',
            }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.6 }}
    >
      <Link to={linkPath} className="card group min-w-0 relative block" style={dynamicCardStyle}>
        {showRatingRank && !compact && (
          <div className="media-rating-rank-badge media-rating-rank-badge--grid" data-badge-variant={accentVariant}>
            #{rankNumber}
          </div>
        )}
        <div className="aspect-[2/3] relative overflow-hidden">
          {media.poster ? (
            <img src={posterUrl ?? undefined} alt={title} className="w-full h-full object-cover media-card-poster" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[var(--theme-text-muted)] text-sm">No Image</span>
            </div>
          )}
          {showFavoriteButton && onRemoveFromFavorites && (
            <div
              className="media-card-list-btns-wrap media-card-list-btns-wrap--on-list"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.preventDefault()}
              role="group"
              aria-label={t('nav.favorites')}
            >
              <button
                type="button"
                className="media-card-list-btn media-card-list-btn--open"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemoveFromFavorites(e)
                }}
                title={t('toast.removedFromFavorites')}
                aria-label={t('toast.removedFromFavorites')}
              >
                <IconFavorite size={14} className="shrink-0 fill-current text-soft_blush-400" />
              </button>
            </div>
          )}
          {onRemove && (
            <div
              className="media-card-list-btns-wrap media-card-list-btns-wrap--on-list"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.preventDefault()}
              role="group"
              aria-label={removeButtonLabel}
            >
              <button
                type="button"
                className="media-card-list-btn media-card-list-btn--open"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove(e)
                }}
                title={removeButtonLabel}
                aria-label={removeButtonLabel}
              >
                <IconCross size={14} className="shrink-0" />
              </button>
            </div>
          )}
          {!showFavoriteButton && StatusIcon && badgeClasses && compact && !showRatingRank && (
            <div
              className={clsx(
                'absolute top-1.5 left-1.5 z-10 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-lg',
                compact ? 'w-8 h-8' : 'w-10 h-10',
                badgeClasses.bg,
                badgeClasses.text
              )}
              title={canHover ? status : undefined}
            >
              <StatusIcon size={compact ? 16 : 20} className="shrink-0" />
            </div>
          )}
          {compact && (
            <div
              className={clsx(
                'rating-badge absolute top-1.5 right-1.5 bg-space_indigo-600 backdrop-blur-sm rounded-lg flex items-center justify-center gap-1.5 shadow-lg',
                'h-8 px-2'
              )}
            >
              <RatingEmoji rating={ratingDisplay} size={20} className="text-lavender-500 shrink-0" />
              <span className="font-medium text-lavender-500 text-sm">
                {ratingDisplay != null ? ratingDisplay : ''}
              </span>
            </div>
          )}
          {!compact && !showFavoriteButton && (onOpenListEditor || onQuickStatus) && (
            <div
              className={clsx('media-card-list-btns-wrap', status && 'media-card-list-btns-wrap--on-list')}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.preventDefault()}
              role="group"
              aria-label={t('media.listActions')}
            >
              {onOpenListEditor && (
                <button
                  type="button"
                  className="media-card-list-btn media-card-list-btn--open"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onOpenListEditor(e)
                  }}
                  title={canHover ? (status ? t('media.editListEntry') : t('media.openListEditor')) : undefined}
                  aria-label={status ? t('media.editListEntry') : t('media.openListEditor')}
                >
                  {status ? (
                    <IconStatusEdit size={14} className="shrink-0" />
                  ) : (
                    <IconStatusAdd size={14} className="shrink-0" />
                  )}
                </button>
              )}
              {canHover && onQuickStatus && (
                <div className="media-card-quick-actions">
                  {/* column-reverse: первый в DOM — снизу (у основной кнопки), последний — сверху */}
                  <button
                    type="button"
                    className="media-card-list-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onQuickStatus(e, 'planned')
                    }}
                    title={canHover ? t('media.addToPlanning') : undefined}
                    aria-label={t('media.addToPlanning')}
                  >
                    <IconStatusPlanned size={14} className="shrink-0" />
                  </button>
                  <button
                    type="button"
                    className="media-card-list-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onQuickStatus(e, 'completed')
                    }}
                    title={canHover ? t('media.addToCompleted') : undefined}
                    aria-label={t('media.addToCompleted')}
                  >
                    <IconStatusCompleted size={14} className="shrink-0" />
                  </button>
                  <button
                    type="button"
                    className="media-card-list-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onQuickStatus(e, 'watching')
                    }}
                    title={canHover ? t('media.addToWatching') : undefined}
                    aria-label={t('media.addToWatching')}
                  >
                    {(() => {
                      const WatchingIcon = getListStatusIcon('watching', type)
                      return <WatchingIcon size={14} className="shrink-0" />
                    })()}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!compact && (
          <div className="media-card-hover-data media-card-hover-data--right" aria-hidden="true">
            <div className="media-card-hover-data__header">
              {yearSeason && <div className="media-card-hover-data__date">{yearSeason}</div>}
              <div className="media-card-hover-data__score">
                <RatingEmoji rating={ratingDisplay} size={20} className="media-card-hover-data__score-icon" />
                <span className="media-card-hover-data__percentage">
                  {ratingDisplay != null ? `${ratingDisplay}%` : '—'}
                </span>
              </div>
            </div>
            {studiosLine && <div className="media-card-hover-data__studios">{studiosLine}</div>}
            <div className="media-card-hover-data__info">
              <span>{t(TYPE_LABEL[type])}</span>
              <span className="media-card-hover-data__separator">•</span>
              <span>{metaLine}</span>
            </div>
            {media.genres && media.genres.length > 0 && (
              <div className="media-card-hover-data__genres">
                {media.genres
                  .filter((g) => g != null && Boolean(g.name))
                  .map((g) => (
                    <div key={g.id} className="media-card-hover-data__genre">
                      {getOptionalEntityName(g, locale) || g.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="p-3 min-h-[4.5rem] min-w-0 flex flex-col">
          <h3 className="card-title-hover font-medium truncate transition-colors shrink-0">{title}</h3>

          {(media.releaseDate || media.season || StatusIcon || ratingDisplay != null) && (
            <div className="shrink-0 flex items-center justify-between gap-2">
              {media.releaseDate || media.season ? (
                <p className="text-xs text-[var(--theme-text-muted)] min-w-0 truncate">
                  {getMediaYearSeason(media, t)}
                </p>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                {!compact && ratingDisplay != null && (
                  <div className="rating-badge media-card-inline-rating bg-space_indigo-600 backdrop-blur-sm">
                    <RatingEmoji rating={ratingDisplay} size={16} className="shrink-0 text-lavender-500" />
                    <span className="rating-badge-value text-lavender-500">{ratingDisplay}</span>
                  </div>
                )}
                {!showFavoriteButton && StatusIcon && badgeClasses && !compact && (
                  <div
                    className={clsx(
                      'media-card-inline-status media-card-inline-status--small',
                      badgeClasses.bg,
                      badgeClasses.text
                    )}
                    title={canHover ? status : undefined}
                  >
                    <StatusIcon size={10} className="shrink-0" />
                  </div>
                )}
              </div>
            </div>
          )}

          {!compact &&
            showGenres &&
            media.genres?.length > 0 &&
            (() => {
              const genreList = media.genres.filter((g) => g != null && g.name) as { id: number; name?: string }[]
              const combined: GenreThemeItem[] = genreList.map((g) => ({ type: 'genre' as const, item: g }))
              const balanced = balanceByLength(
                combined,
                (x) => getOptionalEntityName(x.item, locale) || x.item.name || ''
              )
              return (
                <GenreBadgesRow
                  items={balanced}
                  getLabel={(x) => getOptionalEntityName(x.item, locale) || x.item.name || ''}
                />
              )
            })()}
        </div>
      </Link>
    </motion.div>
  )
}
