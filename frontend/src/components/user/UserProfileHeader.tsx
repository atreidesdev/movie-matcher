import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import {
  IconPerson,
  IconSettings,
  IconActivity,
  IconListUnordered,
  IconFavorite,
  IconCollection,
  IconHandshake,
  IconPeopleCommunity,
  IconCommunity,
  IconReviews,
  IconAchievement,
  IconFriendAdd,
} from '@/components/icons'
import type { PublicProfile } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'

export interface OtherProfileActions {
  isFollowing: boolean
  isFriend: boolean
  requestSent: boolean
  requestReceived: boolean
  onFollow: () => void
  onAddFriend: () => void
  onAcceptRequest: () => void
  followLoading: boolean
  addFriendLoading: boolean
  acceptRequestLoading: boolean
}

export interface UserProfileHeaderProps {
  profile: PublicProfile
  isOwnProfile: boolean
  otherProfileActions?: OtherProfileActions
}

export function UserProfileHeader({ profile, isOwnProfile, otherProfileActions }: UserProfileHeaderProps) {
  const { t } = useTranslation()
  const location = useLocation()

  const username = profile.username
  const pathname = location.pathname

  const basePath = username ? `/user/${username}` : ''

  const isActivePath = (path: string) => pathname === path
  const startsWithPath = (path: string) => pathname.startsWith(path)

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-72 sm:h-56 md:h-64 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_55%),linear-gradient(90deg,_var(--theme-primary)_,_var(--theme-accent,rgba(255,255,255,0.2)))]" />
      <div className="absolute inset-x-0 top-0 h-72 sm:h-56 md:h-64 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_55%)] pointer-events-none" />

      <div className="relative w-full md:pt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 px-4 pt-6 sm:pt-[35px]">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-theme-bg-alt rounded-3xl shadow-xl shadow-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10">
            {profile.avatar ? (
              <img
                src={getMediaAssetUrl(profile.avatar)}
                alt={profile.name || profile.username || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <IconPerson className="w-14 h-14 text-profile-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1 text-white">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {profile.name || profile.username || 'Anonymous'}
                </h1>
                {profile.username && (
                  <p className="mt-0.5 text-sm sm:text-base text-white/80">@{profile.username}</p>
                )}
                {profile.createdAt && (
                  <p className="mt-1 text-xs sm:text-[13px] text-white/70">
                    {t('profile.memberSince', {
                      date: new Date(profile.createdAt).toLocaleDateString(),
                    })}
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                  <Link
                    to="/activity?mode=me"
                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                    title={t('activity.myActivity')}
                    aria-label={t('activity.myActivity')}
                  >
                    <IconActivity size={20} className="shrink-0" />
                  </Link>
                  <Link
                    to="/settings"
                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                    title={t('user.settings')}
                    aria-label={t('user.settings')}
                  >
                    <IconSettings className="w-5 h-5 shrink-0" />
                  </Link>
                </div>
              )}
              {!isOwnProfile && otherProfileActions && (
                <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={
                      otherProfileActions.requestReceived
                        ? otherProfileActions.onAcceptRequest
                        : otherProfileActions.onAddFriend
                    }
                    disabled={
                      otherProfileActions.addFriendLoading ||
                      otherProfileActions.acceptRequestLoading ||
                      otherProfileActions.isFriend ||
                      otherProfileActions.requestSent
                    }
                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                    title={
                      otherProfileActions.requestSent
                        ? t('friends.requestSent')
                        : otherProfileActions.isFriend
                          ? t('friends.inFriends')
                          : otherProfileActions.requestReceived
                            ? t('friends.acceptRequest')
                            : t('friends.addFriend')
                    }
                    aria-label={
                      otherProfileActions.requestReceived
                        ? t('friends.acceptRequest')
                        : t('friends.addFriend')
                    }
                  >
                    {otherProfileActions.requestReceived ? (
                      <Check size={20} className="shrink-0" />
                    ) : (
                      <IconFriendAdd size={20} className="shrink-0" />
                    )}
                    <span className="hidden sm:inline text-sm font-medium">
                      {otherProfileActions.requestSent
                        ? t('friends.requestSent')
                        : otherProfileActions.isFriend
                          ? t('friends.inFriends')
                          : otherProfileActions.requestReceived
                            ? t('friends.acceptRequest')
                            : t('friends.addFriend')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={otherProfileActions.onFollow}
                    disabled={otherProfileActions.followLoading}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                      otherProfileActions.isFollowing
                        ? 'bg-white/20 hover:bg-white/15 text-white'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                    title={
                      otherProfileActions.isFollowing ? t('social.unfollow') : t('social.follow')
                    }
                    aria-label={otherProfileActions.isFollowing ? t('social.unfollow') : t('social.follow')}
                  >
                    <IconPeopleCommunity size={20} className="shrink-0" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {otherProfileActions.isFollowing ? t('social.unfollow') : t('social.follow')}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {username && (
          <nav className="mt-5 w-full border-b border-white/10 overflow-x-auto text-[10px] sm:text-sm bg-white/5 backdrop-blur-sm rounded-t-md [scrollbar-width:none] [&::-webkit-scrollbar]:[display:none]">
            <div className="flex justify-center gap-1 sm:gap-6 px-2 sm:px-4 w-full max-w-5xl mx-auto min-w-0">
              <ProfileTabLink
                to={basePath}
                active={isActivePath(basePath)}
                icon={<IconPerson size={18} />}
                title={t('profile.profile')}
              >
                {t('profile.profile')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/lists`}
                active={startsWithPath(`${basePath}/lists`)}
                icon={<IconListUnordered size={18} />}
                title={t('profile.lists')}
              >
                {t('profile.lists')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/favorites`}
                active={startsWithPath(`${basePath}/favorites`)}
                icon={<IconFavorite size={18} />}
                title={t('profile.favorites')}
              >
                {t('profile.favorites')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/collections`}
                active={startsWithPath(`${basePath}/collections`)}
                icon={<IconCollection size={18} />}
                title={t('nav.collections')}
              >
                {t('nav.collections')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/friends`}
                active={startsWithPath(`${basePath}/friends`)}
                icon={<IconHandshake size={18} />}
                title={t('profile.friends')}
              >
                {t('profile.friends')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/followers`}
                active={startsWithPath(`${basePath}/followers`)}
                icon={<IconPeopleCommunity size={18} />}
                title={t('profile.followers')}
              >
                {t('profile.followers')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/community-subscriptions`}
                active={startsWithPath(`${basePath}/community-subscriptions`)}
                icon={<IconCommunity size={18} />}
                title={t('profile.communitySubscriptions')}
              >
                {t('profile.communitySubscriptions')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/reviews`}
                active={startsWithPath(`${basePath}/reviews`)}
                icon={<IconReviews size={18} />}
                title={t('profile.reviews')}
              >
                {t('profile.reviews')}
              </ProfileTabLink>
              <ProfileTabLink
                to={`${basePath}/achievements`}
                active={startsWithPath(`${basePath}/achievements`)}
                icon={<IconAchievement size={18} />}
                title={t('nav.achievements')}
              >
                {t('nav.achievements')}
              </ProfileTabLink>
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}

interface ProfileTabLinkProps {
  to: string
  active: boolean
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function ProfileTabLink({ to, active, icon, title, children }: ProfileTabLinkProps) {
  return (
    <Link
      to={to}
      title={title}
      aria-label={title}
      className={`profile-tab-link ${
        active ? 'profile-tab-link--active' : ''
      } flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-1 md:px-2 text-center text-[10px] md:text-sm whitespace-nowrap`}
    >
      <span className="shrink-0 [&>svg]:shrink-0 md:hidden" aria-hidden>
        {icon}
      </span>
      <span className="hidden md:inline">{children}</span>
    </Link>
  )
}
