import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import MediaListPage from '@/pages/media/MediaListPage'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import UserProfileLayout from '@/pages/user/UserProfileLayout'
import UserProfile from '@/pages/user/UserProfile'
import UserReviewsPage from '@/pages/user/UserReviewsPage'
import UserFavoritesPage from '@/pages/user/UserFavoritesPage'
import UserSettings from '@/pages/user/UserSettings'
import MediaDetails from '@/pages/media/MediaDetails'
import MediaCastPage from '@/pages/media/MediaCastPage'
import MediaReviewsPage from '@/pages/media/MediaReviewsPage'
import MediaSimilarPage from '@/pages/media/MediaSimilarPage'
import MediaFranchisePage from '@/pages/media/MediaFranchisePage'
import MediaGalleryPage from '@/pages/media/MediaGalleryPage'
import MediaTrailersPage from '@/pages/media/MediaTrailersPage'
import MediaStaffPage from '@/pages/media/MediaStaffPage'
import CharacterDetail from '@/pages/media/CharacterDetail'
import PersonDetail from '@/pages/entity/PersonDetail'
import StudioDetail from '@/pages/entity/StudioDetail'
import PublisherDetail from '@/pages/entity/PublisherDetail'
import DeveloperDetail from '@/pages/entity/DeveloperDetail'
import UserListsPage from '@/pages/user/UserListsPage'
import Search from '@/pages/Search'
import SearchPersons from '@/pages/SearchPersons'
import SearchCharacters from '@/pages/SearchCharacters'
import Recommendations from '@/pages/Recommendations'
import Calendar from '@/pages/Calendar'
import Bookmarks from '@/pages/Bookmarks'
import DevBlog from '@/pages/DevBlog'
import DevBlogPost from '@/pages/DevBlogPost'
import News from '@/pages/News'
import NewsDetail from '@/pages/NewsDetail'
import NewsEditor from '@/pages/NewsEditor'
import CommunitiesPage from '@/pages/communities/CommunitiesPage'
import CommunityFeedPage from '@/pages/communities/CommunityFeedPage'
import CommunityDetailPage from '@/pages/communities/CommunityDetailPage'
import CommunityCreatePage from '@/pages/communities/CommunityCreatePage'
import CommunityPostDetailPage from '@/pages/communities/CommunityPostDetailPage'
import CommunityPostCreatePage from '@/pages/communities/CommunityPostCreatePage'
import CommunityPostEditPage from '@/pages/communities/CommunityPostEditPage'
import CollectionDetail from '@/pages/collections/CollectionDetail'
import PublicCollectionsPage from '@/pages/collections/PublicCollectionsPage'
import PublicCollectionDetail from '@/pages/collections/PublicCollectionDetail'
import UserCollections from '@/pages/user/UserCollections'
import UserFriendsPage from '@/pages/user/UserFriendsPage'
import UserFollowersPage from '@/pages/user/UserFollowersPage'
import UserCommunitiesSubscriptionsPage from '@/pages/user/UserCommunitiesSubscriptionsPage'
import UserAchievementsPage from '@/pages/user/UserAchievementsPage'
import UsersPage from '@/pages/UsersPage'
import NotFound from '@/pages/NotFound'
import { useAuthStore } from '@/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'

