import { getCalendarReleases } from '@/api/calendar'
import { IconCross } from '@/components/icons'
import { getListStatusBadgeClasses, getListStatusIcon } from '@/components/icons'
import type { CalendarRelease } from '@/types'
import type { ListStatus } from '@/types'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { getMediaTitle } from '@/utils/localizedText'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaAssetUrl, getMediaPath } from '@/utils/mediaPaths'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const CALENDAR_MEDIA_TYPES: { value: MediaTypeForPath; labelKey: string }[] = [
  { value: 'movie', labelKey: 'nav.movies' },
  { value: 'anime', labelKey: 'nav.anime' },
  { value: 'anime-movies', labelKey: 'nav.animeMovies' },
  { value: 'tv-series', labelKey: 'nav.tvSeries' },
  { value: 'cartoon-series', labelKey: 'nav.cartoonSeries' },
  { value: 'cartoon-movies', labelKey: 'nav.cartoonMovies' },
  { value: 'game', labelKey: 'nav.games' },
  { value: 'manga', labelKey: 'nav.manga' },
  { value: 'book', labelKey: 'nav.books' },
  { value: 'light-novel', labelKey: 'nav.lightNovels' },
]

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] // воскресенье = 0, понедельник = 1 ...

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

/** Сетка календаря: всегда 6 недель × 7 дней (42 ячейки). Ячейка — день (1..31) или null. */
function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const startWeekday = first.getDay()
  const daysInMonth = last.getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const total = 6 * 7
  while (cells.length < total) cells.push(null)
  const grid: (number | null)[][] = []
  for (let r = 0; r < 6; r++) grid.push(cells.slice(r * 7, (r + 1) * 7))
  return grid
}

function groupReleasesByDate(releases: CalendarRelease[]): Record<string, CalendarRelease[]> {
  const byDate: Record<string, CalendarRelease[]> = {}
  for (const r of releases) {
    const d = r.releaseDate
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(r)
  }
  return byDate
}

