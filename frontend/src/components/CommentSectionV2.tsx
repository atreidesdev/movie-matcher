import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Ban, Flag, Pencil, Trash2, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { commentsApi, CommentEntityType } from '@/api/comments'
import { discussionsApi } from '@/api/discussions'
import { reactionsApi, type CommentEmojiType } from '@/api/reactions'
import { adminApi } from '@/api/admin'
import { reportsApi } from '@/api/reports'
import { Comment } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { useToastStore } from '@/store/toastStore'
import { IconReply, IconSend, IconCross, IconLike, IconDislike } from '@/components/icons'
import { useCommentsWs } from '@/hooks/useCommentsWs'
import { RichTextEditor, type RichTextEditorRef, richEditorIsSubmittable } from '@/components/richText/RichTextEditor'
import { RichTextContent } from '@/components/richText/RichTextContent'
import {
  isRichTextEmpty,
  sanitizeRichHtml,
  RICH_TEXT_MAX_COMMENT_HTML,
} from '@/utils/richText'

const entityTypeToApi: Record<string, CommentEntityType> = {
  movie: 'movies',
  'tv-series': 'tv-series',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  anime: 'anime',
  'anime-movies': 'anime-movies',
  game: 'games',
  manga: 'manga',
  book: 'books',
  'light-novel': 'light-novels',
}

const entityTypeToReactionApi: Record<string, string> = {
  movie: 'movie',
  'tv-series': 'tv_series',
  'cartoon-series': 'cartoon_series',
  'cartoon-movies': 'cartoon_movie',
  anime: 'anime',
  'anime-movies': 'anime_movie',
  game: 'game',
  manga: 'manga',
  book: 'book',
  'light-novel': 'light_novel',
}

const COMMENT_EMOJI_LIST: CommentEmojiType[] = ['like', 'heart', 'laugh', 'sad', 'angry', 'wow']
const EMOJI_SYMBOLS: Record<CommentEmojiType, string> = {
  like: '👍',
  heart: '❤️',
  laugh: '😂',
  sad: '😢',
  angry: '😠',
  wow: '😮',
}

export type CommentSectionEntityType =
  | 'movie'
  | 'tv-series'
  | 'cartoon-series'
  | 'cartoon-movies'
  | 'anime'
  | 'anime-movies'
  | 'game'
  | 'manga'
  | 'book'
  | 'light-novel'

interface CommentSectionV2Props {
  entityType?: CommentSectionEntityType
  entityId?: number
  /** Режим обсуждения: комментарии треда. Когда задан, entityType/entityId не используются для API. */
  discussionId?: number
}

const PAGE_SIZE = 10
const REPLIES_PAGE_SIZE = 10

function setRepliesInTree(list: Comment[], parentId: number, replies: Comment[], total?: number): Comment[] {
  return list.map((c) =>
    c.id === parentId
      ? { ...c, replies, ...(total != null ? { repliesCount: total } : {}) }
      : c.replies
        ? { ...c, replies: setRepliesInTree(c.replies, parentId, replies, total) }
        : c
  )
}

/** Строит лог-дерево из дерева комментариев для вывода в консоль */
function buildCommentTreeLog(
  list: Comment[],
  depth = 0
): Array<{
  id: number
  depth: number
  text: string
  repliesCount?: number
  children?: ReturnType<typeof buildCommentTreeLog>
}> {
  return list.map((c) => ({
    id: c.id,
    depth,
    text: (c.text || '').slice(0, 50) + (c.text && c.text.length > 50 ? '…' : ''),
    ...(c.repliesCount != null && { repliesCount: c.repliesCount }),
    ...(c.replies && c.replies.length > 0 && { children: buildCommentTreeLog(c.replies, depth + 1) }),
  }))
}

function countCommentsInTree(list: Comment[]): number {
  return list.reduce((acc, c) => acc + 1 + (c.replies?.length ? countCommentsInTree(c.replies) : 0), 0)
}

function collectCommentIds(list: Comment[]): number[] {
  const ids: number[] = []
  function walk(cs: Comment[]) {
    for (const c of cs) {
      ids.push(c.id)
      if (c.replies?.length) walk(c.replies)
    }
  }
  walk(list)
  return ids
}

function updateCommentInTree(list: Comment[], commentId: number, upd: Partial<Comment>): Comment[] {
  return list.map((c) =>
    c.id === commentId
      ? { ...c, ...upd }
      : c.replies
        ? { ...c, replies: updateCommentInTree(c.replies, commentId, upd) }
        : c
  )
}

function addCommentToTree(list: Comment[], comment: Comment): Comment[] {
  const parentId = comment.parentId ?? 0
  if (!parentId) {
    return [{ ...comment, replies: [], depth: 0 }, ...list]
  }
  return list.map((c) =>
    c.id === parentId
      ? {
          ...c,
          replies: [...(c.replies ?? []), { ...comment, depth: (c.depth ?? 0) + 1 }],
          repliesCount: (c.repliesCount ?? (c.replies?.length ?? 0)) + 1,
        }
      : c.replies
        ? { ...c, replies: addCommentToTree(c.replies, comment) }
        : c
  )
}

