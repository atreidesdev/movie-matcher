import { type CommunityPostItem, communitiesApi } from '@/api/communities'
import { RichTextContent } from '@/components/richText/RichTextContent'
import { useAuthStore } from '@/store/authStore'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

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

export default function CommunityPostDetailPage() {
  const { t } = useTranslation()
  const { idOrSlug, postId } = useParams<{ idOrSlug: string; postId: string }>()
  const { user } = useAuthStore()
  const [post, setPost] = useState<CommunityPostItem | null>(null)
  const [communityCreatorId, setCommunityCreatorId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idOrSlug || !postId) return
    const pid = Number(postId) || 0
    if (pid <= 0) {
      setPost(null)
      setLoading(false)
      return
    }
    const commId = Number(idOrSlug) || 0
    if (commId > 0) {
      communitiesApi
        .getById(String(commId))
        .then((comm) => {
          setCommunityCreatorId(comm.creatorId)
          return communitiesApi.getPost(comm.id, pid)
        })
        .then(setPost)
        .catch(() => setPost(null))
        .finally(() => setLoading(false))
    } else {
      communitiesApi
        .getById(idOrSlug)
        .then((comm) => {
          setCommunityCreatorId(comm.creatorId)
          return communitiesApi.getPost(comm.id, pid)
        })
        .then(setPost)
        .catch(() => setPost(null))
        .finally(() => setLoading(false))
    }
  }, [idOrSlug, postId])

  if (!idOrSlug || !postId) return null

  if (loading && !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse text-[var(--theme-text-muted)]">{t('common.loading')}</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-[var(--theme-text-muted)]">{t('common.notFound')}</p>
        <Link to="/communities" className="text-[var(--theme-primary)] hover:underline mt-2 inline-block">
          {t('communities.title')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        to={`/communities/${post.communitySlug || post.communityId}`}
        className="text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] mb-4 inline-block"
      >
        ← {t('communities.backToCommunity')} {post.communityName}
      </Link>
      <article className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-[var(--theme-text)] flex-1">{post.title}</h1>
          {user && (post.authorId === user.id || communityCreatorId === user.id) && (
            <Link
              to={`/communities/${post.communitySlug || post.communityId}/posts/${post.id}/edit`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg)] hover:text-[var(--theme-primary)] shrink-0"
            >
              <Pencil className="w-4 h-4" />
              {t('common.edit')}
            </Link>
          )}
        </div>
        {post.previewImage && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img src={getMediaAssetUrl(post.previewImage)} alt="" className="w-full max-h-80 object-cover" />
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-[var(--theme-text-muted)] mt-2 mb-4">
          <Link
            to={`/communities/${post.communitySlug || post.communityId}`}
            className="hover:text-[var(--theme-primary)]"
          >
            {post.communityName}
          </Link>
          <span>•</span>
          {post.authorUsername ? (
            <Link to={`/user/${post.authorUsername}`} className="hover:text-[var(--theme-primary)]">
              {post.authorName}
            </Link>
          ) : (
            <span>{post.authorName}</span>
          )}
          <span>•</span>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        </div>
        <div className="prose prose-sm max-w-none text-[var(--theme-text)]">
          <RichTextContent html={post.body} />
        </div>
        {post.attachments && post.attachments.length > 0 && (
          <section className="mt-6 pt-4 border-t border-[var(--theme-border)]">
            <h2 className="text-lg font-semibold text-[var(--theme-text)] mb-3">{t('communities.attachments')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {post.attachments.map((att, i) =>
                att.type === 'image' ? (
                  <img
                    key={i}
                    src={getMediaAssetUrl(att.path)}
                    alt=""
                    className="rounded-lg w-full object-cover max-h-80"
                  />
                ) : (
                  <video key={i} src={getMediaAssetUrl(att.path)} controls className="rounded-lg w-full max-h-80" />
                ),
              )}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
