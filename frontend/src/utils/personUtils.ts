import type { Person } from '@/types'
import { getLocalizedString } from '@/utils/localizedText'

/**
 * Отображаемое имя персоны (firstName + lastName).
 * Если передан locale, использует firstNameI18n/lastNameI18n при наличии.
 */
export function getPersonDisplayName(person: Person | null | undefined, locale?: string): string {
  if (!person) return ''
  const first =
    locale && person.firstNameI18n
      ? getLocalizedString(person.firstNameI18n, person.firstName, locale)
      : (person.firstName ?? '')
  const last =
    locale && person.lastNameI18n
      ? getLocalizedString(person.lastNameI18n, person.lastName, locale)
      : (person.lastName ?? '')
  return [first, last].filter(Boolean).join(' ').trim()
}
