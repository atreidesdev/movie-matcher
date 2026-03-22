import { useEffect, useRef, useState } from 'react'
import { IconCross, IconArrowDown } from '@/components/icons'
import CustomSelect from '@/components/CustomSelect'
import { useTranslation } from 'react-i18next'
import {
  ListItem,
  ListStatus,
  ReviewStatus,
  REVIEW_STATUS_EMOJIS,
  TITLE_REACTION_TO_REVIEW_STATUS,
  REVIEW_STATUS_TO_TITLE_REACTION,
  Media,
} from '@/types'
import ReviewStatusDisplay from '@/components/ReviewStatusDisplay'
import { MediaTypeForPath } from '@/utils/mediaPaths'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getMediaEpisodesCount, getMediaPages, getMediaVolumesList } from '@/utils/typeGuards'
import { formatListDate } from '@/utils/formatListDate'

const LIST_STATUS_OPTIONS: { value: ListStatus; labelKey: string }[] = [
  { value: 'planned', labelKey: 'media.listStatus.planned' },
  { value: 'watching', labelKey: 'media.listStatus.watching' },
  { value: 'completed', labelKey: 'media.listStatus.completed' },
  { value: 'onHold', labelKey: 'media.listStatus.onHold' },
  { value: 'dropped', labelKey: 'media.listStatus.dropped' },
  { value: 'rewatching', labelKey: 'media.listStatus.rewatching' },
]

const SERIES_LIST_TYPES: MediaTypeForPath[] = ['anime', 'tv-series', 'cartoon-series']

export interface EditInListModalProps {
  isOpen: boolean
  onClose: () => void
  listItem: ListItem
  media: Media
  type: MediaTypeForPath
  /** Название списка для отображения в шапке (например «Фильмы», «Аниме») */
  listName?: string
  onSave: (data: Partial<ListItem>) => Promise<void>
  onRemove: () => void
}

