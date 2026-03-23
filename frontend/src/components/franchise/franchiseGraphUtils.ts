import { getFranchiseRelationKey } from '@/utils/franchiseRelation'

/** Точка пересечения отрезка (from → toCenter) с границей прямоугольника карточки вокруг toCenter */
export function lineRectHit(
  from: { x: number; y: number },
  toCenter: { x: number; y: number },
  halfW: number,
  halfH: number,
): { x: number; y: number } {
  const dx = toCenter.x - from.x
  const dy = toCenter.y - from.y
  const left = toCenter.x - halfW
  const right = toCenter.x + halfW
  const top = toCenter.y - halfH
  const bottom = toCenter.y + halfH
  let tMin = 1
  let hit = { x: toCenter.x, y: toCenter.y }
  if (Math.abs(dx) > 1e-9) {
    const tL = (left - from.x) / dx
    const tR = (right - from.x) / dx
    for (const t of [tL, tR]) {
      if (t > 0 && t <= 1) {
        const y = from.y + t * dy
        if (y >= top && y <= bottom && t < tMin) {
          tMin = t
          hit = { x: from.x + t * dx, y }
        }
      }
    }
  }
  if (Math.abs(dy) > 1e-9) {
    const tT = (top - from.y) / dy
    const tB = (bottom - from.y) / dy
    for (const t of [tT, tB]) {
      if (t > 0 && t <= 1) {
        const x = from.x + t * dx
        if (x >= left && x <= right && t < tMin) {
          tMin = t
          hit = { x, y: from.y + t * dy }
        }
      }
    }
  }
  return hit
}

export interface LinkStyle {
  dash: number[]
  width: number
  opacity: number
}

export function getLinkStyle(relationType: string): LinkStyle {
  const key = getFranchiseRelationKey(relationType)
  switch (key) {
    case 'sequel':
      return { dash: [], width: 2.5, opacity: 1 }
    case 'prequel':
      return { dash: [12, 8], width: 2, opacity: 0.95 }
    case 'adaptation':
      return { dash: [3, 5], width: 1.8, opacity: 0.9 }
    case 'spinOff':
      return { dash: [2, 6], width: 2, opacity: 0.95 }
    case 'alternativeVersion':
      return { dash: [4, 4], width: 1.5, opacity: 0.85 }
    case 'sideStory':
      return { dash: [8, 6], width: 1.8, opacity: 0.9 }
    case 'crossover':
      return { dash: [6, 4, 2, 4], width: 2, opacity: 1 }
    case 'compilation':
      return { dash: [], width: 1.5, opacity: 0.8 }
    case 'remake':
      return { dash: [10, 6], width: 1.8, opacity: 0.9 }
    case 'remaster':
      return { dash: [3, 3], width: 1.5, opacity: 0.85 }
    default:
      return { dash: [6, 5], width: 1.8, opacity: 0.85 }
  }
}

const LINK_DISTANCE_BASE = 300

export function getLinkDistance(relationType: string): number {
  const key = getFranchiseRelationKey(relationType)
  switch (key) {
    case 'sequel':
    case 'prequel':
      return LINK_DISTANCE_BASE * 0.85
    case 'adaptation':
    case 'remake':
      return LINK_DISTANCE_BASE * 1.15
    case 'spinOff':
    case 'sideStory':
      return LINK_DISTANCE_BASE * 1.0
    case 'alternativeVersion':
    case 'remaster':
    case 'compilation':
      return LINK_DISTANCE_BASE * 1.1
    case 'crossover':
      return LINK_DISTANCE_BASE * 1.2
    default:
      return LINK_DISTANCE_BASE
  }
}

export function withArrow(relationType: string): boolean {
  const key = getFranchiseRelationKey(relationType)
  return key === 'sequel' || key === 'prequel' || key === 'sideStory' || key === 'alternativeVersion'
}
