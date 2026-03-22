import { useEffect, useState, Fragment } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { IconAchievement } from '@/components/icons'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { usersApi } from '@/api/users'
import { getLocalizedString } from '@/utils/localizedText'
import type { AchievementWithProgress } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { useAuthStore } from '@/store/authStore'

export default function UserAchievementsPage() {
  const { username } = useParams<{ username: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { user: currentUser } = useAuthStore()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const isOwnProfile = Boolean(
    username && currentUser?.username && username.toLowerCase() === currentUser.username.toLowerCase()
  )
  const [list, setList] = useState<AchievementWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    setLoading(true)
    setForbidden(false)
    usersApi
      .getAchievementsByUsername(username)
      .then((res) => setList(res.achievements ?? []))
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true)
        else setList([])
      })
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-theme-bg-alt rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-theme-bg-alt rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!username) {
    return null
  }

  const completed = list.filter((a) => (a.progress?.percent ?? 0) >= 100)
  const inProgress = list.filter((a) => (a.progress?.percent ?? 0) < 100)

  const sortByPercent = (arr: AchievementWithProgress[]) =>
    [...arr].sort((a, b) => {
      const pa = a.progress?.percent ?? 0
      const pb = b.progress?.percent ?? 0
      if (Math.abs(pa - pb) < 0.01) return 0
      return pb > pa ? 1 : -1
    })

  const completedSorted = sortByPercent(completed)
  const inProgressSorted = sortByPercent(inProgress)

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
        return 'bg-theme-bg-alt text-theme border-theme'
    }
  }

  const renderCard = (a: AchievementWithProgress) => {
    const progress = a.progress
    const total = progress?.total ?? 0
    const completedCount = progress?.completed ?? 0
    const percent = progress?.percent ?? 0
    const currentLevel = progress?.currentLevel
    const displayTitle = currentLevel
      ? getLocalizedString(currentLevel.titleI18n, currentLevel.title, locale) ||
        getLocalizedString(a.titleI18n, a.title, locale)
      : getLocalizedString(a.titleI18n, a.title, locale)
    const displayImage = currentLevel?.imageUrl ?? a.imageUrl

    return (
      <motion.li
        variants={staggerItemVariants}
        className="rounded-xl border border-theme bg-theme-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="relative h-28 overflow-hidden">
          {displayImage ? (
            <img src={getMediaAssetUrl(displayImage)} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-theme-bg-alt" />
          )}
          {a.rarity && getRarityLabel(a.rarity) && (
            <span
              className={`absolute top-1.5 right-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded border backdrop-blur-sm ${getRarityBadgeClass(a.rarity)}`}
              title={getRarityLabel(a.rarity) ?? undefined}
            >
              {getRarityLabel(a.rarity)}
            </span>
          )}
          {progress?.usersReachedPercent != null && (
            <span
              className="absolute top-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded border bg-black/40 text-white border-white/30 backdrop-blur-sm"
              title={t('achievements.usersReachedPercent', { percent: progress.usersReachedPercent.toFixed(1) })}
            >
              {t('achievements.usersReachedPercent', { percent: progress.usersReachedPercent.toFixed(0) })}
            </span>
          )}
          <h2 className="absolute bottom-0 left-0 right-0 px-3 py-2 font-semibold text-white drop-shadow-lg line-clamp-2 text-sm sm:text-base bg-black/30 backdrop-blur-sm">
            {displayTitle}
          </h2>
        </div>
        <div className="p-3">
          {a.genre && (
            <p className="text-xs text-theme-muted">
              {t('achievements.byGenre')}: {getLocalizedString(a.genre.nameI18n, a.genre.name, locale)}
            </p>
          )}
          {a.franchise && (
            <p className="text-xs text-theme-muted mt-0.5">
              {t('achievements.byFranchise')}: {getLocalizedString(a.franchise.nameI18n, a.franchise.name, locale)}
            </p>
          )}
          {progress != null && total > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-baseline gap-2 text-xs text-theme-muted mb-0.5">
                {percent >= 100 ? (
                  <span className="text-theme font-medium">
                    <AnimatedNumber value={completedCount} /> {t('achievements.of')} <AnimatedNumber value={total} />{' '}
                    {t('achievements.titlesShort')}
                  </span>
                ) : (
                  <span className="text-theme">
                    <AnimatedNumber value={completedCount} /> {t('achievements.of')} <AnimatedNumber value={total} />{' '}
                    {t('achievements.titlesShort')}
                  </span>
                )}
                <span className="text-theme-muted shrink-0 tabular-nums">
                  <AnimatedNumber value={Math.round(percent)} />%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-theme-bg-alt overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-theme-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, percent)}%` }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
              {a.levels?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {a.levels
                    .slice()
                    .sort((x, y) => x.levelOrder - y.levelOrder)
                    .map((l) => (
                      <span
                        key={l.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          (progress?.currentOrder ?? 0) >= l.levelOrder
                            ? 'bg-theme-surface text-theme border border-theme'
                            : 'bg-theme-bg-alt text-theme-muted'
                        }`}
                        title={getLocalizedString(l.titleI18n, l.title, locale)}
                      >
                        {l.thresholdPercent}%
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.li>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 mt-6">
        {forbidden ? (
          <p className="text-theme-muted">{t('achievements.profileHidden')}</p>
        ) : list.length === 0 ? (
          <p className="text-theme-muted">{t('achievements.empty')}</p>
        ) : (
          <div className="space-y-10">
            {completedSorted.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-theme mb-3 flex items-center gap-2">
                  <IconAchievement className="w-5 h-5 text-[var(--theme-primary)]" />
                  {t('achievements.sectionCompleted')}
                </h2>
                <motion.ul
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {completedSorted.map((a) => (
                    <Fragment key={a.id}>{renderCard(a)}</Fragment>
                  ))}
                </motion.ul>
              </section>
            )}
            {inProgressSorted.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-theme mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[var(--theme-primary)]" />
                  {t('achievements.sectionInProgress')}
                </h2>
                <motion.ul
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {inProgressSorted.map((a) => (
                    <Fragment key={a.id}>{renderCard(a)}</Fragment>
                  ))}
                </motion.ul>
              </section>
            )}
          </div>
        )}
      </div>
  )
}
