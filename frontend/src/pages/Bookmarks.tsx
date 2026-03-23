import { type BookmarkItem, bookmarksApi } from '@/api/bookmarks'
import BookmarkButton from '@/components/BookmarkButton'
import { useAuthStore } from '@/store/authStore'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { Bookmark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function Bookmarks() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [list, setList] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadList = () => {
    if (!user) return
    bookmarksApi
      .getList()
      .then(setList)
      .catch(() => setList([]))
  }

  useEffect(() => {
    if (!user) {
      setList([])
      setLoading(false)
      return
    }
    setLoading(true)
    bookmarksApi
      .getList()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bookmark className="w-7 h-7 text-thistle-500" />
        {t('bookmarks.pageTitle')}
      </h1>
      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="text-gray-500">{t('bookmarks.empty')}</p>
      ) : (
        <ul className="space-y-4">
          {list.map((b) => (
            <li
              key={`${b.targetType}-${b.targetId}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {b.targetType === 'collection' && b.target && 'name' in b.target && (
                <>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Bookmark className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/collections/${b.targetId}`}
                      className="font-medium text-gray-800 title-hover-theme truncate block"
                    >
                      {(b.target as { name?: string }).name || `Collection #${b.targetId}`}
                    </Link>
                    {(b.target as { user?: { username?: string } }).user?.username && (
                      <Link
                        to={`/user/${(b.target as { user: { username: string } }).user.username}`}
                        className="text-sm text-gray-500 hover:underline"
                      >
                        {(b.target as { user?: { username?: string; name?: string } }).user?.name ||
                          (b.target as { user?: { username?: string } }).user?.username}
                      </Link>
                    )}
                  </div>
                  <BookmarkButton targetType="collection" targetId={b.targetId} onRemoved={loadList} />
                </>
              )}
              {b.targetType === 'news' && b.target && 'title' in b.target && (
                <>
                  {(b.target as { previewImage?: string }).previewImage ? (
                    <img
                      src={getMediaAssetUrl((b.target as { previewImage: string }).previewImage)}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Bookmark className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/news/${b.targetId}`}
                      className="font-medium text-gray-800 title-hover-theme line-clamp-2 block"
                    >
                      {(b.target as { title?: string }).title || `News #${b.targetId}`}
                    </Link>
                  </div>
                  <BookmarkButton targetType="news" targetId={b.targetId} onRemoved={loadList} />
                </>
              )}
              {(!b.target ||
                (b.targetType === 'collection' && !('name' in b.target)) ||
                (b.targetType === 'news' && !('title' in b.target))) && (
                <>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-gray-600">
                      {b.targetType === 'collection' ? t('bookmarks.collection') : t('bookmarks.news')} #{b.targetId}
                    </span>
                  </div>
                  <BookmarkButton targetType={b.targetType} targetId={b.targetId} onRemoved={loadList} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
