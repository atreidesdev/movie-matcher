import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconPlus, IconPeopleCommunity, IconNewspaper } from '@/components/icons'
import { communitiesApi, type CommunityDetail, type CommunityPostItem } from '@/api/communities'
import { useAuthStore } from '@/store/authStore'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { stripHtmlToPlain } from '@/utils/richText'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function CommunityDetailPage() {
  const { t } = useTranslation()
  const { idOrSlug } = useParams<{ idOrSlug: string }>()
  const { user } = useAuthStore()
  const [community, setCommunity] = useState<CommunityDetail | null>(null)
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  const loadData = () => {
    if (!idOrSlug) return
    setLoading(true)
    communitiesApi
      .getById(idOrSlug)
      .then((detail) => {
        setCommunity(detail)
        return communitiesApi.getPosts(detail.id)
      })
      .then((postsResp) => {
        setPosts(postsResp.posts ?? [])
      })
      .catch(() => {
        setCommunity(null)
        setPosts([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [idOrSlug])

  const handleSubscribe = async () => {
    if (!community || !user || subscribing) return
    setSubscribing(true)
    try {
      if (community.isSubscribed) {
        await communitiesApi.unsubscribe(community.id)
        setCommunity((c) => (c ? { ...c, isSubscribed: false, subscribers: c.subscribers - 1 } : c))
      } else {
        await communitiesApi.subscribe(community.id)
        setCommunity((c) => (c ? { ...c, isSubscribed: true, subscribers: c.subscribers + 1 } : c))
      }
    } finally {
      setSubscribing(false)
    }
  }

  const isCreator = user && community && community.creatorId === user.id

  if (!idOrSlug) return null

  if (loading && !community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse text-[var(--theme-text-muted)]">{t('common.loading')}</div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-[var(--theme-text-muted)]">{t('common.notFound')}</p>
        <Link to="/communities" className="text-[var(--theme-primary)] hover:underline mt-2 inline-block">
          {t('communities.title')}
        </Link>
      </div>
    )
  }

  const postsToShow = posts

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/communities" className="text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] mb-4 inline-block">
        ← {t('communities.title')}
      </Link>

      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] overflow-hidden mb-6">
        <div className="aspect-[3/1] bg-[var(--theme-bg)] relative">
          {community.cover ? (
            <img src={getMediaAssetUrl(community.cover)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IconPeopleCommunity className="w-16 h-16 text-[var(--theme-text-muted)]" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-start gap-4">
            {community.avatar && (
              <img
                src={getMediaAssetUrl(community.avatar)}
                alt=""
                className="w-16 h-16 rounded-xl border-2 border-[var(--theme-bg-alt)] -mt-12 bg-[var(--theme-bg-alt)]"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[var(--theme-text)]">{community.name}</h1>
              {community.description && (
                <p className="text-sm text-[var(--theme-text-muted)] mt-1">{community.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-[var(--theme-text-muted)]">
                <span>{community.subscribers} {t('communities.subscribers')}</span>
                {community.creatorUsername && (
                  <>
                    <span>•</span>
                    <Link
                      to={`/user/${community.creatorUsername}`}
                      className="hover:text-[var(--theme-primary)]"
                    >
                      {community.creatorName || community.creatorUsername}
                    </Link>
                  </>
                )}
              </div>
            </div>
            {user && !isCreator && (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  community.isSubscribed
                    ? 'border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)]'
                    : 'bg-[var(--theme-primary)] text-white hover:opacity-90'
                }`}
              >
                {community.isSubscribed ? t('communities.unsubscribe') : t('communities.subscribe')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--theme-text)]">{t('communities.posts')}</h2>
        {isCreator && (
          <Link
            to={`/communities/${community.slug || community.id}/posts/new`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--theme-primary)] text-white hover:opacity-90 text-sm font-medium"
          >
            <IconPlus className="w-4 h-4" />
            {t('communities.newPost')}
          </Link>
        )}
      </div>

      {postsToShow.length === 0 ? (
        <p className="text-[var(--theme-text-muted)] py-8 text-center">
          <IconNewspaper className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <span className="block">Нет постов</span>
        </p>
      ) : (
        <ul className="space-y-4">
          {postsToShow.map((post) => (
            <li key={post.id}>
              <Link
                to={`/communities/${community.slug || community.id}/posts/${post.id}`}
                className="block rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] overflow-hidden hover:border-[var(--theme-primary)] transition-colors"
              >
                {post.previewImage && (
                  <div className="aspect-video">
                    <img
                      src={getMediaAssetUrl(post.previewImage)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--theme-text)]">{post.title}</h3>
                  <p className="text-sm text-[var(--theme-text-muted)] mt-1 line-clamp-2">{stripHtmlToPlain(post.body, 150)}</p>
                  <div className="mt-2 text-xs text-[var(--theme-text-muted)]">
                    {post.authorName} • <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
