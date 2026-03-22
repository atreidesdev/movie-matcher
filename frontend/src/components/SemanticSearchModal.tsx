import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { IconDiscover, IconCross } from '@/components/icons'
import { searchApi, type SemanticSearchItem } from '@/api/search'
import { getMediaAssetUrl, getMediaPathFromApiType } from '@/utils/mediaPaths'

interface SemanticSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SemanticSearchModal({ isOpen, onClose }: SemanticSearchModalProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticSearchItem[]>([])
  const [loading, setLoading] = useState(false)

  const runSearch = async () => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await searchApi.semantic(q, { limit: 24 })
      setResults(res.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden />
      <div className="fixed z-[70] flex flex-col modal-panel rounded-2xl shadow-2xl border overflow-hidden inset-x-4 top-8 bottom-8 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:max-h-[95vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0 bg-theme-bg-alt">
          <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
            <IconDiscover className="w-5 h-5 text-space_indigo-600" />
            {t('nav.semanticSearch')}
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

        <form onSubmit={handleSubmit} className="p-4 shrink-0 bg-theme-bg-alt">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.byMeaningHint')}
              className="input flex-1 px-4 py-3"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-3 rounded-lg bg-space_indigo-600 text-lavender-500 font-medium hover:bg-space_indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t('nav.search')}
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-theme-bg-alt">
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-theme-surface rounded-xl animate-pulse" />
              ))}
            </div>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <p className="text-theme-muted text-sm py-4">{t('search.noSemanticResults')}</p>
          )}
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.map((item) => (
                <Link
                  key={`${item.mediaType}-${item.mediaId}`}
                  to={getMediaPathFromApiType(item.mediaType, item.mediaId)}
                  onClick={onClose}
                  className="block rounded-xl overflow-hidden bg-theme-surface border border-theme hover:border-lavender-400 hover:shadow-md transition-all group"
                >
                  <div className="aspect-[2/3] relative overflow-hidden">
                    {item.poster ? (
                      <img
                        src={getMediaAssetUrl(item.poster)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-theme-bg-alt flex items-center justify-center">
                        <span className="text-theme-muted text-xs">No image</span>
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 bg-gray-900/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-white">
                      {((item.score ?? 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="font-medium text-gray-900 text-sm truncate title-hover-theme">{item.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
