import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { communitiesApi } from '@/api/communities'

export default function CommunityCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t('communities.name'))
      return
    }
    setSaving(true)
    try {
      const comm = await communitiesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      navigate(`/communities/${comm.slug || comm.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link to="/communities" className="text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] mb-4 inline-block">
        ← {t('communities.title')}
      </Link>
      <h1 className="text-xl font-bold text-[var(--theme-text)] mb-6">{t('communities.createTitle')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('communities.name')} *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)]"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('communities.description')}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)]"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('communities.create')}
          </button>
          <Link
            to="/communities"
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-bg-alt)]"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  )
}
