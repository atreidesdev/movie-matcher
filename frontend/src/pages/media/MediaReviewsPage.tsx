import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, ArrowLeft, ThumbsUp, Heart, Laugh, Frown, Angry, ThumbsDown, CheckCircle } from 'lucide-react'
import { IconPerson } from '@/components/icons'
import { reviewsApi, type ReviewMediaType } from '@/api/reviews'
import { mediaApi } from '@/api/media'
import { reactionsApi, type ReviewReactionType } from '@/api/reactions'
import { useAuthStore } from '@/store/authStore'
import { getMediaPath, getMediaAssetUrl } from '@/utils/mediaPaths'
import { getMediaTitle } from '@/utils/localizedText'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import type { Review, ReviewStatus } from '@/types'
import { REVIEW_STATUS_EMOJIS } from '@/types'
import ReviewStars from '@/components/ReviewStars'
import ReviewStatusDisplay from '@/components/ReviewStatusDisplay'
import { RichTextEditor } from '@/components/richText/RichTextEditor'
import { RichTextContent } from '@/components/richText/RichTextContent'
import { isRichTextEmpty, sanitizeRichHtml, RICH_TEXT_MAX_REVIEW_HTML } from '@/utils/richText'
import { useToastStore } from '@/store/toastStore'

const REVIEW_REACTION_CONFIG: {
  value: ReviewReactionType
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}[] = [
  { value: 'like', Icon: ThumbsUp },
  { value: 'useful', Icon: CheckCircle },
  { value: 'love', Icon: Heart },
  { value: 'laugh', Icon: Laugh },
  { value: 'sad', Icon: Frown },
  { value: 'angry', Icon: Angry },
  { value: 'dislike', Icon: ThumbsDown },
]

