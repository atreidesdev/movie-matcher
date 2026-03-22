import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconSearch, getListStatusIcon, getListStatusBadgeClasses } from '@/components/icons'
import { personsApi } from '@/api/persons'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { getPersonDisplayName } from '@/utils/personUtils'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import type { Person } from '@/types'
import SimplePagination from '@/components/ui/SimplePagination'

/** Media types that have cast (backend filter support) */
const MEDIA_TYPE_OPTIONS = [
  { value: 'movie', labelKey: 'nav.movies' },
  { value: 'tv-series', labelKey: 'nav.tvSeries' },
  { value: 'anime', labelKey: 'nav.anime' },
  { value: 'anime-movies', labelKey: 'nav.animeMovies' },
  { value: 'cartoon-series', labelKey: 'nav.cartoonSeries' },
  { value: 'cartoon-movies', labelKey: 'nav.cartoonMovies' },
] as const

const COMPANY_TYPE_OPTIONS = [
  { value: 'studio', labelKey: 'media.studios' },
  { value: 'developer', labelKey: 'media.developers' },
  { value: 'publisher', labelKey: 'media.publishers' },
] as const

type SearchIn = 'media' | 'companies'

export default function SearchPersons() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const searchIn = (searchParams.get('searchIn') as SearchIn) || 'media'
  const mediaType = searchParams.get('mediaType') ?? ''
  const companyType = searchParams.get('companyType') ?? ''

  const [inputValue, setInputValue] = useState(query)
  const [results, setResults] = useState<Person[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 24

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setTotal(0)
      return
    }
    setLoading(true)
    const listParams: { search?: string; mediaType?: string; companyType?: string } = { search: query.trim() }
    if (searchIn === 'media' && mediaType) listParams.mediaType = mediaType
    if (searchIn === 'companies' && companyType) listParams.companyType = companyType
    personsApi
      .getList(page, pageSize, query.trim(), listParams)
      .then((res) => {
        setResults(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setResults([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [query, searchIn, mediaType, companyType, page])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (inputValue.trim()) params.set('q', inputValue.trim())
    if (searchIn) params.set('searchIn', searchIn)
    if (searchIn === 'media' && mediaType) params.set('mediaType', mediaType)
    if (searchIn === 'companies' && companyType) params.set('companyType', companyType)
    setSearchParams(params, { replace: true })
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const locale = i18n.language

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('search.searchPersons')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('search.query')}</label>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('search.enterQuery')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-thistle-400 focus:border-thistle-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('search.whereToSearch')}</label>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchIn"
                checked={searchIn === 'media'}
                onChange={() => {
                  setPage(1)
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev)
                      next.set('searchIn', 'media')
                      next.delete('companyType')
                      return next
                    },
                    { replace: true }
                  )
                }}
                className="text-thistle-600 focus:ring-thistle-500"
              />
              {t('search.inMedia')}
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchIn"
                checked={searchIn === 'companies'}
                onChange={() => {
                  setPage(1)
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev)
                      next.set('searchIn', 'companies')
                      next.delete('mediaType')
                      return next
                    },
                    { replace: true }
                  )
                }}
                className="text-thistle-600 focus:ring-thistle-500"
              />
              {t('search.inCompanies')}
            </label>
          </div>
        </div>

        {searchIn === 'media' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('search.mediaType')}</label>
            <select
              value={mediaType}
              onChange={(e) => {
                setPage(1)
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    if (e.target.value) next.set('mediaType', e.target.value)
                    else next.delete('mediaType')
                    return next
                  },
                  { replace: true }
                )
              }}
              className="rounded-lg border border-gray-300 focus:ring-2 focus:ring-thistle-400 px-3 py-2"
            >
              <option value="">{t('search.allTypes')}</option>
              {MEDIA_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        )}

        {searchIn === 'companies' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('search.companyType')}</label>
            <select
              value={companyType}
              onChange={(e) => {
                setPage(1)
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    if (e.target.value) next.set('companyType', e.target.value)
                    else next.delete('companyType')
                    return next
                  },
                  { replace: true }
                )
              }}
              className="rounded-lg border border-gray-300 focus:ring-2 focus:ring-thistle-400 px-3 py-2"
            >
              <option value="">{t('search.allTypes')}</option>
              {COMPANY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-thistle-500 text-gray-900 font-medium hover:bg-thistle-400 transition-colors"
        >
          <IconSearch className="w-4 h-4" />
          {t('nav.search')}
        </button>
      </form>

      {query.trim() && (
        <>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="text-gray-500 py-8">{t('search.noPersons')}</p>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-4">
                {total} {t('media.paginationItems')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.map((person) => {
                  const status = person.listStatus
                  const StatusIcon = status ? getListStatusIcon(status, 'movie') : null
                  const badgeClasses = status ? getListStatusBadgeClasses(status, 'movie') : null
                  return (
                    <Link key={person.id} to={`/persons/${person.id}`} className="card group block">
                      <div className="aspect-[2/3] bg-gray-200 relative flex items-center justify-center overflow-hidden">
                        {person.avatar ? (
                          <img
                            src={getMediaAssetUrl(person.avatar)}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-gray-400 text-4xl">?</span>
                        )}
                        {StatusIcon && badgeClasses && (
                          <div
                            className={`absolute top-2 left-2 z-10 w-10 h-10 rounded-lg backdrop-blur-sm flex items-center justify-center ${badgeClasses.bg} ${badgeClasses.text}`}
                            title={status ? getListStatusLabel(t, 'movie', status) : ''}
                          >
                            <StatusIcon size={20} className="shrink-0" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate text-gray-900 title-hover-theme transition-colors">
                          {getPersonDisplayName(person, locale) ||
                            `${person.firstName} ${person.lastName}`.trim() ||
                            '—'}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <SimplePagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {!query.trim() && <p className="text-gray-400">{t('search.enterQuery')}</p>}
    </div>
  )
}
