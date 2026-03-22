import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconDiscover } from '@/components/icons'
import { mediaApi } from '@/api/media'
import { RecommendedItem } from '@/types'
import { getMediaPath, getMediaAssetUrl, type MediaTypeForPath } from '@/utils/mediaPaths'

const RECOMMENDATION_TABS: { key: MediaTypeForPath; labelKey: string }[] = [
  { key: 'movie', labelKey: 'nav.movies' },
  { key: 'tv-series', labelKey: 'nav.tvSeries' },
  { key: 'anime', labelKey: 'nav.anime' },
  { key: 'anime-movies', labelKey: 'nav.animeMovies' },
  { key: 'game', labelKey: 'nav.games' },
  { key: 'manga', labelKey: 'nav.manga' },
  { key: 'book', labelKey: 'nav.books' },
  { key: 'light-novel', labelKey: 'nav.lightNovels' },
  { key: 'cartoon-series', labelKey: 'nav.cartoonSeries' },
  { key: 'cartoon-movies', labelKey: 'nav.cartoonMovies' },
]

const LIMIT_PER_TYPE = 24

export default function Recommendations() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<MediaTypeForPath>('movie')
  const [byType, setByType] = useState<Record<string, RecommendedItem[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const types = RECOMMENDATION_TABS.map((s) => s.key)
    mediaApi
      .getRecommendationsByTypes(types, LIMIT_PER_TYPE)
      .then(setByType)
      .catch(() => setByType({}))
      .finally(() => setLoading(false))
  }, [])

  const items = byType[tab] ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 rec-page-title">
        <IconDiscover className="w-8 h-8 rec-page-icon" />
        {t('nav.recommendations')}
      </h1>

      <div className="flex flex-wrap gap-2">
        {RECOMMENDATION_TABS.map(({ key: tabKey, labelKey }) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            className={`rec-page-tab px-4 py-2 rounded-lg transition-colors ${tab === tabKey ? 'rec-page-tab--active' : ''}`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-theme-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-theme-muted">{t('common.noResults')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <Link key={item.mediaId} to={getMediaPath(tab, item.mediaId, item.title)} className="card block">
              <div className="aspect-[2/3] relative overflow-hidden">
                {item.poster ? (
                  <img src={getMediaAssetUrl(item.poster)} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-theme-bg-alt flex items-center justify-center">
                    <span className="text-theme-muted text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium truncate text-theme">{item.title}</h3>
                <p className="rec-page-match text-xs mt-1 text-theme-muted">
                  Match: {((item.score ?? 0) * 100).toFixed(0)}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
