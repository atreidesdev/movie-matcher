import { collectionsApi } from '@/api/collections'
import BookmarkButton from '@/components/BookmarkButton'
import CollectionSearchModal from '@/components/CollectionSearchModal'
import MediaCard from '@/components/MediaCard'
import { IconCross, IconPerson, IconSearch } from '@/components/icons'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { Collection } from '@/types'
import type { ListStatus } from '@/types'
import type { Media } from '@/types'
import { type MediaTypeForPath, getMediaAssetUrl } from '@/utils/mediaPaths'
import { motion } from 'framer-motion'
import { Pencil, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

type MediaEntry = {
  type: MediaTypeForPath
  id: number
  title: string
  poster?: string
  rating?: number
  listStatus?: ListStatus
}
type PendingRemoved = { type: MediaTypeForPath; id: number }
type PendingAdded = { type: MediaTypeForPath; id: number; title: string; poster?: string }

const MEDIA_TYPE_TO_NAV_KEY: Record<MediaTypeForPath, string> = {
  movie: 'movies',
  'tv-series': 'tvSeries',
  anime: 'anime',
  game: 'games',
  manga: 'manga',
  book: 'books',
  'light-novel': 'lightNovels',
  'cartoon-series': 'cartoonSeries',
  'cartoon-movies': 'cartoonMovies',
  'anime-movies': 'animeMovies',
}

type Section = { type: MediaTypeForPath; labelKey: string; entries: MediaEntry[] }

function toEntry<T extends { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus }>(
  type: MediaTypeForPath,
  item: T,
): MediaEntry {
  const r = item.rating != null ? Number(item.rating) : undefined
  const ratingDisplay =
    r != null
      ? r <= 10
        ? Math.min(100, Math.max(1, Math.round(r * 10)))
        : Math.min(100, Math.max(1, Math.round(r)))
      : undefined
  return {
    type,
    id: item.id,
    title: item.title,
    poster: item.poster,
    rating: ratingDisplay,
    listStatus: item.listStatus as ListStatus | undefined,
  }
}
function collectSections(c: Collection): Section[] {
  const sections: Section[] = []
  if (c.movies?.length) {
    const entries: MediaEntry[] = c.movies
      .filter((e) => e.movie)
      .map((e) =>
        toEntry(
          'movie',
          e.movie as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'movie', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.movie}`, entries })
  }
  if (c.tvSeries?.length) {
    const entries: MediaEntry[] = c.tvSeries
      .filter((e) => e.tvSeries)
      .map((e) =>
        toEntry(
          'tv-series',
          e.tvSeries as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'tv-series', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['tv-series']}`, entries })
  }
  if (c.animeSeries?.length) {
    const entries: MediaEntry[] = c.animeSeries
      .filter((e) => e.animeSeries)
      .map((e) =>
        toEntry(
          'anime',
          e.animeSeries as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'anime', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.anime}`, entries })
  }
  if (c.games?.length) {
    const entries: MediaEntry[] = c.games
      .filter((e) => e.game)
      .map((e) =>
        toEntry(
          'game',
          e.game as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'game', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.game}`, entries })
  }
  if (c.manga?.length) {
    const entries: MediaEntry[] = c.manga
      .filter((e) => e.manga)
      .map((e) =>
        toEntry(
          'manga',
          e.manga as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'manga', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.manga}`, entries })
  }
  if (c.books?.length) {
    const entries: MediaEntry[] = c.books
      .filter((e) => e.book)
      .map((e) =>
        toEntry(
          'book',
          e.book as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'book', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.book}`, entries })
  }
  if (c.lightNovels?.length) {
    const entries: MediaEntry[] = c.lightNovels
      .filter((e) => e.lightNovel)
      .map((e) =>
        toEntry(
          'light-novel',
          e.lightNovel as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'light-novel', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['light-novel']}`, entries })
  }
  if (c.cartoonSeries?.length) {
    const entries: MediaEntry[] = c.cartoonSeries
      .filter((e) => e.cartoonSeries)
      .map((e) =>
        toEntry(
          'cartoon-series',
          e.cartoonSeries as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'cartoon-series', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['cartoon-series']}`, entries })
  }
  if (c.cartoonMovies?.length) {
    const entries: MediaEntry[] = c.cartoonMovies
      .filter((e) => e.cartoonMovie)
      .map((e) =>
        toEntry(
          'cartoon-movies',
          e.cartoonMovie as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'cartoon-movies', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['cartoon-movies']}`, entries })
  }
  if (c.animeMovies?.length) {
    const entries: MediaEntry[] = c.animeMovies
      .filter((e) => e.animeMovie)
      .map((e) =>
        toEntry(
          'anime-movies',
          e.animeMovie as { id: number; title: string; poster?: string; rating?: number; listStatus?: ListStatus },
        ),
      )
    sections.push({ type: 'anime-movies', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['anime-movies']}`, entries })
  }
  return sections
}

const EDITABLE_TYPES: MediaTypeForPath[] = ['movie', 'anime', 'game', 'manga', 'book', 'light-novel']