/** Диапазон недели для заголовка: "15 марта - 21 марта" */
function formatWeekRange(year: number, month: number, row: (number | null)[]): string {
  const days = row.filter((d): d is number => d !== null)
  if (days.length === 0) return ''
  const min = Math.min(...days)
  const max = Math.max(...days)
  const locale = undefined // браузерный
  const fmt = (d: number) => new Date(year, month - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`
}

interface DayCellProps {
  day: number | null
  year: number
  month: number
  releases: CalendarRelease[]
  mediaType: string
  isMobile?: boolean
  onReleaseClick?: (release: CalendarRelease) => void
}

function DayCell({ day, year: _year, month: _month, releases, mediaType, isMobile, onReleaseClick }: DayCellProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  if (day === null) {
    return <div className="calendar-day-empty h-full min-h-[200px] rounded-lg" />
  }

  const dayReleases = releases.slice(0, 20)
  const handleCardClick = (item: CalendarRelease, e: React.MouseEvent) => {
    if (isMobile && onReleaseClick) {
      e.preventDefault()
      onReleaseClick(item)
    }
  }

  // Единая высота блока дня: фиксированная, контент скроллится
  return (
    <div className="calendar-day-cell h-full flex flex-col rounded-lg border p-2 overflow-hidden min-h-0">
      <div className="calendar-day-num text-sm font-semibold mb-2 shrink-0">{day}</div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {dayReleases.length === 0 ? (
          <span className="calendar-day-empty-text text-xs">—</span>
        ) : (
          dayReleases.map((item) => {
            const status = item.listStatus as ListStatus | undefined
            const StatusIcon = status ? getListStatusIcon(status, mediaType) : null
            const badgeClasses = status ? getListStatusBadgeClasses(status, mediaType) : null
            return (
              <Link
                key={item.id}
                to={getMediaPath(mediaType as MediaTypeForPath, item.id, item.title)}
                onClick={(e) => handleCardClick(item, e)}
                className="calendar-day-card block w-full rounded-lg overflow-hidden border transition-all group"
              >
                <div className="calendar-day-card-cover calendar-card media-card-cover w-full aspect-[2/3] relative">
                  {StatusIcon && badgeClasses && (
                    <div
                      className={`absolute top-2 left-2 z-10 w-10 h-10 rounded-lg flex items-center justify-center ${badgeClasses.bg} ${badgeClasses.text}`}
                      title={getListStatusLabel(t, mediaType, item.listStatus!)}
                    >
                      <StatusIcon size={20} className="shrink-0" />
                    </div>
                  )}
                  <span className="image-link">
                    {item.poster ? (
                      <img
                        src={getMediaAssetUrl(item.poster)}
                        alt=""
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="calendar-day-card-placeholder absolute inset-0 flex items-center justify-center text-3xl">
                        —
                      </div>
                    )}
                  </span>
                  <div className="media-card-overlay">
                    <span className="overlay-title">{getMediaTitle(item, locale) || item.title}</span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
        {releases.length > dayReleases.length && (
          <div className="calendar-day-more text-xs pt-1">+{releases.length - dayReleases.length}</div>
        )}
      </div>
    </div>
  )
}

export default function Calendar() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [mediaType, setMediaType] = useState<MediaTypeForPath>('movie')
  const [releases, setReleases] = useState<CalendarRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [modalRelease, setModalRelease] = useState<CalendarRelease | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [onlyFromList, setOnlyFromList] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const { from, to } = useMemo(() => getMonthRange(year, month), [year, month])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCalendarReleases(from, to, mediaType)
      .then((res) => {
        if (!cancelled) setReleases(res.releases || [])
      })
      .catch(() => {
        if (!cancelled) setReleases([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [from, to, mediaType])

  const filteredReleases = useMemo(
    () => (onlyFromList ? releases.filter((r) => r.listStatus != null) : releases),
    [releases, onlyFromList],
  )
  const byDate = useMemo(() => groupReleasesByDate(filteredReleases), [filteredReleases])
  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month])

  const monthName = useMemo(() => {
    const d = new Date(year, month - 1, 1)
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [year, month])

  const goPrev = () => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const goNext = () => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const weekDayLabels = useMemo(() => {
    return WEEKDAYS.map((wd) => {
      const d = new Date(2024, 0, 7 + wd)
      return d.toLocaleDateString(undefined, { weekday: 'short' })
    })
  }, [])

  const openReleasePath = modalRelease ? getMediaPath(mediaType, modalRelease.id, modalRelease.title) : ''

  return (
    <div className="calendar-page max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      <h1 className="calendar-title text-2xl font-bold">{t('calendar.title')}</h1>

      {/* Модалка на мобильном: по нажатию на название */}
      {modalRelease && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setModalRelease(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t('calendar.modalTitle')}
        >
          <div
            className="calendar-modal-content rounded-xl shadow-xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calendar-modal-header flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-lg truncate pr-2">
                {getMediaTitle(modalRelease, locale) || modalRelease.title}
              </h3>
              <button
                type="button"
                onClick={() => setModalRelease(null)}
                className="calendar-modal-close p-1 rounded-lg"
                aria-label={t('common.close')}
              >
                <IconCross className="w-5 h-5" />
              </button>
            </div>
            <div className="calendar-modal-poster aspect-[2/3] relative">
              {modalRelease.poster ? (
                <img
                  src={getMediaAssetUrl(modalRelease.poster)}
                  alt={modalRelease.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="calendar-modal-poster-empty w-full h-full flex items-center justify-center">?</div>
              )}
              {modalRelease.listStatus && (
                <span className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
                  {getListStatusLabel(t, mediaType, modalRelease.listStatus)}
                </span>
              )}
            </div>
            <div className="p-3 flex gap-2">
              <button
                type="button"
                onClick={() => setModalRelease(null)}
                className="calendar-modal-btn calendar-modal-btn-secondary flex-1 py-2 px-3 rounded-lg border"
              >
                {t('common.close')}
              </button>
              <Link
                to={openReleasePath}
                className="calendar-modal-btn calendar-modal-btn-primary flex-1 py-2 px-3 rounded-lg text-center font-medium"
                onClick={() => setModalRelease(null)}
              >
                {t('calendar.openTitle')}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="calendar-nav-btn p-2 rounded-lg border"
            aria-label={t('calendar.prevMonth')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="calendar-month-name min-w-[180px] text-center font-medium capitalize">{monthName}</span>
          <button
            type="button"
            onClick={goNext}
            className="calendar-nav-btn p-2 rounded-lg border"
            aria-label={t('calendar.nextMonth')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {CALENDAR_MEDIA_TYPES.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMediaType(value)}
              className={`calendar-tab px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mediaType === value ? 'calendar-tab--active' : ''}`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        <label className="calendar-filter-list flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyFromList}
            onChange={(e) => setOnlyFromList(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">{t('calendar.onlyFromList')}</span>
        </label>
      </div>

      {loading ? (
        <div className="calendar-loading flex items-center justify-center min-h-[400px]">{t('common.loading')}</div>
      ) : isMobile ? (
        /* Мобильный вид: блоки по неделям, заголовок "15 марта – 21 марта", под ним дни с горизонтальным скроллом карточек */
        <div className="space-y-6 pb-4">
          {grid.map((row, rowIdx) => {
            const rangeTitle = formatWeekRange(year, month, row)
            if (!rangeTitle) return null
            return (
              <section key={rowIdx} className="calendar-mobile-section rounded-xl border overflow-hidden shadow-sm">
                <h2 className="calendar-mobile-section-title text-base font-semibold px-4 py-3 border-b">
                  {rangeTitle}
                </h2>
                <div className="calendar-mobile-divider divide-y">
                  {row.map((dayNum, colIdx) => {
                    if (dayNum === null) return null
                    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                    const dayReleases = byDate[dateKey] ?? []
                    const weekDayLabel = weekDayLabels[colIdx]
                    return (
                      <div
                        key={colIdx}
                        className={`calendar-mobile-day-row px-4 py-3 min-h-[180px] flex flex-col ${colIdx % 2 === 1 ? 'calendar-mobile-day-row-odd' : ''}`}
                      >
                        <h3 className="calendar-mobile-day-title text-sm font-medium mb-2 shrink-0">
                          {weekDayLabel} {dayNum}
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 min-h-[168px] items-center">
                          {dayReleases.length === 0 ? (
                            <span className="calendar-day-empty-text text-xs">—</span>
                          ) : (
                            dayReleases.map((item) => {
                              const status = item.listStatus as ListStatus | undefined
                              const StatusIcon = status ? getListStatusIcon(status, mediaType) : null
                              const badgeClasses = status ? getListStatusBadgeClasses(status, mediaType) : null
                              return (
                                <Link
                                  key={item.id}
                                  to={getMediaPath(mediaType as MediaTypeForPath, item.id, item.title)}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setModalRelease(item)
                                  }}
                                  className="calendar-day-card w-28 flex-shrink-0 rounded-lg overflow-hidden border block active:opacity-90"
                                >
                                  <div className="calendar-day-card-cover calendar-card media-card-cover w-full aspect-[2/3] relative">
                                    {StatusIcon && badgeClasses && (
                                      <div
                                        className={`absolute top-1 left-1 z-10 w-6 h-6 rounded-lg flex items-center justify-center ${badgeClasses.bg} ${badgeClasses.text}`}
                                        title={getListStatusLabel(t, mediaType, item.listStatus!)}
                                      >
                                        <StatusIcon size={12} className="shrink-0" />
                                      </div>
                                    )}
                                    <span className="image-link">
                                      {item.poster ? (
                                        <img src={getMediaAssetUrl(item.poster)} alt="" />
                                      ) : (
                                        <div className="calendar-day-card-placeholder absolute inset-0 flex items-center justify-center text-2xl">
                                          —
                                        </div>
                                      )}
                                    </span>
                                    <div className="media-card-overlay">
                                      <span className="overlay-title overlay-title--sm">
                                        {getMediaTitle(item, locale) || item.title}
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="calendar-table-wrap overflow-x-auto rounded-xl p-2">
          <table className="w-full border-collapse min-w-[900px]" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {weekDayLabels.map((label, i) => (
                  <th key={i} className="calendar-table-th p-1 text-xs font-medium text-center w-[14.28%]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((day, colIdx) => {
                    const dateKey =
                      day === null ? '' : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const dayReleases = dateKey ? (byDate[dateKey] ?? []) : []
                    return (
                      <td key={colIdx} className="calendar-day-td p-1 align-top w-[14.28%]">
                        <DayCell
                          day={day}
                          year={year}
                          month={month}
                          releases={dayReleases}
                          mediaType={mediaType}
                          isMobile={isMobile}
                          onReleaseClick={setModalRelease}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
