import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { mediaApi } from '@/api/media'
import { newsApi } from '@/api/news'
import { RecommendedItem } from '@/types'
import type { NewsListItem } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { SlidersHorizontal } from 'lucide-react'
import { IconDiscover, IconTypeMovie, IconComment, IconCross, IconNewspaper } from '@/components/icons'
import NewsTagFilter from '@/components/NewsTagFilter'
import { getMediaPath, getMediaAssetUrl } from '@/utils/mediaPaths'

function formatNewsDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function Home() {
  const { t } = useTranslation()
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([])
  const [newsList, setNewsList] = useState<NewsListItem[]>([])
  const [newsTags, setNewsTags] = useState<string[]>([])
  const [selectedNewsTags, setSelectedNewsTags] = useState<string[]>([])
  const [newsFiltersDrawerOpen, setNewsFiltersDrawerOpen] = useState(false)
  const [newsLoading, setNewsLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    let cancelled = false
    mediaApi
      .getRecommendations('movie', 6)
      .then((data) => {
        if (!cancelled) setRecommendations(data.recommendations || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    newsApi
      .getTags()
      .then((res) => {
        if (!cancelled) setNewsTags(res.tags ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setNewsLoading(true)
    const tags = selectedNewsTags.length ? selectedNewsTags : undefined
    newsApi
      .getList(tags ? { tags } : undefined)
      .then((res) => setNewsList(res.news ?? []))
      .catch(() => setNewsList([]))
      .finally(() => setNewsLoading(false))
  }, [selectedNewsTags])

  return (
    <div className="space-y-10 pt-6">
      {user && recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <IconDiscover className="w-6 h-6 text-thistle-500" />
            <h2 className="text-2xl font-bold">{t('home.recommendedForYou')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.map((item, index) => (
              <Link
                key={`${item.mediaId}-${index}`}
                to={getMediaPath('movie', item.mediaId, item.title)}
                className="card block"
              >
                <div className="aspect-[2/3] relative overflow-hidden rounded-t-xl">
                  {item.poster ? (
                    <img src={getMediaAssetUrl(item.poster)} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{t('common.noImage')}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{item.title}</h3>
                  <p className="text-xs text-thistle-500 mt-1">
                    {t('common.match')}: {(item.score * 100).toFixed(0)}%
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Основной контент: заголовок, список новостей */}
        <div className="flex-1 min-w-0 order-1 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <IconNewspaper className="w-6 h-6 text-thistle-500 shrink-0" />
              <h2 className="text-2xl font-bold">{t('home.newsBlog')}</h2>
            </div>
            {newsTags.length > 0 && (
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setNewsFiltersDrawerOpen(true)}
                  className="home-theme-button flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors"
                  aria-label={t('media.filters')}
                >
                  <SlidersHorizontal className="w-4 h-4 shrink-0" />
                  {selectedNewsTags.length > 0 ? (
                    <span className="home-theme-button-count">{selectedNewsTags.length}</span>
                  ) : (
                    t('home.newsFilterAll')
                  )}
                </button>
              </div>
            )}
          </div>
          {newsLoading ? (
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          ) : newsList.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('home.noNewsInFilter')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newsList.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="card home-news-card block hover:ring-2 hover:ring-thistle-400 transition"
                >
                  <div className="overflow-hidden rounded-xl">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                    {item.previewImage ? (
                      <img src={getMediaAssetUrl(item.previewImage)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconNewspaper className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
                      {item.previewTitle || item.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <time dateTime={item.createdAt}>{formatNewsDate(item.createdAt)}</time>
                      <span className="flex items-center gap-1">
                        <IconComment className="w-4 h-4" />
                        {item.commentCount}
                      </span>
                    </div>
                    {item.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags
                          .split(/[\s,]+/)
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((tag, index) => (
                            <span
                              key={tag}
                              className="home-news-tag text-xs px-2 py-0.5 rounded"
                              data-badge-variant={index % 10}
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Десктоп: фильтр тегов сбоку, как на странице списка */}
        {newsTags.length > 0 && (
          <>
            <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0 order-2 lg:order-2">
              <div className="lg:sticky lg:top-4">
                <div className="home-theme-filter-panel rounded-xl border p-4 w-full space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="home-theme-filter-title text-sm font-semibold">{t('news.filterByTags')}</h2>
                    {selectedNewsTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedNewsTags([])}
                        className="home-theme-reset text-xs hover:underline"
                      >
                        {t('media.resetFilters')}
                      </button>
                    )}
                  </div>
                  <NewsTagFilter
                    options={newsTags}
                    selectedTags={selectedNewsTags}
                    onChange={setSelectedNewsTags}
                    placeholderKey="home.newsFilterAll"
                    className="w-full"
                  />
                </div>
              </div>
            </aside>

            {newsFiltersDrawerOpen && (
              <>
                <div
                  className="lg:hidden fixed inset-0 bg-black/40 z-40"
                  onClick={() => setNewsFiltersDrawerOpen(false)}
                  aria-hidden
                />
                <aside
                  className="home-theme-filter-drawer lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-xl z-50 flex flex-col overflow-hidden"
                  aria-modal
                  aria-label={t('media.filters')}
                >
                  <div className="home-theme-filter-drawer-header flex items-center justify-between p-4 border-b">
                    <h2 className="home-theme-filter-title text-lg font-semibold">{t('news.filterByTags')}</h2>
                    <button
                      type="button"
                      onClick={() => setNewsFiltersDrawerOpen(false)}
                      className="home-theme-filter-close p-2 rounded-lg"
                      aria-label={t('common.close')}
                    >
                      <IconCross className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <NewsTagFilter
                      options={newsTags}
                      selectedTags={selectedNewsTags}
                      onChange={setSelectedNewsTags}
                      placeholderKey="home.newsFilterAll"
                      className="w-full"
                    />
                  </div>
                </aside>
              </>
            )}
          </>
        )}
      </section>

      {!user && (
        <section className="text-center py-12 text-gray-400">
          <IconTypeMovie className="w-12 h-12 mx-auto mb-4 opacity-60" />
          <p>{t('home.recommendedForYou')}</p>
          <p className="text-sm mt-2">{t('auth.welcomeBack')}</p>
        </section>
      )}
    </div>
  )
}
