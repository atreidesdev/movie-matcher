import { reviewsApi } from '@/api/reviews'
import ReviewStars from '@/components/ReviewStars'
import ReviewStatusDisplay from '@/components/ReviewStatusDisplay'
import { RichTextContent } from '@/components/richText/RichTextContent'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { useAuthStore } from '@/store/authStore'
import type { Review, UserReviewsResponse } from '@/types'
import { getMediaPath } from '@/utils/mediaPaths'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useOutletContext, useParams } from 'react-router-dom'

type FlattenedReview = Review & {
  mediaType: MediaTypeForPath
  mediaId: number
  mediaTitle?: string
}

function flattenUserReviews(data: UserReviewsResponse): FlattenedReview[] {
  const out: FlattenedReview[] = []
  if (data.movies) {
    data.movies.forEach((r) => {
      const id = r.movie?.id
      if (id) out.push({ ...r, mediaType: 'movie', mediaId: id, mediaTitle: r.movie?.title })
    })
  }
  if (data.tvSeries) {
    data.tvSeries.forEach((r) => {
      const id = r.tvSeries?.id
      if (id) out.push({ ...r, mediaType: 'tv-series', mediaId: id, mediaTitle: r.tvSeries?.title })
    })
  }
  if (data.anime) {
    data.anime.forEach((r) => {
      const id = r.animeSeries?.id
      if (id) out.push({ ...r, mediaType: 'anime', mediaId: id, mediaTitle: r.animeSeries?.title })
    })
  }
  if (data.animeMovies) {
    data.animeMovies.forEach((r) => {
      const id = r.animeMovie?.id
      if (id) out.push({ ...r, mediaType: 'anime-movies', mediaId: id, mediaTitle: r.animeMovie?.title })
    })
  }
  if (data.games) {
    data.games.forEach((r) => {
      const id = r.game?.id
      if (id) out.push({ ...r, mediaType: 'game', mediaId: id, mediaTitle: r.game?.title })
    })
  }
  if (data.manga) {
    data.manga.forEach((r) => {
      const id = r.manga?.id
      if (id) out.push({ ...r, mediaType: 'manga', mediaId: id, mediaTitle: r.manga?.title })
    })
  }
  if (data.books) {
    data.books.forEach((r) => {
      const id = r.book?.id
      if (id) out.push({ ...r, mediaType: 'book', mediaId: id, mediaTitle: r.book?.title })
    })
  }
  if (data.lightNovels) {
    data.lightNovels.forEach((r) => {
      const id = r.lightNovel?.id
      if (id) out.push({ ...r, mediaType: 'light-novel', mediaId: id, mediaTitle: r.lightNovel?.title })
    })
  }
  return out
}

export default function UserReviewsPage() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const [reviewsData, setReviewsData] = useState<UserReviewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'not_found' | 'forbidden' | null>(null)

  const isOwnProfile = Boolean(username && user?.username && username.toLowerCase() === user.username.toLowerCase())

  useEffect(() => {
    if (!username) {
      setLoading(false)
      setError('not_found')
      return
    }
    setLoading(true)
    setError(null)
    reviewsApi
      .getUserReviewsByUsername(username)
      .then((r) => {
        if (r) setReviewsData(r)
      })
      .catch((err) => {
        if (err?.response?.status === 403) setError('forbidden')
        else if (err?.response?.status === 404) setError('not_found')
      })
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (error === 'not_found') {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-gray-600">{t('profile.userNotFound')}</p>
        <Link to="/" className="text-space_indigo-600 hover:underline mt-2 inline-block">
          {t('common.back')}
        </Link>
      </div>
    )
  }

  if (error === 'forbidden') {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-gray-600">{t('profile.profileHiddenOrFriends')}</p>
        {username && (
          <Link to={`/user/${username}`} className="text-space_indigo-600 hover:underline mt-2 inline-block">
            <ArrowLeft className="w-3.5 h-2.5 inline mr-1 shrink-0" />
            {t('profile.backToProfile')}
          </Link>
        )}
      </div>
    )
  }

  const list = reviewsData ? flattenUserReviews(reviewsData) : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 mt-6">
      {list.length === 0 ? (
        <p className="text-gray-500">{t('media.noReviews')}</p>
      ) : (
        <ul className="space-y-4">
          {list.map((rev) => (
            <li
              key={`${rev.mediaType}-${rev.mediaId}-${rev.id}`}
              className="profile-review-card relative rounded-xl border border-gray-300 bg-white shadow-sm p-4"
            >
              <div className="absolute top-3 right-3 shrink-0">
                <div className="rating-badge inline-flex items-center gap-1 rounded-lg bg-space_indigo-600 backdrop-blur-sm px-2 py-1">
                  {rev.reviewStatus && (
                    <ReviewStatusDisplay
                      reviewStatus={rev.reviewStatus}
                      size={24}
                      title={t(`media.reviewStatus.${rev.reviewStatus}`)}
                      className="text-base leading-none text-lavender-500"
                    />
                  )}
                  <span className="rating-badge-value text-sm font-medium text-lavender-500">{rev.overallRating}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap pr-24">
                <Link
                  to={getMediaPath(rev.mediaType, rev.mediaId, rev.mediaTitle)}
                  className="font-medium link-underline-animate profile-review-card-link"
                >
                  {rev.mediaTitle || `${rev.mediaType} #${rev.mediaId}`}
                </Link>
                <span className="profile-review-stars">
                  <ReviewStars rating={rev.overallRating} variant="darker" />
                </span>
              </div>
              {rev.review && (
                <div className="profile-review-card-text text-gray-700 text-sm pr-20">
                  <RichTextContent html={rev.review} />
                </div>
              )}
              <p className="profile-review-card-muted text-right text-sm text-gray-400 mt-2">
                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
