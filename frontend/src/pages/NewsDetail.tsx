import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil } from 'lucide-react'
import { IconNewspaper } from '@/components/icons'
import BookmarkButton from '@/components/BookmarkButton'
import { IconComment, IconSend } from '@/components/icons'
import { newsApi, newsCommentsApi } from '@/api/news'
import { useAuthStore } from '@/store/authStore'

const NEWS_EDITOR_ROLES = ['admin', 'content_creator', 'developer', 'owner'] as const
function canEditNews(role: string | undefined): boolean {
  return role != null && (NEWS_EDITOR_ROLES as readonly string[]).includes(role)
}
import type { NewsDetail as NewsDetailType, NewsComment } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function parseTags(tags?: string): string[] {
  if (!tags || !tags.trim()) return []
  return tags.split(/[\s,]+/).filter(Boolean)
}

export default function NewsDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [news, setNews] = useState<NewsDetailType | null>(null)
  const [comments, setComments] = useState<NewsComment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const newsId = id ? parseInt(id, 10) : NaN

  // Первичная загрузка новости и комментариев
  useEffect(() => {
    if (Number.isNaN(newsId)) {
      setLoading(false)
      return
    }
    Promise.all([newsApi.getById(newsId), newsCommentsApi.getList(newsId)])
      .then(([n, c]) => {
        setNews(n)
        setComments(c.comments ?? [])
      })
      .catch(() => setNews(null))
      .finally(() => setLoading(false))
  }, [newsId])

  // Если нет WebSocket для комментариев новостей — периодически подтягиваем список (fallback без real-time)
  const COMMENTS_POLL_INTERVAL_MS = 25_000
  useEffect(() => {
    if (Number.isNaN(newsId)) return
    const interval = setInterval(() => {
      newsCommentsApi
        .getList(newsId)
        .then((res) => setComments(res.comments ?? []))
        .catch(() => {})
    }, COMMENTS_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [newsId])

  const submitComment = async () => {
    if (Number.isNaN(newsId) || !commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      await newsCommentsApi.create(newsId, {
        text: commentText.trim(),
        parentId: replyTo?.id,
      })
      setCommentText('')
      setReplyTo(null)
      const { comments: next } = await newsCommentsApi.getList(newsId)
      setComments(next ?? [])
      if (news) setNews({ ...news, commentCount: news.commentCount + 1 })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse py-8 text-[var(--theme-text-muted)]">{t('common.loading')}</div>
  }
  if (!news) {
    return (
      <div className="space-y-4">
        <Link
          to="/news"
          className="inline-flex items-center gap-1 text-[var(--theme-primary)] hover:underline title-hover-theme"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.backToList')}
        </Link>
        <p className="text-[var(--theme-text-muted)]">{t('news.notFound')}</p>
      </div>
    )
  }

  return (
    <article className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/news"
          className="inline-flex items-center gap-1 text-[var(--theme-primary)] hover:underline text-sm title-hover-theme"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.backToList')}
        </Link>
        {canEditNews(user?.role) && (
          <Link to={`/news/${news.id}/edit`} className="btn-edit btn-secondary flex items-center gap-1 text-sm">
            <Pencil className="w-4 h-4" />
            {t('news.admin.edit')}
          </Link>
        )}
        {user && <BookmarkButton targetType="news" targetId={news.id} />}
      </div>

      <header>
        {news.previewImage && (
          <div className="rounded-xl overflow-hidden mb-4 aspect-video max-h-[360px] bg-[var(--theme-bg-alt)]">
            <img src={getMediaAssetUrl(news.previewImage)} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--theme-text)] flex items-center gap-2">
          <IconNewspaper className="w-8 h-8 text-thistle-500 shrink-0" />
          {news.previewTitle || news.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {news.author && (
            <Link
              to={news.author.username ? `/user/${news.author.username}` : '#'}
              className="flex items-center gap-2 text-[var(--theme-text-muted)] title-hover-theme"
            >
              {news.author.avatar ? (
                <img
                  src={getMediaAssetUrl(news.author.avatar)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center text-[var(--theme-text-muted)] font-medium">
                  {(news.author.name || news.author.username || '?')[0].toUpperCase()}
                </div>
              )}
              <span>{news.author.name || news.author.username || `ID ${news.authorId}`}</span>
            </Link>
          )}
          <time dateTime={news.createdAt} className="text-sm text-[var(--theme-text-muted)]">
            {formatDate(news.createdAt)}
          </time>
          <span className="flex items-center gap-1 text-sm text-[var(--theme-text-muted)]">
            <IconComment className="w-4 h-4" />
            {news.commentCount}
          </span>
        </div>
        {parseTags(news.tags).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {parseTags(news.tags).map((tag) => (
              <span
                key={tag}
                className="text-sm px-2 py-1 rounded bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="prose prose-gray dark:prose-invert max-w-none text-[var(--theme-text)] news-body"
        dangerouslySetInnerHTML={{ __html: news.body }}
      />

      {news.attachments && news.attachments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--theme-text)] mb-3">{t('news.attachments')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {news.attachments.map((att, i) =>
              att.type === 'image' ? (
                <img
                  key={i}
                  src={getMediaAssetUrl(att.path)}
                  alt=""
                  className="rounded-lg w-full object-cover max-h-80"
                />
              ) : (
                <video key={i} src={getMediaAssetUrl(att.path)} controls className="rounded-lg w-full max-h-80" />
              )
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-[var(--theme-text)] mb-3 flex items-center gap-2">
          <IconComment className="w-5 h-5" />
          {t('news.comments')} ({news.commentCount})
        </h2>

        {user && (
          <div className="mb-6">
            {replyTo && (
              <p className="text-sm text-[var(--theme-text-muted)] mb-1">
                {t('news.replyTo')}: {replyTo.name}{' '}
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-[var(--theme-primary)] hover:underline"
                >
                  {t('common.cancel')}
                </button>
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('news.commentPlaceholder')}
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={!commentText.trim() || submitting}
                className="btn btn-primary flex items-center gap-1"
              >
                <IconSend className="w-4 h-4" />
                {t('common.send')}
              </button>
            </div>
          </div>
        )}
        {!user && (
          <p className="text-[var(--theme-text-muted)] text-sm mb-4">
            <Link to="/login" className="text-[var(--theme-primary)] hover:underline title-hover-theme">
              {t('news.loginToComment')}
            </Link>
          </p>
        )}

        <CommentTree
          newsId={newsId}
          comments={comments}
          onCommentsChange={setComments}
          currentUserId={user?.id}
          onReply={(id, name) => {
            setReplyTo({ id, name })
            setCommentText('')
          }}
          onDelete={async (commentId) => {
            await newsCommentsApi.delete(newsId, commentId)
            const { comments: next } = await newsCommentsApi.getList(newsId)
            setComments(next ?? [])
            if (news) setNews({ ...news, commentCount: Math.max(0, news.commentCount - 1) })
          }}
          getMediaAssetUrl={getMediaAssetUrl}
          formatDate={formatDate}
          t={t}
        />
      </section>
    </article>
  )
}

function CommentTree({
  newsId,
  comments,
  onCommentsChange,
  currentUserId,
  onReply,
  onDelete,
  getMediaAssetUrl,
  formatDate,
  t,
}: {
  newsId: number
  comments: NewsComment[]
  onCommentsChange: Dispatch<SetStateAction<NewsComment[]>>
  currentUserId?: number
  onReply: (id: number, name: string) => void
  onDelete: (commentId: number) => Promise<void>
  getMediaAssetUrl: (p: string) => string
  formatDate: (iso: string) => string
  t: (key: string) => string
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingSubmitting, setEditingSubmitting] = useState(false)

  if (comments.length === 0) {
    return <p className="text-[var(--theme-text-muted)] text-sm">{t('news.noComments')}</p>
  }

  const canDelete = (userId: number) => currentUserId != null && currentUserId === userId
  const canEdit = (userId: number) => currentUserId != null && currentUserId === userId

  const handleEditSave = async (commentId: number) => {
    if (!editingText.trim() || editingSubmitting) return
    setEditingSubmitting(true)
    try {
      await newsCommentsApi.update(newsId, commentId, editingText.trim())
      const { comments: next } = await newsCommentsApi.getList(newsId)
      onCommentsChange(next ?? [])
      setEditingId(null)
      setEditingText('')
    } catch {
    } finally {
      setEditingSubmitting(false)
    }
  }

  const renderComment = (c: NewsComment, isReply = false) => (
    <div className="flex items-start gap-2">
      {c.user?.avatar ? (
        <img
          src={getMediaAssetUrl(c.user.avatar)}
          alt=""
          className={
            isReply ? 'w-6 h-6 rounded-full object-cover shrink-0' : 'w-8 h-8 rounded-full object-cover shrink-0'
          }
        />
      ) : (
        <div
          className={`shrink-0 flex items-center justify-center text-xs text-[var(--theme-text-muted)] font-medium rounded-full ${
            isReply ? 'w-6 h-6 bg-[var(--theme-bg-alt)]' : 'w-8 h-8 bg-[var(--theme-bg-alt)]'
          }`}
        >
          {(c.user?.name || c.user?.username || '?')[0].toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span
          className={isReply ? 'font-medium text-[var(--theme-text)] text-sm' : 'font-medium text-[var(--theme-text)]'}
        >
          {c.user?.name || c.user?.username || `ID ${c.userId}`}
        </span>
        <span className={`text-[var(--theme-text-muted)] ${isReply ? 'text-xs' : 'text-sm'} ml-2`}>
          {formatDate(c.createdAt)}
        </span>
        {editingId === c.id ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="input w-full min-h-[80px] resize-y text-sm"
              maxLength={2000}
              disabled={editingSubmitting}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleEditSave(c.id)}
                disabled={editingSubmitting || !editingText.trim()}
                className="text-xs px-2 py-1 rounded bg-[var(--theme-primary)] text-white hover:opacity-90 disabled:opacity-50"
              >
                {editingSubmitting ? t('common.loading') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setEditingText('')
                }}
                disabled={editingSubmitting}
                className="text-xs px-2 py-1 rounded border border-[var(--theme-border)] hover:bg-[var(--theme-surface)]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-[var(--theme-text)] text-sm">{c.text}</p>
        )}
        {editingId !== c.id && (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => onReply(c.id, c.user?.name || c.user?.username || '')}
              className="text-xs text-[var(--theme-primary)] hover:underline"
            >
              {t('news.reply')}
            </button>
            {canEdit(c.userId) && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(c.id)
                  setEditingText(c.text)
                }}
                className="text-xs text-[var(--theme-primary)] hover:underline"
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete(c.userId) && (
              <button
                type="button"
                onClick={async () => {
                  setDeletingId(c.id)
                  try {
                    await onDelete(c.id)
                  } finally {
                    setDeletingId(null)
                  }
                }}
                disabled={deletingId === c.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {deletingId === c.id ? t('common.loading') : t('common.delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="border-l-2 border-[var(--theme-border)] pl-4">
          {renderComment(c, false)}
          {c.replies && c.replies.length > 0 && (
            <ul className="mt-3 ml-4 space-y-3">
              {c.replies.map((r) => (
                <li key={r.id} className="border-l-2 border-[var(--theme-border)] pl-3">
                  {renderComment(r, true)}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
