import { createPortal } from 'react-dom'
import { IconCross } from '@/components/icons'

export interface ReleaseScheduleData {
  day?: string
  time?: string
  episodes?: { episodeNumber: number; releaseDate: string }[]
}

interface MediaDetailScheduleSectionProps {
  releaseSchedule: ReleaseScheduleData | null | undefined
  scheduleModalOpen: boolean
  onCloseSchedule: () => void
  t: (key: string, params?: Record<string, unknown>) => string
}

export function MediaDetailScheduleSection({
  releaseSchedule,
  scheduleModalOpen,
  onCloseSchedule,
  t,
}: MediaDetailScheduleSectionProps) {
  const s = releaseSchedule
  const hasEpisodes = (s?.episodes?.length ?? 0) > 0
  if (!s || (!s.day && !s.time && !hasEpisodes)) return null

  const scheduleContent = (
    <div className="space-y-4">
      {(s.day != null && s.day !== '') || (s.time != null && s.time !== '') ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--theme-text)] mb-2">{t('media.releaseSchedule')}</h3>
          <table className="w-full text-sm border border-[var(--theme-border)] rounded-lg overflow-hidden">
            <tbody>
              {s.day != null &&
                s.day !== '' &&
                (() => {
                  const cap = String(s.day).charAt(0).toUpperCase() + String(s.day).slice(1).toLowerCase()
                  const dayKey = `media.day${cap}` as const
                  const translated = t(dayKey)
                  return (
                    <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/50">
                      <td className="px-3 py-2 text-[var(--theme-text-muted)] font-medium">
                        {t('media.releaseScheduleDay')}
                      </td>
                      <td className="px-3 py-2 text-[var(--theme-text)]">
                        {translated === dayKey ? s.day : translated}
                      </td>
                    </tr>
                  )
                })()}
              {s.time != null && s.time !== '' && (
                <tr className="bg-[var(--theme-bg-alt)]/50">
                  <td className="px-3 py-2 text-[var(--theme-text-muted)] font-medium">
                    {t('media.releaseScheduleTime')}
                  </td>
                  <td className="px-3 py-2 text-[var(--theme-text)]">{s.time}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}
      {hasEpisodes && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--theme-text)] mb-2">{t('media.episodeSchedule')}</h3>
          <div className="schedule-episodes-inner schedule-modal-scroll max-h-[min(50vh,20rem)] overflow-y-auto rounded-lg border border-[var(--theme-border)] text-sm">
            <div className="sticky top-0 z-10 flex gap-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-alt)] px-3 py-2">
              <span className="min-w-[5rem] font-medium text-[var(--theme-text-muted)]">
                {t('media.episodeNumber')}
              </span>
              <span className="font-medium text-[var(--theme-text-muted)]">{t('media.episodeReleaseDate')}</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {s.episodes!.map((ep) => (
                <li key={ep.episodeNumber} className="flex gap-6 px-3 py-2">
                  <span className="min-w-[5rem] text-[var(--theme-text)]">{ep.episodeNumber}</span>
                  <span className="text-[var(--theme-text-muted)]">
                    {new Date(ep.releaseDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )

  if (!scheduleModalOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('media.releaseSchedule')}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCloseSchedule} aria-hidden />
      <div className="schedule-episodes-scroll schedule-modal-scroll relative w-full sm:max-w-lg sm:w-full max-h-[85vh] overflow-y-auto bg-[var(--theme-bg)] rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--theme-text)]">{t('media.releaseSchedule')}</h2>
          <button
            type="button"
            onClick={onCloseSchedule}
            className="p-2 rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-text)] transition-colors"
            aria-label={t('common.close')}
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>
        {scheduleContent}
      </div>
    </div>,
    document.body
  )
}
