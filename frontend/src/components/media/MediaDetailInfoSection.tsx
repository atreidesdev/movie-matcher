import type { Media } from '@/types'
import { getGenreBadgeClass, getGenreBadgeVariant } from '@/utils/genreColors'
import { getEntityName } from '@/utils/localizedText'
import { ExternalLink } from 'lucide-react'

type SiteLink = { url: string; linkType?: string | null; site?: { name: string; url: string } | null }

interface MediaDetailInfoSectionProps {
  descriptionText: string | null
  media: Media & { sites?: SiteLink[] }
  locale: string
  t: (key: string, params?: Record<string, unknown>) => string
}

export function MediaDetailInfoSection({ descriptionText, media, locale, t }: MediaDetailInfoSectionProps) {
  const hasDescription = Boolean(descriptionText)
  const hasGenres = (media.genres?.length ?? 0) > 0
  const hasThemes = (media.themes?.length ?? 0) > 0
  const siteLinks = media.sites
  const watchLinks = siteLinks?.filter((l) => !l.linkType || l.linkType === 'watch') ?? []
  const buyLinks = siteLinks?.filter((l) => l.linkType === 'buy') ?? []
  const hasLinks = watchLinks.length > 0 || buyLinks.length > 0

  if (!hasDescription && !hasGenres && !hasThemes && !hasLinks) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {(hasDescription || hasGenres || hasThemes) && (
        <div className="flex flex-col gap-2">
          {hasDescription && (
            <div className="flex flex-col gap-2">
              <p className="text-[var(--theme-text)] leading-relaxed">{descriptionText}</p>
            </div>
          )}

          {hasGenres && (
            <div className="flex flex-wrap gap-2">
              {media
                .genres!.filter((g) => g != null && g.name)
                .map((genre) => (
                  <span
                    key={genre.id}
                    className={`genre-badge px-3 py-1 rounded-full text-sm ${getGenreBadgeClass(genre.id)}`}
                    data-badge-variant={getGenreBadgeVariant(genre.id)}
                  >
                    {getEntityName(genre, locale)}
                  </span>
                ))}
            </div>
          )}

          {hasThemes && (
            <div className="flex flex-wrap gap-2">
              {(media.themes ?? [])
                .filter((th) => th != null && th.name)
                .map((theme) => (
                  <span
                    key={theme.id}
                    className="media-theme-badge px-3 py-1 rounded-full text-sm bg-slate-200 text-slate-700"
                    data-badge-variant={theme.id % 10}
                  >
                    {getEntityName(theme, locale)}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {hasLinks && (
        <div className="flex flex-col gap-4">
          {watchLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">{t('media.watchOn')}</h2>
              <div className="flex flex-wrap gap-2">
                {watchLinks.map((link, idx) => (
                  <a
                    key={link.site?.name ?? idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-surface)] text-[var(--theme-text)] transition-colors text-sm"
                  >
                    {link.site?.name ?? link.url}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
          {buyLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">{t('media.buyOn')}</h2>
              <div className="flex flex-wrap gap-2">
                {buyLinks.map((link, idx) => (
                  <a
                    key={link.site?.name ?? idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-surface)] text-[var(--theme-text)] transition-colors text-sm"
                  >
                    {link.site?.name ?? link.url}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
