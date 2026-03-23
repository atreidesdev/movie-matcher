import type { PublisherPublicationType } from '@/types'

export const PUBLISHER_PUBLICATION_TYPE_OPTIONS: Array<{ value: PublisherPublicationType; labelKey: string }> = [
  { value: 'game', labelKey: 'nav.games' },
  { value: 'manga', labelKey: 'nav.manga' },
  { value: 'book', labelKey: 'nav.books' },
  { value: 'light-novel', labelKey: 'nav.lightNovels' },
]

export function publisherSupportsType(
  publicationTypes: PublisherPublicationType[] | undefined,
  type: PublisherPublicationType,
): boolean {
  if (!publicationTypes || publicationTypes.length === 0) return true
  return publicationTypes.includes(type)
}
