import { adminApi } from '@/api/admin'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import BaseModal from '@/components/ui/BaseModal'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import type { LocalizedString, Person } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { buildUploadBaseName } from '@/utils/uploadNames'
import { Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface PersonEditModalProps {
  open: boolean
  onClose: () => void
  person: Person | null
  onSaved?: (updated: Person) => void
}

export default function PersonEditModal({ open, onClose, person, onSaved }: PersonEditModalProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    country: '',
    biography: '',
    profession: '',
    avatar: '',
    images: [] as { url: string; caption: string; width?: number; height?: number }[],
  })
  const [firstNameI18n, setFirstNameI18n] = useState<LocalizedString>({})
  const [lastNameI18n, setLastNameI18n] = useState<LocalizedString>({})
  const [biographyI18n, setBiographyI18n] = useState<LocalizedString>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  useEffect(() => {
    if (!open || !person) return
    const prof = person.profession
    const imgs = person.images
    const normalizedImages = Array.isArray(imgs)
      ? imgs.map((x) => {
          if (typeof x === 'object' && x != null && 'url' in x) {
            const o = x as { url?: unknown; caption?: unknown; width?: unknown; height?: unknown }
            return {
              url: String(o.url ?? ''),
              caption: typeof o.caption === 'string' ? o.caption : '',
              width: typeof o.width === 'number' ? o.width : undefined,
              height: typeof o.height === 'number' ? o.height : undefined,
            }
          }
          return { url: String(x), caption: '' as string }
        })
      : []
    setFirstNameI18n(person.firstNameI18n ?? {})
    setLastNameI18n(person.lastNameI18n ?? {})
    setBiographyI18n(person.biographyI18n ?? {})
    setForm({
      firstName: person.firstName ?? '',
      lastName: person.lastName ?? '',
      birthDate: person.birthDate?.slice(0, 10) ?? '',
      country: person.country ?? '',
      biography: person.biography ?? '',
      profession: Array.isArray(prof) ? prof.join(', ') : typeof prof === 'string' ? prof : '',
      avatar: person.avatar ?? '',
      images: normalizedImages,
    })
  }, [open, person])

  useLockBodyScroll(open)

  const handleSave = async () => {
    if (!person?.id || saving) return
    setSaving(true)
    try {
      const firstI18n = Object.keys(firstNameI18n).length ? firstNameI18n : undefined
      const lastI18n = Object.keys(lastNameI18n).length ? lastNameI18n : undefined
      const bioI18n = Object.keys(biographyI18n).length ? biographyI18n : undefined
      const updated = await adminApi.updatePerson(person.id, {
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        birthDate: form.birthDate || undefined,
        country: form.country.trim() || undefined,
        biography: form.biography.trim() || undefined,
        profession: form.profession
          ? form.profession
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        avatar: form.avatar.trim() || undefined,
        images: form.images.length ? form.images : undefined,
        firstNameI18n: firstI18n,
        lastNameI18n: lastI18n,
        biographyI18n: bioI18n,
      })
      onSaved?.(updated)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BaseModal open={open} onClose={onClose} title={t('common.edit')} blockClose={saving}>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('person.firstName')}</label>
        <input
          type="text"
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          className="input w-full"
        />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('person.lastName')}</label>
        <input
          type="text"
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          className="input w-full"
        />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('person.birthDate')}</label>
        <input
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
          className="input w-full"
        />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.country')}</label>
        <input
          type="text"
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          className="input w-full"
        />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('person.biography')}</label>
        <textarea
          value={form.biography}
          onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))}
          className="input w-full min-h-[80px]"
          rows={3}
        />
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('admin.translationsOptional')} — {t('person.firstName')}
          </label>
          <TranslationsEditor value={firstNameI18n} onChange={setFirstNameI18n} className="mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('admin.translationsOptional')} — {t('person.lastName')}
          </label>
          <TranslationsEditor value={lastNameI18n} onChange={setLastNameI18n} className="mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('admin.translationsOptional')} — {t('person.biography')}
          </label>
          <TranslationsEditor value={biographyI18n} onChange={setBiographyI18n} className="mt-1" />
        </div>
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.professionHint')}</label>
        <input
          type="text"
          value={form.profession}
          onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
          className="input w-full"
          placeholder="actor, director"
        />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.avatarUrl')}</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={form.avatar}
            onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
            className="input flex-1 min-w-[200px]"
            placeholder="URL"
          />
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-surface)] text-[var(--theme-text)] text-sm font-medium cursor-pointer disabled:opacity-50">
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
                      person?.id,
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
          <div className="mt-1 w-24 h-24 rounded-lg overflow-hidden bg-[var(--theme-bg-alt)] border border-[var(--theme-border)]">
            <img src={getMediaAssetUrl(form.avatar.trim())} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('media.gallery')}</label>
        <div className="space-y-2">
          {form.images.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] shrink-0">
                <img src={getMediaAssetUrl(item.url)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                  className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-sm transition-opacity"
                  aria-label={t('common.remove')}
                >
                  {t('common.remove')}
                </button>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      images: f.images.map((img, i) => (i === idx ? { ...img, caption: e.target.value } : img)),
                    }))
                  }
                  className="input w-full text-sm"
                  placeholder={t('admin.imageCaption') || t('media.gallery')}
                />
                <div className="flex gap-2 items-center text-xs text-[var(--theme-text-muted)]">
                  <span>{t('admin.imageDimensions') || 'Размеры (для коллажа):'}</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ш"
                    value={item.width ?? ''}
                    onChange={(e) => {
                      const v = e.target.value ? Number.parseInt(e.target.value, 10) : undefined
                      setForm((f) => ({
                        ...f,
                        images: f.images.map((img, i) =>
                          i === idx ? { ...img, width: Number.isNaN(v as number) ? undefined : v } : img,
                        ),
                      }))
                    }}
                    className="input w-14 text-xs py-1"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="В"
                    value={item.height ?? ''}
                    onChange={(e) => {
                      const v = e.target.value ? Number.parseInt(e.target.value, 10) : undefined
                      setForm((f) => ({
                        ...f,
                        images: f.images.map((img, i) =>
                          i === idx ? { ...img, height: Number.isNaN(v as number) ? undefined : v } : img,
                        ),
                      }))
                    }}
                    className="input w-14 text-xs py-1"
                  />
                </div>
              </div>
            </div>
          ))}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-surface)] text-[var(--theme-text)] text-sm font-medium cursor-pointer disabled:opacity-50">
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
                  const res = await adminApi.uploadFile(file, 'image', {
                    baseName: buildUploadBaseName(
                      `${form.firstName} ${form.lastName}`.trim(),
                      'person',
                      person?.id,
                      'image',
                      form.images.length + 1,
                    ),
                  })
                  setForm((f) => ({
                    ...f,
                    images: [...f.images, { url: res.path, caption: '', width: res.width, height: res.height }],
                  }))
                } finally {
                  setUploadingGallery(false)
                  e.target.value = ''
                }
              }}
            />
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
          className="rounded-lg bg-space_indigo-600 text-lavender-500 font-medium hover:bg-space_indigo-700 transition-colors py-2 px-4 disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
        <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">
          {t('common.cancel')}
        </button>
      </div>
    </BaseModal>
  )
}
