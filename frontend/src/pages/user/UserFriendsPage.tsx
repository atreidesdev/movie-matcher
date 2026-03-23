import { type FriendRequestItem, friendsApi } from '@/api/friends'
import { usersApi } from '@/api/users'
import { IconActivity, IconComment, IconCross, IconFriendDelete, IconPerson } from '@/components/icons'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'
import { formatLastSeenLabel } from '@/utils/formatLastSeen'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link, useOutletContext, useParams } from 'react-router-dom'

function userName(u: User | undefined): string {
  if (!u) return ''
  return u.name || u.username || u.email || ''
}

export default function UserFriendsPage() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const [list, setList] = useState<User[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [requestsReceived, setRequestsReceived] = useState<FriendRequestItem[]>([])
  const [requestsSent, setRequestsSent] = useState<FriendRequestItem[]>([])
  const [_loading, setLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)
  const [removeConfirmUser, setRemoveConfirmUser] = useState<User | null>(null)
  const [rejectConfirmRequest, setRejectConfirmRequest] = useState<FriendRequestItem | null>(null)

  const isOwn = Boolean(
    username && currentUser?.username && username.toLowerCase() === currentUser.username.toLowerCase(),
  )

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    if (isOwn) {
      Promise.all([friendsApi.getFriends(), friendsApi.getRequests()])
        .then(([f, r]) => {
          setFriends(f)
          setRequestsReceived(r.received ?? [])
          setRequestsSent(r.sent ?? [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      usersApi
        .getFriendsByUsername(username)
        .then(setList)
        .catch(() => {
          setError('forbidden')
          setList([])
        })
        .finally(() => setLoading(false))
    }
  }, [username, isOwn])

  const loadOwn = () => {
    if (!username || !isOwn) return
    setLoading(true)
    Promise.all([friendsApi.getFriends(), friendsApi.getRequests()])
      .then(([f, r]) => {
        setFriends(f)
        setRequestsReceived(r.received ?? [])
        setRequestsSent(r.sent ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleAccept = (requestId: number) => {
    friendsApi.acceptRequest(requestId).then(loadOwn)
  }

  const handleReject = (requestId: number) => {
    friendsApi.rejectRequest(requestId).then(() => {
      loadOwn()
      setRejectConfirmRequest(null)
    })
  }

  const handleRemove = (friendId: number) => {
    friendsApi.removeFriend(friendId).then(() => {
      loadOwn()
      setRemoveConfirmUser(null)
    })
  }

  if (!username) return <p className="text-theme-muted">{t('common.noResults')}</p>

  const hasRequests = isOwn && (requestsReceived.length > 0 || requestsSent.length > 0)
  const displayList = isOwn ? friends : list

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 mt-6 space-y-6">
      {isOwn && (
        <Link
          to="/activity?mode=feed"
          className="profile-friends-feed-link inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white transition-colors text-sm font-medium"
        >
          <IconActivity size={16} className="shrink-0" />
          {t('activity.friendsFeed')}
        </Link>
      )}

      {hasRequests && (
        <section className="space-y-6">
          <h2 className="profile-friends-section-title text-lg font-semibold text-theme">{t('friends.requests')}</h2>
          {requestsReceived.length > 0 && (
            <div>
              <h3 className="profile-friends-subsection-title text-sm font-medium text-theme-muted mb-2">
                {t('friends.received')}
              </h3>
              <ul className="space-y-2">
                {requestsReceived.map((req) => (
                  <li
                    key={req.id}
                    className="profile-friends-card flex items-center justify-between gap-3 p-4 rounded-xl bg-theme-bg-alt border border-theme shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Link
                      to={req.sender?.username ? `/user/${req.sender.username}` : '#'}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div className="profile-friends-card-avatar w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center shrink-0 overflow-hidden border border-theme">
                        {req.sender?.avatar ? (
                          <img
                            src={getMediaAssetUrl(req.sender.avatar)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IconPerson className="w-5 h-5 profile-friends-card-icon text-theme-muted" />
                        )}
                      </div>
                      <span className="profile-friends-card-name font-medium truncate">{userName(req.sender)}</span>
                    </Link>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        {t('friends.accept')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectConfirmRequest(req)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-theme hover:bg-theme-surface text-theme-muted text-sm font-medium"
                      >
                        <IconCross className="w-4 h-4" />
                        {t('friends.reject')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {requestsSent.length > 0 && (
            <div>
              <h3 className="profile-friends-subsection-title text-sm font-medium text-theme-muted mb-2">
                {t('friends.sent')}
              </h3>
              <ul className="space-y-2">
                {requestsSent.map((req) => (
                  <li
                    key={req.id}
                    className="profile-friends-card flex items-center justify-between gap-3 p-4 rounded-xl bg-theme-bg-alt border border-theme shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Link
                      to={req.receiver?.username ? `/user/${req.receiver.username}` : '#'}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div className="profile-friends-card-avatar w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center shrink-0 overflow-hidden border border-theme">
                        {req.receiver?.avatar ? (
                          <img
                            src={getMediaAssetUrl(req.receiver.avatar)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IconPerson className="w-5 h-5 profile-friends-card-icon text-theme-muted" />
                        )}
                      </div>
                      <span className="profile-friends-card-name font-medium truncate">{userName(req.receiver)}</span>
                    </Link>
                    <span className="profile-friends-card-muted text-sm shrink-0">{t('friends.pending')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="profile-friends-section-title text-lg font-semibold text-theme">
          {isOwn ? t('friends.myFriends') : t('profile.friends')}
        </h2>
        {displayList.length === 0 ? (
          <p className="profile-friends-empty text-theme-muted">{t('friends.noFriends')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayList.map((u) => (
              <li
                key={u.id}
                className="profile-friends-card flex items-center justify-between gap-3 p-4 rounded-xl bg-theme-bg-alt border border-theme shadow-md hover:shadow-lg transition-shadow"
              >
                <Link to={u.username ? `/user/${u.username}` : '#'} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="profile-friends-card-avatar w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center shrink-0 overflow-hidden border border-theme">
                    {u.avatar ? (
                      <img src={getMediaAssetUrl(u.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <IconPerson className="w-5 h-5 profile-friends-card-icon text-theme-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="profile-friends-card-name font-medium text-theme truncate block">
                      {u.name || u.username || u.email}
                    </span>
                    {u.lastSeenAt && (
                      <span className="profile-friends-card-muted text-xs text-theme-muted block truncate">
                        {formatLastSeenLabel(u.lastSeenAt, t)}
                      </span>
                    )}
                  </div>
                </Link>
                {isOwn && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      to={`/messages?with=${u.id}`}
                      className="p-2 rounded-lg border border-theme hover:bg-theme-surface text-theme-muted"
                      title={t('messages.openChat')}
                      aria-label={t('messages.openChat')}
                    >
                      <IconComment className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setRemoveConfirmUser(u)}
                      className="p-2 rounded-lg border border-theme hover:bg-theme-surface text-theme-muted"
                      title={t('friends.removeFromFriends')}
                      aria-label={t('friends.removeFromFriends')}
                    >
                      <IconFriendDelete className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {rejectConfirmRequest &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50"
            style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', minHeight: '100%' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-request-confirm-title"
            onClick={(e) => e.target === e.currentTarget && setRejectConfirmRequest(null)}
          >
            <div
              className="bg-theme-bg-alt rounded-xl shadow-xl border border-theme p-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="reject-request-confirm-title" className="text-lg font-semibold text-theme mb-2">
                {t('friends.rejectConfirm', { name: userName(rejectConfirmRequest.sender) })}
              </h2>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setRejectConfirmRequest(null)}
                  className="px-4 py-2 rounded-lg border border-theme hover:bg-theme-surface text-theme-muted font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(rejectConfirmRequest.id)}
                  className="px-4 py-2 rounded-lg border border-theme hover:bg-theme-surface text-theme-muted font-medium"
                >
                  {t('friends.reject')}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {removeConfirmUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50"
            style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', minHeight: '100%' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-friend-confirm-title"
            onClick={(e) => e.target === e.currentTarget && setRemoveConfirmUser(null)}
          >
            <div
              className="bg-theme-bg-alt rounded-xl shadow-xl border border-theme p-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="remove-friend-confirm-title" className="text-lg font-semibold text-theme mb-2">
                {t('friends.removeConfirm', { name: userName(removeConfirmUser) })}
              </h2>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setRemoveConfirmUser(null)}
                  className="px-4 py-2 rounded-lg border border-theme hover:bg-theme-surface text-theme-muted font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(removeConfirmUser.id)}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium shadow-sm"
                >
                  {t('friends.removeFromFriends')}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
