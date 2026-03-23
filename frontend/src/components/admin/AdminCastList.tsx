import { type CastWithMediaId, adminApi } from '@/api/admin'
import { IconCross } from '@/components/icons'
import { ROLE_TYPES } from '@/constants/enums'
import { getCharacterName } from '@/utils/localizedText'
import { getMediaPath } from '@/utils/mediaPaths'
import { getPersonDisplayName } from '@/utils/personUtils'
import { Pencil } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/** Только каст (актёры и роли): записи с персонажем. Без персонала (режиссёры и т.д.). */
function isCastEntry(entry: CastWithMediaId): boolean {
  return (entry.characterId != null && entry.characterId !== 0) || entry.character != null
}

export default function AdminCastList() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [items, setItems] = useState<CastWithMediaId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<CastWithMediaId | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editRoleType, setEditRoleType] = useState<string>('main')
  const [saving, setSaving] = useState(false)

  const castOnlyItems = useMemo(() => items.filter(isCastEntry), [items])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi
      .getCastList()
      .then(setItems)
      .catch((e) => {
        setItems([])
        setError(e?.response?.status === 404 ? 'API не реализован' : e?.message || 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStartEdit = (entry: CastWithMediaId) => {
    setEditingEntry(entry)
    setEditRole(entry.role ?? '')
    setEditRoleType(entry.roleType ?? 'main')
  }

  const handleSaveCast = async () => {
    if (!editingEntry || saving) return
    setSaving(true)
    try {
      await adminApi.updateCast(editingEntry.id, {
        role: editRole.trim() || undefined,
        roleType: editRoleType || undefined,
      })
      setEditingEntry(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.castSectionTitle')}</h2>
        <p className="text-gray-400">{t('common.loading')}</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.castSectionTitle')}</h2>
        <p className="text-amber-600">{error}</p>
        <p className="text-sm text-gray-500 mt-2">
          В режиме мока (VITE_USE_MOCK=true) список каста подставляется из мок-данных.
        </p>
      </section>
    )
  }

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.castSectionTitle')}</h2>
      <p className="text-sm text-gray-500 mb-4">{t('admin.castSectionDesc')}</p>
      {castOnlyItems.length === 0 ? (
        <p className="text-gray-500">{t('common.noResults')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">{t('admin.media')}</th>
                <th className="py-2 pr-4">{t('admin.roleOrType')}</th>
                <th className="py-2 pr-4">{t('admin.characterHeader')}</th>
                <th className="py-2 pr-4">{t('admin.personHeader')}</th>
                <th className="py-2 pr-4 w-10" aria-label={t('common.edit')} />
              </tr>
            </thead>
            <tbody>
              {castOnlyItems.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-500">{entry.id}</td>
                  <td className="py-2 pr-4">
                    {entry.mediaType && entry.mediaId != null ? (
                      <Link
                        to={getMediaPath(entry.mediaType as 'movie', entry.mediaId)}
                        className="text-lavender-600 hover:underline"
                      >
                        {entry.mediaType} #{entry.mediaId}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {entry.role ?? '—'}{' '}
                    <span className="text-gray-400">
                      ({entry.roleType ? t('admin.roleType.' + entry.roleType) : '—'})
                    </span>
                  </td>
                  <td className="py-2 pr-4">{entry.character ? getCharacterName(entry.character, locale) : '—'}</td>
                  <td className="py-2 pr-4">{entry.person ? getPersonDisplayName(entry.person, locale) : '—'}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(entry)}
                      className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-100 rounded-lg transition-colors"
                      aria-label={t('common.edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingEntry(null)} aria-hidden />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('admin.editEntity')} #{editingEntry.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
                aria-label={t('common.close')}
              >
                <IconCross className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {editingEntry.person ? getPersonDisplayName(editingEntry.person, locale) : '—'}
              {editingEntry.character ? ` · ${getCharacterName(editingEntry.character, locale)}` : ''}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.roleName')}</label>
              <input
                type="text"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="input w-full"
                placeholder={t('admin.roleName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.roleTypeLabel')}</label>
              <select value={editRoleType} onChange={(e) => setEditRoleType(e.target.value)} className="input w-full">
                {ROLE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {t(`roleType.${rt}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditingEntry(null)} className="btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleSaveCast} disabled={saving} className="btn-primary">
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
