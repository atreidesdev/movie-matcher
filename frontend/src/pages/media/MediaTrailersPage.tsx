import { mediaApi } from '@/api/media'
import VideoPlayer from '@/components/VideoPlayer'
import VideoThumbnail from '@/components/VideoThumbnail'
import { IconCross } from '@/components/icons'
import type { Media } from '@/types'
import { getMediaTitle } from '@/utils/localizedText'
import { type MediaTypeForPath, getMediaPath } from '@/utils/mediaPaths'
import { normalizeMediaVideos } from '@/utils/mediaVideos'
import { getVideoStreamQualitySources, getVideoStreamUrl, getYouTubeEmbedUrl } from '@/utils/videoUtils'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

interface MediaTrailersPageProps {
  type: MediaTypeForPath
}

export default function MediaTrailersPage({ type }: MediaTrailersPageProps) {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const numId = id ? Number.parseInt(id, 10) : 0
  const withUrl = normalizeMediaVideos(media?.videos)

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
        <h1 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.trailers')}</h1>
      </div>

      {loading ? (
        <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
      ) : withUrl.length === 0 ? (
        <p className="text-[var(--theme-text-muted)]">{t('media.noTrailers')}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {expandedIndex !== null &&
            withUrl[expandedIndex] &&
            (() => {
              const v = withUrl[expandedIndex]
              const url = v.url
              const name = v.name || t('media.trailerNumber', { number: expandedIndex + 1 })
              const embedUrl = getYouTubeEmbedUrl(url)
              const isOwnVideo = !url.startsWith('http')
              const videoSrc = embedUrl ? null : url.startsWith('http') ? url : getVideoStreamUrl(url)
              const qualitySources = videoSrc && isOwnVideo ? getVideoStreamQualitySources(url, t) : []
              return (
                <div className="flex flex-col gap-2">
                  <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black shadow-xl">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={name}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : videoSrc ? (
                      <VideoPlayer
                        src={videoSrc}
                        sources={qualitySources.length > 0 ? qualitySources : undefined}
                        autoPlay
                        className="w-full h-full aspect-video"
                        title={name}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(null)}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label={t('common.close')}
                    >
                      <IconCross className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-[var(--theme-text)]">{name}</p>
                </div>
              )
            })()}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {withUrl.map((v, idx) => {
              const name = v.name || t('media.trailerNumber', { number: idx + 1 })
              const isExpanded = expandedIndex === idx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className={`flex-shrink-0 w-full text-left rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-space_indigo-500 focus:ring-offset-2 group/prev ${isExpanded ? 'ring-2 ring-space_indigo-500 ring-offset-2' : ''}`}
                >
                  <VideoThumbnail
                    videoUrl={v.url}
                    title={name}
                    className="aspect-video rounded-xl hover:opacity-90 transition-opacity group-hover/prev:opacity-90"
                  />
                  <p className="text-xs sm:text-sm text-[var(--theme-text-muted)] mt-1 truncate">{name}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
