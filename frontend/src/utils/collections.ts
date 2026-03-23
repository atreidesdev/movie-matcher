import { MediaTypeForPath } from '@/utils/mediaPaths'

const COLLECTION_SUPPORTED_TYPES: MediaTypeForPath[] = [
  'movie',
  'tv-series',
  'anime',
  'cartoon-series',
  'cartoon-movies',
  'anime-movies',
  'game',
  'manga',
  'book',
  'light-novel',
]

export function isCollectionSupportedForType(type: MediaTypeForPath): boolean {
  return COLLECTION_SUPPORTED_TYPES.includes(type)
}
