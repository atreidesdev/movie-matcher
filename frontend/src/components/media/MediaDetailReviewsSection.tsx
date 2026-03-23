import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { IconPerson } from '@/components/icons'
import { RichTextEditor } from '@/components/richText/RichTextEditor'
import { RichTextContent } from '@/components/richText/RichTextContent'
import { RICH_TEXT_MAX_REVIEW_HTML } from '@/utils/richText'
import ReviewStatusDisplay from '@/components/ReviewStatusDisplay'
import ReviewStars from '@/components/ReviewStars'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import type { Review } from '@/types'
import type { ReviewMediaType } from '@/api/reviews'
import type { ReviewReactionType } from '@/api/reactions'

interface MediaDetailReviewsSectionProps {
  user: { id: number; avatar?: string | null } | null
  myReview: Review | null
  otherReviews: Review[]
  reviewsLoading: boolean
  reviewFormOpen: boolean
  reviewFormRating: number
  reviewFormStatus: string | null | undefined
  reviewFormText: string
  reviewSaving: boolean
  reviewDeleting: boolean
  reviewTargetType: ReviewMediaType | null
  reviewReactions: Record<number, { counts: Record<string, number>; myReaction: string | null }>
  reactionLoading: Record<number, boolean>
  onOpenForm: () => void
  onCloseForm: () => void
  onChangeRating: (value: number) => void
  onChangeStatus: (value: string | null | undefined) => void
  onChangeText: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onDelete: () => void
  onReaction: (reviewId: number, value: ReviewReactionType) => void
  t: (key: string, params?: Record<string, unknown>) => string
}

