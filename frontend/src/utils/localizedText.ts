import type { LocalizedString } from '@/types'

/**
 * Возвращает строку для текущего языка из объекта переводов.
 * @param i18n — объект вида { ru: "...", en: "..." }
 * @param fallback — строка по умолчанию (title/name из API)
 * @param locale — код языка (например из i18n.language: "ru", "en")
 */
export function getLocalizedString(
  i18n: LocalizedString | null | undefined,
  fallback: string | null | undefined,
  locale?: string,
): string {
  if (!i18n || typeof i18n !== 'object') return fallback ?? ''
  const code = (locale || '').toLowerCase().split('-')[0]
  if (code && i18n[code]) return i18n[code]
  if (i18n.en) return i18n.en
  const first = Object.values(i18n)[0]
  return typeof first === 'string' ? first : (fallback ?? '')
}

/** Название медиа с учётом titleI18n */
export function getMediaTitle(
  media: { title: string; titleI18n?: LocalizedString } | null | undefined,
  locale?: string,
): string {
  if (!media) return ''
  return getLocalizedString(media.titleI18n, media.title, locale)
}

/** Описание медиа с учётом descriptionI18n */
export function getMediaDescription(
  media: { description?: string; descriptionI18n?: LocalizedString } | null | undefined,
  locale?: string,
): string {
  if (!media) return ''
  return getLocalizedString(media.descriptionI18n, media.description, locale)
}

/** Имя персонажа с учётом nameI18n */
export function getCharacterName(
  character: { name: string; nameI18n?: LocalizedString } | null | undefined,
  locale?: string,
): string {
  if (!character) return ''
  return getLocalizedString(character.nameI18n, character.name, locale)
}

/** Имя жанра/темы/студии/издателя/разработчика с учётом nameI18n */
export function getEntityName(
  entity: { name: string; nameI18n?: LocalizedString } | null | undefined,
  locale?: string,
): string {
  if (!entity) return ''
  return getLocalizedString(entity.nameI18n, entity.name, locale)
}

/** Описание сущности (жанр/тема и т.д.) с учётом descriptionI18n */
export function getEntityDescription(
  entity: { description?: string; descriptionI18n?: LocalizedString } | null | undefined,
  locale?: string,
): string {
  if (!entity) return ''
  return getLocalizedString(entity.descriptionI18n, entity.description, locale)
}

/** Биография персоны с учётом biographyI18n */
export function getPersonBiography(
  person: { biography?: string; biographyI18n?: LocalizedString } | null | undefined,
  locale?: string,
): string {
  if (!person) return ''
  return getLocalizedString(person.biographyI18n, person.biography, locale)
}

const SEASON_KEYS: Record<string, string> = {
  winter: 'media.seasonWinter',
  spring: 'media.seasonSpring',
  summer: 'media.seasonSummer',
  autumn: 'media.seasonAutumn',
}

/**
 * Год и (для аниме) сезон выхода: "2024" или "2024 Зима" / "2024 Winter".
 * @param media — объект с releaseDate и опционально season (winter/spring/summer/autumn)
 * @param t — функция перевода i18n (например из useTranslation())
 */
export function getMediaYearSeason(
  media: { releaseDate?: string; season?: string } | null | undefined,
  t: (key: string) => string,
): string {
  if (!media) return ''
  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null
  const seasonKey = media.season ? SEASON_KEYS[media.season] : null
  const seasonLabel = seasonKey ? t(seasonKey) : ''
  if (year != null && seasonLabel) return `${year} ${seasonLabel}`
  if (year != null) return String(year)
  return seasonLabel || ''
}
