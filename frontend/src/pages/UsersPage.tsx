import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Users as UsersIcon, Heart } from 'lucide-react'
import { IconPerson } from '@/components/icons'
import { usersApi, type UserListItem, type SimilarUserEnriched } from '@/api/users'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { formatLastSeenLabel } from '@/utils/formatLastSeen'
import { useAuthStore } from '@/store/authStore'

function displayName(u: UserListItem | SimilarUserEnriched): string {
  const id = 'id' in u ? u.id : (u as SimilarUserEnriched).userId
  return u.name || (u as UserListItem).username || (u as SimilarUserEnriched).username || `#${id}` || ''
}

/** Мок: недавно активные пользователи (при пустом ответе API). */
const MOCK_ACTIVITY_USERS: UserListItem[] = [
  { id: 1, username: 'alice', name: 'Алиса', avatar: undefined, lastSeenAt: new Date().toISOString() },
  { id: 2, username: 'bob', name: 'Боб', avatar: undefined, lastSeenAt: new Date(Date.now() - 3600000).toISOString() },
  {
    id: 3,
    username: 'charlie',
    name: 'Чарли',
    avatar: undefined,
    lastSeenAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 4,
    username: 'diana',
    name: 'Диана',
    avatar: undefined,
    lastSeenAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 5,
    username: 'eve',
    name: 'Ева',
    avatar: undefined,
    lastSeenAt: new Date(Date.now() - 604800000).toISOString(),
  },
]

/** Мок: пользователи с похожими вкусами (при пустом ответе API). */
const MOCK_SIMILAR_USERS: SimilarUserEnriched[] = [
  { userId: 10, score: 0.92, username: 'alice', name: 'Алиса', avatar: undefined },
  { userId: 11, score: 0.85, username: 'bob', name: 'Боб', avatar: undefined },
  { userId: 12, score: 0.78, username: 'charlie', name: 'Чарли', avatar: undefined },
  { userId: 13, score: 0.71, username: 'diana', name: 'Диана', avatar: undefined },
  { userId: 14, score: 0.65, username: 'eve', name: 'Ева', avatar: undefined },
]

