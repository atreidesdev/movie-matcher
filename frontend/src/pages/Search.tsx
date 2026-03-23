import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { mediaApi } from '@/api/media'
import { searchApi, SemanticSearchItem } from '@/api/search'
import { Media } from '@/types'
import MediaGrid from '@/components/MediaGrid'
import { MediaTypeForPath } from '@/utils/mediaPaths'

/** Фильтрация по жанру и году (клиентская) */
function filterByGenreAndYear(items: Media[], genreId?: string, year?: string): Media[] {
  let out = items
  if (genreId) {
    const gid = Number(genreId)
    out = out.filter((m) => m.genres?.some((g) => g.id === gid))
  }
  if (year?.trim()) {
    const y = year.trim()
    out = out.filter(
      (m) => m.releaseDate?.startsWith(y) || m.releaseDate?.includes(`-${y}-`) || m.releaseDate?.endsWith(y)
    )
  }
  return out
}

const TYPE_TO_TAB: Partial<Record<MediaTypeForPath, SearchTab>> = {
  movie: 'movies',
  'tv-series': 'tv-series',
  anime: 'anime',
  game: 'games',
  manga: 'manga',
  book: 'books',
}
import { getMediaAssetUrl, getMediaPathFromApiType } from '@/utils/mediaPaths'
import { IconSearch, IconDiscover } from '@/components/icons'

type SearchMode = 'by-title' | 'by-meaning'

type SearchTab = 'movies' | 'anime' | 'games' | 'tv-series' | 'manga' | 'books'

const SEARCH_TABS: { key: SearchTab; type: MediaTypeForPath; labelKey: string }[] = [
  { key: 'movies', type: 'movie', labelKey: 'nav.movies' },
  { key: 'anime', type: 'anime', labelKey: 'nav.anime' },
  { key: 'games', type: 'game', labelKey: 'nav.games' },
  { key: 'tv-series', type: 'tv-series', labelKey: 'nav.tvSeries' },
  { key: 'manga', type: 'manga', labelKey: 'nav.manga' },
  { key: 'books', type: 'book', labelKey: 'nav.books' },
]

