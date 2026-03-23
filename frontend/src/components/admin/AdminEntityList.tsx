import { adminApi } from '@/api/admin'
import type { Platform } from '@/api/admin'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import { IconCross, IconPlus, IconSearch } from '@/components/icons'
import { PUBLISHER_PUBLICATION_TYPE_OPTIONS } from '@/constants/publisherPublicationTypes'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import type { Developer, Genre, LocalizedString, Publisher, PublisherPublicationType, Studio, Theme } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type EntityKey = 'genres' | 'themes' | 'studios' | 'platforms' | 'developers' | 'publishers'

type EntityItem = Genre | Theme | Studio | Platform | Developer | Publisher

interface AdminEntityListProps {
  entityKey: EntityKey
  titleKey: string
  /** Для отображения строки (name + опционально description/country) */
  getLabel: (item: EntityItem) => string
  /** Минимальные поля для создания */
  getCreatePayload: () => Record<string, unknown>
  /** Обновление после create/update/delete */
  onRefresh: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}

const ENTITY_APIS = {
  genres: {
    list: adminApi.getGenres,
    create: adminApi.createGenre,
    update: adminApi.updateGenre,
    delete: adminApi.deleteGenre,
  },
  themes: {
    list: adminApi.getThemes,
    create: adminApi.createTheme,
    update: adminApi.updateTheme,
    delete: adminApi.deleteTheme,
  },
  studios: {
    list: adminApi.getStudios,
    create: adminApi.createStudio,
    update: adminApi.updateStudio,
    delete: adminApi.deleteStudio,
  },
  platforms: {
    list: adminApi.getPlatforms,
    create: adminApi.createPlatform,
    update: adminApi.updatePlatform,
    delete: adminApi.deletePlatform,
  },
  developers: {
    list: adminApi.getDevelopers,
    create: adminApi.createDeveloper,
    update: adminApi.updateDeveloper,
    delete: adminApi.deleteDeveloper,
  },
  publishers: {
    list: adminApi.getPublishers,
    create: adminApi.createPublisher,
    update: adminApi.updatePublisher,
    delete: adminApi.deletePublisher,
  },
} as const

