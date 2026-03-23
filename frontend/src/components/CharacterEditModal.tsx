import { adminApi } from '@/api/admin'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import BaseModal from '@/components/ui/BaseModal'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import type { Character, LocalizedString } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { buildUploadBaseName } from '@/utils/uploadNames'
import { Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface CharacterEditModalProps {
  open: boolean
  onClose: () => void
  character: Character | null
  onSaved?: (updated: Character) => void
}

export default function CharacterEditModal({ open, onClose, character, onSaved }: CharacterEditModalProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    avatar: '',
    images: [] as { url: string; caption: string; width?: number; height?: number }[],
  })
  const [nameI18n, setNameI18n] = useState<LocalizedString>({})
  const [descriptionI18n, setDescriptionI18n] = useState<LocalizedString>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  useEffect(() => {
    if (!open || !character) return
    const imgs = character.images
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
          return { url: String(x), caption: '' }
        })
      : []
    setNameI18n(character.nameI18n ?? {})
    setDescriptionI18n(character.descriptionI18n ?? {})
    setForm({
      name: character.name ?? '',
      description: character.description ?? '',
      avatar: character.avatar ?? '',
      images: normalizedImages,
    })
  }, [open, character])

  useLockBodyScroll(open)

  const handleSave = async () => {
    if (!character?.id || saving) return
    setSaving(true)
    try {
      const nameI18nPayload = Object.keys(nameI18n).length ? nameI18n : undefined
      const descriptionI18nPayload = Object.keys(descriptionI18n).length ? descriptionI18n : undefined
      const updated = await adminApi.updateCharacter(character.id, {
        name: form.name.trim() || undefined,
        description: form.description.trim() || undefined,
        avatar: form.avatar.trim() || undefined,
        images: form.images.length ? form.images : undefined,
        nameI18n: nameI18nPayload,
        descriptionI18n: descriptionI18nPayload,
      })
      onSaved?.(updated as Character)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BaseModal open={open} onClose={onClose} title={t('common.edit')} blockClose={saving}>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--theme-text)]">
          {t('character.title')} / {t('admin.name')}
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="input w-full"
        />
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('admin.translationsName')}
          </label>
          <TranslationsEditor value={nameI18n} onChange={setNameI18n} className="mt-1" />
        </div>
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('character.description')}</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="input w-full min-h-[80px]"
          rows={3}
        />
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('admin.translationsDescription')}
          </label>
          <TranslationsEditor value={descriptionI18n} onChange={setDescriptionI18n} className="mt-1" />
        </div>
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.avatarUrl')}</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={form.avatar}
            onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
            className="input flex-1 min-w-[200px]"
            placeholder="URL"
          />
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-theme-bg-alt hover:bg-theme-surface text-[var(--theme-text)] text-sm font-medium cursor-pointer disabled:opacity-50">
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
                    baseName: buildUploadBaseName(form.name, 'character', character?.id, 'avatar'),
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
          <div className="mt-1 w-24 h-24 rounded-lg overflow-hidden bg-theme-bg-alt border border-theme">
            <img src={getMediaAssetUrl(form.avatar.trim())} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('media.gallery')}</label>
        <div className="space-y-2">
          {form.images.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-theme-bg-alt border border-theme shrink-0 group">
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
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-theme-bg-alt hover:bg-theme-surface text-[var(--theme-text)] text-sm font-medium cursor-pointer disabled:opacity-50">
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
                      form.name,
                      'character',
                      character?.id,
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
          disabled={saving || !form.name.trim()}
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
