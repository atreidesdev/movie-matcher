import { favoritesApi } from '@/api/favorites'
import type { FranchiseLinkItem } from '@/api/franchise'
import RatingEmoji from '@/components/RatingEmoji'
import { IconCross, IconFavorite, getListStatusBadgeClasses, getListStatusIcon } from '@/components/icons'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import type { Profession } from '@/constants/enums'
import { useToastStore } from '@/store/toastStore'
import type { Cast, ListStatus, Media, Person } from '@/types'
import { getFranchiseRelationKey } from '@/utils/franchiseRelation'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getCharacterName, getLocalizedString, getMediaTitle } from '@/utils/localizedText'
import {
  type MediaTypeForPath,
  getMediaAssetUrl,
  getMediaCastPath,
  getMediaFranchisePath,
  getMediaPath,
  getMediaSimilarPath,
  getMediaStaffPath,
} from '@/utils/mediaPaths'
import { getPersonDisplayName } from '@/utils/personUtils'
import { normalizeRatingToPercent } from '@/utils/rating'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { type RefObject, useMemo } from 'react'
import { Link } from 'react-router-dom'

const LANGUAGE_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  ja: '日本語',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
}

const CREW_ORDER: { key: string; professions: Profession[] }[] = [
  { key: 'media.directors', professions: ['director'] },
  { key: 'media.screenwriters', professions: ['writer'] },
  { key: 'media.animators', professions: ['animator'] },
  { key: 'media.producers', professions: ['producer'] },
  { key: 'media.composers', professions: ['composer'] },
  { key: 'media.cinematographers', professions: ['cinematographer'] },
  { key: 'media.editors', professions: ['editor'] },
  { key: 'media.authors', professions: ['author'] },
  { key: 'media.illustrators', professions: ['illustrator'] },
  { key: 'media.artists', professions: ['artist'] },
  { key: 'media.gameDesigners', professions: ['gameDesigner'] },
  { key: 'media.levelDesigners', professions: ['levelDesigner'] },
  { key: 'media.translators', professions: ['translator'] },
  { key: 'media.literaryEditors', professions: ['literaryEditor'] },
]

function groupCrewByRole(castList: Cast[]): Record<string, Cast[]> {
  const crew = castList.filter((c) => !c.characterId && c.person)
  const groups: Record<string, Cast[]> = {}
  for (const entry of crew) {
    const profs = entry.person?.profession ?? []
    for (const { key, professions } of CREW_ORDER) {
      if (professions.some((p) => profs.includes(p))) {
        if (!groups[key]) groups[key] = []
        groups[key].push(entry)
      }
    }
  }
  return groups
}

interface MediaDetailCastFranchiseSectionProps {
  media: Media
  type: MediaTypeForPath
  locale: string
  t: (key: string, params?: Record<string, unknown>) => string
  user: { id: number } | null
  franchiseLinks: FranchiseLinkItem[]
  favoriteCastIds: Set<number>
  setFavoriteCastIds: React.Dispatch<React.SetStateAction<Set<number>>>
  favoritePersonIds: Set<number>
  setFavoritePersonIds: React.Dispatch<React.SetStateAction<Set<number>>>
  castModalEntry: Cast | null
  setCastModalEntry: React.Dispatch<React.SetStateAction<Cast | null>>
  castScrollRef: RefObject<HTMLDivElement | null>
  staffScrollRef: RefObject<HTMLDivElement | null>
  franchiseScrollRef: RefObject<HTMLDivElement | null>
  similarScrollRef: RefObject<HTMLDivElement | null>
}

