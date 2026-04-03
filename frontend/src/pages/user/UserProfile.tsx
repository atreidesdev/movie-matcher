import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useOutletContext, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { useAuthStore } from '@/store/authStore'
import { getMediaAssetUrl, getMediaPath, type MediaTypeForPath } from '@/utils/mediaPaths'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { usersApi } from '@/api/users'
import { socialApi } from '@/api/social'
import { PublicProfile, ListCountsByStatus, type AchievementWithProgress } from '@/types'
import { Link2, ExternalLink } from 'lucide-react'
import { IconAchievement } from '@/components/icons'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { activityApi, type ActivityItem } from '@/api/activity'
import { motion } from 'framer-motion'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import { IconActivity } from '@/components/icons'
import CustomSelect from '@/components/CustomSelect'

/** Маппинг entityType (API) → путь списка и ключ навбара */
const LIST_TYPE_TO_PATH: Record<string, { path: string; navKey: string }> = {
  movie: { path: 'movies', navKey: 'movies' },
  tvSeries: { path: 'tv-series', navKey: 'tvSeries' },
  anime: { path: 'anime', navKey: 'anime' },
  animeSeries: { path: 'anime', navKey: 'anime' },
  game: { path: 'games', navKey: 'games' },
  games: { path: 'games', navKey: 'games' },
  manga: { path: 'manga', navKey: 'manga' },
  book: { path: 'books', navKey: 'books' },
  books: { path: 'books', navKey: 'books' },
  lightNovel: { path: 'light-novels', navKey: 'lightNovels' },
  cartoonSeries: { path: 'cartoon-series', navKey: 'cartoonSeries' },
  cartoonMovie: { path: 'cartoon-movies', navKey: 'cartoonMovies' },
  animeMovie: { path: 'anime-movies', navKey: 'animeMovies' },
}

