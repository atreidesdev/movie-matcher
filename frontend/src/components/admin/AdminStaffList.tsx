import { type StaffWithMediaId, adminApi } from '@/api/admin'
import { isMockEnabled } from '@/mock/mockAdapter'
import { getMediaPath } from '@/utils/mediaPaths'
import { getPersonDisplayName } from '@/utils/personUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function AdminStaffList() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [items, setItems] = useState<StaffWithMediaId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    adminApi
      .getStaffList()
      .then(setItems)
      .catch((e) => {
        setItems([])
        setError(e?.response?.status === 404 ? t('admin.staffListLoadError') : e?.message || t('common.error'))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.staffSectionTitle')}</h2>
        <p className="text-gray-400">{t('common.loading')}</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.staffSectionTitle')}</h2>
        <p className="text-amber-600">{error}</p>
        {isMockEnabled() && <p className="text-sm text-gray-500 mt-2">{t('admin.mockModeHint')}</p>}
      </section>
    )
  }

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.staffSectionTitle')}</h2>
      <p className="text-sm text-gray-500 mb-4">{t('admin.staffSectionDesc')}</p>
      {items.length === 0 ? (
        <p className="text-gray-500">{t('common.noResults')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">{t('admin.media')}</th>
                <th className="py-2 pr-4">{t('admin.personHeader')}</th>
                <th className="py-2 pr-4">{t('admin.roleOrProfession')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-500">{entry.id}</td>
                  <td className="py-2 pr-4">
                    {(entry.mediaType ?? 'movie') && (entry.mediaId ?? entry.movieId) != null ? (
                      <Link
                        to={getMediaPath((entry.mediaType ?? 'movie') as 'movie', entry.mediaId ?? entry.movieId ?? 0)}
                        className="text-lavender-600 hover:underline"
                      >
                        {entry.mediaType ?? 'movie'} #{entry.mediaId ?? entry.movieId}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-4">{entry.person ? getPersonDisplayName(entry.person, locale) : '—'}</td>
                  <td className="py-2 pr-4">
                    {entry.profession
                      ? (() => {
                          const key = 'person.' + entry.profession
                          const tr = t(key)
                          return tr !== key ? tr : entry.profession
                        })()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
