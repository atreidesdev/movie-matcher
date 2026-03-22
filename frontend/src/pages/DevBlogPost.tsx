import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { IconDevblog } from '@/components/icons'
import { devblogApi } from '@/api/devblog'
import type { DevBlogPost } from '@/types'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function DevBlogPostPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<DevBlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const numId = id ? parseInt(id, 10) : NaN
    if (Number.isNaN(numId)) {
      setLoading(false)
      return
    }
    devblogApi
      .getById(numId)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="animate-pulse py-8 text-gray-500">{t('common.loading')}</div>
  }
  if (!post) {
    return (
      <div className="space-y-4">
        <Link to="/devblog" className="inline-flex items-center gap-1 text-thistle-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {t('devblog.backToList')}
        </Link>
        <p className="text-gray-500">{t('devblog.notFound')}</p>
      </div>
    )
  }

  return (
    <article className="space-y-6">
      <Link to="/devblog" className="inline-flex items-center gap-1 text-thistle-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        {t('devblog.backToList')}
      </Link>
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <IconDevblog className="w-8 h-8 text-thistle-500 shrink-0" />
          {post.title}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{post.author?.name || post.author?.username || `ID ${post.authorId}`}</span>
          <span>·</span>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        </div>
      </header>
      <div className="prose prose-gray dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300">
        {post.body}
      </div>
    </article>
  )
}
