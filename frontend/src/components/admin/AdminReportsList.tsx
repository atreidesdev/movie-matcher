import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flag, Gavel } from 'lucide-react'
import { IconCross, IconFriendDelete } from '@/components/icons'
import { useModalA11y } from '@/hooks/useModalA11y'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import {
  reportsApi,
  reportTemplatesApi,
  type Report,
  type ReportStatus,
  type ReportResponseTemplate,
  type CommentBanHistoryEntry,
} from '@/api/reports'
import { adminApi, type CommentBanHistoryEntry as AdminBanHistoryEntry } from '@/api/admin'
import { useToastStore } from '@/store/toastStore'

const REASON_KEYS: Record<string, string> = {
  spam: 'media.reportReasonSpam',
  abuse: 'media.reportReasonAbuse',
  spoiler: 'media.reportReasonSpoiler',
  other: 'media.reportReasonOther',
}

const BAN_PRESETS = [
  { label: '24 h', hours: 24 },
  { label: '72 h', hours: 72 },
  { label: '7 d', hours: 24 * 7 },
  { label: '30 d', hours: 24 * 30 },
] as const

export default function AdminReportsList() {
  const { t } = useTranslation()
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('pending')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [decisionReport, setDecisionReport] = useState<Report | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [banHistoryFetched, setBanHistoryFetched] = useState<AdminBanHistoryEntry[] | null>(null)
  const [banHistoryLoading, setBanHistoryLoading] = useState(false)
  const [templates, setTemplates] = useState<ReportResponseTemplate[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkNote, setBulkNote] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const decisionModalRef = useRef<HTMLDivElement>(null)
  useLockBodyScroll(!!decisionReport)
  useModalA11y(Boolean(decisionReport), () => updatingId === null && setDecisionReport(null), {
    contentRef: decisionModalRef,
  })

  useEffect(() => {
    reportTemplatesApi
      .list()
      .then(setTemplates)
      .catch(() => setTemplates([]))
  }, [])

  const load = () => {
    setLoading(true)
    reportsApi
      .list({ status: statusFilter || undefined, limit: 50, offset: 0 })
      .then((res) => {
        setReports(res.reports)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const handleOpenDecision = (r: Report) => {
    setDecisionReport(r)
    setDecisionNote(r.moderatorNote ?? '')
    setBanHistoryFetched(null)
    if (r.targetAuthorId != null) {
      setBanHistoryLoading(true)
      adminApi
        .getCommentBanHistory(r.targetAuthorId)
        .then(setBanHistoryFetched)
        .catch(() => setBanHistoryFetched([]))
        .finally(() => setBanHistoryLoading(false))
    }
  }

  const handleBlock = async (report: Report, hours: number) => {
    const authorId = report.targetAuthorId
    if (authorId == null) {
      useToastStore.getState().show({ title: t('common.error') })
      return
    }
    setUpdatingId(report.id)
    try {
      const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      await adminApi.setCommentBan(authorId, until, {
        commentText: report.reportedCommentText ?? undefined,
        reason: decisionNote || undefined,
        reportId: report.id,
      })
      await reportsApi.updateStatus(report.id, {
        status: 'resolved',
        moderatorNote: decisionNote || undefined,
      })
      useToastStore
        .getState()
        .show({ title: t('admin.blockUserForComment') + ` +${hours >= 24 ? hours / 24 + ' d' : hours + ' h'}` })
      setDecisionReport(null)
      setReports((prev) => prev.filter((r) => r.id !== report.id))
      setTotal((prev) => Math.max(0, prev - 1))
    } catch {
      useToastStore.getState().show({ title: t('common.error') })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (report: Report) => {
    setUpdatingId(report.id)
    try {
      await reportsApi.updateStatus(report.id, {
        status: 'rejected',
        moderatorNote: decisionNote || undefined,
      })
      useToastStore.getState().show({ title: t('admin.rejectReport') })
      setDecisionReport(null)
      setReports((prev) => prev.filter((r) => r.id !== report.id))
      setTotal((prev) => Math.max(0, prev - 1))
    } catch {
      useToastStore.getState().show({ title: t('common.error') })
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingReports = reports.filter((r) => r.status === 'pending')
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size >= pendingReports.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(pendingReports.map((r) => r.id)))
  }
  const handleBulkAction = async (status: 'resolved' | 'rejected') => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkUpdating(true)
    try {
      const res = await reportsApi.bulkUpdate(ids, status, bulkNote || undefined)
      useToastStore.getState().show({ title: t('admin.bulkUpdated', { count: res.updated }) })
      setSelectedIds(new Set())
      setBulkNote('')
      load()
    } catch {
      useToastStore.getState().show({ title: t('common.error') })
    } finally {
      setBulkUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="font-medium">{t('admin.reports')}</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
          className="border border-gray-300 rounded-lg px-3 py-1.5"
        >
          <option value="">{t('admin.reportsAll')}</option>
          <option value="pending">{t('admin.reportsPending')}</option>
          <option value="resolved">{t('admin.reportsResolved')}</option>
          <option value="rejected">{t('admin.reportsRejected')}</option>
        </select>
        <span className="text-sm text-gray-500">{total}</span>
        {statusFilter === 'pending' && pendingReports.length > 0 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === pendingReports.length}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-amber-600"
            />
            {t('admin.selectAll')}
          </label>
        )}
      </div>
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-sm font-medium text-amber-900">
            {t('admin.selectedCount', { count: selectedIds.size })}
          </span>
          <input
            type="text"
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            placeholder={t('admin.moderatorNote')}
            className="flex-1 min-w-[200px] border border-amber-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => handleBulkAction('resolved')}
            disabled={bulkUpdating}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {t('admin.resolve')}
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('rejected')}
            disabled={bulkUpdating}
            className="px-3 py-1.5 rounded-lg bg-gray-500 text-white text-sm hover:bg-gray-600 disabled:opacity-50"
          >
            {t('admin.reject')}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-amber-700 hover:underline"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500">{t('admin.reportsEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {r.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="rounded border-gray-300 text-amber-600 shrink-0"
                      aria-label={t('admin.selectReport')}
                    />
                  )}
                  <Flag className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-medium">
                    {r.targetType} #{r.targetId}
                  </span>
                  {r.targetEntityType && (
                    <span className="text-sm text-gray-500">
                      {r.targetEntityType} {r.targetEntityId}
                    </span>
                  )}
                  <span
                    className={`text-sm px-2 py-0.5 rounded ${r.status === 'pending' ? 'bg-amber-100' : r.status === 'resolved' ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    {r.status}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(r.createdAt).toLocaleString()} · reporter: {r.reporterId}
                </span>
              </div>
              <p className="mt-1 text-gray-700">
                {t(REASON_KEYS[r.reason] ?? r.reason)} {r.comment != null && r.comment !== '' && `— ${r.comment}`}
              </p>
              {r.reportedCommentText != null && r.reportedCommentText !== '' && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {t('admin.reportedComment')}
                  </p>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-gray-800 whitespace-pre-wrap text-sm">
                    {r.reportedCommentText}
                  </div>
                </div>
              )}
              {r.status === 'pending' && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenDecision(r)}
                    disabled={updatingId !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
                  >
                    <Gavel className="w-4 h-4" />
                    {t('admin.makeDecision')}
                  </button>
                </div>
              )}
              {r.moderatorNote && (
                <p className="mt-2 text-sm text-gray-500">
                  {t('admin.moderatorNote')}: {r.moderatorNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {decisionReport && (
        <div
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0"
          role="presentation"
        >
          <div
            className="fixed inset-0 bg-black/50 min-h-[100dvh]"
            onClick={() => updatingId === null && setDecisionReport(null)}
            aria-hidden
          />
          <div
            className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => updatingId === null && setDecisionReport(null)}
          >
            <div
              ref={decisionModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="decision-modal-title"
              className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="decision-modal-title" className="text-lg font-semibold mb-3">
                {t('admin.makeDecision')} — {decisionReport.targetType} #{decisionReport.targetId}
              </h3>
              <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                {decisionReport.reportedCommentText != null && decisionReport.reportedCommentText !== '' && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {t('admin.reportedComment')}
                    </p>
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-gray-800 whitespace-pre-wrap text-sm max-h-36 overflow-y-auto">
                      {decisionReport.reportedCommentText}
                    </div>
                  </div>
                )}
                {decisionReport.targetAuthorId != null && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('admin.banHistory')}
                    </p>
                    {banHistoryLoading ? (
                      <p className="text-sm text-gray-500">{t('common.loading')}</p>
                    ) : (
                      (() => {
                        const history =
                          decisionReport.targetAuthorBanHistory && decisionReport.targetAuthorBanHistory.length > 0
                            ? decisionReport.targetAuthorBanHistory
                            : (banHistoryFetched ?? [])
                        if (history.length === 0) {
                          return <p className="text-sm text-gray-500">{t('admin.banHistoryEmpty')}</p>
                        }
                        return (
                          <ul className="rounded-lg border border-amber-200 bg-amber-50 divide-y divide-amber-100 max-h-40 overflow-y-auto">
                            {history.map((entry: CommentBanHistoryEntry | AdminBanHistoryEntry, idx: number) => (
                              <li key={'id' in entry ? entry.id : idx} className="p-3 text-sm">
                                <p className="font-medium text-amber-900">
                                  {t('admin.banHistoryEntry', { until: new Date(entry.bannedUntil).toLocaleString() })}
                                </p>
                                {entry.bannedCommentReason && (
                                  <p className="text-amber-800 mt-0.5">{entry.bannedCommentReason}</p>
                                )}
                                {entry.bannedCommentText && (
                                  <p className="text-gray-600 mt-1 text-xs whitespace-pre-wrap line-clamp-2">
                                    {entry.bannedCommentText}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )
                      })()
                    )}
                  </div>
                )}
                <div>
                  {templates.length > 0 && (
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t('admin.responseTemplate')}
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value=""
                        onChange={(e) => {
                          const id = Number(e.target.value)
                          const tpl = templates.find((t) => t.id === id)
                          if (tpl) setDecisionNote(tpl.body)
                        }}
                      >
                        <option value="">—</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.moderatorNote')}</label>
                  <input
                    type="text"
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder={t('admin.moderatorNote')}
                  />
                </div>
                <div className="space-y-3 pt-1">
                  {decisionReport.targetAuthorId != null && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        {t('admin.blockUserForComment')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {BAN_PRESETS.map(({ label, hours }) => (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => handleBlock(decisionReport, hours)}
                            disabled={updatingId !== null}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-medium disabled:opacity-50"
                          >
                            <IconFriendDelete className="w-4 h-4" />+{label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleReject(decisionReport)}
                    disabled={updatingId !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-500 text-white text-sm hover:bg-gray-600 disabled:opacity-50"
                  >
                    <IconCross className="w-4 h-4" />
                    {t('admin.rejectReport')}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecisionReport(null)}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm shrink-0"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