export function MediaDetailReviewsSection({
  user,
  myReview,
  otherReviews,
  reviewsLoading,
  reviewFormOpen,
  reviewFormRating,
  reviewFormStatus: _reviewFormStatus,
  reviewFormText,
  reviewSaving,
  reviewDeleting,
  reviewTargetType,
  reviewReactions,
  reactionLoading,
  onOpenForm,
  onCloseForm,
  onChangeRating,
  onChangeStatus: _onChangeStatus,
  onChangeText,
  onSubmit,
  onDelete,
  onReaction,
  t,
}: MediaDetailReviewsSectionProps) {
  return (
    <div>
      {user && (
        <div className="mb-4">
          {myReview && !reviewFormOpen ? (
            <div className="relative rounded-lg border border-[var(--theme-border)] shadow-sm p-4 own-review-card">
              <div className="absolute top-2 right-2 shrink-0">
                <div className="rating-badge inline-flex items-center gap-1 rounded-lg bg-[var(--theme-accent)] backdrop-blur-sm px-2 py-1 text-[var(--theme-nav-active-text)]">
                  {myReview.reviewStatus && (
                    <ReviewStatusDisplay
                      reviewStatus={myReview.reviewStatus}
                      size={24}
                      title={t(`media.reviewStatus.${myReview.reviewStatus}`)}
                      className="text-sm leading-none opacity-90"
                    />
                  )}
                  <span className="rating-badge-value text-xs font-medium">{myReview.overallRating}</span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 pr-20 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center shrink-0">
                    {user.avatar ? (
                      <img
                        src={getMediaAssetUrl(user.avatar)}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-[var(--theme-border)]"
                      />
                    ) : (
                      <IconPerson className="w-4 h-4 text-[var(--theme-text-muted)]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-[var(--theme-text)] truncate block">
                      {t('activity.you')}
                    </span>
                    <span className="text-xs text-[var(--theme-text-muted)]">{t('media.yourReview')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenForm}
                  aria-label={t('media.editReview')}
                  className="own-review-edit-button inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium shrink-0 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline sm:ml-1.5 text-sm">{t('media.editReview')}</span>
                </button>
              </div>
              <ReviewStars rating={myReview.overallRating} variant="darker" />
              {myReview.review && (
                <div className="text-[var(--theme-text)] text-sm mt-3 pr-16">
                  <RichTextContent html={myReview.review} />
                </div>
              )}
              {reviewTargetType && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--theme-border)]">
                  {Object.entries(reviewReactions[myReview.id]?.counts ?? {}).map(([value, count]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onReaction(myReview.id, value as ReviewReactionType)}
                      disabled={!user || reactionLoading[myReview.id]}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs bg-[var(--theme-bg-alt)] text-[var(--theme-text)] border-[var(--theme-border)] hover:bg-[var(--theme-surface)]"
                    >
                      <span className="tabular-nums">{count}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-right text-xs text-[var(--theme-text-muted)] mt-2">
                {myReview.createdAt ? new Date(myReview.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-4 space-y-4"
            >
              <h3 className="font-medium text-[var(--theme-text)]">
                {myReview ? t('media.editReview') : t('media.writeReview')}
              </h3>
              <div>
                <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
                  {t('media.yourRating')} (1-100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={reviewFormRating}
                  onChange={(e) => onChangeRating(Math.min(100, Math.max(1, Number(e.target.value) || 0)))}
                  className="w-24 rounded-lg border border-[var(--theme-border)] px-3 py-2 bg-[var(--theme-bg)] text-[var(--theme-text)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
                  {t('media.reviewReaction')}
                </label>
              </div>
              <div>
                <label className="block cursor-text">
                  <span className="block text-sm font-medium text-[var(--theme-text)] mb-1">
                    {t('media.reviewText')}
                  </span>
                  <RichTextEditor
                    value={reviewFormText || '<p></p>'}
                    onChange={onChangeText}
                    disabled={reviewSaving}
                    placeholder={t('media.reviewPlaceholder')}
                    minHeight="140px"
                    maxHeight="min(50vh, 360px)"
                    maxHtmlLength={RICH_TEXT_MAX_REVIEW_HTML}
                  />
                </label>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button type="submit" disabled={reviewSaving} className="btn-primary flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  {reviewSaving ? t('common.saving') : myReview ? t('common.save') : t('media.submitReview')}
                </button>
                {myReview && (
                  <>
                    <button type="button" onClick={onCloseForm} className="btn-secondary">
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={reviewDeleting}
                      className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete')}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {reviewsLoading ? (
        <p className="text-[var(--theme-text-muted)] text-sm">{t('common.loading')}</p>
      ) : otherReviews.length === 0 ? (
        !myReview ? (
          <p className="text-[var(--theme-text-muted)] text-sm mb-2">{t('media.noReviews')}</p>
        ) : null
      ) : (
        <ul className="space-y-4">
          {otherReviews.map((rev) => {
            const authorName =
              rev.user?.username ??
              rev.user?.name ??
              (user && rev.userId === user.id ? t('activity.you') : t('media.reviewAuthor'))
            const profilePath = rev.user?.username ? `/user/${encodeURIComponent(rev.user.username)}` : null
            return (
              <li
                key={rev.id}
                className="relative rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-sm p-4"
              >
                <div className="absolute top-2 right-2 shrink-0">
                  <div className="rating-badge inline-flex items-center gap-1 rounded-lg bg-[var(--theme-accent)] backdrop-blur-sm px-2 py-1 text-[var(--theme-nav-active-text)]">
                    {rev.reviewStatus && (
                      <ReviewStatusDisplay
                        reviewStatus={rev.reviewStatus}
                        size={24}
                        title={t(`media.reviewStatus.${rev.reviewStatus}`)}
                        className="text-sm leading-none opacity-90"
                      />
                    )}
                    <span className="rating-badge-value text-xs font-medium">{rev.overallRating}</span>
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
                  <div className="text-[var(--theme-text)] text-sm pr-16">
                    <RichTextContent html={rev.review} />
                  </div>
                )}
                {reviewTargetType && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--theme-border)]">
                    {Object.entries(reviewReactions[rev.id]?.counts ?? {}).map(([value, count]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onReaction(rev.id, value as ReviewReactionType)}
                        disabled={!user || reactionLoading[rev.id]}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs bg-[var(--theme-bg-alt)] text-[var(--theme-text)] border-[var(--theme-border)] hover:bg-[var(--theme-surface)]"
                      >
                        <span className="tabular-nums">{count}</span>
                      </button>
                    ))}
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
  )
}
