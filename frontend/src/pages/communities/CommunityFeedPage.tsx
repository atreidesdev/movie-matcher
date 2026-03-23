import { type CommunityPostItem, communitiesApi } from '@/api/communities'
import { IconNewspaper, IconPeopleCommunity } from '@/components/icons'
import { useAuthStore } from '@/store/authStore'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { stripHtmlToPlain } from '@/utils/richText'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function CommunityFeedPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    communitiesApi
      .getFeed()
      .then((r) => setPosts(r.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <IconPeopleCommunity className="w-7 h-7 text-thistle-500 shrink-0" />
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">{t('communities.feedTitle')}</h1>
      </div>

      {loading ? (
        <div className="animate-pulse py-8 text-[var(--theme-text-muted)]">{t('common.loading')}</div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-center">
          <IconNewspaper className="w-12 h-12 mx-auto text-[var(--theme-text-muted)] mb-4" />
          <p className="text-[var(--theme-text-muted)] mb-4">{t('communities.feedEmpty')}</p>
          <Link
            to="/communities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-white hover:opacity-90 text-sm font-medium"
          >
            <IconPeopleCommunity className="w-4 h-4" />
            {t('communities.title')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] overflow-hidden hover:border-[var(--theme-primary)] transition-colors">
                <Link to={`/communities/${post.communitySlug || post.communityId}/posts/${post.id}`}>
                  {post.previewImage && (
                    <div className="aspect-video">
                      <img src={getMediaAssetUrl(post.previewImage)} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--theme-text-muted)] mb-2">
                      <span className="font-medium text-[var(--theme-text)]">{post.communityName}</span>
                      <span>•</span>
                      <span>{post.authorName}</span>
                      <span>•</span>
                      <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                    </div>
                    <h2 className="font-semibold text-[var(--theme-text)] hover:underline">{post.title}</h2>
                    <p className="text-sm text-[var(--theme-text-muted)] mt-1 line-clamp-2">
                      {stripHtmlToPlain(post.body, 150)}
                    </p>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
