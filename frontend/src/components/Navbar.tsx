import { Link, useLocation } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Moon, Snowflake, Flower2, Palette } from 'lucide-react'
import {
  IconFavoriteAdd,
  IconSearch,
  IconPerson,
  IconLogout,
  IconListUnordered,
  IconBookmark,
  IconTypeMovie,
  IconTypeSerial,
  IconTypeAnime,
  IconTypeGame,
  IconTypeManga,
  IconTypeBook,
  IconTypeRanobe,
  IconTypeCartoon,
  IconAchievement,
  IconNewspaper,
  IconPeopleCommunity,
  IconCalendar,
  IconDevblog,
  IconGroup,
  IconHandshake,
  IconCollection,
  IconDiscover,
  IconSecurity,
  IconTheme,
  IconMoreLinesHorizontal,
  IconArrowDown,
  IconCross,
  IconNotificationOn,
  IconComment,
} from '@/components/icons'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore, type ThemeId } from '@/store/themeStore'
import { useState, useEffect } from 'react'
import SearchModal from '@/components/SearchModal'
import SemanticSearchModal from '@/components/SemanticSearchModal'
import { notificationsApi, type NotificationItem } from '@/api/notifications'
import { getMediaPathFromApiType, getMediaAssetUrl } from '@/utils/mediaPaths'

function getNotificationLink(n: NotificationItem): string | null {
  const extra = n.extra ?? {}
  if (n.relatedType === 'user' && typeof extra.username === 'string') {
    return `/user/${extra.username}`
  }
  const mediaType = (extra.mediaType ?? n.relatedType) as string
  const mediaId = Number(extra.mediaId ?? n.relatedId)
  if (
    mediaType &&
    mediaId &&
    [
      'movie',
      'anime',
      'game',
      'tvSeries',
      'manga',
      'book',
      'lightNovel',
      'cartoonSeries',
      'cartoonMovie',
      'animeMovie',
    ].includes(mediaType)
  ) {
    return getMediaPathFromApiType(mediaType, mediaId)
  }
  if (
    n.relatedType === 'movie' ||
    n.relatedType === 'anime' ||
    n.relatedType === 'game' ||
    n.relatedType === 'tv_series' ||
    n.relatedType === 'manga' ||
    n.relatedType === 'book' ||
    n.relatedType === 'light_novel'
  ) {
    return getMediaPathFromApiType(n.relatedType, Number(n.relatedId))
  }
  if (n.relatedType === 'news' && n.relatedId) {
    return `/news/${n.relatedId}`
  }
  return null
}

/** Контент одного уведомления в дропдауне. Оборачивается в Link снаружи; подчёркивание только у __highlight */
function NotificationDropdownContent({ n }: { n: NotificationItem }) {
  const { t } = useTranslation()
  const extra = n.extra ?? {}
  const username = typeof extra.username === 'string' ? extra.username : ''
  const mediaTitle = typeof extra.mediaTitle === 'string' ? extra.mediaTitle : n.title || ''
  const reason = typeof extra.reason === 'string' ? extra.reason : ''
  const highlightClass = 'dropdown-notif-link__highlight'

  if (n.type === 'friend_accepted' && username) {
    return (
      <span className="block text-sm">
        <Trans
          i18nKey="notifications.types.friend_accepted.title"
          values={{ username }}
          components={[<span key="u" className={highlightClass} />]}
        />
        <span className="block text-xs mt-0.5 opacity-80">{t('notifications.types.friend_accepted.body')}</span>
      </span>
    )
  }

  if (n.type === 'new_follower' && username) {
    return (
      <span className="block text-sm">
        <Trans
          i18nKey="notifications.types.new_follower.title"
          values={{ username }}
          components={[<span key="u" className={highlightClass} />]}
        />
      </span>
    )
  }

  if (n.type === 'media_update') {
    if (reason === 'status_change') {
      const statusRaw = typeof extra.status === 'string' ? extra.status : (n.body ?? '')
      const statusLabel = statusRaw ? t(`mediaStatus.${statusRaw}`, statusRaw) : ''
      return (
        <span className="block text-sm">
          <Trans
            i18nKey="notifications.types.media_update.statusTitle"
            values={{ title: mediaTitle }}
            components={[<span key="m" className={highlightClass} />]}
          />
          <span className="block text-xs mt-0.5 opacity-80">
            {t('notifications.types.media_update.statusBody', { status: statusLabel })}
          </span>
        </span>
      )
    }
    if (reason === 'release_date') {
      const date = typeof extra.date === 'string' ? extra.date : (n.body ?? '')
      return (
        <span className="block text-sm">
          <Trans
            i18nKey="notifications.types.media_update.releaseTitle"
            values={{ title: mediaTitle }}
            components={[<span key="m" className={highlightClass} />]}
          />
          <span className="block text-xs mt-0.5 opacity-80">
            {t('notifications.types.media_update.releaseBody', { date })}
          </span>
        </span>
      )
    }
  }

  if (n.type === 'comment_reply') {
    const preview = typeof extra.preview === 'string' ? extra.preview : (n.body ?? '')
    return (
      <span className="block text-sm">
        <span className="block">{t('notifications.types.comment_reply.title')}</span>
        {preview && <span className={`${highlightClass} block text-xs mt-0.5 opacity-80 truncate`}>{preview}</span>}
      </span>
    )
  }

  return (
    <span className="block text-sm">
      {n.title}
      {n.body && <span className="block text-xs mt-0.5 opacity-80">{n.body}</span>}
    </span>
  )
}