function canRemoveFromCollection(type: MediaTypeForPath): boolean {
  return EDITABLE_TYPES.includes(type)
}

function entryToMedia(entry: MediaEntry): Media {
  return {
    id: entry.id,
    title: entry.title,
    poster: entry.poster,
    rating: entry.rating,
    releaseDate: undefined,
    season: undefined,
    genres: [],
    listStatus: entry.listStatus,
  }
}

/** Секции с учётом отложенных удалений и добавлений (только для отображения в режиме редактирования). */
function getEffectiveSections(
  sections: Section[],
  pendingRemoved: PendingRemoved[],
  pendingAdded: PendingAdded[],
): Section[] {
  const removedSet = new Set(pendingRemoved.map((r) => `${r.type}-${r.id}`))
  const filtered = sections.map((sec) => ({
    ...sec,
    entries: sec.entries.filter((e) => !removedSet.has(`${e.type}-${e.id}`)),
  }))
  const byType = new Map<MediaTypeForPath, MediaEntry[]>()
  for (const sec of filtered) {
    if (sec.entries.length) byType.set(sec.type, [...(byType.get(sec.type) ?? []), ...sec.entries])
  }
  for (const a of pendingAdded) {
    if (!EDITABLE_TYPES.includes(a.type)) continue
    const entries = byType.get(a.type) ?? []
    if (entries.some((e) => e.type === a.type && e.id === a.id)) continue
    byType.set(a.type, [...entries, { type: a.type, id: a.id, title: a.title, poster: a.poster }])
  }
  const result: Section[] = []
  const order: MediaTypeForPath[] = [
    'movie',
    'tv-series',
    'anime',
    'game',
    'manga',
    'book',
    'light-novel',
    'cartoon-series',
    'cartoon-movies',
    'anime-movies',
  ]
  for (const type of order) {
    const entries = byType.get(type)
    if (!entries?.length) continue
    const labelKey = MEDIA_TYPE_TO_NAV_KEY[type] ? `nav.${MEDIA_TYPE_TO_NAV_KEY[type]}` : `nav.${type}`
    result.push({ type, labelKey, entries })
  }
  return result
}

