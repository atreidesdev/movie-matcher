import type { FranchiseMediaLink } from '@/api/franchise'
import { useThemeStore } from '@/store/themeStore'
import type { ListStatus } from '@/types'
import { getFranchiseRelationKey } from '@/utils/franchiseRelation'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getLocalizedString } from '@/utils/localizedText'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { forceCollide } from 'd3-force-3d'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const PATH_TYPE_TO_I18N: Record<MediaTypeForPath, string> = {
  movie: 'media.typeMovie',
  'tv-series': 'media.typeTvSeries',
  anime: 'media.typeAnime',
  'anime-movies': 'media.typeAnimeMovies',
  'cartoon-series': 'media.typeCartoonSeries',
  'cartoon-movies': 'media.typeCartoonMovies',
  game: 'media.typeGame',
  manga: 'media.typeManga',
  book: 'media.typeBook',
  'light-novel': 'media.typeLightNovel',
}

function getThemeLinkColor(): string {
  const styles = getComputedStyle(document.documentElement)
  const getVar = (name: string) => styles.getPropertyValue(name).trim()
  return (
    getVar('--theme-accent') ||
    getVar('--theme-primary') ||
    getVar('--theme-border') ||
    getVar('--theme-text-muted') ||
    '#64748b'
  )
}

export function nodeKey(apiType: string, mediaId: number): string {
  return `${apiType}\t${mediaId}`
}

export interface MediaNodeForGraph {
  type: string
  id: number
  pathType: MediaTypeForPath
  title: string
  poster?: string
  rating?: number | null
  listStatus?: ListStatus | null
  year?: number | null
  description?: string | null
  genres?: { id: number; name?: string; nameI18n?: Record<string, string> }[] | null
}

/** Узел в графе: данные медиа + graphId для force-graph (nodeKey) */
interface GraphNode extends MediaNodeForGraph {
  graphId: string
  img?: HTMLImageElement | null
  x?: number
  y?: number
  /** Количество связей (для динамического charge) */
  degree?: number
}

interface GraphLink {
  source: string
  target: string
  relationType: string
}

interface FranchiseGraphProps {
  nodes: Record<string, MediaNodeForGraph>
  allLinks: FranchiseMediaLink[]
  currentMediaKey: string | null
  /** При клике по узлу (key узла) — переход на страницу медиа можно делать снаружи */
  onNodeClick?: (key: string, node: MediaNodeForGraph) => void
  /** Путь к странице медиа для ссылки в тултипе (название) */
  getMediaPath?: (node: MediaNodeForGraph) => string
  /** Кнопка «В список» / «Редактировать запись» в тултипе */
  onAddOrEditInList?: (node: MediaNodeForGraph) => void
}

const DEFAULT_WIDTH = 100
const DEFAULT_HEIGHT = 150
const SELECT_SCALE = 1.2
/** Базовая дистанция связи (для getLinkDistance по типу) — больше значение = длиннее линки */
const LINK_DISTANCE_BASE = 300
/** Итераций силы связей за тик (больше — стабильнее укладка) */
const LINK_ITERATIONS = 2
/** Базовое отталкивание (усиливается по степени узла и для выбранного) */
const CHARGE_STRENGTH_BASE = -180