export function MediaDetailCastFranchiseSection({
  media,
  type,
  locale,
  t,
  user,
  franchiseLinks,
  favoriteCastIds,
  setFavoriteCastIds,
  favoritePersonIds,
  setFavoritePersonIds,
  castModalEntry,
  setCastModalEntry,
  castScrollRef,
  staffScrollRef,
  franchiseScrollRef,
  similarScrollRef,
}: MediaDetailCastFranchiseSectionProps) {
  const uniqueFranchiseLinks = useMemo(() => {
    const seen = new Set<number>()
    return franchiseLinks.filter((l) => {
      if (seen.has(l.relatedMediaId)) return false
      seen.add(l.relatedMediaId)
      return true
    })
  }, [franchiseLinks])

  const fullCastList = ('cast' in media && Array.isArray(media.cast) ? (media.cast as Cast[]) : []).filter(
    (c) => c != null && (c.person || c.character),
  )
  const actingCast = fullCastList.filter((c) => c.characterId)
  const mainPreview = actingCast.filter((c) => c.roleType === 'main').slice(0, 8)
  const staffPreview: Person[] = []
  const seenIds = new Set<number>()
  if ('staff' in media && Array.isArray(media.staff) && media.staff.length > 0) {
    for (const s of media.staff as { person?: Person }[]) {
      if (s.person && !seenIds.has(s.person.id)) {
        seenIds.add(s.person.id)
        staffPreview.push(s.person)
      }
    }
  } else {
    const crewByRole = groupCrewByRole(fullCastList)
    for (const { key } of CREW_ORDER) {
      for (const e of crewByRole[key] ?? []) {
        if (e.person && !seenIds.has(e.person.id)) {
          seenIds.add(e.person.id)
          staffPreview.push(e.person)
        }
      }
    }
  }
  const authors = ('authors' in media && Array.isArray(media.authors) ? media.authors : []) as Person[]
  const illustrators = (
    'illustrators' in media && Array.isArray(media.illustrators) ? media.illustrators : []
  ) as Person[]
  for (const p of [...authors, ...illustrators]) {
    if (p && !seenIds.has(p.id)) {
      seenIds.add(p.id)
      staffPreview.push(p)
    }
  }
  const hasStaff = staffPreview.length > 0
  const mediaTitle = getMediaTitle(media) || media.title

  return (
    <>
      <div className="media-detail-section-panel mt-0 flex flex-col gap-4">
        <div className="flex flex-col gap-4 min-w-0">
          {actingCast.length > 0 && (
            <div className="flex flex-col gap-3">
              <Link
                to={getMediaCastPath(type, media.id, mediaTitle)}
                className="text-xl font-semibold block title-hover-theme transition-colors"
              >
                {t('media.castLink')}
              </Link>
              <motion.div
                ref={castScrollRef}
                className="media-horizontal-scroll flex gap-4 -mx-1 pb-2"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {mainPreview.map((entry) => (
                  <motion.div
                    key={entry.id}
                    variants={staggerItemVariants}
                    className="flex-shrink-0 w-32 min-w-32 max-w-32 group relative"
                    style={{ contain: 'layout' }}
                  >
                    <div className="absolute left-full top-0 bottom-0 w-2 hidden md:block" aria-hidden />
                    <div
                      className="absolute left-full top-0 bottom-0 w-[272px] hidden md:block pointer-events-none ml-2"
                      aria-hidden
                    />
                    {user && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const isFav = favoriteCastIds.has(entry.id)
                          const name =
                            (getPersonDisplayName(entry.person, locale) || getCharacterName(entry.character, locale)) ??
                            ''
                          if (isFav) {
                            favoritesApi
                              .remove('cast', entry.id)
                              .then(() => {
                                setFavoriteCastIds((prev) => {
                                  const s = new Set(prev)
                                  s.delete(entry.id)
                                  return s
                                })
                                useToastStore.getState().show({
                                  title: t('toast.removedFromFavorites'),
                                  description: t('toast.removedFromFavoritesEntity', {
                                    name: name || String(entry.id),
                                  }),
                                })
                              })
                              .catch(() => {})
                          } else {
                            favoritesApi
                              .add('cast', entry.id)
                              .then(() => {
                                setFavoriteCastIds((prev) => new Set([...prev, entry.id]))
                                useToastStore.getState().show({
                                  title: t('toast.addedToFavorites'),
                                  description: t('toast.addedToFavoritesEntity', { name: name || String(entry.id) }),
                                })
                              })
                              .catch(() => {})
                          }
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                        aria-label={t('nav.favorites')}
                        title={t('nav.favorites')}
                      >
                        <IconFavorite
                          className={`w-4 h-4 ${favoriteCastIds.has(entry.id) ? 'fill-current text-soft_blush-400' : ''}`}
                        />
                      </button>
                    )}
                    <button
                      type="button"
                      className="w-full text-left rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] md:focus:ring-0 touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault()
                        if (window.matchMedia('(min-width: 768px)').matches) return
                        setCastModalEntry(entry)
                      }}
                      aria-expanded={castModalEntry?.id === entry.id}
                    >
                      <div className="relative w-32 aspect-[2/3] overflow-hidden rounded-xl">
                        {entry.poster ? (
                          <img
                            src={getMediaAssetUrl(entry.poster)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[var(--theme-text-muted)] text-sm">
                            —
                          </div>
                        )}
                      </div>
                      <div className="px-1 pt-2">
                        <span className="block text-sm font-medium text-[var(--theme-text)] text-center truncate">
                          {getCharacterName(entry.character, locale) ||
                            getPersonDisplayName(entry.person, locale) ||
                            '—'}
                        </span>
                      </div>
                    </button>
                    <div
                      className="cast-tooltip-theme hidden md:block absolute z-[50] min-w-[220px] max-w-[280px] py-3 px-4 rounded-xl text-left shadow-xl border transition-opacity duration-200 top-1/2 left-full ml-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                      aria-hidden
                    >
                      <div className="cast-tooltip-theme__arrow absolute left-auto right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[10px] border-y-transparent border-r-[10px]" />
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-16">
                            <span className="cast-tooltip-theme__muted text-[10px] font-semibold uppercase tracking-wide block mb-1">
                              {t('media.characterLabel')}
                            </span>
                            <div className="cast-tooltip-theme__card aspect-[2/3] rounded-lg overflow-hidden">
                              {entry.character?.avatar ? (
                                entry.characterId ? (
                                  <Link to={`/characters/${entry.characterId}`} className="block w-full h-full">
                                    <img
                                      src={getMediaAssetUrl(entry.character.avatar)}
                                      alt=""
                                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                    />
                                  </Link>
                                ) : (
                                  <img
                                    src={getMediaAssetUrl(entry.character.avatar)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <div className="cast-tooltip-theme__muted w-full h-full flex items-center justify-center text-xs">
                                  —
                                </div>
                              )}
                            </div>
                            {entry.characterId && entry.character ? (
                              <Link
                                to={`/characters/${entry.characterId}`}
                                className="cast-tooltip-theme__text block text-xs font-medium mt-1 line-clamp-2 title-hover-theme hover:underline"
                              >
                                {getCharacterName(entry.character, locale)}
                              </Link>
                            ) : (
                              <p className="cast-tooltip-theme__text text-xs font-medium mt-1 line-clamp-2">
                                {getCharacterName(entry.character, locale) || '—'}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-16">
                            <span className="cast-tooltip-theme__muted text-[10px] font-semibold uppercase tracking-wide block mb-1">
                              {t('media.actorLabel')}
                            </span>
                            <div className="cast-tooltip-theme__card aspect-[2/3] rounded-lg overflow-hidden">
                              {entry.person?.avatar ? (
                                entry.personId ? (
                                  <Link to={`/persons/${entry.personId}`} className="block w-full h-full">
                                    <img
                                      src={getMediaAssetUrl(entry.person.avatar)}
                                      alt=""
                                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                    />
                                  </Link>
                                ) : (
                                  <img
                                    src={getMediaAssetUrl(entry.person.avatar)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <div className="cast-tooltip-theme__muted w-full h-full flex items-center justify-center text-xs">
                                  —
                                </div>
                              )}
                            </div>
                            {entry.personId && entry.person ? (
                              <Link
                                to={`/persons/${entry.personId}`}
                                className="cast-tooltip-theme__accent block text-xs font-medium mt-1 line-clamp-2 title-hover-theme hover:underline"
                              >
                                {getPersonDisplayName(entry.person, locale)}
                              </Link>
                            ) : (
                              <p className="cast-tooltip-theme__accent text-xs font-medium mt-1 line-clamp-2">
                                {entry.person ? getPersonDisplayName(entry.person, locale) : '—'}
                              </p>
                            )}
                          </div>
                        </div>
                        {(entry.dubbings?.length ?? 0) > 0 && (
                          <div>
                            <span className="cast-tooltip-theme__muted text-xs font-semibold uppercase tracking-wide">
                              {t('media.dubbing')}
                            </span>
                            <ul className="mt-0.5 space-y-0.5">
                              {(entry.dubbings ?? []).map((d) => (
                                <li key={d.id} className="text-sm truncate">
                                  {LANGUAGE_LABELS[d.language] ?? d.language}:{' '}
                                  {d.personId && d.person ? (
                                    <Link
                                      to={`/persons/${d.personId}`}
                                      className="cast-tooltip-theme__accent title-hover-theme hover:underline"
                                    >
                                      {getPersonDisplayName(d.person, locale)}
                                    </Link>
                                  ) : (
                                    <span className="cast-tooltip-theme__text">
                                      {d.person ? getPersonDisplayName(d.person, locale) : '—'}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {hasStaff && (
            <div className="flex flex-col gap-3">
              <Link
                to={getMediaStaffPath(type, media.id, mediaTitle)}
                className="text-xl font-semibold block title-hover-theme transition-colors"
              >
                {t('media.staffLink')}
              </Link>
              <motion.div
                ref={staffScrollRef}
                className="media-horizontal-scroll flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-thin"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {staffPreview.slice(0, 8).map((person) => (
                  <motion.div
                    key={person.id}
                    variants={staggerItemVariants}
                    className="flex-shrink-0 w-32 group relative"
                  >
                    {user && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const isFav = favoritePersonIds.has(person.id)
                          if (isFav) {
                            favoritesApi
                              .remove('persons', person.id)
                              .then(() =>
                                setFavoritePersonIds((prev) => {
                                  const s = new Set(prev)
                                  s.delete(person.id)
                                  return s
                                }),
                              )
                              .catch(() => {})
                          } else {
                            favoritesApi
                              .add('persons', person.id)
                              .then(() => setFavoritePersonIds((prev) => new Set([...prev, person.id])))
                              .catch(() => {})
                          }
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                        aria-label={t('nav.favorites')}
                        title={t('nav.favorites')}
                      >
                        <IconFavorite
                          className={`w-4 h-4 ${favoritePersonIds.has(person.id) ? 'fill-current text-soft_blush-400' : ''}`}
                        />
                      </button>
                    )}
                    <Link to={getMediaStaffPath(type, media.id, mediaTitle)} className="block w-full group/link">
                      <div className="relative w-32 aspect-[2/3] rounded-xl overflow-hidden bg-[var(--theme-bg-alt)]">
                        {person.avatar ? (
                          <img
                            src={getMediaAssetUrl(person.avatar)}
                            alt=""
                            className="w-full h-full object-cover group-hover/link:opacity-95 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-muted)] text-sm">
                            —
                          </div>
                        )}
                      </div>
                      <div className="px-1 pt-2">
                        <span className="block text-sm font-medium text-[var(--theme-text)] text-center truncate">
                          {getPersonDisplayName(person, locale)}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {uniqueFranchiseLinks.length > 0 && (
            <div className="flex flex-col gap-3">
              <Link
                to={getMediaFranchisePath(type, media.id, mediaTitle)}
                className="text-xl font-semibold block title-hover-theme transition-colors focus:outline-none"
              >
                {t('media.franchise')}
              </Link>
              <p className="text-[var(--theme-text-muted)] text-sm">
                {t('media.partOfFranchise', {
                  name: getLocalizedString(
                    franchiseLinks[0].franchiseNameI18n,
                    franchiseLinks[0].franchiseName,
                    locale,
                  ),
                })}
              </p>
              <motion.div
                ref={franchiseScrollRef}
                className="media-horizontal-scroll flex gap-4 overflow-x-auto -mx-1 scrollbar-thin pb-2"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {uniqueFranchiseLinks.map((link) => {
                  const pathType = (
                    link.relatedType === 'tvSeries'
                      ? 'tv-series'
                      : link.relatedType === 'animeSeries'
                        ? 'anime'
                        : link.relatedType === 'lightNovel'
                          ? 'light-novel'
                          : link.relatedType === 'cartoonSeries'
                            ? 'cartoon-series'
                            : link.relatedType === 'cartoonMovie'
                              ? 'cartoon-movies'
                              : link.relatedType === 'animeMovie'
                                ? 'anime-movies'
                                : link.relatedType
                  ) as MediaTypeForPath
                  const status = link.listStatus as ListStatus | undefined
                  const StatusIcon = status ? getListStatusIcon(status, pathType) : null
                  const badgeClasses = status ? getListStatusBadgeClasses(status, pathType) : null
                  const ratingDisplay = normalizeRatingToPercent(link.relatedRating)
                  return (
                    <motion.div
                      key={`${link.relatedType}-${link.relatedMediaId}`}
                      variants={staggerItemVariants}
                      className="flex-shrink-0"
                    >
                      <Link
                        to={`/${link.relatedType}/${link.relatedMediaId}`}
                        className="flex-shrink-0 w-32 rounded-xl overflow-hidden transition-colors focus:outline-none"
                      >
                        <div className="relative w-32 aspect-[2/3] bg-[var(--theme-bg-alt)] flex items-center justify-center text-[var(--theme-text-muted)] text-4xl">
                          {link.relatedPoster ? (
                            <img
                              src={getMediaAssetUrl(link.relatedPoster)}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                          {StatusIcon && badgeClasses && (
                            <div
                              className={clsx(
                                'absolute top-1 left-1 z-10 w-7 h-7 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-lg',
                                badgeClasses.bg,
                                badgeClasses.text,
                              )}
                              title={status ? getListStatusLabel(t, pathType, status) : ''}
                            >
                              <StatusIcon size={14} className="shrink-0" />
                            </div>
                          )}
                          <div className="rating-badge rating-badge-franchise absolute top-1 right-1 z-10 h-7 bg-[var(--theme-accent)] backdrop-blur-sm rounded-lg px-1.5 flex items-center gap-0.5 shadow-lg text-[var(--theme-nav-active-text)]">
                            <RatingEmoji
                              rating={ratingDisplay ?? undefined}
                              size={14}
                              className="opacity-90 shrink-0"
                            />
                            {ratingDisplay != null ? (
                              <span className="rating-badge-value text-xs font-medium">{ratingDisplay}</span>
                            ) : null}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 py-2 px-2 bg-black/40 backdrop-blur-sm">
                            <span className="text-white text-xs font-medium block text-center">
                              {t(`media.franchiseRelation.${getFranchiseRelationKey(link.relationType)}`)}
                            </span>
                          </div>
                        </div>
                        <div className="px-1 pt-2">
                          <span className="block text-sm font-medium text-[var(--theme-text)] text-center truncate">
                            {getLocalizedString(link.relatedTitleI18n, link.relatedTitle, locale) ||
                              `#${link.relatedMediaId}`}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          )}

          {media &&
            'similar' in media &&
            Array.isArray((media as { similar?: Media[] }).similar) &&
            (media as { similar: Media[] }).similar.length > 0 && (
              <div className="flex flex-col gap-3">
                <Link
                  to={getMediaSimilarPath(type, media.id, mediaTitle)}
                  className="text-xl font-semibold block title-hover-theme transition-colors focus:outline-none"
                >
                  {t('media.similar')}
                </Link>
                <motion.div
                  ref={similarScrollRef}
                  className="media-horizontal-scroll flex gap-4 overflow-x-auto -mx-1 scrollbar-thin pb-2"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {((media as { similar: Media[] }).similar as Media[]).slice(0, 6).map((item) => {
                    const status = item.listStatus as ListStatus | undefined
                    const StatusIcon = status ? getListStatusIcon(status, type) : null
                    const badgeClasses = status ? getListStatusBadgeClasses(status, type) : null
                    const ratingDisplay = normalizeRatingToPercent(item.rating)
                    return (
                      <motion.div key={item.id} variants={staggerItemVariants} className="flex-shrink-0">
                        <Link
                          to={getMediaPath(type, item.id, getMediaTitle(item) || item.title)}
                          className="block w-32 rounded-xl overflow-hidden transition-colors focus:outline-none"
                        >
                          <div className="relative w-32 aspect-[2/3] bg-[var(--theme-bg-alt)] flex items-center justify-center text-[var(--theme-text-muted)] text-4xl">
                            {item.poster ? (
                              <img
                                src={getMediaAssetUrl(item.poster)}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <span className="opacity-50">—</span>
                            )}
                            {StatusIcon && badgeClasses && (
                              <div
                                className={clsx(
                                  'absolute top-1 left-1 z-10 w-7 h-7 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-lg',
                                  badgeClasses.bg,
                                  badgeClasses.text,
                                )}
                                title={status ? getListStatusLabel(t, type, status) : ''}
                              >
                                <StatusIcon size={14} className="shrink-0" />
                              </div>
                            )}
                            <div className="rating-badge rating-badge-similar absolute top-1 right-1 z-10 h-7 bg-[var(--theme-accent)] backdrop-blur-sm rounded-lg px-1.5 flex items-center gap-0.5 shadow-lg text-[var(--theme-nav-active-text)]">
                              <RatingEmoji rating={ratingDisplay} size={14} className="opacity-90 shrink-0" />
                              {ratingDisplay != null ? (
                                <span className="rating-badge-value text-xs font-medium">{ratingDisplay}</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="px-1 pt-2">
                            <span className="block text-sm font-medium text-[var(--theme-text)] text-center truncate">
                              {getMediaTitle(item, locale) || item.title}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            )}
        </div>
      </div>

      {castModalEntry && (
        <div
          className="fixed inset-0 z-[90] md:hidden flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('media.castLink')}
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setCastModalEntry(null)} aria-hidden />
          <div className="relative w-full max-w-[min(320px,100%)] max-h-[85vh] overflow-y-auto rounded-xl bg-gray-800 text-gray-200 shadow-xl border border-gray-600">
            <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
              {user && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const isFav = favoriteCastIds.has(castModalEntry.id)
                    const name =
                      (getPersonDisplayName(castModalEntry.person, locale) ||
                        getCharacterName(castModalEntry.character, locale)) ??
                      ''
                    if (isFav) {
                      favoritesApi
                        .remove('cast', castModalEntry.id)
                        .then(() => {
                          setFavoriteCastIds((prev) => {
                            const s = new Set(prev)
                            s.delete(castModalEntry.id)
                            return s
                          })
                          useToastStore.getState().show({
                            title: t('toast.removedFromFavorites'),
                            description: t('toast.removedFromFavoritesEntity', {
                              name: name || String(castModalEntry.id),
                            }),
                          })
                        })
                        .catch(() => {})
                    } else {
                      favoritesApi
                        .add('cast', castModalEntry.id)
                        .then(() => {
                          setFavoriteCastIds((prev) => new Set([...prev, castModalEntry.id]))
                          useToastStore.getState().show({
                            title: t('toast.addedToFavorites'),
                            description: t('toast.addedToFavoritesEntity', {
                              name: name || String(castModalEntry.id),
                            }),
                          })
                        })
                        .catch(() => {})
                    }
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  aria-label={t('nav.favorites')}
                  title={t('nav.favorites')}
                >
                  <IconFavorite
                    className={`w-5 h-5 ${favoriteCastIds.has(castModalEntry.id) ? 'fill-current text-soft_blush-400' : ''}`}
                  />
                </button>
              )}
              <button
                type="button"
                onClick={() => setCastModalEntry(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                aria-label={t('common.close')}
              >
                <IconCross className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 pt-12 space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-20">
                  <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide block mb-1">
                    {t('media.characterLabel')}
                  </span>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                    {castModalEntry.character?.avatar ? (
                      castModalEntry.characterId ? (
                        <Link
                          to={`/characters/${castModalEntry.characterId}`}
                          className="block w-full h-full"
                          onClick={() => setCastModalEntry(null)}
                        >
                          <img
                            src={getMediaAssetUrl(castModalEntry.character.avatar)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      ) : (
                        <img
                          src={getMediaAssetUrl(castModalEntry.character.avatar)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">—</div>
                    )}
                  </div>
                  {castModalEntry.characterId && castModalEntry.character ? (
                    <Link
                      to={`/characters/${castModalEntry.characterId}`}
                      className="block text-gray-200 text-sm font-medium mt-1 line-clamp-2 title-hover-theme transition-colors no-underline"
                      onClick={() => setCastModalEntry(null)}
                    >
                      {getCharacterName(castModalEntry.character, locale)}
                    </Link>
                  ) : (
                    <p className="text-gray-200 text-sm font-medium mt-1 line-clamp-2">
                      {getCharacterName(castModalEntry.character, locale) || '—'}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 w-20">
                  <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide block mb-1">
                    {t('media.actorLabel')}
                  </span>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                    {castModalEntry.person?.avatar ? (
                      castModalEntry.personId ? (
                        <Link
                          to={`/persons/${castModalEntry.personId}`}
                          className="block w-full h-full"
                          onClick={() => setCastModalEntry(null)}
                        >
                          <img
                            src={getMediaAssetUrl(castModalEntry.person.avatar)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      ) : (
                        <img
                          src={getMediaAssetUrl(castModalEntry.person.avatar)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">—</div>
                    )}
                  </div>
                  {castModalEntry.personId && castModalEntry.person ? (
                    <Link
                      to={`/persons/${castModalEntry.personId}`}
                      className="block text-gray-200 text-sm font-medium mt-1 line-clamp-2 title-hover-theme transition-colors no-underline"
                      onClick={() => setCastModalEntry(null)}
                    >
                      {getPersonDisplayName(castModalEntry.person, locale)}
                    </Link>
                  ) : (
                    <p className="text-gray-200 text-sm font-medium mt-1 line-clamp-2">
                      {castModalEntry.person ? getPersonDisplayName(castModalEntry.person, locale) : '—'}
                    </p>
                  )}
                </div>
              </div>
              {(castModalEntry.dubbings?.length ?? 0) > 0 && (
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">
                    {t('media.dubbing')}
                  </span>
                  <ul className="flex flex-col gap-2 list-none pl-0">
                    {(castModalEntry.dubbings ?? []).map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-col gap-0.5 text-sm border-b border-gray-600/50 pb-2 last:border-0 last:pb-0"
                      >
                        <span className="text-gray-400 text-[10px] uppercase tracking-wide">
                          {LANGUAGE_LABELS[d.language] ?? d.language}
                        </span>
                        {d.personId && d.person ? (
                          <Link
                            to={`/persons/${d.personId}`}
                            className="text-gray-200 title-hover-theme transition-colors no-underline line-clamp-1"
                            onClick={() => setCastModalEntry(null)}
                          >
                            {getPersonDisplayName(d.person, locale)}
                          </Link>
                        ) : (
                          <span className="text-gray-200 line-clamp-1">
                            {d.person ? getPersonDisplayName(d.person, locale) : '—'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
