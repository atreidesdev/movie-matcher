import { titleToSlug } from '@/utils/slug'

export function buildUploadBaseName(
  rawTitle: string | null | undefined,
  entityType: string,
  entityId: number | null | undefined,
  assetKind: string,
  index?: number,
): string | undefined {
  if (!rawTitle || !entityId) return undefined

  const slug = titleToSlug(rawTitle)
  if (!slug) return undefined

  const parts = [slug, entityType, String(entityId), assetKind]
  if (typeof index === 'number' && index > 0) {
    parts.push(String(index))
  }

  return parts.join('-')
}