function removeCommentFromTree(list: Comment[], commentId: number): Comment[] {
  return list
    .filter((c) => c.id !== commentId)
    .map((c) => (c.replies ? { ...c, replies: removeCommentFromTree(c.replies, commentId) } : c))
}

export default function CommentSectionV2({ entityType = 'movie', entityId = 0, discussionId }: CommentSectionV2Props) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const apiType = entityTypeToApi[entityType] ?? 'movies'
  const isDiscussionMode = discussionId != null && discussionId > 0

  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [collapsedBranchIds, setCollapsedBranchIds] = useState<Set<number>>(new Set())
  const [loadingReplies, setLoadingReplies] = useState<Record<number, boolean>>({})
  const [text, setText] = useState('<p></p>')
  const [replyToId, setReplyToId] = useState<number | null>(null)
  const [replyToName, setReplyToName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formFocused, setFormFocused] = useState(false)
  const [reactioning, setReactioning] = useState<Record<number, boolean>>({})
  const [emojiReactions, setEmojiReactions] = useState<
    Record<number, { counts: Record<string, number>; myReaction: string }>
  >({})
  const [emojiReactioning, setEmojiReactioning] = useState<Record<number, boolean>>({})
  const [reportModal, setReportModal] = useState<{ commentId: number } | null>(null)
  const [reportReason, setReportReason] = useState<string>('spam')
  const [reportComment, setReportComment] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [blockModal, setBlockModal] = useState<{ userId: number; userName: string } | null>(null)
  const [blocking, setBlocking] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingSubmitting, setEditingSubmitting] = useState(false)

  const savedScrollRef = useRef<{ x: number; y: number } | null>(null)
  const commentInputRef = useRef<RichTextEditorRef>(null)
  const clearSavedScrollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveScrollBeforeAction = useCallback(() => {
    if (clearSavedScrollRef.current) clearTimeout(clearSavedScrollRef.current)
    savedScrollRef.current = { x: window.scrollX, y: window.scrollY }
    clearSavedScrollRef.current = setTimeout(() => {
      savedScrollRef.current = null
      clearSavedScrollRef.current = null
    }, 400)
  }, [])

  useLayoutEffect(() => {
    const s = savedScrollRef.current
    if (!s) return
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const y = Math.min(s.y, maxY)
    window.scrollTo(s.x, y)
  }, [comments, collapsedBranchIds, loadingReplies])

  const reactionEntityType = entityTypeToReactionApi[entityType] ?? 'movie'

  useEffect(() => {
    if (isDiscussionMode) return
    const ids = collectCommentIds(comments)
    if (ids.length === 0) {
      if (Object.keys(emojiReactions).length > 0) setEmojiReactions({})
      return
    }
    const missingIds = ids.filter((id) => !emojiReactions[id])
    if (missingIds.length === 0) return
    let cancelled = false
    reactionsApi.getCommentEmojiReactions(reactionEntityType, missingIds).then(
      ({ reactions }) => {
        if (cancelled) return
        const next: Record<number, { counts: Record<string, number>; myReaction: string }> = {}
        missingIds.forEach((id) => {
          const data = reactions[String(id)]
          next[id] = data
            ? { counts: data.counts ?? {}, myReaction: data.myReaction ?? '' }
            : { counts: {}, myReaction: '' }
        })
        setEmojiReactions((prev) => ({ ...prev, ...next }))
      },
      () => {}
    )
    return () => {
      cancelled = true
    }
  }, [comments, reactionEntityType, emojiReactions, isDiscussionMode])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = isDiscussionMode
      ? discussionsApi.getComments(discussionId!, 0, PAGE_SIZE)
      : commentsApi.getComments(apiType, entityId, 0, PAGE_SIZE)
    load
      .then(
        (res) => {
          if (!cancelled) {
            setComments(res.comments)
            setTotal(res.total)
            setPage(0)
            if (
              !isDiscussionMode &&
              'emojiReactions' in res &&
              res.emojiReactions &&
              Object.keys(res.emojiReactions).length > 0
            ) {
              const next: Record<number, { counts: Record<string, number>; myReaction: string }> = {}
              Object.entries(res.emojiReactions).forEach(([idStr, data]) => {
                const id = Number(idStr)
                if (!Number.isNaN(id) && data)
                  next[id] = { counts: data.counts ?? {}, myReaction: data.myReaction ?? '' }
              })
              setEmojiReactions((prev) => ({ ...prev, ...next }))
            }
          }
        },
        () => {
          if (!cancelled) setComments([])
        }
      )
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiType, entityId, isDiscussionMode, discussionId])

  const handleWsNewComment = useCallback((comment: Comment) => {
    setComments((prev) => addCommentToTree(prev, comment))
    setTotal((prev) => prev + 1)
  }, [])
  const handleWsDeletedComment = useCallback((commentId: number) => {
    setComments((prev) => removeCommentFromTree(prev, commentId))
    setTotal((prev) => Math.max(0, prev - 1))
  }, [])

  useCommentsWs(
    isDiscussionMode ? '' : apiType,
    isDiscussionMode ? undefined : entityId,
    handleWsNewComment,
    handleWsDeletedComment
  )

  // Вывод дерева комментариев в консоль при изменении
  useEffect(() => {
    if (comments.length === 0) return
    const tree = buildCommentTreeLog(comments)
    console.group('[CommentSectionV2] Дерево комментариев')
    console.log('Корневых:', comments.length, '| Всего в дереве (с вложенными):', countCommentsInTree(comments))
    console.log('Дерево:', tree)
    console.groupEnd()
  }, [comments])

  const loadMore = useCallback(async () => {
    const next = page + 1
    const res = isDiscussionMode
      ? await discussionsApi.getComments(discussionId!, next, PAGE_SIZE)
      : await commentsApi.getComments(apiType, entityId, next, PAGE_SIZE)
    setComments((prev) => [...prev, ...res.comments])
    setPage(next)
    if (res.emojiReactions && Object.keys(res.emojiReactions).length > 0) {
      const nextReactions: Record<number, { counts: Record<string, number>; myReaction: string }> = {}
      Object.entries(res.emojiReactions).forEach(([idStr, data]) => {
        const id = Number(idStr)
        if (!Number.isNaN(id) && data)
          nextReactions[id] = { counts: data.counts ?? {}, myReaction: data.myReaction ?? '' }
      })
      setEmojiReactions((prev) => ({ ...prev, ...nextReactions }))
    }
  }, [apiType, entityId, page, isDiscussionMode, discussionId])

  const loadReplies = useCallback(
    async (parentId: number, append?: boolean, currentReplies?: Comment[]) => {
      saveScrollBeforeAction()
      setLoadingReplies((prev) => ({ ...prev, [parentId]: true }))
      try {
        const offset = append && currentReplies ? currentReplies.length : 0
        const { replies, total: totalReplies } = isDiscussionMode
          ? await discussionsApi.getReplies(discussionId!, parentId, { limit: REPLIES_PAGE_SIZE, offset })
          : await commentsApi.getReplies(apiType, entityId, parentId, { limit: REPLIES_PAGE_SIZE, offset })
        const newReplies = append && currentReplies ? [...currentReplies, ...replies] : replies
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: newReplies, repliesCount: totalReplies }
              : c.replies
                ? { ...c, replies: setRepliesInTree(c.replies, parentId, newReplies, totalReplies) }
                : c
          )
        )
      } finally {
        setLoadingReplies((prev) => ({ ...prev, [parentId]: false }))
      }
    },
    [apiType, entityId, saveScrollBeforeAction, isDiscussionMode, discussionId]
  )

  const toggleBranch = useCallback(
    (commentId: number) => {
      saveScrollBeforeAction()
      setCollapsedBranchIds((prev) => {
        const next = new Set(prev)
        if (next.has(commentId)) next.delete(commentId)
        else next.add(commentId)
        return next
      })
    },
    [saveScrollBeforeAction]
  )

  const handleReaction = useCallback(
    async (commentId: number, value: 1 | -1) => {
      if (!user) return
      setReactioning((prev) => ({ ...prev, [commentId]: true }))
      try {
        const { plusCount, minusCount } = await commentsApi.setReaction(apiType, entityId, commentId, value)
        setComments((prev) => updateCommentInTree(prev, commentId, { plusCount, minusCount }))
        useToastStore.getState().show({ title: value === 1 ? t('media.commentLiked') : t('media.commentDisliked') })
      } catch {
      } finally {
        setReactioning((prev) => ({ ...prev, [commentId]: false }))
      }
    },
    [apiType, entityId, user, t]
  )

  const handleEmojiReaction = useCallback(
    async (commentId: number, emoji: CommentEmojiType) => {
      if (!user) return
      setEmojiReactioning((prev) => ({ ...prev, [commentId]: true }))
      try {
        const current = emojiReactions[commentId]?.myReaction
        if (current === emoji) {
          const res = await reactionsApi.deleteCommentEmojiReaction(reactionEntityType, commentId)
          setEmojiReactions((prev) => ({ ...prev, [commentId]: { counts: res.counts, myReaction: '' } }))
        } else {
          const res = await reactionsApi.setCommentEmojiReaction(reactionEntityType, commentId, emoji)
          setEmojiReactions((prev) => ({ ...prev, [commentId]: { counts: res.counts, myReaction: res.myReaction } }))
        }
      } catch {
      } finally {
        setEmojiReactioning((prev) => ({ ...prev, [commentId]: false }))
      }
    },
    [user, reactionEntityType, emojiReactions]
  )

  const canDelete = useCallback(
    (c: Comment) =>
      Boolean(
        user && (user.id === c.userId || user.role === 'admin' || user.role === 'moderator' || user.role === 'owner')
      ),
    [user]
  )
  const canEdit = useCallback((c: Comment) => Boolean(user && user.id === c.userId), [user])
  const canBlock = useCallback(
    (c: Comment) =>
      Boolean(
        user && user.id !== c.userId && (user.role === 'admin' || user.role === 'moderator' || user.role === 'owner')
      ),
    [user]
  )

  const handleEditStart = useCallback((c: Comment) => {
    setEditingCommentId(c.id)
    setEditingText(c.text ?? '')
  }, [])
  const handleEditCancel = useCallback(() => {
    setEditingCommentId(null)
    setEditingText('')
  }, [])
  const handleEditSave = useCallback(async () => {
    if (editingCommentId == null || editingSubmitting) return
    const clean = sanitizeRichHtml(editingText)
    if (isRichTextEmpty(clean)) return
    if (clean.length > RICH_TEXT_MAX_COMMENT_HTML) {
      useToastStore.getState().show({ title: t('media.richTextTooLong') })
      return
    }
    setEditingSubmitting(true)
    try {
      const updated = isDiscussionMode
        ? await discussionsApi.updateComment(discussionId!, editingCommentId, clean)
        : await commentsApi.updateComment(apiType, editingCommentId, clean)
      setComments((prev) => updateCommentInTree(prev, editingCommentId, { text: updated.text }))
      setEditingCommentId(null)
      setEditingText('')
    } catch {
      useToastStore.getState().show({ title: t('common.error') })
    } finally {
      setEditingSubmitting(false)
    }
  }, [apiType, entityId, editingCommentId, editingText, editingSubmitting, t, isDiscussionMode, discussionId])

  const handleDelete = useCallback(
    async (commentId: number) => {
      try {
        if (isDiscussionMode) await discussionsApi.deleteComment(discussionId!, commentId)
        else await commentsApi.deleteComment(apiType, commentId)
        const remove = (list: Comment[]): Comment[] =>
          list.filter((c) => c.id !== commentId).map((c) => (c.replies ? { ...c, replies: remove(c.replies) } : c))
        setComments((prev) => remove(prev))
        setTotal((prev) => Math.max(0, prev - 1))
      } catch {}
    },
    [apiType, entityId, isDiscussionMode, discussionId]
  )

  const handleReportSubmit = useCallback(async () => {
    if (!reportModal || !user || reportSubmitting || isDiscussionMode) return
    setReportSubmitting(true)
    try {
      await reportsApi.create({
        targetType: 'comment',
        targetId: reportModal.commentId,
        targetEntityType: apiType,
        targetEntityId: entityId,
        reason: reportReason,
        comment: reportComment.trim() || undefined,
      })
      useToastStore.getState().show({ title: t('media.reportSent') })
      setReportModal(null)
      setReportComment('')
    } catch {
      useToastStore.getState().show({ title: t('common.error') })
    } finally {
      setReportSubmitting(false)
    }
  }, [reportModal, user, reportSubmitting, apiType, entityId, reportReason, reportComment, t, isDiscussionMode])

  const handleBlockUser = useCallback(
    async (userId: number, durationHours: number) => {
      if (!blockModal || blocking) return
      setBlocking(true)
      try {
        const until = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        await adminApi.setCommentBan(userId, until)
        useToastStore
          .getState()
          .show({
            title:
              t('admin.blockUser') + ' — ' + (durationHours >= 24 ? durationHours / 24 + ' d' : durationHours + ' h'),
          })
        setBlockModal(null)
      } catch {
        useToastStore.getState().show({ title: t('common.error') })
      } finally {
        setBlocking(false)
      }
    },
    [blockModal, blocking, t]
  )

  useLayoutEffect(() => {
    if (replyToId == null) return
    commentInputRef.current?.focus()
  }, [replyToId])

  function injectReply(list: Comment[], parentId: number, reply: Comment): Comment[] {
    return list.map((c) =>
      c.id === parentId
        ? { ...c, replies: [...(c.replies ?? []), reply] }
        : c.replies
          ? { ...c, replies: injectReply(c.replies, parentId, reply) }
          : c
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submitting) return
    const clean = sanitizeRichHtml(text)
    if (isRichTextEmpty(clean)) return
    if (clean.length > RICH_TEXT_MAX_COMMENT_HTML) {
      useToastStore.getState().show({ title: t('media.richTextTooLong') })
      return
    }
    setSubmitting(true)
    try {
      const created = isDiscussionMode
        ? await discussionsApi.createComment(discussionId!, clean, replyToId ?? undefined)
        : await commentsApi.createComment(apiType, entityId, clean, replyToId ?? undefined)
      if (replyToId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyToId
              ? { ...c, replies: [...(c.replies ?? []), { ...created, plusCount: 0, minusCount: 0 }] }
              : c.replies
                ? { ...c, replies: injectReply(c.replies, replyToId, { ...created, plusCount: 0, minusCount: 0 }) }
                : c
          )
        )
      } else {
        setComments((prev) => [{ ...created, plusCount: 0, minusCount: 0 }, ...prev])
      }
      setTotal((t) => t + 1)
      setText('<p></p>')
      setReplyToId(null)
      setReplyToName(null)
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { commentBanUntil?: string } } }
      if (ax.response?.status === 403 && ax.response?.data?.commentBanUntil) {
        const until = new Date(ax.response.data.commentBanUntil).toLocaleString()
        useToastStore.getState().show({ title: t('admin.blockUntil') + ' ' + until })
      }
    } finally {
      setSubmitting(false)
    }
  }

  function renderCommentNode({
    nodeKey,
    c,
    depth,
    hasNextSibling,
    isLastInBranch,
    collapsedBranchIds,
    loadingReplies,
    onLoadReplies,
    onToggleBranch,
    onSaveScroll,
    onReply,
    replyToId,
    renderReplyForm,
    reactioning,
    emojiReactions,
    emojiReactioning,
    onReaction,
    onEmojiReaction,
    editingCommentId,
    editingText,
    setEditingText,
    onEditStart,
    onEditSave,
    onEditCancel,
    editingSubmitting,
    onDelete,
    canEdit,
    canDelete,
    canBlock,
    onReport,
    onBlock,
  }: {
    nodeKey?: string | number
    c: Comment
    depth: number
    hasNextSibling: boolean
    isLastInBranch: boolean
    collapsedBranchIds: Set<number>
    loadingReplies: Record<number, boolean>
    onLoadReplies: (id: number, append?: boolean, currentReplies?: Comment[]) => void
    onToggleBranch: (id: number) => void
    onSaveScroll: () => void
    onReply?: (commentId: number, authorName: string) => void
    replyToId?: number | null
    renderReplyForm?: () => React.ReactNode
    reactioning?: Record<number, boolean>
    emojiReactions?: Record<number, { counts: Record<string, number>; myReaction: string }>
    emojiReactioning?: Record<number, boolean>
    onReaction?: (commentId: number, value: 1 | -1) => void
    onEmojiReaction?: (commentId: number, emoji: CommentEmojiType) => void
    editingCommentId?: number | null
    editingText?: string
    setEditingText?: (s: string) => void
    onEditStart?: (c: Comment) => void
    onEditSave?: () => void
    onEditCancel?: () => void
    editingSubmitting?: boolean
    onDelete?: (commentId: number) => void
    canEdit?: (c: Comment) => boolean
    canDelete?: (c: Comment) => boolean
    canBlock?: (c: Comment) => boolean
    onReport?: (commentId: number) => void
    onBlock?: (userId: number, userName: string) => void
  }) {
    const loadedReplies = c.replies?.length ?? 0
    const totalReplies = c.repliesCount ?? 0
    const hasReplies = totalReplies > 0
    const isCollapsed = collapsedBranchIds.has(c.id)
    const isLoading = loadingReplies[c.id]
    const authorName = c.user?.name ?? c.user?.email ?? 'User'
    const profileUrl = c.user ? `/user/${c.user.id}` : null
    const dateStr = c.createdAt
      ? new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : ''

    /* Один блок линий на комментарий (связь с родителем). Остальные N−1 линий — колонки родителей (у них grid-row: 1/-1). */
    const hasBranch = depth > 0
    const visible = hasBranch /* линия от родителя к строке — всегда */
    const continueBelow = hasBranch && hasNextSibling
    const short = hasBranch && isLastInBranch
    return (
      <div
        key={nodeKey}
        className={`comment ${depth === 0 ? 'comment--root' : ''}`}
        data-id={c.id}
        style={{ ['--comment-display-level' as string]: hasBranch ? 1 : 0, ['--avatar-size' as string]: '40px' }}
      >
        <div className="comment__branches">
          <div className="comment-branches">
            {hasBranch && (
              <div
                className={`comment-branch ${visible ? 'comment-branch--visible' : ''} ${!continueBelow && short ? 'comment-branch--short' : ''} ${hasNextSibling ? 'comment-branch--continue-below' : ''} comment-branch--interactable`}
                data-branch-id={c.id}
                data-branch-highlightable={true}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSaveScroll()
                  onToggleBranch(c.id)
                }}
              >
                {hasBranch && (
                  <div className={`comment-branch__arc ${continueBelow ? 'comment-branch__arc--at-avatar' : ''}`} />
                )}
              </div>
            )}
          </div>
        </div>
        <div className="comment__content" data-content="true">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex gap-3 items-start">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--theme-bg-alt)] overflow-hidden flex items-center justify-center text-[var(--theme-text-muted)] text-sm">
                {c.user?.avatar ? (
                  <img src={getMediaAssetUrl(c.user.avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  authorName.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                {profileUrl ? (
                  <Link
                    to={profileUrl}
                    className="font-medium text-[var(--theme-text)] hover:underline text-sm leading-tight"
                  >
                    {authorName}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--theme-text)] text-sm leading-tight">{authorName}</span>
                )}
                <span className="text-xs text-[var(--theme-text-muted)]">{dateStr}</span>
              </div>
            </div>
            {editingCommentId === c.id ? (
              <div className="space-y-2">
                <RichTextEditor
                  variant="comment"
                  value={editingText ?? '<p></p>'}
                  onChange={(html) => setEditingText?.(html)}
                  disabled={editingSubmitting}
                  maxHtmlLength={RICH_TEXT_MAX_COMMENT_HTML}
                  placeholder={t('media.writeComment')}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onEditSave}
                    disabled={editingSubmitting || !richEditorIsSubmittable(editingText ?? '')}
                    className="rounded-lg bg-[var(--theme-primary)] text-white font-medium py-1.5 px-3 text-sm disabled:opacity-50"
                  >
                    {editingSubmitting ? t('common.loading') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={onEditCancel}
                    disabled={editingSubmitting}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[var(--theme-text)] break-words" id={`comment-${c.id}`}>
                <RichTextContent html={c.text ?? ''} />
              </div>
            )}
            {(onReaction || onEmojiReaction) && (
              <div className="comment-node__reactions">
                <div className="flex items-center gap-0 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onReaction?.(c.id, 1)}
                    disabled={!user || reactioning?.[c.id]}
                    className="p-1 hover:bg-[var(--theme-border)] disabled:opacity-50"
                    aria-label={t('media.commentPlus')}
                  >
                    <IconLike size={16} className="text-[var(--theme-primary)]" />
                  </button>
                  <span className="px-1.5 text-xs tabular-nums text-[var(--theme-text-muted)] border-l border-[var(--theme-border)]">
                    {c.plusCount ?? 0}
                  </span>
                  <span className="text-xs text-[var(--theme-text-muted)] px-0.5">/</span>
                  <span className="px-1.5 text-xs tabular-nums text-[var(--theme-text-muted)]">
                    {c.minusCount ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => onReaction?.(c.id, -1)}
                    disabled={!user || reactioning?.[c.id]}
                    className="p-1 hover:bg-[var(--theme-border)] disabled:opacity-50 border-l border-[var(--theme-border)]"
                    aria-label={t('media.commentMinus')}
                  >
                    <IconDislike size={16} className="text-[var(--theme-text-muted)]" />
                  </button>
                </div>
                {COMMENT_EMOJI_LIST.map((emoji) => {
                  const counts = emojiReactions?.[c.id]?.counts ?? {}
                  const count = counts[emoji] ?? 0
                  const isMy = emojiReactions?.[c.id]?.myReaction === emoji
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onEmojiReaction?.(c.id, emoji)}
                      disabled={!user || emojiReactioning?.[c.id]}
                      title={emoji}
                      className={`comment-node__reaction-btn ${isMy ? 'comment-node__reaction-btn--active' : ''}`}
                    >
                      <span>{EMOJI_SYMBOLS[emoji]}</span>
                      {count > 0 && <span className="tabular-nums">{count}</span>}
                    </button>
                  )
                })}
              </div>
            )}
            {(hasReplies || onReply || onReport || canEdit?.(c) || canDelete?.(c) || canBlock?.(c)) && (
              <div className="flex items-center gap-2 flex-wrap">
                {hasReplies && (loadedReplies === 0 || isCollapsed) && (
                  <button
                    type="button"
                    className="comment__expand-btn comment-footer-link flex items-center gap-1 text-sm comment-footer-link--primary bg-transparent border-0 cursor-pointer p-0"
                    disabled={loadedReplies === 0 && isLoading}
                    onClick={(e) => {
                      e.preventDefault()
                      onSaveScroll()
                      if (loadedReplies === 0) onLoadReplies(c.id)
                      else onToggleBranch(c.id)
                    }}
                  >
                    {loadedReplies === 0 && isLoading
                      ? t('common.loading')
                      : t('media.moreRepliesCount', { count: totalReplies })}
                  </button>
                )}
                {hasReplies && loadedReplies > 0 && !isCollapsed && (
                  <>
                    <button
                      type="button"
                      className="comment-footer-link flex items-center gap-1 text-sm text-[var(--theme-text-muted)]"
                      onClick={() => {
                        onSaveScroll()
                        onToggleBranch(c.id)
                      }}
                    >
                      <ChevronUp className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      {t('media.collapseThread')}
                    </button>
                    {loadedReplies < totalReplies && (
                      <button
                        type="button"
                        className="text-sm text-[var(--theme-primary)] hover:underline"
                        onClick={() => {
                          onSaveScroll()
                          onLoadReplies(c.id, true, c.replies)
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? t('common.loading') : t('media.loadMoreReplies')}
                      </button>
                    )}
                  </>
                )}
                {onReply && (
                  <button
                    type="button"
                    onClick={() => onReply(c.id, authorName)}
                    className={`comment-footer-link flex items-center gap-1 text-sm shrink-0 ${replyToId === c.id ? 'comment-footer-link--primary font-medium' : 'text-[var(--theme-text-muted)]'}`}
                  >
                    <IconReply size={14} className="shrink-0 opacity-80" />
                    {t('media.reply')}
                  </button>
                )}
                {onReport && user && user.id !== c.userId && (
                  <button
                    type="button"
                    onClick={() => onReport(c.id)}
                    className="p-1 rounded hover:bg-[var(--theme-surface)] text-[var(--theme-primary)] shrink-0"
                    title={t('media.report')}
                    aria-label={t('media.report')}
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}
                {(canEdit?.(c) || canDelete?.(c) || canBlock?.(c)) && (
                  <span className="inline-flex items-center gap-0.5 shrink-0">
                    {canEdit?.(c) && (
                      <button
                        type="button"
                        onClick={() => onEditStart?.({ ...c })}
                        className="btn-edit p-1 rounded"
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete?.(c) && (
                      <button
                        type="button"
                        onClick={() => onDelete?.(c.id)}
                        className="p-1 rounded hover:bg-[var(--theme-surface)] text-[var(--theme-text-muted)]"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canBlock?.(c) && (
                      <button
                        type="button"
                        onClick={() => onBlock?.(c.userId, authorName)}
                        className="p-1 rounded hover:bg-[var(--theme-surface)] text-[var(--theme-primary)]"
                        title={t('admin.blockUser')}
                        aria-label={t('admin.blockUser')}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {((hasReplies && loadedReplies > 0 && !isCollapsed) || replyToId === c.id) && (
          <div className="comment__replies-wrap">
            {replyToId === c.id &&
              renderReplyForm &&
              (() => {
                const hasRepliesBelow = hasReplies && loadedReplies > 0 && !isCollapsed
                return (
                  <div className="comment comment--reply-form" style={{ ['--comment-display-level' as string]: 1 }}>
                    <div className="comment__branches">
                      <div className="comment-branches">
                        <div
                          className={`comment-branch ${hasRepliesBelow ? 'comment-branch--visible comment-branch--continue-below' : 'comment-branch--short'}`}
                        >
                          <div
                            className={`comment-branch__arc ${hasRepliesBelow ? 'comment-branch__arc--at-avatar' : ''}`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="comment__content" data-content="true">
                      {renderReplyForm()}
                    </div>
                  </div>
                )
              })()}
            {hasReplies && loadedReplies > 0 && !isCollapsed && c.replies && (
              <ul className="comment__replies">
                {c.replies.map((reply, idx) =>
                  renderCommentNode({
                    nodeKey: reply.id,
                    c: reply,
                    depth: depth + 1,
                    hasNextSibling: idx < c.replies!.length - 1,
                    isLastInBranch: idx === c.replies!.length - 1,
                    collapsedBranchIds,
                    loadingReplies,
                    onLoadReplies,
                    onToggleBranch,
                    onSaveScroll,
                    onReply,
                    replyToId,
                    renderReplyForm,
                    reactioning,
                    emojiReactions,
                    emojiReactioning,
                    onReaction,
                    onEmojiReaction,
                    editingCommentId,
                    editingText,
                    setEditingText,
                    onEditStart,
                    onEditSave,
                    onEditCancel,
                    editingSubmitting,
                    onDelete,
                    canEdit,
                    canDelete,
                    canBlock,
                    onReport,
                    onBlock,
                  })
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }

  const replyFormEl = user ? (
    <form
      onSubmit={handleSubmit}
      className={`comments-form ${formFocused ? 'comments-form--focused' : ''}`}
      onFocus={() => setFormFocused(true)}
      onBlur={(e) => {
        if (replyToId != null) return
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFormFocused(false)
      }}
    >
      {replyToId && replyToName && (
        <div className="flex items-center gap-2 text-sm text-[var(--theme-text-muted)]">
          <IconReply size={16} className="shrink-0 opacity-80" />
          <span>{t('media.replyingTo', { name: replyToName })}</span>
          <button
            type="button"
            onClick={() => {
              setReplyToId(null)
              setReplyToName(null)
            }}
            className="text-[var(--theme-primary)] hover:underline"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
      <RichTextEditor
        ref={commentInputRef}
        variant="comment"
        value={text}
        onChange={setText}
        disabled={submitting}
        placeholder={replyToId ? t('media.replyPlaceholder') : t('media.writeComment')}
        className="w-full min-w-0"
        maxHtmlLength={RICH_TEXT_MAX_COMMENT_HTML}
        commentFooter={
          <>
            <button
              type="submit"
              disabled={submitting || !richEditorIsSubmittable(text)}
              className="comments-submit-btn rounded-lg bg-[var(--theme-primary)] text-white font-medium py-2 px-4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IconSend size={16} className="shrink-0" />
              {replyToId ? t('media.sendReply') : t('media.sendComment')}
            </button>
            {replyToId && (
              <button
                type="button"
                onClick={() => {
                  setReplyToId(null)
                  setReplyToName(null)
                }}
                title={t('common.cancel')}
                aria-label={t('common.cancel')}
                className="btn-secondary p-2.5"
              >
                <IconCross className="w-5 h-5" />
              </button>
            )}
          </>
        }
      />
    </form>
  ) : null

  return (
    <div className="comments flex-shrink-0" style={{ overflowAnchor: 'none' }}>
      {user && !replyToId && replyFormEl}
      {loading ? (
        <p className="text-[var(--theme-text-muted)] py-4 px-4">{t('common.loading')}</p>
      ) : comments.length === 0 ? (
        <p className="text-[var(--theme-text-muted)] py-4 px-4">{t('media.noComments')}</p>
      ) : (
        <div className="comments-tree">
          {comments.map((c, idx) =>
            renderCommentNode({
              nodeKey: c.id,
              c,
              depth: 0,
              hasNextSibling: idx < comments.length - 1,
              isLastInBranch: false,
              collapsedBranchIds,
              loadingReplies,
              onLoadReplies: loadReplies,
              onToggleBranch: toggleBranch,
              onSaveScroll: saveScrollBeforeAction,
              onReply: user
                ? (id, name) => {
                    setReplyToId((prev) => {
                      if (prev === id) {
                        setReplyToName(null)
                        return null
                      }
                      setReplyToName(name)
                      return id
                    })
                    setCollapsedBranchIds((prev) => {
                      if (prev.has(id)) {
                        const n = new Set(prev)
                        n.delete(id)
                        return n
                      }
                      return prev
                    })
                  }
                : undefined,
              replyToId,
              renderReplyForm: replyToId ? () => replyFormEl : undefined,
              reactioning,
              emojiReactions,
              emojiReactioning,
              onReaction: isDiscussionMode ? undefined : handleReaction,
              onEmojiReaction: isDiscussionMode ? undefined : handleEmojiReaction,
              editingCommentId,
              editingText,
              setEditingText,
              onEditStart: handleEditStart,
              onEditSave: handleEditSave,
              onEditCancel: handleEditCancel,
              editingSubmitting,
              onDelete: handleDelete,
              canEdit,
              canDelete,
              canBlock: isDiscussionMode ? undefined : canBlock,
              onReport: isDiscussionMode ? undefined : (id) => setReportModal({ commentId: id }),
              onBlock: isDiscussionMode ? undefined : (userId, userName) => setBlockModal({ userId, userName }),
            })
          )}
        </div>
      )}
      {!loading && total > comments.length && (
        <div className="mt-4 px-4 pb-4">
          <button type="button" onClick={loadMore} className="btn-secondary">
            {t('common.loadMore')}
          </button>
        </div>
      )}

      {blockModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !blocking && setBlockModal(null)}
        >
          <div
            className="bg-gray-50 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">{t('admin.blockUser')}</h3>
            <p className="text-[var(--theme-text-muted)] text-sm mb-4">
              {blockModal.userName} — {t('admin.blockDuration')}
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 24, 72, 168].map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={blocking}
                  onClick={() => handleBlockUser(blockModal.userId, h)}
                  className="btn-secondary text-sm"
                >
                  {h < 24 ? `${h} h` : `${h / 24} d`}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBlockModal(null)}
              disabled={blocking}
              className="mt-4 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {reportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !reportSubmitting && setReportModal(null)}
        >
          <div
            className="bg-gray-50 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">{t('media.report')}</h3>
            <label className="block text-sm text-[var(--theme-text-muted)] mb-1">{t('media.reportReason')}</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
            >
              <option value="spam">{t('media.reportReasonSpam')}</option>
              <option value="abuse">{t('media.reportReasonAbuse')}</option>
              <option value="spoiler">{t('media.reportReasonSpoiler')}</option>
              <option value="other">{t('media.reportReasonOther')}</option>
            </select>
            <label className="block text-sm text-[var(--theme-text-muted)] mb-1">
              {t('media.reportCommentOptional')}
            </label>
            <textarea
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              placeholder={t('media.reportCommentPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 min-h-[80px]"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setReportModal(null)}
                disabled={reportSubmitting}
                className="btn-secondary text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                disabled={reportSubmitting}
                className="rounded-lg bg-[var(--theme-primary)] text-white font-medium hover:opacity-90 py-2 px-4 disabled:opacity-50 text-sm"
              >
                {reportSubmitting ? t('common.sending') : t('media.sendReport')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