/** Стиль линии в зависимости от типа связи */
interface LinkStyle {
  dash: number[]
  width: number
  opacity: number
}
function getLinkStyle(relationType: string): LinkStyle {
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

/** Дистанция связи по типу (в границах канваса учёт через силы) */
function getLinkDistance(relationType: string): number {
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
      return LINK_DISTANCE_BASE
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

const GAP = 4

/** Точка пересечения отрезка (from → toCenter) с границей прямоугольника карточки вокруг toCenter */
function lineRectHit(
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
/** Отступ от края, как в Shikimori (rx+5, width-rx-5) */
const EDGE_PAD = 5
const MAX_HALF_W = (DEFAULT_WIDTH * SELECT_SCALE) / 2
const MAX_HALF_H = (DEFAULT_HEIGHT * SELECT_SCALE) / 2
/** Доп. отступ от края при стартовой раскладке, чтобы постер не мог выйти за канвас */
const INIT_SAFE_INSET = 24
/** Внутренний отступ начальной раскладки по дате, чтобы постеры не прижимались к краям */
const LAYOUT_MARGIN = 70
/** Включить зум/пан когда узлов не меньше этого числа */
const ZOOM_PAN_MIN_NODES = 10

export default function FranchiseGraph({
  nodes,
  allLinks,
  currentMediaKey,
  onNodeClick,
  getMediaPath,
  onAddOrEditInList,
}: FranchiseGraphProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const themeId = useThemeStore((s) => s.themeId)
  const fgRef = useRef<unknown>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const linkLineColorRef = useRef<string>(getThemeLinkColor())
  const [canvasSize, setCanvasSize] = useState(600)
  const canvasSizeRef = useRef(canvasSize)
  canvasSizeRef.current = canvasSize
  const nodeListRef = useRef<GraphNode[]>([])
  const prevNodeCountRef = useRef<number | undefined>(undefined)
  const lastLayoutCanvasSizeRef = useRef<number>(0)
  const [selectedKey, setSelectedKey] = useState<string | null>(currentMediaKey)

  // При смене темы обновляем цвет линий и принудительно перерисовываем граф
  useEffect(() => {
    linkLineColorRef.current = getThemeLinkColor()
    const graph = fgRef.current as { d3ReheatSimulation?: () => void } | null
    graph?.d3ReheatSimulation?.()
  }, [themeId])

  // Фиксируем только выбранный узел — остальные (в т.ч. по дате) можно перетаскивать
  const fixSelectedNodeAndReheat = useCallback(() => {
    const list = nodeListRef.current
    const graph = fgRef.current as { d3ReheatSimulation?: () => void } | null
    for (const node of list) {
      const n = node as GraphNode & { fx?: number; fy?: number }
      if (selectedKey !== null && node.graphId === selectedKey && node.x != null && node.y != null) {
        n.fx = node.x
        n.fy = node.y
      } else {
        delete n.fx
        delete n.fy
      }
    }
    requestAnimationFrame(() => graph?.d3ReheatSimulation?.())
  }, [selectedKey])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0]?.contentRect ?? {}
      if (width && width > 0) setCanvasSize(Math.max(300, Math.min(width, 1200)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setSelectedKey(currentMediaKey)
  }, [currentMediaKey])
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  const nodeList = useMemo(() => {
    return Object.entries(nodes).map(([key, n]) => ({
      ...n,
      graphId: key,
    })) as GraphNode[]
  }, [nodes])

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>()
    nodeList.forEach((n) => m.set(n.graphId, n))
    return m
  }, [nodeList])

  const links = useMemo(() => {
    return allLinks
      .map((l) => {
        const src = nodeKey(l.fromMediaType, l.fromMediaId)
        const tgt = nodeKey(l.toMediaType, l.toMediaId)
        if (!nodeMap.has(src) || !nodeMap.has(tgt)) return null
        return {
          source: src,
          target: tgt,
          relationType: l.relationType,
        }
      })
      .filter(Boolean) as GraphLink[]
  }, [allLinks, nodeMap])

  const graphData = useMemo(() => {
    const validLinks = links
      .map((l) => {
        const src = nodeMap.get(l.source)
        const tgt = nodeMap.get(l.target)
        if (!src || !tgt) return null
        const style = getLinkStyle(l.relationType)
        return {
          source: src,
          target: tgt,
          relationType: l.relationType,
          lineDash: style.dash,
          lineWidth: style.width,
          lineOpacity: style.opacity,
        }
      })
      .filter(Boolean) as {
      source: GraphNode
      target: GraphNode
      relationType: string
      lineDash: number[]
      lineWidth: number
      lineOpacity: number
    }[]
    nodeListRef.current = nodeList
    const centerX = canvasSize / 2
    const centerY = canvasSize / 2
    const degree = new Map<GraphNode, number>()
    for (const node of nodeList) degree.set(node, 0)
    for (const l of validLinks) {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1)
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1)
    }
    const pad = EDGE_PAD + MAX_HALF_W + INIT_SAFE_INSET
    const minX = pad
    const maxX = Math.max(minX + 1, canvasSize - pad)
    const minY = EDGE_PAD + MAX_HALF_H + INIT_SAFE_INSET
    const maxY = Math.max(minY + 1, canvasSize - (EDGE_PAD + MAX_HALF_H + INIT_SAFE_INSET))
    if (lastLayoutCanvasSizeRef.current !== canvasSize) {
      lastLayoutCanvasSizeRef.current = canvasSize
      nodeList.forEach((n) => {
        const nn = n as { x?: number; y?: number }
        delete nn.x
        delete nn.y
      })
    }
    const years = nodeList.map((n) => n.year).filter((y): y is number => y != null)
    const minYear = years.length ? Math.min(...years) : null
    const maxYear = years.length ? Math.max(...years) : null
    const hasYearScale = minYear != null && maxYear != null && minYear !== maxYear
    const rangeY = maxY - minY
    const layoutMargin = Math.min(LAYOUT_MARGIN, rangeY * 0.18)
    const layoutMinY = minY + layoutMargin
    const layoutMaxY = maxY - layoutMargin
    let hub: GraphNode | null = null
    let maxDegree = -1
    for (const node of nodeList) {
      const d = degree.get(node) ?? 0
      ;(node as GraphNode).degree = d
      if (d > maxDegree) {
        maxDegree = d
        hub = node
      }
    }
    const safeW = maxX - minX
    const safeH = maxY - minY
    for (const node of nodeList) {
      let x = centerX
      let y = centerY
      if (safeW > 0 && safeH > 0) {
        if (hasYearScale && node.year != null && minYear !== undefined && maxYear !== undefined) {
          const t = (node.year - minYear) / (maxYear - minYear)
          y = layoutMinY + t * (layoutMaxY - layoutMinY)
        }
        if (hub != null && node === hub) {
          x = centerX
          y = centerY
        } else {
          const idx = nodeList.indexOf(node)
          x = centerX + ((idx % 3) - 1) * (LINK_DISTANCE_BASE * 0.4)
        }
        x = Math.max(minX, Math.min(maxX, x))
        y = Math.max(minY, Math.min(maxY, y))
      }
      const halfSize = canvasSize / 2
      ;(node as { x?: number; y?: number }).x = x - halfSize
      ;(node as { x?: number; y?: number }).y = y - halfSize
    }
    return { nodes: nodeList, links: validLinks }
  }, [nodeList, links, nodeMap, canvasSize])

  // При смене выбора: фиксируем новый выбранный, снимаем фиксацию с остальных, перебалансировка
  useEffect(() => {
    if (nodeList.length === 0) return
    fixSelectedNodeAndReheat()
    const t = setTimeout(fixSelectedNodeAndReheat, 150)
    return () => clearTimeout(t)
  }, [selectedKey, nodeList.length, fixSelectedNodeAndReheat])

  // Силы графа: дистанция связей, отталкивание, столкновения, границы
  useEffect(() => {
    const graph = fgRef.current as {
      d3Force?: (name: string, fn?: unknown) => unknown
      d3ReheatSimulation?: () => void
      screen2GraphCoords?: (x: number, y: number) => { x: number; y: number }
    } | null
    if (!graph?.d3Force || nodeList.length === 0) return
    const radius = (node: GraphNode) => {
      const scale = selectedKey === node.graphId ? SELECT_SCALE : 1
      const w = DEFAULT_WIDTH * scale
      const h = DEFAULT_HEIGHT * scale
      return Math.sqrt(w * w + h * h) / 2 + GAP
    }
    graph.d3Force('collision', forceCollide().radius(radius))
    const linkForce = graph.d3Force('link') as
      | {
          distance?: (d: number | ((link: { relationType?: string }) => number)) => unknown
          iterations?: (n: number) => unknown
        }
      | undefined
    if (linkForce) {
      linkForce.distance?.((link: { relationType?: string }) => getLinkDistance(link.relationType ?? ''))
      linkForce.iterations?.(LINK_ITERATIONS)
    }
    const chargeForce = graph.d3Force('charge') as
      | {
          strength?: (n: number | ((node: GraphNode & { degree?: number }) => number)) => unknown
        }
      | undefined
    if (chargeForce) {
      chargeForce.strength?.((node: GraphNode & { degree?: number }) => {
        const d = node.degree ?? 0
        const isSelected = selectedKey === node.graphId
        let s = CHARGE_STRENGTH_BASE * (1 + d * 0.2)
        if (isSelected) s *= 1.4
        return Math.max(-380, Math.min(-70, s))
      })
    }
    const halfSize = canvasSize / 2
    const boundsForce = () => {
      const minX = -halfSize + EDGE_PAD + MAX_HALF_W
      const maxX = halfSize - EDGE_PAD - MAX_HALF_W
      const minY = -halfSize + EDGE_PAD + MAX_HALF_H
      const maxY = halfSize - EDGE_PAD - MAX_HALF_H
      nodeList.forEach((n) => {
        if (typeof n.x === 'number') n.x = Math.max(minX, Math.min(maxX, n.x))
        if (typeof n.y === 'number') n.y = Math.max(minY, Math.min(maxY, n.y))
      })
    }
    boundsForce.initialize = () => {}
    graph.d3Force('bounds', boundsForce)
    if (prevNodeCountRef.current !== nodeList.length) {
      prevNodeCountRef.current = nodeList.length
      graph.d3ReheatSimulation?.()
    }
  }, [nodeList.length, selectedKey, canvasSize])

  // Сброс авто-зума: в библиотеке (0,0) — центр канваса, zoom по умолчанию сдвигает вид
  useEffect(() => {
    if (nodeList.length === 0) return
    const graph = fgRef.current as { zoom?: (n: number) => void; centerAt?: (x: number, y: number) => void } | null
    const t = setTimeout(() => {
      graph?.zoom?.(1)
      graph?.centerAt?.(0, 0)
    }, 100)
    return () => clearTimeout(t)
  }, [nodeList.length, canvasSize])

  // Preload poster images; после загрузки постеров граф перерисуется за счёт autoPauseRedraw={false}
  useEffect(() => {
    const cache = imageCache.current
    nodeList.forEach((node) => {
      const url = node.poster ? getMediaAssetUrl(node.poster) : ''
      if (!url) return
      if (cache.has(node.graphId)) return
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        cache.set(node.graphId, img)
      }
      img.onerror = () => {}
      img.src = url
    })
  }, [nodeList])

  // Повторный клик по выбранной карточке — переход на страницу; клик по другой — показать инфо
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (selectedKey === node.graphId) {
        onNodeClick?.(node.graphId, node)
      } else {
        setSelectedKey(node.graphId)
      }
    },
    [selectedKey, onNodeClick],
  )

  // Границы: в react-force-graph-2d (0,0) — центр канваса, поэтому границы в тех же координатах
  const getBounds = useCallback(
    (halfW: number, halfH: number): { minX: number; maxX: number; minY: number; maxY: number } => {
      const size = canvasSizeRef.current || 600
      const halfSize = size / 2
      return {
        minX: -halfSize + halfW + EDGE_PAD,
        maxX: halfSize - halfW - EDGE_PAD,
        minY: -halfSize + halfH + EDGE_PAD,
        maxY: halfSize - halfH - EDGE_PAD,
      }
    },
    [],
  )

  const clampPosition = useCallback(
    (x: number, y: number, halfW: number, halfH: number) => {
      const b = getBounds(halfW, halfH)
      return {
        x: Math.max(b.minX, Math.min(b.maxX, x)),
        y: Math.max(b.minY, Math.min(b.maxY, y)),
      }
    },
    [getBounds],
  )

  const handleNodeDrag = useCallback(
    (node: GraphNode, translate: { x: number; y: number }) => {
      const halfW = (DEFAULT_WIDTH * SELECT_SCALE) / 2
      const halfH = (DEFAULT_HEIGHT * SELECT_SCALE) / 2
      const curX = node.x ?? 0
      const curY = node.y ?? 0
      const { x, y } = clampPosition(curX + translate.x, curY + translate.y, halfW, halfH)
      ;(node as { x?: number; y?: number }).x = x
      ;(node as { x?: number; y?: number }).y = y
      translate.x = 0
      translate.y = 0
    },
    [clampPosition],
  )

  const getNodeRadius = useCallback(
    (n: GraphNode) => {
      const scale = selectedKey === n.graphId ? SELECT_SCALE : 1
      const w = DEFAULT_WIDTH * scale
      const h = DEFAULT_HEIGHT * scale
      return Math.sqrt(w * w + h * h) / 2 + GAP
    },
    [selectedKey],
  )

  // После отпускания постер остаётся на месте; при наложении на другие — слегка сдвигаем
  const handleNodeDragEnd = useCallback(
    (node: GraphNode) => {
      const n = node as GraphNode & { fx?: number; fy?: number }
      let x = node.x ?? 0
      let y = node.y ?? 0
      const halfW = (DEFAULT_WIDTH * SELECT_SCALE) / 2
      const halfH = (DEFAULT_HEIGHT * SELECT_SCALE) / 2
      const r0 = getNodeRadius(node)
      const others = nodeListRef.current.filter((o) => o.graphId !== node.graphId)
      const maxIter = 8
      for (let iter = 0; iter < maxIter; iter++) {
        let moved = false
        for (const other of others) {
          const ox = other.x ?? 0
          const oy = other.y ?? 0
          const r1 = getNodeRadius(other)
          const dx = x - ox
          const dy = y - oy
          const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6
          const minDist = r0 + r1
          if (dist < minDist) {
            const push = (minDist - dist) / dist
            x += dx * push
            y += dy * push
            moved = true
          }
        }
        const clamped = clampPosition(x, y, halfW, halfH)
        x = clamped.x
        y = clamped.y
        ;(n as { x?: number; y?: number }).x = x
        ;(n as { x?: number; y?: number }).y = y
        if (!moved) break
      }
      // Не фиксируем перетащенный узел — фиксирован только выбранный (selectedKey)
      fixSelectedNodeAndReheat()
    },
    [clampPosition, getNodeRadius, fixSelectedNodeAndReheat],
  )

  const nodeVal = useCallback(
    (node: GraphNode) => {
      const base = Math.max(DEFAULT_WIDTH, DEFAULT_HEIGHT) / 2
      return base * (selectedKey === node.graphId ? SELECT_SCALE : 1)
    },
    [selectedKey],
  )

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D) => {
      const isSelected = selectedKey === node.graphId
      const scale = isSelected ? SELECT_SCALE : 1
      const w = DEFAULT_WIDTH * scale
      const h = DEFAULT_HEIGHT * scale
      const halfW = w / 2
      const halfH = h / 2
      // Как в Shikimori: рисуем по ограниченным координатам, чтобы постер не выходил за край
      const { x, y } = clampPosition(node.x ?? 0, node.y ?? 0, halfW, halfH)

      ctx.save()

      if (isSelected) {
        // Лёгкая тень под выбранной карточкой
        ctx.shadowColor = 'rgba(0,0,0,0.35)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
      }

      ctx.fillStyle = 'var(--theme-bg-elevated, #1a1a2e)'
      ctx.fillRect(x - halfW, y - halfH, w, h)

      const img = imageCache.current.get(node.graphId)
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, x - halfW, y - halfH, w, h)
      }

      // Рамка: у выбранной — цвет темы (--theme-accent), у остальных — тонкая
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      if (isSelected) {
        ctx.strokeStyle =
          getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() ||
          getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() ||
          '#8b5cf6'
        ctx.lineWidth = 3
        ctx.strokeRect(x - halfW, y - halfH, w, h)
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 1
        ctx.strokeRect(x - halfW, y - halfH, w, h)
      }

      // Year badge — обводка + белый текст, чтобы читался на любом фоне
      const year = node.year ?? null
      if (year != null) {
        const yearStr = String(year)
        const fontSize = scale >= 1.2 ? 8 : 7
        ctx.font = `${fontSize}px sans-serif`
        const tw = ctx.measureText(yearStr).width
        const tx = x + halfW - 4 - tw
        const ty = y + halfH - 4
        ctx.strokeStyle = 'rgba(0,0,0,0.95)'
        ctx.lineWidth = 2.5
        ctx.lineJoin = 'round'
        ctx.strokeText(yearStr, tx, ty)
        ctx.fillStyle = '#fff'
        ctx.fillText(yearStr, tx, ty)
      }

      ctx.restore()
    },
    [selectedKey, clampPosition],
  )

  // Цвет линий — через встроенный linkColor (accessor для линии)
  const linkColor = useMemo(() => () => linkLineColorRef.current || getThemeLinkColor(), [themeId])

  const linkCanvasObject = useCallback(
    (
      link: {
        source: GraphNode
        target: GraphNode
        relationType?: string
        lineDash?: number[]
        lineWidth?: number
        lineOpacity?: number
      },
      ctx: CanvasRenderingContext2D,
    ) => {
      const src = link.source
      const tgt = link.target
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null) return
      const halfW = (DEFAULT_WIDTH * SELECT_SCALE) / 2
      const halfH = (DEFAULT_HEIGHT * SELECT_SCALE) / 2
      const srcCenter = { x: src.x, y: src.y }
      const tgtCenter = { x: tgt.x, y: tgt.y }
      const p1 = lineRectHit(tgtCenter, srcCenter, halfW, halfH)
      const p2 = lineRectHit(srcCenter, tgtCenter, halfW, halfH)
      const relationKey = getFranchiseRelationKey(link.relationType ?? '')
      const fromPrequelToSequel = relationKey === 'prequel'
      const fromPt = fromPrequelToSequel ? p2 : p1
      const toPt = fromPrequelToSequel ? p1 : p2
      const dash = link.lineDash ?? getLinkStyle(link.relationType ?? '').dash
      const width = link.lineWidth ?? getLinkStyle(link.relationType ?? '').width
      let opacity = link.lineOpacity ?? getLinkStyle(link.relationType ?? '').opacity
      const isHighlight = selectedKey != null && (src.graphId === selectedKey || tgt.graphId === selectedKey)
      if (!isHighlight && selectedKey != null) opacity *= 0.28
      const lineColor = linkLineColorRef.current || getThemeLinkColor()
      const strokeColor = lineColor.startsWith('rgb')
        ? lineColor.replace(/^rgb\(/, 'rgba(').replace(/\)$/, `, ${opacity})`)
        : lineColor.startsWith('#')
          ? `${lineColor}${Math.round(opacity * 255)
              .toString(16)
              .padStart(2, '0')}`
          : lineColor
      ctx.setLineDash(dash)
      ctx.lineWidth = width
      ctx.strokeStyle = strokeColor
      ctx.beginPath()
      ctx.moveTo(fromPt.x, fromPt.y)
      ctx.lineTo(toPt.x, toPt.y)
      ctx.stroke()
      ctx.setLineDash([])
    },
    [selectedKey],
  )

  const graphDataRef = useRef<{
    nodes: GraphNode[]
    links: { source: GraphNode; target: GraphNode; relationType?: string }[]
  } | null>(null)
  graphDataRef.current = graphData

  const drawArrowsOnTop = useCallback((ctx: CanvasRenderingContext2D) => {
    const data = graphDataRef.current
    if (!data?.links?.length) return
    const halfW = (DEFAULT_WIDTH * SELECT_SCALE) / 2
    const halfH = (DEFAULT_HEIGHT * SELECT_SCALE) / 2
    const lineColor = linkLineColorRef.current || getThemeLinkColor()
    const arrowLen = 8
    const arrowHalfW = 4
    for (const link of data.links) {
      const src = link.source
      const tgt = link.target
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null) continue
      const srcCenter = { x: src.x, y: src.y }
      const tgtCenter = { x: tgt.x, y: tgt.y }
      const p1 = lineRectHit(tgtCenter, srcCenter, halfW, halfH)
      const p2 = lineRectHit(srcCenter, tgtCenter, halfW, halfH)
      const relationKey = getFranchiseRelationKey(link.relationType ?? '')
      const withArrow =
        relationKey === 'sequel' ||
        relationKey === 'prequel' ||
        relationKey === 'sideStory' ||
        relationKey === 'alternativeVersion'
      if (!withArrow) continue
      const fromPrequelToSequel = relationKey === 'prequel'
      const fromPt = fromPrequelToSequel ? p2 : p1
      const toPt = fromPrequelToSequel ? p1 : p2
      const dx = toPt.x - fromPt.x
      const dy = toPt.y - fromPt.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const ux = dx / len
      const uy = dy / len
      const arrowTip = { x: toPt.x, y: toPt.y }
      const arrowBase = { x: toPt.x - ux * arrowLen, y: toPt.y - uy * arrowLen }
      ctx.beginPath()
      ctx.moveTo(arrowTip.x, arrowTip.y)
      ctx.lineTo(arrowBase.x - uy * arrowHalfW, arrowBase.y + ux * arrowHalfW)
      ctx.lineTo(arrowBase.x + uy * arrowHalfW, arrowBase.y - ux * arrowHalfW)
      ctx.closePath()
      ctx.fillStyle = lineColor
      ctx.fill()
    }
  }, [])

  const selectedNode = selectedKey ? nodeMap.get(selectedKey) : null

  if (nodeList.length === 0) return null

  const size = canvasSize

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 min-w-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] overflow-hidden flex justify-center items-start"
      >
        <div
          className="franchise-graph-canvas overflow-hidden bg-[var(--theme-bg-elevated)]"
          style={{ width: size, height: size }}
        >
          <ForceGraph2D
            key={themeId}
            ref={fgRef as never}
            graphData={graphData}
            width={size}
            height={size}
            nodeId="graphId"
            nodeVal={nodeVal}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            linkColor={linkColor}
            linkWidth={(l: { lineWidth?: number }) => (l as { lineWidth?: number }).lineWidth ?? 1.5}
            linkLineDash={(l: { lineDash?: number[] }) =>
              (l as { lineDash?: number[] }).lineDash?.length ? (l as { lineDash: number[] }).lineDash : undefined
            }
            linkCanvasObject={linkCanvasObject}
            linkCanvasObjectMode="replace"
            linkCurvature={0}
            onNodeClick={handleNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            nodeLabel={(node) => (node as GraphNode).title}
            linkLabel={(link) =>
              t(
                `media.franchiseRelation.${getFranchiseRelationKey((link as { relationType?: string }).relationType ?? '')}`,
              )
            }
            warmupTicks={40}
            d3AlphaDecay={0.018}
            d3VelocityDecay={0.35}
            cooldownTicks={180}
            autoPauseRedraw={false}
            enablePanInteraction={nodeList.length >= ZOOM_PAN_MIN_NODES}
            enableZoomInteraction={nodeList.length >= ZOOM_PAN_MIN_NODES}
            onRenderFramePost={drawArrowsOnTop}
          />
        </div>
      </div>
      <aside className="w-[280px] shrink-0 flex flex-col gap-3 min-w-0">
        {selectedNode && (
          <div
            className="franchise-graph-info rounded-xl border border-[var(--theme-border)] p-4 text-[var(--theme-text)] shadow-sm"
            style={{ backgroundColor: 'var(--theme-bg)' }}
          >
            <h3 className="font-semibold text-base mb-2">
              {getMediaPath ? (
                <Link
                  to={getMediaPath(selectedNode)}
                  className="link-underline-animate block truncate text-[var(--theme-text)] hover:text-[var(--theme-accent)] transition-colors"
                  title={selectedNode.title}
                >
                  {selectedNode.title}
                </Link>
              ) : (
                <span className="block truncate" title={selectedNode.title}>
                  {selectedNode.title}
                </span>
              )}
            </h3>
            <p className="text-xs text-[var(--theme-text-muted)] mb-2">
              {t(PATH_TYPE_TO_I18N[selectedNode.pathType] ?? 'media.typeMovie')}
            </p>
            {selectedNode.description && (
              <p className="text-sm text-[var(--theme-text-muted)] line-clamp-3 mb-2">{selectedNode.description}</p>
            )}
            {selectedNode.genres && selectedNode.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedNode.genres.slice(0, 5).map((g) => (
                  <span
                    key={g.id}
                    className="text-xs px-1.5 py-0.5 rounded bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)]"
                  >
                    {getLocalizedString(g.nameI18n, g.name, locale)}
                  </span>
                ))}
              </div>
            )}
            <dl className="space-y-1 text-sm text-[var(--theme-text-muted)]">
              {selectedNode.year != null && (
                <div>
                  <dt className="inline font-medium">{t('media.franchiseGraphYear')}: </dt>
                  <dd className="inline">{selectedNode.year}</dd>
                </div>
              )}
              {selectedNode.rating != null && (
                <div>
                  <dt className="inline font-medium">{t('media.franchiseGraphRating')}: </dt>
                  <dd className="inline">{selectedNode.rating}</dd>
                </div>
              )}
              {selectedNode.listStatus && (
                <div>
                  <dt className="inline font-medium">{t('media.franchiseGraphInList')}: </dt>
                  <dd className="inline">{getListStatusLabel(t, selectedNode.pathType, selectedNode.listStatus)}</dd>
                </div>
              )}
            </dl>
            {onAddOrEditInList && (
              <button
                type="button"
                onClick={() => onAddOrEditInList(selectedNode)}
                className="mt-3 w-full px-3 py-2 rounded-lg bg-[var(--theme-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {selectedNode.listStatus ? t('media.editListEntry') : t('media.addToList')}
              </button>
            )}
          </div>
        )}
        <div className="text-sm font-medium text-[var(--theme-text-muted)]">{t('media.franchiseGraph')}</div>
        <ul className="flex flex-col overflow-y-auto max-h-[50vh] min-h-0 divide-y divide-[var(--theme-border)] rounded-lg border border-[var(--theme-border)]">
          {nodeList.map((node) => (
            <li key={node.graphId} className="first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setSelectedKey(node.graphId)}
                className={`w-full text-left px-3 py-2.5 truncate transition-colors border-l-4 rounded-none first:rounded-t-lg last:rounded-b-lg ${
                  selectedKey === node.graphId
                    ? 'bg-[var(--theme-accent)]/25 text-[var(--theme-text)] border-l-[var(--theme-accent)] border border-[var(--theme-accent)]/60 font-medium shadow-sm'
                    : 'border-l-transparent border border-transparent text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)] hover:text-[var(--theme-text)] hover:border-[var(--theme-border)]'
                }`}
                title={node.title}
              >
                {node.title}
                {node.year != null && <span className="text-xs opacity-80 ml-1">({node.year})</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
