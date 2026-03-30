import { adminApi } from '@/api/admin'
import AdminAchievements from '@/components/admin/AdminAchievements'
import AdminBlockedUsersList from '@/components/admin/AdminBlockedUsersList'
import AdminCastList from '@/components/admin/AdminCastList'
import AdminCharactersList from '@/components/admin/AdminCharactersList'
import AdminDevBlog from '@/components/admin/AdminDevBlog'
import AdminEntityList from '@/components/admin/AdminEntityList'
import AdminFranchises from '@/components/admin/AdminFranchises'
import AdminMediaList from '@/components/admin/AdminMediaList'
import AdminPersonsList from '@/components/admin/AdminPersonsList'
import AdminReportsList from '@/components/admin/AdminReportsList'
import AdminSitesList from '@/components/admin/AdminSitesList'
import AdminStaffList from '@/components/admin/AdminStaffList'
import {
  IconAchievement,
  IconAdminCast,
  IconAdminDevelopers,
  IconAdminFranchise,
  IconAdminStaff,
  IconBans,
  IconCharacter,
  IconDevblog,
  IconDeveloper,
  IconGenre,
  IconPersonOutline,
  IconPlatform,
  IconPublisher,
  IconReport,
  IconSecurity,
  IconStudio,
  IconTheme,
  IconTypeMovie,
} from '@/components/icons'
import { useAuthStore } from '@/store/authStore'
import { getEntityDescription, getEntityName } from '@/utils/localizedText'
import { Globe, RefreshCw, TrendingDown, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

type Tab =
  | 'tools'
  | 'genres'
  | 'themes'
  | 'studios'
  | 'platforms'
  | 'developers'
  | 'publishers'
  | 'sites'
  | 'media'
  | 'persons'
  | 'franchises'
  | 'characters'
  | 'cast'
  | 'staff'
  | 'achievements'
  | 'devblog'
  | 'reports'
  | 'blocked'

const TAB_KEYS: Tab[] = [
  'tools',
  'genres',
  'themes',
  'studios',
  'platforms',
  'developers',
  'publishers',
  'sites',
  'media',
  'persons',
  'franchises',
  'characters',
  'cast',
  'staff',
  'achievements',
  'devblog',
  'reports',
  'blocked',
]

export default function Admin() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner'
  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin' || user?.role === 'owner'
  const canWriteDevBlog = user?.role === 'developer' || user?.role === 'admin' || user?.role === 'owner'

  const defaultTab: Tab = isAdminOrOwner ? 'tools' : 'reports'
  const initialTab: Tab = tabParam && TAB_KEYS.includes(tabParam as Tab) ? (tabParam as Tab) : defaultTab
  const [tab, setTab] = useState<Tab>(initialTab)
  const [actionLoading, setActionLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!isModeratorOrAdmin) {
      navigate('/')
      return
    }
  }, [user, isModeratorOrAdmin, navigate])

  useEffect(() => {
    const t = searchParams.get('tab') as Tab | null
    if (t && TAB_KEYS.includes(t)) setTab(t)
  }, [searchParams])

  const handleRecalculate = () => {
    setActionLoading(true)
    adminApi.recalculatePopularity().finally(() => setActionLoading(false))
  }

  const handleDecay = () => {
    setActionLoading(true)
    adminApi.applyDecay().finally(() => setActionLoading(false))
  }

  const handleRecalculateAchievements = () => {
    setActionLoading(true)
    adminApi.recalculateAchievements().finally(() => setActionLoading(false))
  }

  const handleRecalculateSimilarUsers = () => {
    setActionLoading(true)
    adminApi.recalculateSimilarUsers().finally(() => setActionLoading(false))
  }

  const handleRecalculateSimilarContent = () => {
    setActionLoading(true)
    adminApi.recalculateSimilarContent().finally(() => setActionLoading(false))
  }

  if (!user || !isModeratorOrAdmin) return null

  const tabsAll: { key: Tab; label: string; icon?: React.ReactNode }[] = [
    { key: 'reports', label: t('admin.reports'), icon: <IconReport className="w-4 h-4" /> },
    { key: 'blocked', label: t('admin.commentBlockedUsers'), icon: <IconBans className="w-4 h-4" /> },
    { key: 'tools', label: t('admin.tools'), icon: <Wrench className="w-4 h-4" /> },
    { key: 'genres', label: t('admin.genres'), icon: <IconGenre className="w-4 h-4" /> },
    { key: 'themes', label: t('admin.themes'), icon: <IconTheme className="w-4 h-4" /> },
    { key: 'studios', label: t('admin.studios'), icon: <IconStudio className="w-4 h-4" /> },
    { key: 'platforms', label: t('admin.platforms'), icon: <IconPlatform className="w-4 h-4" /> },
    { key: 'developers', label: t('admin.developers'), icon: <IconAdminDevelopers className="w-4 h-4" /> },
    { key: 'publishers', label: t('admin.publishers'), icon: <IconPublisher className="w-4 h-4" /> },
    { key: 'sites', label: t('admin.sites'), icon: <Globe className="w-4 h-4" /> },
    { key: 'media', label: t('admin.media'), icon: <IconTypeMovie className="w-4 h-4" /> },
    { key: 'persons', label: t('admin.persons'), icon: <IconPersonOutline className="w-4 h-4" /> },
    { key: 'franchises', label: t('admin.franchises'), icon: <IconAdminFranchise className="w-4 h-4" /> },
    { key: 'characters', label: t('admin.characters'), icon: <IconCharacter className="w-4 h-4" /> },
    { key: 'cast', label: t('admin.castSectionTitle'), icon: <IconAdminCast className="w-4 h-4" /> },
    { key: 'staff', label: t('admin.staffSectionTitle'), icon: <IconAdminStaff className="w-4 h-4" /> },
    { key: 'achievements', label: t('admin.achievementsTab'), icon: <IconAchievement className="w-4 h-4" /> },
    { key: 'devblog', label: t('admin.devblogTab'), icon: <IconDevblog className="w-4 h-4" /> },
  ]
  const tabs = isAdminOrOwner
    ? tabsAll
    : tabsAll.filter((x) => x.key === 'reports' || x.key === 'blocked' || (x.key === 'devblog' && canWriteDevBlog))
  const effectiveTab = tabs.some((x) => x.key === tab) ? tab : (tabs[0]?.key ?? 'reports')

  return (
    <div className="space-y-6 admin-page">
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <IconSecurity className="w-8 h-8 text-lavender-500" />
        {t('admin.title')}
      </h1>

      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 admin-tabs">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key)
              setSearchParams(key === 'tools' ? {} : { tab: key })
            }}
            className={`admin-tab flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              effectiveTab === key
                ? 'bg-lavender-400 text-gray-900 admin-tab--active'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {effectiveTab === 'tools' && (
        <section className="admin-section p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.tools')}</h2>
          <p className="text-sm text-gray-600 mb-6">{t('admin.toolsHint')}</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRecalculate}
              disabled={actionLoading}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              {t('admin.popularity')} — {t('admin.recalculate')}
            </button>
            <button onClick={handleDecay} disabled={actionLoading} className="btn-secondary flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              {t('admin.decay')}
            </button>
            <button
              onClick={handleRecalculateAchievements}
              disabled={actionLoading}
              className="btn-secondary flex items-center gap-2"
            >
              <IconAchievement className="w-5 h-5" />
              {t('admin.recalculateAchievements')}
            </button>
            <button onClick={handleRecalculateSimilarUsers} disabled={actionLoading} className="btn-secondary flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('admin.similarUsers')} — {t('admin.recalculate')}
            </button>
            <button onClick={handleRecalculateSimilarContent} disabled={actionLoading} className="btn-secondary flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('admin.similarContent')} — {t('admin.recalculate')}
            </button>
          </div>
        </section>
      )}

      {effectiveTab === 'genres' && (
        <AdminEntityList
          entityKey="genres"
          titleKey="admin.genres"
          getLabel={(item) =>
            [
              (item as { emoji?: string }).emoji,
              getEntityName(item, locale),
              getEntityDescription(item as { description?: string; descriptionI18n?: Record<string, string> }, locale),
            ]
              .filter(Boolean)
              .join(' — ')
          }
          getCreatePayload={() => ({})}
          onRefresh={() => {}}
          loading={listLoading}
          setLoading={setListLoading}
        />
      )}
      {effectiveTab === 'themes' && (
        <AdminEntityList
          entityKey="themes"
          titleKey="admin.themes"
          getLabel={(item) =>
            [
              (item as { emoji?: string }).emoji,
              getEntityName(item, locale),
              getEntityDescription(item as { description?: string; descriptionI18n?: Record<string, string> }, locale),
            ]
              .filter(Boolean)
              .join(' — ')
          }
          getCreatePayload={() => ({})}
          onRefresh={() => {}}
          loading={listLoading}
          setLoading={setListLoading}
        />
      )}
      {effectiveTab === 'studios' && (
        <AdminEntityList
          entityKey="studios"
          titleKey="admin.studios"
          getLabel={(item) =>
            (item as { country?: string }).country
              ? `${getEntityName(item, locale)} (${(item as { country?: string }).country})`
              : getEntityName(item, locale)
          }
          getCreatePayload={() => ({})}
          onRefresh={() => {}}
          loading={listLoading}
          setLoading={setListLoading}
        />
      )}
      {effectiveTab === 'platforms' && (
        <AdminEntityList
          entityKey="platforms"
          titleKey="admin.platforms"
          getLabel={(item) => getEntityName(item, locale)}
          getCreatePayload={() => ({})}
          onRefresh={() => {}}
          loading={listLoading}
          setLoading={setListLoading}
        />
      )}
      {effectiveTab === 'developers' && (
        <AdminEntityList
          entityKey="developers"
          titleKey="admin.developers"
          getLabel={(item) =>
            (item as { country?: string }).country
              ? `${getEntityName(item, locale)} (${(item as { country?: string }).country})`
              : getEntityName(item, locale)
          }
          getCreatePayload={() => ({})}
          onRefresh={() => {}}
          loading={listLoading}
          setLoading={setListLoading}
        />
      )}
      {effectiveTab === 'publishers' && (
        <AdminEntityList
          entityKey="publishers"
          titleKey="admin.publishers"
          getLabel={(item) => {
            const publisher = item as { country?: string; publicationTypes?: string[] }
            const parts = [
              getEntityName(item, locale),
              publisher.country ? `(${publisher.country})` : '',
              publisher.publicationTypes?.length
                ? `• ${publisher.publicationTypes
                    .map((type) => {
                      if (type === 'game') return t('nav.games')
                      if (type === 'manga') return t('nav.manga')
                      if (type === 'book') return t('nav.books')
                      if (type === 'light-novel') return t('nav.lightNovels')
                      return type
                    })
                    .join(', ')}`
                : '',
            ].filter(Boolean)
            return parts.join(' ')
          }}
          getCreatePayload={() => ({})}
          onRefresh={() => {}}
          loading={listLoading}
          setLoading={setListLoading}
        />
      )}
      {effectiveTab === 'sites' && <AdminSitesList />}
      {effectiveTab === 'media' && <AdminMediaList />}
      {effectiveTab === 'persons' && <AdminPersonsList />}
      {effectiveTab === 'franchises' && <AdminFranchises />}
      {effectiveTab === 'characters' && <AdminCharactersList />}
      {effectiveTab === 'cast' && <AdminCastList />}
      {effectiveTab === 'staff' && <AdminStaffList />}
      {effectiveTab === 'achievements' && <AdminAchievements />}
      {effectiveTab === 'devblog' && <AdminDevBlog />}
      {effectiveTab === 'reports' && <AdminReportsList />}
      {effectiveTab === 'blocked' && <AdminBlockedUsersList />}
    </div>
  )
}
