import { adminApi } from '@/api/admin'
import { charactersApi } from '@/api/characters'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import { IconCross, IconPlus, IconSearch } from '@/components/icons'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import type { Character, LocalizedString } from '@/types'
import { getEntityName } from '@/utils/localizedText'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { buildUploadBaseName } from '@/utils/uploadNames'
import { Pencil, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function AdminCharactersList() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [items, setItems] = useState<Character[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Character | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Character | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    avatar: '',
    images: [] as { url: string; caption: string }[],
  })
  const [nameI18n, setNameI18n] = useState<LocalizedString>({})
  const [descriptionI18n, setDescriptionI18n] = useState<LocalizedString>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [page, setPage] = useState(1)

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    const isNumeric = /^\d+$/.test(q)
    return items.filter((item) => {
      const idMatch = isNumeric && String(item.id).includes(q)
      const displayName = getEntityName(item, locale)
      const nameMatch = (item.name ?? '').toLowerCase().includes(q) || displayName.toLowerCase().includes(q)
      const descMatch = (item.description ?? '').toLowerCase().includes(q)
      return idMatch || nameMatch || descMatch
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
    charactersApi
      .getList(1, 200)
      .then((res) => setItems(res.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleStartEdit = (item: Character) => {
    setEditingItem(item)
    setCreating(false)
    const imgs = item.images
    const normalizedImages = Array.isArray(imgs)
      ? imgs.map((x) =>
          typeof x === 'object' && x != null && 'url' in x
            ? {
                url: String((x as { url: unknown }).url),
                caption:
                  typeof (x as { caption?: unknown }).caption === 'string'
                    ? String((x as { caption?: unknown }).caption)
                    : '',
              }
            : { url: String(x), caption: '' },
        )
      : []
    setNameI18n(item.nameI18n ?? {})
    setDescriptionI18n(item.descriptionI18n ?? {})
    setForm({
      name: item.name ?? '',
      description: item.description ?? '',
      avatar: item.avatar ?? '',
      images: normalizedImages,
    })
  }

  const handleStartCreate = () => {
    setEditingItem(null)
    setCreating(true)
    setNameI18n({})
    setDescriptionI18n({})
    setForm({ name: '', description: '', avatar: '', images: [] })
  }

  const handleSaveEdit = async () => {
    if (!editingItem && !creating) return
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const nameI18nPayload = Object.keys(nameI18n).length ? nameI18n : undefined
      const descriptionI18nPayload = Object.keys(descriptionI18n).length ? descriptionI18n : undefined
      const imagesPayload = form.images.length ? form.images : undefined
      if (creating) {
        await adminApi.createCharacter({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          avatar: form.avatar.trim() || undefined,
          images: imagesPayload,
          nameI18n: nameI18nPayload,
          descriptionI18n: descriptionI18nPayload,
        })
      } else if (editingItem) {
        await adminApi.updateCharacter(editingItem.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          avatar: form.avatar.trim() || undefined,
          images: imagesPayload,
          nameI18n: nameI18nPayload,
          descriptionI18n: descriptionI18nPayload,
        })
      }
      setEditingItem(null)
      setCreating(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || saving) return
    setSaving(true)
    try {
      await adminApi.deleteCharacter(deleteConfirm.id)
      setDeleteConfirm(null)
      load()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const showModal = editingItem !== null || creating
  useLockBodyScroll(showModal || !!deleteConfirm)

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.characters')}</h2>
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
            <button type="button" onClick={handleStartCreate} className="btn-primary inline-flex items-center gap-2">
              <IconPlus className="w-4 h-4" />
              {t('common.add')}
            </button>
          </div>
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {paginatedItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border bg-white/90 border-gray-200 hover:border-lavender-200 hover:shadow transition-all"
              >
                <span className="text-gray-800 flex-1 min-w-0 truncate text-sm">
                  <span className="text-gray-400 text-xs mr-1">#{item.id}</span>
                  {getEntityName(item, locale)}
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
          {filteredItems.length === 0 && searchQuery.trim() && (
            <p className="text-gray-500 text-sm py-2">{t('common.noResults')}</p>
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
                  <p className="text-gray-700">
                    {t('admin.confirmDeleteEntity', { label: deleteConfirm.name ?? `#${deleteConfirm.id}` })}
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
            </div>
          )}
          {showModal && (
            <div
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0"
              role="dialog"
              aria-modal="true"
            >
              <div
                className="fixed inset-0 bg-black/50 min-h-[100dvh]"
                onClick={() => {
                  setEditingItem(null)
                  setCreating(false)
                }}
                aria-hidden
              />
              <div
                className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => {
                  setEditingItem(null)
                  setCreating(false)
                }}
              >
                <div
                  className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {creating ? t('common.add') : t('admin.editEntity')} {editingItem ? `#${editingItem.id}` : ''}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null)
                        setCreating(false)
                      }}
                      className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
                      aria-label={t('common.close')}
                    >
                      <IconCross className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('character.title')} / {t('admin.name')}
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="input w-full"
                    />
                    <div className="pt-1 border-t border-gray-200">
                      <span className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('admin.translationsOptional')}
                      </span>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t('admin.translationsName')}
                          </label>
                          <TranslationsEditor value={nameI18n} onChange={setNameI18n} className="mt-1" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {t('admin.translationsDescription')}
                          </label>
                          <TranslationsEditor value={descriptionI18n} onChange={setDescriptionI18n} className="mt-1" />
                        </div>
                      </div>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">{t('character.description')}</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="input w-full min-h-[80px]"
                      rows={3}
                    />
                    <label className="block text-sm font-medium text-gray-700">{t('admin.avatarUrl')}</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={form.avatar}
                        onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                        className="input flex-1 min-w-[200px]"
                        placeholder="URL"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium cursor-pointer disabled:opacity-50">
                        <Upload className="w-4 h-4" />
                        {uploadingAvatar ? t('common.loading') : t('admin.uploadImage')}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUploadingAvatar(true)
                            try {
                              const { path } = await adminApi.uploadFile(file, 'image', {
                                baseName: buildUploadBaseName(form.name, 'character', editingItem?.id, 'avatar'),
                              })
                              setForm((f) => ({ ...f, avatar: path }))
                            } finally {
                              setUploadingAvatar(false)
                              e.target.value = ''
                            }
                          }}
                        />
                      </label>
                    </div>
                    {form.avatar.trim() && (
                      <div className="mt-1 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={getMediaAssetUrl(form.avatar.trim())} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="block text-sm font-medium text-gray-700">{t('media.gallery')}</label>
                    <div className="space-y-2">
                      {form.images.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 group">
                            <img src={getMediaAssetUrl(item.url)} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm transition-opacity"
                              aria-label={t('common.remove')}
                            >
                              {t('common.remove')}
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.caption}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  images: f.images.map((img, i) =>
                                    i === idx ? { ...img, caption: e.target.value } : img,
                                  ),
                                }))
                              }
                              className="input w-full text-sm"
                              placeholder={t('admin.imageCaption') || t('media.gallery')}
                            />
                          </div>
                        </div>
                      ))}
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium cursor-pointer disabled:opacity-50">
                        <Upload className="w-4 h-4" />
                        {uploadingGallery ? t('common.loading') : t('admin.uploadImage')}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUploadingGallery(true)
                            try {
                              const { path } = await adminApi.uploadFile(file, 'image', {
                                baseName: buildUploadBaseName(
                                  form.name,
                                  'character',
                                  editingItem?.id,
                                  'image',
                                  form.images.length + 1,
                                ),
                              })
                              setForm((f) => ({ ...f, images: [...f.images, { url: path, caption: '' }] }))
                            } finally {
                              setUploadingGallery(false)
                              e.target.value = ''
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null)
                        setCreating(false)
                      }}
                      className="btn-secondary"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving || !form.name.trim()}
                      className="btn-primary"
                    >
                      {saving ? t('common.loading') : t('common.save')}
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