export default function AdminEntityList({
  entityKey,
  titleKey,
  getLabel,
  getCreatePayload,
  onRefresh,
  loading,
  setLoading,
}: AdminEntityListProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<EntityItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState<EntityItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editExtra, setEditExtra] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPublicationTypes, setEditPublicationTypes] = useState<PublisherPublicationType[]>([])
  const [editNameI18n, setEditNameI18n] = useState<LocalizedString>({})
  const [editDescriptionI18n, setEditDescriptionI18n] = useState<LocalizedString>({})
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newExtra, setNewExtra] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPublicationTypes, setNewPublicationTypes] = useState<PublisherPublicationType[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<EntityItem | null>(null)
  const [page, setPage] = useState(1)

  useLockBodyScroll(!!editingItem || !!deleteConfirm)

  const api = ENTITY_APIS[entityKey]

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    const isNumeric = /^\d+$/.test(q)
    return items.filter((item) => {
      const idMatch = isNumeric && String(item.id).includes(q)
      const label = getLabel(item).toLowerCase()
      const nameMatch = label.includes(q)
      return idMatch || nameMatch
    })
  }, [items, searchQuery, getLabel])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE
    return filteredItems.slice(start, start + ADMIN_PAGE_SIZE)
  }, [filteredItems, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const load = () => {
    setLoading(true)
    api
      .list()
      .then((data) => setItems(data as EntityItem[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [entityKey])

  const handleStartEdit = (item: EntityItem) => {
    setEditingItem(item)
    setEditName('name' in item ? item.name : '')
    setEditNameI18n((item as { nameI18n?: LocalizedString }).nameI18n ?? {})
    if (
      entityKey === 'genres' ||
      entityKey === 'themes' ||
      entityKey === 'studios' ||
      entityKey === 'developers' ||
      entityKey === 'publishers'
    ) {
      setEditDescriptionI18n((item as { descriptionI18n?: LocalizedString }).descriptionI18n ?? {})
    } else {
      setEditDescriptionI18n({})
    }
    if (entityKey === 'platforms') {
      setEditExtra('icon' in item ? (item.icon ?? '') : '')
      setEditEmoji('')
      setEditDescription('')
    } else if (entityKey === 'genres' || entityKey === 'themes') {
      setEditExtra('description' in item ? (item.description ?? '') : '')
      setEditEmoji((item as { emoji?: string }).emoji ?? '')
      setEditDescription('')
    } else {
      setEditExtra('country' in item ? (item.country ?? '') : '')
      setEditEmoji('')
      setEditDescription('description' in item ? ((item as { description?: string }).description ?? '') : '')
      setEditPublicationTypes(entityKey === 'publishers' ? ((item as Publisher).publicationTypes ?? []) : [])
    }
  }

  const handleSaveEdit = async () => {
    if (editingItem == null || saving) return
    setSaving(true)
    try {
      const nameI18n = Object.keys(editNameI18n).length ? editNameI18n : undefined
      if (entityKey === 'genres' || entityKey === 'themes') {
        const descriptionI18n = Object.keys(editDescriptionI18n).length ? editDescriptionI18n : undefined
        await api.update(editingItem.id, {
          name: editName,
          description: editExtra || undefined,
          emoji: editEmoji.trim() || undefined,
          nameI18n,
          descriptionI18n,
        } as never)
      } else if (entityKey === 'platforms') {
        await api.update(editingItem.id, { name: editName, icon: editExtra || undefined, nameI18n } as never)
      } else {
        const descriptionI18n = Object.keys(editDescriptionI18n).length ? editDescriptionI18n : undefined
        await api.update(editingItem.id, {
          name: editName,
          country: editExtra || undefined,
          description: editDescription.trim() || undefined,
          ...(entityKey === 'publishers' ? { publicationTypes: editPublicationTypes } : {}),
          nameI18n,
          descriptionI18n,
        } as never)
      }
      setEditingItem(null)
      load()
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (item: EntityItem) => {
    setDeleteConfirm(item)
  }
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || saving) return
    setSaving(true)
    try {
      await api.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      load()
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  const extraPlaceholder =
    entityKey === 'genres' || entityKey === 'themes'
      ? t('admin.description')
      : entityKey === 'platforms'
        ? t('admin.icon')
        : t('admin.country')

  const handleAdd = async () => {
    if (!newName.trim() || saving) return
    setSaving(true)
    try {
      const payload = getCreatePayload()
      if (entityKey === 'genres' || entityKey === 'themes') {
        await api.create({
          ...payload,
          name: newName.trim(),
          description: newExtra.trim() || undefined,
          emoji: newEmoji.trim() || undefined,
        } as never)
      } else if (entityKey === 'platforms') {
        await api.create({ name: newName.trim(), icon: newExtra.trim() || undefined } as never)
      } else {
        await api.create({
          ...payload,
          name: newName.trim(),
          country: newExtra.trim() || undefined,
          description: newDescription.trim() || undefined,
          ...(entityKey === 'publishers' ? { publicationTypes: newPublicationTypes } : {}),
        } as never)
      }
      setAdding(false)
      setNewName('')
      setNewExtra('')
      setNewEmoji('')
      setNewDescription('')
      setNewPublicationTypes([])
      load()
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t(titleKey)}</h2>
      {loading ? (
        <p className="text-gray-400">{t('common.loading')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.searchPlaceholder')}
                className="input w-full !pl-[2.75rem] rounded-xl border-gray-200"
              />
            </div>
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <IconPlus className="w-4 h-4" />
                {t('common.add')}
              </button>
            )}
          </div>
          <ul className="space-y-2 pr-1">
            {paginatedItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border bg-white/90 border-gray-200 hover:border-lavender-200 hover:shadow transition-all"
              >
                <span className="text-gray-800 flex-1 min-w-0 truncate text-sm">
                  <span className="text-gray-400 text-xs mr-1">#{item.id}</span>
                  {getLabel(item)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-100 rounded-lg transition-colors"
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(item)}
                    disabled={saving}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <AdminPagination
            currentPage={page}
            totalItems={filteredItems.length}
            pageSize={ADMIN_PAGE_SIZE}
            onPageChange={setPage}
          />
          {filteredItems.length === 0 && (
            <p className="text-gray-500 text-sm py-2">{searchQuery.trim() ? t('common.noResults') : ''}</p>
          )}
          {adding && (
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input flex-1 min-w-[120px]"
                placeholder={t('admin.name')}
              />
              <input
                type="text"
                value={newExtra}
                onChange={(e) => setNewExtra(e.target.value)}
                className="input flex-1 min-w-[100px]"
                placeholder={extraPlaceholder}
              />
              {(entityKey === 'genres' || entityKey === 'themes') && (
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="input w-20"
                  placeholder={t('admin.emoji')}
                />
              )}
              {(entityKey === 'studios' || entityKey === 'developers' || entityKey === 'publishers') && (
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input flex-1 min-w-[120px]"
                  placeholder={t('admin.description')}
                />
              )}
              {entityKey === 'publishers' && (
                <div className="flex flex-wrap items-center gap-2">
                  {PUBLISHER_PUBLICATION_TYPE_OPTIONS.map((option) => {
                    const checked = newPublicationTypes.includes(option.value)
                    return (
                      <label
                        key={option.value}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setNewPublicationTypes((prev) =>
                              e.target.checked
                                ? [...prev, option.value]
                                : prev.filter((value) => value !== option.value),
                            )
                          }
                        />
                        <span>{t(option.labelKey)}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !newName.trim()}
                className="btn-primary text-sm"
              >
                {t('common.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false)
                  setNewName('')
                  setNewExtra('')
                  setNewEmoji('')
                  setNewDescription('')
                  setNewPublicationTypes([])
                }}
                className="btn-secondary text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
          {editingItem && (
            <div
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0"
              role="dialog"
              aria-modal="true"
            >
              <div
                className="fixed inset-0 bg-black/50 min-h-[100dvh]"
                onClick={() => setEditingItem(null)}
                aria-hidden
              />
              <div
                className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => setEditingItem(null)}
              >
                <div
                  className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {t('admin.editEntity')} #{editingItem.id}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
                      aria-label={t('common.close')}
                    >
                      <IconCross className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">{t('admin.name')}</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input w-full"
                      placeholder={t('admin.name')}
                    />
                    <label className="block text-sm font-medium text-gray-700">{extraPlaceholder}</label>
                    <input
                      type="text"
                      value={editExtra}
                      onChange={(e) => setEditExtra(e.target.value)}
                      className="input w-full"
                      placeholder={extraPlaceholder}
                    />
                    {(entityKey === 'genres' || entityKey === 'themes') && (
                      <>
                        <label className="block text-sm font-medium text-gray-700">{t('admin.emoji')}</label>
                        <input
                          type="text"
                          value={editEmoji}
                          onChange={(e) => setEditEmoji(e.target.value)}
                          className="input w-full"
                          placeholder="🎭"
                        />
                      </>
                    )}
                    {(entityKey === 'studios' || entityKey === 'developers' || entityKey === 'publishers') && (
                      <>
                        <label className="block text-sm font-medium text-gray-700">{t('admin.description')}</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="input w-full min-h-[60px]"
                          rows={2}
                          placeholder={t('admin.description')}
                        />
                      </>
                    )}
                    {entityKey === 'publishers' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          {t('admin.publicationTypes')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {PUBLISHER_PUBLICATION_TYPE_OPTIONS.map((option) => {
                            const checked = editPublicationTypes.includes(option.value)
                            return (
                              <label
                                key={option.value}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) =>
                                    setEditPublicationTypes((prev) =>
                                      e.target.checked
                                        ? [...prev, option.value]
                                        : prev.filter((value) => value !== option.value),
                                    )
                                  }
                                />
                                <span>{t(option.labelKey)}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.translationsName')}
                      </label>
                      <TranslationsEditor value={editNameI18n} onChange={setEditNameI18n} className="mt-1" />
                    </div>
                    {(entityKey === 'genres' ||
                      entityKey === 'themes' ||
                      entityKey === 'studios' ||
                      entityKey === 'developers' ||
                      entityKey === 'publishers') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('admin.translationsDescription')}
                        </label>
                        <TranslationsEditor
                          value={editDescriptionI18n}
                          onChange={setEditDescriptionI18n}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">
                      {t('common.cancel')}
                    </button>
                    <button type="button" onClick={handleSaveEdit} disabled={saving} className="btn-primary">
                      {saving ? t('common.loading') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {deleteConfirm && (
            <div
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[60] overflow-hidden min-h-[100dvh] m-0"
              role="dialog"
              aria-modal="true"
            >
              <div
                className="fixed inset-0 bg-black/50 min-h-[100dvh]"
                onClick={() => setDeleteConfirm(null)}
                aria-hidden
              />
              <div
                className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4"
                onClick={() => setDeleteConfirm(null)}
              >
                <div
                  className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold">{t('admin.confirmDeleteTitle')}</h3>
                  <p className="text-gray-700">{t('admin.confirmDeleteEntity', { label: getLabel(deleteConfirm) })}</p>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary rounded-xl">
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      disabled={saving}
                      className="btn-primary rounded-xl bg-red-600 hover:bg-red-700"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
