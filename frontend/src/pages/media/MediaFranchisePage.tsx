import {
  type FranchiseLinkItem,
  type FranchiseMediaLink,
  franchiseApi,
  getFranchiseLinksByMedia,
} from '@/api/franchise'
import { mediaApi } from '@/api/media'
import RatingEmoji from '@/components/RatingEmoji'
import FranchiseGraph, { nodeKey as franchiseNodeKey } from '@/components/franchise/FranchiseGraph'
import FranchiseGraphSvg from '@/components/franchise/FranchiseGraphSvg'
import { getListStatusBadgeClasses, getListStatusIcon } from '@/components/icons'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import type { ListStatus, Media } from '@/types'
import { getFranchiseRelationKey } from '@/utils/franchiseRelation'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getLocalizedString, getMediaDescription, getMediaTitle } from '@/utils/localizedText'
import { type MediaTypeForPath, getMediaAssetUrl, getMediaPath, getMediaPathFromApiType } from '@/utils/mediaPaths'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, List, Network } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

/** API mediaType (backend) → тип для mediaApi.getMediaByType */
const API_TYPE_TO_PATH_TYPE: Record<string, MediaTypeForPath> = {
  movie: 'movie',
  tvSeries: 'tv-series',
  animeSeries: 'anime',
  game: 'game',
  manga: 'manga',
  book: 'book',
  lightNovel: 'light-novel',
  cartoonSeries: 'cartoon-series',
  cartoonMovie: 'cartoon-movies',
  animeMovie: 'anime-movies',
}

/** path (frontend) → API mediaType (backend) для nodeKey */
const PATH_TYPE_TO_API: Record<MediaTypeForPath, string> = {
  movie: 'movie',
  'tv-series': 'tvSeries',
  anime: 'animeSeries',
  game: 'game',
  manga: 'manga',
  book: 'book',
  'light-novel': 'lightNovel',
  'cartoon-series': 'cartoonSeries',
  'cartoon-movies': 'cartoonMovie',
  'anime-movies': 'animeMovie',
}

interface MediaFranchisePageProps {
  type: MediaTypeForPath
}

interface MediaNode {
  type: string
  id: number
  pathType: MediaTypeForPath
  title: string
  poster?: string
  rating?: number | null
  listStatus?: ListStatus | null
  year?: number | null
}

/** Уникальный ключ узла графа/списка (совпадает с FranchiseGraph.nodeKey) */
const nodeKey = franchiseNodeKey

