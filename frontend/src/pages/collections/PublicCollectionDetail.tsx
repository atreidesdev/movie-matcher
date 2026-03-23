import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { publicCollectionsApi } from '@/api/collections'
import { Collection } from '@/types'
import type { ListStatus } from '@/types'
import type { Media } from '@/types'
import { type MediaTypeForPath } from '@/utils/mediaPaths'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import MediaCard from '@/components/MediaCard'

type MediaEntry = {
  type: MediaTypeForPath
  id: number
  title: string
  poster?: string
  rating?: number
  listStatus?: ListStatus
}
type Section = { type: MediaTypeForPath; labelKey: string; entries: MediaEntry[] }

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

function toEntry<
  T extends { id: number; title: string; poster?: string; rating?: number | null; listStatus?: string | null },
>(type: MediaTypeForPath, item: T): MediaEntry {
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
    listStatus: (item.listStatus as ListStatus) || undefined,
  }
}

function collectSections(c: Collection): Section[] {
  const sections: Section[] = []
  if (c.movies?.length) {
    const entries = c.movies
      .filter((e) => e.movie)
      .map((e) =>
        toEntry(
          'movie',
          e.movie as { id: number; title: string; poster?: string; rating?: number | null; listStatus?: string | null }
        )
      )
    sections.push({ type: 'movie', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.movie}`, entries })
  }
  if (c.tvSeries?.length) {
    const entries = c.tvSeries
      .filter((e) => e.tvSeries)
      .map((e) =>
        toEntry(
          'tv-series',
          e.tvSeries as {
            id: number
            title: string
            poster?: string
            rating?: number | null
            listStatus?: string | null
          }
        )
      )
    sections.push({ type: 'tv-series', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['tv-series']}`, entries })
  }
  if (c.animeSeries?.length) {
    const entries = c.animeSeries
      .filter((e) => e.animeSeries)
      .map((e) =>
        toEntry(
          'anime',
          e.animeSeries as {
            id: number
            title: string
            poster?: string
            rating?: number | null
            listStatus?: string | null
          }
        )
      )
    sections.push({ type: 'anime', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.anime}`, entries })
  }
  if (c.games?.length) {
    const entries = c.games
      .filter((e) => e.game)
      .map((e) =>
        toEntry(
          'game',
          e.game as { id: number; title: string; poster?: string; rating?: number | null; listStatus?: string | null }
        )
      )
    sections.push({ type: 'game', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.game}`, entries })
  }
  if (c.manga?.length) {
    const entries = c.manga
      .filter((e) => e.manga)
      .map((e) =>
        toEntry(
          'manga',
          e.manga as { id: number; title: string; poster?: string; rating?: number | null; listStatus?: string | null }
        )
      )
    sections.push({ type: 'manga', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.manga}`, entries })
  }
  if (c.books?.length) {
    const entries = c.books
      .filter((e) => e.book)
      .map((e) =>
        toEntry(
          'book',
          e.book as { id: number; title: string; poster?: string; rating?: number | null; listStatus?: string | null }
        )
      )
    sections.push({ type: 'book', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY.book}`, entries })
  }
  if (c.lightNovels?.length) {
    const entries = c.lightNovels
      .filter((e) => e.lightNovel)
      .map((e) =>
        toEntry(
          'light-novel',
          e.lightNovel as {
            id: number
            title: string
            poster?: string
            rating?: number | null
            listStatus?: string | null
          }
        )
      )
    sections.push({ type: 'light-novel', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['light-novel']}`, entries })
  }
  if (c.cartoonSeries?.length) {
    const entries = c.cartoonSeries
      .filter((e) => e.cartoonSeries)
      .map((e) =>
        toEntry(
          'cartoon-series',
          e.cartoonSeries as {
            id: number
            title: string
            poster?: string
            rating?: number | null
            listStatus?: string | null
          }
        )
      )
    sections.push({ type: 'cartoon-series', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['cartoon-series']}`, entries })
  }
  if (c.cartoonMovies?.length) {
    const entries = c.cartoonMovies
      .filter((e) => e.cartoonMovie)
      .map((e) =>
        toEntry(
          'cartoon-movies',
          e.cartoonMovie as {
            id: number
            title: string
            poster?: string
            rating?: number | null
            listStatus?: string | null
          }
        )
      )
    sections.push({ type: 'cartoon-movies', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['cartoon-movies']}`, entries })
  }
  if (c.animeMovies?.length) {
    const entries = c.animeMovies
      .filter((e) => e.animeMovie)
      .map((e) =>
        toEntry(
          'anime-movies',
          e.animeMovie as {
            id: number
            title: string
            poster?: string
            rating?: number | null
            listStatus?: string | null
          }
        )
      )
    sections.push({ type: 'anime-movies', labelKey: `nav.${MEDIA_TYPE_TO_NAV_KEY['anime-movies']}`, entries })
  }
  return sections
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

export default function PublicCollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    publicCollectionsApi
      .getOne(parseInt(id, 10))
      .then(setCollection)
      .catch(() => setCollection(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-theme-muted">{t('common.loading')}</p>
  if (!collection) return <p className="text-theme-muted">{t('common.noResults')}</p>

  const sections = collectSections(collection)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 mt-6 space-y-6">
      <nav className="flex items-center gap-1 text-sm text-theme-muted mb-4" aria-label={t('common.breadcrumb')}>
        <Link to="/public-collections" className="link-underline-animate inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4 shrink-0" />
          {t('nav.publicCollections')}
        </Link>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-theme">{collection.name}</h1>
      {collection.description && <p className="text-theme-muted">{collection.description}</p>}

      {sections.length > 0 ? (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.type}>
              <h3 className="text-theme text-lg font-medium mb-3">{t(section.labelKey)}</h3>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 min-[1920px]:grid-cols-6 gap-4"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {section.entries.map((entry) => (
                  <motion.div key={`${entry.type}-${entry.id}`} variants={staggerItemVariants}>
                    <MediaCard
                      media={entryToMedia(entry)}
                      type={entry.type}
                      listStatus={entry.listStatus}
                      showGenres={false}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-theme-muted">{t('collections.publicEmpty')}</p>
      )}
    </div>
  )
}