function getContentTypeIcon(key: string) {
  switch (key) {
    case 'movies':
      return IconTypeMovie
    case 'cartoon-movies':
    case 'cartoon-series':
      return IconTypeCartoon
    case 'anime':
    case 'anime-movies':
      return IconTypeAnime
    case 'tv-series':
      return IconTypeSerial
    case 'games':
      return IconTypeGame
    case 'manga':
      return IconTypeManga
    case 'books':
      return IconTypeBook
    case 'light-novels':
      return IconTypeRanobe
    case 'users':
      return IconGroup
    case 'communities':
    case 'community-feed':
      return IconPeopleCommunity
    case 'calendar':
      return IconCalendar
    case 'devblog':
      return IconDevblog
    case 'news':
      return IconNewspaper
    default:
      return IconTypeMovie
  }
}

/** Разделы навигации по контенту: Кино, Мультипликация, Анимация, Книжное, Игры, Сообщество */
const NAV_CONTENT_SECTIONS: { sectionKey: string; items: { key: string; labelKey: string }[] }[] = [
  {
    sectionKey: 'nav.sectionCinema',
    items: [
      { key: 'movies', labelKey: 'nav.movies' },
      { key: 'tv-series', labelKey: 'nav.tvSeries' },
    ],
  },
  {
    sectionKey: 'nav.sectionAnimation',
    items: [
      { key: 'cartoon-series', labelKey: 'nav.cartoonSeries' },
      { key: 'cartoon-movies', labelKey: 'nav.cartoonMovies' },
    ],
  },
  {
    sectionKey: 'nav.sectionAnime',
    items: [
      { key: 'anime', labelKey: 'nav.anime' },
      { key: 'anime-movies', labelKey: 'nav.animeMovies' },
    ],
  },
  {
    sectionKey: 'nav.sectionBook',
    items: [
      { key: 'books', labelKey: 'nav.books' },
      { key: 'manga', labelKey: 'nav.manga' },
      { key: 'light-novels', labelKey: 'nav.lightNovels' },
    ],
  },
  { sectionKey: 'nav.sectionGames', items: [{ key: 'games', labelKey: 'nav.games' }] },
  {
    sectionKey: 'nav.sectionCommunity',
    items: [
      { key: 'users', labelKey: 'nav.users' },
      { key: 'communities', labelKey: 'nav.communities' },
      { key: 'community-feed', labelKey: 'nav.communityFeed' },
      { key: 'calendar', labelKey: 'nav.calendar' },
      { key: 'devblog', labelKey: 'nav.devblog' },
      { key: 'news', labelKey: 'nav.news' },
    ],
  },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()
  const { themeId, setTheme } = useThemeStore()
  const location = useLocation()
  const [, setLangOpen] = useState(false)
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false)
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuExiting, setMobileMenuExiting] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [semanticSearchModalOpen, setSemanticSearchModalOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifPanelKey, setNotifPanelKey] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const unreadCount = notifications.filter((n) => !n.readAt).length

  useEffect(() => {
    if (user && (notificationsOpen || mobileMenuOpen)) {
      notificationsApi
        .getList({ limit: 15 })
        .then(setNotifications)
        .catch(() => setNotifications([]))
    }
  }, [user, notificationsOpen, mobileMenuOpen])

  /** Закрывать все дропдауны при смене маршрута (напр. клик по Админке) */
  useEffect(() => {
    setContentDropdownOpen(false)
    setThemeDropdownOpen(false)
    setUserDropdownOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname])

  /** Пока открыто мобильное меню (и пока идёт exit-анимация) — не скроллить страницу под ним */
  const mobileMenuScrollLocked = mobileMenuOpen || mobileMenuExiting
  useEffect(() => {
    if (!mobileMenuScrollLocked) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [mobileMenuScrollLocked])

  const isContentTypeActive = (key: string) =>
    location.pathname === `/${key}` || location.pathname.startsWith(`/${key}/`)
  const contentLinkTo = (key: string) => `/${key}`
  const allContentItems = NAV_CONTENT_SECTIONS.flatMap((s) => s.items)
  const activeContentItem = allContentItems.find((item) => isContentTypeActive(item.key))
  const contentDropdownLabel = activeContentItem ? t(activeContentItem.labelKey) : t('nav.contentType')

  const THEME_IDS: ThemeId[] = ['standard', 'vivid-nightfall', 'frozen-lake', 'serene-lavender', 'soft-pastels']
  const getThemeLabelKey = (id: ThemeId) =>
    t(
      `theme.${id === 'vivid-nightfall' ? 'vividNightfall' : id === 'frozen-lake' ? 'frozenLake' : id === 'serene-lavender' ? 'sereneLavender' : id === 'soft-pastels' ? 'softPastels' : 'standard'}`
    )
  const getThemeIcon = (id: ThemeId) => {
    switch (id) {
      case 'standard':
        return Sun
      case 'vivid-nightfall':
        return Moon
      case 'frozen-lake':
        return Snowflake
      case 'serene-lavender':
        return Flower2
      case 'soft-pastels':
        return Palette
      default:
        return Sun
    }
  }
  const isAdmin = user?.role === 'admin' || user?.role === 'content_creator' || user?.role === 'owner'

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setMobileMenuExiting(true)
  }

  return (
    <>
      <nav className="nav-theme sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 min-w-0">
            <div className="flex items-center gap-2 lg:gap-6 min-w-0 flex-1">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg sm:text-xl font-bold nav-text shrink-0 hover:opacity-90"
              >
                <IconTypeMovie className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden xs:inline">Movie Matcher</span>
              </Link>

              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setContentDropdownOpen((v) => !v)
                      setThemeDropdownOpen(false)
                      setLangOpen(false)
                      setUserDropdownOpen(false)
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm nav-text nav-hover-bg transition-colors min-w-0 max-w-[140px] lg:max-w-[180px]"
                    aria-expanded={contentDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="truncate block min-w-0">{contentDropdownLabel}</span>
                    <IconArrowDown
                      className={`w-4 h-4 shrink-0 transition-transform ${contentDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {contentDropdownOpen && (
                      <>
                        <motion.div
                          className="fixed inset-0 z-40"
                          onClick={() => setContentDropdownOpen(false)}
                          aria-hidden
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        />
                        <motion.div
                          className="absolute left-0 top-full mt-1 py-1.5 nav-dropdown rounded-lg shadow-xl z-50 min-w-[200px]"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                        >
                          {NAV_CONTENT_SECTIONS.map(({ sectionKey, items }) => (
                            <div key={sectionKey} className="mt-1.5 first:mt-0 px-2 py-1 rounded-md nav-dropdown">
                              <div className="pl-1 pr-2 py-0.5 text-xs font-semibold nav-text uppercase tracking-wider">
                                {t(sectionKey)}
                              </div>
                              {items.map(({ key, labelKey }) => (
                                <Link
                                  key={key}
                                  to={contentLinkTo(key)}
                                  onClick={() => setContentDropdownOpen(false)}
                                  className={`block pl-4 pr-3 py-1.5 -mx-2 text-sm transition-colors ${
                                    isContentTypeActive(key) ? 'nav-active' : 'nav-text nav-hover-bg nav-dropdown-item'
                                  }`}
                                >
                                  {t(labelKey)}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
              <div className="flex items-center gap-0.5 rounded-lg nav-dropdown p-0.5">
                <motion.button
                  type="button"
                  onClick={() => i18n.changeLanguage('en')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${i18n.language === 'en' ? 'nav-lang-active' : 'nav-text nav-hover-bg'}`}
                  whileTap={{ scale: 0.9 }}
                >
                  EN
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => i18n.changeLanguage('ru')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${i18n.language === 'ru' ? 'nav-lang-active' : 'nav-text nav-hover-bg'}`}
                  whileTap={{ scale: 0.9 }}
                >
                  RU
                </motion.button>
              </div>
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={() => {
                    setThemeDropdownOpen((v) => !v)
                    setContentDropdownOpen(false)
                    setUserDropdownOpen(false)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm nav-text nav-hover-bg transition-colors"
                  aria-expanded={themeDropdownOpen}
                  aria-haspopup="true"
                  aria-label={getThemeLabelKey(themeId)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -1 }}
                >
                  <IconTheme className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline text-xs">{getThemeLabelKey(themeId)}</span>
                  <IconArrowDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </motion.button>
                <AnimatePresence>
                  {themeDropdownOpen && (
                    <>
                      <motion.div
                        className="fixed inset-0 z-40"
                        onClick={() => setThemeDropdownOpen(false)}
                        aria-hidden
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      />
                      <motion.div
                        className="absolute right-0 top-full mt-1.5 py-2 nav-dropdown nav-dropdown--themes rounded-lg shadow-xl z-50 min-w-[180px] max-h-[60vh] overflow-y-auto"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                      >
                        {THEME_IDS.map((id) => {
                          const ThemeIcon = getThemeIcon(id)
                          return (
                            <motion.button
                              key={id}
                              type="button"
                              onClick={() => {
                                setTheme(id)
                                setThemeDropdownOpen(false)
                              }}
                              className={`flex items-center justify-center md:justify-start gap-2 w-full text-left px-4 py-2 text-sm transition-colors nav-dropdown-item ${themeId === id ? 'nav-active' : 'nav-text'}`}
                              title={getThemeLabelKey(id)}
                              aria-label={getThemeLabelKey(id)}
                              whileTap={{ scale: 0.97 }}
                            >
                              <ThemeIcon className="w-5 h-5 shrink-0" />
                              <span className="theme-option-label hidden lg:inline">{getThemeLabelKey(id)}</span>
                            </motion.button>
                          )
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 p-2 md:px-3 md:py-2 rounded-lg text-sm font-medium transition-colors shadow-sm nav-search-btn"
                aria-label={t('nav.search')}
              >
                <IconSearch className="w-5 h-5 shrink-0 nav-search-btn-icon" />
                <span className="hidden lg:inline">{t('nav.search')}</span>
              </button>
              <button
                type="button"
                onClick={() => setSemanticSearchModalOpen(true)}
                className="flex items-center gap-2 p-2 md:px-3 md:py-2 rounded-lg text-sm font-medium nav-text nav-semantic-btn transition-colors"
                aria-label={t('nav.semanticSearch')}
                title={t('nav.semanticSearch')}
              >
                <IconDiscover className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline">{t('nav.semanticSearch')}</span>
              </button>

              {user && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notificationsOpen
                      setNotificationsOpen(next)
                      if (next) setNotifPanelKey((k) => k + 1)
                      setUserDropdownOpen(false)
                      setContentDropdownOpen(false)
                    }}
                    className="relative flex items-center justify-center w-10 h-10 rounded-lg nav-text nav-hover-bg transition-colors"
                    aria-label={t('nav.notifications')}
                  >
                    <IconNotificationOn className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full nav-badge text-xs font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notificationsOpen && (
                      <>
                        <motion.div
                          className="fixed inset-0 z-40"
                          onClick={() => setNotificationsOpen(false)}
                          aria-hidden
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                        <motion.div
                          key={notifPanelKey}
                          className="fixed left-0 right-0 top-14 w-full max-h-[70vh] overflow-y-auto py-2 nav-dropdown shadow-xl z-50 md:absolute md:left-auto md:right-0 md:top-full md:mt-1 md:w-[320px] md:rounded-lg"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                          <div
                            className="px-3 py-2 flex items-center justify-between border-b nav-dropdown"
                            style={{ borderColor: 'var(--theme-nav-border)' }}
                          >
                            <span className="font-semibold nav-text">{t('nav.notifications')}</span>
                            <Link
                              to="/notifications"
                              onClick={() => setNotificationsOpen(false)}
                              className="text-sm link-underline-animate-nav"
                            >
                              {t('nav.allNotifications')}
                            </Link>
                          </div>
                          {notifications.length === 0 ? (
                            <p className="px-3 py-4 text-sm nav-text opacity-80">{t('notifications.empty')}</p>
                          ) : (
                            <motion.ul
                              className="divide-y divide-space_indigo-500/30"
                              initial="hidden"
                              animate="visible"
                              variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
                              }}
                            >
                              {notifications.map((n) => {
                                const href = getNotificationLink(n) || '/notifications'
                                return (
                                  <motion.li
                                    key={n.id}
                                    variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0 } }}
                                    transition={{ duration: 0.15 }}
                                    className={`text-sm transition-colors nav-dropdown-item ${n.readAt ? 'opacity-80' : ''} nav-text`}
                                  >
                                    <Link
                                      to={href}
                                      onClick={() => setNotificationsOpen(false)}
                                      className="dropdown-notif-link px-3 py-2 block"
                                    >
                                      <NotificationDropdownContent n={n} />
                                    </Link>
                                  </motion.li>
                                )
                              })}
                            </motion.ul>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="hidden md:flex md:items-center md:gap-2 md:relative">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen((v) => !v)
                        setThemeDropdownOpen(false)
                        setContentDropdownOpen(false)
                        setLangOpen(false)
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm nav-text nav-hover-bg transition-colors min-w-0"
                      aria-expanded={userDropdownOpen}
                      aria-haspopup="true"
                    >
                      <div
                        className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: 'var(--theme-nav-hover-bg)' }}
                      >
                        {user.avatar ? (
                          <img src={getMediaAssetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <IconPerson className="w-4 h-4 nav-text" />
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[120px]">
                        {user.username ?? user.name ?? t('nav.account')}
                      </span>
                      <IconArrowDown
                        className={`w-4 h-4 shrink-0 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {userDropdownOpen && (
                        <>
                          <motion.div
                            className="fixed inset-0 z-40"
                            onClick={() => setUserDropdownOpen(false)}
                            aria-hidden
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          />
                          <motion.div
                            className="absolute right-0 top-full mt-1.5 py-2 nav-dropdown rounded-lg shadow-xl z-50 min-w-[200px]"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Link
                              to={user?.username ? `/user/${user.username}` : '#'}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === `/user/${user?.username}` ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.profile')}
                            </Link>
                            <Link
                              to="/recommendations"
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === '/recommendations' ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.recommendations')}
                            </Link>
                            <Link
                              to={user?.username ? `/user/${user.username}/favorites` : '#'}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/favorites` : '') ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.favorites')}
                            </Link>
                            <Link
                              to="/bookmarks"
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === '/bookmarks' ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.bookmarks')}
                            </Link>
                            <Link
                              to={user?.username ? `/user/${user.username}/friends` : '#'}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/friends` : '') ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.friends')}
                            </Link>
                            <Link
                              to="/messages"
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === '/messages' ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.messages')}
                            </Link>
                            <Link
                              to="/public-collections"
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname.startsWith('/public-collections') ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.publicCollections')}
                            </Link>
                            <Link
                              to={user?.username ? `/user/${user.username}/collections` : '#'}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/collections` : '') ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.collections')}
                            </Link>
                            <Link
                              to={user?.username ? `/user/${user.username}/lists` : '#'}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/lists` : '') ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.myLists')}
                            </Link>
                            <Link
                              to="/activity?mode=me"
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname.startsWith('/activity') ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.activity')}
                            </Link>
                            <Link
                              to={user?.username ? `/user/${user.username}/achievements` : '#'}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/achievements` : '') ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                            >
                              {t('nav.achievements')}
                            </Link>
                            {isAdmin && (
                              <Link
                                to="/admin"
                                onClick={() => setUserDropdownOpen(false)}
                                className={`block px-4 py-2 text-sm transition-colors ${location.pathname === '/admin' ? 'nav-active' : 'nav-text nav-dropdown-item'}`}
                              >
                                {t('nav.admin')}
                              </Link>
                            )}
                            <div className="my-2 border-t border-space_indigo-500/50" />
                            <button
                              type="button"
                              onClick={() => {
                                setUserDropdownOpen(false)
                                logout()
                              }}
                              className="block w-full text-left px-4 py-2 text-sm nav-text nav-dropdown-item"
                            >
                              {t('nav.logout')}
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-colors shadow-sm nav-search-btn"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg text-sm font-medium nav-text nav-semantic-btn transition-colors"
                    >
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Мобильное меню: кнопка в правом нижнем углу; панель с анимацией */}
      <AnimatePresence>
        {!mobileMenuOpen && !mobileMenuExiting && (
          <motion.div
            key="mobile-menu-fab"
            className="fixed bottom-6 right-6 z-50 md:hidden"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="nav-mobile-fab w-16 h-16 rounded-xl shadow-lg flex items-center justify-center transition-colors border"
              aria-label={t('nav.contentType')}
            >
              <IconMoreLinesHorizontal className="w-7 h-7" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence onExitComplete={() => setMobileMenuExiting(false)}>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="mobile-menu-overlay"
              className="fixed inset-0 z-40 md:hidden bg-black/60"
              onClick={closeMobileMenu}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              key="mobile-menu-panel"
              className="nav-mobile-panel fixed bottom-6 right-6 z-50 md:hidden w-[276px] max-w-[calc(100vw-3rem)] max-h-[calc(100dvh-5rem)] rounded-xl shadow-2xl overflow-hidden flex flex-col"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ transformOrigin: 'calc(100% - 2rem) calc(100% - 2rem)' }}
            >
              <div className="nav-mobile-panel-header sticky top-0 z-10 flex shrink-0 justify-end p-1.5 pb-0">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="nav-mobile-item p-1 rounded-md transition-colors"
                  aria-label={t('common.close')}
                >
                  <IconCross className="w-5 h-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-2 pb-2 pt-0">
                {/* Блок 1: Весь контент в одной сетке (каталог + пользователи, календарь, девблог, новости) */}
                <div className="mb-2.5">
                  <div className="nav-mobile-label text-[10px] font-semibold uppercase tracking-wide mb-1 px-1">
                    {t('nav.contentType')}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {NAV_CONTENT_SECTIONS.flatMap(({ items }) => items).map(({ key, labelKey }) => {
                      const ContentIcon = getContentTypeIcon(key)
                      return (
                        <Link
                          key={key}
                          to={contentLinkTo(key)}
                          onClick={closeMobileMenu}
                          className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${
                            isContentTypeActive(key) ? 'nav-mobile-item--active' : ''
                          }`}
                        >
                          <ContentIcon className="w-4 h-4 shrink-0" />
                          <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">
                            {t(labelKey)}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
                {/* Блок 2: Аккаунт — подзаголовки по группам */}
                <div>
                  <div className="nav-mobile-label text-[10px] font-semibold uppercase tracking-wide mb-1 px-1">
                    {t('nav.account')}
                  </div>
                  {user ? (
                    <>
                      <div className="mb-2">
                        <div className="nav-mobile-label text-[8px] font-semibold uppercase tracking-wide mb-1 px-1 opacity-80">
                          {t('nav.sectionProfile')}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <Link
                            to={user?.username ? `/user/${user.username}` : '#'}
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname.startsWith('/user/') && location.pathname === `/user/${user?.username}` ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconPerson className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.profile')}</span>
                          </Link>
                          <Link
                            to="/recommendations"
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === '/recommendations' ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconDiscover className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.recommendations')}</span>
                          </Link>
                          <Link
                            to={user?.username ? `/user/${user.username}/favorites` : '#'}
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/favorites` : '') ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconFavoriteAdd size={16} className="shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.favorites')}</span>
                          </Link>
                          <Link
                            to="/bookmarks"
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === '/bookmarks' ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconBookmark className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.bookmarks')}</span>
                          </Link>
                          <Link
                            to={user?.username ? `/user/${user.username}/friends` : '#'}
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/friends` : '') ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconHandshake className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.friends')}</span>
                          </Link>
                          <Link
                            to="/messages"
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === '/messages' ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconComment className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.messages')}</span>
                          </Link>
                          <Link
                            to="/users"
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === '/users' ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconGroup className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.users')}</span>
                          </Link>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="nav-mobile-label text-[8px] font-semibold uppercase tracking-wide mb-1 px-1 opacity-80">
                          {t('nav.sectionCollections')}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <Link
                            to="/public-collections"
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname.startsWith('/public-collections') ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconCollection className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.publicCollections')}</span>
                          </Link>
                          <Link
                            to={user?.username ? `/user/${user.username}/collections` : '#'}
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/collections` : '') ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconCollection className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.collections')}</span>
                          </Link>
                          <Link
                            to={user?.username ? `/user/${user.username}/lists` : '#'}
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/lists` : '') ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconListUnordered className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.myLists')}</span>
                          </Link>
                          <Link
                            to={user?.username ? `/user/${user.username}/achievements` : '#'}
                            onClick={closeMobileMenu}
                            className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === (user?.username ? `/user/${user.username}/achievements` : '') ? 'nav-mobile-item--active' : ''}`}
                          >
                            <IconAchievement className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.achievements')}</span>
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={closeMobileMenu}
                              className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === '/admin' ? 'nav-mobile-item--active' : ''}`}
                            >
                              <IconSecurity className="w-4 h-4 shrink-0" />
                              <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.admin')}</span>
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              closeMobileMenu()
                              logout()
                            }}
                            className="nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors"
                          >
                            <IconLogout className="w-4 h-4 shrink-0" />
                            <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.logout')}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1">
                        <Link
                          to="/public-collections"
                          onClick={closeMobileMenu}
                          className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname.startsWith('/public-collections') ? 'nav-mobile-item--active' : ''}`}
                        >
                          <IconCollection className="w-4 h-4 shrink-0" />
                          <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.publicCollections')}</span>
                        </Link>
                        <Link
                          to="/users"
                          onClick={closeMobileMenu}
                          className={`nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors ${location.pathname === '/users' ? 'nav-mobile-item--active' : ''}`}
                        >
                          <IconGroup className="w-4 h-4 shrink-0" />
                          <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.users')}</span>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <Link
                          to="/login"
                          onClick={closeMobileMenu}
                          className="nav-mobile-item flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors min-h-[38px]"
                        >
                          <IconPerson className="w-4 h-4 shrink-0" />
                          <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.login')}</span>
                        </Link>
                        <Link
                          to="/register"
                          onClick={closeMobileMenu}
                          className="nav-mobile-item nav-mobile-item--register flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-md transition-colors min-h-[38px]"
                        >
                          <IconGroup className="w-4 h-4 shrink-0" />
                          <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{t('nav.register')}</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <SemanticSearchModal isOpen={semanticSearchModalOpen} onClose={() => setSemanticSearchModalOpen(false)} />
    </>
  )
}