export default function Search() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const urlType = (searchParams.get('type') || '') as '' | MediaTypeForPath
  const genreIdParam = searchParams.get('genreId') || ''
  const yearParam = searchParams.get('year') || ''
  const [searchMode, setSearchMode] = useState<SearchMode>('by-title')
  const [activeTab, setActiveTab] = useState<SearchTab>('movies')
  const [results, setResults] = useState<Record<SearchTab, Media[]>>({
    movies: [],
    anime: [],
    games: [],
    'tv-series': [],
    manga: [],
    books: [],
  })
  const [semanticResults, setSemanticResults] = useState<SemanticSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [semanticLoading, setSemanticLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) return
    if (searchMode === 'by-title') {
      const searchData = async () => {
        setLoading(true)
        try {
          const typeTab = urlType ? TYPE_TO_TAB[urlType] : null
          const empty = {
            movies: [] as Media[],
            anime: [] as Media[],
            games: [] as Media[],
            'tv-series': [] as Media[],
            manga: [] as Media[],
            books: [] as Media[],
          }
          const applyFilter = (arr: Media[]) =>
            filterByGenreAndYear(arr, genreIdParam || undefined, yearParam || undefined)
          if (typeTab) {
            const apis: Record<SearchTab, () => Promise<{ data?: Media[] }>> = {
              movies: () => mediaApi.searchMovies(query),
              anime: () => mediaApi.searchAnime(query),
              games: () => mediaApi.searchGames(query).catch(() => ({ data: [] })),
              'tv-series': () => mediaApi.searchTVSeries(query).catch(() => ({ data: [] })),
              manga: () => mediaApi.searchManga(query).catch(() => ({ data: [] })),
              books: () => mediaApi.searchBooks(query).catch(() => ({ data: [] })),
            }
            const res = await apis[typeTab]()
            empty[typeTab] = applyFilter(res.data ?? [])
            setResults(empty)
          } else {
            const [moviesRes, animeRes, gamesRes, tvRes, mangaRes, booksRes] = await Promise.all([
              mediaApi.searchMovies(query),
              mediaApi.searchAnime(query),
              mediaApi.searchGames(query).catch(() => ({ data: [] })),
              mediaApi.searchTVSeries(query).catch(() => ({ data: [] })),
              mediaApi.searchManga(query).catch(() => ({ data: [] })),
              mediaApi.searchBooks(query).catch(() => ({ data: [] })),
            ])
            setResults({
              movies: applyFilter(moviesRes.data ?? []),
              anime: applyFilter(animeRes.data ?? []),
              games: applyFilter(gamesRes.data ?? []),
              'tv-series': applyFilter(tvRes.data ?? []),
              manga: applyFilter(mangaRes.data ?? []),
              books: applyFilter(booksRes.data ?? []),
            })
          }
        } catch (error) {
          console.error('Search failed:', error)
        } finally {
          setLoading(false)
        }
      }
      searchData()
    }
  }, [query, searchMode, urlType, genreIdParam, yearParam])

  useEffect(() => {
    if (urlType && TYPE_TO_TAB[urlType]) setActiveTab(TYPE_TO_TAB[urlType]!)
  }, [urlType])

  useEffect(() => {
    if (!query.trim() || searchMode !== 'by-meaning') return
    const runSemantic = async () => {
      setSemanticLoading(true)
      try {
        const res = await searchApi.semantic(query, { limit: 30 })
        setSemanticResults(res.results ?? [])
      } catch (error) {
        console.error('Semantic search failed:', error)
        setSemanticResults([])
      } finally {
        setSemanticLoading(false)
      }
    }
    runSemantic()
  }, [query, searchMode])

  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{t('search.enterQuery')}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('nav.search')}</h1>
      <p className="text-gray-400 mb-4">&quot;{query}&quot;</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setSearchMode('by-title')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'by-title' ? 'bg-thistle-400 text-gray-900' : 'bg-gray-400 text-gray-700 hover:bg-gray-500'
          }`}
        >
          <IconSearch className="w-4 h-4" />
          {t('search.byTitle')}
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('by-meaning')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'by-meaning' ? 'bg-thistle-400 text-gray-900' : 'bg-gray-400 text-gray-700 hover:bg-gray-500'
          }`}
        >
          <IconDiscover className="w-4 h-4" />
          {t('search.byMeaning')}
        </button>
      </div>

      {searchMode === 'by-title' && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {SEARCH_TABS.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === key ? 'bg-thistle-400 text-gray-900' : 'bg-gray-400 text-gray-700 hover:bg-gray-500'
                }`}
              >
                {labelKey.startsWith('nav.') ? t(labelKey) : labelKey} ({(results[key] ?? []).length})
              </button>
            ))}
          </div>
          <MediaGrid
            items={(results[activeTab] ?? []) as Media[]}
            type={SEARCH_TABS.find((x) => x.key === activeTab)!.type}
            loading={loading}
          />
        </>
      )}

      {searchMode === 'by-meaning' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">{t('search.byMeaningHint')}</p>
          {semanticLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : semanticResults.length === 0 ? (
            <p className="text-gray-400 py-8">{t('search.noSemanticResults')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {semanticResults.map((item) => (
                <Link
                  key={`${item.mediaType}-${item.mediaId}`}
                  to={getMediaPathFromApiType(item.mediaType, item.mediaId)}
                  className="card block group"
                >
                  <div className="aspect-[2/3] relative overflow-hidden">
                    {item.poster ? (
                      <img
                        src={getMediaAssetUrl(item.poster)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">{t('common.noImage')}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black-500/70 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-thistle-200">
                      {((item.score || 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium truncate title-hover-theme transition-colors">{item.title}</h3>
                    {item.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
