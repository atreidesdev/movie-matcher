import VideoPlayer from '@/components/VideoPlayer'
import VideoThumbnail from '@/components/VideoThumbnail'
import { IconCross } from '@/components/icons'
import PhotoGallery from '@/components/ui/PhotoGallery'
import type { Media } from '@/types'
import { getMediaTitle } from '@/utils/localizedText'
import { getMediaAssetUrl, getMediaGalleryPath, getMediaTrailersPath } from '@/utils/mediaPaths'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { getVideoStreamQualitySources, getVideoStreamUrl, getYouTubeEmbedUrl } from '@/utils/videoUtils'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface MediaDetailGallerySectionProps {
  type: MediaTypeForPath
  media: Media
  mediaVideos: { url: string; name?: string | null }[]
  trailerLightboxIndex: number | null
  setTrailerLightboxIndex: (index: number | null) => void
  previewImages: { url: string; caption?: string | null }[]
  galleryLightboxIndex: number | null
  setGalleryLightboxIndex: (index: number | null) => void
  locale: string
  t: (key: string, params?: Record<string, unknown>) => string
}

export function MediaDetailGallerySection({
  type,
  media,
  mediaVideos,
  trailerLightboxIndex,
  setTrailerLightboxIndex,
  previewImages,
  galleryLightboxIndex,
  setGalleryLightboxIndex,
  locale,
  t,
}: MediaDetailGallerySectionProps) {
  const mediaTitle = getMediaTitle(media, locale) || media.title

  return (
    <>
      {mediaVideos.length > 0 &&
        (() => {
          const currentUrl =
            trailerLightboxIndex !== null && mediaVideos[trailerLightboxIndex]
              ? mediaVideos[trailerLightboxIndex].url
              : null
          const embedUrl = currentUrl ? getYouTubeEmbedUrl(currentUrl) : null
          const isOwnVideo = currentUrl && !currentUrl.startsWith('http')
          const videoSrc =
            currentUrl && !embedUrl
              ? currentUrl.startsWith('http')
                ? currentUrl
                : getVideoStreamUrl(currentUrl)
              : null
          const qualitySources = videoSrc && isOwnVideo ? getVideoStreamQualitySources(currentUrl, t) : []
          return (
            <div className="mb-6">
              <Link
                to={getMediaTrailersPath(type, media.id, mediaTitle)}
                className="text-xl font-semibold mb-3 block title-hover-theme transition-colors focus:outline-none"
              >
                {t('media.trailers')}
              </Link>
              <div className="flex flex-wrap gap-3">
                {mediaVideos.map((v, idx) => {
                  const name = v.name || t('media.trailerNumber', { number: idx + 1 })
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTrailerLightboxIndex(idx)}
                      className="flex-shrink-0 w-28 sm:w-32 group/prev text-left"
                    >
                      <VideoThumbnail
                        videoUrl={v.url}
                        title={name}
                        className="aspect-video rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] group-hover/prev:opacity-90"
                      />
                      <p className="text-xs text-[var(--theme-text-muted)] mt-1 truncate">{name}</p>
                    </button>
                  )
                })}
              </div>
              {trailerLightboxIndex !== null && (embedUrl || videoSrc) && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
                  onClick={() => setTrailerLightboxIndex(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-label={t('media.trailers')}
                >
                  <button
                    type="button"
                    onClick={() => setTrailerLightboxIndex(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label={t('common.close')}
                  >
                    <IconCross className="w-6 h-6" />
                  </button>
                  <div
                    className="relative w-full max-w-4xl aspect-video flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={mediaVideos[trailerLightboxIndex]?.name || t('media.trailers')}
                        className="w-full h-full max-h-[85vh] rounded-lg shadow-2xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : videoSrc ? (
                      <VideoPlayer
                        src={videoSrc}
                        sources={qualitySources.length > 0 ? qualitySources : undefined}
                        autoPlay
                        className="w-full max-h-[85vh] rounded-lg shadow-2xl"
                        title={mediaVideos[trailerLightboxIndex]?.name || t('media.trailers')}
                      />
                    ) : null}
                    {mediaVideos.length > 1 && (
                      <>
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/50 px-3 py-1 rounded-full whitespace-nowrap z-10">
                          {trailerLightboxIndex + 1} / {mediaVideos.length}
                        </span>
                        {trailerLightboxIndex > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTrailerLightboxIndex(trailerLightboxIndex - 1)
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            aria-label={t('common.prev')}
                          >
                            <ArrowLeft className="w-5 h-4" />
                          </button>
                        )}
                        {trailerLightboxIndex < mediaVideos.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTrailerLightboxIndex(trailerLightboxIndex + 1)
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white rotate-180"
                            aria-label={t('common.next')}
                          >
                            <ArrowLeft className="w-5 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <Link
                    to={getMediaTrailersPath(type, media.id, mediaTitle)}
                    className="absolute bottom-4 right-4 z-10 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('media.trailersOnPage')}
                  </Link>
                </div>
              )}
            </div>
          )
        })()}

      {previewImages.length > 0 && (
        <div className="mb-6">
          <Link
            to={getMediaGalleryPath(type, media.id, mediaTitle)}
            className="text-xl font-semibold mb-3 block title-hover-theme transition-colors focus:outline-none"
          >
            {t('media.gallery')}
          </Link>
          <PhotoGallery images={previewImages} getImageUrl={getMediaAssetUrl} onPhotoClick={setGalleryLightboxIndex} />
          {galleryLightboxIndex !== null && previewImages[galleryLightboxIndex] && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
              onClick={() => setGalleryLightboxIndex(null)}
              role="dialog"
              aria-modal="true"
              aria-label={t('media.gallery')}
            >
              <button
                type="button"
                onClick={() => setGalleryLightboxIndex(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label={t('common.close')}
              >
                <IconCross className="w-6 h-6" />
              </button>
              <div
                className="relative max-w-[100vw] max-h-[100vh] flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getMediaAssetUrl(previewImages[galleryLightboxIndex].url)}
                  alt={previewImages[galleryLightboxIndex].caption || ''}
                  className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                  onClick={() => setGalleryLightboxIndex(null)}
                />
                {previewImages[galleryLightboxIndex].caption ? (
                  <p className="mt-2 px-4 text-center text-sm text-white/90 max-w-2xl">
                    {previewImages[galleryLightboxIndex].caption}
                  </p>
                ) : null}
                {previewImages.length > 1 && (
                  <>
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/50 px-3 py-1 rounded-full">
                      {galleryLightboxIndex + 1} / {previewImages.length}
                    </span>
                    {galleryLightboxIndex > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setGalleryLightboxIndex(galleryLightboxIndex - 1)
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        aria-label={t('common.prev')}
                      >
                        <ArrowLeft className="w-5 h-4" />
                      </button>
                    )}
                    {galleryLightboxIndex < previewImages.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setGalleryLightboxIndex(galleryLightboxIndex + 1)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white rotate-180"
                        aria-label={t('common.next')}
                      >
                        <ArrowLeft className="w-5 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <Link
                to={getMediaGalleryPath(type, media.id, mediaTitle)}
                className="absolute bottom-4 right-4 z-10 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {t('media.galleryShowAll', { count: (media as { images?: unknown[] }).images?.length ?? 0 })}
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
