/**
 * Цвета бейджей жанров — цветные и пастельные тона из палитры (без белого, серого, чёрного).
 * По id жанра выбирается стабильный цвет.
 */
const GENRE_BADGE_CLASSES = [
  'bg-lavender_veil-600 text-lavender_veil-200',
  'bg-soft_blush-600 text-soft_blush-200',
  'bg-thistle-600 text-thistle-200',
  'bg-lavender-700 text-lavender-100',
  'bg-lavender_veil-700 text-lavender_veil-200',
  'bg-soft_blush-700 text-soft_blush-200',
  'bg-thistle-700 text-thistle-200',
  'bg-lavender-800 text-lavender-200',
  'bg-primary-500 text-primary-100',
  'bg-lavender_veil-500 text-lavender_veil-100',
  'bg-soft_blush-500 text-soft_blush-200',
  'bg-thistle-500 text-thistle-200',
  // Пастельные тона (в тон палитре)
  'bg-lavender_veil-800 text-lavender_veil-300',
  'bg-soft_blush-800 text-soft_blush-300',
  'bg-thistle-800 text-thistle-300',
  'bg-lavender-900 text-space_indigo-400',
  'bg-space_indigo-900 text-space_indigo-500',
  'bg-primary-600 text-primary-100',
  'bg-lavender_veil-800 text-lavender_veil-200',
  'bg-soft_blush-700 text-soft_blush-200',
  'bg-thistle-800 text-thistle-200',
]

const BADGE_VARIANTS_COUNT = 10

export function getGenreBadgeClass(genreId: number): string {
  return GENRE_BADGE_CLASSES[genreId % GENRE_BADGE_CLASSES.length] ?? GENRE_BADGE_CLASSES[0]
}

/** Вариант для темизованных бейджей (разные цвета в рамках темы). 0..BADGE_VARIANTS_COUNT-1 */
export function getGenreBadgeVariant(genreId: number): number {
  return genreId % BADGE_VARIANTS_COUNT
}

/** Один цвет для всей карточки: по seed (например media.id) выбирается один класс, все бейджи на карточке одинаковые. */
export function getGenreBadgeClassForCard(cardSeed: number): string {
  return GENRE_BADGE_CLASSES[cardSeed % GENRE_BADGE_CLASSES.length] ?? GENRE_BADGE_CLASSES[0]
}
