import { Link } from 'react-router-dom'
import { getMediaAssetUrl, getStudioPath, getPublisherPath, getDeveloperPath } from '@/utils/mediaPaths'
import { getEntityName } from '@/utils/localizedText'
import type { Media } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'

interface MediaDetailCompaniesSectionProps {
  media: Media
  type: MediaTypeForPath
  locale: string
  t: (key: string, params?: Record<string, unknown>) => string
}

const cardClass =
  'block w-40 sm:w-52 rounded-lg overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] hover:border-[var(--theme-accent)] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]'
const posterPlaceholder =
  'w-full h-full flex items-center justify-center text-[var(--theme-text-muted)] text-sm font-medium'
const titleClass = 'title-hover-theme text-sm font-medium text-[var(--theme-text)]'

export function MediaDetailCompaniesSection({ media, type, locale, t }: MediaDetailCompaniesSectionProps) {
  return (
    <>
      {'studios' in media && Array.isArray(media.studios) && media.studios.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('media.studios')}</h2>
          <div className="flex flex-wrap gap-4">
            {(media.studios as { id: number; name: string; poster?: string }[])
              .filter((s) => s != null && (s.name || getEntityName(s, locale)))
              .map((studio) => (
                <Link key={studio.id} to={getStudioPath(studio.id)} className={cardClass}>
                  <div className="aspect-[3/1] w-full bg-[var(--theme-bg-alt)]">
                    {studio.poster ? (
                      <img src={getMediaAssetUrl(studio.poster)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={posterPlaceholder}>{getEntityName(studio, locale)}</div>
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <span className={titleClass}>{getEntityName(studio, locale)}</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {type === 'game' && 'developers' in media && Array.isArray(media.developers) && media.developers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('media.developers')}</h2>
          <div className="flex flex-wrap gap-4">
            {(media.developers as { id: number; name: string; poster?: string }[])
              .filter((d) => d != null && d.name)
              .map((dev) => (
                <Link key={dev.id} to={getDeveloperPath(dev.id)} className={cardClass}>
                  <div className="aspect-[3/1] w-full bg-[var(--theme-bg-alt)]">
                    {dev.poster ? (
                      <img src={getMediaAssetUrl(dev.poster)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={posterPlaceholder}>{getEntityName(dev, locale)}</div>
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <span className={titleClass}>{getEntityName(dev, locale)}</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {(type === 'game' || type === 'manga') &&
        'publishers' in media &&
        Array.isArray(media.publishers) &&
        media.publishers.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">{t('media.publishers')}</h2>
            <div className="flex flex-wrap gap-4">
              {(media.publishers as { id: number; name: string; poster?: string }[])
                .filter((p) => p != null && p.name)
                .map((pub) => (
                  <Link key={pub.id} to={getPublisherPath(pub.id)} className={cardClass}>
                    <div className="aspect-[3/1] w-full bg-[var(--theme-bg-alt)]">
                      {pub.poster ? (
                        <img src={getMediaAssetUrl(pub.poster)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={posterPlaceholder}>{getEntityName(pub, locale)}</div>
                      )}
                    </div>
                    <div className="p-2 text-center">
                      <span className={titleClass}>{getEntityName(pub, locale)}</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

      {'platforms' in media && Array.isArray(media.platforms) && media.platforms.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('media.platforms')}</h2>
          <div className="flex flex-wrap gap-2">
            {(media.platforms as { id: number; name: string }[])
              .filter((p) => p != null && p.name)
              .map((platform) => (
                <span
                  key={platform.id}
                  className="bg-[var(--theme-bg-alt)] text-[var(--theme-text)] px-3 py-1 rounded-full text-sm"
                >
                  {getEntityName(platform, locale)}
                </span>
              ))}
          </div>
        </div>
      )}
    </>
  )
}
