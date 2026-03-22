import type { MouseEvent } from 'react'
import { Calendar, Pencil, Star } from 'lucide-react'
import { IconCollection, IconFavorite, IconPicture, IconPlus } from '@/components/icons'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { getMediaTitle } from '@/utils/localizedText'
import { getMediaEpisodesCount } from '@/utils/typeGuards'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { isCollectionSupportedForType } from '@/components/AddToCollectionModal'
import type { Media, ListItem, ListStatus } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'

export interface MediaDetailHeroInfoRow {
  label: string
  value: string
}

interface MediaDetailHeroProps {
  media: Media
  type: MediaTypeForPath
  locale: string
  heroImage: string | null
  secondaryTitle: string | null
  detailInfoRows: MediaDetailHeroInfoRow[]
  hasReleaseSchedule: boolean
  user: { role: string } | null
  isFavorite: boolean
  listItemInList: ListItem | null
  listType: string
  ratingHoverPreview: number | null
  ratingTooltipVisible: boolean
  ratingTrackRef: React.RefObject<HTMLSpanElement>
  ratingTooltipTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  onOpenSchedule: () => void
  onOpenAddToList: () => void
  onOpenEditList: () => void
  onUpdateListRating: (rating: number) => void
  onRemoveFromList: () => void
  onToggleFavorite: () => void
  renderSimilarUsersAside: (className?: string) => React.ReactNode
  setRatingHoverPreview: (value: number | null) => void
  setRatingTooltipVisible: (value: boolean) => void
  setMediaEditOpen: (open: boolean) => void
  t: (key: string, params?: Record<string, unknown>) => string
}

