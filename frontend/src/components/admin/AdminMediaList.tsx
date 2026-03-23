import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Mic2, Link2, Upload, ImagePlus } from 'lucide-react'
import { IconSearch, IconCross, IconPlus, IconGroup, IconTypeMovie } from '@/components/icons'
import VideoThumbnail from '@/components/VideoThumbnail'
import { mediaApi } from '@/api/media'
import { adminApi } from '@/api/admin'
import { personsApi } from '@/api/persons'
import { charactersApi } from '@/api/characters'
import type { Movie, Genre, Theme, Studio, Cast, Person, Character, Media, MediaStaff } from '@/types'
import type { AdminMediaVideoInput } from '@/api/admin'
import { AGE_RATINGS } from '@/constants/enums'
import { ROLE_TYPES, type RoleType } from '@/constants/enums'
import { STAFF_PROFESSIONS, type Profession } from '@/constants/enums'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { titleToSlug } from '@/utils/slug'
import { buildUploadBaseName } from '@/utils/uploadNames'
import { getEntityName, getMediaTitle } from '@/utils/localizedText'
import { getPersonDisplayName } from '@/utils/personUtils'
import {
  getMediaCurrentChapter,
  getMediaCurrentEpisode,
  getMediaCurrentVolume,
  getMediaEpisodeDuration,
  getMediaEpisodesCount,
  getMediaPages,
  getMediaReadingDurationMinutes,
  getMediaSeasonNumber,
  getMediaVolumes,
  isRecord,
} from '@/utils/typeGuards'
import type { LocalizedString } from '@/types'
import TranslationsEditor from '@/components/admin/TranslationsEditor'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'

type MediaTypeKey =
  | 'movies'
  | 'anime'
  | 'games'
  | 'tv-series'
  | 'manga'
  | 'books'
  | 'light-novels'
  | 'cartoon-series'
  | 'cartoon-movies'
  | 'anime-movies'

const MEDIA_TYPES: { key: MediaTypeKey; labelKey: string }[] = [
  { key: 'movies', labelKey: 'nav.movies' },
  { key: 'anime', labelKey: 'nav.anime' },
  { key: 'games', labelKey: 'nav.games' },
  { key: 'tv-series', labelKey: 'nav.tvSeries' },
  { key: 'manga', labelKey: 'nav.manga' },
  { key: 'books', labelKey: 'nav.books' },
  { key: 'light-novels', labelKey: 'nav.lightNovels' },
  { key: 'cartoon-series', labelKey: 'nav.cartoonSeries' },
  { key: 'cartoon-movies', labelKey: 'nav.cartoonMovies' },
  { key: 'anime-movies', labelKey: 'nav.animeMovies' },
]