export default function MediaFranchisePage({ type }: MediaFranchisePageProps) {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [media, setMedia] = useState<Media | null>(null)
  const [linksByCurrent, setLinksByCurrent] = useState<FranchiseLinkItem[]>([])
  const [allLinks, setAllLinks] = useState<FranchiseMediaLink[]>([])
  const [nodes, setNodes] = useState<Record<string, MediaNode>>({})
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'graph-svg'>('list')
  const currentCardRef = useRef<HTMLDivElement>(null)
  const firstCurrentRefSet = useRef(false)
  const navigate = useNavigate()

  const numId = id ? Number.parseInt(id, 10) : 0

  const pathTypeForApi = (apiType: string): MediaTypeForPath => API_TYPE_TO_PATH_TYPE[apiType] ?? 'movie'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [numId, type])

  useEffect(() => {
    if (!numId) {
      setLoading(false)
      return
    }
    setMedia(null)
    setLinksByCurrent([])
    setAllLinks([])
    setNodes({})
    firstCurrentRefSet.current = false
    setLoading(true)
    getFranchiseLinksByMedia(type, numId)
      .then((list) => {
        setLinksByCurrent(list)
        if (list.length === 0) {
          setAllLinks([])
          setNodes({})
          setLoading(false)
          return
        }
        const franchiseId = list[0].franchiseId
        return franchiseApi.getMedia(franchiseId).then((mediaLinks) => {
          setAllLinks(mediaLinks)
          const uniqueKeys = new Set<string>()
          mediaLinks.forEach((l) => {
            uniqueKeys.add(nodeKey(l.fromMediaType, l.fromMediaId))
            uniqueKeys.add(nodeKey(l.toMediaType, l.toMediaId))
          })
          const promises = Array.from(uniqueKeys).map((key) => {
            const [apiType, idStr] = key.split('\t')
            const pathType = pathTypeForApi(apiType)
            const mediaId = Number.parseInt(idStr, 10)
            return mediaApi
              .getMediaByType(pathType, mediaId)
              .then((m) => {
                const title = getMediaTitle(m as Media, locale) || (m as { title?: string }).title || `#${mediaId}`
                const poster = (m as { poster?: string }).poster
                const rating = (m as Media).rating != null ? Number((m as Media).rating) : null
                const listStatus = (m as Media).listStatus as ListStatus | undefined
                const releaseDate = (m as Media).releaseDate
                const year = releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : null
                const description = getMediaDescription(m as Media, locale) || null
                const genres = (m as Media).genres ?? null
                return {
                  key,
                  node: {
                    type: apiType,
                    id: mediaId,
                    pathType,
                    title,
                    poster,
                    rating: rating ?? undefined,
                    listStatus,
                    year: year ?? undefined,
                    description,
                    genres,
                  },
                }
              })
              .catch(() => ({
                key,
                node: { type: apiType, id: mediaId, pathType, title: `#${mediaId}`, poster: undefined },
              }))
          })
          return Promise.all(promises).then((results) => {
            const map: Record<string, MediaNode> = {}
            results.forEach(({ key, node }) => {
              map[key] = node
            })
            setNodes(map)
            firstCurrentRefSet.current = false
          })
        })
      })
      .catch(() => {
        setLinksByCurrent([])
        setAllLinks([])
        setNodes({})
      })
      .finally(() => setLoading(false))
  }, [numId, type, locale])

  useEffect(() => {
    if (!numId) return
    mediaApi
      .getMediaByType(type, numId)
      .then((m) => setMedia(m as Media))
      .catch(() => setMedia(null))
  }, [numId, type])

  /** Уникальные узлы в порядке появления (сначала from, потом to) — порядок строк на странице */
  const uniqueNodeKeysOrdered = useMemo(() => {
    const list = [...allLinks]
    list.sort((a, b) => (a.orderNumber ?? 999) - (b.orderNumber ?? 999))
    const seen = new Set<string>()
    const order: string[] = []
    list.forEach((link) => {
      const fromK = nodeKey(link.fromMediaType, link.fromMediaId)
      const toK = nodeKey(link.toMediaType, link.toMediaId)
      if (!seen.has(fromK)) {
        seen.add(fromK)
        order.push(fromK)
      }
      if (!seen.has(toK)) {
        seen.add(toK)
        order.push(toK)
      }
    })
    return order
  }, [allLinks])

  /** Исходящие связи: от узла (from) к другим (to) с типом отношения */
  const outgoingByNode = useMemo(() => {
    const out: Record<string, { relationType: string; toKey: string }[]> = {}
    allLinks.forEach((link) => {
      const fromK = nodeKey(link.fromMediaType, link.fromMediaId)
      const toK = nodeKey(link.toMediaType, link.toMediaId)
      if (!out[fromK]) out[fromK] = []
      out[fromK].push({ relationType: link.relationType, toKey: toK })
    })
    return out
  }, [allLinks])

  /** Строки для отображения: каждая строка = один тайтл слева, справа — связанные с ним, без повторения уже показанных */
  const rows = useMemo(() => {
    const shownAsRelated = new Set<string>()
    return uniqueNodeKeysOrdered.map((mainKey) => {
      const outgoing = (outgoingByNode[mainKey] ?? []).filter(({ toKey }) => !shownAsRelated.has(toKey))
      outgoing.forEach(({ toKey }) => shownAsRelated.add(toKey))
      return { mainKey, related: outgoing }
    })
  }, [uniqueNodeKeysOrdered, outgoingByNode])

  const isCurrent = (apiType: string, mediaId: number) => {
    const pathType = pathTypeForApi(apiType)
    return type === pathType && mediaId === numId
  }

  useEffect(() => {
    if (loading || uniqueNodeKeysOrdered.length === 0) return
    const timer = setTimeout(() => {
      currentCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
    return () => clearTimeout(timer)
  }, [loading, uniqueNodeKeysOrdered.length, numId, type])

  if (!numId) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
      </div>
    )
  }

  const franchiseName = linksByCurrent[0]
    ? getLocalizedString(linksByCurrent[0].franchiseNameI18n, linksByCurrent[0].franchiseName, locale)
    : undefined
  const currentMediaKey = numId ? nodeKey(PATH_TYPE_TO_API[type], numId) : null

  return (
    <div className="w-full max-w-5xl md:max-w-none mx-auto p-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          to={getMediaPath(type, numId, getMediaTitle(media ?? undefined, locale) || media?.title)}
          className="inline-flex items-center gap-2 link-underline-animate text-sm shrink-0"
        >
          <ArrowLeft className="w-3.5 h-2.5" />
          {t('common.back')}
        </Link>
        <h1 className="text-xl font-semibold text-[var(--theme-text)]">{franchiseName ?? t('media.franchise')}</h1>
        {rows.length > 0 && (
          <div className="flex rounded-lg border border-[var(--theme-border)] p-0.5 bg-[var(--theme-bg-elevated)] ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-[var(--theme-accent)] text-white'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]',
              )}
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-4 h-4" />
              {t('media.franchiseList')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'graph'
                  ? 'bg-[var(--theme-accent)] text-white'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]',
              )}
              aria-pressed={viewMode === 'graph'}
            >
              <Network className="w-4 h-4" />
              {t('media.franchiseGraph')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('graph-svg')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'graph-svg'
                  ? 'bg-[var(--theme-accent)] text-white'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]',
              )}
              aria-pressed={viewMode === 'graph-svg'}
            >
              <Network className="w-4 h-4" />
              {t('media.franchiseGraphSvg')}
            </button>
          </div>
        )}
      </div>

      {(viewMode === 'graph' || viewMode === 'graph-svg') && (
        <div className="mb-8 w-full flex flex-row gap-4">
          {allLinks.length > 0 && Object.keys(nodes).length === 0 ? (
            <p className="text-[var(--theme-text-muted)] py-8 flex-1">{t('common.loading')}</p>
          ) : Object.keys(nodes).length > 0 ? (
            viewMode === 'graph-svg' ? (
              <FranchiseGraphSvg
                nodes={nodes}
                allLinks={allLinks}
                currentMediaKey={currentMediaKey}
                onNodeClick={(_key, node) => {
                  navigate(getMediaPathFromApiType(node.type, node.id))
                }}
                getMediaPath={(node) => getMediaPath(node.pathType, node.id, node.title)}
                onAddOrEditInList={(node) => navigate(getMediaPathFromApiType(node.type, node.id))}
              />
            ) : (
              <FranchiseGraph
                nodes={nodes}
                allLinks={allLinks}
                currentMediaKey={currentMediaKey}
                onNodeClick={(_key, node) => {
                  navigate(getMediaPathFromApiType(node.type, node.id))
                }}
                getMediaPath={(node) => getMediaPath(node.pathType, node.id, node.title)}
                onAddOrEditInList={(node) => navigate(getMediaPathFromApiType(node.type, node.id))}
              />
            )
          ) : null}
        </div>
      )}

      {loading ? (
        <p className="text-[var(--theme-text-muted)]">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-[var(--theme-text-muted)]">{t('media.noSimilar')}</p>
      ) : viewMode === 'list' ? (
        <motion.div className="space-y-8" variants={staggerContainerVariants} initial="hidden" animate="visible">
          {rows.map(({ mainKey, related }) => {
            const mainNode = nodes[mainKey]
            if (!mainNode) return null
            const current = isCurrent(mainNode.type, mainNode.id)

            return (
              <motion.div
                key={mainKey}
                variants={staggerItemVariants}
                ref={
                  current && !firstCurrentRefSet.current
                    ? (el) => {
                        if (el) {
                          ;(currentCardRef as React.MutableRefObject<HTMLDivElement | null>).current = el
                          firstCurrentRefSet.current = true
                        }
                      }
                    : undefined
                }
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6"
              >
                {/* Слева: один тайтл по порядку */}
                <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[140px] max-w-[180px]">
                  <Link
                    to={getMediaPathFromApiType(mainNode.type, mainNode.id)}
                    className={`block rounded-xl overflow-hidden border-2 transition-colors bg-[var(--theme-bg)] ${
                      current
                        ? 'border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)]/30 shadow-lg'
                        : 'border-[var(--theme-border)] hover:border-[var(--theme-text-muted)]'
                    }`}
                  >
                    <div className="relative aspect-[2/3] bg-[var(--theme-bg-alt)]">
                      {mainNode.poster ? (
                        <img
                          src={getMediaAssetUrl(mainNode.poster)}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[var(--theme-text-muted)] text-2xl">
                          —
                        </div>
                      )}
                      {mainNode.listStatus &&
                        (() => {
                          const StatusIcon = getListStatusIcon(mainNode.listStatus, mainNode.pathType)
                          const badgeClasses = getListStatusBadgeClasses(mainNode.listStatus, mainNode.pathType)
                          return (
                            <div
                              className={clsx(
                                'absolute top-1.5 left-1.5 z-10 w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-lg',
                                badgeClasses.bg,
                                badgeClasses.text,
                              )}
                              title={getListStatusLabel(t, mainNode.pathType, mainNode.listStatus)}
                            >
                              <StatusIcon size={16} className="shrink-0" />
                            </div>
                          )
                        })()}
                      {(() => {
                        const r = mainNode.rating != null ? Number(mainNode.rating) : null
                        const ratingDisplay =
                          r != null
                            ? r <= 10
                              ? Math.min(100, Math.max(1, Math.round(r * 10)))
                              : Math.min(100, Math.max(1, Math.round(r)))
                            : null
                        return (
                          <div className="rating-badge rating-badge-franchise absolute top-1.5 right-1.5 z-10 h-8 bg-space_indigo-600 backdrop-blur-sm rounded-lg px-1.5 flex items-center gap-0.5 shadow-lg">
                            <RatingEmoji
                              rating={ratingDisplay ?? undefined}
                              size={16}
                              className="text-lavender-500 shrink-0"
                            />
                            {ratingDisplay != null ? (
                              <span className="rating-badge-value text-xs font-medium text-lavender-500">
                                {ratingDisplay}
                              </span>
                            ) : null}
                          </div>
                        )
                      })()}
                    </div>
                    <p className="p-2 text-sm font-medium text-[var(--theme-text)] truncate">{mainNode.title}</p>
                  </Link>
                </div>

                {/* Стрелка и блок связей — только если у тайтла есть связи */}
                {related.length > 0 && (
                  <>
                    <div className="flex-shrink-0 flex items-center justify-center sm:justify-start text-[var(--theme-text-muted)]">
                      <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-wrap gap-3 sm:gap-4 overflow-x-auto pb-2">
                      {related.map(({ toKey, relationType }) => {
                        const toNode = nodes[toKey]
                        if (!toNode) return null
                        const relationKey = getFranchiseRelationKey(relationType)
                        const relationLabel = t(`media.franchiseRelation.${relationKey}`)
                        return (
                          <Link
                            key={toKey}
                            to={getMediaPathFromApiType(toNode.type, toNode.id)}
                            className="flex-shrink-0 w-[100px] sm:w-[110px] rounded-xl overflow-hidden border border-[var(--theme-border)] hover:border-[var(--theme-accent)] bg-[var(--theme-bg)] transition-colors group"
                          >
                            <div className="aspect-[2/3] bg-[var(--theme-bg-alt)] relative">
                              {toNode.poster ? (
                                <img
                                  src={getMediaAssetUrl(toNode.poster)}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[var(--theme-text-muted)]">
                                  —
                                </div>
                              )}
                              {toNode.listStatus &&
                                (() => {
                                  const StatusIcon = getListStatusIcon(toNode.listStatus, toNode.pathType)
                                  const badgeClasses = getListStatusBadgeClasses(toNode.listStatus, toNode.pathType)
                                  return (
                                    <div
                                      className={clsx(
                                        'absolute top-1 left-1 z-10 w-6 h-6 rounded backdrop-blur-sm flex items-center justify-center shadow',
                                        badgeClasses.bg,
                                        badgeClasses.text,
                                      )}
                                      title={getListStatusLabel(t, toNode.pathType, toNode.listStatus)}
                                    >
                                      <StatusIcon size={12} className="shrink-0" />
                                    </div>
                                  )
                                })()}
                              {(() => {
                                const r = toNode.rating != null ? Number(toNode.rating) : null
                                const ratingDisplay =
                                  r != null
                                    ? r <= 10
                                      ? Math.min(100, Math.max(1, Math.round(r * 10)))
                                      : Math.min(100, Math.max(1, Math.round(r)))
                                    : null
                                return (
                                  <div className="rating-badge rating-badge-franchise absolute top-1 right-1 z-10 h-6 bg-space_indigo-600 backdrop-blur-sm rounded px-1 flex items-center gap-0.5 shadow">
                                    <RatingEmoji
                                      rating={ratingDisplay ?? undefined}
                                      size={12}
                                      className="text-lavender-500 shrink-0"
                                    />
                                    {ratingDisplay != null ? (
                                      <span className="rating-badge-value text-[10px] font-medium text-lavender-500">
                                        {ratingDisplay}
                                      </span>
                                    ) : null}
                                  </div>
                                )
                              })()}
                              <div
                                className="absolute inset-x-0 bottom-0 p-1.5 bg-[var(--theme-text)]/80 text-[var(--theme-bg)] text-[10px] font-medium text-center truncate"
                                title={relationLabel}
                              >
                                {relationLabel}
                              </div>
                            </div>
                            <p className="p-1.5 text-xs font-medium text-[var(--theme-text)] truncate">
                              {toNode.title}
                            </p>
                          </Link>
                        )
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      ) : null}
    </div>
  )
}