const TYPE_TO_REVIEW_MEDIA: Record<MediaTypeForPath, ReviewMediaType | null> = {
  movie: 'movies',
  anime: 'anime',
  game: 'games',
  'tv-series': 'tv-series',
  manga: 'manga',
  book: 'books',
  'light-novel': 'light-novels',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

const REVIEW_PAGE_TYPES: MediaTypeForPath[] = [
  'movie',
  'anime',
  'game',
  'manga',
  'book',
  'light-novel',
  'tv-series',
  'cartoon-series',
  'cartoon-movies',
  'anime-movies',
]

interface MediaReviewsPageProps {
  type: MediaTypeForPath
}

export default function MediaReviewsPage({ type }: MediaReviewsPageProps) {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [mediaTitle, setMediaTitle] = useState<string>('')
  const [formRating, setFormRating] = useState(80)
  const [formReviewStatus, setFormReviewStatus] = useState<ReviewStatus | ''>('neutral')
  const [formText, setFormText] = useState('<p></p>')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const entityId = id ? parseInt(id, 10) : 0
  const reviewMediaType = TYPE_TO_REVIEW_MEDIA[type]
  const myReview = reviews.find((r) => user && r.userId === user.id)
  const isMovie = type === 'movie'
  const supportsUpdate = true
  const reviewTargetType = reactionsApi.getReviewTargetType(type)
  const [reviewReactions, setReviewReactions] = useState<
    Record<number, { counts: Record<string, number>; myReaction: string | null }>
  >({})
  const [reactionLoading, setReactionLoading] = useState<Record<number, boolean>>({})

  const loadReviewReactions = useCallback(
    async (reviewList: Review[]) => {
      if (!reviewTargetType || reviewList.length === 0) return
      const items = reviewList.map((r) => `${reviewTargetType}:${r.id}`).join(',')
      try {
        const { reactions } = await reactionsApi.getReviewReactionsBatch(items)
        const next: Record<number, { counts: Record<string, number>; myReaction: string | null }> = {}
        reviewList.forEach((r) => {
          const key = `${reviewTargetType}:${r.id}`
          const data = reactions[key]
          if (data) next[r.id] = { counts: data.counts || {}, myReaction: data.myReaction ?? null }
        })
        setReviewReactions((prev) => ({ ...prev, ...next }))
      } catch {}
    },
    [reviewTargetType]
  )

  useEffect(() => {
    if (!entityId || !reviewMediaType) return
    setLoading(true)
    Promise.all([
      reviewsApi.getMediaReviews(reviewMediaType, entityId),
      mediaApi.getMediaByType(type, entityId).catch(() => null),
    ])
      .then(([reviewsList, media]) => {
        setReviews(reviewsList)
        setMediaTitle(
          media
            ? getMediaTitle(media as { title: string; titleI18n?: Record<string, string> }, locale) ||
                (media as { title?: string }).title ||
                ''
            : ''
        )
        if (reviewsList.length > 0) {
          loadReviewReactions(reviewsList)
        }
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [entityId, reviewMediaType, type, locale, loadReviewReactions])

  useEffect(() => {
    if (myReview) {
      setFormRating(myReview.overallRating)
      setFormReviewStatus((myReview.reviewStatus as ReviewStatus) || 'neutral')
      setFormText(myReview.review || '<p></p>')
      setEditingId(myReview.id)
    } else {
      setFormRating(80)
      setFormReviewStatus('neutral')
      setFormText('<p></p>')
      setEditingId(null)
    }
  }, [myReview?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entityId || !user || !reviewMediaType) return

    const reviewClean = sanitizeRichHtml(formText || '')
    if (!isRichTextEmpty(reviewClean) && reviewClean.length > RICH_TEXT_MAX_REVIEW_HTML) {
      useToastStore.getState().show({ title: t('media.richTextTooLong') })
      return
    }
    const reviewPayload = isRichTextEmpty(reviewClean) ? undefined : reviewClean

    setSaving(true)
    try {
      const payload = {
        overallRating: formRating,
        review: reviewPayload,
        reviewStatus: formReviewStatus || 'neutral',
      }
      if (isMovie && editingId) {
        const updated = await reviewsApi.updateMovieReview(entityId, payload)
        setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      } else if (isMovie) {
        const created = await reviewsApi.createMovieReview(entityId, payload)
        setReviews((prev) => [created, ...prev])
        setEditingId(created.id)
      } else if (reviewMediaType && editingId && supportsUpdate) {
        const updated = await reviewsApi.updateReview(reviewMediaType, entityId, payload)
        setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      } else if (reviewMediaType) {
        const created = await reviewsApi.createReview(reviewMediaType, entityId, payload)
        setReviews((prev) => [created, ...prev])
        setEditingId(created.id)
      }
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!entityId || !myReview || !window.confirm(t('media.deleteReviewConfirm'))) return
    setDeletingId(myReview.id)
    try {
      if (isMovie) {
        await reviewsApi.deleteMovieReview(entityId)
      } else if (reviewMediaType) {
        await reviewsApi.deleteReview(reviewMediaType, entityId)
      }
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id))
      setFormRating(80)
      setFormText('')
      setFormReviewStatus('neutral')
      setEditingId(null)
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  const handleReviewReaction = async (reviewId: number, reaction: ReviewReactionType) => {
    if (!reviewTargetType || !user) return
    setReactionLoading((prev) => ({ ...prev, [reviewId]: true }))
    try {
      const data = reviewReactions[reviewId]
      const current = data?.myReaction
      if (current === reaction) {
        const res = await reactionsApi.deleteReviewReaction(reviewTargetType, reviewId)
        setReviewReactions((prev) => ({ ...prev, [reviewId]: { counts: res.counts, myReaction: null } }))
      } else {
        const res = await reactionsApi.setReviewReaction(reviewTargetType, reviewId, reaction)
        setReviewReactions((prev) => ({ ...prev, [reviewId]: { counts: res.counts, myReaction: res.myReaction } }))
      }
    } catch {
    } finally {
      setReactionLoading((prev) => ({ ...prev, [reviewId]: false }))
    }
  }

  if (!entityId || !REVIEW_PAGE_TYPES.includes(type)) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link
        to={getMediaPath(type, entityId, mediaTitle)}
        className="inline-flex items-center gap-2 link-underline-animate text-sm mb-6"
      >
        <ArrowLeft className="w-3.5 h-2.5" />
        {t('common.back')}
      </Link>

      {loading ? (
        <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
      ) : (
        <>
          {user && (
            <form
              onSubmit={handleSubmit}
              className="mb-8 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] space-y-4"
            >
              <h2 className="font-medium text-[var(--theme-text)]">
                {myReview ? t('media.editReview') : t('media.writeReview')}
              </h2>
              <div>
                <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
                  {t('media.yourRating')} (1–100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formRating}
                  onChange={(e) => setFormRating(Math.min(100, Math.max(1, Number(e.target.value) || 0)))}
                  className="w-20 rounded-lg border border-[var(--theme-border)] px-3 py-2 bg-[var(--theme-bg)] text-[var(--theme-text)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
                  {t('media.reviewReaction')}
                </label>
                <div className="review-reaction-buttons flex flex-wrap gap-1.5">
                  {REVIEW_STATUS_EMOJIS.map(({ value, labelKey }) => {
                    const isSelected = (formReviewStatus || 'neutral') === value
                    return (
                      <button
                        key={value}
                        type="button"
                        title={t(labelKey)}
                        onClick={() => setFormReviewStatus(formReviewStatus === value ? '' : value)}
                        className={`rounded-lg p-2 transition-colors duration-150 ${isSelected ? 'review-reaction-btn--selected ' : ''}${
                          isSelected
                            ? 'bg-lavender-600 ring-2 ring-lavender-400 shadow-sm hover:bg-lavender-400 hover:ring-2 hover:ring-lavender-300 hover:shadow-md'
                            : 'bg-lavender-800 hover:bg-lavender-500'
                        }`}
                      >
                        <ReviewStatusDisplay
                          reviewStatus={value}
                          size={28}
                          title={t(labelKey)}
                          className={isSelected ? 'text-lavender-200' : 'text-lavender-400'}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block cursor-text">
                  <span className="block text-sm font-medium text-[var(--theme-text)] mb-1">
                    {t('media.reviewText')}
                  </span>
                  <RichTextEditor
                    value={formText || '<p></p>'}
                    onChange={setFormText}
                    disabled={saving}
                    placeholder={t('media.reviewPlaceholder')}
                    minHeight="140px"
                    maxHeight="min(50vh, 360px)"
                    maxHtmlLength={RICH_TEXT_MAX_REVIEW_HTML}
                  />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  {saving ? t('common.saving') : myReview ? t('common.save') : t('media.submitReview')}
                </button>
                {myReview && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deletingId !== null}
                    className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </form>
          )}

          <div>
            <h2 className="font-medium text-[var(--theme-text)] mb-3">
              {t('media.allReviews')} ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-[var(--theme-text-muted)]">{t('media.noReviews')}</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((rev) => {
                  const isOwn = user && rev.userId === user.id
                  const authorName =
                    rev.user?.username ?? rev.user?.name ?? (isOwn ? t('activity.you') : t('media.reviewAuthor'))
                  const profilePath = rev.user?.username ? `/user/${encodeURIComponent(rev.user.username)}` : null
                  return (
                    <li
                      key={rev.id}
                      className="relative rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-sm p-4"
                    >
                      <div className="absolute top-2 right-2 shrink-0">
                        <div className="rating-badge inline-flex items-center gap-1 rounded-lg bg-space_indigo-600 backdrop-blur-sm px-2 py-1">
                          {rev.reviewStatus && (
                            <ReviewStatusDisplay
                              reviewStatus={rev.reviewStatus}
                              size={24}
                              title={t(`media.reviewStatus.${rev.reviewStatus}`)}
                              className="text-sm leading-none text-lavender-500"
                            />
                          )}
                          <span className="text-xs font-medium text-lavender-500">{rev.overallRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap pr-20">
                        {profilePath ? (
                          <Link
                            to={profilePath}
                            className="flex items-center gap-2 rounded-full hover:opacity-90 transition-opacity shrink-0"
                          >
                            {rev.user?.avatar ? (
                              <img
                                src={getMediaAssetUrl(rev.user.avatar)}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover border border-[var(--theme-border)]"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center">
                                <IconPerson className="w-4 h-4 text-[var(--theme-text-muted)]" />
                              </span>
                            )}
                            <span className="text-sm font-medium link-underline-animate">{authorName}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            {rev.user?.avatar ? (
                              <img
                                src={getMediaAssetUrl(rev.user.avatar)}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover border border-[var(--theme-border)]"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center">
                                <IconPerson className="w-4 h-4 text-[var(--theme-text-muted)]" />
                              </span>
                            )}
                            <span className="text-sm font-medium text-[var(--theme-text-muted)]">{authorName}</span>
                          </div>
                        )}
                        <ReviewStars rating={rev.overallRating} variant="darker" />
                      </div>
                      {rev.review && (
                        <div className="text-[var(--theme-text)] text-sm pr-16 max-h-[5.5rem] overflow-hidden">
                          <RichTextContent html={rev.review} />
                        </div>
                      )}
                      {reviewTargetType && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[var(--theme-border)]">
                          {REVIEW_REACTION_CONFIG.map(({ value, Icon }) => {
                            const counts = reviewReactions[rev.id]?.counts ?? {}
                            const count = counts[value] ?? 0
                            const isMy = reviewReactions[rev.id]?.myReaction === value
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleReviewReaction(rev.id, value)}
                                disabled={!user || reactionLoading[rev.id]}
                                title={t(`media.reaction.${value}`)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isMy
                                    ? 'bg-thistle-500 text-white'
                                    : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)]'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {count > 0 && <span>{count}</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      <p className="text-right text-xs text-[var(--theme-text-muted)] mt-2">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
