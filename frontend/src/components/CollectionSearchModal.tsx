import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCross, IconSearch, IconPlus } from '@/components/icons'
import { mediaApi } from '@/api/media'
import { collectionsApi } from '@/api/collections'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { useToastStore } from '@/store/toastStore'
import type { MediaTypeForPath } from '@/utils/mediaPaths'

const COLLECTION_TYPES: MediaTypeForPath[] = ['movie', 'anime', 'game', 'manga', 'book', 'light-novel']

const MEDIA_TYPE_LABELS: Record<MediaTypeForPath, string> = {
  movie: 'nav.movies',
  anime: 'nav.anime',
  game: 'nav.games',
  manga: 'nav.manga',
  book: 'nav.books',
  'light-novel': 'nav.lightNovels',
  'tv-series': 'nav.tvSeries',
  'cartoon-series': 'nav.cartoonSeries',
  'cartoon-movies': 'nav.cartoonMovies',
  'anime-movies': 'nav.animeMovies',
}

type SearchResult = { id: number; title: string; poster?: string }

interface CollectionSearchModalProps {
  isOpen: boolean
  onClose: () => void
  collectionId: number
  /** Название коллекции для уведомления при добавлении */
  collectionName?: string
  onAdded: () => void
  /** В режиме редактирования: не вызывать API, а отдать выбранный элемент в колбэк (для последующего сохранения кнопкой). */
  onAddToPending?: (type: MediaTypeForPath, mediaId: number, title: string, poster?: string) => void
}

export default function CollectionSearchModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  onAdded,
  onAddToPending,
}: CollectionSearchModalProps) {
  const { t } = useTranslation()
  const [mediaType, setMediaType] = useState<MediaTypeForPath>('movie')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)

  const search = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setResults([])
    try {
      switch (mediaType) {
        case 'movie': {
          const res = await mediaApi.searchMovies(q, 1)
          setResults((res.data ?? []).map((m) => ({ id: m.id, title: m.title, poster: m.poster })))
          break
        }
        case 'anime': {
          const res = await mediaApi.searchAnime(q, 1)
          setResults((res.data ?? []).map((m) => ({ id: m.id, title: m.title, poster: m.poster })))
          break
        }
        case 'game': {
          const res = await mediaApi.searchGames(q, 1)
          setResults((res.data ?? []).map((m) => ({ id: m.id, title: m.title, poster: m.poster })))
          break
        }
        case 'manga': {
          const res = await mediaApi.searchManga(q, 1)
          setResults((res.data ?? []).map((m) => ({ id: m.id, title: m.title, poster: m.poster })))
          break
        }
        case 'book': {
          const res = await mediaApi.searchBooks(q, 1)
          setResults((res.data ?? []).map((m) => ({ id: m.id, title: m.title, poster: m.poster })))
          break
        }
        case 'light-novel': {
          const res = await mediaApi.searchLightNovels(q, 1)
          setResults((res.data ?? []).map((m) => ({ id: m.id, title: m.title, poster: m.poster })))
          break
        }
        default:
          setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [mediaType, query])

  const handleAdd = async (mediaId: number, title: string, poster?: string) => {
    if (onAddToPending) {
      onAddToPending(mediaType, mediaId, title, poster)
      onClose()
      return
    }
    setAddingId(mediaId)
    try {
      switch (mediaType) {
        case 'movie':
          await collectionsApi.addMovie(collectionId, mediaId)
          break
        case 'anime':
          await collectionsApi.addAnime(collectionId, mediaId)
          break
        case 'game':
          await collectionsApi.addGame(collectionId, mediaId)
          break
        case 'manga':
          await collectionsApi.addManga(collectionId, mediaId)
          break
        case 'book':
          await collectionsApi.addBook(collectionId, mediaId)
          break
        case 'light-novel':
          await collectionsApi.addLightNovel(collectionId, mediaId)
          break
        default:
          return
      }
      useToastStore.getState().show({
        title: t('toast.addedToCollection'),
        description: collectionName || t('toast.addedToCollectionDescription'),
      })
      onAdded()
      onClose()
    } catch {
      useToastStore.getState().show({
        title: t('collections.addError'),
        description: '',
      })
    } finally {
      setAddingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} aria-hidden />
      <div className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-[rgb(64,64,111)] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-space_indigo-500/50 shrink-0">
          <h2 className="text-lg font-semibold text-lavender-500 flex items-center gap-2">
            <IconSearch className="w-5 h-5" />
            {t('collections.addBySearch')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-lavender-500 hover:text-white rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            {COLLECTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mediaType === type
                    ? 'bg-lavender-600 text-white'
                    : 'bg-space_indigo-500/50 text-lavender-500 hover:bg-space_indigo-500/70'
                }`}
              >
                {t(MEDIA_TYPE_LABELS[type])}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
              placeholder={t('search.enterQuery')}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[rgb(64,64,111)]/80 border border-space_indigo-500/50 text-lavender-500 placeholder-lavender-600 focus:outline-none focus:ring-2 focus:ring-thistle-400"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-lg bg-thistle-500 text-white font-medium hover:bg-thistle-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('nav.search')}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {results.length > 0 && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl overflow-hidden border border-space_indigo-500/50 bg-space_indigo-500/30"
                >
                  <div className="aspect-[2/3] bg-gray-800 flex items-center justify-center overflow-hidden relative group">
                    {item.poster ? (
                      <img src={getMediaAssetUrl(item.poster)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lavender-600 text-sm">—</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAdd(item.id, item.title, item.poster)}
                      disabled={addingId === item.id}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      title={t('collections.add')}
                    >
                      <IconPlus className="w-8 h-8 text-white" />
                    </button>
                  </div>
                  <div className="p-2">
                    <span className="text-sm font-medium text-lavender-500 line-clamp-2 block">{item.title}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <p className="text-lavender-600 text-sm text-center py-4">{t('common.noResults')}</p>
          )}
        </div>
      </div>
    </>
  )
}
