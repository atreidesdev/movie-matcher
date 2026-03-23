import { usersApi } from '@/api/users'
import { IconPeopleCommunity } from '@/components/icons'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useOutletContext, useParams } from 'react-router-dom'

export default function UserFollowersPage() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const isOwnProfile = Boolean(
    username && currentUser?.username && username.toLowerCase() === currentUser.username.toLowerCase(),
  )
  const [list, setList] = useState<User[]>([])
  const [_loading, setLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    usersApi
      .getFollowersByUsername(username)
      .then(setList)
      .catch(() => {
        setError('forbidden')
        setList([])
      })
      .finally(() => setLoading(false))
  }, [username])

  if (!username) return <p className="text-theme-muted">{t('common.noResults')}</p>

  if (_loading) return <p className="text-theme-muted">{t('common.loading')}</p>

  return (
    <div className="max-w-5xl mx-auto pb-10 mt-6 space-y-6 profile-subpage">
      {list.length === 0 ? (
        <p className="profile-friends-empty text-theme-muted">{t('common.noResults')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((u) => (
            <li
              key={u.id}
              className="profile-friends-card flex items-center gap-3 p-3 bg-theme-bg-alt rounded-xl border border-theme hover:bg-theme-surface transition-colors"
            >
              <Link to={u.username ? `/user/${u.username}` : '#'} className="flex items-center gap-3 min-w-0 flex-1">
                <div className="profile-friends-card-avatar w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center shrink-0 overflow-hidden border border-theme">
                  {u.avatar ? (
                    <img src={getMediaAssetUrl(u.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <IconPeopleCommunity className="w-5 h-5 profile-friends-card-icon text-theme-muted" />
                  )}
                </div>
                <span className="profile-friends-card-name font-medium text-theme truncate">
                  {u.name || u.username || u.email}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
