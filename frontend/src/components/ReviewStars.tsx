import { Star } from 'lucide-react'

/** Цвета звёзд из темы (--rating-star-empty, --rating-star-fill), чтобы рейтинг был виден во всех темах. */
const starEmptyStyle = { color: 'var(--rating-star-fill)', fill: 'var(--rating-star-empty)' }
const starFillStyle = { color: 'var(--rating-star-fill)', fill: 'var(--rating-star-fill)' }

/** Звёзды рейтинга рецензии: оценка 0–100, 5 звёзд, заливка по проценту. variant="darker" — визуально тот же, оставлен для совместимости. */
export default function ReviewStars({
  rating,
  variant: _variant = 'default',
}: {
  rating: number
  variant?: 'default' | 'darker'
}) {
  const value = (Math.min(100, Math.max(0, rating)) / 100) * 5
  return (
    <span className="flex items-center gap-0.5 shrink-0 review-stars" title={String(rating)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fillPct = Math.min(1, Math.max(0, value - i)) * 100
        return (
          <span key={i} className="relative inline-block w-4 h-4 shrink-0">
            <Star className="w-4 h-4 absolute inset-0 m-auto" style={starEmptyStyle} />
            <span className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }}>
              <Star
                className="w-4 h-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={starFillStyle}
              />
            </span>
          </span>
        )
      })}
    </span>
  )
}
