import { type CommunityListItem, communitiesApi } from '@/api/communities'
import { IconPeopleCommunity } from '@/components/icons'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useOutletContext, useParams } from 'react-router-dom'

function CommunityCard({ comm }: { comm: CommunityListItem }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/communities/${comm.slug || comm.id}`}
      className="block rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] overflow-hidden hover:border-[var(--theme-primary)] hover:bg-[var(--theme-surface)] transition-colors"
    >
      <div className="aspect-[2/1] bg-[var(--theme-bg)] relative">
        {comm.cover ? (
          <img src={getMediaAssetUrl(comm.cover)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconPeopleCommunity className="w-12 h-12 text-[var(--theme-text-muted)]" />
          </div>
        )}
        {comm.avatar && (
          <div className="absolute bottom-0 left-4 translate-y-1/2 w-14 h-14 rounded-xl border-2 border-[var(--theme-bg-alt)] overflow-hidden bg-[var(--theme-bg)]">
            <img src={getMediaAssetUrl(comm.avatar)} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="p-4 pt-8">
        <h2 className="font-semibold text-[var(--theme-text)] truncate">{comm.name}</h2>
        {comm.description && (
          <p className="text-sm text-[var(--theme-text-muted)] line-clamp-2 mt-1">{comm.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
          <span>
            {comm.subscribers} {t('communities.subscribers')}
          </span>
          {comm.creatorName && <span>• {comm.creatorName}</span>}
        </div>
      </div>
    </Link>
  )
}

export default function UserCommunitiesSubscriptionsPage() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const [list, setList] = useState<CommunityListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    setLoading(true)
    communitiesApi
      .getSubscriptionsByUsername(username)
      .then((r) => setList(r.communities ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [username])

  if (!username) return <p className="text-theme-muted">{t('common.noResults')}</p>
  if (loading) return <p className="text-theme-muted py-8">{t('common.loading')}</p>

  return (
    <div className="max-w-5xl mx-auto pb-10 mt-6 space-y-6 profile-subpage">
      {list.length === 0 ? (
        <p className="profile-friends-empty text-theme-muted">
          {profile?.username === username ? t('communities.myCommunitiesEmpty') : t('common.noResults')}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((comm) => (
            <li key={comm.id}>
              <CommunityCard comm={comm} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