export default function UsersPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const qFromUrl = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(qFromUrl)
  const { user } = useAuthStore()
  const [searchResults, setSearchResults] = useState<UserListItem[]>([])
  const [similarUsers, setSimilarUsers] = useState<SimilarUserEnriched[]>([])
  const [activityList, setActivityList] = useState<UserListItem[]>([])
  const [activityPage, setActivityPage] = useState(0)
  const [searching, setSearching] = useState(false)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [loadingActivity, setLoadingActivity] = useState(true)

  const ACTIVITY_PAGE_SIZE = 15

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const list = await usersApi.searchUsers(q.trim(), 30)
      setSearchResults(list)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q) {
      const timer = setTimeout(() => searchUsers(q), 300)
      return () => clearTimeout(timer)
    }
    setSearchResults([])
  }, [query, searchUsers])

  useEffect(() => {
    setLoadingActivity(true)
    const offset = activityPage * ACTIVITY_PAGE_SIZE
    usersApi
      .getActivityUsers(ACTIVITY_PAGE_SIZE, offset)
      .then((list) => setActivityList(list.length > 0 ? list : activityPage === 0 ? MOCK_ACTIVITY_USERS : []))
      .catch(() => setActivityList(activityPage === 0 ? MOCK_ACTIVITY_USERS : []))
      .finally(() => setLoadingActivity(false))
  }, [activityPage])

  useEffect(() => {
    if (!user) {
      setSimilarUsers([])
      return
    }
    setLoadingSimilar(true)
    usersApi
      .getSimilarUsers(20)
      .then((list) => setSimilarUsers(list.length > 0 ? list : MOCK_SIMILAR_USERS))
      .catch(() => setSimilarUsers(MOCK_SIMILAR_USERS))
      .finally(() => setLoadingSimilar(false))
  }, [user])

  useEffect(() => {
    setQuery(qFromUrl)
  }, [qFromUrl])

  const handleSearchChange = (value: string) => {
    setQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('q', value.trim())
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const showSearch = query.length > 0
  const showActivity = !showSearch || searchResults.length === 0

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-[var(--theme-text)] mb-6 flex items-center gap-2">
        <UsersIcon className="w-7 h-7 text-[var(--theme-primary)]" aria-hidden />
        {t('users.pageTitle')}
      </h1>

      <div className="relative mb-8">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('users.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
          aria-label={t('users.searchPlaceholder')}
        />
      </div>

      {showSearch && (
        <section className="mb-10">
          <h2 className="text-lg font-medium text-[var(--theme-text)] mb-4">
            {searching ? t('common.loading') : t('users.searchResults')}
          </h2>
          {!searching && searchResults.length === 0 && query.trim() && (
            <p className="text-[var(--theme-text-muted)]">{t('users.noUsersFound')}</p>
          )}
          {!searching && searchResults.length > 0 && (
            <ul className="space-y-2">
              {searchResults.map((u) => (
                <UserCard key={u.id} user={u} />
              ))}
            </ul>
          )}
        </section>
      )}

      {user && showActivity && (
        <section className="mb-10">
          <h2 className="text-lg font-medium text-[var(--theme-text)] mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-[var(--theme-primary)]" />
            {t('users.similarTaste')}
          </h2>
          {loadingSimilar ? (
            <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
          ) : similarUsers.length === 0 ? (
            <p className="text-[var(--theme-text-muted)]">{t('users.noSimilarUsers')}</p>
          ) : (
            <ul className="space-y-2">
              {similarUsers.map((u) => (
                <SimilarUserCard key={u.userId} user={u} />
              ))}
            </ul>
          )}
        </section>
      )}

      {showActivity && (
        <section>
          <h2 className="text-lg font-medium text-[var(--theme-text)] mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-[var(--theme-primary)]" />
            {t('users.recentlyActive')}
          </h2>
          {loadingActivity ? (
            <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
          ) : activityList.length === 0 ? (
            <p className="text-[var(--theme-text-muted)]">{t('users.noUsersYet')}</p>
          ) : (
            <>
              <ul className="space-y-2">
                {activityList.map((u) => (
                  <UserCard key={u.id} user={u} showLastSeen />
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={activityPage === 0}
                  onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--theme-bg-alt)] transition-colors text-sm font-medium"
                >
                  {t('common.prev')}
                </button>
                <span className="text-sm text-[var(--theme-text-muted)]">{activityPage + 1}</span>
                <button
                  type="button"
                  disabled={activityList.length < ACTIVITY_PAGE_SIZE}
                  onClick={() => setActivityPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--theme-bg-alt)] transition-colors text-sm font-medium"
                >
                  {t('common.next')}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}

function UserCard({ user, showLastSeen }: { user: UserListItem; showLastSeen?: boolean }) {
  const { t } = useTranslation()
  const href = user.username ? `/user/${user.username}` : '#'
  return (
    <li>
      <Link
        to={href}
        className="flex items-center gap-4 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] hover:border-[var(--theme-primary)]/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
      >
        <div className="w-12 h-12 rounded-full bg-[var(--theme-surface)] flex items-center justify-center shrink-0 overflow-hidden">
          {user.avatar ? (
            <img src={getMediaAssetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
          ) : (
            <IconPerson className="w-6 h-6 text-[var(--theme-text-muted)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-medium text-[var(--theme-text)] block truncate">{displayName(user)}</span>
          {user.username && user.name && (
            <span className="text-sm text-[var(--theme-text-muted)] block truncate">@{user.username}</span>
          )}
        </div>
        {showLastSeen && user.lastSeenAt && (
          <span className="text-sm text-[var(--theme-text-muted)] shrink-0">
            {formatLastSeenLabel(user.lastSeenAt, t)}
          </span>
        )}
      </Link>
    </li>
  )
}

function SimilarUserCard({ user }: { user: SimilarUserEnriched }) {
  const { t } = useTranslation()
  const href = user.username ? `/user/${user.username}` : '#'
  return (
    <li>
      <Link
        to={href}
        className="flex items-center gap-4 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] hover:border-[var(--theme-primary)]/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
      >
        <div className="w-12 h-12 rounded-full bg-[var(--theme-surface)] flex items-center justify-center shrink-0 overflow-hidden">
          {user.avatar ? (
            <img src={getMediaAssetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
          ) : (
            <IconPerson className="w-6 h-6 text-[var(--theme-text-muted)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-medium text-[var(--theme-text)] block truncate">{displayName(user)}</span>
          {user.username && user.name && (
            <span className="text-sm text-[var(--theme-text-muted)] block truncate">@{user.username}</span>
          )}
        </div>
        <span className="text-sm text-[var(--theme-text-muted)] shrink-0" title={t('users.similarityScore')}>
          {user.score <= 1 ? `${Math.min(100, Math.round(user.score * 100))}%` : `${Math.round(user.score)}`}
        </span>
      </Link>
    </li>
  )
}
