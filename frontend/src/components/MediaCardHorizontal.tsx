import RatingEmoji from '@/components/RatingEmoji'
import { getListStatusBadgeClasses, getListStatusIcon } from '@/components/icons'
import { useCanHover } from '@/hooks/useCanHover'
import { usePosterCardTheme } from '@/hooks/usePosterCardTheme'
import type { ListStatus, Media } from '@/types'
import type { ReleaseSchedule } from '@/types'
import { getLocalizedString, getMediaTitle } from '@/utils/localizedText'
import {
  type MediaTypeForPath,
  getCatalogGenreLink,
  getCatalogThemeLink,
  getMediaAssetUrl,
  getMediaPath,
} from '@/utils/mediaPaths'
import { normalizeRatingToPercent } from '@/utils/rating'
import {
  getMediaChaptersFromVolumes,
  getMediaCurrentEpisode,
  getMediaEpisodesCount,
  getMediaPages,
  getMediaReadingDurationMinutes,
  getMediaVolumes,
} from '@/utils/typeGuards'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const SERIES_TYPES: MediaTypeForPath[] = ['anime', 'tv-series', 'cartoon-series']
const FILM_TYPES: MediaTypeForPath[] = ['movie', 'anime-movies', 'cartoon-movies']

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

const STATUS_KEYS: Record<string, string> = {
  announced: 'media.statusAnnounced',
  in_production: 'media.statusInProduction',
  released: 'media.statusReleased',
  finished: 'media.statusFinished',
  cancelled: 'media.statusCancelled',
  postponed: 'media.statusPostponed',
}

/** Форматирует дату выхода эпизода (короткий формат: "15 мар." / "Mar 15"). */
function formatEpisodeDate(isoDate: string, locale: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' })
}

const PRINT_TYPES: MediaTypeForPath[] = ['manga', 'book', 'light-novel']

function getOptionalEntityName(
  entity: { name?: string; nameI18n?: unknown } | null | undefined,
  locale?: string,
): string {
  if (!entity) return ''
  return getLocalizedString(
    entity.nameI18n && typeof entity.nameI18n === 'object' ? (entity.nameI18n as Record<string, string>) : undefined,
    entity.name,
    locale,
  )
}

