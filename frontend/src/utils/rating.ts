/**
 * Нормализует рейтинг к шкале 1–100.
 * Если значение ≤ 10, трактуется как шкала 1–10 и умножается на 10.
 * Иначе округляется и ограничивается 1–100.
 */
export function normalizeRatingToPercent(rating: number | null | undefined): number | null {
  if (rating == null || Number.isNaN(Number(rating))) return null
  const val = Number(rating)
  const normalized = val <= 10 ? Math.round(val * 10) : Math.round(val)
  return Math.min(100, Math.max(1, normalized))
}
