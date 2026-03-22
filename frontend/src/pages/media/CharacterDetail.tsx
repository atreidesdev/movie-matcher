import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil } from 'lucide-react'
import { IconFavorite, IconCross } from '@/components/icons'
import { charactersApi, type CharacterAppearances } from '@/api/characters'
import { favoritesApi } from '@/api/favorites'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { motion } from 'framer-motion'
import { usePageTitle } from '@/hooks/usePageTitle'
import CharacterEditModal from '@/components/CharacterEditModal'
import MediaCard from '@/components/MediaCard'
import PhotoGallery from '@/components/ui/PhotoGallery'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import type { Character, Media } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'

const APPEARANCE_SECTIONS: { key: keyof CharacterAppearances; type: MediaTypeForPath; labelKey: string }[] = [
  { key: 'movies', type: 'movie', labelKey: 'nav.movies' },
  { key: 'tvSeries', type: 'tv-series', labelKey: 'nav.tvSeries' },
  { key: 'animeSeries', type: 'anime', labelKey: 'nav.anime' },
  { key: 'animeMovies', type: 'anime-movies', labelKey: 'nav.animeMovies' },
  { key: 'cartoonSeries', type: 'cartoon-series', labelKey: 'nav.cartoonSeries' },
  { key: 'cartoonMovies', type: 'cartoon-movies', labelKey: 'nav.cartoonMovies' },
  { key: 'games', type: 'game', labelKey: 'nav.games' },
]

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [character, setCharacter] = useState<Character | null>(null)
  const [appearances, setAppearances] = useState<CharacterAppearances | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null)
  const canEdit = user && (user.role === 'content_creator' || user.role === 'admin' || user.role === 'owner')

  usePageTitle(character?.name || null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    const numId = parseInt(id, 10)
    setLoading(true)
    Promise.all([charactersApi.getById(numId), charactersApi.getAppearances(numId)])
      .then(([ch, app]) => {
        setCharacter(ch)
        setAppearances(app)
      })
      .catch(() => {
        setCharacter(null)
        setAppearances(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    const numId = parseInt(id, 10)
    favoritesApi
      .getAll()
      .then((data) => {
        const list = data.characters ?? []
        const inFav = list.some((c) => (c.character?.id ?? c.characterId) === numId)
        setIsFavorite(inFav)
      })
      .catch(() => {})
  }, [user, id])

  if (loading) {
    return (
      <div className="animate-pulse max-w-2xl">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="w-32 h-48 bg-gray-200 rounded-xl mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
      </div>
    )
  }

  if (!character) {
    return (
      <div className="max-w-2xl">
        <p className="text-gray-500 mb-4">{t('common.noResults')}</p>
        <Link to="/" className="link-underline-animate inline-flex items-center gap-1 text-thistle-600">
          <ArrowLeft className="w-3.5 h-2.5" />
          {t('common.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-6">
        {character.avatar ? (
          <img
            src={getMediaAssetUrl(character.avatar)}
            alt={character.name}
            className="w-32 h-48 object-cover rounded-xl flex-shrink-0"
          />
        ) : (
          <div className="w-32 h-48 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400 text-sm">
            No image
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{character.name}</h1>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="btn-edit p-2 rounded-lg"
                aria-label={t('common.edit')}
                title={t('common.edit')}
              >
                <Pencil className="w-6 h-6" />
              </button>
            )}
            {user && (
              <button
                type="button"
                onClick={async () => {
                  const numId = parseInt(id!, 10)
                  const name = character?.name ?? ''
                  try {
                    if (isFavorite) {
                      await favoritesApi.remove('characters', numId)
                      setIsFavorite(false)
                      useToastStore.getState().show({
                        title: t('toast.removedFromFavorites'),
                        description: t('toast.removedFromFavoritesEntity', { name: name || id }),
                      })
                    } else {
                      await favoritesApi.add('characters', numId)
                      setIsFavorite(true)
                      useToastStore.getState().show({
                        title: t('toast.addedToFavorites'),
                        description: t('toast.addedToFavoritesEntity', { name: name || id }),
                      })
                    }
                  } catch {}
                }}
                className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-soft_blush-500 hover:text-soft_blush-600' : 'text-gray-400 hover:bg-lavender-500 hover:text-soft_blush-400'}`}
                aria-label={t('nav.favorites')}
                title={t('nav.favorites')}
              >
                <IconFavorite className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          {character.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">{t('character.description')}</h2>
              <p className="text-gray-600 leading-relaxed">{character.description}</p>
            </div>
          )}
        </div>
      </div>

      {Array.isArray(character.images) &&
        character.images.length > 0 &&
        (() => {
          const getUrl = (img: unknown) =>
            img && typeof img === 'object' && 'url' in img && typeof (img as { url: unknown }).url === 'string'
              ? (img as { url: string }).url
              : typeof img === 'string'
                ? img
                : null
          const getCaption = (img: unknown) =>
            img &&
            typeof img === 'object' &&
            'caption' in img &&
            typeof (img as { caption: unknown }).caption === 'string'
              ? (img as { caption: string }).caption
              : ''
          const getNum = (img: unknown, key: 'width' | 'height') =>
            img && typeof img === 'object' && key in img && typeof (img as Record<string, unknown>)[key] === 'number'
              ? (img as Record<string, number>)[key]
              : undefined
          const items = character.images
            .map((img) => ({
              url: getUrl(img),
              caption: getCaption(img),
              width: getNum(img, 'width'),
              height: getNum(img, 'height'),
            }))
            .filter((x): x is { url: string; caption: string; width?: number; height?: number } => x.url != null)
          if (items.length === 0) return null
          return (
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-3">{t('media.gallery')}</h2>
              <PhotoGallery images={items} getImageUrl={getMediaAssetUrl} onPhotoClick={setGalleryLightboxIndex} />
              {galleryLightboxIndex !== null && items[galleryLightboxIndex] && (
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
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    aria-label={t('common.close')}
                  >
                    <IconCross className="w-6 h-6" />
                  </button>
                  <div
                    className="relative max-w-[100vw] max-h-[100vh] flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={getMediaAssetUrl(items[galleryLightboxIndex].url)}
                      alt={items[galleryLightboxIndex].caption || ''}
                      className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    />
                    {items[galleryLightboxIndex].caption ? (
                      <p className="mt-2 px-4 text-center text-sm text-white/90">
                        {items[galleryLightboxIndex].caption}
                      </p>
                    ) : null}
                    {items.length > 1 && (
                      <>
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/50 px-3 py-1 rounded-full">
                          {galleryLightboxIndex + 1} / {items.length}
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
                        {galleryLightboxIndex < items.length - 1 && (
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
                </div>
              )}
            </section>
          )
        })()}

      {appearances && (
        <section className="mt-8">
          <div className="space-y-8">
            {APPEARANCE_SECTIONS.map(({ key, type, labelKey }) => {
              const items = (appearances[key] as Media[] | undefined) ?? []
              if (items.length === 0) return null
              const sorted = [...items].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
              return (
                <div key={key}>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{t(labelKey)}</h3>
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sorted.map((media) => (
                      <motion.div key={`${type}-${media.id}`} variants={staggerItemVariants}>
                        <MediaCard media={media} type={type} compact />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <CharacterEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        character={character}
        onSaved={(updated) => setCharacter(updated)}
      />
    </div>
  )
}