const Messages = lazy(() => import('@/pages/Messages'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const Activity = lazy(() => import('@/pages/Activity'))
const Admin = lazy(() => import('@/pages/admin'))

/** Редирект /collections → /user/:username/collections (коллекции привязаны к пользователю). */
function RedirectToMyCollections() {
  const { user } = useAuthStore()
  if (user?.username) return <Navigate to={`/user/${user.username}/collections`} replace />
  return <Navigate to="/" replace />
}

/** Редирект /achievements → /user/:username/achievements (ачивки привязаны к пользователю). */
function RedirectToMyAchievements() {
  const { user } = useAuthStore()
  if (user?.username) return <Navigate to={`/user/${user.username}/achievements`} replace />
  return <Navigate to="/" replace />
}

/** Редирект /favorites → /user/:username/favorites (избранное по пользователю). */
function RedirectToMyFavorites() {
  const { user } = useAuthStore()
  if (user?.username) return <Navigate to={`/user/${user.username}/favorites`} replace />
  return <Navigate to="/" replace />
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-pulse text-gray-400">Загрузка…</div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="movies" element={<MediaListPage type="movie" />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="search" element={<Search />} />
          <Route path="search/persons" element={<SearchPersons />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="search/characters" element={<SearchCharacters />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="devblog" element={<DevBlog />} />
          <Route path="devblog/:id" element={<DevBlogPost />} />
          <Route path="news" element={<News />} />
          <Route
            path="news/new"
            element={
              <ProtectedRoute>
                <NewsEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="news/:id/edit"
            element={
              <ProtectedRoute>
                <NewsEditor />
              </ProtectedRoute>
            }
          />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route
            path="community-feed"
            element={
              <ProtectedRoute>
                <CommunityFeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="communities/new"
            element={
              <ProtectedRoute>
                <CommunityCreatePage />
              </ProtectedRoute>
            }
          />
          <Route path="communities/:idOrSlug" element={<CommunityDetailPage />} />
          <Route
            path="communities/:idOrSlug/posts/new"
            element={
              <ProtectedRoute>
                <CommunityPostCreatePage />
              </ProtectedRoute>
            }
          />
          <Route path="communities/:idOrSlug/posts/:postId" element={<CommunityPostDetailPage />} />
          <Route
            path="communities/:idOrSlug/posts/:postId/edit"
            element={
              <ProtectedRoute>
                <CommunityPostEditPage />
              </ProtectedRoute>
            }
          />
          <Route path="movies/:id" element={<MediaDetails type="movie" />} />
          <Route path="movies/:id/reviews" element={<MediaReviewsPage type="movie" />} />
          <Route path="movies/:id/gallery" element={<MediaGalleryPage type="movie" />} />
          <Route path="movies/:id/trailers" element={<MediaTrailersPage type="movie" />} />
          <Route path="movies/:id/cast" element={<MediaCastPage type="movie" />} />
          <Route path="movies/:id/staff" element={<MediaStaffPage type="movie" />} />
          <Route path="movies/:id/similar" element={<MediaSimilarPage type="movie" />} />
          <Route path="movies/:id/franchise" element={<MediaFranchisePage type="movie" />} />
          <Route path="anime" element={<MediaListPage type="anime" />} />
          <Route path="anime/:id" element={<MediaDetails type="anime" />} />
          <Route path="anime/:id/reviews" element={<MediaReviewsPage type="anime" />} />
          <Route path="anime/:id/gallery" element={<MediaGalleryPage type="anime" />} />
          <Route path="anime/:id/trailers" element={<MediaTrailersPage type="anime" />} />
          <Route path="anime/:id/cast" element={<MediaCastPage type="anime" />} />
          <Route path="anime/:id/staff" element={<MediaStaffPage type="anime" />} />
          <Route path="anime/:id/similar" element={<MediaSimilarPage type="anime" />} />
          <Route path="anime/:id/franchise" element={<MediaFranchisePage type="anime" />} />
          <Route path="games" element={<MediaListPage type="game" />} />
          <Route path="games/:id" element={<MediaDetails type="game" />} />
          <Route path="games/:id/reviews" element={<MediaReviewsPage type="game" />} />
          <Route path="games/:id/gallery" element={<MediaGalleryPage type="game" />} />
          <Route path="games/:id/trailers" element={<MediaTrailersPage type="game" />} />
          <Route path="games/:id/cast" element={<MediaCastPage type="game" />} />
          <Route path="games/:id/staff" element={<MediaStaffPage type="game" />} />
          <Route path="games/:id/similar" element={<MediaSimilarPage type="game" />} />
          <Route path="games/:id/franchise" element={<MediaFranchisePage type="game" />} />
          <Route path="tv-series" element={<MediaListPage type="tv-series" />} />
          <Route path="tv-series/:id" element={<MediaDetails type="tv-series" />} />
          <Route path="tv-series/:id/gallery" element={<MediaGalleryPage type="tv-series" />} />
          <Route path="tv-series/:id/trailers" element={<MediaTrailersPage type="tv-series" />} />
          <Route path="tv-series/:id/cast" element={<MediaCastPage type="tv-series" />} />
          <Route path="tv-series/:id/reviews" element={<MediaReviewsPage type="tv-series" />} />
          <Route path="tv-series/:id/staff" element={<MediaStaffPage type="tv-series" />} />
          <Route path="tv-series/:id/similar" element={<MediaSimilarPage type="tv-series" />} />
          <Route path="tv-series/:id/franchise" element={<MediaFranchisePage type="tv-series" />} />
          <Route path="manga" element={<MediaListPage type="manga" />} />
          <Route path="manga/:id" element={<MediaDetails type="manga" />} />
          <Route path="manga/:id/reviews" element={<MediaReviewsPage type="manga" />} />
          <Route path="manga/:id/gallery" element={<MediaGalleryPage type="manga" />} />
          <Route path="manga/:id/trailers" element={<MediaTrailersPage type="manga" />} />
          <Route path="manga/:id/cast" element={<MediaCastPage type="manga" />} />
          <Route path="manga/:id/staff" element={<MediaStaffPage type="manga" />} />
          <Route path="manga/:id/similar" element={<MediaSimilarPage type="manga" />} />
          <Route path="manga/:id/franchise" element={<MediaFranchisePage type="manga" />} />
          <Route path="books" element={<MediaListPage type="book" />} />
          <Route path="books/:id" element={<MediaDetails type="book" />} />
          <Route path="books/:id/reviews" element={<MediaReviewsPage type="book" />} />
          <Route path="books/:id/gallery" element={<MediaGalleryPage type="book" />} />
          <Route path="books/:id/trailers" element={<MediaTrailersPage type="book" />} />
          <Route path="books/:id/cast" element={<MediaCastPage type="book" />} />
          <Route path="books/:id/staff" element={<MediaStaffPage type="book" />} />
          <Route path="books/:id/similar" element={<MediaSimilarPage type="book" />} />
          <Route path="books/:id/franchise" element={<MediaFranchisePage type="book" />} />
          <Route path="light-novels" element={<MediaListPage type="light-novel" />} />
          <Route path="light-novels/:id" element={<MediaDetails type="light-novel" />} />
          <Route path="light-novels/:id/reviews" element={<MediaReviewsPage type="light-novel" />} />
          <Route path="light-novels/:id/gallery" element={<MediaGalleryPage type="light-novel" />} />
          <Route path="light-novels/:id/trailers" element={<MediaTrailersPage type="light-novel" />} />
          <Route path="light-novels/:id/cast" element={<MediaCastPage type="light-novel" />} />
          <Route path="light-novels/:id/staff" element={<MediaStaffPage type="light-novel" />} />
          <Route path="light-novels/:id/similar" element={<MediaSimilarPage type="light-novel" />} />
          <Route path="light-novels/:id/franchise" element={<MediaFranchisePage type="light-novel" />} />
          <Route path="cartoon-series" element={<MediaListPage type="cartoon-series" />} />
          <Route path="cartoon-series/:id" element={<MediaDetails type="cartoon-series" />} />
          <Route path="cartoon-series/:id/reviews" element={<MediaReviewsPage type="cartoon-series" />} />
          <Route path="cartoon-series/:id/gallery" element={<MediaGalleryPage type="cartoon-series" />} />
          <Route path="cartoon-series/:id/trailers" element={<MediaTrailersPage type="cartoon-series" />} />
          <Route path="cartoon-series/:id/cast" element={<MediaCastPage type="cartoon-series" />} />
          <Route path="cartoon-series/:id/staff" element={<MediaStaffPage type="cartoon-series" />} />
          <Route path="cartoon-series/:id/similar" element={<MediaSimilarPage type="cartoon-series" />} />
          <Route path="cartoon-series/:id/franchise" element={<MediaFranchisePage type="cartoon-series" />} />
          <Route path="cartoon-movies" element={<MediaListPage type="cartoon-movies" />} />
          <Route path="cartoon-movies/:id" element={<MediaDetails type="cartoon-movies" />} />
          <Route path="cartoon-movies/:id/reviews" element={<MediaReviewsPage type="cartoon-movies" />} />
          <Route path="cartoon-movies/:id/gallery" element={<MediaGalleryPage type="cartoon-movies" />} />
          <Route path="cartoon-movies/:id/trailers" element={<MediaTrailersPage type="cartoon-movies" />} />
          <Route path="cartoon-movies/:id/cast" element={<MediaCastPage type="cartoon-movies" />} />
          <Route path="cartoon-movies/:id/staff" element={<MediaStaffPage type="cartoon-movies" />} />
          <Route path="cartoon-movies/:id/similar" element={<MediaSimilarPage type="cartoon-movies" />} />
          <Route path="anime-movies" element={<MediaListPage type="anime-movies" />} />
          <Route path="anime-movies/:id" element={<MediaDetails type="anime-movies" />} />
          <Route path="anime-movies/:id/reviews" element={<MediaReviewsPage type="anime-movies" />} />
          <Route path="anime-movies/:id/gallery" element={<MediaGalleryPage type="anime-movies" />} />
          <Route path="anime-movies/:id/trailers" element={<MediaTrailersPage type="anime-movies" />} />
          <Route path="anime-movies/:id/cast" element={<MediaCastPage type="anime-movies" />} />
          <Route path="anime-movies/:id/staff" element={<MediaStaffPage type="anime-movies" />} />
          <Route path="anime-movies/:id/similar" element={<MediaSimilarPage type="anime-movies" />} />
          <Route path="anime-movies/:id/franchise" element={<MediaFranchisePage type="anime-movies" />} />
          <Route path="characters/:id" element={<CharacterDetail />} />
          <Route path="persons/:id" element={<PersonDetail />} />
          <Route path="studios/:id" element={<StudioDetail />} />
          <Route path="publishers/:id" element={<PublisherDetail />} />
          <Route path="developers/:id" element={<DeveloperDetail />} />
          <Route path="user/:username" element={<UserProfileLayout />}>
            <Route index element={<UserProfile />} />
            <Route path="reviews" element={<UserReviewsPage />} />
            <Route path="favorites" element={<UserFavoritesPage />} />
            <Route path="friends" element={<UserFriendsPage />} />
            <Route path="followers" element={<UserFollowersPage />} />
            <Route path="community-subscriptions" element={<UserCommunitiesSubscriptionsPage />} />
            <Route path="collections" element={<UserCollections />} />
            <Route path="lists" element={<UserListsPage />} />
            <Route path="achievements" element={<UserAchievementsPage />} />
          </Route>
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />
          <Route path="user/:username/settings" element={<Navigate to="/settings" replace />} />
          <Route
            path="recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookmarks"
            element={
              <ProtectedRoute>
                <Bookmarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="favorites"
            element={
              <ProtectedRoute>
                <RedirectToMyFavorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="activity"
            element={
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            }
          />
          <Route path="achievements" element={<RedirectToMyAchievements />} />
          <Route path="public-collections" element={<PublicCollectionsPage />} />
          <Route path="public-collections/:id" element={<PublicCollectionDetail />} />
          <Route
            path="collections"
            element={
              <ProtectedRoute>
                <RedirectToMyCollections />
              </ProtectedRoute>
            }
          />
          <Route
            path="collections/:id"
            element={
              <ProtectedRoute>
                <CollectionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