/** mediaType (admin key) → path type для mediaApi.getMediaByType */
const MEDIA_TYPE_TO_PATH: Record<MediaTypeKey, string> = {
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

/** Какие блоки показывать в модалке по типу медиа. */
const MEDIA_TYPE_SCHEMA: Record<
  MediaTypeKey,
  {
    hasDuration: boolean
    hasCountry: boolean
    hasStudios: boolean
    hasCastAndStaff: boolean
    hasSeriesFields: boolean
    hasGameFields: boolean
    hasMangaFields: boolean
    hasBookFields: boolean
    hasLightNovelFields: boolean
  }
> = {
  movies: {
    hasDuration: true,
    hasCountry: true,
    hasStudios: true,
    hasCastAndStaff: true,
    hasSeriesFields: false,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  'tv-series': {
    hasDuration: false,
    hasCountry: true,
    hasStudios: true,
    hasCastAndStaff: true,
    hasSeriesFields: true,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  anime: {
    hasDuration: false,
    hasCountry: true,
    hasStudios: true,
    hasCastAndStaff: true,
    hasSeriesFields: true,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  'cartoon-series': {
    hasDuration: false,
    hasCountry: true,
    hasStudios: true,
    hasCastAndStaff: true,
    hasSeriesFields: true,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  'cartoon-movies': {
    hasDuration: true,
    hasCountry: true,
    hasStudios: true,
    hasCastAndStaff: true,
    hasSeriesFields: false,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  'anime-movies': {
    hasDuration: true,
    hasCountry: true,
    hasStudios: true,
    hasCastAndStaff: true,
    hasSeriesFields: false,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  games: {
    hasDuration: false,
    hasCountry: false,
    hasStudios: false,
    hasCastAndStaff: false,
    hasSeriesFields: false,
    hasGameFields: true,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  manga: {
    hasDuration: false,
    hasCountry: false,
    hasStudios: false,
    hasCastAndStaff: true,
    hasSeriesFields: false,
    hasGameFields: false,
    hasMangaFields: true,
    hasBookFields: false,
    hasLightNovelFields: false,
  },
  books: {
    hasDuration: false,
    hasCountry: false,
    hasStudios: false,
    hasCastAndStaff: true,
    hasSeriesFields: false,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: true,
    hasLightNovelFields: false,
  },
  'light-novels': {
    hasDuration: false,
    hasCountry: false,
    hasStudios: false,
    hasCastAndStaff: true,
    hasSeriesFields: false,
    hasGameFields: false,
    hasMangaFields: false,
    hasBookFields: false,
    hasLightNovelFields: true,
  },
}

type ScheduleRow = { episodeNumber?: number; date?: string; time?: string }

function parseScheduleToRows(schedule: unknown): ScheduleRow[] {
  if (schedule == null) return []
  if (Array.isArray(schedule)) {
    return schedule.map((item) => {
      const o = isRecord(item) ? item : {}
      return {
        episodeNumber:
          typeof o.episodeNumber === 'number' ? o.episodeNumber : typeof o.episode === 'number' ? o.episode : undefined,
        date: typeof o.date === 'string' ? o.date : undefined,
        time: typeof o.time === 'string' ? o.time : undefined,
      }
    })
  }
  const o = isRecord(schedule) ? schedule : {}
  if (o.date || o.time || o.day) {
    return [
      {
        date: typeof o.date === 'string' ? o.date : typeof o.day === 'string' ? o.day : undefined,
        time: typeof o.time === 'string' ? o.time : undefined,
      },
    ]
  }
  return []
}

function scheduleRowsToJson(rows: ScheduleRow[]): unknown {
  if (rows.length === 0) return undefined
  return rows
    .map((r) => {
      const out: Record<string, unknown> = {}
      if (r.episodeNumber != null) out.episodeNumber = r.episodeNumber
      if (r.date != null && r.date !== '') out.date = r.date
      if (r.time != null && r.time !== '') out.time = r.time
      return out
    })
    .filter((o) => Object.keys(o).length > 0)
}

const MEDIA_STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'announced', label: 'Анонсировано' },
  { value: 'in_production', label: 'В производстве' },
  { value: 'released', label: 'Вышло' },
  { value: 'finished', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
  { value: 'postponed', label: 'Отложено' },
]

/** По вставленной ссылке определяет ресурс (Site) по совпадению URL/хоста. */
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

const DUBBING_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'ja', label: '日本語' },
  { value: 'other', label: 'Другое' },
]

type MediaListItem = { id: number; title: string; titleI18n?: Record<string, string> }

async function loadMediaList(type: MediaTypeKey): Promise<MediaListItem[]> {
  const pageSize = 200
  const mapItem = (m: { id: number; title?: string; titleI18n?: Record<string, string> }) => ({
    id: m.id,
    title: m.title ?? '',
    titleI18n: m.titleI18n,
  })
  switch (type) {
    case 'movies': {
      const res = await mediaApi.getMovies(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'anime': {
      const res = await mediaApi.getAnimeSeries(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'games': {
      const res = await mediaApi.getGames(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'tv-series': {
      const res = await mediaApi.getTVSeriesList(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'manga': {
      const res = await mediaApi.getMangaList(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'books': {
      const res = await mediaApi.getBooks(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'light-novels': {
      const res = await mediaApi.getLightNovels(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'cartoon-series': {
      const res = await mediaApi.getCartoonSeriesList(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'cartoon-movies': {
      const res = await mediaApi.getCartoonMovies(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    case 'anime-movies': {
      const res = await mediaApi.getAnimeMovies(1, pageSize)
      return (res.data ?? []).map(mapItem)
    }
    default:
      return []
  }
}

export default function AdminMediaList() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [mediaType, setMediaType] = useState<MediaTypeKey>('movies')
  const [items, setItems] = useState<MediaListItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Media | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [saving, setSaving] = useState(false)
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
    // Аниме: катакана, ромадзи
    titleKatakana: '',
    titleRomaji: '',
    // Сериалы (TVSeries, AnimeSeries, CartoonSeries)
    seasonNumber: '',
    episodesCount: '',
    episodeDuration: '',
    currentEpisode: '',
    releaseScheduleStr: '',
    platformIds: [] as number[],
    developerIds: [] as number[],
    publisherIds: [] as number[],
    volumes: '',
    currentVolume: '',
    currentChapter: '',
    pages: '',
    readingDuration: '',
    authorIds: [] as number[],
    illustratorIds: [] as number[],
    sites: [] as { siteId: number; url: string }[],
    images: [] as { url: string; caption: string }[],
    videos: [] as AdminMediaVideoInput[],
  })
  const [uploading, setUploading] = useState<'poster' | 'backdrop' | 'image' | 'trailer' | null>(null)
  const [sitesList, setSitesList] = useState<{ id: number; name: string; url: string }[]>([])
  const [genresList, setGenresList] = useState<Genre[]>([])
  const [themesList, setThemesList] = useState<Theme[]>([])
  const [studiosList, setStudiosList] = useState<Studio[]>([])
  const [platformsList, setPlatformsList] = useState<{ id: number; name: string }[]>([])
  const [developersList, setDevelopersList] = useState<{ id: number; name: string }[]>([])
  const [publishersList, setPublishersList] = useState<{ id: number; name: string }[]>([])
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

  const buildVideoUploadBaseName = (videoNumber: number): string | undefined => {
    if (!editingItem?.id) return undefined
    const slug = titleToSlug(form.title)
    if (!slug) return undefined
    return `${slug}-${MEDIA_TYPE_TO_PATH[mediaType]}-${editingItem.id}-video-${videoNumber}`
  }
  const [addStaffProfession, setAddStaffProfession] = useState<Profession>('director')
  const [genreSearch, setGenreSearch] = useState('')
  const [themeSearch, setThemeSearch] = useState('')
  const [studioSearch, setStudioSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { type: 'media'; item: { id: number; title: string } }
    | { type: 'cast'; cast: Cast; name: string }
    | { type: 'staff'; staff: MediaStaff; name: string }
    | null
  >(null)
  const [editingCastId, setEditingCastId] = useState<number | null>(null)
  const [dubbingPersonSearch, setDubbingPersonSearch] = useState('')
  const [dubbingPersonResults, setDubbingPersonResults] = useState<Person[]>([])
  const [dubbingPerson, setDubbingPerson] = useState<Person | null>(null)
  const [dubbingLanguage, setDubbingLanguage] = useState('')
  const [dubbingCastId, setDubbingCastId] = useState<number | 'new' | null>(null)
  const [openDropdown, setOpenDropdown] = useState<'genre' | 'theme' | 'studio' | 'publisher' | null>(null)
  const [releaseScheduleRows, setReleaseScheduleRows] = useState<ScheduleRow[]>([])
  const [publisherSearch, setPublisherSearch] = useState('')
  const [addedAuthorPersons, setAddedAuthorPersons] = useState<Person[]>([])
  const [addedIllustratorPersons, setAddedIllustratorPersons] = useState<Person[]>([])
  const [authorSearch, setAuthorSearch] = useState('')
  const [authorResults, setAuthorResults] = useState<Person[]>([])
  const [illustratorSearch, setIllustratorSearch] = useState('')
  const [illustratorResults, setIllustratorResults] = useState<Person[]>([])
  const [formTitleI18n, setFormTitleI18n] = useState<LocalizedString>({})
  const [formDescriptionI18n, setFormDescriptionI18n] = useState<LocalizedString>({})
  const [page, setPage] = useState(1)

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    const isNumeric = /^\d+$/.test(q)
    return items.filter((item) => {
      const idMatch = isNumeric && String(item.id).includes(q)
      const titleMatch = (item.title ?? '').toLowerCase().includes(q)
      return idMatch || titleMatch
    })
  }, [items, searchQuery])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE
    return filteredItems.slice(start, start + ADMIN_PAGE_SIZE)
  }, [filteredItems, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const selectedGenres = useMemo(
    () => genresList.filter((g) => form.genreIds.includes(g.id)),
    [genresList, form.genreIds]
  )
  const genreOptions = useMemo(() => {
    const q = genreSearch.trim().toLowerCase()
    return genresList.filter((g) => !form.genreIds.includes(g.id) && (!q || (g.name ?? '').toLowerCase().includes(q)))
  }, [genresList, form.genreIds, genreSearch])
  const selectedThemes = useMemo(
    () => themesList.filter((t) => form.themeIds.includes(t.id)),
    [themesList, form.themeIds]
  )
  const themeOptions = useMemo(() => {
    const q = themeSearch.trim().toLowerCase()
    return themesList.filter((t) => !form.themeIds.includes(t.id) && (!q || (t.name ?? '').toLowerCase().includes(q)))
  }, [themesList, form.themeIds, themeSearch])
  const selectedStudios = useMemo(
    () => studiosList.filter((s) => form.studioIds.includes(s.id)),
    [studiosList, form.studioIds]
  )
  const studioOptions = useMemo(() => {
    const q = studioSearch.trim().toLowerCase()
    return studiosList.filter((s) => !form.studioIds.includes(s.id) && (!q || (s.name ?? '').toLowerCase().includes(q)))
  }, [studiosList, form.studioIds, studioSearch])
  const selectedPublishers = useMemo(
    () => publishersList.filter((p) => form.publisherIds.includes(p.id)),
    [publishersList, form.publisherIds]
  )
  const publisherOptions = useMemo(() => {
    const q = publisherSearch.trim().toLowerCase()
    return publishersList.filter(
      (p) => !form.publisherIds.includes(p.id) && (!q || (p.name ?? '').toLowerCase().includes(q))
    )
  }, [publishersList, form.publisherIds, publisherSearch])

  const castList = useMemo(
    () => (editingItem as Movie)?.cast?.filter((c) => c.character != null || c.characterId != null) ?? [],
    [editingItem]
  )
  const staffList = useMemo(() => (editingItem as Movie)?.staff ?? [], [editingItem])

  const pathType = MEDIA_TYPE_TO_PATH[mediaType]
  const schema = MEDIA_TYPE_SCHEMA[mediaType]
  const supportsFullEdit = true

  const load = () => {
    setLoading(true)
    loadMediaList(mediaType)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [mediaType])

  useEffect(() => {
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
      .getSites()
      .then(setSitesList)
      .catch(() => setSitesList([]))
  }, [])
  useEffect(() => {
    if (mediaType === 'games') {
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
    } else if (['manga', 'books', 'light-novels'].includes(mediaType)) {
      adminApi
        .getPublishers()
        .then(setPublishersList)
        .catch(() => setPublishersList([]))
    } else {
      setPlatformsList([])
      setDevelopersList([])
      setPublishersList([])
    }
  }, [mediaType])

  useEffect(() => {
    if (editingItem) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [editingItem])

  useEffect(() => {
    if (
      castList.length > 0 &&
      (dubbingCastId == null || (dubbingCastId !== 'new' && !castList.some((c) => c.id === dubbingCastId)))
    ) {
      setDubbingCastId(castList[0].id)
    }
    if (castList.length === 0) setDubbingCastId('new')
  }, [castList, dubbingCastId])

  const handleStartEdit = async (item: { id: number; title: string }) => {
    let data: Media & {
      releaseDate?: string | number
      genres?: { id: number }[]
      themes?: { id: number }[]
      studios?: { id: number }[]
      cast?: Cast[]
      staff?: MediaStaff[]
      isHidden?: boolean
      status?: string
      seasonNumber?: number
      episodesCount?: number
      episodeDuration?: number
      currentEpisode?: number
      releaseSchedule?: Record<string, unknown>
      platforms?: { id: number }[]
      developers?: { id: number }[]
      publishers?: { id: number }[]
      authors?: Person[]
      illustrators?: Person[]
      volumes?: number
      currentVolume?: number
      currentChapter?: number
      pages?: number
      readingDurationMinutes?: number
      sites?: { siteId?: number; site?: { id: number }; url?: string }[]
    }
    try {
      data = (await mediaApi.getMediaByType(pathType, item.id)) as typeof data
    } catch {
      data = { id: item.id, title: item.title, genres: [] } as unknown as typeof data
    }
    setEditingItem(data)
    setIsCreateMode(false)
    try {
      const rd =
        data.releaseDate != null
          ? typeof data.releaseDate === 'string'
            ? data.releaseDate.slice(0, 10)
            : String(data.releaseDate).slice(0, 10)
          : ''
      const rs = data as { releaseSchedule?: Record<string, unknown> }
      let releaseScheduleStr = ''
      try {
        releaseScheduleStr = rs.releaseSchedule ? JSON.stringify(rs.releaseSchedule, null, 2) : ''
      } catch {
        releaseScheduleStr = ''
      }
      setFormTitleI18n((data as { titleI18n?: LocalizedString }).titleI18n ?? {})
      setFormDescriptionI18n((data as { descriptionI18n?: LocalizedString }).descriptionI18n ?? {})
      setForm({
        title: data.title ?? '',
        description: data.description ?? '',
        releaseDate: rd,
        poster: data.poster ?? '',
        backdrop: (data as { backdrop?: string }).backdrop ?? '',
        rating: (data as Movie).rating != null ? String((data as Movie).rating) : '',
        duration: (data as Movie).duration != null ? String((data as Movie).duration) : '',
        country: data.country ?? '',
        ageRating: data.ageRating ?? '',
        status: data.status ?? '',
        isHidden: data.isHidden ?? false,
        genreIds: Array.isArray(data.genres)
          ? data.genres.map((g) => g?.id).filter((id): id is number => id != null)
          : [],
        themeIds: Array.isArray(data.themes)
          ? data.themes.map((t) => t?.id).filter((id): id is number => id != null)
          : [],
        studioIds: Array.isArray(data.studios)
          ? data.studios.map((s) => s?.id).filter((id): id is number => id != null)
          : [],
        titleKatakana: (data as { titleKatakana?: string }).titleKatakana ?? '',
        titleRomaji: (data as { titleRomaji?: string }).titleRomaji ?? '',
        seasonNumber: getMediaSeasonNumber(data) != null ? String(getMediaSeasonNumber(data)) : '',
        episodesCount: getMediaEpisodesCount(data) != null ? String(getMediaEpisodesCount(data)) : '',
        episodeDuration: getMediaEpisodeDuration(data) != null ? String(getMediaEpisodeDuration(data)) : '',
        currentEpisode: getMediaCurrentEpisode(data) != null ? String(getMediaCurrentEpisode(data)) : '',
        releaseScheduleStr,
        platformIds: Array.isArray((data as { platforms?: { id: number }[] }).platforms)
          ? (data as { platforms?: { id: number }[] })
              .platforms!.map((p) => p?.id)
              .filter((id): id is number => id != null)
          : [],
        developerIds: Array.isArray((data as { developers?: { id: number }[] }).developers)
          ? (data as { developers?: { id: number }[] })
              .developers!.map((d) => d?.id)
              .filter((id): id is number => id != null)
          : [],
        publisherIds: Array.isArray((data as { publishers?: { id: number }[] }).publishers)
          ? (data as { publishers?: { id: number }[] })
              .publishers!.map((p) => p?.id)
              .filter((id): id is number => id != null)
          : [],
        volumes: getMediaVolumes(data) != null ? String(getMediaVolumes(data)) : '',
        currentVolume: getMediaCurrentVolume(data) != null ? String(getMediaCurrentVolume(data)) : '',
        currentChapter: getMediaCurrentChapter(data) != null ? String(getMediaCurrentChapter(data)) : '',
        pages: getMediaPages(data) != null ? String(getMediaPages(data)) : '',
        readingDuration:
          getMediaReadingDurationMinutes(data) != null ? String(getMediaReadingDurationMinutes(data)) : '',
        authorIds: Array.isArray((data as { authors?: Person[] }).authors)
          ? (data as { authors?: Person[] }).authors!.map((a) => a?.id).filter((id): id is number => id != null)
          : [],
        illustratorIds: Array.isArray((data as { illustrators?: Person[] }).illustrators)
          ? (data as { illustrators?: Person[] })
              .illustrators!.map((i) => i?.id)
              .filter((id): id is number => id != null)
          : [],
        sites: Array.isArray(data.sites)
          ? data.sites.filter((s) => s != null).map((s) => ({ siteId: s.siteId ?? s.site?.id ?? 0, url: s.url ?? '' }))
          : [],
        images: Array.isArray(data.images)
          ? data.images.map((x: unknown) => ({
              url: typeof x === 'object' && x != null && 'url' in x ? String((x as { url: unknown }).url) : String(x),
              caption:
                typeof x === 'object' && x != null && 'caption' in x
                  ? String((x as { caption: unknown }).caption || '')
                  : '',
            }))
          : [],
        videos: Array.isArray(data.videos)
          ? data.videos
              .map((x: unknown) => ({
                url:
                  typeof x === 'object' && x != null && 'url' in x
                    ? String((x as { url: unknown }).url ?? '')
                    : String(x),
                name:
                  typeof x === 'object' && x != null && 'name' in x ? String((x as { name: unknown }).name ?? '') : '',
              }))
              .filter((item) => item.url)
          : [],
      })
      setReleaseScheduleRows(parseScheduleToRows(rs.releaseSchedule))
      setAddedAuthorPersons(
        Array.isArray((data as { authors?: Person[] }).authors) ? (data as { authors?: Person[] }).authors! : []
      )
      setAddedIllustratorPersons(
        Array.isArray((data as { illustrators?: Person[] }).illustrators)
          ? (data as { illustrators?: Person[] }).illustrators!
          : []
      )
    } catch (err) {
      if (import.meta.env.DEV) console.error('[AdminMediaList] handleStartEdit setForm error', err)
      setForm((prev) => ({ ...prev, title: data.title ?? '', genreIds: [], themeIds: [], studioIds: [], sites: [] }))
    }
    setAddCastPerson(null)
    setAddCastCharacter(null)
    setAddCastRole('')
    setAddCastRoleType('main')
    setAddStaffPerson(null)
  }

  const handleCreate = () => {
    setEditingItem({ id: 0, title: '', genres: [] } as Media)
    setIsCreateMode(true)
    setFormTitleI18n({})
    setFormDescriptionI18n({})
    setForm({
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
      genreIds: [],
      themeIds: [],
      studioIds: [],
      titleKatakana: '',
      titleRomaji: '',
      seasonNumber: '',
      episodesCount: '',
      episodeDuration: '',
      currentEpisode: '',
      releaseScheduleStr: '',
      platformIds: [],
      developerIds: [],
      publisherIds: [],
      volumes: '',
      currentVolume: '',
      currentChapter: '',
      pages: '',
      readingDuration: '',
      authorIds: [],
      illustratorIds: [],
      sites: [],
      images: [] as { url: string; caption: string }[],
      videos: [] as AdminMediaVideoInput[],
    })
    setReleaseScheduleRows([])
    setAddedAuthorPersons([])
    setAddedIllustratorPersons([])
    setAddCastPerson(null)
    setAddCastCharacter(null)
    setAddCastRole('')
    setAddStaffPerson(null)
  }

  const handleDeleteClick = (item: { id: number; title: string }) => {
    if (mediaType !== 'movies') return
    setDeleteConfirm({ type: 'media', item })
  }
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'media') {
      try {
        await adminApi.deleteMovie(deleteConfirm.item.id)
        load()
        setEditingItem(null)
      } catch (e) {
        console.error(e)
      }
    }
    if (deleteConfirm.type === 'staff' && editingItem) {
      const pathType = MEDIA_TYPE_TO_PATH[mediaType]
      try {
        await adminApi.removeMediaStaff(pathType, editingItem.id, deleteConfirm.staff.id)
        load()
        setEditingItem(null)
      } catch (e) {
        console.error(e)
      }
    }
    setDeleteConfirm(null)
  }
  const handleCastDeleteClick = (c: Cast, name: string) => {
    setDeleteConfirm({ type: 'cast', cast: c, name })
  }
  const handleStaffDeleteClick = (s: MediaStaff, name: string) => {
    setDeleteConfirm({ type: 'staff', staff: s, name })
  }

  const searchPersons = async () => {
    if (!personSearch.trim()) return
    const res = await personsApi.getList(1, 20, personSearch.trim())
    setPersonResults(res.data ?? [])
  }

  const searchCharacters = async () => {
    if (!characterSearch.trim()) return
    const res = await charactersApi.getList(1, 20, characterSearch.trim())
    setCharacterResults(res.data ?? [])
  }

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

  const handleSaveEdit = async () => {
    if (!editingItem || saving) return
    setSaving(true)
    try {
      const titleI18n = Object.keys(formTitleI18n).length ? formTitleI18n : undefined
      const descriptionI18n = Object.keys(formDescriptionI18n).length ? formDescriptionI18n : undefined
      if (isCreateMode && mediaType === 'movies') {
        await adminApi.createMovie({
          title: form.title || t('admin.noTitle'),
          titleI18n,
          description: form.description || undefined,
          descriptionI18n,
          releaseDate: form.releaseDate || undefined,
          poster: form.poster || undefined,
          backdrop: form.backdrop || undefined,
          images: form.images.length ? form.images.map((image) => image.url) : undefined,
          videos: form.videos.length ? form.videos : undefined,
          rating: form.rating ? parseFloat(form.rating) : undefined,
          duration: form.duration ? parseInt(form.duration, 10) : undefined,
          country: form.country || undefined,
          ageRating: form.ageRating || undefined,
          genreIds: form.genreIds.length ? form.genreIds : undefined,
          themeIds: form.themeIds.length ? form.themeIds : undefined,
          studioIds: form.studioIds.length ? form.studioIds : undefined,
          isHidden: form.isHidden,
          status: form.status || undefined,
          sites: form.sites.filter((s) => s.siteId > 0 && s.url.trim() !== ''),
        })
      } else if (mediaType === 'movies' && editingItem.id) {
        await adminApi.updateMovie(editingItem.id, {
          title: form.title || undefined,
          titleI18n,
          description: form.description || undefined,
          descriptionI18n,
          releaseDate: form.releaseDate || undefined,
          poster: form.poster || undefined,
          backdrop: form.backdrop || undefined,
          images: form.images.length ? form.images.map((image) => image.url) : undefined,
          videos: form.videos.length ? form.videos : undefined,
          rating: form.rating ? parseFloat(form.rating) : undefined,
          duration: form.duration ? parseInt(form.duration, 10) : undefined,
          country: form.country || undefined,
          ageRating: form.ageRating || undefined,
          genreIds: form.genreIds.length ? form.genreIds : undefined,
          themeIds: form.themeIds.length ? form.themeIds : undefined,
          studioIds: form.studioIds.length ? form.studioIds : undefined,
          isHidden: form.isHidden,
          status: form.status || undefined,
          sites: form.sites.filter((s) => s.siteId > 0 && s.url.trim() !== ''),
        })
      } else if (!isCreateMode && editingItem.id && mediaType !== 'movies') {
        const pathType = MEDIA_TYPE_TO_PATH[mediaType]
        const schema = MEDIA_TYPE_SCHEMA[mediaType]
        const payload: Parameters<typeof adminApi.updateMedia>[2] = {
          title: form.title || undefined,
          titleI18n: Object.keys(formTitleI18n).length ? formTitleI18n : undefined,
          description: form.description || undefined,
          descriptionI18n: Object.keys(formDescriptionI18n).length ? formDescriptionI18n : undefined,
          releaseDate: form.releaseDate || undefined,
          poster: form.poster || undefined,
          backdrop: form.backdrop || undefined,
          images: form.images.length ? form.images.map((image) => image.url) : undefined,
          videos: form.videos.length ? form.videos : undefined,
          rating: form.rating ? parseFloat(form.rating) : undefined,
          ageRating: form.ageRating || undefined,
          genreIds: form.genreIds.length ? form.genreIds : undefined,
          themeIds: form.themeIds.length ? form.themeIds : undefined,
          isHidden: form.isHidden,
          status: form.status || undefined,
          sites: form.sites.filter((s) => s.siteId > 0 && s.url.trim() !== ''),
        }
        if (mediaType === 'anime') {
          payload.titleKatakana = form.titleKatakana.trim() || undefined
          payload.titleRomaji = form.titleRomaji.trim() || undefined
        }
        if (schema.hasMangaFields || schema.hasBookFields || schema.hasLightNovelFields) {
          payload.publisherIds = form.publisherIds.length ? form.publisherIds : undefined
          payload.authorIds = form.authorIds.length ? form.authorIds : undefined
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
            payload.illustratorIds = form.illustratorIds.length ? form.illustratorIds : undefined
          }
        }
        await adminApi.updateMedia(pathType, editingItem.id, payload)
      }
      setEditingItem(null)
      setIsCreateMode(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('admin.media')}</h2>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {MEDIA_TYPES.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMediaType(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              mediaType === key
                ? 'bg-lavender-400 text-gray-900 shadow-md'
                : 'bg-white/80 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
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
            {mediaType === 'movies' && (
              <button type="button" onClick={handleCreate} className="btn-primary rounded-xl flex items-center gap-2">
                <IconPlus className="w-4 h-4" />
                {t('admin.addTitle') || 'Добавить тайтл'}
              </button>
            )}
          </div>
          <ul className="space-y-2 pr-1">
            {paginatedItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border bg-white/90 border-gray-200 hover:border-lavender-200 hover:shadow transition-all"
              >
                <span className="text-gray-800 flex-1 min-w-0 truncate text-sm">
                  <span className="text-gray-400 text-xs mr-1">#{item.id}</span>
                  {getMediaTitle(item, locale) || item.title}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-100 rounded-lg transition-colors"
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {mediaType === 'movies' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(item)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <AdminPagination
            currentPage={page}
            totalItems={filteredItems.length}
            pageSize={ADMIN_PAGE_SIZE}
            onPageChange={setPage}
          />
          {filteredItems.length === 0 && searchQuery.trim() && (
            <p className="text-gray-500 text-sm py-2">{t('common.noResults')}</p>
          )}
          {editingItem && (
            <div className="modal-overlay-root fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0">
              <div
                className="fixed inset-0 bg-black/50 min-h-[100dvh]"
                onClick={() => {
                  setEditingItem(null)
                  setIsCreateMode(false)
                  setOpenDropdown(null)
                }}
                aria-hidden
              />
              <div className="min-h-[100dvh] flex items-center justify-center pt-4 px-4">
                <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-5 shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]">
                  <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-semibold">
                      {isCreateMode
                        ? t('admin.addTitle') || 'Добавить тайтл'
                        : `${t('admin.editEntity')} #${editingItem.id}`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null)
                        setIsCreateMode(false)
                      }}
                      className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
                      aria-label={t('common.close')}
                    >
                      <IconCross className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">{t('admin.name')}</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="input w-full"
                      placeholder={t('admin.name')}
                    />
                    <label className="block text-sm font-medium text-gray-700">{t('admin.description')}</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="input w-full min-h-[80px]"
                      placeholder={t('admin.description')}
                      rows={3}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.translationsName')} (title)
                      </label>
                      <TranslationsEditor value={formTitleI18n} onChange={setFormTitleI18n} className="mt-1" />
                    </div>
                    {mediaType === 'anime' && (
                      <>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('admin.animeTitleRomaji')}
                        </label>
                        <input
                          type="text"
                          value={form.titleRomaji}
                          onChange={(e) => setForm((f) => ({ ...f, titleRomaji: e.target.value }))}
                          className="input w-full"
                          placeholder="Hagane no Renkinjutsushi"
                        />
                        <label className="block text-sm font-medium text-gray-700">
                          {t('admin.animeTitleKatakana')}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.translationsDescription')}
                      </label>
                      <TranslationsEditor
                        value={formDescriptionI18n}
                        onChange={setFormDescriptionI18n}
                        className="mt-1"
                      />
                    </div>
                    <label className="block text-sm font-medium text-gray-700">{t('media.year')}</label>
                    <input
                      type="date"
                      value={form.releaseDate}
                      onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))}
                      className="input w-full"
                    />
                    <label className="block text-sm font-medium text-gray-700">{t('admin.poster')}</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={form.poster}
                        onChange={(e) => setForm((f) => ({ ...f, poster: e.target.value }))}
                        className="input flex-1 min-w-[200px]"
                        placeholder="/uploads/posters/…"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium cursor-pointer disabled:opacity-50">
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
                                baseName: buildUploadBaseName(
                                  form.title,
                                  MEDIA_TYPE_TO_PATH[mediaType],
                                  editingItem?.id,
                                  'poster'
                                ),
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
                      <div className="mt-1 w-24 h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={getMediaAssetUrl(form.poster)} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <label className="block text-sm font-medium text-gray-700 mt-3">
                      {t('admin.backdrop')}
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={form.backdrop}
                        onChange={(e) => setForm((f) => ({ ...f, backdrop: e.target.value }))}
                        className="input flex-1 min-w-[200px]"
                        placeholder="/uploads/backdrops/…"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium cursor-pointer disabled:opacity-50">
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
                                baseName: buildUploadBaseName(
                                  form.title,
                                  MEDIA_TYPE_TO_PATH[mediaType],
                                  editingItem?.id,
                                  'backdrop'
                                ),
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
                      <div className="mt-1 max-w-full w-48 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={getMediaAssetUrl(form.backdrop)} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <ImagePlus className="w-4 h-4" />
                        {t('admin.gallery')}
                      </label>
                      <div className="flex flex-wrap gap-3 mb-2">
                        {form.images.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
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
                                  images: f.images.map((img, i) =>
                                    i === idx ? { ...img, caption: e.target.value } : img
                                  ),
                                }))
                              }
                              placeholder={t('admin.imageCaption') || 'Подпись'}
                              className="w-20 text-xs border border-gray-200 rounded px-1 py-0.5"
                            />
                          </div>
                        ))}
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 text-gray-500 disabled:opacity-50 self-start">
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setUploading('image')
                              try {
                                const { path } = await adminApi.uploadFile(file, 'image', {
                                  baseName: buildUploadBaseName(
                                    form.title,
                                    MEDIA_TYPE_TO_PATH[mediaType],
                                    editingItem?.id,
                                    'image',
                                    form.images.length + 1
                                  ),
                                })
                                setForm((f) => ({ ...f, images: [...f.images, { url: path, caption: '' }] }))
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

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <IconTypeMovie className="w-4 h-4" />
                        {t('admin.trailers')}
                      </label>
                      <ul className="space-y-1 mb-2">
                        {form.videos.map((video, idx) => (
                          <li key={idx} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
                            <VideoThumbnail
                              videoUrl={video.url}
                              title={video.name}
                              className="aspect-video w-full max-w-xs rounded-lg"
                            />
                            <span className="truncate min-w-0 text-sm text-gray-600">{video.url}</span>
                            <input
                              type="text"
                              value={video.name ?? ''}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  videos: f.videos.map((item, i) =>
                                    i === idx ? { ...item, name: e.target.value } : item
                                  ),
                                }))
                              }
                              className="input w-full"
                              placeholder="Название трейлера"
                            />
                            <button
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, videos: f.videos.filter((_, i) => i !== idx) }))}
                              className="self-end p-1 text-gray-500 hover:text-red-600 rounded"
                              aria-label={t('common.remove')}
                            >
                              <IconCross className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium cursor-pointer disabled:opacity-50">
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
                        <label className="block text-sm font-medium text-gray-700">{t('media.rating')}</label>
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
                          <label className="block text-sm font-medium text-gray-700">{t('media.duration')}</label>
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
                        <label className="block text-sm font-medium text-gray-700">{t('admin.country')}</label>
                        <input
                          type="text"
                          value={form.country}
                          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                          className="input w-full"
                        />
                      </>
                    )}
                    <label className="block text-sm font-medium text-gray-700">{t('media.ageRating')}</label>
                    <select
                      value={form.ageRating}
                      onChange={(e) => setForm((f) => ({ ...f, ageRating: e.target.value }))}
                      className="input w-full"
                    >
                      <option value="">—</option>
                      {AGE_RATINGS.map((ar) => (
                        <option key={ar} value={ar}>
                          {t(`ageRating.${ar}`)}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-4 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isHidden}
                          onChange={(e) => setForm((f) => ({ ...f, isHidden: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">{t('admin.hiddenBlocked')}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">{t('media.status')}</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                          className="input w-40"
                        >
                          {MEDIA_STATUS_OPTIONS.map((o) => (
                            <option key={o.value || '_'} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <Link2 className="w-4 h-4" />
                        {t('admin.resourceLinks')}
                      </label>
                      {form.sites.map((row, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <select
                            value={row.siteId || ''}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                sites: f.sites.map((s, i) =>
                                  i === idx ? { ...s, siteId: Number(e.target.value) } : s
                                ),
                              }))
                            }
                            className="input flex-1 min-w-0 text-sm"
                          >
                            <option value="">— {t('admin.selectResource')} —</option>
                            {sitesList.map((site) => (
                              <option key={site.id} value={site.id}>
                                {getEntityName(site, locale)}
                              </option>
                            ))}
                          </select>
                          <input
                            type="url"
                            value={row.url}
                            onChange={(e) => {
                              const newUrl = e.target.value
                              setForm((f) => {
                                const sites = f.sites.map((s, i) => (i === idx ? { ...s, url: newUrl } : s))
                                const detectedSiteId = detectSiteFromUrl(newUrl, sitesList)
                                if (detectedSiteId != null && sites[idx]) {
                                  sites[idx] = { ...sites[idx], siteId: detectedSiteId }
                                }
                                return { ...f, sites }
                              })
                            }}
                            placeholder="URL (ресурс определится по ссылке)"
                            className="input flex-1 min-w-0 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, sites: f.sites.filter((_, i) => i !== idx) }))}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-lg shrink-0"
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

                    {supportsFullEdit && (
                      <>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.genres')}</label>
                          {selectedGenres.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {selectedGenres.map((g) => (
                                <span
                                  key={g.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                                >
                                  {g.emoji && <span>{g.emoji}</span>}
                                  {getEntityName(g, locale)}
                                  <button
                                    type="button"
                                    onClick={() => toggleGenre(g.id)}
                                    className="hover:bg-white/20 rounded p-0.5"
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
                              <ul className="absolute z-[70] mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto py-1">
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
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
                                    >
                                      {g.emoji && <span className="mr-1">{g.emoji}</span>}
                                      {getEntityName(g, locale)}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.themes')}</label>
                          {selectedThemes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {selectedThemes.map((th) => (
                                <span
                                  key={th.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                                >
                                  {th.emoji && <span>{th.emoji}</span>}
                                  {getEntityName(th, locale)}
                                  <button
                                    type="button"
                                    onClick={() => toggleTheme(th.id)}
                                    className="hover:bg-white/20 rounded p-0.5"
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
                              <ul className="absolute z-[70] mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto py-1">
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
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
                                    >
                                      {th.emoji && <span className="mr-1">{th.emoji}</span>}
                                      {getEntityName(th, locale)}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                        {schema.hasStudios && (
                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.studios')}</label>
                            {selectedStudios.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {selectedStudios.map((s) => (
                                  <span
                                    key={s.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                                  >
                                    {getEntityName(s, locale)}
                                    <button
                                      type="button"
                                      onClick={() => toggleStudio(s.id)}
                                      className="hover:bg-white/20 rounded p-0.5"
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
                                <ul className="absolute z-[70] mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto py-1">
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
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
                                      >
                                        {getEntityName(s, locale)}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}

                        {schema.hasSeriesFields && (
                          <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-800">{t('admin.seasonAndEpisodes')}</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600">{t('media.season')}</label>
                                <input
                                  type="text"
                                  value={form.seasonNumber}
                                  onChange={(e) => setForm((f) => ({ ...f, seasonNumber: e.target.value }))}
                                  className="input w-full text-sm"
                                  placeholder="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">{t('media.episodes')}</label>
                                <input
                                  type="text"
                                  value={form.episodesCount}
                                  onChange={(e) => setForm((f) => ({ ...f, episodesCount: e.target.value }))}
                                  className="input w-full text-sm"
                                  placeholder="12"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">{t('media.minPerEpisode')}</label>
                                <input
                                  type="text"
                                  value={form.episodeDuration}
                                  onChange={(e) => setForm((f) => ({ ...f, episodeDuration: e.target.value }))}
                                  className="input w-full text-sm"
                                  placeholder="24"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">{t('media.currentEpisode')}</label>
                                <input
                                  type="text"
                                  value={form.currentEpisode}
                                  onChange={(e) => setForm((f) => ({ ...f, currentEpisode: e.target.value }))}
                                  className="input w-full text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">{t('admin.scheduleList')}</label>
                              <ul className="space-y-2 mb-2">
                                {releaseScheduleRows.map((row, idx) => (
                                  <li key={idx} className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="number"
                                      placeholder="№ серии"
                                      value={row.episodeNumber ?? ''}
                                      onChange={(e) => {
                                        const v = e.target.value
                                        const next = [...releaseScheduleRows]
                                        next[idx] = {
                                          ...next[idx],
                                          episodeNumber: v === '' ? undefined : parseInt(v, 10),
                                        }
                                        setReleaseScheduleRows(next)
                                        setForm((f) => ({
                                          ...f,
                                          releaseScheduleStr: JSON.stringify(scheduleRowsToJson(next)),
                                        }))
                                      }}
                                      className="input w-16 text-sm rounded-lg"
                                    />
                                    <input
                                      type="date"
                                      value={row.date ?? ''}
                                      onChange={(e) => {
                                        const next = [...releaseScheduleRows]
                                        next[idx] = { ...next[idx], date: e.target.value || undefined }
                                        setReleaseScheduleRows(next)
                                        setForm((f) => ({
                                          ...f,
                                          releaseScheduleStr: JSON.stringify(scheduleRowsToJson(next)),
                                        }))
                                      }}
                                      className="input flex-1 min-w-[120px] text-sm rounded-lg"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Время (20:00)"
                                      value={row.time ?? ''}
                                      onChange={(e) => {
                                        const next = [...releaseScheduleRows]
                                        next[idx] = { ...next[idx], time: e.target.value || undefined }
                                        setReleaseScheduleRows(next)
                                        setForm((f) => ({
                                          ...f,
                                          releaseScheduleStr: JSON.stringify(scheduleRowsToJson(next)),
                                        }))
                                      }}
                                      className="input w-24 text-sm rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = releaseScheduleRows.filter((_, i) => i !== idx)
                                        setReleaseScheduleRows(next)
                                        setForm((f) => ({
                                          ...f,
                                          releaseScheduleStr: JSON.stringify(scheduleRowsToJson(next)),
                                        }))
                                      }}
                                      className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                                      aria-label={t('common.remove')}
                                    >
                                      <IconCross className="w-4 h-4" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...releaseScheduleRows, {}]
                                    setReleaseScheduleRows(next)
                                    setForm((f) => ({
                                      ...f,
                                      releaseScheduleStr: JSON.stringify(scheduleRowsToJson(next)),
                                    }))
                                  }}
                                  className="btn-secondary text-xs rounded-lg flex items-center gap-1"
                                >
                                  <IconPlus className="w-3 h-3" /> {t('common.add')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const raw = window.prompt(
                                      'Вставьте JSON расписания (массив или объект с полями date/time/episodeNumber):'
                                    )
                                    if (raw == null || raw.trim() === '') return
                                    try {
                                      const parsed = JSON.parse(raw) as unknown
                                      const rows = parseScheduleToRows(parsed)
                                      setReleaseScheduleRows(rows)
                                      const json = scheduleRowsToJson(rows)
                                      setForm((f) => ({
                                        ...f,
                                        releaseScheduleStr: json != null ? JSON.stringify(json) : '',
                                      }))
                                    } catch {
                                      window.alert('Неверный JSON')
                                    }
                                  }}
                                  className="btn-secondary text-xs rounded-lg"
                                >
                                  Вставить из JSON
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {schema.hasGameFields && (
                          <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-800">
                              {t('media.platforms')} / разработчики / издатели
                            </h4>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">{t('media.platforms')}</label>
                              {form.platformIds.length > 0 && (
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
                                          className="hover:bg-white/20 rounded"
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
                                  placeholder={t('admin.searchPlatform')}
                                  className="input w-full text-sm"
                                  onFocus={() => setOpenDropdown('studio')}
                                />
                                {platformsList
                                  .filter((p) => !form.platformIds.includes(p.id))
                                  .slice(0, 8)
                                  .map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => togglePlatform(p.id)}
                                      className="block w-full text-left px-2 py-1 text-sm hover:bg-lavender-100 rounded"
                                    >
                                      {getEntityName(p, locale)}
                                    </button>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">{t('admin.developers')}</label>
                              {form.developerIds.length > 0 && (
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
                                          className="hover:bg-white/20 rounded"
                                          aria-label={t('common.remove')}
                                        >
                                          <IconCross className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                </div>
                              )}
                              <div className="relative">
                                {developersList
                                  .filter((d) => !form.developerIds.includes(d.id))
                                  .slice(0, 8)
                                  .map((d) => (
                                    <button
                                      key={d.id}
                                      type="button"
                                      onClick={() => toggleDeveloper(d.id)}
                                      className="block w-full text-left px-2 py-1 text-sm hover:bg-lavender-100 rounded"
                                    >
                                      {getEntityName(d, locale)}
                                    </button>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">{t('admin.publishers')}</label>
                              {selectedPublishers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {selectedPublishers.map((p) => (
                                    <span
                                      key={p.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                                    >
                                      {getEntityName(p, locale)}
                                      <button
                                        type="button"
                                        onClick={() => togglePublisher(p.id)}
                                        className="hover:bg-white/20 rounded p-0.5"
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
                                  value={publisherSearch}
                                  onChange={(e) => setPublisherSearch(e.target.value)}
                                  onFocus={() => setOpenDropdown('publisher')}
                                  onBlur={() => setTimeout(() => setOpenDropdown(null), 180)}
                                  placeholder={t('admin.searchPublisher')}
                                  className="input w-full text-sm rounded-lg"
                                />
                                {openDropdown === 'publisher' && publisherOptions.length > 0 && (
                                  <ul className="absolute z-[70] mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto py-1">
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
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
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
                          <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-800">{t('admin.volumesPagesPublishers')}</h4>
                            {(schema.hasMangaFields || schema.hasLightNovelFields) && (
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600">{t('admin.volumes')}</label>
                                  <input
                                    type="text"
                                    value={form.volumes}
                                    onChange={(e) => setForm((f) => ({ ...f, volumes: e.target.value }))}
                                    className="input w-full text-sm"
                                    placeholder="—"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600">{t('admin.currentVolume')}</label>
                                  <input
                                    type="text"
                                    value={form.currentVolume}
                                    onChange={(e) => setForm((f) => ({ ...f, currentVolume: e.target.value }))}
                                    className="input w-full text-sm"
                                  />
                                </div>
                                {schema.hasMangaFields && (
                                  <div>
                                    <label className="block text-xs text-gray-600">{t('admin.currentChapter')}</label>
                                    <input
                                      type="text"
                                      value={form.currentChapter}
                                      onChange={(e) => setForm((f) => ({ ...f, currentChapter: e.target.value }))}
                                      className="input w-full text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {(schema.hasBookFields || schema.hasLightNovelFields) && (
                              <div className="flex flex-wrap gap-3 items-end">
                                <div>
                                  <label className="block text-xs text-gray-600">{t('admin.pages')}</label>
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
                                    <label className="block text-xs text-gray-600">{t('media.readingDuration')}</label>
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
                              <label className="block text-xs text-gray-600 mb-1">{t('admin.publishers')}</label>
                              {selectedPublishers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {selectedPublishers.map((p) => (
                                    <span
                                      key={p.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                                    >
                                      {getEntityName(p, locale)}
                                      <button
                                        type="button"
                                        onClick={() => togglePublisher(p.id)}
                                        className="hover:bg-white/20 rounded p-0.5"
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
                                  value={publisherSearch}
                                  onChange={(e) => setPublisherSearch(e.target.value)}
                                  onFocus={() => setOpenDropdown('publisher')}
                                  onBlur={() => setTimeout(() => setOpenDropdown(null), 180)}
                                  placeholder={t('admin.searchPublisher')}
                                  className="input w-full text-sm rounded-lg"
                                />
                                {openDropdown === 'publisher' && publisherOptions.length > 0 && (
                                  <ul className="absolute z-[70] mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto py-1">
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
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
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
                              <label className="block text-xs text-gray-600 mb-1">{t('admin.authors')}</label>
                              {addedAuthorPersons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {addedAuthorPersons.map((p) => (
                                    <span
                                      key={p.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                                    >
                                      {getPersonDisplayName(p, locale)}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddedAuthorPersons((prev) => prev.filter((x) => x.id !== p.id))
                                          setForm((f) => ({ ...f, authorIds: f.authorIds.filter((id) => id !== p.id) }))
                                        }}
                                        className="hover:bg-white/20 rounded p-0.5"
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
                                  value={authorSearch}
                                  onChange={(e) => setAuthorSearch(e.target.value)}
                                  onKeyDown={(e) =>
                                    e.key === 'Enter' &&
                                    (e.preventDefault(),
                                    personsApi
                                      .getList(1, 20, authorSearch.trim())
                                      .then((r) => setAuthorResults(r.data ?? [])))
                                  }
                                  placeholder={t('admin.searchAuthor')}
                                  className="input w-full text-sm rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    personsApi
                                      .getList(1, 20, authorSearch.trim())
                                      .then((r) => setAuthorResults(r.data ?? []))
                                  }
                                  className="btn-secondary text-xs mt-1 rounded-lg"
                                >
                                  {t('common.search')}
                                </button>
                                {authorResults.length > 0 && (
                                  <ul className="absolute z-[70] mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto py-1">
                                    {authorResults.slice(0, 10).map((p) => (
                                      <li key={p.id}>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            if (form.authorIds.includes(p.id)) return
                                            setAddedAuthorPersons((prev) =>
                                              prev.some((x) => x.id === p.id) ? prev : [...prev, p]
                                            )
                                            setForm((f) => ({
                                              ...f,
                                              authorIds: f.authorIds.includes(p.id)
                                                ? f.authorIds
                                                : [...f.authorIds, p.id],
                                            }))
                                            setAuthorResults([])
                                            setAuthorSearch('')
                                          }}
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
                                        >
                                          #{p.id} {getPersonDisplayName(p, locale)}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">{t('admin.illustrators')}</label>
                              {addedIllustratorPersons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {addedIllustratorPersons.map((p) => (
                                    <span
                                      key={p.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-lavender-400 text-white"
                                    >
                                      {getPersonDisplayName(p, locale)}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddedIllustratorPersons((prev) => prev.filter((x) => x.id !== p.id))
                                          setForm((f) => ({
                                            ...f,
                                            illustratorIds: f.illustratorIds.filter((id) => id !== p.id),
                                          }))
                                        }}
                                        className="hover:bg-white/20 rounded p-0.5"
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
                                  value={illustratorSearch}
                                  onChange={(e) => setIllustratorSearch(e.target.value)}
                                  onKeyDown={(e) =>
                                    e.key === 'Enter' &&
                                    (e.preventDefault(),
                                    personsApi
                                      .getList(1, 20, illustratorSearch.trim())
                                      .then((r) => setIllustratorResults(r.data ?? [])))
                                  }
                                  placeholder={t('admin.searchIllustrator')}
                                  className="input w-full text-sm rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    personsApi
                                      .getList(1, 20, illustratorSearch.trim())
                                      .then((r) => setIllustratorResults(r.data ?? []))
                                  }
                                  className="btn-secondary text-xs mt-1 rounded-lg"
                                >
                                  {t('common.search')}
                                </button>
                                {illustratorResults.length > 0 && (
                                  <ul className="absolute z-[70] mt-1 w-full border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto py-1">
                                    {illustratorResults.slice(0, 10).map((p) => (
                                      <li key={p.id}>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            if (form.illustratorIds.includes(p.id)) return
                                            setAddedIllustratorPersons((prev) =>
                                              prev.some((x) => x.id === p.id) ? prev : [...prev, p]
                                            )
                                            setForm((f) => ({
                                              ...f,
                                              illustratorIds: f.illustratorIds.includes(p.id)
                                                ? f.illustratorIds
                                                : [...f.illustratorIds, p.id],
                                            }))
                                            setIllustratorResults([])
                                            setIllustratorSearch('')
                                          }}
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
                                        >
                                          #{p.id} {getPersonDisplayName(p, locale)}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {schema.hasCastAndStaff && (
                          <>
                            <div className="border-t border-gray-200 pt-3 mt-3 space-y-4">
                              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <IconGroup className="w-4 h-4" />
                                {t('admin.castSectionTitle')}
                              </h4>
                              <p className="text-xs text-gray-500">{t('admin.castSectionDesc')}</p>
                              {castList.length > 0 && (
                                <>
                                  <p className="text-xs font-medium text-gray-600">{t('admin.castAdded')}</p>
                                  <ul className="space-y-2 rounded-lg bg-gray-50 p-2 border border-gray-100">
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
                                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-white border border-gray-100"
                                        >
                                          <span className="text-gray-700">
                                            {c.person ? getPersonDisplayName(c.person, locale) || '—' : '—'}
                                            {c.character && ` → ${getEntityName(c.character, locale)}`}
                                            {c.role && ` (${c.role})`}
                                            {c.roleType && (
                                              <span className="text-gray-500 ml-1">
                                                [{t('admin.roleType.' + c.roleType)}]
                                              </span>
                                            )}
                                            {c.dubbings?.length ? (
                                              <span className="text-amber-600 ml-1">
                                                <Mic2 className="w-3 h-3 inline" /> {c.dubbings.length}
                                              </span>
                                            ) : null}
                                          </span>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => setEditingCastId(editingCastId === c.id ? null : c.id)}
                                              className="p-1.5 text-gray-500 hover:text-lavender-600 rounded"
                                              aria-label={t('common.edit')}
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleCastDeleteClick(c, name)}
                                              className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                                              aria-label={t('common.delete')}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </>
                              )}
                              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-3">
                                <p className="text-xs font-medium text-amber-800">{t('admin.addDubbing')}</p>
                                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end">
                                  <div className="min-w-0 w-full sm:w-auto sm:min-w-[180px]">
                                    <label className="block text-xs text-gray-600 mb-0.5">{t('admin.castEntry')}</label>
                                    <select
                                      value={dubbingCastId === 'new' ? 'new' : (dubbingCastId ?? '')}
                                      onChange={(e) => {
                                        const v = e.target.value
                                        setDubbingCastId(v === 'new' ? 'new' : v ? Number(v) : null)
                                      }}
                                      className="input w-full min-w-0 sm:min-w-[180px] text-sm rounded-lg"
                                    >
                                      <option value="new">{t('admin.dubbingForNew')}</option>
                                      {castList.map((c) => {
                                        const label =
                                          [
                                            c.person ? getPersonDisplayName(c.person, locale) : '',
                                            c.character ? getEntityName(c.character, locale) : '',
                                            c.role,
                                          ]
                                            .filter(Boolean)
                                            .join(' → ') || `#${c.id}`
                                        return (
                                          <option key={c.id} value={c.id}>
                                            {label}
                                          </option>
                                        )
                                      })}
                                    </select>
                                  </div>
                                  <div className="relative min-w-0 w-full sm:w-auto flex-1 sm:flex-initial">
                                    <label className="block text-xs text-gray-600 mb-0.5">{t('admin.voiceActorSearch')}</label>
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1">
                                      <input
                                        type="text"
                                        value={dubbingPersonSearch}
                                        onChange={(e) => setDubbingPersonSearch(e.target.value)}
                                        onKeyDown={(e) =>
                                          e.key === 'Enter' &&
                                          (e.preventDefault(),
                                          personsApi
                                            .getList(1, 20, dubbingPersonSearch.trim())
                                            .then((r) => setDubbingPersonResults(r.data ?? [])))
                                        }
                                        placeholder={t('admin.searchPlaceholder')}
                                        className="input flex-1 min-w-0 w-full sm:w-44 text-sm rounded-lg"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          personsApi
                                            .getList(1, 20, dubbingPersonSearch.trim())
                                            .then((r) => setDubbingPersonResults(r.data ?? []))
                                        }
                                        className="btn-secondary text-xs rounded-lg shrink-0"
                                      >
                                        {t('common.search')}
                                      </button>
                                    </div>
                                    {dubbingPersonResults.length > 0 && (
                                      <ul className="absolute z-[70] left-0 top-full mt-1 w-full min-w-0 max-w-[min(100vw,20rem)] border rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg py-1">
                                        {dubbingPersonResults.slice(0, 6).map((p) => (
                                          <li key={p.id}>
                                            <button
                                              type="button"
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() => {
                                                setDubbingPerson(p)
                                                setDubbingPersonResults([])
                                                setDubbingPersonSearch('')
                                              }}
                                              className="w-full text-left px-3 py-2 text-sm hover:bg-lavender-100"
                                            >
                                              #{p.id} {getPersonDisplayName(p, locale)}
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                  {dubbingPerson && (
                                    <span className="text-xs text-gray-600">
                                      {t('admin.selectedPerson')}: {getPersonDisplayName(dubbingPerson, locale)}
                                    </span>
                                  )}
                                  <div className="min-w-0 w-full sm:w-auto">
                                    <label className="block text-xs text-gray-600 mb-0.5">
                                      {t('admin.dubbingLanguage')}
                                    </label>
                                    <select
                                      value={dubbingLanguage}
                                      onChange={(e) => setDubbingLanguage(e.target.value)}
                                      className="input w-full min-w-0 sm:w-40 text-sm rounded-lg"
                                    >
                                      <option value="">— {t('admin.selectLanguage')} —</option>
                                      {DUBBING_LANGUAGES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={
                                      dubbingCastId == null ||
                                      !dubbingPerson ||
                                      !dubbingLanguage ||
                                      (dubbingCastId === 'new' &&
                                        !addCastPerson &&
                                        !addCastCharacter &&
                                        !addCastRole.trim())
                                    }
                                    title={
                                      dubbingCastId === 'new' &&
                                      !addCastPerson &&
                                      !addCastCharacter &&
                                      !addCastRole.trim()
                                        ? t('admin.forNewEntryFill')
                                        : !dubbingPerson || !dubbingLanguage
                                          ? t('admin.selectDubbingActorAndLanguage')
                                          : t('admin.dubbingApiInProgress')
                                    }
                                    className="btn-secondary text-xs rounded-lg flex items-center justify-center gap-1 w-full sm:w-auto"
                                  >
                                    <IconPlus className="w-3 h-3" /> Добавить дубляж
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">{t('admin.personHeader')}</label>
                                  <input
                                    type="text"
                                    value={personSearch}
                                    onChange={(e) => setPersonSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchPersons())}
                                    placeholder={t('admin.searchPerson')}
                                    className="input w-full text-sm rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={searchPersons}
                                    className="btn-secondary text-xs mt-1 rounded-lg"
                                  >
                                    {t('common.search')}
                                  </button>
                                  {personResults.length > 0 && (
                                    <ul className="mt-1 border rounded-lg max-h-24 overflow-y-auto bg-white">
                                      {personResults.slice(0, 8).map((p) => (
                                        <li key={p.id}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAddCastPerson(p)
                                              setPersonResults([])
                                              setPersonSearch('')
                                            }}
                                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-lavender-100"
                                          >
                                            #{p.id} {getPersonDisplayName(p, locale)}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {addCastPerson && (
                                    <span className="text-xs text-gray-600 block mt-1">
                                      {t('admin.personHeader')}: {getPersonDisplayName(addCastPerson, locale)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
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
                                    {t('common.search')}
                                  </button>
                                  {characterResults.length > 0 && (
                                    <ul className="mt-1 border rounded-lg max-h-24 overflow-y-auto bg-white">
                                      {characterResults.slice(0, 8).map((ch) => (
                                        <li key={ch.id}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAddCastCharacter(ch)
                                              setCharacterResults([])
                                              setCharacterSearch('')
                                            }}
                                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-lavender-100"
                                          >
                                            #{ch.id} {getEntityName(ch, locale)}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {addCastCharacter && (
                                    <span className="text-xs text-gray-600 block mt-1">
                                      {t('character.title')}: {getEntityName(addCastCharacter, locale)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 items-center">
                                {!addCastCharacter && (
                                  <div className="flex flex-col">
                                    <input
                                      type="text"
                                      value={addCastRole}
                                      onChange={(e) => setAddCastRole(e.target.value)}
                                      placeholder={t('admin.roleName')}
                                      className="input w-36 text-sm rounded-lg"
                                      title={t('admin.roleNameHint')}
                                    />
                                    <span className="text-xs text-gray-500">{t('admin.roleNameHint')}</span>
                                  </div>
                                )}
                                <select
                                  value={addCastRoleType}
                                  onChange={(e) => setAddCastRoleType(e.target.value as RoleType)}
                                  className="input w-36 text-sm rounded-lg"
                                >
                                  {ROLE_TYPES.map((rt) => (
                                    <option key={rt} value={rt}>
                                      {t('admin.roleType.' + rt)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={!addCastPerson && !addCastCharacter && !addCastRole.trim()}
                                  className="btn-secondary text-sm flex items-center gap-1 rounded-lg"
                                  title={t('admin.castApiInProgress')}
                                >
                                  <IconPlus className="w-4 h-4" />В каст
                                </button>
                              </div>
                              <p className="text-xs text-amber-600">{t('admin.castDubbingApiHint')}</p>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3 space-y-4">
                              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                {t('admin.staffSectionTitle')}
                              </h4>
                              <p className="text-xs text-gray-500">{t('admin.staffSectionDesc')}</p>
                              {staffList.length > 0 && (
                                <>
                                  <p className="text-xs font-medium text-gray-600">{t('admin.staffAdded')}</p>
                                  <ul className="space-y-2 rounded-lg bg-gray-50 p-2 border border-gray-100">
                                    {staffList.map((s) => {
                                      const name = s.person ? getPersonDisplayName(s.person, locale) || '—' : '—'
                                      const professionLabel = t('person.' + s.profession)
                                      return (
                                        <li
                                          key={s.id}
                                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-white border border-gray-100"
                                        >
                                          <span className="text-gray-700">
                                            {name} <span className="text-gray-500">({professionLabel})</span>
                                          </span>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => setEditingCastId(editingCastId === s.id ? null : s.id)}
                                              className="p-1.5 text-gray-500 hover:text-lavender-600 rounded"
                                              aria-label={t('common.edit')}
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleStaffDeleteClick(s, name)}
                                              className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                                              aria-label={t('common.delete')}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </>
                              )}
                              <div className="flex flex-wrap gap-2 items-end">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">{t('admin.personHeader')}</label>
                                  <input
                                    type="text"
                                    value={staffPersonSearch}
                                    onChange={(e) => setStaffPersonSearch(e.target.value)}
                                    onKeyDown={(e) =>
                                      e.key === 'Enter' &&
                                      (e.preventDefault(),
                                      (async () => {
                                        const res = await personsApi.getList(1, 20, staffPersonSearch.trim())
                                        setStaffPersonResults(res.data ?? [])
                                      })())
                                    }
                                    placeholder={t('admin.searchPerson')}
                                    className="input w-48 text-sm rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!staffPersonSearch.trim()) return
                                      const res = await personsApi.getList(1, 20, staffPersonSearch.trim())
                                      setStaffPersonResults(res.data ?? [])
                                    }}
                                    className="btn-secondary text-xs mt-1 rounded-lg ml-1"
                                  >
                                    {t('common.search')}
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">{t('admin.roleOrProfession')}</label>
                                  <select
                                    value={addStaffProfession}
                                    onChange={(e) => setAddStaffProfession(e.target.value as Profession)}
                                    className="input w-36 text-sm rounded-lg"
                                  >
                                    {STAFF_PROFESSIONS.map((pr) => (
                                      <option key={pr} value={pr}>
                                        {t('person.' + pr)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  disabled={!addStaffPerson}
                                  className="btn-secondary text-sm rounded-lg flex items-center gap-1"
                                  title={t('admin.staffApiInProgress')}
                                >
                                  <IconPlus className="w-4 h-4" />
                                  {t('admin.addToStaff')}
                                </button>
                              </div>
                              {staffPersonResults.length > 0 && (
                                <ul className="border rounded-lg max-h-24 overflow-y-auto bg-white">
                                  {staffPersonResults.slice(0, 6).map((p) => (
                                    <li key={p.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddStaffPerson(p)
                                          setStaffPersonResults([])
                                          setStaffPersonSearch('')
                                        }}
                                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-lavender-100"
                                      >
                                        #{p.id} {getPersonDisplayName(p, locale)}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {addStaffPerson && (
                                <span className="text-xs text-gray-600">
                                  {t('admin.selected')}: {getPersonDisplayName(addStaffPerson, locale)}
                                </span>
                              )}
                              <p className="text-xs text-amber-600">{t('admin.staffApiHint')}</p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null)
                        setIsCreateMode(false)
                      }}
                      className="btn-secondary rounded-xl"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving || !form.title.trim()}
                      className="btn-primary rounded-xl"
                    >
                      {saving ? t('common.loading') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {deleteConfirm &&
            createPortal(
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} aria-hidden />
                <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                  <h3 className="text-lg font-semibold">{t('admin.confirmDeleteTitle')}</h3>
                  {deleteConfirm.type === 'media' && (
                    <p className="text-gray-700">
                      {t('admin.confirmDeleteMedia', {
                        title: getMediaTitle(deleteConfirm.item, locale) || deleteConfirm.item.title,
                        id: deleteConfirm.item.id,
                      })}
                    </p>
                  )}
                  {deleteConfirm.type === 'cast' && (
                    <p className="text-gray-700">{t('admin.confirmDeleteCast', { name: deleteConfirm.name })}</p>
                  )}
                  {deleteConfirm.type === 'staff' && (
                    <p className="text-gray-700">{t('admin.confirmDeleteCast', { name: deleteConfirm.name })}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary rounded-xl">
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="btn-primary rounded-xl bg-red-600 hover:bg-red-700"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </section>
  )
}
