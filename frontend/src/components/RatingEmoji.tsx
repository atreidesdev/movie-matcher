import { getRatingIconByValue } from '@/components/icons'

interface RatingEmojiProps {
  /** Оценка 1–100 (или 1–10). Если null/undefined — показывается title-rating-none. */
  rating?: number | null
  size?: number
  className?: string
  title?: string
  /** Явный цвет иконки (по умолчанию currentColor). */
  color?: string
}

/**
 * Иконка рейтинга по значению (1–100). При отсутствии рейтинга — title-rating-none.
 * Использует SVG из assets: title-rating-best, title-rating-good, … title-rating-none.
 */
export default function RatingEmoji({ rating, size = 24, className = '', title, color }: RatingEmojiProps) {
  const value = rating != null ? Math.min(100, Math.max(0, Math.round(Number(rating)))) : 0
  const Icon = getRatingIconByValue(value)
  return (
    <span
      title={title ?? (rating != null ? String(value) : '')}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <Icon size={size} color={color} className={className} />
    </span>
  )
}
