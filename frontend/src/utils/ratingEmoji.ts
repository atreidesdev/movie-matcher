/**
 * Эмодзи в зависимости от средней оценки (1–10).
 * Отрисовка через Twemoji CDN для единообразного вида на всех платформах.
 */

/** Диапазоны оценки → эмодзи (Unicode): [мин, макс, эмодзи] */
const RATING_EMOJI: [number, number, string][] = [
  [0, 2, '😢'], // очень плохо
  [2.01, 4, '😕'], // плохо
  [4.01, 6, '😐'], // средне
  [6.01, 7, '🙂'], // неплохо
  [7.01, 8, '😊'], // хорошо
  [8.01, 9, '😄'], // отлично
  [9.01, 10, '🤩'], // великолепно
]

export function getEmojiForRating(rating: number): string {
  const r = Number(rating)
  if (!Number.isFinite(r) || r < 0) return '😐'
  for (const [min, max, emoji] of RATING_EMOJI) {
    if (r >= min && r <= max) return emoji
  }
  return r >= 9 ? '🤩' : '😐'
}

/** URL изображения Twemoji по Unicode-символу (для единообразного отображения) */
export function getTwemojiUrl(emoji: string): string {
  const point = emoji.codePointAt(0)
  if (point == null) return ''
  const hex = point.toString(16)
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${hex}.png`
}
