import { useEffect, useState, useRef, useMemo, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { IconCross, IconPerson } from '@/components/icons'
import { mediaApi } from '@/api/media'
import {
  Media,
  ListStatus,
  Cast,
  ListItem,
  Review,
  TITLE_REACTION_TO_REVIEW_STATUS,
  REVIEW_STATUS_EMOJIS,
  type AnimeSeries as AnimeSeriesType,
  type ReviewStatus,
} from '@/types'
import RatingEmoji from '@/components/RatingEmoji'
import { AGE_RATINGS } from '@/constants/enums'
import { getMediaTitle, getMediaDescription } from '@/utils/localizedText'
import { useAuthStore } from '@/store/authStore'
import { useListStore } from '@/store/listStore'
import AddToListModal from '@/components/AddToListModal'
import EditInListModal from '@/components/EditInListModal'
import AddToCollectionModal from '@/components/AddToCollectionModal'
import { favoritesApi } from '@/api/favorites'
import { getFranchiseLinksByMedia, type FranchiseLinkItem } from '@/api/franchise'
import { discussionsApi, type Discussion } from '@/api/discussions'
import { reviewsApi, type ReviewMediaType, type SimilarUserListRating } from '@/api/reviews'
import { reactionsApi, type ReviewReactionType } from '@/api/reactions'
import { useToastStore } from '@/store/toastStore'
import { useTranslation } from 'react-i18next'
import { getMediaAssetUrl, MediaTypeForPath } from '@/utils/mediaPaths'
import { normalizeMediaVideos } from '@/utils/mediaVideos'
import clsx from 'clsx'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { normalizeRatingToPercent } from '@/utils/rating'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { usePageTitle } from '@/hooks/usePageTitle'
import { isRichTextEmpty, sanitizeRichHtml, RICH_TEXT_MAX_REVIEW_HTML } from '@/utils/richText'
import { ListEntityType } from '@/api/lists'
import MediaEditModal from '@/components/MediaEditModal'
import { MediaDetailTabs } from '@/components/media/MediaDetailTabs'
import { MediaDetailDiscussionsSection } from '@/components/media/MediaDetailDiscussionsSection'
import { MediaDetailReviewsSection } from '@/components/media/MediaDetailReviewsSection'
import {
  getMediaChaptersCount,
  getMediaChaptersFromVolumes,
  getMediaCountries,
  getMediaCurrentChapter,
  getMediaCurrentEpisode,
  getMediaCurrentVolume,
  getMediaEpisodeDuration,
  getMediaEpisodesCount,
  getMediaPages,
  getMediaReadingDurationMinutes,
  getMediaSeasonNumber,
  getMediaVolumes,
  getMediaVolumesCount,
} from '@/utils/typeGuards'
import { MediaDetailHero } from '@/components/media/MediaDetailHero'
import { MediaDetailCompaniesSection } from '@/components/media/MediaDetailCompaniesSection'
import { MediaDetailScheduleSection } from '@/components/media/MediaDetailScheduleSection'
import { MediaDetailCastFranchiseSection } from '@/components/media/MediaDetailCastFranchiseSection'

interface MediaDetailsProps {
  type: MediaTypeForPath
}

type MediaDetailSection = 'info' | 'gallery' | 'comments' | 'discussions' | 'reviews'

/** Классы бейджа статуса медиа — по темам (accent/20 + text) */
function getMediaStatusBadgeClasses(_status: string): { bg: string; text: string } {
  return { bg: 'bg-[var(--theme-accent)]/20', text: 'text-[var(--theme-text)]' }
}

const listTypeMap: Record<MediaTypeForPath, ListEntityType> = {
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

/** Ключи для отображения названия списка в навбаре (nav.movies → «Фильмы») */
const LIST_TYPE_NAV_KEY: Record<ListEntityType, string> = {
  movies: 'movies',
  anime: 'anime',
  games: 'games',
  'tv-series': 'tvSeries',
  manga: 'manga',
  books: 'books',
  'light-novels': 'lightNovels',
  'cartoon-series': 'cartoonSeries',
  'cartoon-movies': 'cartoonMovies',
  'anime-movies': 'animeMovies',
}

const favoriteEntityMap: Record<MediaTypeForPath, string> = {
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

const COMMENT_ENTITY_TYPES: MediaTypeForPath[] = [
  'movie',
  'tv-series',
  'cartoon-series',
  'cartoon-movies',
  'anime',
  'anime-movies',
  'game',
  'manga',
  'book',
  'light-novel',
]

/** Типы медиа, для которых есть рецензии (блок как у фильмов). */
const REVIEW_TYPES: MediaTypeForPath[] = [
  'movie',
  'tv-series',
  'cartoon-series',
  'cartoon-movies',
  'anime',
  'anime-movies',
  'game',
  'manga',
  'book',
  'light-novel',
]

const TYPE_TO_REVIEW_MEDIA: Record<MediaTypeForPath, ReviewMediaType | null> = {
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

/** Моковые оценки для блока «Оценки от пользователей с похожими вкусами» (при пустом ответе API). */
const MOCK_SIMILAR_USERS_RATINGS: SimilarUserListRating[] = [
  { userId: 1, username: 'alice', name: 'Алиса', avatar: null, similarityScore: 0.92, rating: 88 },
  { userId: 2, username: 'bob', name: 'Боб', avatar: null, similarityScore: 0.85, rating: 75 },
  { userId: 3, username: 'charlie', name: 'Чарли', avatar: null, similarityScore: 0.78, rating: 92 },
  { userId: 4, username: 'diana', name: 'Диана', avatar: null, similarityScore: 0.71, rating: 80 },
  { userId: 5, username: 'eve', name: 'Ева', avatar: null, similarityScore: 0.65, rating: 70 },
]

function getListItemEntityId(item: ListItem): number | undefined {
  const m =
    item.movie ??
    item.animeSeries ??
    item.game ??
    item.tvSeries ??
    item.manga ??
    item.book ??
    item.lightNovel ??
    item.cartoonSeries ??
    item.cartoonMovie ??
    item.animeMovie
  return m?.id
}

export default function MediaDetails({ type }: MediaDetailsProps) {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [castModalEntry, setCastModalEntry] = useState<Cast | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [franchiseLinks, setFranchiseLinks] = useState<FranchiseLinkItem[]>([])
  const [mediaReviews, setMediaReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewFormOpen, setReviewFormOpen] = useState(false)
  const [reviewFormRating, setReviewFormRating] = useState(80)
  const [reviewFormStatus, setReviewFormStatus] = useState<ReviewStatus | ''>('neutral')
  const [reviewFormText, setReviewFormText] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewDeleting, setReviewDeleting] = useState(false)
  const [reviewReactions, setReviewReactions] = useState<
    Record<number, { counts: Record<string, number>; myReaction: string | null }>
  >({})
  const [reactionLoading, setReactionLoading] = useState<Record<number, boolean>>({})
  const [similarUsersRatings, setSimilarUsersRatings] = useState<SimilarUserListRating[]>([])
  const [similarUsersRatingsLoading, setSimilarUsersRatingsLoading] = useState(false)
  const [favoriteCastIds, setFavoriteCastIds] = useState<Set<number>>(new Set())
  const [favoritePersonIds, setFavoritePersonIds] = useState<Set<number>>(new Set())
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null)
  const [trailerLightboxIndex, setTrailerLightboxIndex] = useState<number | null>(null)
  const [mediaEditOpen, setMediaEditOpen] = useState(false)
  const [ratingHoverPreview, setRatingHoverPreview] = useState<number | null>(null)
  const [ratingTooltipVisible, setRatingTooltipVisible] = useState(false)
  const ratingTrackRef = useRef<HTMLSpanElement>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [, setDiscussionsTotal] = useState(0)
  const [discussionsLoading, setDiscussionsLoading] = useState(false)
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [discussionCreateTitle, setDiscussionCreateTitle] = useState('')
  const [discussionCreateDescription, setDiscussionCreateDescription] = useState('')
  const [discussionCreateSubmitting, setDiscussionCreateSubmitting] = useState(false)
  const [discussionCreateModalOpen, setDiscussionCreateModalOpen] = useState(false)
  const ratingTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const similarScrollRef = useRef<HTMLDivElement>(null)
  const franchiseScrollRef = useRef<HTMLDivElement>(null)
  const castScrollRef = useRef<HTMLDivElement>(null)
  const staffScrollRef = useRef<HTMLDivElement>(null)

  /* Нативный wheel с passive: false. Блок не скроллится страницей, пока сам блок не доведён до края по направлению:
     • вправо (скролл вниз) — страница скроллится только когда блок уже в правом конце;
     • влево (скролл вверх) — сначала доводим блок до начала (левый край), потом скроллится страница вверх. */
  useEffect(() => {
    const refs = [similarScrollRef, franchiseScrollRef, castScrollRef, staffScrollRef]
    const handler = (e: WheelEvent) => {
      const target = e.target as Node
      for (const ref of refs) {
        const el = ref.current
        if (!el || !el.contains(target)) continue
        const { scrollLeft, clientWidth, scrollWidth } = el
        if (scrollWidth <= clientWidth) return
        const atLeft = scrollLeft <= 0
        const atRight = scrollLeft + clientWidth >= scrollWidth
        const scrollingRight = e.deltaY > 0
        const scrollingLeft = e.deltaY < 0
        if (scrollingRight && atRight) return
        if (scrollingLeft && atLeft) return
        e.preventDefault()
        el.scrollLeft += e.deltaY
        return
      }
    }
    document.addEventListener('wheel', handler, { passive: false })
    return () => document.removeEventListener('wheel', handler)
  }, [])

  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const localizedTitle = media ? getMediaTitle(media, locale) || media.title || '' : ''
  usePageTitle(localizedTitle || undefined)
  const { user } = useAuthStore()
  const { addToList, getList, fetchList, updateInList, removeFromList } = useListStore()
  const listType = listTypeMap[type]
  const entity = favoriteEntityMap[type]

  useEffect(() => {
    if (user && listType) void fetchList(listType)
  }, [user, listType, fetchList])

  useEffect(() => {
    if (searchParams.get('section') !== 'discussions' || !id || !type || selectedDiscussion) return
    setDiscussionsLoading(true)
    discussionsApi
      .list(type, parseInt(id, 10))
      .then((res) => {
        setDiscussions(res.discussions)
        setDiscussionsTotal(res.total)
      })
      .finally(() => setDiscussionsLoading(false))
  }, [searchParams, id, type, selectedDiscussion])

  const listItemInList: ListItem | undefined = id
    ? getList(listType).find((item) => getListItemEntityId(item) === parseInt(id, 10))
    : undefined

  const myReview = useMemo(
    () => mediaReviews.find((review) => user && review.userId === user.id) ?? null,
    [mediaReviews, user]
  )
  const otherReviews = useMemo(
    () => mediaReviews.filter((review) => !myReview || review.id !== myReview.id),
    [mediaReviews, myReview]
  )
  useEffect(() => {
    if (!id) return
    setMedia(null)
    setLoading(true)
    mediaApi
      .getMediaByType(type, parseInt(id, 10))
      .then(setMedia)
      .catch(() => setMedia(null))
      .finally(() => setLoading(false))
  }, [id, type])

  useEffect(() => {
    if (id == null) return
    window.scrollTo(0, 0)
    setFranchiseLinks([])
    setMediaReviews([])
    setSimilarUsersRatings([])
  }, [id, type])

  useEffect(() => {
    if (!id || !type) return
    const numId = parseInt(id, 10)
    getFranchiseLinksByMedia(type, numId)
      .then(setFranchiseLinks)
      .catch(() => setFranchiseLinks([]))
  }, [id, type])

  useEffect(() => {
    const reviewMediaType = TYPE_TO_REVIEW_MEDIA[type]
    if (!id || !reviewMediaType) return
    setReviewsLoading(true)
    reviewsApi
      .getMediaReviews(reviewMediaType, parseInt(id, 10))
      .then(setMediaReviews)
      .catch(() => setMediaReviews([]))
      .finally(() => setReviewsLoading(false))
  }, [id, type])

  useEffect(() => {
    if (myReview) {
      setReviewFormRating(myReview.overallRating)
      setReviewFormStatus((myReview.reviewStatus as ReviewStatus) || 'neutral')
      setReviewFormText(myReview.review || '<p></p>')
      setReviewFormOpen(false)
      return
    }

    setReviewFormRating(80)
    setReviewFormStatus('neutral')
    setReviewFormText('<p></p>')
    setReviewFormOpen(Boolean(user))
  }, [myReview, user])

  useEffect(() => {
    const targetType = reactionsApi.getReviewTargetType(type === 'light-novel' ? 'light-novels' : type)
    if (!targetType || mediaReviews.length === 0) {
      setReviewReactions({})
      return
    }

    const items = mediaReviews.map((review) => `${targetType}:${review.id}`).join(',')
    reactionsApi
      .getReviewReactionsBatch(items)
      .then(({ reactions }) => {
        const next: Record<number, { counts: Record<string, number>; myReaction: string | null }> = {}
        mediaReviews.forEach((review) => {
          const key = `${targetType}:${review.id}`
          const data = reactions[key]
          if (data) next[review.id] = { counts: data.counts || {}, myReaction: data.myReaction ?? null }
        })
        setReviewReactions(next)
      })
      .catch(() => setReviewReactions({}))
  }, [mediaReviews, type])

  useEffect(() => {
    const reviewMediaType = TYPE_TO_REVIEW_MEDIA[type]
    if (!user || !id || !reviewMediaType) return
    setSimilarUsersRatingsLoading(true)
    reviewsApi
      .getSimilarUsersRatings(reviewMediaType, parseInt(id, 10))
      .then(setSimilarUsersRatings)
      .catch(() => setSimilarUsersRatings([]))
      .finally(() => setSimilarUsersRatingsLoading(false))
  }, [user, id, type])

  useEffect(() => {
    if (galleryLightboxIndex == null && trailerLightboxIndex == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGalleryLightboxIndex(null)
        setTrailerLightboxIndex(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [galleryLightboxIndex, trailerLightboxIndex])

  const anyModalOpen =
    showModal ||
    showEditModal ||
    scheduleModalOpen ||
    showCollectionModal ||
    castModalEntry != null ||
    mediaEditOpen ||
    galleryLightboxIndex != null ||
    trailerLightboxIndex != null ||
    discussionCreateModalOpen
  useLockBodyScroll(anyModalOpen)

  useEffect(() => {
    if (!user || !id || !media) return
    const numId = parseInt(id, 10)
    favoritesApi
      .getAll()
      .then((data) => {
        const list =
          data.movies ??
          data.animeSeries ??
          data.games ??
          data.tvSeries ??
          data.manga ??
          data.books ??
          data.lightNovels ??
          data.cartoonSeries ??
          data.cartoonMovies ??
          data.animeMovies
        const mediaList = Array.isArray(list) ? list : []
        const inFav = mediaList.some(
          (item) =>
            item.movieId === numId ||
            item.animeSeriesId === numId ||
            item.gameId === numId ||
            item.tvSeriesId === numId ||
            item.mangaId === numId ||
            item.bookId === numId ||
            item.lightNovelId === numId ||
            item.cartoonSeriesId === numId ||
            item.cartoonMovieId === numId ||
            item.animeMovieId === numId
        )
        setIsFavorite(inFav)
        const casts = (data.casts ?? []) as { castId?: number; cast?: { id: number } }[]
        setFavoriteCastIds(new Set(casts.map((c) => c.cast?.id ?? c.castId ?? 0).filter(Boolean)))
        const persons = (data.persons ?? []) as { personId?: number; person?: { id: number } }[]
        setFavoritePersonIds(new Set(persons.map((p) => p.person?.id ?? p.personId ?? 0).filter(Boolean)))
      })
      .catch(() => {})
  }, [user, id, media, type])

  const toggleFavorite = async () => {
    if (!user || !id) return
    const numId = parseInt(id, 10)
    const title = media?.title ?? ''
    try {
      if (isFavorite) {
        await favoritesApi.remove(entity as 'movies', numId)
        setIsFavorite(false)
        useToastStore.getState().show({
          title: t('toast.removedFromFavorites'),
          description: t('toast.removedFromFavoritesDescription', { title: title || id }),
        })
      } else {
        await favoritesApi.add(entity as 'movies', numId)
        setIsFavorite(true)
        useToastStore.getState().show({
          title: t('toast.addedToFavorites'),
          description: t('toast.addedToFavoritesDescription', { title: title || id }),
        })
      }
    } catch {}
  }

  const handleAddToList = async (status: ListStatus, comment?: string, currentEpisode?: number) => {
    if (!media || !id) return
    await addToList(listType, parseInt(id, 10), status, comment, currentEpisode)
    const mediaTitle = getMediaTitle(media, locale) || media.title
    const statusLabel = getListStatusLabel(t, listType, status)
    useToastStore.getState().show({
      title: t('toast.addedToList'),
      description: `${mediaTitle} · ${statusLabel}`,
    })
  }

  const handleUpdateInList = async (data: Partial<ListItem>) => {
    if (!id || !media) return
    await updateInList(listType, parseInt(id, 10), data)
    const isRatingOnly = Object.keys(data).length === 1 && 'rating' in data
    const mediaTitle = getMediaTitle(media, locale) || media.title
    const parts: string[] = [mediaTitle]
    if (data.status != null) parts.push(getListStatusLabel(t, listType, data.status))
    if (data.rating != null) parts.push(t('toast.ratingLabel', { rating: normalizeRatingToPercent(data.rating) }))
    if (data.titleReaction != null) {
      const reviewStatus =
        TITLE_REACTION_TO_REVIEW_STATUS[data.titleReaction as keyof typeof TITLE_REACTION_TO_REVIEW_STATUS]
      const emojiEntry = REVIEW_STATUS_EMOJIS.find((e) => e.value === reviewStatus)
      const emoji = emojiEntry?.emoji ?? ''
      const label = reviewStatus ? t(`media.reviewStatus.${reviewStatus}`, { defaultValue: reviewStatus }) : ''
      if (emoji || label) parts.push(label ? `${emoji} ${label}` : emoji)
    }
    const description =
      parts.length > 1
        ? parts.join(' · ')
        : `${mediaTitle} · ${isRatingOnly ? t('toast.ratingUpdatedDescription') : t('toast.listUpdatedDescription')}`
    useToastStore.getState().show({
      title: isRatingOnly ? t('toast.ratingUpdated') : t('toast.listUpdated'),
      description,
    })
  }

  const handleRemoveFromList = async () => {
    if (!id) return
    await removeFromList(listType, parseInt(id, 10))
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-64 h-96 bg-[var(--theme-bg-alt)] rounded-xl flex-shrink-0 mx-auto lg:mx-0" />
          <div className="flex-1 w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0 space-y-4 min-w-0">
            <div className="h-8 bg-[var(--theme-bg-alt)] rounded w-1/2" />
            <div className="h-4 bg-[var(--theme-bg-alt)] rounded w-1/4" />
            <div className="h-32 bg-[var(--theme-bg-alt)] rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!media) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--theme-text-muted)]">{t('common.notFound')}</p>
      </div>
    )
  }

  const hasComments = COMMENT_ENTITY_TYPES.includes(type)
  const hasReviews = REVIEW_TYPES.includes(type)
  const reviewMediaType = TYPE_TO_REVIEW_MEDIA[type]
  const isMovieReviewType = type === 'movie'
  const reviewTargetType = reactionsApi.getReviewTargetType(type === 'light-novel' ? 'light-novels' : type)
  const mediaVideos = normalizeMediaVideos(media?.videos)
  const getImgNum = (img: unknown, key: 'width' | 'height') =>
    img && typeof img === 'object' && key in img && typeof (img as Record<string, unknown>)[key] === 'number'
      ? (img as Record<string, number>)[key]
      : undefined
  const previewImages = Array.isArray(media.images)
    ? media.images
        .slice(0, 4)
        .map((img) => {
          const url =
            img && typeof img === 'object' && 'url' in img && typeof (img as { url: unknown }).url === 'string'
              ? (img as { url: string }).url
              : null
          const caption =
            img &&
            typeof img === 'object' &&
            'caption' in img &&
            typeof (img as { caption: unknown }).caption === 'string'
              ? (img as { caption: string }).caption
              : ''
          const width = getImgNum(img, 'width')
          const height = getImgNum(img, 'height')
          return url ? { url, caption, width, height } : null
        })
        .filter((item): item is { url: string; caption: string; width?: number; height?: number } => item != null)
    : []
  const hasGallerySection = mediaVideos.length > 0 || previewImages.length > 0
  const sectionParam = searchParams.get('section')
  const availableSections: MediaDetailSection[] = [
    'info',
    ...(hasGallerySection ? ['gallery' as const] : []),
    ...(hasComments ? ['comments' as const] : []),
    'discussions',
    ...(hasReviews ? ['reviews' as const] : []),
  ]
  const activeSection: MediaDetailSection = availableSections.includes(sectionParam as MediaDetailSection)
    ? (sectionParam as MediaDetailSection)
    : 'info'
  const setActiveSection = (section: MediaDetailSection) => {
    const next = new URLSearchParams(searchParams)
    if (section === 'info') next.delete('section')
    else next.set('section', section)
    setSearchParams(next, { replace: true })
  }

  const detailTabs: { key: MediaDetailSection; label: string }[] = [
    { key: 'info', label: t('media.aboutTitle') },
    ...(hasGallerySection ? [{ key: 'gallery' as const, label: t('nav.media') }] : []),
    ...(hasComments ? [{ key: 'comments' as const, label: t('media.comments') }] : []),
    { key: 'discussions', label: t('media.discussions') },
    ...(hasReviews ? [{ key: 'reviews' as const, label: t('media.reviews') }] : []),
  ]
  const renderSimilarUsersAside = (className: string) => {
    if (!(activeSection === 'info' && REVIEW_TYPES.includes(type) && user)) return null

    return (
      <aside className={className}>
        <h2 className="text-lg font-semibold text-[var(--theme-text)]">{t('media.reviewsFromSimilarUsers')}</h2>
        {similarUsersRatingsLoading ? (
          <p className="text-[var(--theme-text-muted)] text-sm">{t('common.loading')}</p>
        ) : (
          (() => {
            const list = similarUsersRatings.length > 0 ? similarUsersRatings : MOCK_SIMILAR_USERS_RATINGS
            if (list.length === 0) {
              return <p className="text-[var(--theme-text-muted)] text-sm">{t('media.noRatingsFromSimilar')}</p>
            }
            return (
              <ul className="media-detail-mobile-scroll flex flex-row lg:flex-col gap-2 lg:gap-0 lg:space-y-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 w-full max-w-full">
                {list.map((item) => {
                  const nick = item.username ?? item.name ?? ''
                  const profilePath = item.username ? `/user/${encodeURIComponent(item.username)}` : null
                  const similarityPct = Math.round(item.similarityScore * 100)
                  const content = (
                    <>
                      <div className="flex justify-center lg:justify-start shrink-0">
                        {item.avatar ? (
                          <img
                            src={getMediaAssetUrl(item.avatar)}
                            alt=""
                            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border border-[var(--theme-border)]"
                          />
                        ) : (
                          <span className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[var(--theme-bg-alt)] flex items-center justify-center">
                            <IconPerson className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--theme-text-muted)]" />
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-[var(--theme-text)] truncate text-center lg:text-left text-xs lg:text-base max-w-full">
                        {nick || t('media.reviewAuthor')}
                      </span>
                      <span className="text-xs lg:text-sm text-[var(--theme-text-muted)] text-center lg:text-left">
                        <span className="lg:hidden">{t('media.similarity')}: </span>
                        {similarityPct}%
                      </span>
                      <span className="rating-badge rating-badge-inline-detail rating-badge-icon-offset inline-flex items-center gap-0.5 lg:gap-1 rounded-lg bg-[var(--theme-accent)] backdrop-blur-sm px-1 lg:px-1.5 py-0.5 w-fit text-[var(--theme-nav-active-text)]">
                        <RatingEmoji rating={item.rating} size={12} className="opacity-90 lg:w-[14px] lg:h-[14px]" />
                        <span className="rating-badge-value text-[10px] lg:text-xs font-medium">{item.rating}</span>
                      </span>
                    </>
                  )
                  const itemClassName =
                    'flex flex-col items-center lg:flex-row lg:items-center gap-1 lg:gap-2 p-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] lg:flex-nowrap shrink-0 w-24 max-w-[6rem] lg:w-auto lg:max-w-none lg:min-w-0 min-h-0 overflow-hidden' +
                    (profilePath ? ' hover:bg-[var(--theme-bg-alt)] transition-colors' : '')
                  return (
                    <li key={item.userId} className="shrink-0 lg:shrink">
                      {profilePath ? (
                        <Link to={profilePath} className={itemClassName}>
                          {content}
                        </Link>
                      ) : (
                        <div className={itemClassName}>{content}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )
          })()
        )}
      </aside>
    )
  }
  const handleReviewSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !id || !reviewMediaType) return

    const reviewClean = sanitizeRichHtml(reviewFormText || '')
    if (!isRichTextEmpty(reviewClean) && reviewClean.length > RICH_TEXT_MAX_REVIEW_HTML) {
      useToastStore.getState().show({ title: t('media.richTextTooLong') })
      return
    }
    const reviewPayload = isRichTextEmpty(reviewClean) ? undefined : reviewClean

    setReviewSaving(true)
    try {
      const entityId = parseInt(id, 10)
      const payload = {
        overallRating: reviewFormRating,
        review: reviewPayload,
        reviewStatus: reviewFormStatus || 'neutral',
      }

      if (myReview) {
        const updated = isMovieReviewType
          ? await reviewsApi.updateMovieReview(entityId, payload)
          : await reviewsApi.updateReview(reviewMediaType, entityId, payload)
        setMediaReviews((prev) => prev.map((review) => (review.id === updated.id ? updated : review)))
      } else {
        const created = isMovieReviewType
          ? await reviewsApi.createMovieReview(entityId, payload)
          : await reviewsApi.createReview(reviewMediaType, entityId, payload)
        setMediaReviews((prev) => [created, ...prev])
      }

      setReviewFormOpen(false)
    } catch {
    } finally {
      setReviewSaving(false)
    }
  }
  const handleReviewDelete = async () => {
    if (!myReview || !id || !reviewMediaType || !window.confirm(t('media.deleteReviewConfirm'))) return

    setReviewDeleting(true)
    try {
      const entityId = parseInt(id, 10)
      if (isMovieReviewType) await reviewsApi.deleteMovieReview(entityId)
      else await reviewsApi.deleteReview(reviewMediaType, entityId)
      setMediaReviews((prev) => prev.filter((review) => review.id !== myReview.id))
      setReviewFormOpen(true)
    } catch {
    } finally {
      setReviewDeleting(false)
    }
  }
  const handleReviewReaction = async (reviewId: number, reaction: ReviewReactionType) => {
    if (!reviewTargetType || !user) return

    setReactionLoading((prev) => ({ ...prev, [reviewId]: true }))
    try {
      const current = reviewReactions[reviewId]?.myReaction
      if (current === reaction) {
        const res = await reactionsApi.deleteReviewReaction(reviewTargetType, reviewId)
        setReviewReactions((prev) => ({ ...prev, [reviewId]: { counts: res.counts, myReaction: null } }))
      } else {
        const res = await reactionsApi.setReviewReaction(reviewTargetType, reviewId, reaction)
        setReviewReactions((prev) => ({ ...prev, [reviewId]: { counts: res.counts, myReaction: res.myReaction } }))
      }
    } catch {
    } finally {
      setReactionLoading((prev) => ({ ...prev, [reviewId]: false }))
    }
  }
  const heroImage = (media as { backdrop?: string }).backdrop
    ? getMediaAssetUrl((media as { backdrop: string }).backdrop)
    : media.poster
      ? getMediaAssetUrl(media.poster)
      : null
  const descriptionText = getMediaDescription(media, locale) || media.description
  const ratingDisplay = normalizeRatingToPercent(media.rating)
  const releaseSchedule = (
    media as {
      releaseSchedule?: { day?: string; time?: string; episodes?: { episodeNumber: number; releaseDate: string }[] }
    }
  ).releaseSchedule
  const hasReleaseSchedule = Boolean(
    releaseSchedule && (releaseSchedule.day || releaseSchedule.time || (releaseSchedule.episodes?.length ?? 0) > 0)
  )
  const secondaryTitle =
    type === 'anime'
      ? (media as AnimeSeriesType).titleRomaji || ''
      : type !== 'game' && locale === 'ru' && (media as { titleI18n?: Record<string, string> }).titleI18n?.en
        ? (media as { titleI18n: Record<string, string> }).titleI18n.en
        : ''
  const detailInfoRows: { label: string; value: React.ReactNode }[] = (() => {
    const rows: { label: string; value: React.ReactNode }[] = []
    if (ratingDisplay != null) {
      rows.push({
        label: t('media.rating'),
        value: (
          <span className="rating-badge-inline-detail inline-flex items-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-2 py-1 text-[var(--theme-nav-active-text)]">
            <RatingEmoji rating={ratingDisplay} size={18} className="opacity-90" />
            <span className="rating-badge-value text-sm font-medium">{ratingDisplay}</span>
            {media.ratingCount != null && (
              <span className="rating-badge-count text-xs opacity-80">({media.ratingCount.toLocaleString()})</span>
            )}
          </span>
        ),
      })
    }
    const mediaCountries = getMediaCountries(media)
    if (media.country || mediaCountries?.length) {
      const countryVal = mediaCountries?.length ? mediaCountries.join(', ') : media.country
      rows.push({ label: mediaCountries?.length ? t('media.countries') : t('media.country'), value: countryVal ?? '' })
    }
    const seasonNumber = getMediaSeasonNumber(media)
    if (seasonNumber != null) {
      rows.push({ label: t('media.season'), value: String(seasonNumber) })
    }
    const releaseDateText = (() => {
      if (!media.releaseDate) return null
      const isSeries = type === 'tv-series' || type === 'cartoon-series'
      const endDate = (media as { releaseEndDate?: string }).releaseEndDate
      const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
      const startStr = new Date(media.releaseDate).toLocaleDateString(undefined, opts)
      if (!isSeries) return startStr
      const endStr = endDate ? new Date(endDate).toLocaleDateString(undefined, opts) : t('media.releaseToPresent')
      return `${startStr} — ${endStr}`
    })()
    if (releaseDateText) {
      rows.push({ label: t('media.releaseDate'), value: releaseDateText })
    }
    const ageRating = media.ageRating ?? (media as { age_rating?: string }).age_rating
    if (ageRating) {
      rows.push({
        label: t('media.ageRating'),
        value: AGE_RATINGS.includes(ageRating as (typeof AGE_RATINGS)[number])
          ? t(`ageRating.${ageRating}` as const)
          : ageRating,
      })
    }
    if (media.status) {
      const badgeClasses = getMediaStatusBadgeClasses(media.status)
      rows.push({
        label: t('media.status'),
        value: (
          <span
            className={clsx(
              'media-status-badge inline-flex px-2.5 py-1 rounded-md font-medium text-xs uppercase tracking-wide',
              badgeClasses.bg,
              badgeClasses.text
            )}
            data-status={media.status}
          >
            {t(`mediaStatus.${media.status}` as const)}
          </span>
        ),
      })
    }
    const isOngoing = media.status === 'in_production'
    const episodesCount = getMediaEpisodesCount(media) ?? null
    const currentEpisode = getMediaCurrentEpisode(media) ?? null
    if (episodesCount != null || currentEpisode != null) {
      const current = currentEpisode != null ? String(currentEpisode) : '?'
      const total = !isOngoing && episodesCount != null ? String(episodesCount) : '?'
      rows.push({ label: t('media.series'), value: t('media.episodesOf', { current, total }) })
    }
    const episodeDuration = getMediaEpisodeDuration(media)
    if (episodeDuration != null) {
      rows.push({ label: t('media.minPerEpisode'), value: `${episodeDuration} ${t('media.minutes')}` })
    }
    const volumes = getMediaVolumes(media)
    const volumesCount = getMediaVolumesCount(media)
    const totalVolumes = volumes ?? (volumes == null ? (volumesCount ?? null) : null)
    const currentVolume = getMediaCurrentVolume(media) ?? null
    if (totalVolumes != null || currentVolume != null) {
      const volCurrent = currentVolume != null ? String(currentVolume) : '?'
      const volTotal = !isOngoing && totalVolumes != null ? String(totalVolumes) : '?'
      rows.push({ label: t('media.volumes'), value: t('media.episodesOf', { current: volCurrent, total: volTotal }) })
    }
    const chaptersFromVolumes = getMediaChaptersFromVolumes(media)
    const totalChapters = getMediaChaptersCount(media) ?? (chaptersFromVolumes > 0 ? chaptersFromVolumes : null)
    if (totalChapters != null) {
      rows.push({ label: t('media.chapters'), value: `${totalChapters}` })
    }
    const currentChapter = getMediaCurrentChapter(media)
    if (currentChapter != null) {
      rows.push({ label: t('media.currentChapter'), value: String(currentChapter) })
    }
    const pages = getMediaPages(media)
    if (pages != null) {
      rows.push({ label: t('media.pages'), value: `${pages}` })
    }
    const readingDuration = getMediaReadingDurationMinutes(media)
    if (readingDuration != null) {
      rows.push({ label: t('media.readingDuration'), value: `${readingDuration} ${t('media.minutes')}` })
    }
    return rows
  })()

  return (
    <div className="media-detail-page">
      {(media as Media & { isHidden?: boolean }).isHidden && (
        <div className="mb-6 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 flex items-center gap-2">
          <span className="font-medium">{t('media.hiddenBlockedTitle')}</span>
          <span className="text-sm opacity-90">{t('media.hiddenBlockedBody')}</span>
        </div>
      )}

      <MediaDetailHero
        media={media}
        type={type}
        locale={locale}
        heroImage={heroImage}
        secondaryTitle={secondaryTitle}
        detailInfoRows={detailInfoRows}
        hasReleaseSchedule={hasReleaseSchedule}
        user={user ?? null}
        isFavorite={isFavorite}
        listItemInList={listItemInList ?? null}
        listType={listType ?? ''}
        ratingHoverPreview={ratingHoverPreview}
        ratingTooltipVisible={ratingTooltipVisible}
        ratingTrackRef={ratingTrackRef}
        ratingTooltipTimeoutRef={ratingTooltipTimeoutRef}
        onOpenSchedule={() => setScheduleModalOpen(true)}
        onOpenAddToList={() => setShowModal(true)}
        onOpenEditList={() => setShowEditModal(true)}
        onUpdateListRating={(rating) => handleUpdateInList({ rating })}
        onRemoveFromList={() => window.confirm(t('media.removeFromListConfirm')) && handleRemoveFromList()}
        onToggleFavorite={toggleFavorite}
        renderSimilarUsersAside={renderSimilarUsersAside}
        setRatingHoverPreview={setRatingHoverPreview}
        setRatingTooltipVisible={setRatingTooltipVisible}
        setMediaEditOpen={setMediaEditOpen}
        t={t}
      >
        <MediaDetailTabs
          media={media}
          type={type}
          locale={locale}
          descriptionText={descriptionText ?? null}
          detailTabs={detailTabs}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          t={t}
          mediaVideos={mediaVideos}
          trailerLightboxIndex={trailerLightboxIndex}
          setTrailerLightboxIndex={setTrailerLightboxIndex}
          previewImages={previewImages.filter((p) => p != null) as { url: string; caption?: string | null }[]}
          galleryLightboxIndex={galleryLightboxIndex}
          setGalleryLightboxIndex={setGalleryLightboxIndex}
          hasComments={hasComments}
          entityId={parseInt(id!, 10)}
          infoContent={
            <>
              <MediaDetailCompaniesSection media={media} type={type} locale={locale} t={t} />
              <MediaDetailScheduleSection
                releaseSchedule={releaseSchedule}
                scheduleModalOpen={scheduleModalOpen}
                onCloseSchedule={() => setScheduleModalOpen(false)}
                t={t}
              />
              <MediaDetailCastFranchiseSection
                media={media}
                type={type}
                locale={locale}
                t={t}
                user={user ?? null}
                franchiseLinks={franchiseLinks}
                favoriteCastIds={favoriteCastIds}
                setFavoriteCastIds={setFavoriteCastIds}
                favoritePersonIds={favoritePersonIds}
                setFavoritePersonIds={setFavoritePersonIds}
                castModalEntry={castModalEntry}
                setCastModalEntry={setCastModalEntry}
                castScrollRef={castScrollRef}
                staffScrollRef={staffScrollRef}
                franchiseScrollRef={franchiseScrollRef}
                similarScrollRef={similarScrollRef}
              />
            </>
          }
          discussionsContent={
            id ? (
              <MediaDetailDiscussionsSection
                user={user}
                discussions={discussions}
                discussionsLoading={discussionsLoading}
                selectedDiscussion={selectedDiscussion}
                onSelectDiscussion={setSelectedDiscussion}
                onBackToList={() => setSelectedDiscussion(null)}
                onOpenCreateDiscussion={() => setDiscussionCreateModalOpen(true)}
                t={t}
              />
            ) : null
          }
          reviewsContent={
            REVIEW_TYPES.includes(type) ? (
              <MediaDetailReviewsSection
                user={user}
                myReview={myReview}
                otherReviews={otherReviews}
                reviewsLoading={reviewsLoading}
                reviewFormOpen={reviewFormOpen}
                reviewFormRating={reviewFormRating}
                reviewFormStatus={reviewFormStatus}
                reviewFormText={reviewFormText}
                reviewSaving={reviewSaving}
                reviewDeleting={reviewDeleting}
                reviewTargetType={reviewTargetType}
                reviewReactions={reviewReactions}
                reactionLoading={reactionLoading}
                onOpenForm={() => setReviewFormOpen(true)}
                onCloseForm={() => setReviewFormOpen(false)}
                onChangeRating={setReviewFormRating}
                onChangeStatus={setReviewFormStatus}
                onChangeText={setReviewFormText}
                onSubmit={handleReviewSubmit}
                onDelete={handleReviewDelete}
                onReaction={handleReviewReaction}
                t={t}
              />
            ) : null
          }
        />
      </MediaDetailHero>

      {renderSimilarUsersAside('flex lg:hidden flex-col gap-3 min-w-0 media-detail-similar-aside-mobile')}

      <AddToListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddToList}
        title={getMediaTitle(media, locale)}
        listType={listType}
        type={type}
        episodesCount={getMediaEpisodesCount(media)}
      />

      {listItemInList && media && (
        <EditInListModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          listItem={listItemInList}
          media={media}
          type={type}
          listName={t(`nav.${LIST_TYPE_NAV_KEY[listType]}`)}
          onSave={handleUpdateInList}
          onRemove={handleRemoveFromList}
        />
      )}

      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        mediaType={type}
        mediaId={parseInt(id!, 10)}
        mediaTitle={media?.title}
      />

      {discussionCreateModalOpen &&
        id &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={t('media.discussionCreate')}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDiscussionCreateModalOpen(false)}
              aria-hidden
            />
            <div className="relative w-full max-w-md rounded-2xl bg-[var(--theme-bg)] border border-[var(--theme-border)] shadow-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.discussionCreate')}</h2>
                <button
                  type="button"
                  onClick={() => setDiscussionCreateModalOpen(false)}
                  className="p-2 rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)]"
                  aria-label={t('common.close')}
                >
                  <IconCross className="w-5 h-5" />
                </button>
              </div>
              <form
                className="flex flex-col gap-3"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!discussionCreateTitle.trim() || discussionCreateSubmitting) return
                  setDiscussionCreateSubmitting(true)
                  try {
                    const entityId = parseInt(id, 10)
                    const created = await discussionsApi.create({
                      entityType: type,
                      entityId,
                      title: discussionCreateTitle.trim(),
                      description: discussionCreateDescription.trim() || undefined,
                    })
                    setDiscussions((prev) => [created, ...prev])
                    setDiscussionsTotal((prev) => prev + 1)
                    setDiscussionCreateTitle('')
                    setDiscussionCreateDescription('')
                    setDiscussionCreateModalOpen(false)
                    setSelectedDiscussion(created)
                    useToastStore.getState().show({ title: t('media.discussionCreated') })
                  } catch {
                    useToastStore.getState().show({ title: t('common.error') })
                  } finally {
                    setDiscussionCreateSubmitting(false)
                  }
                }}
              >
                <input
                  type="text"
                  value={discussionCreateTitle}
                  onChange={(e) => setDiscussionCreateTitle(e.target.value)}
                  placeholder={t('media.discussionTitlePlaceholder')}
                  className="input w-full"
                  maxLength={512}
                  required
                />
                <textarea
                  value={discussionCreateDescription}
                  onChange={(e) => setDiscussionCreateDescription(e.target.value)}
                  placeholder={t('media.discussionDescriptionPlaceholder')}
                  className="input w-full min-h-[80px] resize-y"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setDiscussionCreateModalOpen(false)} className="btn-secondary">
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={discussionCreateSubmitting || !discussionCreateTitle.trim()}
                    className="btn-primary"
                  >
                    {discussionCreateSubmitting ? t('common.loading') : t('media.discussionCreateSubmit')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <MediaEditModal
        open={mediaEditOpen}
        onClose={() => setMediaEditOpen(false)}
        media={media}
        mediaType={type}
        locale={locale}
        onSaved={(updated) => setMedia((prev) => (prev ? { ...prev, ...updated } : null))}
      />
    </div>
  )
}
