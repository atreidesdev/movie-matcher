import type { ListEntityType } from '@/api/lists'
import CustomSelect from '@/components/CustomSelect'
import { IconCross } from '@/components/icons'
import type { ListStatus } from '@/types'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const STATUS_OPTIONS: ListStatus[] = ['planned', 'watching', 'completed', 'onHold', 'dropped', 'rewatching']

const SERIES_TYPES: MediaTypeForPath[] = ['anime', 'tv-series', 'cartoon-series']

export interface AddToListModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (status: ListStatus, comment?: string, currentEpisode?: number) => Promise<void>
  title: string
  listType: ListEntityType
  type: MediaTypeForPath
  episodesCount?: number | null
}

export default function AddToListModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  listType,
  type,
  episodesCount,
}: AddToListModalProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<ListStatus>('planned')
  const [comment, setComment] = useState('')
  const [currentEpisode, setCurrentEpisode] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSeries = SERIES_TYPES.includes(type)
  const maxEpisode = episodesCount ?? 9999

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(status, comment.trim() || undefined, isSeries ? currentEpisode : undefined)
      onClose()
    } catch (error) {
      console.error('Failed to add to list:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="modal-panel rounded-xl border shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('media.addToListModalTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[var(--theme-text-muted)] text-sm mb-4 truncate" title={title}>
          {title}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CustomSelect
            label={t('media.listStatus.label')}
            value={status}
            onChange={(v) => setStatus(v as ListStatus)}
            options={STATUS_OPTIONS.map((val) => ({
              value: val,
              label: getListStatusLabel(t, listType, val),
            }))}
          />

          {isSeries && (
            <div>
              <label className="block text-sm font-medium text-[var(--theme-text)] mb-2">
                {t('media.currentEpisode')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxEpisode}
                  value={currentEpisode}
                  onChange={(e) =>
                    setCurrentEpisode(Math.min(maxEpisode, Math.max(0, Number.parseInt(e.target.value, 10) || 0)))
                  }
                  className="input w-24"
                />
                <span className="text-sm text-[var(--theme-text-muted)]">/ {episodesCount ?? '?'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--theme-text)] mb-2">
              {t('media.commentForList')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input w-full h-24 resize-none"
              placeholder={t('media.commentForListPlaceholder')}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-space_indigo-600 text-lavender-500 font-medium hover:bg-space_indigo-700 transition-colors py-2 px-4 disabled:opacity-50"
            >
              {isSubmitting ? t('media.addToListSubmitting') : t('media.addToList')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
