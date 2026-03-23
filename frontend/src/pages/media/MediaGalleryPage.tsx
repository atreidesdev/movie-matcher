import { mediaApi } from '@/api/media'
import { IconCross } from '@/components/icons'
import type { Media } from '@/types'
import { getMediaTitle } from '@/utils/localizedText'
import { type MediaTypeForPath, getMediaAssetUrl, getMediaPath } from '@/utils/mediaPaths'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

interface MediaGalleryPageProps {
  type: MediaTypeForPath
}

function getImageUrl(img: unknown): string | null {
  if (typeof img === 'string') return img || null
  if (!img || typeof img !== 'object' || !('url' in img)) return null
  const u = (img as { url: unknown }).url
  return typeof u === 'string' ? u : null
}

function getImageCaption(img: unknown): string {
  if (!img || typeof img !== 'object' || !('caption' in img)) return ''
  const c = (img as { caption: unknown }).caption
  return typeof c === 'string' ? c : ''
}

interface GalleryItem {
  url: string
  caption: string
}

export default function MediaGalleryPage({ type }: MediaGalleryPageProps) {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const numId = id ? Number.parseInt(id, 10) : 0
  const images = media && Array.isArray(media.images) ? media.images : []
  const galleryItems: GalleryItem[] = images
    .map((img) => {
      const url = getImageUrl(img)
      return url ? { url, caption: getImageCaption(img) } : null
    })
    .filter((x): x is GalleryItem => x != null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const openLightbox = (idx: number) => setLightboxIndex(idx)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (lightboxIndex == null) return
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1)
      if (e.key === 'ArrowRight' && lightboxIndex < galleryItems.length - 1) setLightboxIndex(lightboxIndex + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxIndex, galleryItems.length, closeLightbox])

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
        <p className="text-gray-500">{t('common.loading')}</p>
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
        <h1 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.gallery')}</h1>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : galleryItems.length === 0 ? (
        <p className="text-gray-500">{t('media.noGallery')}</p>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4" style={{ columnFill: 'balance' }}>
          {galleryItems.map((item, idx) => (
            <figure key={idx} className="break-inside-avoid mb-4">
              <button
                type="button"
                onClick={() => openLightbox(idx)}
                className="block w-full rounded-xl overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-space_indigo-500 text-left"
              >
                <img
                  src={getMediaAssetUrl(item.url)}
                  alt={item.caption || ''}
                  className="w-full h-auto align-top pointer-events-none"
                  loading="lazy"
                />
              </button>
              {item.caption ? (
                <figcaption className="mt-1.5 text-sm text-gray-600 line-clamp-2">{item.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )}

      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={t('media.gallery')}
        >
          <button
            type="button"
            onClick={closeLightbox}
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
              src={getMediaAssetUrl(galleryItems[lightboxIndex].url)}
              alt={galleryItems[lightboxIndex].caption || ''}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={closeLightbox}
            />
            {galleryItems[lightboxIndex].caption ? (
              <p className="mt-2 px-4 text-center text-sm text-white/90 max-w-2xl">
                {galleryItems[lightboxIndex].caption}
              </p>
            ) : null}
            {galleryItems.length > 1 && (
              <>
                {lightboxIndex > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(lightboxIndex - 1)
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    aria-label={t('common.prev')}
                  >
                    <ArrowLeft className="w-5 h-4" />
                  </button>
                )}
                {lightboxIndex < galleryItems.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(lightboxIndex + 1)
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
        </div>
      )}
    </div>
  )
}
