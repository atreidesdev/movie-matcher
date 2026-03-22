import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Media, ListStatus } from '@/types'
import {
  getListStatusIcon,
  getListStatusBadgeClasses,
  IconStatusAdd,
  IconStatusEdit,
  IconStatusPlanned,
  IconStatusCompleted,
} from '@/components/icons'
import RatingEmoji from '@/components/RatingEmoji'
import { getMediaPath, getMediaAssetUrl, MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaTitle, getMediaDescription, getLocalizedString, getMediaYearSeason } from '@/utils/localizedText'
import { balanceByLength } from '@/utils/balanceByLength'
import { useCanHover } from '@/hooks/useCanHover'
import { usePosterCardTheme } from '@/hooks/usePosterCardTheme'
import clsx from 'clsx'

interface MediaCardDetailedProps {
  media: Media
  type: MediaTypeForPath
  listStatus?: ListStatus
  className?: string
  rankNumber?: number
  onOpenListEditor?: (e: React.MouseEvent) => void
  onQuickStatus?: (e: React.MouseEvent, status: ListStatus) => void
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

function DetailedGenreRow({
  items,
  locale,
}: {
  items: { id: number; name?: string; nameI18n?: unknown }[]
  locale: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const maxFitsRef = useRef<number>(Infinity)
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [containerWidth, setContainerWidth] = useState(0)

  useLayoutEffect(() => {
    setVisibleCount(items.length)
    maxFitsRef.current = Infinity
  }, [items])

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
  }, [items, visibleCount, containerWidth])

  const visibleItems = items.slice(0, visibleCount)
  if (visibleItems.length === 0) return null

  return (
    <div ref={containerRef} className="media-card-footer-genres">
      <div ref={rowRef} className="media-card-footer-genres-row">
        {visibleItems.map((item) => (
          <span key={item.id} className="media-card-genre genre-badge">
            {getOptionalEntityName(item, locale) || item.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MediaCardDetailed({
  media,
  type,
  listStatus,
  className,
  rankNumber,
  onOpenListEditor,
  onQuickStatus,
}: MediaCardDetailedProps) {
  const { i18n, t } = useTranslation()
  const canHover = useCanHover()
  const locale = i18n.language
  const title = getMediaTitle(media, locale) || media.title
  const posterUrl = media.poster ? getMediaAssetUrl(media.poster) : null
  const linkPath = getMediaPath(type, media.id, title)
  const yearSeason = getMediaYearSeason(media, t)
  const genres = media.genres?.filter((g) => g?.name) ?? []
  const balancedGenres = balanceByLength(genres, (g) => getOptionalEntityName(g, locale) || g.name)
  const accentVariant = media.id % 10
  const status = listStatus ?? media.listStatus
  const StatusIcon = status ? getListStatusIcon(status, type) : null
  const badgeClasses = status ? getListStatusBadgeClasses(status, type) : null
  const showRatingRank = rankNumber != null
  const dynamicCardStyle = usePosterCardTheme(posterUrl)

  return (
    <motion.div
      whileHover={
        canHover
          ? {
              y: -4,
              scale: 1.01,
              boxShadow: '0 16px 40px rgba(15,23,42,0.42)',
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--theme-bg-alt) 92%, transparent), color-mix(in srgb, var(--theme-primary) 22%, transparent))',
            }
          : undefined
      }
      transition={{ type: 'tween', duration: 0.22 }}
    >
      <Link
        to={linkPath}
        className={`media-card ${showRatingRank ? 'media-card--with-rank' : ''} focus:outline-none focus:ring-2 focus:ring-thistle-400 focus:ring-offset-2 ${className ?? ''}`}
        style={dynamicCardStyle}
      >
        {showRatingRank && (
          <div className="media-rating-rank-badge media-rating-rank-badge--detailed" data-badge-variant={accentVariant}>
            #{rankNumber}
          </div>
        )}
        <div className="media-card-cover">
          {StatusIcon && badgeClasses && !showRatingRank && (
            <div
              className={`absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-md flex items-center justify-center ${badgeClasses.bg} ${badgeClasses.text}`}
            >
              <StatusIcon size={14} className="shrink-0" />
            </div>
          )}
          {showRatingRank && StatusIcon && badgeClasses && (
            <div
              className={clsx(
                'media-card-inline-status absolute top-1.5 right-1.5 z-10',
                badgeClasses.bg,
                badgeClasses.text
              )}
            >
              <StatusIcon size={14} className="shrink-0" />
            </div>
          )}
          <span className="image-link">
            {media.poster ? (
              <img src={posterUrl ?? undefined} alt="" />
            ) : (
              <div className="absolute inset-0 bg-[var(--theme-bg-alt)] flex items-center justify-center text-[var(--theme-text-muted)] text-3xl">
                —
              </div>
            )}
          </span>
          <div className="media-card-overlay">
            <span className="overlay-title">{getMediaTitle(media, locale)}</span>
          </div>
        </div>
        <div className="media-card-data">
          <div className="media-card-body">
            <div className="media-card-scroll scroll-on-hover">
              <div className="media-card-header">
                <div className="media-card-date">{yearSeason}</div>
                <div className="media-card-header-right">
                  <div className="rating-badge media-card-score bg-space_indigo-600 backdrop-blur-sm rounded-lg h-8 min-w-[2.5rem] px-2 flex items-center justify-center gap-1">
                    <RatingEmoji
                      rating={
                        media.rating != null
                          ? media.rating <= 10
                            ? Math.round(Number(media.rating) * 10)
                            : Math.round(Number(media.rating))
                          : null
                      }
                      size={18}
                      className="flex-shrink-0 text-lavender-500"
                    />
                    <span className="text-sm font-medium text-lavender-500">
                      {media.rating != null
                        ? media.rating <= 10
                          ? Math.min(100, Math.max(1, Math.round(Number(media.rating) * 10)))
                          : Math.min(100, Math.max(1, Math.round(Number(media.rating))))
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
              {(getMediaDescription(media, locale) || media.description) && (
                <div className="media-card-description">{getMediaDescription(media, locale) || media.description}</div>
              )}
            </div>
          </div>
          <div
            className={clsx(
              'media-card-footer',
              (onOpenListEditor || onQuickStatus) && 'media-card-footer--with-actions'
            )}
          >
            <DetailedGenreRow items={balancedGenres} locale={locale} />
            {(onOpenListEditor || onQuickStatus) && (
              <div
                className="media-card-detailed-list-btns-wrap"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.preventDefault()}
                role="group"
                aria-label={t('media.listActions')}
              >
                {onOpenListEditor && (
                  <button
                    type="button"
                    className="media-card-list-btn media-card-list-btn--open media-card-detailed-btn-open"
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
                  <div className="media-card-detailed-quick-actions">
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
        </div>
      </Link>
    </motion.div>
  )
}
