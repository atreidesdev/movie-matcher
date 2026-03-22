import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { notificationsApi, type NotificationItem } from '@/api/notifications'
import { getMediaPathFromApiType } from '@/utils/mediaPaths'
import { subscribeToPush, isPushSupported, getNotificationPermission } from '@/utils/pushSubscription'
import { useAuthStore } from '@/store/authStore'

function getNotificationLink(n: NotificationItem): string | null {
  const extra = n.extra ?? {}
  if (n.relatedType === 'user' && typeof extra.username === 'string') {
    return `/user/${extra.username}`
  }
  const mediaType = (extra.mediaType ?? n.relatedType) as string
  const mediaId = Number(extra.mediaId ?? n.relatedId)
  if (
    mediaType &&
    mediaId &&
    [
      'movie',
      'anime',
      'game',
      'tvSeries',
      'manga',
      'book',
      'lightNovel',
      'cartoonSeries',
      'cartoonMovie',
      'animeMovie',
    ].includes(mediaType)
  ) {
    return getMediaPathFromApiType(mediaType, mediaId)
  }
  if (
    n.relatedType === 'movie' ||
    n.relatedType === 'anime' ||
    n.relatedType === 'game' ||
    n.relatedType === 'tv_series' ||
    n.relatedType === 'manga' ||
    n.relatedType === 'book' ||
    n.relatedType === 'light_novel'
  ) {
    return getMediaPathFromApiType(n.relatedType, Number(n.relatedId))
  }
  if (n.relatedType === 'news' && n.relatedId) {
    return `/news/${n.relatedId}`
  }
  return null
}

function NotificationContent({ n }: { n: NotificationItem }) {
  const { t } = useTranslation()
  const extra = n.extra ?? {}
  const linkUrl = getNotificationLink(n)
  const username = typeof extra.username === 'string' ? extra.username : ''
  const mediaTitle = typeof extra.mediaTitle === 'string' ? extra.mediaTitle : n.title || ''
  const reason = typeof extra.reason === 'string' ? extra.reason : ''

  if (n.type === 'friend_accepted' && username) {
    return (
      <>
        <p className="font-medium text-gray-900">
          <Trans
            i18nKey="notifications.types.friend_accepted.title"
            values={{ username }}
            components={[<Link key="u" to={`/user/${username}`} className="link-underline-animate" />]}
          />
        </p>
        <p className="text-sm text-gray-600 mt-0.5">{t('notifications.types.friend_accepted.body')}</p>
      </>
    )
  }

  if (n.type === 'media_update' && linkUrl) {
    if (reason === 'status_change') {
      const statusRaw = typeof extra.status === 'string' ? extra.status : (n.body ?? '')
      const statusLabel = statusRaw ? t(`mediaStatus.${statusRaw}`, statusRaw) : ''
      return (
        <>
          <p className="font-medium text-gray-900">
            <Trans
              i18nKey="notifications.types.media_update.statusTitle"
              values={{ title: mediaTitle }}
              components={[<Link key="m" to={linkUrl} className="link-underline-animate" />]}
            />
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {t('notifications.types.media_update.statusBody', { status: statusLabel })}
          </p>
        </>
      )
    }
    if (reason === 'release_date') {
      const date = typeof extra.date === 'string' ? extra.date : (n.body ?? '')
      return (
        <>
          <p className="font-medium text-gray-900">
            <Trans
              i18nKey="notifications.types.media_update.releaseTitle"
              values={{ title: mediaTitle }}
              components={[<Link key="m" to={linkUrl} className="link-underline-animate" />]}
            />
          </p>
          <p className="text-sm text-gray-600 mt-0.5">{t('notifications.types.media_update.releaseBody', { date })}</p>
        </>
      )
    }
  }

  if (n.type === 'comment_reply') {
    const preview = typeof extra.preview === 'string' ? extra.preview : (n.body ?? '')
    return (
      <>
        <p className="font-medium text-gray-900">{t('notifications.types.comment_reply.title')}</p>
        {preview && (
          <p className="text-sm text-gray-600 mt-0.5">
            {linkUrl ? (
              <Link to={linkUrl} className="link-underline-animate">
                {preview}
              </Link>
            ) : (
              preview
            )}
          </p>
        )}
      </>
    )
  }

  if (n.type === 'new_follower' && username) {
    return (
      <p className="font-medium text-gray-900">
        <Trans
          i18nKey="notifications.types.new_follower.title"
          values={{ username }}
          components={[<Link key="u" to={`/user/${username}`} className="link-underline-animate" />]}
        />
      </p>
    )
  }

  return (
    <>
      <p className="font-medium text-gray-900">{n.title}</p>
      {n.body && <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>}
    </>
  )
}

export default function Notifications() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [list, setList] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushMessage, setPushMessage] = useState<string | null>(null)
  const pushSupported = isPushSupported()
  const pushPermission = getNotificationPermission()

  useEffect(() => {
    notificationsApi
      .getList({ limit: 50 })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  const handleMarkRead = (id: number) => {
    notificationsApi
      .markRead(id)
      .then(() => {
        setList((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
      })
      .catch(() => {})
  }

  const handleMarkAllRead = () => {
    notificationsApi
      .markAllRead()
      .then(() => {
        setList((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
      })
      .catch(() => {})
  }

  const unreadCount = list.filter((n) => !n.readAt).length

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('nav.notifications')}</h1>
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t('nav.notifications')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead} className="text-sm link-underline-animate">
              {t('notifications.markAllRead')}
            </button>
          )}
          {user && pushSupported && pushPermission !== 'granted' && (
            <button
              type="button"
              disabled={pushLoading}
              onClick={async () => {
                setPushMessage(null)
                setPushLoading(true)
                const result = await subscribeToPush()
                setPushMessage(result.message)
                setPushLoading(false)
              }}
              className="text-sm px-3 py-1.5 rounded-lg bg-space_indigo-600 hover:bg-space_indigo-500 text-lavender-500 disabled:opacity-50"
            >
              {pushLoading ? t('common.loading') : t('notifications.enablePush')}
            </button>
          )}
        </div>
      </div>
      {pushMessage && (
        <p
          className={`text-sm mb-4 ${pushMessage.includes('denied') || pushMessage.includes('failed') ? 'text-amber-700' : 'text-gray-600'}`}
        >
          {pushMessage}
        </p>
      )}
      {list.length === 0 ? (
        <p className="text-gray-500">{t('notifications.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => (
            <li
              key={n.id}
              className={`p-4 rounded-xl border ${n.readAt ? 'bg-gray-50 border-gray-200' : 'bg-lavender-500/10 border-lavender-500/30'}`}
            >
              <div className="flex justify-between gap-2">
                <div>
                  <NotificationContent n={n} />
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 text-sm link-underline-animate"
                  >
                    {t('notifications.markRead')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
