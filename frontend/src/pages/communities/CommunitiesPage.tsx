import { type CommunityListItem, communitiesApi } from '@/api/communities'
import { IconPeopleCommunity, IconPlus, IconSearch } from '@/components/icons'
import { useAuthStore } from '@/store/authStore'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

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

export default function CommunitiesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [list, setList] = useState<CommunityListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'my' | 'search'>('my')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    communitiesApi
      .getList()
      .then((r) => setList(r.communities ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  const myCommunities = useMemo(() => {
    if (!user) return []
    return list.filter((c) => c.creatorId === user.id || c.isSubscribed)
  }, [list, user])

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)),
    )
  }, [list, searchQuery])

  const displayList = !user ? list : tab === 'my' ? myCommunities : searchFiltered

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <IconPeopleCommunity className="w-7 h-7 text-thistle-500 shrink-0" />
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">{t('communities.title')}</h1>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <Link
              to="/community-feed"
              className="px-4 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] hover:bg-[var(--theme-bg-alt)] text-sm font-medium transition-colors"
            >
              {t('communities.feedTitle')}
            </Link>
            <Link
              to="/communities/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-white hover:opacity-90 text-sm font-medium transition-colors"
            >
              <IconPlus className="w-4 h-4" />
              {t('communities.create')}
            </Link>
          </div>
        )}
      </div>

      {user && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab('my')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'my'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)]'
            }`}
          >
            {t('communities.myCommunities')}
          </button>
          <button
            type="button"
            onClick={() => setTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'search'
                ? 'bg-[var(--theme-primary)] text-white'
                : 'border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)]'
            }`}
          >
            {t('communities.searchCommunities')}
          </button>
        </div>
      )}

      {tab === 'search' && (
        <div className="relative mb-4">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)]"
          />
        </div>
      )}

      {loading ? (
        <div className="animate-pulse py-8 text-[var(--theme-text-muted)]">{t('common.loading')}</div>
      ) : displayList.length === 0 ? (
        <p className="text-[var(--theme-text-muted)] py-8">
          {tab === 'my' && user
            ? t('communities.myCommunitiesEmpty')
            : tab === 'search' && searchQuery.trim()
              ? t('common.noResults')
              : t('communities.noCommunities')}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayList.map((comm) => (
            <li key={comm.id}>
              <CommunityCard comm={comm} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
