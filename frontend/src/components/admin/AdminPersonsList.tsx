import { adminApi } from '@/api/admin'
import { personsApi } from '@/api/persons'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import { IconCross, IconPlus, IconSearch } from '@/components/icons'
import type { LocalizedString, Person } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { getPersonDisplayName } from '@/utils/personUtils'
import { buildUploadBaseName } from '@/utils/uploadNames'
import type { TFunction } from 'i18next'
import { Pencil, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

function personLabel(p: Person, t: TFunction, locale: string): string {
  const name = getPersonDisplayName(p, locale)
  const profArr = Array.isArray(p.profession) ? p.profession : p.profession ? [p.profession] : []
  const profStr = profArr
    .map((pr) => {
      const k = 'person.' + pr
      const tr = t(k)
      return tr !== k ? tr : pr
    })
    .join(', ')
  const extra = [p.country, profStr].filter(Boolean).join(' · ')
  return extra ? `${name} (${extra})` : name
}

export default function AdminPersonsList() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [items, setItems] = useState<Person[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Person | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    country: '',
    biography: '',
    profession: '',
    avatar: '',
    images: [] as { url: string; caption: string }[],
  })
  const [firstNameI18n, setFirstNameI18n] = useState<LocalizedString>({})
  const [lastNameI18n, setLastNameI18n] = useState<LocalizedString>({})
  const [biographyI18n, setBiographyI18n] = useState<LocalizedString>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [page, setPage] = useState(1)

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    const isNumeric = /^\d+$/.test(q)
    return items.filter((item) => {
      const idMatch = isNumeric && String(item.id).includes(q)
      const label = personLabel(item, t, locale).toLowerCase()
      const nameMatch = label.includes(q)
      return idMatch || nameMatch
    })
  }, [items, searchQuery, locale, t])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE
    return filteredItems.slice(start, start + ADMIN_PAGE_SIZE)
  }, [filteredItems, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const load = () => {
    setLoading(true)
    personsApi
      .getList(1, 200)
      .then((res) => setItems(res.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleStartEdit = (item: Person) => {
    setCreating(false)
    setEditingItem(item)
    const prof = item.profession
    const imgs = item.images
    const normalizedImages = Array.isArray(imgs)
      ? imgs.map((x) =>
          typeof x === 'object' && x != null && 'url' in x
            ? {
                url: String((x as { url: unknown }).url),
                caption:
                  typeof (x as { caption?: unknown }).caption === 'string' ? (x as { caption: string }).caption : '',
              }
            : { url: String(x), caption: '' },
        )
      : []
    setFirstNameI18n(item.firstNameI18n ?? {})
    setLastNameI18n(item.lastNameI18n ?? {})
    setBiographyI18n(item.biographyI18n ?? {})
    setForm({
      firstName: item.firstName ?? '',
      lastName: item.lastName ?? '',
      birthDate: item.birthDate?.slice(0, 10) ?? '',
      country: item.country ?? '',
      biography: item.biography ?? '',
      profession: Array.isArray(prof) ? prof.join(', ') : typeof prof === 'string' ? prof : '',
      avatar: item.avatar ?? '',
      images: normalizedImages,
    })
  }

  const handleStartCreate = () => {
    setEditingItem(null)
    setCreating(true)
    setFirstNameI18n({})
    setLastNameI18n({})
    setBiographyI18n({})
    setForm({
      firstName: '',
      lastName: '',
      birthDate: '',
      country: '',
      biography: '',
      profession: '',
      avatar: '',
      images: [],
    })
  }

  const handleSaveEdit = async () => {
    if (saving) return
    const professionArr = form.profession
      ? form.profession
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined
    const imagesArr = form.images.length ? form.images : undefined
    setSaving(true)
    try {
      const firstI18n = Object.keys(firstNameI18n).length ? firstNameI18n : undefined
      const lastI18n = Object.keys(lastNameI18n).length ? lastNameI18n : undefined
      const bioI18n = Object.keys(biographyI18n).length ? biographyI18n : undefined
      if (creating) {
        await adminApi.createPerson({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          birthDate: form.birthDate || undefined,
          country: form.country || undefined,
          biography: form.biography.trim() || undefined,
          profession: professionArr,
          avatar: form.avatar || undefined,
          images: imagesArr,
          firstNameI18n: firstI18n,
          lastNameI18n: lastI18n,
          biographyI18n: bioI18n,
        })
        setCreating(false)
      } else if (editingItem) {
        await adminApi.updatePerson(editingItem.id, {
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          birthDate: form.birthDate || undefined,
          country: form.country || undefined,
          biography: form.biography.trim() || undefined,
          profession: professionArr,
          avatar: form.avatar || undefined,
          images: imagesArr,
          firstNameI18n: firstI18n,
          lastNameI18n: lastI18n,
          biographyI18n: bioI18n,
        })
        setEditingItem(null)
      }
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.persons')}</h2>
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
          <ul className="space-y-2 pr-1">
            {paginatedItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border bg-white/90 border-gray-200 hover:border-lavender-200 hover:shadow transition-all"
              >
                <span className="text-gray-800 flex-1 min-w-0 truncate text-sm">
                  <span className="text-gray-400 text-xs mr-1">#{item.id}</span>
                  {personLabel(item, t, locale)}
                </span>
                <button
                  type="button"
                  onClick={() => handleStartEdit(item)}
                  className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-100 rounded-lg transition-colors shrink-0"
                  aria-label={t('common.edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
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
          {(editingItem || creating) && (
            <div className="modal-overlay-root fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0">
              <div
                className="absolute inset-0 bg-black/50 min-h-[100dvh]"
                onClick={() => {
                  setEditingItem(null)
                  setCreating(false)
                }}
                aria-hidden
              />
              <div className="min-h-[100dvh] flex items-center justify-center pt-4 px-4">
                <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-4 shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {creating ? t('common.add') : `${t('admin.editEntity')} #${editingItem!.id}`}
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
                    <label className="block text-sm font-medium text-gray-700">{t('person.firstName')}</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="input w-full"
                    />
                    <label className="block text-sm font-medium text-gray-700">{t('person.lastName')}</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="input w-full"
                    />
                    <label className="block text-sm font-medium text-gray-700">{t('person.birthDate')}</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                      className="input w-full"
                    />
                    <label className="block text-sm font-medium text-gray-700">{t('admin.country')}</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      className="input w-full"
                    />
                    <label className="block text-sm font-medium text-gray-700">{t('person.biography')}</label>
                    <textarea
                      value={form.biography}
                      onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))}
                      className="input w-full min-h-[80px]"
                      rows={3}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.translationsName')} (firstName)
                      </label>
                      <TranslationsEditor value={firstNameI18n} onChange={setFirstNameI18n} className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.translationsName')} (lastName)
                      </label>
                      <TranslationsEditor value={lastNameI18n} onChange={setLastNameI18n} className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.translationsDescription')} (biography)
                      </label>
                      <TranslationsEditor value={biographyI18n} onChange={setBiographyI18n} className="mt-1" />
                    </div>
                    <label className="block text-sm font-medium text-gray-700">{t('admin.professionHint')}</label>
                    <input
                      type="text"
                      value={form.profession}
                      onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
                      className="input w-full"
                      placeholder="actor, director"
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
                                baseName: buildUploadBaseName(
                                  `${form.firstName} ${form.lastName}`.trim(),
                                  'person',
                                  editingItem?.id,
                                  'avatar',
                                ),
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
                                  `${form.firstName} ${form.lastName}`.trim(),
                                  'person',
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
                      disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
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
