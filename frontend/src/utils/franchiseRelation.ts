/** Типы связей из БД (backend models.MediaRelationType) */
export const FRANCHISE_RELATION_TYPES = [
  'sequel',
  'prequel',
  'adaptation',
  'spinOff',
  'alternativeVersion',
  'sideStory',
  'crossover',
  'compilation',
  'remake',
  'remaster',
] as const

export function getFranchiseRelationKey(relationType: string): string {
  if (!relationType) return 'other'
  return FRANCHISE_RELATION_TYPES.includes(relationType as (typeof FRANCHISE_RELATION_TYPES)[number])
    ? relationType
    : 'other'
}
