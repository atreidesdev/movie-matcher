import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Link2 } from 'lucide-react'
import { IconSearch, IconPlus, IconCross } from '@/components/icons'
import { franchiseApi, type Franchise, type FranchiseMediaLink } from '@/api/franchise'
import { getLocalizedString } from '@/utils/localizedText'
import type { LocalizedString } from '@/types'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'
import { mediaApi } from '@/api/media'
import { FRANCHISE_RELATION_TYPES } from '@/utils/franchiseRelation'

const MEDIA_TYPE_KEYS = [
  'movies',
  'anime',
  'games',
  'tv-series',
  'manga',
  'books',
  'light-novels',
  'cartoon-series',
  'cartoon-movies',
  'anime-movies',
] as const

const MEDIA_TYPE_LABELS: Record<string, string> = {
  movies: 'nav.movies',
  anime: 'nav.anime',
  games: 'nav.games',
  'tv-series': 'nav.tvSeries',
  manga: 'nav.manga',
  books: 'nav.books',
  'light-novels': 'nav.lightNovels',
  'cartoon-series': 'nav.cartoonSeries',
  'cartoon-movies': 'nav.cartoonMovies',
  'anime-movies': 'nav.animeMovies',
}

async function searchMediaByType(type: string, query: string): Promise<{ id: number; title: string }[]> {
  if (!query.trim()) return []
  const q = query.trim()
  const page = 1
  switch (type) {
    case 'movies': {
      const res = await mediaApi.searchMovies(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'anime': {
      const res = await mediaApi.searchAnime(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'games': {
      const res = await mediaApi.searchGames(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'tv-series': {
      const res = await mediaApi.searchTVSeries(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'manga': {
      const res = await mediaApi.searchManga(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'books': {
      const res = await mediaApi.searchBooks(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'light-novels': {
      const res = await mediaApi.searchLightNovels(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'cartoon-series': {
      const res = await mediaApi.searchCartoonSeries(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'cartoon-movies': {
      const res = await mediaApi.searchCartoonMovies(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    case 'anime-movies': {
      const res = await mediaApi.searchAnimeMovies(q, page)
      return (res.data ?? []).map((m) => ({ id: m.id, title: m.title ?? '' }))
    }
    default:
      return []
  }
}

const MEDIA_TYPE_TO_PATH: Record<string, string> = {
  movies: 'movie',
  anime: 'anime',
  games: 'game',
  'tv-series': 'tv-series',
  manga: 'manga',
  books: 'book',
  'light-novels': 'light-novel',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

function pathSegment(type: string): string {
  return MEDIA_TYPE_TO_PATH[type] ?? type
}

const SUPPORTED_LOCALES = ['ru', 'en'] as const

export default function AdminFranchises() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null)
  const [links, setLinks] = useState<FranchiseMediaLink[]>([])
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editNameI18n, setEditNameI18n] = useState<LocalizedString>({})
  const [newFranchiseName, setNewFranchiseName] = useState('')
  const [newFranchiseNameI18n, setNewFranchiseNameI18n] = useState<LocalizedString>({})
  const [showNewFranchise, setShowNewFranchise] = useState(false)
  const [page, setPage] = useState(1)

  const filteredFranchises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return franchises
    const isNumeric = /^\d+$/.test(q)
    return franchises.filter((f) => {
      const idMatch = isNumeric && String(f.id).includes(q)
      const displayName = getLocalizedString(f.nameI18n, f.name, locale)
      const nameMatch = (f.name ?? '').toLowerCase().includes(q) || displayName.toLowerCase().includes(q)
      return idMatch || nameMatch
    })
  }, [franchises, searchQuery, locale])

  const paginatedFranchises = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE
    return filteredFranchises.slice(start, start + ADMIN_PAGE_SIZE)
  }, [filteredFranchises, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const loadFranchises = () => {
    setLoading(true)
    franchiseApi
      .getList(1, 100)
      .then((res) => setFranchises(res.data ?? []))
      .catch(() => setFranchises([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFranchises()
  }, [])

  useEffect(() => {
    if (!editingFranchise) return
    setEditName(editingFranchise.name)
    setEditNameI18n(editingFranchise.nameI18n ?? {})
    franchiseApi
      .getMedia(editingFranchise.id)
      .then(setLinks)
      .catch(() => setLinks([]))
  }, [editingFranchise])

  const handleSaveFranchiseName = async () => {
    if (!editingFranchise || saving) return
    setSaving(true)
    try {
      const nameI18n = Object.keys(editNameI18n).length ? editNameI18n : undefined
      await franchiseApi.update(editingFranchise.id, { name: editName, nameI18n })
      setEditingFranchise((prev) => (prev ? { ...prev, name: editName, nameI18n } : null))
      loadFranchises()
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFranchise = async () => {
    if (!newFranchiseName.trim() || saving) return
    setSaving(true)
    try {
      const nameI18n = Object.keys(newFranchiseNameI18n).length ? newFranchiseNameI18n : undefined
      const created = await franchiseApi.create({ name: newFranchiseName.trim(), nameI18n })
      setShowNewFranchise(false)
      setNewFranchiseName('')
      setNewFranchiseNameI18n({})
      loadFranchises()
      setEditingFranchise(created)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLink = async (linkId: number) => {
    if (saving) return
    setSaving(true)
    try {
      await franchiseApi.deleteLink(linkId)
      if (editingFranchise) {
        const res = await franchiseApi.getMedia(editingFranchise.id)
        setLinks(res)
      }
    } finally {
      setSaving(false)
    }
  }
  const handleUpdateLink = async (
    linkId: number,
    data: { relationType?: string; orderNumber?: number; note?: string }
  ) => {
    await franchiseApi.updateLink(linkId, data)
    if (editingFranchise) {
      const res = await franchiseApi.getMedia(editingFranchise.id)
      setLinks(res)
    }
  }

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.franchises')}</h2>
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
        <button type="button" onClick={() => setShowNewFranchise(true)} className="btn-primary flex items-center gap-2">
          <IconPlus className="w-4 h-4" />
          {t('common.add')}
        </button>
      </div>
      {loading ? (
        <p className="text-gray-400">{t('common.loading')}</p>
      ) : (
        <>
          <ul className="space-y-2 pr-1">
            {paginatedFranchises.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border bg-white/90 border-gray-200 hover:border-lavender-200 hover:shadow transition-all"
              >
                <span className="text-gray-800 flex-1 min-w-0 truncate text-sm">
                  <span className="text-gray-400 text-xs mr-1">#{f.id}</span>
                  {getLocalizedString(f.nameI18n, f.name, locale)}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingFranchise(f)}
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
            totalItems={filteredFranchises.length}
            pageSize={ADMIN_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
      {showNewFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewFranchise(false)} aria-hidden />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-3">
              {t('admin.franchises')} — {t('common.add')}
            </h3>
            <input
              type="text"
              value={newFranchiseName}
              onChange={(e) => setNewFranchiseName(e.target.value)}
              placeholder={t('admin.name')}
              className="input w-full mb-2"
            />
            <p className="text-xs text-gray-500 mb-2">{t('admin.translationsOptional')}</p>
            <TranslationsEditor
              value={newFranchiseNameI18n}
              onChange={setNewFranchiseNameI18n}
              defaultLocales={SUPPORTED_LOCALES}
              placeholderByLocale={(loc) => `${t('admin.name')} (${loc})`}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setShowNewFranchise(false)} className="btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateFranchise}
                disabled={saving || !newFranchiseName.trim()}
                className="btn-primary"
              >
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingFranchise && (
        <AdminFranchiseModal
          franchise={editingFranchise}
          links={links}
          onClose={() => setEditingFranchise(null)}
          onSaveName={handleSaveFranchiseName}
          onRefreshLinks={() => franchiseApi.getMedia(editingFranchise.id).then(setLinks)}
          editName={editName}
          setEditName={setEditName}
          editNameI18n={editNameI18n}
          setEditNameI18n={setEditNameI18n}
          saving={saving}
          onDeleteLink={handleDeleteLink}
          onUpdateLink={handleUpdateLink}
          supportedLocales={SUPPORTED_LOCALES}
        />
      )}
    </section>
  )
}

interface AdminFranchiseModalProps {
  franchise: Franchise
  links: FranchiseMediaLink[]
  onClose: () => void
  onSaveName: () => void
  onRefreshLinks: () => void
  editName: string
  setEditName: (v: string) => void
  editNameI18n: LocalizedString
  setEditNameI18n: (v: LocalizedString) => void
  saving: boolean
  onDeleteLink: (linkId: number) => void
  onUpdateLink: (linkId: number, data: { relationType?: string; orderNumber?: number; note?: string }) => Promise<void>
  supportedLocales: readonly string[]
}

function AdminFranchiseModal({
  franchise,
  links,
  onClose,
  onSaveName,
  onRefreshLinks,
  editName,
  setEditName,
  editNameI18n,
  setEditNameI18n,
  saving,
  onDeleteLink,
  onUpdateLink,
  supportedLocales,
}: AdminFranchiseModalProps) {
  const { t } = useTranslation()
  const [addLinkOpen, setAddLinkOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<FranchiseMediaLink | null>(null)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h3 className="text-lg font-semibold">
            {t('admin.editEntity')} #{franchise.id}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
            aria-label={t('common.close')}
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.name')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input flex-1"
                placeholder={t('admin.name')}
              />
              <button type="button" onClick={onSaveName} disabled={saving} className="btn-primary shrink-0">
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 mb-2">{t('admin.translationsOptional')}</p>
            <TranslationsEditor
              value={editNameI18n}
              onChange={setEditNameI18n}
              defaultLocales={supportedLocales}
              placeholderByLocale={(loc) => `${t('admin.name')} (${loc})`}
              className="mb-4"
            />
          </div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            {t('media.franchise')} — {t('admin.franchiseLinks')}
          </h4>
          <ul className="space-y-2 mb-4">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 text-sm"
              >
                <span className="text-gray-700">
                  {link.fromMediaType}:{link.fromMediaId} → {link.toMediaType}:{link.toMediaId}{' '}
                  <span className="text-gray-500">({link.relationType})</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingLink(link)}
                    disabled={saving}
                    className="p-1 text-gray-500 hover:text-lavender-500"
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLink(link.id)}
                    disabled={saving}
                    className="p-1 text-gray-500 hover:text-soft_blush-500"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {editingLink && (
            <EditFranchiseLinkModal
              link={editingLink}
              onClose={() => setEditingLink(null)}
              onSaved={() => {
                setEditingLink(null)
                onRefreshLinks()
              }}
              onUpdateLink={onUpdateLink}
            />
          )}
          <button type="button" onClick={() => setAddLinkOpen(true)} className="btn-secondary flex items-center gap-2">
            <IconPlus className="w-4 h-4" />
            {t('admin.addLink')}
          </button>
        </div>
        {addLinkOpen && (
          <AddFranchiseLinkModal
            franchiseId={franchise.id}
            onClose={() => setAddLinkOpen(false)}
            onAdded={() => {
              onRefreshLinks()
              setAddLinkOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

interface EditFranchiseLinkModalProps {
  link: FranchiseMediaLink
  onClose: () => void
  onSaved: () => void
  onUpdateLink: (linkId: number, data: { relationType?: string; orderNumber?: number; note?: string }) => Promise<void>
}

function EditFranchiseLinkModal({ link, onClose, onSaved, onUpdateLink }: EditFranchiseLinkModalProps) {
  const { t } = useTranslation()
  const [relationType, setRelationType] = useState(link.relationType)
  const [orderNumber, setOrderNumber] = useState<string>(link.orderNumber != null ? String(link.orderNumber) : '')
  const [note, setNote] = useState(link.note ?? '')
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdateLink(link.id, {
        relationType,
        orderNumber: orderNumber === '' ? undefined : Number(orderNumber),
        note: note.trim() || undefined,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h4 className="text-lg font-semibold mb-4">
          {t('admin.editEntity')} — {link.fromMediaType}:{link.fromMediaId} → {link.toMediaType}:{link.toMediaId}
        </h4>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">{t('admin.relationType')}</label>
          <select value={relationType} onChange={(e) => setRelationType(e.target.value)} className="input w-full">
            {FRANCHISE_RELATION_TYPES.map((r) => (
              <option key={r} value={r}>
                {t(`media.franchiseRelation.${r}`)}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium text-gray-700">Order</label>
          <input
            type="number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="input w-full"
            placeholder="—"
          />
          <label className="block text-sm font-medium text-gray-700">Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input w-full"
            placeholder="—"
          />
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

interface AddFranchiseLinkModalProps {
  franchiseId: number
  onClose: () => void
  onAdded: () => void
}

function AddFranchiseLinkModal({ franchiseId, onClose, onAdded }: AddFranchiseLinkModalProps) {
  const { t } = useTranslation()
  const [fromType, setFromType] = useState<string>('movies')
  const [toType, setToType] = useState<string>('movies')
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [fromResults, setFromResults] = useState<{ id: number; title: string }[]>([])
  const [toResults, setToResults] = useState<{ id: number; title: string }[]>([])
  const [fromSelected, setFromSelected] = useState<{ id: number; title: string } | null>(null)
  const [toSelected, setToSelected] = useState<{ id: number; title: string } | null>(null)
  const [relationType, setRelationType] = useState<string>('sequel')
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  const searchFrom = async () => {
    if (!fromQuery.trim()) return
    setSearching(true)
    try {
      const list = await searchMediaByType(fromType, fromQuery)
      setFromResults(list)
    } finally {
      setSearching(false)
    }
  }

  const searchTo = async () => {
    if (!toQuery.trim()) return
    setSearching(true)
    try {
      const list = await searchMediaByType(toType, toQuery)
      setToResults(list)
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async () => {
    if (!fromSelected || !toSelected || saving) return
    setSaving(true)
    try {
      await franchiseApi.addLink(franchiseId, {
        fromMediaType: pathSegment(fromType),
        fromMediaId: fromSelected.id,
        toMediaType: pathSegment(toType),
        toMediaId: toSelected.id,
        relationType,
      })
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
        <h4 className="text-lg font-semibold mb-4">{t('admin.addLink')}</h4>
        <p className="text-sm text-gray-500 mb-4">{t('admin.bidirectionalLinkHint')}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From (media)</label>
            <div className="flex gap-2 mb-2">
              <select value={fromType} onChange={(e) => setFromType(e.target.value)} className="input flex-1">
                {MEDIA_TYPE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {t(MEDIA_TYPE_LABELS[k] ?? k)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => setFromQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchFrom())}
                placeholder={t('admin.searchPlaceholder')}
                className="input flex-1"
              />
              <button type="button" onClick={searchFrom} disabled={searching} className="btn-secondary shrink-0">
                {searching ? t('common.loading') : t('nav.search')}
              </button>
            </div>
            {fromResults.length > 0 && (
              <ul className="border rounded-lg max-h-32 overflow-y-auto">
                {fromResults.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setFromSelected(m)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${fromSelected?.id === m.id ? 'bg-lavender-100' : ''}`}
                    >
                      #{m.id} {m.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fromSelected && (
              <p className="text-sm text-gray-600 mt-1">
                {t('admin.selected')}: #{fromSelected.id} {fromSelected.title}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To (media)</label>
            <div className="flex gap-2 mb-2">
              <select value={toType} onChange={(e) => setToType(e.target.value)} className="input flex-1">
                {MEDIA_TYPE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {t(MEDIA_TYPE_LABELS[k] ?? k)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={toQuery}
                onChange={(e) => setToQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchTo())}
                placeholder={t('admin.searchPlaceholder')}
                className="input flex-1"
              />
              <button type="button" onClick={searchTo} disabled={searching} className="btn-secondary shrink-0">
                {searching ? t('common.loading') : t('nav.search')}
              </button>
            </div>
            {toResults.length > 0 && (
              <ul className="border rounded-lg max-h-32 overflow-y-auto">
                {toResults.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setToSelected(m)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${toSelected?.id === m.id ? 'bg-lavender-100' : ''}`}
                    >
                      #{m.id} {m.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {toSelected && (
              <p className="text-sm text-gray-600 mt-1">
                {t('admin.selected')}: #{toSelected.id} {toSelected.title}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.relationType')}</label>
            <select value={relationType} onChange={(e) => setRelationType(e.target.value)} className="input w-full">
              {FRANCHISE_RELATION_TYPES.map((r) => (
                <option key={r} value={r}>
                  {t(`media.franchiseRelation.${r}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !fromSelected || !toSelected}
            className="btn-primary"
          >
            {saving ? t('common.loading') : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  )
}
