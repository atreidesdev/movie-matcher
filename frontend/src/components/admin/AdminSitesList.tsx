import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { IconPlus, IconSearch, IconCross } from '@/components/icons'
import { adminApi, type Site } from '@/api/admin'
import { getEntityName } from '@/utils/localizedText'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'

export default function AdminSitesList() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [items, setItems] = useState<Site[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Site | null>(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Site | null>(null)
  const [page, setPage] = useState(1)

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    const isNumeric = /^\d+$/.test(q)
    return items.filter((item) => {
      const idMatch = isNumeric && String(item.id).includes(q)
      const displayName = getEntityName(item, locale)
      const nameMatch = (item.name ?? '').toLowerCase().includes(q) || displayName.toLowerCase().includes(q)
      const urlMatch = (item.url ?? '').toLowerCase().includes(q)
      return idMatch || nameMatch || urlMatch
    })
  }, [items, searchQuery, locale])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE
    return filteredItems.slice(start, start + ADMIN_PAGE_SIZE)
  }, [filteredItems, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const load = () => {
    setLoading(true)
    adminApi
      .getSites()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleStartEdit = (item: Site) => {
    setEditingItem(item)
    setEditName(item.name ?? '')
    setEditUrl(item.url ?? '')
    setEditDescription(item.description ?? '')
  }

  const handleSaveEdit = async () => {
    if (!editingItem || saving) return
    setSaving(true)
    try {
      await adminApi.updateSite(editingItem.id, {
        name: editName.trim(),
        url: editUrl.trim(),
        description: editDescription.trim() || undefined,
      })
      setEditingItem(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim() || saving) return
    setSaving(true)
    try {
      await adminApi.createSite({
        name: newName.trim(),
        url: newUrl.trim(),
        description: newDescription.trim() || undefined,
      })
      setAdding(false)
      setNewName('')
      setNewUrl('')
      setNewDescription('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || saving) return
    setSaving(true)
    try {
      await adminApi.deleteSite(deleteConfirm.id)
      setDeleteConfirm(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.sites')}</h2>
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
                  <span className="font-medium">{getEntityName(item, locale)}</span>
                  <span className="text-gray-500 ml-1 truncate"> — {item.url}</span>
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
                    onClick={() => setDeleteConfirm(item)}
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
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input w-full"
                placeholder={t('admin.name')}
              />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="input w-full"
                placeholder="URL (например https://www.kinopoisk.ru)"
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="input w-full"
                placeholder={t('admin.description')}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving || !newName.trim() || !newUrl.trim()}
                  className="btn-primary text-sm"
                >
                  {t('common.add')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false)
                    setNewName('')
                    setNewUrl('')
                    setNewDescription('')
                  }}
                  className="btn-secondary text-sm"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
          {editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setEditingItem(null)} aria-hidden />
              <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="input w-full"
                    placeholder="https://..."
                  />
                  <label className="block text-sm font-medium text-gray-700">{t('admin.description')}</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="input w-full"
                    placeholder={t('admin.description')}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving || !editName.trim() || !editUrl.trim()}
                    className="btn-primary"
                  >
                    {saving ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {deleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} aria-hidden />
              <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold">{t('admin.confirmDeleteTitle')}</h3>
                <p className="text-gray-700">
                  {t('admin.confirmDeleteEntity', { label: `${deleteConfirm.name} (${deleteConfirm.url})` })}
                </p>
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
          )}
        </>
      )}
    </section>
  )
}
