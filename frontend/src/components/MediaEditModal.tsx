import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link2, Upload, ImagePlus, Trash2 } from 'lucide-react'
import { IconCross, IconPlus, IconTypeMovie, IconGroup } from '@/components/icons'
import VideoThumbnail from '@/components/VideoThumbnail'
import CustomSelect from '@/components/CustomSelect'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { titleToSlug } from '@/utils/slug'
import { buildUploadBaseName } from '@/utils/uploadNames'
import { adminApi } from '@/api/admin'
import { personsApi } from '@/api/persons'
import { charactersApi } from '@/api/characters'
import type {
  Media,
  Genre,
  Theme,
  Studio,
  Developer,
  Publisher,
  LocalizedString,
  Cast,
  Person,
  Character,
  MediaStaff,
  PublisherPublicationType,
} from '@/types'
import type { AdminMediaVideoInput, Platform } from '@/api/admin'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaTitle, getMediaDescription, getEntityName } from '@/utils/localizedText'
import { getPersonDisplayName } from '@/utils/personUtils'
import { getMediaReadingDurationMinutes } from '@/utils/typeGuards'
import { AGE_RATINGS, ROLE_TYPES, STAFF_PROFESSIONS } from '@/constants/enums'
import type { RoleType, Profession } from '@/constants/enums'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import { publisherSupportsType } from '@/constants/publisherPublicationTypes'

const PATH_TO_MEDIA_TYPE: Record<MediaTypeForPath, string> = {
  movie: 'movies',
  anime: 'anime',
  game: 'games',
  'tv-series': 'tv-series',
  manga: 'manga',
  book: 'books',
  'light-novel': 'light-novels',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

const MEDIA_STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'announced', labelKey: 'mediaStatus.announced' },
  { value: 'in_production', labelKey: 'mediaStatus.in_production' },
  { value: 'released', labelKey: 'mediaStatus.released' },
  { value: 'finished', labelKey: 'mediaStatus.finished' },
  { value: 'cancelled', labelKey: 'mediaStatus.cancelled' },
  { value: 'postponed', labelKey: 'mediaStatus.postponed' },
]

function detectSiteFromUrl(link: string, sites: { id: number; url: string }[]): number | null {
  const trimmed = link.trim()
  if (!trimmed || sites.length === 0) return null
  const lower = trimmed.toLowerCase()
  const sorted = [...sites].sort((a, b) => b.url.length - a.url.length)
  for (const site of sorted) {
    const base = site.url.toLowerCase().replace(/\/+$/, '')
    if (!base) continue
    if (lower.startsWith(base) || lower.includes(base)) return site.id
  }
  try {
    const linkHost = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).hostname.toLowerCase()
    for (const site of sorted) {
      try {
        const siteUrl = site.url.startsWith('http') ? site.url : `https://${site.url}`
        const siteHost = new URL(siteUrl).hostname.toLowerCase()
        if (linkHost === siteHost || linkHost.endsWith('.' + siteHost)) return site.id
      } catch {}
    }
  } catch {}
  return null
}

export interface MediaEditModalProps {
  open: boolean
  onClose: () => void
  media: Media | null
  mediaType: MediaTypeForPath
  locale: string
  onSaved?: (updated: Media) => void
}