async function removeFromCollection(collectionId: number, type: MediaTypeForPath, mediaId: number): Promise<void> {
  switch (type) {
    case 'movie':
      await collectionsApi.removeMovie(collectionId, mediaId)
      break
    case 'tv-series':
      await collectionsApi.removeTvSeries(collectionId, mediaId)
      break
    case 'anime':
      await collectionsApi.removeAnime(collectionId, mediaId)
      break
    case 'cartoon-series':
      await collectionsApi.removeCartoonSeries(collectionId, mediaId)
      break
    case 'cartoon-movies':
      await collectionsApi.removeCartoonMovie(collectionId, mediaId)
      break
    case 'anime-movies':
      await collectionsApi.removeAnimeMovie(collectionId, mediaId)
      break
    case 'game':
      await collectionsApi.removeGame(collectionId, mediaId)
      break
    case 'manga':
      await collectionsApi.removeManga(collectionId, mediaId)
      break
    case 'book':
      await collectionsApi.removeBook(collectionId, mediaId)
      break
    case 'light-novel':
      await collectionsApi.removeLightNovel(collectionId, mediaId)
      break
    default: {
      const _exhaustive: never = type
      void _exhaustive
      return
    }
  }
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [pendingRemoved, setPendingRemoved] = useState<PendingRemoved[]>([])
  const [pendingAdded, setPendingAdded] = useState<PendingAdded[]>([])
  const [saving, setSaving] = useState(false)

  const loadCollection = useCallback(() => {
    if (!id) return
    collectionsApi
      .getOne(Number.parseInt(id, 10))
      .then(setCollection)
      .catch(() => setCollection(null))
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    collectionsApi
      .getOne(Number.parseInt(id, 10))
      .then(setCollection)
      .catch(() => setCollection(null))
      .finally(() => setLoading(false))
  }, [id])

  const owner = collection?.owner ?? collection?.user
  const isOwner = !!user && !!owner && owner.id === user.id
  const baseSections = collection ? collectSections(collection) : []
  const sections = useMemo(
    () => (editMode ? getEffectiveSections(baseSections, pendingRemoved, pendingAdded) : baseSections),
    [editMode, baseSections, pendingRemoved, pendingAdded],
  )
  const collectionId = id ? Number.parseInt(id, 10) : 0
  const hasPendingChanges = pendingRemoved.length > 0 || pendingAdded.length > 0

  const handleRemove = (type: MediaTypeForPath, mediaId: number) => {
    if (!canRemoveFromCollection(type)) return
    if (editMode) {
      setPendingRemoved((prev) => [...prev, { type, id: mediaId }])
      return
    }
    if (!collectionId) return
    removeFromCollection(collectionId, type, mediaId)
      .then(() => {
        useToastStore
          .getState()
          .show({ title: t('collections.removedFromCollection'), description: collection?.name ?? '' })
        loadCollection()
      })
      .catch(() => useToastStore.getState().show({ title: t('collections.addError'), description: '' }))
  }

  const handleAddToPending = useCallback((type: MediaTypeForPath, mediaId: number, title: string, poster?: string) => {
    setPendingAdded((prev) => {
      if (prev.some((a) => a.type === type && a.id === mediaId)) return prev
      return [...prev, { type, id: mediaId, title, poster }]
    })
  }, [])

  const handleSave = async () => {
    if (!collectionId || !hasPendingChanges) return
    setSaving(true)
    try {
      for (const r of pendingRemoved) {
        await removeFromCollection(collectionId, r.type, r.id)
      }
      for (const a of pendingAdded) {
        switch (a.type) {
          case 'movie':
            await collectionsApi.addMovie(collectionId, a.id)
            break
          case 'anime':
            await collectionsApi.addAnime(collectionId, a.id)
            break
          case 'game':
            await collectionsApi.addGame(collectionId, a.id)
            break
          case 'manga':
            await collectionsApi.addManga(collectionId, a.id)
            break
          case 'book':
            await collectionsApi.addBook(collectionId, a.id)
            break
          case 'light-novel':
            await collectionsApi.addLightNovel(collectionId, a.id)
            break
          default:
            break
        }
      }
      useToastStore.getState().show({ title: t('common.success'), description: '' })
      setPendingRemoved([])
      setPendingAdded([])
      setEditMode(false)
      loadCollection()
    } catch {
      useToastStore.getState().show({ title: t('collections.addError'), description: '' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setPendingRemoved([])
    setPendingAdded([])
    setEditMode(false)
    loadCollection()
  }

  if (loading) return <p className="text-theme-muted">{t('common.loading')}</p>
  if (!collection) return <p className="text-theme-muted">{t('common.noResults')}</p>

  const ownerName = owner?.name ?? owner?.username ?? null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10 mt-6 space-y-6">
      {owner && (
        <div className="collection-detail-owner flex items-center gap-3 p-3 rounded-xl border border-theme">
          <Link
            to={owner.username ? `/user/${owner.username}` : '#'}
            className="flex items-center gap-3 min-w-0 hover:opacity-90"
          >
            <div className="w-10 h-10 rounded-full bg-theme-bg-alt flex items-center justify-center shrink-0 overflow-hidden">
              {owner.avatar ? (
                <img src={getMediaAssetUrl(owner.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <IconPerson className="w-5 h-5 text-theme-muted" />
              )}
            </div>
            <span className="collection-detail-owner-name font-medium truncate">
              {ownerName || t('profile.collectionAuthor')}
            </span>
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">{collection.name}</h1>
        {isOwner && (
          <>
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !hasPendingChanges}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-space_indigo-600 text-lavender-500 hover:bg-space_indigo-700"
                >
                  <Save className="w-4 h-4" />
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="collection-detail-btn collection-detail-btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  <IconCross className="w-4 h-4" />
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors border bg-space_indigo-600 text-lavender-500 hover:bg-space_indigo-700 border-space_indigo-500/50"
                >
                  <IconSearch className="w-4 h-4" />
                  {t('collections.addBySearch')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors bg-space_indigo-600 text-lavender-500 hover:bg-space_indigo-700"
              >
                <Pencil className="w-4 h-4" />
                {t('collections.edit')}
              </button>
            )}
          </>
        )}
        {!isOwner && user && collectionId > 0 && <BookmarkButton targetType="collection" targetId={collectionId} />}
      </div>
      {collection.description && <p className="text-theme-muted">{collection.description}</p>}

      {sections.length > 0 && (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.type}>
              <h3 className="collection-section-title text-lg font-medium mb-3">{t(section.labelKey)}</h3>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 min-[1920px]:grid-cols-6 gap-4"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {section.entries.map((entry) => {
                  const entryKey = `${entry.type}-${entry.id}`
                  const showRemove = editMode && isOwner && canRemoveFromCollection(entry.type)
                  return (
                    <motion.div key={entryKey} variants={staggerItemVariants}>
                      <MediaCard
                        media={entryToMedia(entry)}
                        type={entry.type}
                        listStatus={entry.listStatus}
                        showGenres={false}
                        onRemove={
                          showRemove
                            ? (e) => {
                                e.preventDefault()
                                handleRemove(entry.type, entry.id)
                              }
                            : undefined
                        }
                        removeButtonLabel={t('collections.removeFromCollection')}
                      />
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {editMode && sections.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-theme-muted mb-4">{t('collections.emptyInEditMode')}</p>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors bg-space_indigo-600 text-lavender-500 hover:bg-space_indigo-700"
          >
            <IconSearch className="w-4 h-4" />
            {t('collections.addBySearch')}
          </button>
        </div>
      )}

      <CollectionSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        collectionId={collectionId}
        collectionName={collection?.name}
        onAdded={loadCollection}
        onAddToPending={editMode && isOwner ? handleAddToPending : undefined}
      />
    </div>
  )
}
