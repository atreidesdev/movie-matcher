import type { TFunction } from 'i18next'

/** Типы списков, для которых есть отдельные подписи статусов (игры, книги, манга, ранобэ) */
const LIST_TYPES_WITH_OVERRIDES = new Set(['games', 'books', 'manga', 'light-novels'])

/**
 * Возвращает ключ для listStatusByType по типу списка или entityType из API.
 */
function toListTypeKey(listType: string): string {
  if (listType === 'game') return 'games'
  if (listType === 'book') return 'books'
  if (listType === 'lightNovel' || listType === 'light-novel') return 'light-novels'
  return listType
}

/**
 * Подпись статуса списка с учётом типа медиа (для игр — «Прохожу», для книг — «Читаю» и т.д.).
 * @param t — функция перевода
 * @param listType — ключ вкладки (movies, games, books, manga, light-novels) или entityType (movie, game, book, manga, lightNovel)
 * @param status — статус (planned, watching, completed, onHold, dropped, rewatching)
 */
const FALLBACK_STATUS = 'planned'

export function getListStatusLabel(t: TFunction, listType: string, status: string | undefined): string {
  const s = status && status !== 'undefined' ? status : FALLBACK_STATUS
  const key = toListTypeKey(listType)
  if (LIST_TYPES_WITH_OVERRIDES.has(key)) {
    const translated = t(`media.listStatusByType.${key}.${s}`)
    if (translated && !translated.startsWith('media.')) return translated
  }
  return t(`media.listStatus.${s}`)
}
