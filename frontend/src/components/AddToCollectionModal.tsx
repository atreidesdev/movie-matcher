import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCollection } from '@/components/icons'
import { IconCross } from '@/components/icons'
import { collectionsApi } from '@/api/collections'
import { Collection } from '@/types'
import { MediaTypeForPath } from '@/utils/mediaPaths'
import { isCollectionSupportedForType } from '@/utils/collections'
import { useToastStore } from '@/store/toastStore'

type AddMethodFn = (collectionId: number, mediaId: number) => Promise<void> | null
type RemoveMethodFn = (collectionId: number, mediaId: number) => Promise<void> | null

const ADD_METHOD: Record<MediaTypeForPath, AddMethodFn> = {
  movie: (cid, mid) => collectionsApi.addMovie(cid, mid),
  'tv-series': (cid, mid) => collectionsApi.addTvSeries(cid, mid),
  anime: (cid, mid) => collectionsApi.addAnime(cid, mid),
  'cartoon-series': (cid, mid) => collectionsApi.addCartoonSeries(cid, mid),
  'cartoon-movies': (cid, mid) => collectionsApi.addCartoonMovie(cid, mid),
  'anime-movies': (cid, mid) => collectionsApi.addAnimeMovie(cid, mid),
  game: (cid, mid) => collectionsApi.addGame(cid, mid),
  manga: (cid, mid) => collectionsApi.addManga(cid, mid),
  book: (cid, mid) => collectionsApi.addBook(cid, mid),
  'light-novel': (cid, mid) => collectionsApi.addLightNovel(cid, mid),
}

const REMOVE_METHOD: Record<MediaTypeForPath, RemoveMethodFn> = {
  movie: (cid, mid) => collectionsApi.removeMovie(cid, mid),
  'tv-series': (cid, mid) => collectionsApi.removeTvSeries(cid, mid),
  anime: (cid, mid) => collectionsApi.removeAnime(cid, mid),
  'cartoon-series': (cid, mid) => collectionsApi.removeCartoonSeries(cid, mid),
  'cartoon-movies': (cid, mid) => collectionsApi.removeCartoonMovie(cid, mid),
  'anime-movies': (cid, mid) => collectionsApi.removeAnimeMovie(cid, mid),
  game: (cid, mid) => collectionsApi.removeGame(cid, mid),
  manga: (cid, mid) => collectionsApi.removeManga(cid, mid),
  book: (cid, mid) => collectionsApi.removeBook(cid, mid),
  'light-novel': (cid, mid) => collectionsApi.removeLightNovel(cid, mid),
}

function collectionContainsMedia(c: Collection, mediaType: MediaTypeForPath, mediaId: number): boolean {
  switch (mediaType) {
    case 'movie':
      return c.movies?.some((m) => m.movieId === mediaId) ?? false
    case 'tv-series':
      return c.tvSeries?.some((m) => m.tvSeriesId === mediaId) ?? false
    case 'anime':
      return c.animeSeries?.some((m) => m.animeSeriesId === mediaId) ?? false
    case 'game':
      return c.games?.some((m) => m.gameId === mediaId) ?? false
    case 'manga':
      return c.manga?.some((m) => m.mangaId === mediaId) ?? false
    case 'book':
      return c.books?.some((m) => m.bookId === mediaId) ?? false
    case 'light-novel':
      return c.lightNovels?.some((m) => m.lightNovelId === mediaId) ?? false
    case 'cartoon-series':
      return c.cartoonSeries?.some((m) => m.cartoonSeriesId === mediaId) ?? false
    case 'cartoon-movies':
      return c.cartoonMovies?.some((m) => m.cartoonMovieId === mediaId) ?? false
    case 'anime-movies':
      return c.animeMovies?.some((m) => m.animeMovieId === mediaId) ?? false
    default:
      return false
  }
}

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  mediaType: MediaTypeForPath
  mediaId: number
  mediaTitle?: string
}

export default function AddToCollectionModal({
  isOpen,
  onClose,
  mediaType,
  mediaId,
  mediaTitle,
}: AddToCollectionModalProps) {
  const { t } = useTranslation()
  const [collections, setCollections] = useState<Collection[]>([])
  const [inCollectionIds, setInCollectionIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setAddingId(null)
    setInCollectionIds(new Set())
    setLoading(true)
    collectionsApi
      .getList()
      .then(async (list) => {
        setCollections(list)
        if (list.length === 0) {
          setLoading(false)
          return
        }
        const full = await Promise.all(list.map((c) => collectionsApi.getOne(c.id)))
        const ids = new Set<number>()
        full.forEach((c) => {
          if (collectionContainsMedia(c, mediaType, mediaId)) ids.add(c.id)
        })
        setInCollectionIds(ids)
      })
      .catch(() => {
        setCollections([])
      })
      .finally(() => setLoading(false))
  }, [isOpen, mediaType, mediaId])

  const addMethod = ADD_METHOD[mediaType]
  const removeMethod = REMOVE_METHOD[mediaType]

  const handleToggle = async (collectionId: number) => {
    if (!addMethod || !removeMethod) return
    const inCollection = inCollectionIds.has(collectionId)
    const collection = collections.find((c) => c.id === collectionId)
    const collectionName = collection?.name ?? ''
    setAddingId(collectionId)
    setError(null)
    try {
      if (inCollection) {
        await removeMethod(collectionId, mediaId)
        setInCollectionIds((prev) => {
          const next = new Set(prev)
          next.delete(collectionId)
          return next
        })
        useToastStore.getState().show({
          title: t('toast.removedFromCollection'),
          description: collectionName || t('toast.removedFromCollectionDescription'),
        })
      } else {
        await addMethod(collectionId, mediaId)
        setInCollectionIds((prev) => new Set([...prev, collectionId]))
        useToastStore.getState().show({
          title: t('toast.addedToCollection'),
          description: collectionName || t('toast.addedToCollectionDescription'),
        })
      }
    } catch (e) {
      setError(inCollection ? t('collections.removeError') : t('collections.addError'))
    } finally {
      setAddingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden />
      <div className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col modal-panel rounded-2xl shadow-2xl border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0 bg-theme-bg-alt">
          <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
            <IconCollection className="w-5 h-5 text-space_indigo-600" />
            {t('media.addToCollection')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-theme-bg-alt">
          {mediaTitle && (
            <p className="text-sm text-theme-muted mb-4 truncate" title={mediaTitle}>
              {t('collections.addTitleToCollection', { title: mediaTitle })}
            </p>
          )}
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {loading ? (
            <p className="text-theme-muted text-sm">{t('common.loading')}</p>
          ) : collections.length === 0 ? (
            <p className="text-theme-muted text-sm">{t('collections.noCollections')}</p>
          ) : (
            <ul className="space-y-2">
              {collections.map((c) => {
                const inCollection = inCollectionIds.has(c.id)
                const isBusy = addingId === c.id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleToggle(c.id)}
                      disabled={addingId !== null}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-colors disabled:opacity-50 ${
                        inCollection
                          ? 'bg-lavender-500/40 border border-lavender-400 text-theme hover:bg-lavender-500/60'
                          : 'bg-lavender-500/20 border border-lavender-400/50 text-theme hover:border-lavender-400 hover:bg-lavender-500/40'
                      }`}
                    >
                      <span className="font-medium truncate">{c.name}</span>
                      {isBusy ? (
                        <span className="text-xs text-theme-muted shrink-0">{t('common.loading')}...</span>
                      ) : inCollection ? (
                        <span className="text-xs font-medium text-space_indigo-600 shrink-0">
                          {t('collections.inCollection')}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
