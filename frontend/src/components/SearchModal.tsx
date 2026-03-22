import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconSearch, IconCross } from '@/components/icons'
import CustomSelect from '@/components/CustomSelect'
import { mediaApi } from '@/api/media'
import { personsApi } from '@/api/persons'
import { charactersApi } from '@/api/characters'
import { Genre, Media, Person, Character } from '@/types'
import { MediaTypeForPath, getMediaPath, getMediaAssetUrl } from '@/utils/mediaPaths'
import { getMediaTitle, getCharacterName } from '@/utils/localizedText'
import { getPersonDisplayName } from '@/utils/personUtils'
import { useDebounce } from '@/hooks/useDebounce'

type SearchCategory = 'media' | 'persons' | 'characters'

const SEARCH_CATEGORIES: { value: SearchCategory; labelKey: string }[] = [
  { value: 'media', labelKey: 'nav.contentType' },
  { value: 'persons', labelKey: 'search.searchPersons' },
  { value: 'characters', labelKey: 'search.searchCharacters' },
]

const MEDIA_TYPE_OPTIONS: { value: MediaTypeForPath; labelKey: string }[] = [
  { value: 'movie', labelKey: 'nav.movies' },
  { value: 'tv-series', labelKey: 'nav.tvSeries' },
  { value: 'anime', labelKey: 'nav.anime' },
  { value: 'anime-movies', labelKey: 'nav.animeMovies' },
  { value: 'cartoon-series', labelKey: 'nav.cartoonSeries' },
  { value: 'cartoon-movies', labelKey: 'nav.cartoonMovies' },
  { value: 'game', labelKey: 'nav.games' },
  { value: 'manga', labelKey: 'nav.manga' },
  { value: 'book', labelKey: 'nav.books' },
  { value: 'light-novel', labelKey: 'nav.lightNovels' },
]

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

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [category, setCategory] = useState<SearchCategory>('media')
  const [query, setQuery] = useState('')
  const [mediaType, setMediaType] = useState<MediaTypeForPath>('movie')
  const [genreId, setGenreId] = useState<string>('')
  const [year, setYear] = useState('')
  const [genres, setGenres] = useState<Genre[]>([])
  const [mediaResults, setMediaResults] = useState<Media[]>([])
  const [personsResults, setPersonsResults] = useState<Person[]>([])
  const [charactersResults, setCharactersResults] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebounce(query.trim(), 300)

  useEffect(() => {
    if (isOpen) {
      mediaApi
        .getGenres()
        .then(setGenres)
        .catch(() => setGenres([]))
    }
  }, [isOpen])

  const runSearch = useCallback(async () => {
    if (!debouncedQuery) {
      if (category === 'media') setMediaResults([])
      if (category === 'persons') setPersonsResults([])
      if (category === 'characters') setCharactersResults([])
      return
    }
    setLoading(true)
    try {
      if (category === 'media') {
        const apis: Record<MediaTypeForPath, () => Promise<{ data?: Media[] }>> = {
          movie: () => mediaApi.searchMovies(debouncedQuery),
          anime: () => mediaApi.searchAnime(debouncedQuery),
          game: () => mediaApi.searchGames(debouncedQuery).catch(() => ({ data: [] })),
          'tv-series': () => mediaApi.searchTVSeries(debouncedQuery).catch(() => ({ data: [] })),
          manga: () => mediaApi.searchManga(debouncedQuery).catch(() => ({ data: [] })),
          book: () => mediaApi.searchBooks(debouncedQuery).catch(() => ({ data: [] })),
          'light-novel': () => mediaApi.searchLightNovels(debouncedQuery).catch(() => ({ data: [] })),
          'cartoon-series': () => mediaApi.searchCartoonSeries(debouncedQuery).catch(() => ({ data: [] })),
          'cartoon-movies': () => mediaApi.searchCartoonMovies(debouncedQuery).catch(() => ({ data: [] })),
          'anime-movies': () => mediaApi.searchAnimeMovies(debouncedQuery).catch(() => ({ data: [] })),
        }
        const res = await apis[mediaType]()
        const list = filterByGenreAndYear(res.data ?? [], genreId || undefined, year || undefined)
        setMediaResults(list)
      } else if (category === 'persons') {
        const res = await personsApi.getList(1, 20, debouncedQuery, { search: debouncedQuery })
        setPersonsResults(res.data ?? [])
      } else {
        const res = await charactersApi.getList(1, 20, debouncedQuery, { search: debouncedQuery })
        setCharactersResults(res.data ?? [])
      }
    } catch (e) {
      if (category === 'media') setMediaResults([])
      if (category === 'persons') setPersonsResults([])
      if (category === 'characters') setCharactersResults([])
    } finally {
      setLoading(false)
    }
  }, [category, debouncedQuery, mediaType, genreId, year])

  useEffect(() => {
    if (!isOpen) return
    runSearch()
  }, [isOpen, runSearch])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden />
      <div className="fixed z-[70] flex flex-col modal-panel rounded-2xl shadow-2xl border overflow-visible inset-x-4 top-8 bottom-8 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full md:max-h-[95vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0 bg-theme-bg-alt rounded-t-2xl">
          <h2 className="text-lg font-semibold text-theme">{t('nav.search')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-visible p-4 bg-theme-bg-alt rounded-b-2xl">
          <div className="flex gap-1 mb-4 shrink-0">
            {SEARCH_CATEGORIES.map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === value
                    ? 'bg-space_indigo-600 text-lavender-500'
                    : 'bg-theme-surface border border-theme text-theme hover:bg-theme-bg-alt'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          <div className="space-y-3 shrink-0">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.enterQuery')}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-theme-bg border border-theme text-theme placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
                autoFocus
              />
            </div>

            {category === 'media' && (
              <>
                <CustomSelect
                  value={mediaType}
                  onChange={(v) => setMediaType(v as MediaTypeForPath)}
                  options={MEDIA_TYPE_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: t(opt.labelKey),
                  }))}
                />
                <div className="flex gap-2">
                  <CustomSelect
                    value={genreId}
                    onChange={setGenreId}
                    placeholder={t('search.allGenres')}
                    options={[
                      { value: '', label: t('search.allGenres') },
                      ...genres.map((g) => ({
                        value: String(g.id),
                        label: (g.emoji ? `${g.emoji} ` : '') + (g.name ?? ''),
                      })),
                    ]}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder={t('search.year')}
                    min={1900}
                    max={2100}
                    className="w-24 px-3 py-2 rounded-lg bg-theme-bg border border-theme text-theme text-sm placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 space-y-1 min-h-0 rounded-b-2xl">
            {loading && <p className="text-theme-muted text-sm py-2">{t('common.loading')}</p>}
            {!loading &&
              debouncedQuery &&
              category === 'media' &&
              (mediaResults.length === 0 ? (
                <p className="text-theme-muted text-sm py-2">{t('common.noResults')}</p>
              ) : (
                mediaResults.map((item) => (
                  <Link
                    key={`${mediaType}-${item.id}`}
                    to={getMediaPath(mediaType, item.id, getMediaTitle(item, locale) || item.title)}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-theme-surface text-theme"
                  >
                    {item.poster ? (
                      <img
                        src={getMediaAssetUrl(item.poster)}
                        alt=""
                        className="w-10 h-14 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-theme-bg-alt rounded flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{getMediaTitle(item, locale) || item.title}</span>
                  </Link>
                ))
              ))}
            {!loading &&
              debouncedQuery &&
              category === 'persons' &&
              (personsResults.length === 0 ? (
                <p className="text-theme-muted text-sm py-2">{t('common.noResults')}</p>
              ) : (
                personsResults.map((p) => (
                  <Link
                    key={p.id}
                    to={`/persons/${p.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-theme-surface text-theme"
                  >
                    {p.avatar ? (
                      <img
                        src={getMediaAssetUrl(p.avatar)}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-theme-bg-alt flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{getPersonDisplayName(p, locale)}</span>
                  </Link>
                ))
              ))}
            {!loading &&
              debouncedQuery &&
              category === 'characters' &&
              (charactersResults.length === 0 ? (
                <p className="text-theme-muted text-sm py-2">{t('common.noResults')}</p>
              ) : (
                charactersResults.map((c) => (
                  <Link
                    key={c.id}
                    to={`/characters/${c.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-theme-surface text-theme"
                  >
                    {c.avatar ? (
                      <img
                        src={getMediaAssetUrl(c.avatar)}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-theme-bg-alt flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{getCharacterName(c, locale) || c.name}</span>
                  </Link>
                ))
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