export default function MediaEditModal({ open, onClose, media, mediaType, locale, onSaved }: MediaEditModalProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [genresList, setGenresList] = useState<Genre[]>([])
  const [themesList, setThemesList] = useState<Theme[]>([])
  const [studiosList, setStudiosList] = useState<Studio[]>([])
  const [platformsList, setPlatformsList] = useState<Platform[]>([])
  const [developersList, setDevelopersList] = useState<Developer[]>([])
  const [publishersList, setPublishersList] = useState<Publisher[]>([])
  const [sitesList, setSitesList] = useState<{ id: number; name: string; url: string }[]>([])
  const [genreSearch, setGenreSearch] = useState('')
  const [themeSearch, setThemeSearch] = useState('')
  const [studioSearch, setStudioSearch] = useState('')
  const [publisherSearch, setPublisherSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<'genre' | 'theme' | 'studio' | 'publisher' | null>(null)
  const [uploading, setUploading] = useState<'poster' | 'backdrop' | 'image' | 'trailer' | null>(null)
  const [formTitleI18n, setFormTitleI18n] = useState<LocalizedString>({})
  const [formDescriptionI18n, setFormDescriptionI18n] = useState<LocalizedString>({})
  const [form, setForm] = useState({
    title: '',
    description: '',
    releaseDate: '',
    poster: '',
    backdrop: '',
    rating: '',
    duration: '',
    country: '',
    ageRating: '',
    status: '',
    isHidden: false,
    genreIds: [] as number[],
    themeIds: [] as number[],
    studioIds: [] as number[],
    sites: [] as { siteId: number; url: string }[],
    images: [] as { url: string; caption: string; width?: number; height?: number }[],
    videos: [] as AdminMediaVideoInput[],
    platformIds: [] as number[],
    developerIds: [] as number[],
    publisherIds: [] as number[],
    authorIds: [] as number[],
    illustratorIds: [] as number[],
    authorIdsStr: '',
    illustratorIdsStr: '',
    volumes: '',
    currentVolume: '',
    currentChapter: '',
    pages: '',
    readingDuration: '',
    /** Аниме: сезон выхода (winter, spring, summer, autumn) */
    animeSeason: '' as '' | 'winter' | 'spring' | 'summer' | 'autumn',
    titleKatakana: '',
    titleRomaji: '',
  })

  const buildVideoUploadBaseName = (videoNumber: number): string | undefined => {
    if (!media?.id) return undefined
    const slug = titleToSlug(form.title)
    if (!slug) return undefined
    return `${slug}-${mediaType}-${media.id}-video-${videoNumber}`
  }

  const schema = useMemo(() => {
    const hasDuration = ['movie', 'cartoon-movies', 'anime-movies'].includes(mediaType)
    const hasCountry = ['movie', 'tv-series', 'anime', 'cartoon-series', 'cartoon-movies', 'anime-movies'].includes(
      mediaType
    )
    const hasStudios = hasCountry
    const hasGameFields = mediaType === 'game'
    const hasMangaFields = mediaType === 'manga'
    const hasBookFields = mediaType === 'book'
    const hasLightNovelFields = mediaType === 'light-novel'
    const hasCastSection = ['movie', 'tv-series', 'anime', 'cartoon-series', 'cartoon-movies', 'anime-movies'].includes(
      mediaType
    )
    const hasStaffSection = mediaType === 'movie'
    const hasAnimeSeason = mediaType === 'anime'
    return {
      hasDuration,
      hasCountry,
      hasStudios,
      hasGameFields,
      hasMangaFields,
      hasBookFields,
      hasLightNovelFields,
      hasCastSection,
      hasStaffSection,
      hasAnimeSeason,
    }
  }, [mediaType])

  const [personSearch, setPersonSearch] = useState('')
  const [personResults, setPersonResults] = useState<Person[]>([])
  const [characterSearch, setCharacterSearch] = useState('')
  const [characterResults, setCharacterResults] = useState<Character[]>([])
  const [addCastPerson, setAddCastPerson] = useState<Person | null>(null)
  const [addCastCharacter, setAddCastCharacter] = useState<Character | null>(null)
  const [addCastRole, setAddCastRole] = useState('')
  const [addCastRoleType, setAddCastRoleType] = useState<RoleType>('main')
  const [staffPersonSearch, setStaffPersonSearch] = useState('')
  const [staffPersonResults, setStaffPersonResults] = useState<Person[]>([])
  const [addStaffPerson, setAddStaffPerson] = useState<Person | null>(null)
  const [addStaffProfession, setAddStaffProfession] = useState<Profession>('director')
  const [castStaffSaving, setCastStaffSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<
    { type: 'cast'; cast: Cast; name: string } | { type: 'staff'; staff: MediaStaff; name: string } | null
  >(null)

  useEffect(() => {
    if (!open) return
    adminApi
      .getGenres()
      .then(setGenresList)
      .catch(() => setGenresList([]))
    adminApi
      .getThemes()
      .then(setThemesList)
      .catch(() => setThemesList([]))
    adminApi
      .getStudios()
      .then(setStudiosList)
      .catch(() => setStudiosList([]))
    adminApi
      .getPlatforms()
      .then(setPlatformsList)
      .catch(() => setPlatformsList([]))
    adminApi
      .getDevelopers()
      .then(setDevelopersList)
      .catch(() => setDevelopersList([]))
    adminApi
      .getPublishers()
      .then(setPublishersList)
      .catch(() => setPublishersList([]))
    adminApi
      .getSites()
      .then(setSitesList)
      .catch(() => setSitesList([]))
  }, [open])

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    document.body.style.overflow = ''
  }, [open])

  useEffect(() => {
    if (!open || !media) return
    const m = media as Media & {
      releaseDate?: string
      rating?: number
      duration?: number
      country?: string
      ageRating?: string
      status?: string
      isHidden?: boolean
      backdrop?: string
      season?: string
      titleKatakana?: string
      titleRomaji?: string
      genres?: { id: number }[]
      themes?: { id: number }[]
      studios?: { id: number }[]
      sites?: { siteId?: number; site?: { id: number }; url?: string }[]
      titleI18n?: LocalizedString
      descriptionI18n?: LocalizedString
      platforms?: { id: number }[]
      developers?: { id: number }[]
      publishers?: { id: number }[]
      authors?: { id: number }[]
      illustrators?: { id: number }[]
      volumes?: number
      currentVolume?: number
      currentChapter?: number
      pages?: number
      readingDurationMinutes?: number
    }
    setFormTitleI18n(m.titleI18n ?? {})
    setFormDescriptionI18n(m.descriptionI18n ?? {})
    const rd = m.releaseDate != null ? String(m.releaseDate).slice(0, 10) : ''
    const animeSeason = m.season && ['winter', 'spring', 'summer', 'autumn'].includes(m.season) ? m.season : ''
    setForm({
      title: getMediaTitle(media, locale) || (m.title ?? ''),
      description: getMediaDescription(media, locale) || (m.description ?? ''),
      releaseDate: rd,
      animeSeason: animeSeason as '' | 'winter' | 'spring' | 'summer' | 'autumn',
      titleKatakana: m.titleKatakana ?? '',
      titleRomaji: m.titleRomaji ?? '',
      poster: (m.poster ?? '') as string,
      backdrop: (m as { backdrop?: string }).backdrop ?? '',
      rating: (m as { rating?: number }).rating != null ? String((m as { rating?: number }).rating) : '',
      duration: (m as { duration?: number }).duration != null ? String((m as { duration?: number }).duration) : '',
      country: (m.country ?? '') as string,
      ageRating: (m as { ageRating?: string }).ageRating ?? '',
      status: (m as { status?: string }).status ?? '',
      isHidden: (m as { isHidden?: boolean }).isHidden ?? false,
      genreIds: Array.isArray(m.genres)
        ? (m.genres as { id: number }[]).map((g) => g?.id).filter((id): id is number => id != null)
        : [],
      themeIds: Array.isArray(m.themes)
        ? (m.themes as { id: number }[]).map((th) => th?.id).filter((id): id is number => id != null)
        : [],
      studioIds: Array.isArray(m.studios)
        ? (m.studios as { id: number }[]).map((s) => s?.id).filter((id): id is number => id != null)
        : [],
      sites: Array.isArray(m.sites)
        ? (m.sites as { siteId?: number; site?: { id: number }; url?: string }[]).map((s) => ({
            siteId: s.siteId ?? s.site?.id ?? 0,
            url: s.url ?? '',
          }))
        : [],
      images: Array.isArray(m.images)
        ? (m.images as (string | { url?: string; caption?: string; width?: number; height?: number })[])
            .map((x) => {
              if (typeof x === 'string') return { url: x, caption: '' }
              const o = x ?? {}
              return {
                url: o.url ?? '',
                caption: typeof o.caption === 'string' ? o.caption : '',
                width: typeof o.width === 'number' ? o.width : undefined,
                height: typeof o.height === 'number' ? o.height : undefined,
              }
            })
            .filter((item) => item.url)
        : [],
      videos: Array.isArray(m.videos)
        ? (m.videos as ({ url?: string; name?: string } | string)[])
            .map((x) => ({
              url: typeof x === 'string' ? x : (x?.url ?? ''),
              name:
                typeof x === 'object' && x != null && 'name' in x ? String((x as { name?: unknown }).name ?? '') : '',
            }))
            .filter((item) => item.url)
        : [],
      platformIds: Array.isArray(m.platforms)
        ? (m.platforms as { id: number }[]).map((p) => p?.id).filter((id): id is number => id != null)
        : [],
      developerIds: Array.isArray(m.developers)
        ? (m.developers as { id: number }[]).map((d) => d?.id).filter((id): id is number => id != null)
        : [],
      publisherIds: Array.isArray(m.publishers)
        ? (m.publishers as { id: number }[]).map((p) => p?.id).filter((id): id is number => id != null)
        : [],
      authorIds: Array.isArray(m.authors)
        ? (m.authors as { id: number }[]).map((a) => a?.id).filter((id): id is number => id != null)
        : [],
      illustratorIds: Array.isArray(m.illustrators)
        ? (m.illustrators as { id: number }[]).map((i) => i?.id).filter((id): id is number => id != null)
        : [],
      authorIdsStr: Array.isArray(m.authors)
        ? (m.authors as { id: number }[])
            .map((a) => a?.id)
            .filter((id): id is number => id != null)
            .join(', ')
        : '',
      illustratorIdsStr: Array.isArray(m.illustrators)
        ? (m.illustrators as { id: number }[])
            .map((i) => i?.id)
            .filter((id): id is number => id != null)
            .join(', ')
        : '',
      volumes: m.volumes != null ? String(m.volumes) : '',
      currentVolume: m.currentVolume != null ? String(m.currentVolume) : '',
      currentChapter: m.currentChapter != null ? String(m.currentChapter) : '',
      pages: m.pages != null ? String(m.pages) : '',
      readingDuration: getMediaReadingDurationMinutes(m) != null ? String(getMediaReadingDurationMinutes(m)) : '',
    })
  }, [open, media, locale])

  const selectedGenres = useMemo(
    () => genresList.filter((g) => form.genreIds.includes(g.id)),
    [genresList, form.genreIds]
  )
  const genreOptions = useMemo(() => {
    const q = genreSearch.trim().toLowerCase()
    return genresList.filter((g) => !form.genreIds.includes(g.id) && (!q || (g.name ?? '').toLowerCase().includes(q)))
  }, [genresList, form.genreIds, genreSearch])
  const selectedThemes = useMemo(
    () => themesList.filter((th) => form.themeIds.includes(th.id)),
    [themesList, form.themeIds]
  )
  const themeOptions = useMemo(() => {
    const q = themeSearch.trim().toLowerCase()
    return themesList.filter(
      (th) => !form.themeIds.includes(th.id) && (!q || (th.name ?? '').toLowerCase().includes(q))
    )
  }, [themesList, form.themeIds, themeSearch])
  const selectedStudios = useMemo(
    () => studiosList.filter((s) => form.studioIds.includes(s.id)),
    [studiosList, form.studioIds]
  )
  const studioOptions = useMemo(() => {
    const q = studioSearch.trim().toLowerCase()
    return studiosList.filter((s) => !form.studioIds.includes(s.id) && (!q || (s.name ?? '').toLowerCase().includes(q)))
  }, [studiosList, form.studioIds, studioSearch])
  const publisherFilterType = useMemo<PublisherPublicationType | null>(() => {
    if (mediaType === 'game' || mediaType === 'manga' || mediaType === 'book' || mediaType === 'light-novel')
      return mediaType
    return null
  }, [mediaType])
  const availablePublishers = useMemo(
    () =>
      publishersList.filter(
        (publisher) => !publisherFilterType || publisherSupportsType(publisher.publicationTypes, publisherFilterType)
      ),
    [publishersList, publisherFilterType]
  )
  const selectedPublishers = useMemo(
    () => publishersList.filter((p) => form.publisherIds.includes(p.id)),
    [publishersList, form.publisherIds]
  )
  const publisherOptions = useMemo(() => {
    const q = publisherSearch.trim().toLowerCase()
    return availablePublishers.filter(
      (p) => !form.publisherIds.includes(p.id) && (!q || (p.name ?? '').toLowerCase().includes(q))
    )
  }, [availablePublishers, form.publisherIds, publisherSearch])

  const toggleGenre = (id: number) => {
    setForm((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id) ? f.genreIds.filter((x) => x !== id) : [...f.genreIds, id],
    }))
  }
  const toggleTheme = (id: number) => {
    setForm((f) => ({
      ...f,
      themeIds: f.themeIds.includes(id) ? f.themeIds.filter((x) => x !== id) : [...f.themeIds, id],
    }))
  }
  const toggleStudio = (id: number) => {
    setForm((f) => ({
      ...f,
      studioIds: f.studioIds.includes(id) ? f.studioIds.filter((x) => x !== id) : [...f.studioIds, id],
    }))
  }
  const togglePlatform = (id: number) => {
    setForm((f) => ({
      ...f,
      platformIds: f.platformIds.includes(id) ? f.platformIds.filter((x) => x !== id) : [...f.platformIds, id],
    }))
  }
  const toggleDeveloper = (id: number) => {
    setForm((f) => ({
      ...f,
      developerIds: f.developerIds.includes(id) ? f.developerIds.filter((x) => x !== id) : [...f.developerIds, id],
    }))
  }
  const togglePublisher = (id: number) => {
    setForm((f) => ({
      ...f,
      publisherIds: f.publisherIds.includes(id) ? f.publisherIds.filter((x) => x !== id) : [...f.publisherIds, id],
    }))
  }

  const handleSave = async () => {
    if (!media?.id || saving) return
    setSaving(true)
    try {
      const titleI18n = Object.keys(formTitleI18n).length ? formTitleI18n : undefined
      const descriptionI18n = Object.keys(formDescriptionI18n).length ? formDescriptionI18n : undefined
      const payload: Record<string, unknown> = {
        title: form.title.trim() || undefined,
        titleI18n,
        description: form.description.trim() || undefined,
        descriptionI18n,
        releaseDate: form.releaseDate || undefined,
        poster: form.poster.trim() || undefined,
        backdrop: form.backdrop.trim() || undefined,
        images: form.images.length ? form.images : undefined,
        videos: form.videos.length ? form.videos : undefined,
        rating: form.rating ? parseFloat(form.rating) : undefined,
        duration: form.duration ? parseInt(form.duration, 10) : undefined,
        country: form.country.trim() || undefined,
        ageRating: form.ageRating.trim() || undefined,
        genreIds: form.genreIds.length ? form.genreIds : undefined,
        themeIds: form.themeIds.length ? form.themeIds : undefined,
        studioIds: form.studioIds.length ? form.studioIds : undefined,
        isHidden: form.isHidden,
        status: form.status || undefined,
        sites: form.sites.filter((s) => s.siteId > 0 && s.url.trim() !== ''),
      }
      if (schema.hasAnimeSeason) {
        if (form.animeSeason) payload.season = form.animeSeason
        payload.titleKatakana = form.titleKatakana.trim() || undefined
        payload.titleRomaji = form.titleRomaji.trim() || undefined
      }
      if (schema.hasGameFields) {
        payload.platformIds = form.platformIds.length ? form.platformIds : undefined
        payload.developerIds = form.developerIds.length ? form.developerIds : undefined
        payload.publisherIds = form.publisherIds.length ? form.publisherIds : undefined
      }
      if (schema.hasMangaFields || schema.hasBookFields || schema.hasLightNovelFields) {
        payload.publisherIds = form.publisherIds.length ? form.publisherIds : undefined
        const parsedAuthorIds = form.authorIdsStr.trim()
          ? form.authorIdsStr
              .split(',')
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !Number.isNaN(n))
          : []
        payload.authorIds = parsedAuthorIds.length ? parsedAuthorIds : undefined
        if (schema.hasMangaFields) {
          payload.volumes = form.volumes ? parseInt(form.volumes, 10) : undefined
          payload.currentVolume = form.currentVolume ? parseInt(form.currentVolume, 10) : undefined
          payload.currentChapter = form.currentChapter ? parseInt(form.currentChapter, 10) : undefined
        }
        if (schema.hasBookFields) {
          payload.pages = form.pages ? parseInt(form.pages, 10) : undefined
          payload.readingDurationMinutes = form.readingDuration ? parseInt(form.readingDuration, 10) : undefined
        }
        if (schema.hasLightNovelFields) {
          payload.volumes = form.volumes ? parseInt(form.volumes, 10) : undefined
          payload.currentVolume = form.currentVolume ? parseInt(form.currentVolume, 10) : undefined
          payload.pages = form.pages ? parseInt(form.pages, 10) : undefined
          const parsedIllustratorIds = form.illustratorIdsStr.trim()
            ? form.illustratorIdsStr
                .split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !Number.isNaN(n))
            : []
          payload.illustratorIds = parsedIllustratorIds.length ? parsedIllustratorIds : undefined
        }
      }
      const updated =
        mediaType === 'movie'
          ? await adminApi.updateMovie(media.id, payload as Parameters<typeof adminApi.updateMovie>[1])
          : await adminApi.updateMedia(
              PATH_TO_MEDIA_TYPE[mediaType],
              media.id,
              payload as Parameters<typeof adminApi.updateMedia>[2]
            )
      onSaved?.(updated as Media)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const castList = (media as { cast?: Cast[] })?.cast ?? []
  const staffList = (media as { staff?: MediaStaff[] })?.staff ?? []

  const searchPersons = async () => {
    const q = personSearch.trim()
    if (!q) return
    const res = await personsApi.getList(1, 20, q)
    setPersonResults(res.data ?? [])
  }
  const searchCharacters = async () => {
    const q = characterSearch.trim()
    if (!q) return
    const res = await charactersApi.getList(1, 20, q)
    setCharacterResults(res.data ?? [])
  }
  const searchStaffPersons = async () => {
    const q = staffPersonSearch.trim()
    if (!q) return
    const res = await personsApi.getList(1, 20, q)
    setStaffPersonResults(res.data ?? [])
  }

  const handleAddCast = async () => {
    if (!media?.id || castStaffSaving) return
    const personId = addCastPerson?.id
    if (!personId) return
    if (!addCastPerson && !addCastCharacter && !addCastRole.trim()) return
    setCastStaffSaving(true)
    try {
      const created = await adminApi.addMediaCast(mediaType, media.id, {
        personId,
        characterId: addCastCharacter?.id,
        role: addCastRole.trim() || undefined,
        roleType: addCastRoleType,
      })
      onSaved?.({ ...media, cast: [...castList, created] } as Media)
      setAddCastPerson(null)
      setAddCastCharacter(null)
      setAddCastRole('')
      setAddCastRoleType('main')
    } catch {
    } finally {
      setCastStaffSaving(false)
    }
  }

  const handleRemoveCast = async (cast: Cast) => {
    if (!media?.id || castStaffSaving) return
    setCastStaffSaving(true)
    try {
      await adminApi.removeMediaCast(mediaType, media.id, cast.id)
      onSaved?.({ ...media, cast: castList.filter((c) => c.id !== cast.id) } as Media)
      setDeleteConfirm(null)
    } catch {
    } finally {
      setCastStaffSaving(false)
    }
  }

  const handleAddStaff = async () => {
    if (!media?.id || castStaffSaving || mediaType !== 'movie') return
    if (!addStaffPerson) return
    setCastStaffSaving(true)
    try {
      const created = await adminApi.addMediaStaff(mediaType, media.id, {
        personId: addStaffPerson.id,
        profession: addStaffProfession,
      })
      onSaved?.({ ...media, staff: [...staffList, created] } as Media)
      setAddStaffPerson(null)
      setStaffPersonSearch('')
    } catch {
    } finally {
      setCastStaffSaving(false)
    }
  }

  const handleRemoveStaff = async (staff: MediaStaff) => {
    if (!media?.id || castStaffSaving || mediaType !== 'movie') return
    setCastStaffSaving(true)
    try {
      await adminApi.removeMediaStaff(mediaType, media.id, staff.id)
      onSaved?.({ ...media, staff: staffList.filter((s) => s.id !== staff.id) } as Media)
      setDeleteConfirm(null)
    } catch {
    } finally {
      setCastStaffSaving(false)
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm?.type === 'cast') handleRemoveCast(deleteConfirm.cast)
    else if (deleteConfirm?.type === 'staff') handleRemoveStaff(deleteConfirm.staff)
  }

  if (!open) return null

  return (
    <div className="modal-overlay-root fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0">
      <div className="fixed inset-0 z-0 bg-black/50 min-h-[100dvh]" onClick={() => !saving && onClose()} aria-hidden />
      <div
        className="relative z-10 min-h-[100dvh] flex items-center justify-center pt-4 px-4"
        onClick={() => !saving && onClose()}
      >
        <div
          className="relative modal-panel rounded-2xl shadow-xl border max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-lg font-semibold">{t('common.edit')}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-theme-muted hover:text-theme rounded-lg"
              aria-label={t('common.close')}
            >
              <IconCross className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-theme">{t('admin.name')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input w-full"
            />
            <label className="block text-sm font-medium text-theme">{t('admin.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input w-full min-h-[80px]"
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">{t('admin.translationsName')} (title)</label>
              <TranslationsEditor value={formTitleI18n} onChange={setFormTitleI18n} className="mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">{t('admin.translationsDescription')}</label>
              <TranslationsEditor value={formDescriptionI18n} onChange={setFormDescriptionI18n} className="mt-1" />
            </div>
            <label className="block text-sm font-medium text-theme">{t('media.releaseDate')}</label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))}
              className="input w-full"
            />
            {schema.hasAnimeSeason && (
              <>
                <CustomSelect
                  label={`${t('media.season')} (зима/весна/лето/осень)`}
                  value={form.animeSeason}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, animeSeason: v as '' | 'winter' | 'spring' | 'summer' | 'autumn' }))
                  }
                  placeholder="—"
                  options={[
                    { value: '', label: '—' },
                    { value: 'winter', label: t('media.seasonWinter') },
                    { value: 'spring', label: t('media.seasonSpring') },
                    { value: 'summer', label: t('media.seasonSummer') },
                    { value: 'autumn', label: t('media.seasonAutumn') },
                  ]}
                />
                <label className="block text-sm font-medium text-theme">
                  {t('admin.animeTitleRomaji', { defaultValue: 'Транслит (ромадзи)' })}
                </label>
                <input
                  type="text"
                  value={form.titleRomaji}
                  onChange={(e) => setForm((f) => ({ ...f, titleRomaji: e.target.value }))}
                  className="input w-full"
                  placeholder="Hagane no Renkinjutsushi"
                />
                <label className="block text-sm font-medium text-theme">
                  {t('admin.animeTitleKatakana', { defaultValue: 'Оригинальное название (катакана)' })}
                </label>
                <input
                  type="text"
                  value={form.titleKatakana}
                  onChange={(e) => setForm((f) => ({ ...f, titleKatakana: e.target.value }))}
                  className="input w-full"
                  placeholder="鋼の錬金術師"
                />
              </>
            )}
            <label className="block text-sm font-medium text-theme">{t('admin.poster')}</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={form.poster}
                onChange={(e) => setForm((f) => ({ ...f, poster: e.target.value }))}
                className="input flex-1 min-w-[200px]"
                placeholder="/uploads/posters/…"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-theme-bg-alt hover:bg-theme-surface text-theme text-sm font-medium cursor-pointer disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {uploading === 'poster' ? t('common.loading') : t('admin.uploadImage')}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading('poster')
                    try {
                      const { path } = await adminApi.uploadFile(file, 'poster', {
                        baseName: buildUploadBaseName(form.title, mediaType, media?.id, 'poster'),
                      })
                      setForm((f) => ({ ...f, poster: path }))
                    } finally {
                      setUploading(null)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>
            {form.poster && (
              <div className="mt-1 w-24 h-32 rounded-lg overflow-hidden bg-theme-bg-alt border border-theme">
                <img src={getMediaAssetUrl(form.poster)} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="block text-sm font-medium text-theme mt-3">
              {t('admin.backdrop', { defaultValue: 'Задник' })}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={form.backdrop}
                onChange={(e) => setForm((f) => ({ ...f, backdrop: e.target.value }))}
                className="input flex-1 min-w-[200px]"
                placeholder="/uploads/backdrops/…"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-theme-bg-alt hover:bg-theme-surface text-theme text-sm font-medium cursor-pointer disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {uploading === 'backdrop' ? t('common.loading') : t('admin.uploadImage')}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading('backdrop')
                    try {
                      const { path } = await adminApi.uploadFile(file, 'backdrop', {
                        baseName: buildUploadBaseName(form.title, mediaType, media?.id, 'backdrop'),
                      })
                      setForm((f) => ({ ...f, backdrop: path }))
                    } finally {
                      setUploading(null)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>
            {form.backdrop && (
              <div className="mt-1 max-w-full w-48 h-24 rounded-lg overflow-hidden bg-theme-bg-alt border border-theme">
                <img src={getMediaAssetUrl(form.backdrop)} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="border-t border-theme pt-3 mt-3">
              <label className="block text-sm font-medium text-theme mb-2 flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4" />
                {t('admin.gallery')}
              </label>
              <div className="flex flex-wrap gap-3 mb-2">
                {form.images.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1 w-24">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-theme-bg-alt border border-theme group">
                      <img src={getMediaAssetUrl(item.url)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white rounded-lg transition-opacity"
                        aria-label={t('common.remove')}
                      >
                        <IconCross className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          images: f.images.map((img, i) => (i === idx ? { ...img, caption: e.target.value } : img)),
                        }))
                      }
                      placeholder={t('admin.imageCaption') || 'Подпись'}
                      className="w-full text-xs border border-theme rounded px-1 py-0.5 bg-theme-surface"
                    />
                    <div className="flex items-center gap-0.5 text-xs text-theme-muted">
                      <input
                        type="number"
                        min={1}
                        placeholder="Ш"
                        value={item.width ?? ''}
                        onChange={(e) => {
                          const v = e.target.value ? parseInt(e.target.value, 10) : undefined
                          setForm((f) => ({
                            ...f,
                            images: f.images.map((img, i) =>
                              i === idx ? { ...img, width: Number.isNaN(v as number) ? undefined : v } : img
                            ),
                          }))
                        }}
                        className="w-10 text-xs border border-theme rounded px-0.5 py-0.5 bg-theme-surface"
                      />
                      <span>×</span>
                      <input
                        type="number"
                        min={1}
                        placeholder="В"
                        value={item.height ?? ''}
                        onChange={(e) => {
                          const v = e.target.value ? parseInt(e.target.value, 10) : undefined
                          setForm((f) => ({
                            ...f,
                            images: f.images.map((img, i) =>
                              i === idx ? { ...img, height: Number.isNaN(v as number) ? undefined : v } : img
                            ),
                          }))
                        }}
                        className="w-10 text-xs border border-theme rounded px-0.5 py-0.5 bg-theme-surface"
                      />
                    </div>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-theme flex items-center justify-center cursor-pointer hover:border-theme hover:bg-theme-bg-alt text-theme-muted disabled:opacity-50 self-start">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading('image')
                      try {
                        const res = await adminApi.uploadFile(file, 'image', {
                          baseName: buildUploadBaseName(
                            form.title,
                            mediaType,
                            media?.id,
                            'image',
                            form.images.length + 1
                          ),
                        })
                        setForm((f) => ({
                          ...f,
                          images: [...f.images, { url: res.path, caption: '', width: res.width, height: res.height }],
                        }))
                      } finally {
                        setUploading(null)
                        e.target.value = ''
                      }
                    }}
                  />
                  {uploading === 'image' ? (
                    <span className="text-xs">{t('common.loading')}</span>
                  ) : (
                    <IconPlus className="w-6 h-6" />
                  )}
                </label>
              </div>
            </div>
            <div className="border-t border-theme pt-3 mt-3">
              <label className="block text-sm font-medium text-theme mb-2 flex items-center gap-1.5">
                <IconTypeMovie className="w-4 h-4" />
                {t('admin.trailers')}
              </label>
              <ul className="space-y-1 mb-2">
                {form.videos.map((video, idx) => (
                  <li key={idx} className="flex flex-col gap-2 rounded-lg border border-theme p-3">
                    <VideoThumbnail
                      videoUrl={video.url}
                      title={video.name}
                      className="aspect-video w-full max-w-xs rounded-lg"
                    />
                    <span className="truncate min-w-0 text-sm text-[var(--theme-text-muted)]">{video.url}</span>
                    <input
                      type="text"
                      value={video.name ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          videos: f.videos.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item)),
                        }))
                      }
                      className="input w-full"
                      placeholder="Название трейлера"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, videos: f.videos.filter((_, i) => i !== idx) }))}
                      className="self-end p-1 text-[var(--theme-text-muted)] hover:text-red-500 rounded"
                      aria-label={t('common.remove')}
                    >
                      <IconCross className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-theme-bg-alt hover:bg-theme-surface text-theme text-sm font-medium cursor-pointer disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {uploading === 'trailer' ? t('common.loading') : t('admin.uploadVideo')}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading('trailer')
                    try {
                      const { path } = await adminApi.uploadFile(file, 'trailer', {
                        baseName: buildVideoUploadBaseName(form.videos.length + 1),
                      })
                      setForm((f) => ({ ...f, videos: [...f.videos, { url: path, name: '' }] }))
                    } finally {
                      setUploading(null)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-theme">{t('media.rating')}</label>
                <input
                  type="text"
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  className="input w-full"
                  placeholder="0–10"
                />
              </div>
              {schema.hasDuration && (
                <div>
                  <label className="block text-sm font-medium text-theme">{t('media.duration')}</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    className="input w-full"
                    placeholder={t('media.minutes')}
                  />
                </div>
              )}
            </div>
            {schema.hasCountry && (
              <>
                <label className="block text-sm font-medium text-theme">{t('admin.country')}</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="input w-full"
                />
              </>
            )}
            <CustomSelect
              label={t('media.ageRating')}
              value={form.ageRating}
              onChange={(v) => setForm((f) => ({ ...f, ageRating: v }))}
              placeholder="—"
              options={[
                { value: '', label: '—' },
                ...AGE_RATINGS.map((ar) => ({ value: ar, label: t(`ageRating.${ar}`) })),
              ]}
            />
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isHidden}
                  onChange={(e) => setForm((f) => ({ ...f, isHidden: e.target.checked }))}
                  className="rounded border-theme"
                />
                <span className="text-sm font-medium text-theme">{t('admin.isHidden')}</span>
              </label>
              <CustomSelect
                label={t('media.status')}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={MEDIA_STATUS_OPTIONS.map((o) => ({
                  value: o.value,
                  label: (o as { labelKey?: string; label?: string }).labelKey
                    ? t((o as { labelKey: string }).labelKey)
                    : (o as { label: string }).label,
                }))}
                className="w-40"
              />
            </div>

            <div className="border-t border-theme pt-3 mt-3">
              <label className="block text-sm font-medium text-theme mb-2 flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                {t('admin.resourceLinks')}
              </label>
              {form.sites.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <CustomSelect
                    value={String(row.siteId || '')}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        sites: f.sites.map((s, i) => (i === idx ? { ...s, siteId: Number(v) } : s)),
                      }))
                    }
                    placeholder={`— ${t('admin.selectResource')} —`}
                    options={[
                      { value: '', label: `— ${t('admin.selectResource')} —` },
                      ...sitesList.map((site) => ({ value: String(site.id), label: site.name })),
                    ]}
                    className="flex-1 min-w-0"
                  />
                  <input
                    type="url"
                    value={row.url}
                    onChange={(e) => {
                      const newUrl = e.target.value
                      setForm((f) => {
                        const sites = f.sites.map((s, i) => (i === idx ? { ...s, url: newUrl } : s))
                        const detected = detectSiteFromUrl(newUrl, sitesList)
                        if (detected != null && sites[idx]) sites[idx] = { ...sites[idx], siteId: detected }
                        return { ...f, sites }
                      })
                    }}
                    placeholder="URL"
                    className="input flex-1 min-w-0 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sites: f.sites.filter((_, i) => i !== idx) }))}
                    className="p-2 text-[var(--theme-text-muted)] hover:text-red-500 rounded-lg shrink-0"
                    aria-label={t('common.remove')}
                  >
                    <IconCross className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, sites: [...f.sites, { siteId: sitesList[0]?.id ?? 0, url: '' }] }))
                }
                className="text-sm text-space_indigo-600 hover:underline flex items-center gap-1"
              >
                <IconPlus className="w-3 h-3" />
                {t('admin.addResourceLink')}
              </button>
            </div>

            <div className="border-t border-theme pt-3 mt-3">
              <label className="block text-sm font-medium text-theme mb-2">{t('admin.genres')}</label>
              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedGenres.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                    >
                      {g.emoji && <span>{g.emoji}</span>}
                      {g.name}
                      <button
                        type="button"
                        onClick={() => toggleGenre(g.id)}
                        className="hover:bg-[var(--theme-bg)]/20 rounded p-0.5"
                        aria-label={t('common.remove')}
                      >
                        <IconCross className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  onFocus={() => setOpenDropdown('genre')}
                  onBlur={() => setTimeout(() => setOpenDropdown(null), 180)}
                  placeholder={t('admin.searchGenre')}
                  className="input w-full text-sm rounded-lg"
                />
                {openDropdown === 'genre' && genreOptions.length > 0 && (
                  <ul className="absolute z-[70] mt-1 w-full border rounded-lg dropdown-list-panel shadow-lg max-h-40 overflow-y-auto py-1">
                    {genreOptions.slice(0, 15).map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            toggleGenre(g.id)
                            setGenreSearch('')
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-thistle-50"
                        >
                          {g.emoji && <span className="mr-1">{g.emoji}</span>}
                          {g.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="border-t border-theme pt-3 mt-3">
              <label className="block text-sm font-medium text-theme mb-2">{t('admin.themes')}</label>
              {selectedThemes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedThemes.map((th) => (
                    <span
                      key={th.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                    >
                      {th.emoji && <span>{th.emoji}</span>}
                      {th.name}
                      <button
                        type="button"
                        onClick={() => toggleTheme(th.id)}
                        className="hover:bg-[var(--theme-bg)]/20 rounded p-0.5"
                        aria-label={t('common.remove')}
                      >
                        <IconCross className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={themeSearch}
                  onChange={(e) => setThemeSearch(e.target.value)}
                  onFocus={() => setOpenDropdown('theme')}
                  onBlur={() => setTimeout(() => setOpenDropdown(null), 180)}
                  placeholder={t('admin.searchTheme')}
                  className="input w-full text-sm rounded-lg"
                />
                {openDropdown === 'theme' && themeOptions.length > 0 && (
                  <ul className="absolute z-[70] mt-1 w-full border rounded-lg dropdown-list-panel shadow-lg max-h-40 overflow-y-auto py-1">
                    {themeOptions.slice(0, 15).map((th) => (
                      <li key={th.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            toggleTheme(th.id)
                            setThemeSearch('')
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-thistle-50"
                        >
                          {th.emoji && <span className="mr-1">{th.emoji}</span>}
                          {th.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {schema.hasStudios && (
              <div className="border-t border-theme pt-3 mt-3">
                <label className="block text-sm font-medium text-theme mb-2">{t('admin.studios')}</label>
                {selectedStudios.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedStudios.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                      >
                        {s.name}
                        <button
                          type="button"
                          onClick={() => toggleStudio(s.id)}
                          className="hover:bg-[var(--theme-bg)]/20 rounded p-0.5"
                          aria-label={t('common.remove')}
                        >
                          <IconCross className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    value={studioSearch}
                    onChange={(e) => setStudioSearch(e.target.value)}
                    onFocus={() => setOpenDropdown('studio')}
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 180)}
                    placeholder={t('admin.searchStudio')}
                    className="input w-full text-sm rounded-lg"
                  />
                  {openDropdown === 'studio' && studioOptions.length > 0 && (
                    <ul className="absolute z-[70] mt-1 w-full border rounded-lg dropdown-list-panel shadow-lg max-h-40 overflow-y-auto py-1">
                      {studioOptions.slice(0, 15).map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              toggleStudio(s.id)
                              setStudioSearch('')
                              setOpenDropdown(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-thistle-50"
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {schema.hasGameFields && (
              <div className="border-t border-theme pt-3 mt-3 space-y-3">
                <h4 className="text-sm font-semibold text-[var(--theme-text)]">
                  {t('media.platforms')} / {t('admin.developers')} / {t('admin.publishers')}
                </h4>
                <div>
                  <label className="block text-xs text-[var(--theme-text-muted)] mb-1">{t('media.platforms')}</label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {platformsList
                      .filter((p) => form.platformIds.includes(p.id))
                      .map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lavender-400 text-white text-xs"
                        >
                          {getEntityName(p, locale)}
                          <button
                            type="button"
                            onClick={() => togglePlatform(p.id)}
                            className="hover:bg-[var(--theme-bg)]/20 rounded"
                            aria-label={t('common.remove')}
                          >
                            <IconCross className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {platformsList
                      .filter((p) => !form.platformIds.includes(p.id))
                      .slice(0, 10)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className="px-2 py-1 text-sm border rounded-lg hover:bg-thistle-50"
                        >
                          {getEntityName(p, locale)}
                        </button>
                      ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--theme-text-muted)] mb-1">{t('admin.developers')}</label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {developersList
                      .filter((d) => form.developerIds.includes(d.id))
                      .map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lavender-400 text-white text-xs"
                        >
                          {getEntityName(d, locale)}
                          <button
                            type="button"
                            onClick={() => toggleDeveloper(d.id)}
                            className="hover:bg-[var(--theme-bg)]/20 rounded"
                            aria-label={t('common.remove')}
                          >
                            <IconCross className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {developersList
                      .filter((d) => !form.developerIds.includes(d.id))
                      .slice(0, 10)
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDeveloper(d.id)}
                          className="px-2 py-1 text-sm border rounded-lg hover:bg-thistle-50"
                        >
                          {getEntityName(d, locale)}
                        </button>
                      ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--theme-text-muted)] mb-1">{t('admin.publishers')}</label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {selectedPublishers.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lavender-400 text-white text-xs"
                      >
                        {getEntityName(p, locale)}
                        <button
                          type="button"
                          onClick={() => togglePublisher(p.id)}
                          className="hover:bg-[var(--theme-bg)]/20 rounded"
                          aria-label={t('common.remove')}
                        >
                          <IconCross className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={publisherSearch}
                      onChange={(e) => setPublisherSearch(e.target.value)}
                      onFocus={() => setOpenDropdown('publisher')}
                      onBlur={() => setTimeout(() => setOpenDropdown(null), 180)}
                      placeholder={t('admin.searchPublisher')}
                      className="input w-full text-sm rounded-lg"
                    />
                    {openDropdown === 'publisher' && publisherOptions.length > 0 && (
                      <ul className="absolute z-[70] mt-1 w-full border rounded-lg dropdown-list-panel shadow-lg max-h-40 overflow-y-auto py-1">
                        {publisherOptions.slice(0, 15).map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                togglePublisher(p.id)
                                setPublisherSearch('')
                                setOpenDropdown(null)
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-thistle-50"
                            >
                              {getEntityName(p, locale)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(schema.hasMangaFields || schema.hasBookFields || schema.hasLightNovelFields) && (
              <div className="border-t border-theme pt-3 mt-3 space-y-3">
                <h4 className="text-sm font-semibold text-[var(--theme-text)]">
                  {schema.hasMangaFields || schema.hasLightNovelFields ? t('admin.volumes') || 'Тома' : ''}{' '}
                  {schema.hasBookFields || schema.hasLightNovelFields ? t('admin.pages') || 'Страницы' : ''} /{' '}
                  {t('admin.publishers')}
                </h4>
                {(schema.hasMangaFields || schema.hasLightNovelFields) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {schema.hasMangaFields && (
                      <>
                        <div>
                          <label className="block text-xs text-[var(--theme-text-muted)]">
                            {t('admin.volumes') || 'Томов'}
                          </label>
                          <input
                            type="text"
                            value={form.volumes}
                            onChange={(e) => setForm((f) => ({ ...f, volumes: e.target.value }))}
                            className="input w-full text-sm"
                            placeholder="—"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--theme-text-muted)]">
                            {t('admin.currentVolume') || 'Текущий том'}
                          </label>
                          <input
                            type="text"
                            value={form.currentVolume}
                            onChange={(e) => setForm((f) => ({ ...f, currentVolume: e.target.value }))}
                            className="input w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--theme-text-muted)]">
                            {t('admin.currentChapter') || 'Текущая глава'}
                          </label>
                          <input
                            type="text"
                            value={form.currentChapter}
                            onChange={(e) => setForm((f) => ({ ...f, currentChapter: e.target.value }))}
                            className="input w-full text-sm"
                          />
                        </div>
                      </>
                    )}
                    {schema.hasLightNovelFields && !schema.hasMangaFields && (
                      <>
                        <div>
                          <label className="block text-xs text-[var(--theme-text-muted)]">
                            {t('admin.volumes') || 'Томов'}
                          </label>
                          <input
                            type="text"
                            value={form.volumes}
                            onChange={(e) => setForm((f) => ({ ...f, volumes: e.target.value }))}
                            className="input w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--theme-text-muted)]">
                            {t('admin.currentVolume') || 'Текущий том'}
                          </label>
                          <input
                            type="text"
                            value={form.currentVolume}
                            onChange={(e) => setForm((f) => ({ ...f, currentVolume: e.target.value }))}
                            className="input w-full text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                {(schema.hasBookFields || schema.hasLightNovelFields) && (
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-xs text-[var(--theme-text-muted)]">
                        {t('admin.pages') || 'Страниц'}
                      </label>
                      <input
                        type="text"
                        value={form.pages}
                        onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))}
                        className="input w-full text-sm w-24"
                        placeholder="—"
                      />
                    </div>
                    {schema.hasBookFields && (
                      <div>
                        <label className="block text-xs text-[var(--theme-text-muted)]">
                          {t('media.readingDuration')}
                        </label>
                        <input
                          type="text"
                          value={form.readingDuration}
                          onChange={(e) => setForm((f) => ({ ...f, readingDuration: e.target.value }))}
                          className="input w-full text-sm w-24"
                          placeholder={t('media.minutes')}
                        />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-[var(--theme-text-muted)] mb-1">{t('admin.publishers')}</label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {selectedPublishers.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lavender-400 text-white text-xs"
                      >
                        {getEntityName(p, locale)}
                        <button
                          type="button"
                          onClick={() => togglePublisher(p.id)}
                          className="hover:bg-[var(--theme-bg)]/20 rounded"
                          aria-label={t('common.remove')}
                        >
                          <IconCross className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={publisherSearch}
                      onChange={(e) => setPublisherSearch(e.target.value)}
                      onFocus={() => setOpenDropdown('publisher')}
                      onBlur={() => setTimeout(() => setOpenDropdown(null), 180)}
                      placeholder={t('admin.searchPublisher')}
                      className="input w-full text-sm rounded-lg"
                    />
                    {openDropdown === 'publisher' && publisherOptions.length > 0 && (
                      <ul className="absolute z-[70] mt-1 w-full border rounded-lg dropdown-list-panel shadow-lg max-h-40 overflow-y-auto py-1">
                        {publisherOptions.slice(0, 15).map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                togglePublisher(p.id)
                                setPublisherSearch('')
                                setOpenDropdown(null)
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-thistle-50"
                            >
                              {getEntityName(p, locale)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--theme-text-muted)] mb-1">
                    {t('admin.authors') || 'Авторы'} (ID через запятую)
                  </label>
                  <input
                    type="text"
                    value={form.authorIdsStr}
                    onChange={(e) => setForm((f) => ({ ...f, authorIdsStr: e.target.value }))}
                    className="input w-full text-sm"
                    placeholder="1, 2, 3"
                  />
                </div>
                {schema.hasLightNovelFields && (
                  <div>
                    <label className="block text-xs text-[var(--theme-text-muted)] mb-1">
                      {t('admin.illustrators') || 'Иллюстраторы'} (ID через запятую)
                    </label>
                    <input
                      type="text"
                      value={form.illustratorIdsStr}
                      onChange={(e) => setForm((f) => ({ ...f, illustratorIdsStr: e.target.value }))}
                      className="input w-full text-sm"
                      placeholder="1, 2"
                    />
                  </div>
                )}
              </div>
            )}

            {(schema.hasCastSection || schema.hasStaffSection) && (
              <div className="border-t border-theme pt-3 mt-3 space-y-4">
                {schema.hasCastSection && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-[var(--theme-text)] flex items-center gap-2">
                      <IconGroup className="w-4 h-4" />
                      {t('admin.castSectionTitle')}
                    </h4>
                    <p className="text-xs text-[var(--theme-text-muted)]">{t('admin.castSectionDesc')}</p>
                    {castList.length > 0 && (
                      <ul className="space-y-2 rounded-lg bg-[var(--theme-bg-alt)] p-2 border border-[var(--theme-border)]">
                        {castList.map((c) => {
                          const name =
                            [
                              c.person ? getPersonDisplayName(c.person, locale) : '',
                              c.character ? getEntityName(c.character, locale) : '',
                              c.role,
                            ]
                              .filter(Boolean)
                              .join(' → ') || '—'
                          return (
                            <li
                              key={c.id}
                              className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                            >
                              <span className="text-theme">
                                {c.person ? getPersonDisplayName(c.person, locale) || '—' : '—'}
                                {c.character && ` → ${getEntityName(c.character, locale)}`}
                                {c.role && ` (${c.role})`}
                                {c.roleType && (
                                  <span className="text-[var(--theme-text-muted)] ml-1">
                                    [{t('admin.roleType.' + c.roleType)}]
                                  </span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ type: 'cast', cast: c, name })}
                                className="p-1.5 text-[var(--theme-text-muted)] hover:text-red-500 rounded"
                                aria-label={t('common.delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--theme-text-muted)] mb-1">
                          {t('admin.personHeader')}
                        </label>
                        <input
                          type="text"
                          value={personSearch}
                          onChange={(e) => setPersonSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchPersons())}
                          placeholder={t('admin.searchPerson')}
                          className="input w-full text-sm rounded-lg"
                        />
                        <button type="button" onClick={searchPersons} className="btn-secondary text-xs mt-1 rounded-lg">
                          Искать
                        </button>
                        {personResults.length > 0 && (
                          <ul className="mt-1 border rounded-lg max-h-24 overflow-y-auto bg-[var(--theme-bg)]">
                            {personResults.slice(0, 8).map((p) => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddCastPerson(p)
                                    setPersonResults([])
                                    setPersonSearch('')
                                  }}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-thistle-50"
                                >
                                  #{p.id} {getPersonDisplayName(p, locale)}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {addCastPerson && (
                          <span className="text-xs text-[var(--theme-text-muted)] block mt-1">
                            {t('admin.personHeader')}: {getPersonDisplayName(addCastPerson, locale)}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--theme-text-muted)] mb-1">
                          {t('admin.characterOrRole')}
                        </label>
                        <input
                          type="text"
                          value={characterSearch}
                          onChange={(e) => setCharacterSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchCharacters())}
                          placeholder={t('admin.searchCharacter')}
                          className="input w-full text-sm rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={searchCharacters}
                          className="btn-secondary text-xs mt-1 rounded-lg"
                        >
                          Искать
                        </button>
                        {characterResults.length > 0 && (
                          <ul className="mt-1 border rounded-lg max-h-24 overflow-y-auto bg-[var(--theme-bg)]">
                            {characterResults.slice(0, 8).map((ch) => (
                              <li key={ch.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddCastCharacter(ch)
                                    setCharacterResults([])
                                    setCharacterSearch('')
                                  }}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-thistle-50"
                                >
                                  #{ch.id} {getEntityName(ch, locale)}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {addCastCharacter && (
                          <span className="text-xs text-[var(--theme-text-muted)] block mt-1">
                            {t('character.title')}: {getEntityName(addCastCharacter, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {!addCastCharacter && (
                        <input
                          type="text"
                          value={addCastRole}
                          onChange={(e) => setAddCastRole(e.target.value)}
                          placeholder={t('admin.roleName')}
                          className="input w-36 text-sm rounded-lg"
                          title={t('admin.roleNameHint')}
                        />
                      )}
                      <CustomSelect
                        value={addCastRoleType}
                        onChange={(v) => setAddCastRoleType(v as RoleType)}
                        options={ROLE_TYPES.map((rt) => ({ value: rt, label: t('admin.roleType.' + rt) }))}
                        className="w-36"
                      />
                      <button
                        type="button"
                        disabled={(!addCastPerson && !addCastCharacter && !addCastRole.trim()) || castStaffSaving}
                        onClick={handleAddCast}
                        className="btn-secondary text-sm flex items-center gap-1 rounded-lg"
                      >
                        <IconPlus className="w-4 h-4" />В каст
                      </button>
                    </div>
                  </div>
                )}
                {schema.hasStaffSection && (
                  <div className="border-t border-theme pt-3 space-y-3">
                    <h4 className="text-sm font-semibold text-[var(--theme-text)] flex items-center gap-2">
                      {t('admin.staffSectionTitle')}
                    </h4>
                    <p className="text-xs text-[var(--theme-text-muted)]">{t('admin.staffSectionDesc')}</p>
                    {staffList.length > 0 && (
                      <ul className="space-y-2 rounded-lg bg-[var(--theme-bg-alt)] p-2 border border-[var(--theme-border)]">
                        {staffList.map((s) => {
                          const name = s.person ? getPersonDisplayName(s.person, locale) || '—' : '—'
                          const professionLabel = t('person.' + s.profession)
                          return (
                            <li
                              key={s.id}
                              className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                            >
                              <span className="text-theme">
                                {name} <span className="text-[var(--theme-text-muted)]">({professionLabel})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ type: 'staff', staff: s, name })}
                                className="p-1.5 text-[var(--theme-text-muted)] hover:text-red-500 rounded"
                                aria-label={t('common.delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    <div className="flex flex-wrap gap-2 items-end">
                      <div>
                        <label className="block text-xs text-[var(--theme-text-muted)] mb-1">
                          {t('admin.personHeader')}
                        </label>
                        <input
                          type="text"
                          value={staffPersonSearch}
                          onChange={(e) => setStaffPersonSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStaffPersons())}
                          placeholder={t('admin.searchPerson')}
                          className="input w-48 text-sm rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={searchStaffPersons}
                          className="btn-secondary text-xs mt-1 rounded-lg ml-1"
                        >
                          Искать
                        </button>
                      </div>
                      <div>
                        <CustomSelect
                          label="Чем занят"
                          value={addStaffProfession}
                          onChange={(v) => setAddStaffProfession(v as Profession)}
                          options={STAFF_PROFESSIONS.map((pr) => ({ value: pr, label: t('person.' + pr) }))}
                          className="w-36"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!addStaffPerson || castStaffSaving}
                        onClick={handleAddStaff}
                        className="btn-secondary text-sm rounded-lg flex items-center gap-1"
                      >
                        <IconPlus className="w-4 h-4" />
                        {t('admin.addToStaff')}
                      </button>
                    </div>
                    {staffPersonResults.length > 0 && (
                      <ul className="border rounded-lg max-h-24 overflow-y-auto bg-[var(--theme-bg)]">
                        {staffPersonResults.slice(0, 6).map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setAddStaffPerson(p)
                                setStaffPersonResults([])
                                setStaffPersonSearch('')
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs hover:bg-thistle-50"
                            >
                              #{p.id} {getPersonDisplayName(p, locale)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {addStaffPerson && (
                      <span className="text-xs text-[var(--theme-text-muted)]">
                        {t('admin.selected')}: {getPersonDisplayName(addStaffPerson, locale)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="rounded-lg bg-space_indigo-600 text-lavender-500 font-medium hover:bg-space_indigo-700 transition-colors py-2 px-4 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">
              {t('common.cancel')}
            </button>
          </div>

          {deleteConfirm && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
              onClick={() => setDeleteConfirm(null)}
            >
              <div
                className="modal-panel rounded-xl border shadow-xl max-w-md w-full p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold">{t('admin.confirmDeleteTitle')}</h3>
                <p className="text-theme">{t('admin.confirmDeleteCast', { name: deleteConfirm.name })}</p>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary rounded-lg">
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={castStaffSaving}
                    className="btn-primary rounded-lg bg-red-600 hover:bg-red-700"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
