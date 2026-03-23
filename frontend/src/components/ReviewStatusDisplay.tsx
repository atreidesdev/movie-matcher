import { getReviewStatusIcon } from '@/components/icons'
import type { ReviewStatus } from '@/types'

interface ReviewStatusDisplayProps {
  reviewStatus: ReviewStatus | string
  size?: number
  className?: string
  /** Подсказка (уже переведённая строка, напр. t('media.reviewStatus.positive')). */
  title?: string
}

/** Показывает иконку рецензии (IconReview*: good, bad, neutral, sad, wow) по reviewStatus. */
export default function ReviewStatusDisplay({
  reviewStatus,
  size = 24,
  className = '',
  title,
}: ReviewStatusDisplayProps) {
  const status = (reviewStatus || 'neutral') as ReviewStatus
  const Icon = getReviewStatusIcon(status)
  return (
    <span className={className} title={title}>
      <Icon size={size} className="inline-block align-middle" />
    </span>
  )
}