/** Блоки для карточки списка: мета (эпизоды/длительность/томы и главы/страницы), дата выхода, под датой — статус. */
function getListDateContent(
  media: Media & { releaseSchedule?: ReleaseSchedule },
  type: MediaTypeForPath,
  t: (key: string, opts?: Record<string, number | string>) => string,
  locale: string,
): { meta: string; dateMain: string; dateSub: string; dateSubDate?: string } {
  const isSeries = SERIES_TYPES.includes(type)
  const isFilm = FILM_TYPES.includes(type)
  const isPrint = PRINT_TYPES.includes(type)
  const status = (media.status || '').toLowerCase()
  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null
  const statusLabel = status ? (STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : (media.status ?? '')) : ''

  let meta = '—'
  let dateMain = year ? String(year) : '—'
  let dateSub = statusLabel
  let dateSubDate: string | undefined

  if (isPrint) {
    if (type === 'manga') {
      const vol = getMediaVolumes(media)
      const totalCh = getMediaChaptersFromVolumes(media)
      const parts = []
      if (vol != null) parts.push(t('media.volumesShort', { count: vol }))
      if (totalCh > 0) parts.push(t('media.chaptersShort', { count: totalCh }))
      meta = parts.length > 0 ? parts.join(' · ') : '—'
    } else if (type === 'light-novel') {
      const vol = getMediaVolumes(media)
      const totalCh = getMediaChaptersFromVolumes(media)
      const parts = []
      if (vol != null) parts.push(t('media.volumesShort', { count: vol }))
      if (totalCh > 0) parts.push(t('media.chaptersShort', { count: totalCh }))
      meta = parts.length > 0 ? parts.join(' · ') : '—'
    } else if (type === 'book') {
      const pg = getMediaPages(media)
      const dur = getMediaReadingDurationMinutes(media)
      const parts = []
      if (pg != null) parts.push(t('media.pagesShort', { count: pg }))
      if (dur != null) parts.push(`${dur} ${t('media.minutes')}`)
      meta = parts.length > 0 ? parts.join(' · ') : '—'
    }
    dateSub = statusLabel
    return { meta, dateMain, dateSub }
  }

  if (isSeries) {
    const count = getMediaEpisodesCount(media)
    meta = count != null ? t('media.episodesShort', { count }) : '—'

    if (status === 'in_production' && year) {
      dateMain = t('media.airingSince', { year: String(year) })
      const currentEp = getMediaCurrentEpisode(media) ?? 0
      const nextEpNum = currentEp + 1
      const schedule = Array.isArray(media.releaseSchedule?.episodes) ? media.releaseSchedule.episodes : undefined
      const nextEp = schedule?.find((e) => e.episodeNumber === nextEpNum)
      if (nextEp?.releaseDate) {
        const releaseDate = new Date(nextEp.releaseDate)
        const now = new Date()
        const days = Math.ceil((releaseDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        dateSub = t('media.epAiringIn', { num: nextEpNum, days: days > 0 ? days : 0 })
        dateSubDate = formatEpisodeDate(nextEp.releaseDate, locale)
      } else if (currentEp > 0) {
        dateSub = t('media.epCurrent', { num: currentEp })
      } else {
        dateSub = statusLabel || dateSub
      }
    } else {
      dateSub = statusLabel
    }
    return { meta, dateMain, dateSub, dateSubDate }
  }

  if (isFilm) {
    meta = media.duration != null ? `${media.duration} ${t('media.minutes')}` : '—'
    dateSub = statusLabel
    return { meta, dateMain, dateSub }
  }

  dateSub = statusLabel
  return { meta, dateMain, dateSub }
}

interface MediaCardHorizontalProps {
  media: Media
  type: MediaTypeForPath
  listStatus?: ListStatus
  className?: string
  rankNumber?: number
}

export default function MediaCardHorizontal({
  media,
  type,
  listStatus,
  className,
  rankNumber,
}: MediaCardHorizontalProps) {
  const { i18n, t } = useTranslation()
  const locale = i18n.language
  const canHover = useCanHover()
  const title = getMediaTitle(media, locale) || media.title
  const posterUrl = media.poster ? getMediaAssetUrl(media.poster) : null
  const linkPath = getMediaPath(type, media.id, title)
  const status = listStatus ?? media.listStatus
  const StatusIcon = status ? getListStatusIcon(status, type) : null
  const badgeClasses = status ? getListStatusBadgeClasses(status, type) : null
  const ratingDisplay = normalizeRatingToPercent(media.rating)
  const dateContent = getListDateContent(media, type, t, locale)
  const dynamicCardStyle = usePosterCardTheme(posterUrl)

  return (
    <motion.div
      className={clsx('media-card-list-row', className)}
      whileHover={
        canHover
          ? {
              y: -2,
              scale: 1.01,
              boxShadow: '0 14px 28px -16px rgb(15 23 42 / 0.55)',
            }
          : undefined
      }
      transition={{ type: 'tween', duration: 0.18 }}
    >
      {rankNumber != null && <div className="media-card-list__rank">#{rankNumber}</div>}
      <div className="media-card-list" style={dynamicCardStyle}>
        <Link to={linkPath} className="media-card-list__cover" aria-hidden="true">
          {media.poster ? (
            <img src={posterUrl ?? undefined} alt="" className="media-card-list__image loaded" />
          ) : (
            <div className="media-card-list__image media-card-list__image--placeholder">—</div>
          )}
          {StatusIcon && badgeClasses && (
            <div className={clsx('media-card-list__status', badgeClasses.bg, badgeClasses.text)}>
              <StatusIcon size={12} className="shrink-0" />
            </div>
          )}
        </Link>
        <div className="media-card-list__content">
          <div className="media-card-list__row media-card-list__row--title">
            <div className="media-card-list__title-wrap">
              <Link to={linkPath} className="media-card-list__title-link ellipsis">
                {title}
              </Link>
            </div>
            <div className="media-card-list__genres">
              {media.genres
                ?.filter((g) => g?.name)
                .map((genre) => (
                  <Link
                    key={`g-${genre.id}`}
                    to={getCatalogGenreLink(type, genre.id)}
                    className="media-card-list__genre"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getOptionalEntityName(genre, locale) || genre.name}
                  </Link>
                ))}
              {media.themes
                ?.filter((th) => th?.name)
                .map((theme) => (
                  <Link
                    key={`t-${theme.id}`}
                    to={getCatalogThemeLink(type, theme.id)}
                    className="media-card-list__genre"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getOptionalEntityName(theme, locale) || theme.name}
                  </Link>
                ))}
            </div>
          </div>
          <div className="media-card-list__extra">
            <div className="media-card-list__row media-card-list__row--score">
              <div className="media-card-list__score-wrap">
                <div className="media-card-list__score-row">
                  <RatingEmoji rating={ratingDisplay ?? undefined} size={14} className="media-card-list__score-emoji" />
                  <span className="media-card-list__score-value">{ratingDisplay != null ? ratingDisplay : '—'}</span>
                </div>
                {media.ratingCount != null && media.ratingCount > 0 && (
                  <div className="media-card-list__rating-count">
                    {t('media.ratingCount', { count: media.ratingCount })}
                  </div>
                )}
              </div>
            </div>
            <div
              className={clsx(
                'media-card-list__row media-card-list__row--meta',
                dateContent.meta === '—' && 'media-card-list__row--meta-no-value',
              )}
            >
              <span className="media-card-list__meta-label">{t(TYPE_LABEL[type])}</span>
              {dateContent.meta !== '—' && <span className="media-card-list__meta-value">{dateContent.meta}</span>}
            </div>
            <div className="media-card-list__row media-card-list__row--date">
              <span>{dateContent.dateMain}</span>
              {dateContent.dateSub ? (
                <div className="media-card-list__date-sub">
                  {dateContent.dateSub}
                  {dateContent.dateSubDate != null && (
                    <>
                      {' · '}
                      <span className="media-card-list__date-ep">{dateContent.dateSubDate}</span>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
