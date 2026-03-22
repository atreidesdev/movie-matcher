import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { usersApi, UserSettings as UserSettingsType } from '@/api/users'
import { authApi } from '@/api/auth'
import type { Session } from '@/types'
import { useToastStore } from '@/store/toastStore'
import { Upload, Monitor, ArrowLeft, ChevronsRight, Link2 } from 'lucide-react'
import { IconPerson, IconLogout } from '@/components/icons'
import type { SocialLinks } from '@/types'

const SOCIAL_PLATFORMS: { key: string; labelKey: string; placeholder: string }[] = [
  { key: 'telegram', labelKey: 'user.social.telegram', placeholder: 'https://t.me/username' },
  { key: 'vk', labelKey: 'user.social.vk', placeholder: 'https://vk.com/username' },
  { key: 'twitter', labelKey: 'user.social.twitter', placeholder: 'https://twitter.com/username' },
  { key: 'github', labelKey: 'user.social.github', placeholder: 'https://github.com/username' },
  { key: 'youtube', labelKey: 'user.social.youtube', placeholder: 'https://youtube.com/@channel' },
]

const PROFILE_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends only' },
  { value: 'private', label: 'Private' },
]

type Tab = 'account' | 'sessions' | 'integrations'

export default function UserSettings() {
  const { t } = useTranslation()
  const { user: currentUser, accessToken, refreshToken, sessionId, logout } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('account')
  const [settings, setSettings] = useState<UserSettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [profileForm, setProfileForm] = useState<{
    username: string
    name: string
    email: string
    socialLinks: SocialLinks
  }>({
    username: '',
    name: '',
    email: '',
    socialLinks: {},
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [logoutOthersLoading, setLogoutOthersLoading] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    usersApi
      .getMySettings()
      .then(setSettings)
      .catch(() => setSettings({}))
      .finally(() => setLoading(false))
  }, [accessToken, navigate])

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        username: currentUser.username ?? '',
        name: currentUser.name ?? '',
        email: currentUser.email ?? '',
        socialLinks: currentUser.socialLinks ?? {},
      })
    }
  }, [currentUser?.id, currentUser?.username, currentUser?.name, currentUser?.email, currentUser?.socialLinks])

  useEffect(() => {
    if (tab === 'sessions' && accessToken) {
      setSessionsLoading(true)
      authApi
        .getSessions()
        .then(setSessions)
        .catch(() => setSessions([]))
        .finally(() => setSessionsLoading(false))
    }
  }, [tab, accessToken])

  const handleProfileVisibilityChange = (value: string) => {
    setSettings((prev) => (prev ? { ...prev, profileVisibility: value } : { profileVisibility: value }))
  }

  const handleSaveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await usersApi.updateMySettings({ profileVisibility: settings.profileVisibility })
      useToastStore.getState().show({ title: t('common.success') })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { user } = await usersApi.updateProfile({
        username: profileForm.username.trim() || undefined,
        name: profileForm.name.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        socialLinks:
          Object.fromEntries(
            Object.entries(profileForm.socialLinks).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
          ) || undefined,
      })
      useAuthStore.setState({ user })
      useToastStore.getState().show({ title: t('user.profileUpdated') })
      if (user.username && profileForm.username !== user.username) {
        navigate('/settings', { replace: true })
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : ''
      useToastStore.getState().show({ title: t('common.error'), description: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      useToastStore.getState().show({ title: t('common.error'), description: 'New passwords do not match' })
      return
    }
    if (passwordForm.new.length < 6) {
      useToastStore.getState().show({ title: t('common.error'), description: 'Password must be at least 6 characters' })
      return
    }
    setSaving(true)
    try {
      await usersApi.changePassword(passwordForm.current, passwordForm.new)
      setPasswordForm({ current: '', new: '', confirm: '' })
      useToastStore.getState().show({ title: t('user.passwordUpdated') })
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : ''
      useToastStore.getState().show({ title: t('common.error'), description: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const res = await usersApi.uploadAvatar(file)
      useAuthStore.setState({ user: res.user })
    } finally {
      setAvatarLoading(false)
      e.target.value = ''
    }
  }

  const handleRevokeSession = async (id: number) => {
    setRevokingId(id)
    try {
      await authApi.revokeSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (sessionId === id) {
        logout()
        navigate('/login')
      }
    } finally {
      setRevokingId(null)
    }
  }

  const handleLogoutOthers = async () => {
    if (!refreshToken) return
    setLogoutOthersLoading(true)
    try {
      await authApi.logoutOthers(refreshToken)
      setSessions((prev) => prev.filter((s) => s.id === sessionId))
      useToastStore.getState().show({ title: t('user.logoutAllOthers') })
    } finally {
      setLogoutOthersLoading(false)
    }
  }

  if (!accessToken) {
    return null
  }

  if (loading) {
    return (
      <div className="max-w-xl lg:max-w-3xl mx-auto">
        <div className="bg-gray-50 rounded-xl p-8 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'account', label: t('user.tabAccount') },
    { key: 'sessions', label: t('user.tabSessions') },
    { key: 'integrations', label: t('user.tabIntegrations') },
  ]

  return (
    <div className="max-w-xl lg:max-w-3xl mx-auto">
      <div className="profile-subpage bg-gray-50 rounded-xl p-6 sm:p-8">
        <nav
          className="profile-subpage-breadcrumb flex items-center gap-1 text-sm text-gray-600 mb-4"
          aria-label="Breadcrumb"
        >
          <Link
            to={currentUser?.username ? `/user/${encodeURIComponent(currentUser.username)}` : '/'}
            className="link-underline-animate"
          >
            {t('profile.profile')}
          </Link>
          <ChevronsRight className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
          <span className="text-gray-900 font-medium">{t('user.settingsTitle')}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link
            to={currentUser?.username ? `/user/${encodeURIComponent(currentUser.username)}` : '/'}
            className="inline-flex flex-col items-center gap-0.5 link-underline-animate text-sm focus:outline-none"
          >
            <ArrowLeft className="w-4 h-3" />
            <span>{t('common.back')}</span>
          </Link>
          <span className="text-gray-700" style={{ fontSize: '2.2rem' }}>
            {t('user.settingsTitle')}
          </span>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? 'border-space_indigo-500 text-space_indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'account' && (
          <div className="space-y-6">
            <section>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {currentUser?.avatar ? (
                    <img src={getMediaAssetUrl(currentUser.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <IconPerson className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  {avatarLoading ? t('common.loading') : t('user.uploadAvatar')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarLoading}
                  />
                </label>
              </div>
            </section>
            <section>
              <h2 className="text-lg font-semibold mb-2">{t('user.profileVisibility')}</h2>
              <select
                value={settings?.profileVisibility ?? 'public'}
                onChange={(e) => handleProfileVisibilityChange(e.target.value)}
                className="input w-full max-w-xs"
              >
                {PROFILE_VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">{t('user.profileVisibilityHint')}</p>
              <button type="button" onClick={handleSaveSettings} disabled={saving} className="mt-2 btn-primary">
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </section>
            <hr className="border-gray-200 my-6" />
            <section>
              <h2 className="text-lg font-semibold mb-4">{t('user.displayName')}</h2>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                className="input w-full"
                placeholder={t('user.displayName')}
              />
            </section>
            <section>
              <h2 className="text-lg font-semibold mb-4">{t('user.username')}</h2>
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                className="input w-full"
                placeholder="@username"
              />
              <p className="text-sm text-gray-500 mt-1">3–32 characters, letters, numbers, underscore</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold mb-4">{t('user.email')}</h2>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                className="input w-full"
                placeholder="email@example.com"
              />
            </section>
            <button type="button" onClick={handleSaveProfile} disabled={saving} className="btn-primary">
              {saving ? t('common.saving') : t('user.saveProfile')}
            </button>

            <hr className="border-gray-200 my-8" />
            <section>
              <h2 className="text-lg font-semibold mb-4">{t('user.changePassword')}</h2>
              <div className="space-y-3">
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                  className="input w-full"
                  placeholder={t('user.currentPassword')}
                />
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                  className="input w-full"
                  placeholder={t('user.newPassword')}
                />
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  className="input w-full"
                  placeholder={t('user.confirmNewPassword')}
                />
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={saving || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                className="mt-3 btn-primary"
              >
                {saving ? t('common.saving') : t('user.changePassword')}
              </button>
            </section>
          </div>
        )}

        {tab === 'sessions' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">{t('user.sessionsHint')}</p>
            {sessionsLoading ? (
              <p className="text-gray-500">{t('common.loading')}</p>
            ) : (
              <ul className="space-y-3">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-wrap">
                      <Monitor className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium sm:truncate">{s.deviceName || 'Device'}</p>
                        <p className="text-xs text-gray-500 sm:truncate">{s.userAgent}</p>
                        <p className="text-xs text-gray-400">
                          {s.lastUsedAt
                            ? new Date(s.lastUsedAt).toLocaleString()
                            : new Date(s.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {sessionId === s.id && (
                        <span className="shrink-0 text-xs font-medium text-space_indigo-500 bg-lavender-600 px-2 py-0.5 rounded">
                          {t('user.currentDevice')}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2 py-1 text-sm text-soft_blush-300 hover:bg-soft_blush-800 rounded-lg disabled:opacity-50"
                    >
                      <IconLogout className="w-4 h-4" />
                      {revokingId === s.id ? t('common.loading') : t('user.logoutThisDevice')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleLogoutOthers}
                disabled={logoutOthersLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-soft_blush-800 text-soft_blush-300 hover:bg-soft_blush-700 rounded-lg font-medium disabled:opacity-50"
              >
                <IconLogout className="w-4 h-4" />
                {logoutOthersLoading ? t('common.loading') : t('user.logoutAllOthers')}
              </button>
            )}
          </div>
        )}

        {tab === 'integrations' && (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                {t('user.integrationsTitle')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{t('user.integrationsHint')}</p>
              <div className="space-y-3">
                {SOCIAL_PLATFORMS.map(({ key, labelKey, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm text-gray-600 mb-0.5">{t(labelKey)}</label>
                    <input
                      type="url"
                      value={profileForm.socialLinks[key] ?? ''}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          socialLinks: { ...p.socialLinks, [key]: e.target.value.trim() },
                        }))
                      }
                      className="input w-full"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleSaveProfile} disabled={saving} className="mt-4 btn-primary">
                {saving ? t('common.saving') : t('user.saveProfile')}
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
