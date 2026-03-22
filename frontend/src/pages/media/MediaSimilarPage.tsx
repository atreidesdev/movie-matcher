import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { getListStatusIcon, getListStatusBadgeClasses } from '@/components/icons'
import RatingEmoji from '@/components/RatingEmoji'
import { mediaApi } from '@/api/media'
import { getMediaAssetUrl, getMediaPath, type MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaTitle, getEntityName } from '@/utils/localizedText'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { normalizeRatingToPercent } from '@/utils/rating'
import type { Media, ListStatus } from '@/types'
import clsx from 'clsx'

interface MediaSimilarPageProps {
  type: MediaTypeForPath
}

export default function MediaSimilarPage({ type }: MediaSimilarPageProps) {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)

  const numId = id ? parseInt(id, 10) : 0

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [numId, type])

  useEffect(() => {
    if (!numId) {
      setLoading(false)
      return
    }
    setMedia(null)
    setLoading(true)
    mediaApi
      .getMediaByType(type, numId)
      .then((m) => setMedia(m as Media))
      .catch(() => setMedia(null))
      .finally(() => setLoading(false))
  }, [numId, type])

  const similar =
    media && 'similar' in media && Array.isArray((media as { similar?: Media[] }).similar)
      ? (media as { similar: Media[] }).similar
      : []

  if (!numId) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to={getMediaPath(type, numId, getMediaTitle(media ?? undefined, locale) || media?.title)}
          className="inline-flex items-center gap-2 link-underline-animate text-sm shrink-0"
        >
          <ArrowLeft className="w-3.5 h-2.5" />
          {t('common.back')}
        </Link>
        <h1 className="text-xl font-semibold text-[var(--theme-text)]">
          {getMediaTitle(media ?? undefined, locale) || media?.title
            ? t('media.similarTo', { title: getMediaTitle(media ?? undefined, locale) || media?.title })
            : t('media.similar')}
        </h1>
      </div>

      {loading ? (
        <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
      ) : similar.length === 0 ? (
        <p className="text-[var(--theme-text-muted)]">{t('media.noSimilar')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {similar.map((item) => {
            const status = item.listStatus as ListStatus | undefined
            const StatusIcon = status ? getListStatusIcon(status, type) : null
            const badgeClasses = status ? getListStatusBadgeClasses(status, type) : null
            const ratingDisplay = normalizeRatingToPercent(item.rating)
            const title = getMediaTitle(item, locale) || item.title
            return (
              <Link
                key={item.id}
                to={getMediaPath(type, item.id, title)}
                className="group block rounded-xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-surface)] hover:border-[var(--theme-border)] transition-colors focus:outline-none"
              >
                <div className="relative aspect-[2/3] bg-[var(--theme-bg-alt)]">
                  {item.poster ? (
                    <img
                      src={getMediaAssetUrl(item.poster)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--theme-text-muted)] text-3xl">
                      —
                    </div>
                  )}
                  {StatusIcon && badgeClasses && (
                    <div
                      className={clsx(
                        'absolute top-1.5 left-1.5 z-10 w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-lg',
                        badgeClasses.bg,
                        badgeClasses.text
                      )}
                      title={status ? getListStatusLabel(t, type, status) : ''}
                    >
                      <StatusIcon size={16} className="shrink-0" />
                    </div>
                  )}
                  <div className="rating-badge absolute top-1.5 right-1.5 z-10 h-8 bg-space_indigo-600 backdrop-blur-sm rounded-lg px-1.5 flex items-center gap-0.5 shadow-lg">
                    <RatingEmoji rating={ratingDisplay ?? undefined} size={16} className="text-lavender-500 shrink-0" />
                    {ratingDisplay != null ? (
                      <span className="text-xs font-medium text-lavender-500">{ratingDisplay}</span>
                    ) : null}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/15 px-2 py-2">
                    <h3 className="media-similar-card__title font-semibold text-sm truncate whitespace-nowrap">
                      {title}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 p-2 text-xs text-[var(--theme-text-muted)]">
                  {item.releaseDate && <span>{new Date(item.releaseDate).getFullYear()}</span>}
                  {item.genres?.length > 0 && (
                    <span className="truncate">
                      {item.genres
                        .filter((g) => g?.name)
                        .slice(0, 2)
                        .map((genre) => getEntityName(genre, locale) || genre.name)
                        .join(', ')}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
