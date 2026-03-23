import type { FranchiseMediaLink } from '@/api/franchise'
import { getFranchiseRelationKey } from '@/utils/franchiseRelation'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getLocalizedString } from '@/utils/localizedText'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force-3d'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type MediaNodeForGraph, nodeKey } from './FranchiseGraph'
import { getLinkDistance, getLinkStyle, lineRectHit, withArrow } from './franchiseGraphUtils'

const NODE_W = 100
const NODE_H = 150
const SELECT_SCALE = 1.2
const HALF_W = (NODE_W * SELECT_SCALE) / 2
const HALF_H = (NODE_H * SELECT_SCALE) / 2
/** Отступ от краёв SVG, чтобы узлы не выходили за видимую область */
const EDGE_PAD = 24

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

interface SvgNode extends MediaNodeForGraph {
  graphId: string
  x: number
  y: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
  index?: number
}

interface SvgLink {
  source: SvgNode
  target: SvgNode
  relationType: string
}

interface FranchiseGraphSvgProps {
  nodes: Record<string, MediaNodeForGraph>
  allLinks: FranchiseMediaLink[]
  currentMediaKey: string | null
  onNodeClick?: (key: string, node: MediaNodeForGraph) => void
  getMediaPath?: (node: MediaNodeForGraph) => string
  onAddOrEditInList?: (node: MediaNodeForGraph) => void
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

export default function FranchiseGraphSvg({
  nodes,
  allLinks,
  currentMediaKey,
  onNodeClick,
  getMediaPath,
  onAddOrEditInList,
}: FranchiseGraphSvgProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(600)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      setSize(Math.min(w, h, 700) || 600)
    })
    ro.observe(el)
    const w = el.clientWidth
    const h = el.clientHeight
    setSize(Math.min(w, h, 700) || 600)
    return () => ro.disconnect()
  }, [])
  const [, setTick] = useState(0)
  const [selectedKey, setSelectedKey] = useState<string | null>(currentMediaKey)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const simulationRef = useRef<ReturnType<typeof forceSimulation> | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragNodeRef = useRef<SvgNode | null>(null)
  const dragStartRef = useRef<{ nodeX: number; nodeY: number; pointerSvgX: number; pointerSvgY: number } | null>(null)
  const dragMovedRef = useRef(false)

  useEffect(() => {
    setSelectedKey(currentMediaKey)
  }, [currentMediaKey])

  const bounds = useMemo(() => {
    const minX = EDGE_PAD + HALF_W
    const maxX = Math.max(minX + 1, size - EDGE_PAD - HALF_W)
    const minY = EDGE_PAD + HALF_H
    const maxY = Math.max(minY + 1, size - EDGE_PAD - HALF_H)
    return { minX, maxX, minY, maxY }
  }, [size])

  const nodeList = useMemo(() => {
    const { minX, maxX, minY, maxY } = bounds
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const radius = Math.min((maxX - minX) * 0.4, (maxY - minY) * 0.4, 100)
    const entries = Object.entries(nodes)
    return entries.map(([key, n], i) => {
      const angle = (i / entries.length) * 2 * Math.PI - Math.PI / 2
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      return {
        ...n,
        graphId: key,
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
        vx: 0,
        vy: 0,
      }
    }) as SvgNode[]
  }, [nodes, bounds])

  const nodeMap = useMemo(() => {
    const m = new Map<string, SvgNode>()
    nodeList.forEach((n) => m.set(n.graphId, n))
    return m
  }, [nodeList])

  const links = useMemo(() => {
    return allLinks
      .map((l) => {
        const src = nodeKey(l.fromMediaType, l.fromMediaId)
        const tgt = nodeKey(l.toMediaType, l.toMediaId)
        const srcNode = nodeMap.get(src)
        const tgtNode = nodeMap.get(tgt)
        if (!srcNode || !tgtNode) return null
        return { source: srcNode, target: tgtNode, relationType: l.relationType }
      })
      .filter(Boolean) as SvgLink[]
  }, [allLinks, nodeMap])

  useEffect(() => {
    if (nodeList.length === 0) return
    const { minX, maxX, minY, maxY } = bounds
    const clamp = (node: SvgNode) => {
      if (node.fx == null && node.fy == null) {
        node.x = Math.max(minX, Math.min(maxX, node.x))
        node.y = Math.max(minY, Math.min(maxY, node.y))
      }
    }
    const sim = forceSimulation(nodeList as unknown as { x: number; y: number; vx?: number; vy?: number }[], 2)
      .force(
        'link',
        forceLink(links as unknown as { source: SvgNode; target: SvgNode }[])
          .id((d: SvgNode) => d.graphId)
          .distance((l: SvgLink) => getLinkDistance(l.relationType)),
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter((minX + maxX) / 2, (minY + maxY) / 2))
      .force(
        'collide',
        forceCollide().radius(() => Math.sqrt(NODE_W * NODE_W + NODE_H * NODE_H) / 2 + 10),
      )
      .on('tick', () => {
        nodeList.forEach(clamp)
        setTick((n) => n + 1)
      })

    simulationRef.current = sim
    return () => {
      sim.stop()
      simulationRef.current = null
    }
  }, [nodeList, links, bounds])

  const selectedNode = selectedKey ? nodeMap.get(selectedKey) : null

  const handleNodeClick = useCallback(
    (node: SvgNode) => {
      if (dragMovedRef.current) return
      if (selectedKey === node.graphId) {
        onNodeClick?.(node.graphId, node)
      } else {
        setSelectedKey(node.graphId)
      }
    },
    [selectedKey, onNodeClick],
  )

  const getSvgCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const ctm = svg.getScreenCTM()
    if (ctm) {
      const pt = svg.createSVGPoint()
      pt.x = clientX
      pt.y = clientY
      const p = pt.matrixTransform(ctm.inverse())
      return { x: p.x, y: p.y }
    }
    const rect = svg.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const node = (e.currentTarget as HTMLElement).getAttribute('data-node-id')
      const n = node ? nodeMap.get(node) : null
      if (!n || !svgRef.current) return
      const { x: pointerSvgX, y: pointerSvgY } = getSvgCoords(e.clientX, e.clientY)
      dragNodeRef.current = n
      dragStartRef.current = { nodeX: n.x, nodeY: n.y, pointerSvgX, pointerSvgY }
      dragMovedRef.current = false
      setDraggingKey(n.graphId)
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [nodeMap, getSvgCoords],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const node = dragNodeRef.current
      const start = dragStartRef.current
      if (!node || !start) return
      const { x: pointerSvgX, y: pointerSvgY } = getSvgCoords(e.clientX, e.clientY)
      const dx = pointerSvgX - start.pointerSvgX
      const dy = pointerSvgY - start.pointerSvgY
      let newX = start.nodeX + dx
      let newY = start.nodeY + dy
      newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX))
      newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY))
      dragMovedRef.current = true
      node.x = newX
      node.y = newY
      node.fx = newX
      node.fy = newY
      setTick((n) => n + 1)
    },
    [bounds, getSvgCoords],
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    const node = dragNodeRef.current
    dragNodeRef.current = null
    dragStartRef.current = null
    setDraggingKey(null)
    if (node) {
      node.fx = null
      node.fy = null
      const sim = simulationRef.current
      if (sim && typeof (sim as { alpha?: (a: number) => void; restart?: () => void }).alpha === 'function') {
        ;(sim as { alpha: (a: number) => void }).alpha(0.3)
        if (typeof (sim as { restart?: () => void }).restart === 'function') (sim as { restart: () => void }).restart()
      }
    }
  }, [])

  const lineColor = getThemeLinkColor()

  if (nodeList.length === 0) return null

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 min-w-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] overflow-hidden flex justify-center items-start"
      >
        <svg
          ref={svgRef}
          width={size}
          height={size}
          className="franchise-graph-svg block"
          style={{ background: 'var(--theme-bg-elevated)' }}
        >
          <defs>
            <marker id="arrow-seq" markerWidth={5} markerHeight={5} refX={4.5} refY={2.5} orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill={lineColor} />
            </marker>
            <marker id="arrow-preq" markerWidth={5} markerHeight={5} refX={0.5} refY={2.5} orient="auto">
              <path d="M5,0 L0,2.5 L5,5 Z" fill={lineColor} />
            </marker>
          </defs>
          {/* Links */}
          <g>
            {links.map((link, i) => {
              const src = link.source
              const tgt = link.target
              const onSource = lineRectHit({ x: tgt.x, y: tgt.y }, { x: src.x, y: src.y }, HALF_W, HALF_H)
              const onTarget = lineRectHit({ x: src.x, y: src.y }, { x: tgt.x, y: tgt.y }, HALF_W, HALF_H)
              const style = getLinkStyle(link.relationType)
              const key = getFranchiseRelationKey(link.relationType)
              const fromPrequel = key === 'prequel'
              const x1 = fromPrequel ? onTarget.x : onSource.x
              const y1 = fromPrequel ? onTarget.y : onSource.y
              const x2 = fromPrequel ? onSource.x : onTarget.x
              const y2 = fromPrequel ? onSource.y : onTarget.y
              const showArrow = withArrow(link.relationType)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={lineColor}
                  strokeWidth={style.width}
                  strokeOpacity={style.opacity}
                  strokeDasharray={style.dash.length ? style.dash.join(' ') : undefined}
                  markerEnd={showArrow ? (fromPrequel ? 'url(#arrow-preq)' : 'url(#arrow-seq)') : undefined}
                />
              )
            })}
          </g>
          {/* Nodes */}
          {nodeList.map((node) => {
            const isSelected = selectedKey === node.graphId
            const w = NODE_W * (isSelected ? SELECT_SCALE : 1)
            const h = NODE_H * (isSelected ? SELECT_SCALE : 1)
            return (
              <g
                key={node.graphId}
                data-node-id={node.graphId}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: draggingKey === node.graphId ? 'grabbing' : 'grab' }}
                onClick={() => handleNodeClick(node)}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <g transform={`translate(${-w / 2},${-h / 2})`}>
                  <rect
                    width={w}
                    height={h}
                    fill="var(--theme-bg-elevated)"
                    stroke={isSelected ? 'var(--theme-accent)' : 'rgba(255,255,255,0.25)'}
                    strokeWidth={isSelected ? 3 : 1}
                    rx={4}
                  />
                  <image
                    href={node.poster ? getMediaAssetUrl(node.poster) : ''}
                    width={w}
                    height={h}
                    x={0}
                    y={0}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  {node.year != null && (
                    <>
                      <text
                        x={w - 6}
                        y={h - 6}
                        textAnchor="end"
                        dominantBaseline="auto"
                        fill="white"
                        stroke="rgba(0,0,0,0.9)"
                        strokeWidth={2}
                        fontSize={isSelected ? 10 : 9}
                        fontFamily="sans-serif"
                      >
                        {node.year}
                      </text>
                    </>
                  )}
                </g>
              </g>
            )
          })}
        </svg>
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
