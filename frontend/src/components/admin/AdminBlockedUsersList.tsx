import { type CommentBannedUser, adminApi } from '@/api/admin'
import { IconFriendDelete } from '@/components/icons'
import { useToastStore } from '@/store/toastStore'
import { Calendar, MessageSquare, Unlock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const EXTEND_PRESETS = [
  { label: '24 h', hours: 24 },
  { label: '72 h', hours: 72 },
  { label: '7 d', hours: 24 * 7 },
  { label: '30 d', hours: 24 * 30 },
] as const

export default function AdminBlockedUsersList() {
  const { t } = useTranslation()
  const [list, setList] = useState<CommentBannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [extendUser, setExtendUser] = useState<CommentBannedUser | null>(null)
  const [commentUser, setCommentUser] = useState<CommentBannedUser | null>(null)

  const load = () => {
    setLoading(true)
    adminApi
      .getCommentBannedUsers()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleUnblock = async (user: CommentBannedUser) => {
    setActionId(user.id)
    try {
      await adminApi.clearCommentBan(user.id)
      useToastStore.getState().show({ title: t('admin.unblock') })
      setList((prev) => prev.filter((u) => u.id !== user.id))
    } catch {
      useToastStore.getState().show({ title: t('common.error') })
    } finally {
      setActionId(null)
    }
  }

  const handleExtend = async (user: CommentBannedUser, hours: number) => {
    setActionId(user.id)
    try {
      const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      await adminApi.setCommentBan(user.id, until)
      useToastStore
        .getState()
        .show({ title: t('admin.extendBan') + ` +${hours >= 24 ? hours / 24 + ' d' : hours + ' h'}` })
      setExtendUser(null)
      load()
    } catch {
      useToastStore.getState().show({ title: t('common.error') })
    } finally {
      setActionId(null)
    }
  }

  const formatUntil = (iso: string) => {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  const hasCommentContent = (u: CommentBannedUser) =>
    (u.bannedCommentText != null && u.bannedCommentText !== '') ||
    (u.bannedCommentReason != null && u.bannedCommentReason !== '') ||
    (u.bannedComment != null && u.bannedComment !== '')

  return (
    <section className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <IconFriendDelete className="w-6 h-6 text-amber-500" />
        {t('admin.commentBlockedUsers')}
      </h2>
      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="text-gray-500">{t('admin.commentBlockedEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 bg-white rounded-xl border border-gray-200"
            >
              <div className="min-w-0">
                <span className="font-medium text-gray-800">{u.username || u.name || `#${u.id}`}</span>
                {u.email && <span className="text-sm text-gray-500 ml-2">{u.email}</span>}
                <div className="text-sm text-amber-700 mt-0.5">
                  <Calendar className="w-4 h-4 inline mr-1 align-middle" />
                  {t('admin.blockedUntil')}: {formatUntil(u.commentBanUntil)}
                </div>
                {hasCommentContent(u) && (
                  <button
                    type="button"
                    onClick={() => setCommentUser(u)}
                    className="mt-1.5 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('admin.showComment')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setExtendUser(u)}
                  disabled={actionId !== null}
                  className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  {t('admin.extendBan')}
                </button>
                <button
                  type="button"
                  onClick={() => handleUnblock(u)}
                  disabled={actionId !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" />
                  {t('admin.unblock')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {extendUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setExtendUser(null)}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">
              {t('admin.extendBan')} — {extendUser.username || extendUser.name || `#${extendUser.id}`}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{t('admin.blockDuration')}</p>
            <div className="flex flex-wrap gap-2">
              {EXTEND_PRESETS.map(({ label, hours }) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => handleExtend(extendUser, hours)}
                  disabled={actionId !== null}
                  className="px-4 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium disabled:opacity-50"
                >
                  +{label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setExtendUser(null)}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {commentUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setCommentUser(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">
              {t('admin.bannedComment')} —{' '}
              {commentUser.username || commentUser.name || commentUser.email || `#${commentUser.id}`}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('admin.blockedUntil')}: {formatUntil(commentUser.commentBanUntil)}
            </p>
            <div className="flex-1 overflow-y-auto space-y-3">
              {commentUser.bannedCommentText != null && commentUser.bannedCommentText !== '' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {t('admin.commentText')}
                  </p>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-gray-800 whitespace-pre-wrap">
                    {commentUser.bannedCommentText}
                  </div>
                </div>
              )}
              {commentUser.bannedCommentReason != null && commentUser.bannedCommentReason !== '' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {t('admin.violationReason')}
                  </p>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-gray-800 whitespace-pre-wrap">
                    {commentUser.bannedCommentReason}
                  </div>
                </div>
              )}
              {!commentUser.bannedCommentText && !commentUser.bannedCommentReason && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-gray-800 whitespace-pre-wrap">
                  {commentUser.bannedComment || '—'}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setCommentUser(null)} className="mt-4 btn-secondary w-full sm:w-auto">
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
