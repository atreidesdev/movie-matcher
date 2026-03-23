import { adminApi } from '@/api/admin'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import BaseModal from '@/components/ui/BaseModal'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import type { Developer, LocalizedString } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { buildUploadBaseName } from '@/utils/uploadNames'
import { Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface DeveloperEditModalProps {
  open: boolean
  onClose: () => void
  developer: Developer | null
  onSaved?: (updated: Developer) => void
}

export default function DeveloperEditModal({ open, onClose, developer, onSaved }: DeveloperEditModalProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editPoster, setEditPoster] = useState('')
  const [editNameI18n, setEditNameI18n] = useState<LocalizedString>({})
  const [editDescriptionI18n, setEditDescriptionI18n] = useState<LocalizedString>({})
  const [uploadingPoster, setUploadingPoster] = useState(false)

  useEffect(() => {
    if (!open || !developer) return
    setEditName(developer.name)
    setEditDescription(developer.description ?? '')
    setEditCountry(developer.country ?? '')
    setEditPoster(developer.poster ?? '')
    setEditNameI18n(developer.nameI18n ?? {})
    setEditDescriptionI18n(developer.descriptionI18n ?? {})
  }, [open, developer])

  useLockBodyScroll(open)

  const handleSave = async () => {
    if (!developer?.id || saving || !editName.trim()) return
    setSaving(true)
    try {
      const nameI18n = Object.keys(editNameI18n).length ? editNameI18n : undefined
      const descriptionI18n = Object.keys(editDescriptionI18n).length ? editDescriptionI18n : undefined
      const updated = await adminApi.updateDeveloper(developer.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        country: editCountry.trim() || undefined,
        poster: editPoster.trim() || undefined,
        nameI18n,
        descriptionI18n,
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
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.name')}</label>
        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input w-full" />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.description')}</label>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="input w-full min-h-[80px]"
          rows={3}
        />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.country')}</label>
        <input
          type="text"
          value={editCountry}
          onChange={(e) => setEditCountry(e.target.value)}
          className="input w-full"
        />
        <label className="block text-sm font-medium text-[var(--theme-text)]">{t('admin.poster')}</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={editPoster}
            onChange={(e) => setEditPoster(e.target.value)}
            className="input flex-1 min-w-[200px]"
            placeholder="URL"
          />
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-theme-bg-alt hover:bg-theme-surface text-[var(--theme-text)] text-sm font-medium cursor-pointer disabled:opacity-50">
            <Upload className="w-4 h-4" />
            {uploadingPoster ? t('common.loading') : t('admin.uploadImage')}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingPoster(true)
                try {
                  const { path } = await adminApi.uploadFile(file, 'poster', {
                    baseName: buildUploadBaseName(editName, 'developer', developer?.id, 'poster'),
                  })
                  setEditPoster(path)
                } finally {
                  setUploadingPoster(false)
                  e.target.value = ''
                }
              }}
            />
          </label>
        </div>
        {editPoster.trim() && (
          <div className="mt-1 w-24 h-32 rounded-lg overflow-hidden bg-theme-bg-alt border border-theme">
            <img src={getMediaAssetUrl(editPoster.trim())} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('admin.translationsName')}
          </label>
          <TranslationsEditor value={editNameI18n} onChange={setEditNameI18n} className="mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('admin.translationsDescription')}
          </label>
          <TranslationsEditor value={editDescriptionI18n} onChange={setEditDescriptionI18n} className="mt-1" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !editName.trim()}
          className="rounded-lg bg-space_indigo-600 text-lavender-500 font-medium hover:bg-space_indigo-700 transition-colors py-2 px-4 disabled:opacity-50"
        >
          {t('common.save')}
        </button>
        <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">
          {t('common.cancel')}
        </button>
      </div>
    </BaseModal>
  )
}
