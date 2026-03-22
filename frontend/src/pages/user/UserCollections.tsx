import { useEffect, useState } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconPlus } from '@/components/icons'
import { collectionsApi } from '@/api/collections'
import { Collection } from '@/types'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { useAuthStore } from '@/store/authStore'

export default function UserCollections() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const [list, setList] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const isOwnCollections = Boolean(username && user?.username && username.toLowerCase() === user.username.toLowerCase())

  const load = () => {
    if (!username) return
    setLoading(true)
    collectionsApi
      .getListByUsername(username)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    load()
  }, [username])

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

  if (!username || !profile) return <p className="text-theme-muted">{t('common.noResults')}</p>
  if (loading) return <p className="text-theme-muted">{t('common.loading')}</p>

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 mt-6 space-y-6">
        {isOwnCollections && showCreate && (
          <form onSubmit={handleCreate} className="p-4 bg-theme-bg-alt rounded-xl space-y-3 max-w-md">
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

        {list.length === 0 && !isOwnCollections ? (
          <p className="text-theme-muted">{t('common.noResults')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {isOwnCollections && (
              <li className="min-h-[7.5rem]">
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="w-full h-full min-h-[7.5rem] flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-theme-surface hover:bg-theme-bg-alt transition-colors border border-theme border-dashed text-theme-muted hover:text-theme"
                >
                  <IconPlus className="w-8 h-8" />
                  <span className="text-sm font-medium">{t('common.add')}</span>
                </button>
              </li>
            )}
            {list.map((c) => (
              <li key={c.id} className="min-h-[7.5rem]">
                <Link
                  to={`/collections/${c.id}`}
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
