import { entitiesApi } from '@/api/entities'
import PublisherEditModal from '@/components/PublisherEditModal'
import ProjectEntryCard from '@/components/cards/ProjectEntryCard'
import { isMockEnabled } from '@/mock/mockAdapter'
import { getPublisherProjects, mockPublishers } from '@/mock/mockData'
import { useAuthStore } from '@/store/authStore'
import type { Publisher } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

export default function PublisherDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const numId = id ? Number.parseInt(id, 10) : 0
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [sections, setSections] = useState<
    { type: string; labelKey: string; entries: { type: string; id: number; title: string; poster?: string }[] }[]
  >([])
  const [loading, setLoading] = useState(true)
  const canEdit = user && (user.role === 'content_creator' || user.role === 'admin' || user.role === 'owner')
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!numId) {
      setPublisher(null)
      setSections([])
      setLoading(false)
      return
    }
    if (isMockEnabled()) {
      setPublisher(mockPublishers.find((p) => p.id === numId) ?? null)
      setSections(getPublisherProjects(numId))
      setLoading(false)
      return
    }
    setLoading(true)
    entitiesApi
      .getPublisher(numId)
      .then((res) => {
        setPublisher(res)
        setSections(res.projects ?? [])
      })
      .catch(() => {
        setPublisher(null)
        setSections([])
      })
      .finally(() => setLoading(false))
  }, [numId])

  if (!numId) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {publisher ? (
        <>
          <div className="flex items-start gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{publisher.name}</h1>
              {publisher.country && (
                <p className="text-gray-600">
                  {t('media.country')}: {publisher.country}
                </p>
              )}
              {publisher.publicationTypes?.length ? (
                <p className="text-gray-600">
                  {t('admin.publicationTypes')}:{' '}
                  {publisher.publicationTypes
                    .map((type) => {
                      if (type === 'game') return t('nav.games')
                      if (type === 'manga') return t('nav.manga')
                      if (type === 'book') return t('nav.books')
                      if (type === 'light-novel') return t('nav.lightNovels')
                      return type
                    })
                    .join(', ')}
                </p>
              ) : null}
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="btn-edit inline-flex items-center gap-2 px-3 py-2 rounded-lg"
              >
                <Pencil className="w-4 h-4" />
                {t('common.edit')}
              </button>
            )}
          </div>
          {sections.length > 0 && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold">{t('publisher.projects')}</h2>
              {sections.map((section) => (
                <div key={section.type}>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">{t(section.labelKey)}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {section.entries.map((entry) => (
                      <ProjectEntryCard
                        key={`${entry.type}-${entry.id}`}
                        type={entry.type as MediaTypeForPath}
                        id={entry.id}
                        title={entry.title}
                        poster={entry.poster}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500">{t('common.noResults')}</p>
      )}

      <PublisherEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        publisher={publisher}
        onSaved={(updated) => setPublisher((prev) => (prev ? { ...prev, ...updated } : null))}
      />
    </div>
  )
}
