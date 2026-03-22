import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { publicCollectionsApi, type PublicCollectionListItem } from '@/api/collections'

export default function PublicCollectionsPage() {
  const { t } = useTranslation()
  const [list, setList] = useState<PublicCollectionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    publicCollectionsApi
      .getList()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-theme-muted">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-theme">{t('nav.publicCollections')}</h1>
      <p className="text-theme-muted text-sm">{t('collections.publicDescription')}</p>

      {list.length === 0 ? (
        <p className="text-theme-muted">{t('collections.publicEmpty')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {list.map((c) => (
            <li key={c.id} className="min-h-[7.5rem]">
              <Link
                to={`/public-collections/${c.id}`}
                className="block h-full min-h-[7.5rem] p-4 rounded-xl bg-theme-surface hover:bg-theme-bg-alt transition-colors border border-theme"
              >
                <h2 className="font-semibold text-theme">{c.name}</h2>
                {c.description && <p className="text-sm text-theme-muted mt-1 line-clamp-2">{c.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
