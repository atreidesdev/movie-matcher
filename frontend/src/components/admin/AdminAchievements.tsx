import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, FileJson, Upload } from 'lucide-react'
import { IconPlus, IconCross, IconSearch, IconAchievement } from '@/components/icons'
import { adminApi } from '@/api/admin'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { achievementsApi } from '@/api/achievements'
import { franchiseApi, type Franchise } from '@/api/franchise'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'
import { useDebounce } from '@/hooks/useDebounce'
import type { Achievement, LocalizedString } from '@/types'
import { getLocalizedString } from '@/utils/localizedText'
import { buildUploadBaseName } from '@/utils/uploadNames'

type Genre = { id: number; name: string }

const MEDIA_TYPES = [
  'movie',
  'tvSeries',
  'animeSeries',
  'cartoonSeries',
  'cartoonMovie',
  'animeMovie',
  'manga',
  'game',
  'book',
  'lightNovel',
] as const

type LevelForm = {
  levelOrder: number
  thresholdPercent: number
  title: string
  titleI18n: LocalizedString
  imageUrl?: string
}

const emptyLevel = (order: number): LevelForm => ({
  levelOrder: order,
  thresholdPercent: order === 1 ? 20 : order * 25,
  title: '',
  titleI18n: {},
})

export default function AdminAchievements() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [list, setList] = useState<Achievement[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Achievement | null>(null)
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [titleI18n, setTitleI18n] = useState<LocalizedString>({})
  const [imageUrl, setImageUrl] = useState('')
  const [rarity, setRarity] = useState<string>('common')
  const [targetType, setTargetType] = useState<'genre' | 'franchise' | 'media_list'>('genre')
  const [genreId, setGenreId] = useState<number | ''>('')
  const [genreSearchQuery, setGenreSearchQuery] = useState('')
  const [genreOpen, setGenreOpen] = useState(false)
  const [franchiseId, setFranchiseId] = useState<number | ''>('')
  const [franchiseSearchQuery, setFranchiseSearchQuery] = useState('')
  const [franchiseResults, setFranchiseResults] = useState<Franchise[]>([])
  const [franchiseLoading, setFranchiseLoading] = useState(false)
  const [franchiseOpen, setFranchiseOpen] = useState(false)
  const [selectedFranchiseName, setSelectedFranchiseName] = useState('')
  const [orderNum, setOrderNum] = useState(0)
  const [levels, setLevels] = useState<LevelForm[]>([emptyLevel(1)])
  const [mediaIdsJson, setMediaIdsJson] = useState('')
  const [mediaIdsByType, setMediaIdsByType] = useState<Record<string, number[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [uploadingMainImage, setUploadingMainImage] = useState(false)
  const [uploadingLevelIdx, setUploadingLevelIdx] = useState<number | null>(null)
  const franchiseSearchDebounced = useDebounce(franchiseSearchQuery, 300)
  const genreRef = useRef<HTMLDivElement>(null)
  const franchiseRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)

  const paginatedList = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE
    return list.slice(start, start + ADMIN_PAGE_SIZE)
  }, [list, page])

  const loadList = useCallback(() => {
    achievementsApi
      .getList()
      .then((r) => setList(r.achievements ?? []))
      .catch(() => setList([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    achievementsApi
      .getList()
      .then((r) => setList(r.achievements ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  // Жанры подгружаем только когда открыта модалка и выбран тип «по жанру»
  useEffect(() => {
    if (!modalOpen || targetType !== 'genre') return
    if (genres.length === 0) {
      adminApi
        .getGenres()
        .then((g) => setGenres(g))
        .catch(() => {})
    }
  }, [modalOpen, targetType])

  // Поиск франшиз по вводу (с debounce)
  useEffect(() => {
    if (targetType !== 'franchise') return
    const q = franchiseSearchDebounced.trim()
    if (!q) {
      setFranchiseResults([])
      return
    }
    setFranchiseLoading(true)
    franchiseApi
      .search(q)
      .then((list) => setFranchiseResults(list ?? []))
      .catch(() => setFranchiseResults([]))
      .finally(() => setFranchiseLoading(false))
  }, [targetType, franchiseSearchDebounced])

  // Закрытие выпадающих списков по клику снаружи
  useEffect(() => {
    if (!modalOpen) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (genreOpen && genreRef.current && !genreRef.current.contains(target)) setGenreOpen(false)
      if (franchiseOpen && franchiseRef.current && !franchiseRef.current.contains(target)) setFranchiseOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [modalOpen, genreOpen, franchiseOpen])

  useEffect(() => {
    if (!editing) {
      setSlug('')
      setTitle('')
      setTitleI18n({})
      setImageUrl('')
      setRarity('common')
      setTargetType('genre')
      setGenreId('')
      setGenreSearchQuery('')
      setGenreOpen(false)
      setFranchiseId('')
      setFranchiseSearchQuery('')
      setFranchiseResults([])
      setFranchiseOpen(false)
      setSelectedFranchiseName('')
      setOrderNum(0)
      setLevels([emptyLevel(1)])
      setMediaIdsJson('')
      setMediaIdsByType({})
      setError(null)
      return
    }
    setSlug(editing.slug)
    setTitle(editing.title)
    setTitleI18n(editing.titleI18n ?? {})
    setImageUrl(editing.imageUrl ?? '')
    setRarity(editing.rarity ?? 'common')
    setTargetType(editing.targetType)
    setGenreId(editing.genreId ?? '')
    setGenreSearchQuery('')
    setFranchiseId(editing.franchiseId ?? '')
    setFranchiseSearchQuery('')
    setFranchiseResults([])
    setSelectedFranchiseName(
      editing.franchise ? getLocalizedString(editing.franchise.nameI18n, editing.franchise.name, locale) : ''
    )
    setOrderNum(editing.orderNum ?? 0)
    setLevels(
      (editing.levels?.length
        ? editing.levels
        : [{ levelOrder: 1, thresholdPercent: 20, title: '', titleI18n: {}, imageUrl: undefined }]
      )
        .slice()
        .sort((a, b) => a.levelOrder - b.levelOrder)
        .map((l) => ({
          levelOrder: l.levelOrder,
          thresholdPercent: l.thresholdPercent,
          title: l.title,
          titleI18n: l.titleI18n ?? {},
          imageUrl: l.imageUrl,
        }))
    )
    const byType: Record<string, number[]> = {}
    for (const t of editing.targets ?? []) {
      if (!byType[t.mediaType]) byType[t.mediaType] = []
      byType[t.mediaType].push(t.mediaId)
    }
    setMediaIdsByType(byType)
    setMediaIdsJson(JSON.stringify(byType, null, 2))
    setError(null)
  }, [editing])

  const applyMediaIdsJson = () => {
    const raw = mediaIdsJson.trim()
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed !== 'object' || Array.isArray(parsed)) return
      const next: Record<string, number[]> = {}
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof k === 'string' && Array.isArray(v)) {
          next[k] = (v as unknown[]).filter((x): x is number => typeof x === 'number')
        }
      }
      setMediaIdsByType(next)
    } catch {
      setError('Invalid JSON')
    }
  }

  const buildTargets = (): { mediaType: string; mediaId: number }[] => {
    const out: { mediaType: string; mediaId: number }[] = []
    for (const [mt, ids] of Object.entries(mediaIdsByType)) {
      for (const id of ids) {
        out.push({ mediaType: mt, mediaId: id })
      }
    }
    return out
  }

  const submit = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Title required')
      return
    }
    const levelPayload = levels
      .filter((l) => l.title.trim())
      .map((l) => ({
        levelOrder: l.levelOrder,
        thresholdPercent: l.thresholdPercent,
        title: l.title.trim(),
        titleI18n: Object.keys(l.titleI18n).length ? l.titleI18n : undefined,
        imageUrl: l.imageUrl || undefined,
      }))
    if (levelPayload.length === 0) {
      setError('At least one level with title required')
      return
    }
    if (targetType === 'genre' && !genreId) {
      setError('Genre required')
      return
    }
    if (targetType === 'franchise' && !franchiseId) {
      setError('Franchise required')
      return
    }
    if (targetType === 'media_list') {
      const targets = buildTargets()
      if (targets.length === 0) {
        setError('At least one media target required')
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        slug: slug.trim() || undefined,
        title: title.trim(),
        titleI18n: Object.keys(titleI18n).length ? titleI18n : undefined,
        imageUrl: imageUrl.trim() || undefined,
        rarity: rarity || 'common',
        targetType,
        genreId: targetType === 'genre' ? Number(genreId) : undefined,
        franchiseId: targetType === 'franchise' ? Number(franchiseId) : undefined,
        orderNum,
        levels: levelPayload,
        targets: targetType === 'media_list' ? buildTargets() : undefined,
      }
      if (editing) {
        await adminApi.updateAchievement(editing.id, payload)
      } else {
        await adminApi.createAchievement(payload)
      }
      setModalOpen(false)
      setEditing(null)
      loadList()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Request failed')
    } finally {
      setSaving(false)
    }
  }

  const removeAchievement = async (a: Achievement) => {
    if (!window.confirm(t('admin.confirmDeleteEntity', { label: a.title }))) return
    setSaving(true)
    try {
      await adminApi.deleteAchievement(a.id)
      if (editing?.id === a.id) {
        setEditing(null)
        setModalOpen(false)
      }
      loadList()
    } finally {
      setSaving(false)
    }
  }

  const openCreateModal = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEditModal = (a: Achievement) => {
    setEditing(a)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const addLevel = () => {
    const nextOrder = levels.length ? Math.max(...levels.map((l) => l.levelOrder)) + 1 : 1
    setLevels((prev) => [...prev, emptyLevel(nextOrder)])
  }

  const updateLevel = (index: number, patch: Partial<LevelForm>) => {
    setLevels((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const removeLevel = (index: number) => {
    setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  const setMediaIdsForType = (mediaType: string, ids: number[]) => {
    setMediaIdsByType((prev) => {
      const next = { ...prev }
      if (ids.length) next[mediaType] = ids
      else delete next[mediaType]
      return next
    })
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded-xl" />
  }

  return (
    <section className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <IconAchievement className="w-6 h-6 text-amber-500" />
        {t('admin.achievementsTab')}
      </h2>

      <div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-700">{t('achievements.title')}</h3>
            <button type="button" onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <IconPlus className="w-4 h-4" />
              {t('admin.achievementCreate')}
            </button>
          </div>
          <ul className="space-y-1">
            {paginatedList.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 py-2 border-b border-gray-200 last:border-0"
              >
                <span className="truncate">
                  {getLocalizedString(a.titleI18n, a.title, locale)} ({a.targetType})
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(a)}
                    className="p-1.5 rounded hover:bg-gray-200"
                    title={t('admin.achievementEdit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAchievement(a)}
                    disabled={saving}
                    className="p-1.5 rounded hover:bg-red-100 text-red-600"
                    title={t('admin.confirmDeleteTitle')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <AdminPagination
            currentPage={page}
            totalItems={list.length}
            pageSize={ADMIN_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {modalOpen && (
        <div
          className="modal-overlay-root fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievement-modal-title"
        >
          <div className="fixed inset-0 bg-black/50 min-h-[100dvh]" onClick={closeModal} aria-hidden />
          <div className="relative z-10 min-h-[100dvh] flex items-center justify-center pt-4 px-4" onClick={closeModal}>
            <div
              className="relative bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between shrink-0">
                <h3 id="achievement-modal-title" className="text-lg font-semibold text-gray-800">
                  {editing ? t('admin.achievementEdit') : t('admin.achievementCreate')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
                  aria-label={t('common.close')}
                >
                  <IconCross className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
                <div>
                  <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementSlug')}</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="input w-full"
                    placeholder="auto-from-title"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementTitle')} *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-0.5">{t('admin.translationsOptional')}</label>
                  <TranslationsEditor value={titleI18n} onChange={setTitleI18n} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementImageUrl')}</label>
                  <div className="flex gap-2 flex-wrap items-center">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="input flex-1 min-w-[200px]"
                      placeholder="/uploads/…"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium cursor-pointer disabled:opacity-50">
                      <Upload className="w-4 h-4" />
                      {uploadingMainImage ? t('common.loading') : t('admin.uploadImage')}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setUploadingMainImage(true)
                          try {
                            const { path } = await adminApi.uploadFile(file, 'image', {
                              baseName: buildUploadBaseName(title, 'achievement', editing?.id, 'image'),
                            })
                            setImageUrl(path)
                          } finally {
                            setUploadingMainImage(false)
                            e.target.value = ''
                          }
                        }}
                      />
                    </label>
                  </div>
                  {imageUrl && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={getMediaAssetUrl(imageUrl)} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementRarity')}</label>
                  <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="input w-full">
                    <option value="common">{t('achievements.rarityCommon')}</option>
                    <option value="uncommon">{t('achievements.rarityUncommon')}</option>
                    <option value="rare">{t('achievements.rarityRare')}</option>
                    <option value="epic">{t('achievements.rarityEpic')}</option>
                    <option value="legendary">{t('achievements.rarityLegendary')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementTargetType')}</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as 'genre' | 'franchise' | 'media_list')}
                    className="input w-full"
                  >
                    <option value="genre">{t('admin.achievementTargetGenre')}</option>
                    <option value="franchise">{t('admin.achievementTargetFranchise')}</option>
                    <option value="media_list">{t('admin.achievementTargetMediaList')}</option>
                  </select>
                </div>
                {targetType === 'genre' && (
                  <div ref={genreRef} className="relative">
                    <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementGenre')}</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={
                          genreOpen
                            ? genreSearchQuery
                            : genreId
                              ? (genres.find((g) => g.id === genreId)?.name ?? '')
                              : ''
                        }
                        onChange={(e) => {
                          setGenreSearchQuery(e.target.value)
                          setGenreOpen(true)
                          if (genreId) setGenreId('')
                        }}
                        onFocus={() => setGenreOpen(true)}
                        placeholder={t('common.search')}
                        className="input w-full"
                      />
                      {genreId && (
                        <button
                          type="button"
                          onClick={() => {
                            setGenreId('')
                            setGenreSearchQuery('')
                            setGenreOpen(true)
                          }}
                          className="btn-secondary shrink-0 p-2"
                          aria-label={t('common.close')}
                        >
                          <IconCross className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {genreOpen && (
                      <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        {genres
                          .filter(
                            (g) =>
                              !genreSearchQuery.trim() || g.name.toLowerCase().includes(genreSearchQuery.toLowerCase())
                          )
                          .slice(0, 50)
                          .map((g) => (
                            <li key={g.id}>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => {
                                  setGenreId(g.id)
                                  setGenreSearchQuery('')
                                  setGenreOpen(false)
                                }}
                              >
                                <IconSearch className="w-4 h-4 text-gray-400 shrink-0" />
                                {g.name}
                              </button>
                            </li>
                          ))}
                        {genres.filter(
                          (g) =>
                            !genreSearchQuery.trim() || g.name.toLowerCase().includes(genreSearchQuery.toLowerCase())
                        ).length === 0 && <li className="px-3 py-2 text-gray-500 text-sm">{t('common.noResults')}</li>}
                      </ul>
                    )}
                  </div>
                )}
                {targetType === 'franchise' && (
                  <div ref={franchiseRef} className="relative">
                    <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementFranchise')}</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={franchiseOpen ? franchiseSearchQuery : selectedFranchiseName}
                        onChange={(e) => {
                          setFranchiseSearchQuery(e.target.value)
                          setFranchiseOpen(true)
                          if (franchiseId) {
                            setFranchiseId('')
                            setSelectedFranchiseName('')
                          }
                        }}
                        onFocus={() => setFranchiseOpen(true)}
                        placeholder={t('common.search')}
                        className="input w-full"
                      />
                      {franchiseId && (
                        <button
                          type="button"
                          onClick={() => {
                            setFranchiseId('')
                            setSelectedFranchiseName('')
                            setFranchiseSearchQuery('')
                            setFranchiseOpen(true)
                          }}
                          className="btn-secondary shrink-0 p-2"
                          aria-label={t('common.close')}
                        >
                          <IconCross className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {franchiseOpen && (
                      <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        {franchiseLoading && <li className="px-3 py-2 text-gray-500 text-sm">{t('common.loading')}</li>}
                        {!franchiseLoading &&
                          franchiseResults.map((f) => (
                            <li key={f.id}>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => {
                                  setFranchiseId(f.id)
                                  setSelectedFranchiseName(getLocalizedString(f.nameI18n, f.name, locale))
                                  setFranchiseSearchQuery('')
                                  setFranchiseOpen(false)
                                }}
                              >
                                <IconSearch className="w-4 h-4 text-gray-400 shrink-0" />
                                {getLocalizedString(f.nameI18n, f.name, locale)}
                              </button>
                            </li>
                          ))}
                        {!franchiseLoading && !franchiseSearchQuery.trim() && (
                          <li className="px-3 py-2 text-gray-500 text-sm">
                            {t('admin.achievementFranchiseSearchHint')}
                          </li>
                        )}
                        {!franchiseLoading && franchiseSearchQuery.trim() && franchiseResults.length === 0 && (
                          <li className="px-3 py-2 text-gray-500 text-sm">{t('common.noResults')}</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
                {targetType === 'media_list' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementMediaIdsJson')}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mediaIdsJson}
                          onChange={(e) => setMediaIdsJson(e.target.value)}
                          className="input flex-1 font-mono text-sm"
                          placeholder='{"movie": [1,2], "manga": [3]}'
                        />
                        <button
                          type="button"
                          onClick={applyMediaIdsJson}
                          className="btn-secondary flex items-center gap-1"
                        >
                          <FileJson className="w-4 h-4" />
                          {t('admin.translationsApplyJson')}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t('admin.achievementMediaIdsByType')}</label>
                      <div className="space-y-1">
                        {MEDIA_TYPES.map((mt) => (
                          <div key={mt} className="flex items-center gap-2">
                            <span className="w-28 text-sm text-gray-600">{mt}</span>
                            <input
                              type="text"
                              value={(mediaIdsByType[mt] ?? []).join(', ')}
                              onChange={(e) => {
                                const v = e.target.value
                                  .split(/[\s,]+/)
                                  .map((s) => parseInt(s, 10))
                                  .filter((n) => !Number.isNaN(n))
                                setMediaIdsForType(mt, v)
                              }}
                              className="input flex-1 text-sm"
                              placeholder="1, 2, 3"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm text-gray-600 mb-0.5">{t('admin.achievementOrderNum')}</label>
                  <input
                    type="number"
                    value={orderNum}
                    onChange={(e) => setOrderNum(parseInt(e.target.value, 10) || 0)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm text-gray-600">{t('admin.achievementLevels')}</label>
                    <button
                      type="button"
                      onClick={addLevel}
                      className="text-sm text-lavender-600 hover:underline flex items-center gap-1"
                    >
                      <IconPlus className="w-3 h-3" />
                      {t('admin.achievementAddLevel')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{t('admin.achievementThresholdPercent')}</p>
                  <div className="space-y-3">
                    {levels.map((lv, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-lg space-y-2">
                        <div className="flex gap-2 flex-wrap items-center">
                          <label
                            className="text-xs text-gray-500 shrink-0 min-w-[7.5rem]"
                            htmlFor={`level-order-${idx}`}
                          >
                            {t('admin.achievementLevelOrder')}
                          </label>
                          <input
                            id={`level-order-${idx}`}
                            type="number"
                            value={lv.levelOrder}
                            onChange={(e) => updateLevel(idx, { levelOrder: parseInt(e.target.value, 10) || 0 })}
                            placeholder="1"
                            className="input w-14 shrink-0"
                            title={t('admin.achievementLevelOrder')}
                          />
                          <span className="text-xs text-gray-500 shrink-0">%</span>
                          <input
                            type="number"
                            value={lv.thresholdPercent}
                            onChange={(e) => updateLevel(idx, { thresholdPercent: parseInt(e.target.value, 10) || 0 })}
                            placeholder="25"
                            className="input w-14 shrink-0"
                            min={0}
                            max={100}
                            title={t('admin.achievementThresholdPercent')}
                          />
                          <input
                            type="text"
                            value={lv.title}
                            onChange={(e) => updateLevel(idx, { title: e.target.value })}
                            placeholder={t('admin.achievementLevelTitle')}
                            className="input flex-1 min-w-[120px]"
                          />
                          <button
                            type="button"
                            onClick={() => removeLevel(idx)}
                            className="p-1.5 rounded hover:bg-red-100 text-red-600 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          <input
                            type="text"
                            value={lv.imageUrl ?? ''}
                            onChange={(e) => updateLevel(idx, { imageUrl: e.target.value || undefined })}
                            placeholder={t('admin.achievementImageUrl')}
                            className="input flex-1 min-w-[140px] text-sm"
                          />
                          <label className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium cursor-pointer disabled:opacity-50">
                            <Upload className="w-3 h-3" />
                            {uploadingLevelIdx === idx ? t('common.loading') : t('admin.uploadImage')}
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setUploadingLevelIdx(idx)
                                try {
                                  const { path } = await adminApi.uploadFile(file, 'image', {
                                    baseName: buildUploadBaseName(
                                      title,
                                      'achievement',
                                      editing?.id,
                                      'level-image',
                                      idx + 1
                                    ),
                                  })
                                  updateLevel(idx, { imageUrl: path })
                                } finally {
                                  setUploadingLevelIdx(null)
                                  e.target.value = ''
                                }
                              }}
                            />
                          </label>
                          {lv.imageUrl && (
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              <img src={getMediaAssetUrl(lv.imageUrl)} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <TranslationsEditor value={lv.titleI18n} onChange={(v) => updateLevel(idx, { titleI18n: v })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={submit} disabled={saving} className="btn-primary">
                  {saving ? t('common.loading') : editing ? t('common.save') : t('admin.achievementCreate')}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