export default function EditInListModal({
  isOpen,
  onClose,
  listItem,
  media,
  type,
  listName,
  onSave,
  onRemove,
}: EditInListModalProps) {
  const { t } = useTranslation()
  const [editStatus, setEditStatus] = useState<ListStatus>(listItem.status ?? 'planned')
  const [editComment, setEditComment] = useState(listItem.comment ?? '')
  const [editRating, setEditRating] = useState<number | undefined>(listItem.rating)
  const [editTitleReaction, setEditTitleReaction] = useState<ReviewStatus | ''>(
    (listItem.titleReaction &&
      TITLE_REACTION_TO_REVIEW_STATUS[listItem.titleReaction as keyof typeof TITLE_REACTION_TO_REVIEW_STATUS]) ??
      ''
  )
  const [editCurrentEpisode, setEditCurrentEpisode] = useState(listItem.currentEpisode ?? 0)
  const [editCurrentPage, setEditCurrentPage] = useState(listItem.currentPage ?? 0)
  const [editCurrentVolume, setEditCurrentVolume] = useState(listItem.currentVolume ?? 0)
  const [editCurrentChapter, setEditCurrentChapter] = useState(listItem.currentChapter ?? 0)
  const [editCurrentVolumeNumber, setEditCurrentVolumeNumber] = useState(listItem.currentVolumeNumber ?? 0)
  const [editCurrentChapterNumber, setEditCurrentChapterNumber] = useState(listItem.currentChapterNumber ?? 0)
  const [editHoursPlayed, setEditHoursPlayed] = useState<number>(
    listItem.totalTime != null ? Math.round((listItem.totalTime / 60) * 10) / 10 : 0
  )
  const [showEpisodePicker, setShowEpisodePicker] = useState(false)
  const episodePickerListRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setEditStatus(listItem.status ?? 'planned')
    setEditComment(listItem.comment ?? '')
    setEditRating(listItem.rating)
    setEditTitleReaction(
      (listItem.titleReaction &&
        TITLE_REACTION_TO_REVIEW_STATUS[listItem.titleReaction as keyof typeof TITLE_REACTION_TO_REVIEW_STATUS]) ??
        ''
    )
    setEditCurrentEpisode(listItem.currentEpisode ?? 0)
    setEditCurrentPage(listItem.currentPage ?? 0)
    setEditCurrentVolume(listItem.currentVolume ?? 0)
    setEditCurrentChapter(listItem.currentChapter ?? 0)
    setEditCurrentVolumeNumber(listItem.currentVolumeNumber ?? 0)
    setEditCurrentChapterNumber(listItem.currentChapterNumber ?? 0)
    setEditHoursPlayed(listItem.totalTime != null ? Math.round((listItem.totalTime / 60) * 10) / 10 : 0)
  }, [isOpen, listItem])

  useEffect(() => {
    if (showEpisodePicker && episodePickerListRef.current) {
      const el = episodePickerListRef.current.querySelector(`[data-episode="${editCurrentEpisode}"]`)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [showEpisodePicker, editCurrentEpisode])

  useEffect(() => {
    if (!showStatusDropdown) return
    const onDocClick = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showStatusDropdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        status: editStatus,
        comment: editComment || undefined,
        rating: editRating,
        titleReaction: editTitleReaction ? REVIEW_STATUS_TO_TITLE_REACTION[editTitleReaction] : undefined,
        ...(SERIES_LIST_TYPES.includes(type) ? { currentEpisode: editCurrentEpisode } : {}),
        ...(type === 'book'
          ? {
              currentPage: bookMaxPages != null ? Math.min(editCurrentPage, bookMaxPages) : editCurrentPage,
              maxPages: bookMaxPages,
            }
          : {}),
        ...(type === 'manga' ? { currentVolume: editCurrentVolume, currentChapter: editCurrentChapter } : {}),
        ...(type === 'light-novel'
          ? { currentVolumeNumber: editCurrentVolumeNumber, currentChapterNumber: editCurrentChapterNumber }
          : {}),
        ...(type === 'game' ? { hoursPlayed: editHoursPlayed || undefined } : {}),
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = () => {
    if (window.confirm(t('media.removeFromListConfirm'))) {
      onRemove()
      onClose()
    }
  }

  const handleMarkRewatched = async () => {
    setIsSaving(true)
    try {
      await onSave({
        status: 'completed',
        markRewatched: true,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const episodesCount = getMediaEpisodesCount(media)
  const maxEpisodesForPicker = 200
  const useEpisodePicker = episodesCount != null && episodesCount <= maxEpisodesForPicker && episodesCount >= 0
  const volumesList = getMediaVolumesList(media)
  const bookMaxPages = getMediaPages(media) ?? listItem.maxPages
  const rewatchSessions = listItem.rewatchSessions ?? []
  const isFilmType = type === 'movie' || type === 'cartoon-movies' || type === 'anime-movies'
  const isGameType = type === 'game'
  const isBookType = type === 'book' || type === 'manga' || type === 'light-novel'
  const watchedAt = listItem.completedAt ?? listItem.startedAt
  const sessionsTitleKey = isGameType ? 'lists.playthroughs' : isBookType ? 'lists.rereadSessions' : 'lists.rewatchSessions'
  const sessionItemKey = isGameType ? 'lists.playthroughSession' : isBookType ? 'lists.rereadSession' : 'lists.rewatchSession'
  const hideCompletedForGameOrBook = isGameType || isBookType

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="modal-panel rounded-xl border shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-theme shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-theme">{t('media.editListEntry')}</h2>
            {listName && <p className="text-xs text-theme-muted mt-0.5">{t('media.listName', { name: listName })}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:bg-theme-surface hover:text-theme"
            aria-label={t('common.close')}
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-y-auto px-4 pt-3 pb-8 space-y-3 flex-1">
            {/* Статус + Оценка в одну строку */}
            <div className="grid grid-cols-2 gap-3">
              <div ref={statusDropdownRef} className="relative">
                <label className="block text-xs font-medium text-theme-muted mb-0.5">
                  {t('media.listStatus.label')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowStatusDropdown((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showStatusDropdown}
                  aria-label={t('media.listStatus.label')}
                  className="input w-full py-1.5 text-sm text-left flex items-center justify-between gap-2 text-lavender-500"
                >
                  <span>{getListStatusLabel(t, type, editStatus ?? 'planned')}</span>
                  <IconArrowDown
                    className={`w-4 h-4 shrink-0 text-lavender-500 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                {showStatusDropdown && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border dropdown-list-panel shadow-lg py-1"
                  >
                    {LIST_STATUS_OPTIONS.map((opt) => {
                      const isSelected = editStatus === opt.value
                      return (
                        <li
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setEditStatus(opt.value)
                            setShowStatusDropdown(false)
                          }}
                          className={`cursor-pointer px-4 py-2 text-sm ${isSelected ? 'bg-lavender-500 text-theme' : 'text-theme hover:bg-lavender-500/40'}`}
                        >
                          {getListStatusLabel(t, type, opt.value)}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-theme-muted mb-0.5">{t('media.listRating')}</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editRating ?? ''}
                  onChange={(e) =>
                    setEditRating(e.target.value ? Math.min(100, Math.max(1, parseInt(e.target.value, 10))) : undefined)
                  }
                  placeholder="1–100"
                  className="input w-full py-1.5 text-sm"
                />
              </div>
            </div>

            {isFilmType ? (
              watchedAt ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-theme-muted">
                  <span>
                    {t('lists.watchedAt')}: {formatListDate(watchedAt)}
                  </span>
                </div>
              ) : null
            ) : (
              (listItem.startedAt || listItem.completedAt) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-theme-muted">
                  {listItem.startedAt && (
                    <span>
                      {t('lists.startedAt')}: {formatListDate(listItem.startedAt)}
                    </span>
                  )}
                  {listItem.completedAt && (
                    <span>
                      {t('lists.completedAt')}: {formatListDate(listItem.completedAt)}
                    </span>
                  )}
                </div>
              )
            )}

            {rewatchSessions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-theme-muted">{t(sessionsTitleKey)}</div>
                <div className="flex flex-col gap-2">
                  {rewatchSessions.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-lavender-400/40 bg-space_indigo-500/10 px-2 py-1.5"
                    >
                      <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-md bg-lavender-600 text-theme text-xs font-semibold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-[var(--theme-text-muted)]">
                          {t(sessionItemKey, { num: idx + 1 })}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--theme-text-muted)]">
                          {isFilmType ? (
                            <span className="whitespace-nowrap">
                              {t('lists.watchedAt')}: {formatListDate(s.completedAt ?? s.startedAt) || '—'}
                            </span>
                          ) : (
                            <>
                              {s.startedAt && (
                                <span className="whitespace-nowrap">
                                  {t('lists.startedAt')}: {formatListDate(s.startedAt)}
                                </span>
                              )}
                              {!hideCompletedForGameOrBook && (
                                <span className="whitespace-nowrap">
                                  {t('lists.completedAt')}: {s.completedAt ? formatListDate(s.completedAt) : '—'}
                                </span>
                              )}
                              {hideCompletedForGameOrBook && s.completedAt && (
                                <span className="whitespace-nowrap">
                                  {t('lists.completedAt')}: {formatListDate(s.completedAt)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Реакция на тайтл — как в рецензиях */}
            <div>
              <label className="block text-xs font-medium text-theme-muted mb-1">{t('media.titleReaction')}</label>
              <div className="review-reaction-buttons flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditTitleReaction('')}
                  title={t('media.reviewStatus.neutral', { defaultValue: 'Neutral' })}
                  className={`rounded-lg p-2 transition-colors duration-150 flex items-center justify-center w-11 h-11 shrink-0 ${editTitleReaction === '' ? 'review-reaction-btn--selected ' : ''}${
                    editTitleReaction === ''
                      ? 'bg-lavender-600 ring-2 ring-lavender-400 shadow-sm hover:bg-lavender-400 hover:ring-2 hover:ring-lavender-300 hover:shadow-md'
                      : 'bg-lavender-800 hover:bg-lavender-500'
                  }`}
                >
                  <span
                    className={`text-3xl leading-none ${editTitleReaction === '' ? 'text-lavender-200' : 'text-lavender-400'}`}
                  >
                    —
                  </span>
                </button>
                {REVIEW_STATUS_EMOJIS.map(({ value }) => {
                  const isSelected = editTitleReaction === value
                  const reactionLabel = t(`media.reviewStatus.${value}`, { defaultValue: value })
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEditTitleReaction(isSelected ? '' : value)}
                      title={reactionLabel}
                      aria-label={reactionLabel}
                      className={`rounded-lg p-2 transition-colors duration-150 flex items-center justify-center w-11 h-11 shrink-0 ${isSelected ? 'review-reaction-btn--selected ' : ''}${
                        isSelected
                          ? 'bg-lavender-600 ring-2 ring-lavender-400 shadow-sm hover:bg-lavender-400 hover:ring-2 hover:ring-lavender-300 hover:shadow-md'
                          : 'bg-lavender-800 hover:bg-lavender-500'
                      }`}
                    >
                      <ReviewStatusDisplay
                        reviewStatus={value}
                        size={28}
                        title={reactionLabel}
                        className={isSelected ? 'text-lavender-200' : 'text-lavender-400'}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Серии: пикер с прокруткой по клику на число (или инпут при большом количестве серий) */}
            {SERIES_LIST_TYPES.includes(type) && (episodesCount != null || type === 'anime') && (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-theme-muted shrink-0 w-24">
                    {t('media.currentEpisode')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditCurrentEpisode((e) => Math.max(0, e - 1))}
                    className="btn-secondary w-8 h-8 flex items-center justify-center p-0 text-sm shrink-0"
                  >
                    −
                  </button>
                  {useEpisodePicker ? (
                    <button
                      type="button"
                      onClick={() => setShowEpisodePicker((v) => !v)}
                      className="input w-14 py-1.5 text-center text-sm flex items-center justify-center gap-0.5 min-h-[34px]"
                    >
                      <span>{editCurrentEpisode}</span>
                      <IconArrowDown
                        className={`w-4 h-4 text-theme-muted shrink-0 transition-transform ${showEpisodePicker ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      max={episodesCount ?? 9999}
                      value={editCurrentEpisode}
                      onChange={(e) => setEditCurrentEpisode(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="input w-14 py-1 text-center text-sm"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setEditCurrentEpisode((e) => Math.min(episodesCount ?? 9999, e + 1))}
                    className="btn-secondary w-8 h-8 flex items-center justify-center p-0 text-sm shrink-0"
                  >
                    +
                  </button>
                  <span className="text-xs text-theme-muted shrink-0">/ {episodesCount ?? '?'}</span>
                </div>
                {showEpisodePicker && useEpisodePicker && (
                  <>
                    <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowEpisodePicker(false)} />
                    <div
                      ref={episodePickerListRef}
                      className="absolute left-0 top-full mt-1 z-20 w-20 max-h-48 overflow-y-auto overscroll-contain rounded-lg border dropdown-list-panel shadow-lg py-1 touch-pan-y"
                    >
                      {Array.from({ length: (episodesCount ?? 0) + 1 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          data-episode={i}
                          onClick={() => {
                            setEditCurrentEpisode(i)
                            setShowEpisodePicker(false)
                          }}
                          className={`w-full py-2 text-center text-sm hover:bg-theme-surface touch-manipulation ${editCurrentEpisode === i ? 'bg-lavender-500/40 text-theme font-medium' : ''}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Игры: часы в игре */}
            {type === 'game' && (
              <div>
                <label className="block text-xs font-medium text-theme-muted mb-0.5">{t('media.hoursPlayed')}</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={editHoursPlayed || ''}
                  onChange={(e) =>
                    setEditHoursPlayed(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  placeholder="0"
                  className="input w-full py-1.5 text-sm"
                />
              </div>
            )}

            {/* Книга: страницы */}
            {type === 'book' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-muted mb-0.5">{t('media.maxPages')}</label>
                  <input type="text" value={bookMaxPages ?? '—'} readOnly className="input w-full py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-theme-muted mb-0.5">{t('media.currentPage')}</label>
                  <input
                    type="number"
                    min={0}
                    max={bookMaxPages ?? 99999}
                    value={editCurrentPage}
                    onChange={(e) => setEditCurrentPage(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input w-full py-1.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Ранобэ */}
            {type === 'light-novel' && (
              <div className="grid grid-cols-2 gap-3">
                {volumesList.length > 0 ? (
                  <CustomSelect
                    label={t('media.volume')}
                    value={String(editCurrentVolumeNumber)}
                    onChange={(v) => {
                      const num = parseInt(v, 10) || 0
                      setEditCurrentVolumeNumber(num)
                      setEditCurrentChapterNumber(0)
                    }}
                    options={volumesList.map((_, i) => ({
                      value: String(i),
                      label: t('media.volumeNum', { num: i + 1 }),
                    }))}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-theme-muted mb-0.5">{t('media.volume')}</label>
                    <input
                      type="number"
                      min={0}
                      value={editCurrentVolumeNumber}
                      onChange={(e) => setEditCurrentVolumeNumber(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="input w-full py-1.5 text-sm"
                    />
                  </div>
                )}
                {volumesList[editCurrentVolumeNumber]?.chapters != null ? (
                  <CustomSelect
                    label={t('media.chapter')}
                    value={String(editCurrentChapterNumber)}
                    onChange={(v) => setEditCurrentChapterNumber(parseInt(v, 10) || 0)}
                    options={Array.from({ length: volumesList[editCurrentVolumeNumber]?.chapters ?? 1 }, (_, i) => ({
                      value: String(i),
                      label: t('media.chapterNum', { num: i + 1 }),
                    }))}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-theme-muted mb-0.5">{t('media.chapter')}</label>
                    <input
                      type="number"
                      min={0}
                      value={editCurrentChapterNumber}
                      onChange={(e) => setEditCurrentChapterNumber(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="input w-full py-1.5 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Манга */}
            {type === 'manga' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-muted mb-0.5">
                    {t('media.currentVolume')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editCurrentVolume}
                    onChange={(e) => setEditCurrentVolume(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input w-full py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-theme-muted mb-0.5">
                    {t('media.currentChapter')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editCurrentChapter}
                    onChange={(e) => setEditCurrentChapter(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input w-full py-1.5 text-sm"
                  />
                </div>
              </div>
            )}

            {(type === 'movie' || type === 'cartoon-movies' || type === 'anime-movies') && (
              <div className="space-y-2">
                <p className="text-xs text-theme-muted">{t('media.listWatchedHint')}</p>
                <button
                  type="button"
                  onClick={handleMarkRewatched}
                  disabled={isSaving}
                  className="w-full sm:w-auto py-2 px-3 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/15"
                  title={t('lists.markRewatched')}
                >
                  {t('lists.markRewatched')}
                </button>
              </div>
            )}

            {/* Комментарий */}
            <div>
              <label className="block text-xs font-medium text-theme-muted mb-0.5">{t('media.commentForList')}</label>
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="input w-full h-16 resize-none text-sm py-1.5"
                placeholder={t('media.commentForListPlaceholder')}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-theme shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 min-w-[140px] py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)]"
            >
              {isSaving ? t('common.saving') : t('media.saveListChanges')}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="py-2 px-4 text-sm rounded-lg font-medium transition-colors border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] hover:bg-[var(--theme-bg-alt)]"
              title={t('media.removeFromList')}
            >
              {t('media.removeFromList')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
