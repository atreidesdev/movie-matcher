import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { IconComment, IconPlus, IconCross, IconNewspaper } from '@/components/icons'
import NewsTagFilter from '@/components/NewsTagFilter'
import { newsApi } from '@/api/news'
import { useAuthStore } from '@/store/authStore'
import type { NewsListItem } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'

const NEWS_EDITOR_ROLES = ['admin', 'content_creator', 'developer', 'owner'] as const
function canEditNews(role: string | undefined): boolean {
  return role != null && (NEWS_EDITOR_ROLES as readonly string[]).includes(role)
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function parseTags(tags?: string): string[] {
  if (!tags || !tags.trim()) return []
  return tags.split(/[\s,]+/).filter(Boolean)
}

export default function News() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [items, setItems] = useState<NewsListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newsTags, setNewsTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)

  useEffect(() => {
    newsApi
      .getTags()
      .then((r) => setNewsTags(r.tags ?? []))
      .catch(() => setNewsTags([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    newsApi
      .getList(selectedTags.length ? { tags: selectedTags } : undefined)
      .then((r) => setItems(r.news ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [selectedTags])

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Основной контент: заголовок, кнопка создания, список новостей */}
      <div className="flex-1 min-w-0 order-1 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <IconNewspaper className="w-7 h-7 text-thistle-500 shrink-0" />
            <h1 className="text-2xl font-bold text-[var(--theme-text)]">{t('news.title')}</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {newsTags.length > 0 && (
              <>
                {/* Мобильный: кнопка открывает выдвижное меню с фильтром */}
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setFiltersDrawerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)] text-sm font-medium hover:bg-[var(--theme-surface)] transition-colors"
                    aria-label={t('media.filters')}
                  >
                    <SlidersHorizontal className="w-4 h-4 shrink-0" />
                    {selectedTags.length > 0 ? (
                      <span className="text-[var(--theme-primary)]">{selectedTags.length}</span>
                    ) : (
                      t('news.filterAll')
                    )}
                  </button>
                </div>
              </>
            )}
            {canEditNews(user?.role) && (
              <Link
                to="/news/new"
                className="bg-space_indigo-600 text-lavender-500 hover:bg-space_indigo-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <IconPlus className="w-4 h-4" />
                {t('news.admin.create')}
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse py-8 text-[var(--theme-text-muted)]">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <p className="text-[var(--theme-text-muted)]">{t('news.noNews')}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/news/${item.id}`}
                  className="block rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] overflow-hidden hover:border-[var(--theme-primary)] hover:bg-[var(--theme-surface)] transition-colors"
                >
                  <div className="aspect-video bg-[var(--theme-bg-alt)] relative">
                    {item.previewImage ? (
                      <img src={getMediaAssetUrl(item.previewImage)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-muted)]">
                        <IconNewspaper className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-[var(--theme-text)] line-clamp-2">
                      {item.previewTitle || item.title}
                    </h2>
                    {parseTags(item.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {parseTags(item.tags)
                          .slice(0, 4)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)]"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
                      <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                      <span className="flex items-center gap-1">
                        <IconComment className="w-3.5 h-3.5" />
                        {item.commentCount}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Десктоп: фильтр тегов сбоку, как на странице списка */}
      {newsTags.length > 0 && (
        <>
          <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0 order-2 lg:order-2">
            <div className="lg:sticky lg:top-4">
              <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-4 w-full space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-[var(--theme-text)]">{t('news.filterByTags')}</h2>
                  {selectedTags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-[var(--theme-primary)] hover:underline"
                    >
                      {t('media.resetFilters')}
                    </button>
                  )}
                </div>
                <NewsTagFilter
                  options={newsTags}
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  placeholderKey="news.filterAll"
                  className="w-full"
                />
              </div>
            </div>
          </aside>

          {/* Мобильный: выдвижная панель с фильтром */}
          {filtersDrawerOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/40 z-40"
                onClick={() => setFiltersDrawerOpen(false)}
                aria-hidden
              />
              <aside
                className="lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--theme-bg)] shadow-xl z-50 flex flex-col overflow-hidden"
                aria-modal
                aria-label={t('media.filters')}
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)]">
                  <h2 className="text-lg font-semibold text-[var(--theme-text)]">{t('news.filterByTags')}</h2>
                  <button
                    type="button"
                    onClick={() => setFiltersDrawerOpen(false)}
                    className="p-2 rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-text)]"
                    aria-label={t('common.close')}
                  >
                    <IconCross className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <NewsTagFilter
                    options={newsTags}
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    placeholderKey="news.filterAll"
                    className="w-full"
                  />
                </div>
              </aside>
            </>
          )}
        </>
      )}
    </div>
  )
}
