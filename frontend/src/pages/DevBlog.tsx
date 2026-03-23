import { devblogApi } from '@/api/devblog'
import { IconDevblog } from '@/components/icons'
import type { DevBlogPost } from '@/types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function DevBlog() {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<DevBlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    devblogApi
      .getList()
      .then((r) => setPosts(r.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <IconDevblog className="w-7 h-7 text-thistle-500" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('devblog.title')}</h1>
      </div>

      {loading ? (
        <div className="animate-pulse py-8 text-gray-500">{t('common.loading')}</div>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('devblog.noPosts')}</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/devblog/${post.id}`}
                className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-thistle-400 hover:bg-thistle-50/30 dark:hover:bg-thistle-900/20 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{post.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {post.body.replace(/\s+/g, ' ').trim().slice(0, 200)}
                  {post.body.length > 200 ? '…' : ''}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{post.author?.name || post.author?.username || `ID ${post.authorId}`}</span>
                  <span>·</span>
                  <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