/** API mediaType (activity) → сегмент пути для getMediaPath */
const ACTIVITY_MEDIA_TYPE_TO_PATH: Record<string, MediaTypeForPath> = {
  movies: 'movie',
  anime: 'anime',
  games: 'game',
  'tv-series': 'tv-series',
  manga: 'manga',
  book: 'book',
  books: 'book',
  'light-novel': 'light-novel',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

/** Порядок и ключи навбара для фильтра по типу медиа (activity) */
const ACTIVITY_MEDIA_FILTER_OPTIONS: { value: string; navKey: string }[] = [
  { value: 'movies', navKey: 'movies' },
  { value: 'tv-series', navKey: 'tvSeries' },
  { value: 'anime', navKey: 'anime' },
  { value: 'cartoon-series', navKey: 'cartoonSeries' },
  { value: 'cartoon-movies', navKey: 'cartoonMovies' },
  { value: 'anime-movies', navKey: 'animeMovies' },
  { value: 'games', navKey: 'games' },
  { value: 'manga', navKey: 'manga' },
  { value: 'books', navKey: 'books' },
  { value: 'light-novel', navKey: 'lightNovels' },
]

const STATUS_KEYS = ['planned', 'watching', 'completed', 'onHold', 'dropped', 'rewatching'] as const

const STATUS_BAR_BG: Record<string, string> = {
  planned: 'bg-dusty_grape-500',
  watching: 'bg-space_indigo-600',
  completed: 'bg-thistle-400',
  onHold: 'bg-lavender_grey-500',
  dropped: 'bg-soft_blush-400',
  rewatching: 'bg-lavender-400',
}

function getTotal(s: ListCountsByStatus | undefined): number {
  if (!s) return 0
  return (
    (s.total ?? 0) ||
    (s.planned ?? 0) + (s.watching ?? 0) + (s.completed ?? 0) + (s.onHold ?? 0) + (s.dropped ?? 0) + (s.rewatching ?? 0)
  )
}

function mergeStatusCounts(
  a: ListCountsByStatus | undefined,
  b: ListCountsByStatus | undefined
): ListCountsByStatus | undefined {
  if (!a && !b) return undefined
  const res: ListCountsByStatus = {
    planned: 0,
    watching: 0,
    completed: 0,
    onHold: 0,
    dropped: 0,
    rewatching: 0,
    total: 0,
  }
  const srcs = [a, b]
  for (const src of srcs) {
    if (!src) continue
    res.planned = (res.planned ?? 0) + (src.planned ?? 0)
    res.watching = (res.watching ?? 0) + (src.watching ?? 0)
    res.completed = (res.completed ?? 0) + (src.completed ?? 0)
    res.onHold = (res.onHold ?? 0) + (src.onHold ?? 0)
    res.dropped = (res.dropped ?? 0) + (src.dropped ?? 0)
    res.rewatching = (res.rewatching ?? 0) + (src.rewatching ?? 0)
    res.total = (res.total ?? 0) + (src.total ?? 0)
  }
  return res
}

function groupListCountsByType(byType: PublicProfile['listCounts'] | undefined['byType']) {
  if (!byType) return {}
  const grouped: Record<string, ListCountsByStatus> = {}

  const take = (key: string): ListCountsByStatus | undefined => byType[key] as ListCountsByStatus | undefined

  const anime = [take('anime'), take('animeSeries'), take('animeMovie')].reduce<ListCountsByStatus | undefined>(
    (acc, cur) => mergeStatusCounts(acc, cur),
    undefined
  )
  if (anime) grouped.anime = anime

  const movies = mergeStatusCounts(take('movie'), take('tvSeries'))
  if (movies) grouped.movie = movies

  const cartoons = mergeStatusCounts(take('cartoonSeries'), take('cartoonMovie'))
  if (cartoons) grouped.cartoonSeries = cartoons

  const books = [take('manga'), take('lightNovel'), take('book'), take('books')].reduce<ListCountsByStatus | undefined>(
    (acc, cur) => mergeStatusCounts(acc, cur),
    undefined
  )
  if (books) grouped.books = books

  const consumed = new Set<string>([
    'anime',
    'animeSeries',
    'animeMovie',
    'movie',
    'tvSeries',
    'cartoonSeries',
    'cartoonMovie',
    'manga',
    'lightNovel',
    'book',
    'books',
  ])

  for (const [key, value] of Object.entries(byType)) {
    if (!consumed.has(key) && value) {
      grouped[key] = value as ListCountsByStatus
    }
  }

  return grouped
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const [activity, setActivity] = useState<ActivityItem[] | null>(null)
  const [, setAddFriendLoading] = useState(false)
  const [, setFollowLoading] = useState(false)
  const [, setIsFollowing] = useState(false)
  const [achievementsList, setAchievementsList] = useState<AchievementWithProgress[] | null>(null)
  const [activityVisibleCount, setActivityVisibleCount] = useState(10)
  const [activityMediaFilter, setActivityMediaFilter] = useState('')

  const isOwnProfile = Boolean(
    currentUser?.username && username && currentUser.username.toLowerCase() === username.toLowerCase()
  )

  useEffect(() => {
    if (!currentUser || !profile || isOwnProfile) return
    socialApi
      .getFollowing()
      .then((list) => setIsFollowing(list.some((u) => u.id === profile.id)))
      .catch(() => {})
  }, [currentUser, profile, isOwnProfile])

  // История активности для собственного профиля — для календаря/heatmap
  useEffect(() => {
    if (!isOwnProfile) {
      setActivity(null)
      return
    }
    setActivityVisibleCount(10)
    activityApi
      .getMyActivity({ limit: 500 })
      .then((items) => setActivity(items ?? []))
      .catch(() => setActivity(null))
  }, [isOwnProfile])

  useEffect(() => {
    if (!profile?.username || profile.profileHidden) {
      setAchievementsList(null)
      return
    }
    usersApi
      .getAchievementsByUsername(profile.username)
      .then((res) => setAchievementsList(res.achievements ?? []))
      .catch(() => setAchievementsList(null))
  }, [profile?.username, profile?.profileHidden])

  // Прокрутка к блоку «Статистика по типам» при переходе по ссылке с якорем #list-stats
  const location = useLocation()
  useEffect(() => {
    if (!profile || location.hash !== '#list-stats') return
    const el = document.getElementById('list-stats')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [profile, location.hash])

  const groupedByType = useMemo(() => groupListCountsByType(profile?.listCounts?.byType), [profile?.listCounts?.byType])

  // Подготовка списка типов для единственного переключаемого блока статистики
  const typeEntries = useMemo(
    () => Object.entries(groupedByType ?? {}).filter(([, counts]) => getTotal(counts) > 0),
    [groupedByType]
  )

  const [activeTypeIndex, setActiveTypeIndex] = useState(0)

  // Автоматическое переключение типов раз в несколько секунд
  useEffect(() => {
    if (typeEntries.length <= 1) return
    const interval = setInterval(() => {
      setActiveTypeIndex((prev) => (prev + 1) % typeEntries.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [typeEntries.length])

  const activityByDate = useMemo(() => {
    const map: Record<string, number> = {}

    if (!activity || activity.length === 0) {
      // Если данных нет (особенно в моке) — рисуем условную "шумовую" активность,
      // чтобы календарь визуально демонстрировал разные уровни.
      const todayLocal = new Date()
      for (let i = 0; i < 28; i++) {
        const d = new Date(todayLocal)
        d.setDate(todayLocal.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        // Псевдослучайное распределение 0–4 по дням
        const seed = (d.getDate() + d.getMonth() * 7) % 5
        const count = seed === 0 ? 0 : seed
        if (count > 0) {
          map[key] = count
        }
      }
      return map
    }

    for (const item of activity) {
      const day = new Date(item.createdAt)
      if (Number.isNaN(day.getTime())) continue
      const key = day.toISOString().slice(0, 10)
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }, [activity])

  const today = new Date()

  // Последние 140 дней для "ленты" активности в стиле AniList
  const activityDays = useMemo(() => {
    const days: { date: Date; key: string; count: number }[] = []
    for (let i = 139; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      const count = activityByDate[key] ?? 0
      days.push({ date, key, count })
    }
    return days
  }, [activityByDate, today])

  const maxActivityCount = useMemo(() => {
    return Object.values(activityByDate).reduce((max, v) => (v > max ? v : max), 0)
  }, [activityByDate])

  const levelForCount = (count: number) => {
    if (count <= 0 || maxActivityCount <= 0) return 0
    const ratio = count / maxActivityCount
    if (ratio > 0.75) return 4
    if (ratio > 0.5) return 3
    if (ratio > 0.25) return 2
    return 1
  }

  if (!profile) return null

  return (
    <>
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 pb-10 text-profile"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Основной контент профиля */}
        {profile.profileHidden && !isOwnProfile && (
          <div className="p-4 bg-theme-surface rounded-lg text-profile-muted text-sm mb-6">
            This profile is hidden or visible only to friends.
          </div>
        )}

        {!profile.profileHidden && profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(profile.socialLinks).map(([platform, url]) => {
              if (!url?.trim()) return null
              const label = t(`user.social.${platform}`, platform)
              return (
                <a
                  key={platform}
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-theme-bg-alt hover:bg-theme-surface rounded-lg text-profile text-sm transition-colors"
                >
                  <Link2 className="w-8 h-8 shrink-0" />
                  <span>{label}</span>
                  <ExternalLink className="w-8 h-8 shrink-0 opacity-70" />
                </a>
              )
            })}
          </div>
        )}

        {!profile.profileHidden && (
          <div className="grid gap-6 lg:gap-8 items-start lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.4fr)]">
            {/* Правая колонка на десктопе: списки + активность. На мобилке — contents для порядка. */}
            <div className="contents lg:flex lg:flex-col lg:gap-8 lg:order-2">
              {typeEntries.length > 0 && (
                <section id="list-stats" className="scroll-mt-4 order-1 lg:order-none flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-profile">{t('profile.statsByType')}</h3>

                  {typeEntries.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {typeEntries.map(([entityType]) => {
                        const index = typeEntries.findIndex(([t]) => t === entityType)
                        const isActive = index === activeTypeIndex
                        const { navKey } = LIST_TYPE_TO_PATH[entityType] || { path: entityType, navKey: entityType }
                        let typeLabel: string
                        if (entityType === 'movie') {
                          typeLabel = t('profile.mediaTypeMovie')
                        } else if (entityType === 'anime') {
                          typeLabel = t('profile.mediaTypeAnime')
                        } else if (entityType === 'cartoonSeries') {
                          typeLabel = t('profile.mediaTypeCartoons')
                        } else if (entityType === 'books') {
                          typeLabel = t('profile.mediaTypeBooks')
                        } else {
                          typeLabel = t(`nav.${navKey}`)
                        }
                        return (
                          <button
                            key={entityType}
                            type="button"
                            onClick={() => setActiveTypeIndex(index)}
                            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors border ${
                              isActive
                                ? 'bg-theme-primary text-white border-theme-primary'
                                : 'bg-theme-bg-alt text-profile-muted border-theme'
                            }`}
                          >
                            {typeLabel}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {typeEntries[activeTypeIndex] &&
                    (() => {
                      const [entityType, counts] = typeEntries[activeTypeIndex]
                      const total = getTotal(counts)
                      const { path, navKey } = LIST_TYPE_TO_PATH[entityType] || { path: entityType, navKey: entityType }
                      let typeLabel: string
                      if (entityType === 'movie') {
                        typeLabel = t('profile.mediaTypeMovie')
                      } else if (entityType === 'anime') {
                        typeLabel = t('profile.mediaTypeAnime')
                      } else if (entityType === 'cartoonSeries') {
                        typeLabel = t('profile.mediaTypeCartoons')
                      } else if (entityType === 'books') {
                        typeLabel = t('profile.mediaTypeBooks')
                      } else {
                        typeLabel = t(`nav.${navKey}`)
                      }

                      return (
                        <motion.div
                          key={entityType}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className="b-stats_bar rounded-lg overflow-hidden bg-theme-surface p-2 sm:p-3 flex flex-col gap-2"
                        >
                          {isOwnProfile ? (
                            <Link
                              to={username ? `/user/${username}/lists?type=${path}` : '#'}
                              className="title font-medium text-profile link-underline-animate-neutral block text-sm"
                            >
                              {typeLabel}
                            </Link>
                          ) : (
                            <Link
                              to={`/user/${username}/lists?type=${path}`}
                              className="title font-medium text-profile link-underline-animate-neutral block text-sm"
                            >
                              {typeLabel}
                            </Link>
                          )}

                          <div className="bar flex h-7 rounded overflow-hidden bg-theme-surface">
                            {STATUS_KEYS.map((status) => {
                              const n = (counts as ListCountsByStatus)[status as keyof ListCountsByStatus] as
                                | number
                                | undefined
                              const num = typeof n === 'number' ? n : 0
                              const pct = total > 0 ? (num / total) * 100 : 0
                              if (pct <= 0) return null
                              return (
                                <div
                                  key={status}
                                  className={`${STATUS_BAR_BG[status] || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-semibold min-w-0 truncate`}
                                  style={{ width: `${pct}%` }}
                                  title={getListStatusLabel(t, entityType, status)}
                                >
                                  <AnimatedNumber value={num} />
                                </div>
                              )
                            })}
                          </div>

                          <div className="stat_names grid grid-cols-3 gap-x-1 gap-y-1 text-[0.75rem] sm:text-[0.875rem] leading-6 sm:leading-8 mt-2">
                            {STATUS_KEYS.map((status) => {
                              const n = (counts as ListCountsByStatus)[status as keyof ListCountsByStatus] as
                                | number
                                | undefined
                              const num = typeof n === 'number' ? n : 0
                              const label = getListStatusLabel(t, entityType, status)
                              return (
                                <div
                                  key={status}
                                  className="stat_name min-w-0 text-profile-muted text-[8px] sm:text-[10px] font-bold uppercase leading-tight sm:leading-6 truncate"
                                  title={label}
                                >
                                  {isOwnProfile ? (
                                    <Link
                                      to={username ? `/user/${username}/lists?type=${path}&status=${status}` : '#'}
                                      className="link-underline-animate-neutral block truncate"
                                    >
                                      {label}{' '}
                                      <span className="size">
                                        <AnimatedNumber value={num} />
                                      </span>
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/user/${username}/lists?type=${path}&status=${status}`}
                                      className="link-underline-animate-neutral block truncate"
                                    >
                                      {label}{' '}
                                      <span className="size">
                                        <AnimatedNumber value={num} />
                                      </span>
                                    </Link>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })()}
                </section>
              )}

              {/* Блок активности (на мобилке третий) */}
              {activity &&
                activity.length > 0 &&
                (() => {
                  const filteredActivity = activityMediaFilter
                    ? activity.filter((item) => item.mediaType === activityMediaFilter)
                    : activity
                  return (
                    <section className="scroll-mt-4 order-3 lg:order-none">
                      <div className="activity-feed-wrap rounded-xl bg-theme-bg-alt shadow-sm">
                        <div className="flex items-center justify-between px-3 sm:px-4 pt-3 pb-2 gap-2">
                          <Link
                            to="/activity?mode=me"
                            className="text-sm font-semibold text-profile link-underline-animate-neutral focus:outline-none focus-visible:underline"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <IconActivity className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
                              {t('profile.activityFeed')}
                            </span>
                          </Link>
                          <CustomSelect
                            value={activityMediaFilter}
                            onChange={setActivityMediaFilter}
                            placeholder={t('profile.activityFilterAll')}
                            ariaLabel={t('profile.activityFilterAll')}
                            className="w-[170px] shrink-0"
                            options={[
                              { value: '', label: t('profile.activityFilterAll') },
                              ...ACTIVITY_MEDIA_FILTER_OPTIONS.map(({ value, navKey }) => ({
                                value,
                                label: t(`nav.${navKey}`),
                              })),
                            ]}
                          />
                        </div>
                        <div className="activity-feed px-3 sm:px-4 py-2 text-xs sm:text-[13px]">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                            {filteredActivity.slice(0, activityVisibleCount).map((item) => {
                              const mediaTypePath = ACTIVITY_MEDIA_TYPE_TO_PATH[item.mediaType] ?? 'movie'
                              const mediaHref = getMediaPath(mediaTypePath, item.mediaId, item.mediaTitle)
                              const statusPhrase = (() => {
                                const extra = item.extra as
                                  | {
                                      status?: string
                                      toStatus?: string
                                      fromEpisode?: number
                                      toEpisode?: number
                                      totalEpisodes?: number
                                    }
                                  | undefined
                                if (item.type === 'list_add' && extra?.status)
                                  return getListStatusLabel(t, item.mediaType, extra.status)
                                if (
                                  item.type === 'list_update' &&
                                  extra?.fromEpisode != null &&
                                  extra?.toEpisode != null &&
                                  extra.fromEpisode !== extra.toEpisode
                                ) {
                                  const count = extra.toEpisode - extra.fromEpisode + 1
                                  const total = extra.totalEpisodes
                                  return total != null
                                    ? t('activity.episodesWatchedFromTo', {
                                        count,
                                        from: extra.fromEpisode,
                                        to: extra.toEpisode,
                                        total,
                                      })
                                    : t('activity.episodesWatchedFromToNoTotal', {
                                        count,
                                        from: extra.fromEpisode,
                                        to: extra.toEpisode,
                                      })
                                }
                                if (item.type === 'list_update' && extra?.toEpisode != null) {
                                  const total = extra.totalEpisodes
                                  return total != null
                                    ? t('activity.episodeWatchedOfTotal', { episode: extra.toEpisode, total })
                                    : t('activity.episodeWatched', { episode: extra.toEpisode })
                                }
                                if (item.type === 'list_update' && extra?.toStatus)
                                  return getListStatusLabel(t, item.mediaType, extra.toStatus)
                                if (item.type === 'favorite_add') return t('activity.typeFavoriteAdd')
                                if (item.type === 'review') return t('activity.typeReview')
                                if (item.type === 'collection_add') return t('activity.typeCollectionAdd')
                                return t('activity.myActivity')
                              })()
                              return (
                                <div
                                  key={item.id}
                                  className="activity-entry flex gap-2 sm:gap-2.5 p-2 min-w-0 rounded-lg bg-theme-surface"
                                >
                                  <Link
                                    to={mediaHref}
                                    className="activity-entry-cover w-10 h-14 sm:w-11 sm:h-16 flex-shrink-0 rounded overflow-hidden bg-theme-bg-alt"
                                    style={
                                      item.mediaPoster
                                        ? {
                                            backgroundImage: `url(${getMediaAssetUrl(item.mediaPoster)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                          }
                                        : undefined
                                    }
                                  >
                                    {!item.mediaPoster && (
                                      <span className="w-full h-full flex items-center justify-center text-profile-muted text-[10px]">
                                        —
                                      </span>
                                    )}
                                  </Link>
                                  <div className="activity-entry-details min-w-0 flex-1 flex flex-col">
                                    <div className="activity-entry-status text-profile-muted flex flex-col gap-0.5">
                                      <span>{statusPhrase}</span>
                                      <Link
                                        to={mediaHref}
                                        className="activity-entry-title text-profile link-underline-animate-neutral font-medium break-words line-clamp-2 self-start"
                                      >
                                        {item.mediaTitle}
                                      </Link>
                                    </div>
                                    <time
                                      className="text-[10px] sm:text-[11px] text-profile-muted mt-1 shrink-0"
                                      dateTime={item.createdAt}
                                      title={new Date(item.createdAt).toLocaleString()}
                                    >
                                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </time>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {filteredActivity.length > activityVisibleCount && (
                            <div className="flex justify-center pt-3 pb-1">
                              <button
                                type="button"
                                onClick={() => setActivityVisibleCount((prev) => prev + 10)}
                                className="text-[11px] sm:text-xs px-3 py-1.5 rounded-full border border-theme bg-theme-bg-alt hover:bg-theme-surface transition-colors text-profile-muted"
                              >
                                {t('profile.activityLoadMore')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )
                })()}
            </div>

            {/* Левая колонка на десктопе: календарь + ачивки. На мобилке — contents для порядка. */}
            <section className="contents lg:flex lg:flex-col lg:gap-6 lg:order-1">
              <div className="scroll-mt-4 order-2 lg:order-none flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-profile">{t('profile.activityHistory')}</h3>
                <div className="b-stats_bar rounded-xl p-3 sm:p-4 shadow-sm border border-theme bg-theme-surface bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)] flex flex-col gap-2">
                  <p className="text-xs text-profile-muted">{today.getFullYear()}</p>
                  <div
                    className="activity-history content-wrap"
                    style={{
                      display: 'grid',
                      gridAutoFlow: 'column dense',
                      gap: '8px 4px',
                      gridTemplateRows: 'repeat(7, 1fr)',
                      justifyItems: 'center',
                    }}
                  >
                    {activityDays.map(({ date, key, count }) => {
                      const lvl = levelForCount(count)

                      const bgVar =
                        lvl === 0
                          ? 'var(--activity-level-0, color-mix(in srgb, var(--theme-bg-alt) 65%, white 35%))'
                          : lvl === 1
                            ? 'var(--activity-level-1, color-mix(in srgb, var(--theme-primary) 30%, transparent))'
                            : lvl === 2
                              ? 'var(--activity-level-2, color-mix(in srgb, var(--theme-primary) 55%, transparent))'
                              : lvl === 3
                                ? 'var(--activity-level-3, color-mix(in srgb, var(--theme-primary) 80%, transparent))'
                                : 'var(--activity-level-4, var(--theme-primary))'

                      return (
                        <div
                          key={key}
                          className="history-day"
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: bgVar,
                          }}
                          title={
                            count > 0
                              ? `${count} ${t('activity.myActivity')}, ${date.toLocaleDateString()}`
                              : date.toLocaleDateString()
                          }
                        />
                      )
                    })}
                  </div>
                </div>
              </div>

              <section id="achievements" className="scroll-mt-4 order-4 lg:order-none flex flex-col gap-2">
                {username ? (
                  <Link
                    to={`/user/${username}/achievements`}
                    className="inline-block text-sm font-semibold text-profile link-underline-animate w-max"
                  >
                    {t('achievements.inProfile')}
                  </Link>
                ) : (
                  <h3 className="text-sm font-semibold text-profile">{t('achievements.inProfile')}</h3>
                )}
                {username && (
                  <div className="flex flex-col gap-3">
                    {achievementsList != null && achievementsList.length > 0 ? (
                      <>
                        {(() => {
                          const completed = achievementsList.filter((a) => (a.progress?.percent ?? 0) >= 100)
                          const closestFew = achievementsList
                            .filter((a) => (a.progress?.percent ?? 0) < 100)
                            .sort((a, b) => (b.progress?.percent ?? 0) - (a.progress?.percent ?? 0))
                            .slice(0, 4)
                          const getRarityLabel = (r?: string) => {
                            if (!r) return null
                            const key = `achievements.rarity${r.charAt(0).toUpperCase()}${r.slice(1)}` as
                              | 'achievements.rarityCommon'
                              | 'achievements.rarityUncommon'
                              | 'achievements.rarityRare'
                              | 'achievements.rarityEpic'
                              | 'achievements.rarityLegendary'
                            return t(key)
                          }
                          const getRarityBadgeClass = (r?: string) => {
                            switch (r) {
                              case 'legendary':
                                return 'bg-amber-100 text-amber-800 border-amber-300'
                              case 'epic':
                                return 'bg-purple-100 text-purple-800 border-purple-300'
                              case 'rare':
                                return 'bg-blue-100 text-blue-800 border-blue-300'
                              case 'uncommon':
                                return 'bg-green-100 text-green-800 border-green-300'
                              default:
                                return 'bg-gray-100 text-gray-700 border-gray-300'
                            }
                          }
                          const renderCompactCard = (a: AchievementWithProgress) => {
                            const progress = a.progress
                            const percent = progress?.percent ?? 0
                            const currentLevel = progress?.currentLevel
                            const displayImage = (currentLevel?.imageUrl ?? a.imageUrl) || null
                            return (
                              <Link
                                key={a.id}
                                to={`/user/${username}/achievements`}
                                className="block rounded-xl overflow-hidden bg-theme-surface hover:shadow-md transition-shadow min-w-0 border border-theme"
                              >
                                <div className="relative h-28 overflow-hidden">
                                  {displayImage ? (
                                    <img
                                      src={getMediaAssetUrl(displayImage)}
                                      alt=""
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200" />
                                  )}
                                  {a.rarity && getRarityLabel(a.rarity) && (
                                    <span
                                      className={`absolute top-1 right-1 text-[9px] font-medium px-1 py-0.5 rounded border ${getRarityBadgeClass(a.rarity)}`}
                                      title={getRarityLabel(a.rarity) ?? undefined}
                                    >
                                      {getRarityLabel(a.rarity)}
                                    </span>
                                  )}
                                </div>
                                <div className="p-2 text-center space-y-0.5">
                                  <p className="text-xs font-medium text-profile-muted">{percent.toFixed(0)}%</p>
                                  {progress?.usersReachedPercent != null && (
                                    <p
                                      className="text-[10px] text-profile-muted/80"
                                      title={t('achievements.usersReachedPercent', {
                                        percent: progress.usersReachedPercent.toFixed(1),
                                      })}
                                    >
                                      {t('achievements.usersReachedPercent', {
                                        percent: progress.usersReachedPercent.toFixed(0),
                                      })}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            )
                          }
                          return (
                            <>
                              {completed.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <p className="text-xs font-medium text-profile-muted">
                                    {t('achievements.sectionCompleted')} ·{' '}
                                    {t('achievements.completedShort', { completed: completed.length })}
                                  </p>
                                  <motion.div
                                    className="grid grid-cols-2 gap-2"
                                    variants={staggerContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                  >
                                    {completed.slice(0, 4).map((a) => (
                                      <motion.div key={a.id} variants={staggerItemVariants}>
                                        {renderCompactCard(a)}
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                </div>
                              )}
                              {closestFew.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <p className="text-xs font-medium text-profile-muted">
                                    {t('achievements.closestToCompletion')} (4)
                                  </p>
                                  <motion.div
                                    className="grid grid-cols-2 gap-2"
                                    variants={staggerContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                  >
                                    {closestFew.map((a) => (
                                      <motion.div key={a.id} variants={staggerItemVariants}>
                                        {renderCompactCard(a)}
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </>
                    ) : achievementsList != null ? (
                      <div className="p-2 sm:p-2.5 bg-theme-bg-alt rounded-lg flex items-center gap-1.5 sm:gap-2 min-w-0 inline-flex w-full sm:w-auto">
                        <IconAchievement className="w-8 h-8 shrink-0 text-profile-icon" />
                        <span className="text-sm text-profile-muted">{t('nav.achievements')}</span>
                      </div>
                    ) : (
                      <div className="p-2 sm:p-2.5 bg-theme-bg-alt rounded-lg flex items-center gap-1.5 sm:gap-2 min-w-0 inline-flex w-full sm:w-auto">
                        <IconAchievement className="w-8 h-8 shrink-0 text-profile-icon" />
                        <span className="text-sm text-profile-muted">{t('nav.achievements')}</span>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </section>
          </div>
        )}
      </motion.div>
    </>
  )
}
