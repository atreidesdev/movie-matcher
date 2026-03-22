import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconCollection } from '@/components/icons'
import { IconPlus } from '@/components/icons'
import { collectionsApi } from '@/api/collections'
import { Collection } from '@/types'

export default function Collections() {
  const { t } = useTranslation()
  const [list, setList] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    collectionsApi
      .getList()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || creating) return
    setCreating(true)
    collectionsApi
      .create({ name: name.trim(), description: desc.trim() || undefined })
      .then(() => {
        setName('')
        setDesc('')
        setShowCreate(false)
        load()
      })
      .finally(() => setCreating(false))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 collection-page-header">
          <IconCollection className="w-8 h-8 collection-page-icon" />
          {t('nav.collections')}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <IconPlus className="w-5 h-5" />
          {t('common.add')}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="collection-form p-4 rounded-xl space-y-3 max-w-md">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name"
            className="input w-full"
            required
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optional)"
            className="input w-full min-h-[80px] resize-y"
            rows={3}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn-primary">
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="text-gray-400">{t('common.noResults')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((col) => (
            <Link
              key={col.id}
              to={`/collections/${col.id}`}
              className="collection-list-card block p-6 rounded-xl transition-colors"
            >
              <h2 className="font-semibold text-lg">{col.name}</h2>
              {col.description && (
                <p className="collection-list-card-desc text-sm mt-1 line-clamp-2">{col.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