export function MediaDetailHero({
  media,
  type,
  locale,
  heroImage,
  secondaryTitle,
  detailInfoRows,
  hasReleaseSchedule,
  user,
  isFavorite,
  listItemInList,
  listType,
  ratingHoverPreview,
  ratingTooltipVisible,
  ratingTrackRef,
  ratingTooltipTimeoutRef,
  onOpenSchedule,
  onOpenAddToList,
  onOpenEditList,
  onUpdateListRating,
  onRemoveFromList,
  onToggleFavorite,
  renderSimilarUsersAside,
  setRatingHoverPreview,
  setRatingTooltipVisible,
  setMediaEditOpen,
  t,
  children,
}: MediaDetailHeroProps & { children?: React.ReactNode }) {
  return (
    <div className="media-detail-hero">
      {heroImage && (
        <div className="media-detail-hero__backdrop" aria-hidden>
          <img src={heroImage} alt="" className="media-detail-hero__backdrop-image" />
        </div>
      )}
      <div className="media-detail-hero__overlay" aria-hidden />
      <div className="media-detail-hero__body">
        <div className="media-detail-hero-layout flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="media-detail-hero-sidebar w-64 flex-shrink-0 mx-auto lg:mx-0">
            <div
              className="media-detail-mobile-unified"
              style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
            >
              {media.poster ? (
                <img
                  src={getMediaAssetUrl(media.poster)}
                  alt={getMediaTitle(media, locale)}
                  className="media-detail-hero-poster w-full rounded-xl shadow-lg"
                />
              ) : (
                <div className="media-detail-hero-poster w-full aspect-[2/3] rounded-xl flex flex-col items-center justify-center gap-3 border border-[var(--theme-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--theme-bg-alt)_88%,white),var(--theme-surface))] text-[var(--theme-text-muted)]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--theme-bg)_65%,transparent)]">
                    <IconPicture className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-medium">Постер отсутствует</span>
                </div>
              )}
              <div className="media-detail-mobile-heading">
                <h1 className="text-2xl sm:text-3xl font-bold break-words text-theme">
                  {getMediaTitle(media, locale)}
                </h1>
                {secondaryTitle && (
                  <p
                    className={`media-detail-mobile-subtitle text-base text-theme-muted font-normal break-words ${type === 'anime' ? 'italic' : ''}`}
                  >
                    {secondaryTitle}
                  </p>
                )}
              </div>

              {detailInfoRows.length > 0 && (
                <div className="media-detail-info-card mt-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm">
                  <ul className="media-detail-info-list space-y-3 text-sm">
                    {detailInfoRows.map((row, i) => (
                      <li
                        key={i}
                        className="media-detail-info-row flex flex-col gap-1.5 border-b pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="text-xs font-medium uppercase tracking-wide text-[var(--theme-text-muted)]">
                          {row.label}
                        </span>
                        <span className="text-[var(--theme-text)]">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                  {hasReleaseSchedule && (
                    <div className="media-detail-schedule-divider mt-4 pt-4 border-t">
                      <button
                        type="button"
                        onClick={onOpenSchedule}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] px-4 py-2.5 text-sm font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface)]"
                      >
                        <Calendar className="w-4 h-4" />
                        {t('media.releaseSchedule')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {user && (
              <div className="media-detail-actions flex flex-col gap-2 mt-4">
                {(user.role === 'content_creator' || user.role === 'admin' || user.role === 'owner') && (
                  <button
                    type="button"
                    onClick={() => setMediaEditOpen(true)}
                    className="btn-edit media-detail-hero-edit-btn media-detail-theme-hover group w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    {t('common.edit')}
                  </button>
                )}
                {!listItemInList && (
                  <button
                    onClick={onOpenAddToList}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--theme-accent)] text-[var(--theme-nav-active-text)] font-medium hover:opacity-90 transition-opacity py-2 px-4"
                  >
                    <IconPlus className="w-4 h-4" />
                    {t('media.addToList')}
                  </button>
                )}
                {listItemInList && (
                  <>
                    {/*
                      Полная поддержка обновления записи списка остаётся в родителе
                      через SUPPORTS_LIST_UPDATE; здесь только отображение.
                    */}
                    <button
                      type="button"
                      onClick={onOpenEditList}
                      className="media-detail-theme-hover media-detail-theme-hover--card group w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-accent)]/15 px-4 py-3 text-left transition-colors flex items-start gap-3"
                      title={t('media.editListEntry')}
                    >
                      <span className="media-detail-theme-hover__icon flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--theme-bg-alt)] flex items-center justify-center text-[var(--theme-text-muted)]">
                        <Pencil className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="media-detail-theme-hover__text font-medium text-[var(--theme-text)] block">
                          {t('media.editListEntry')}
                        </span>
                        <p className="media-detail-theme-hover__text-muted text-sm text-[var(--theme-text-muted)]">
                          <span className="block">
                            {t('media.listPreviewStatus')}:{' '}
                            {getListStatusLabel(
                              t,
                              listType as ListStatus['status'] extends never ? never : any,
                              listItemInList.status as ListStatus
                            )}
                          </span>
                          {['anime', 'tv-series', 'cartoon-series'].includes(type) &&
                            listItemInList.currentEpisode != null && (
                              <span className="block">
                                {t('media.listPreviewEpisode')}:{' '}
                                {t('media.episodeOfEpisodes', {
                                  current: listItemInList.currentEpisode,
                                  total: getMediaEpisodesCount(media) ?? '?',
                                })}
                              </span>
                            )}
                          {listItemInList.rating != null && listItemInList.rating > 0 && (
                            <span className="block">
                              {t('media.listPreviewRating')}: {listItemInList.rating}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>

                    <div
                      className="rating-block relative flex items-center justify-center gap-0.5 flex-wrap rounded-lg px-3 py-1.5 w-full cursor-pointer"
                      style={{ backgroundColor: 'var(--rating-block-bg)' }}
                      role="slider"
                      aria-label={t('media.listRating')}
                      aria-valuemin={1}
                      aria-valuemax={100}
                      aria-valuenow={listItemInList.rating ?? 0}
                      tabIndex={0}
                      onClick={(e: MouseEvent<HTMLDivElement>) => {
                        const el = ratingTrackRef.current
                        if (!el) return
                        const rect = el.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const pct = Math.max(0, Math.min(1, x / rect.width))
                        const value = Math.round(pct * 100) || 1
                        onUpdateListRating(value)
                      }}
                      onMouseMove={(e) => {
                        const el = ratingTrackRef.current
                        if (!el) return
                        const rect = el.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const pct = Math.max(0, Math.min(1, x / rect.width))
                        const value = Math.round(pct * 100) || 1
                        setRatingHoverPreview(value)
                        if (ratingTooltipTimeoutRef.current) clearTimeout(ratingTooltipTimeoutRef.current)
                        ratingTooltipTimeoutRef.current = setTimeout(() => setRatingTooltipVisible(true), 400)
                      }}
                      onMouseLeave={() => {
                        setRatingHoverPreview(null)
                        if (ratingTooltipTimeoutRef.current) {
                          clearTimeout(ratingTooltipTimeoutRef.current)
                          ratingTooltipTimeoutRef.current = null
                        }
                        setRatingTooltipVisible(false)
                      }}
                      onKeyDown={(e) => {
                        const r = listItemInList.rating ?? 0
                        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                          e.preventDefault()
                          onUpdateListRating(Math.min(100, r + 5))
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                          e.preventDefault()
                          onUpdateListRating(Math.max(0, r - 5))
                        }
                      }}
                    >
                      {ratingTooltipVisible && ratingHoverPreview != null && (
                        <span
                          className="rating-block-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded bg-[var(--theme-surface)] text-sm font-medium whitespace-nowrap pointer-events-none"
                          style={{ color: 'var(--rating-block-star)' }}
                        >
                          {ratingHoverPreview}
                        </span>
                      )}
                      <span ref={ratingTrackRef} className="relative flex items-center gap-0.5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                          const rating = ratingHoverPreview ?? listItemInList.rating ?? 0
                          const fillPct = Math.min(1, Math.max(0, (rating - i * 10) / 10)) * 100
                          return (
                            <span key={i} className="relative inline-block w-5 h-5 shrink-0">
                              <Star
                                className="w-4 h-4 absolute inset-0 m-auto opacity-40"
                                style={{ color: 'var(--rating-block-star)', fill: 'var(--rating-block-star)' }}
                              />
                              <span
                                className="absolute inset-0 overflow-hidden"
                                style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }}
                              >
                                <Star
                                  className="w-4 h-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                  style={{ color: 'var(--rating-block-star)', fill: 'var(--rating-block-star)' }}
                                />
                              </span>
                            </span>
                          )
                        })}
                      </span>
                    </div>
                  </>
                )}

                {listItemInList && !isCollectionSupportedForType(type) && (
                  <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-4 space-y-2">
                    <p className="text-sm text-[var(--theme-text-muted)]">
                      {t('media.editInList')}. {t('media.listStatus.label')}:{' '}
                      {getListStatusLabel(t, listType as any, listItemInList.status as ListStatus)}
                    </p>
                    <button type="button" onClick={onRemoveFromList} className="btn-secondary w-full">
                      {t('media.removeFromList')}
                    </button>
                  </div>
                )}

                {isCollectionSupportedForType(type) && (
                  <button
                    type="button"
                    onClick={() => onOpenAddToList()}
                    className="media-detail-theme-hover group w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-[var(--theme-accent)] bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-accent)]/15 text-[var(--theme-text)] font-medium transition-colors"
                  >
                    <IconCollection className="w-4 h-4" />
                    {t('media.addToCollection')}
                  </button>
                )}
                <button
                  onClick={onToggleFavorite}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                    isFavorite
                      ? 'bg-soft_blush-400/25 hover:bg-soft_blush-400/35 text-soft_blush-700 dark:text-soft_blush-400 border border-soft_blush-400/40'
                      : 'media-detail-theme-hover group border border-[var(--theme-accent)] bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-accent)]/15 text-[var(--theme-text)] font-medium'
                  }`}
                >
                  <IconFavorite className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? t('media.removeFromFavorites') : t('media.addToFavorites')}
                </button>
                {renderSimilarUsersAside('hidden lg:flex flex-col gap-3 min-w-0 w-full mt-3')}
              </div>
            )}
          </div>

          <div className="media-detail-hero-main flex-1 w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0 min-w-0">
            <div className="rounded-3xl bg-[var(--theme-surface)]/90">
              <div className="sm:px-6 sm:py-3">
                <div className="media-detail-hero-title flex items-start gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold break-words text-theme">
                    {getMediaTitle(media, locale)}
                  </h1>
                </div>
                {secondaryTitle && (
                  <p
                    className={`media-detail-hero-subtitle text-base sm:text-lg text-theme-muted font-normal mb-4 break-words ${type === 'anime' ? 'italic' : ''}`}
                  >
                    {secondaryTitle}
                  </p>
                )}
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
