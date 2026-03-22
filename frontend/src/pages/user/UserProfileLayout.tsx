import { useEffect, useState } from 'react'
import { Outlet, useParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/users'
import { socialApi } from '@/api/social'
import { friendsApi } from '@/api/friends'
import type { PublicProfile } from '@/types'
import { UserProfileHeader } from '@/components/user/UserProfileHeader'

export interface UserProfileLayoutContext {
  profile: PublicProfile | null
  loading: boolean
  error: string | null
  isOwnProfile: boolean
}

export default function UserProfileLayout() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestReceived, setRequestReceived] = useState(false)
  const [incomingRequestId, setIncomingRequestId] = useState<number | null>(null)
  const [followLoading, setFollowLoading] = useState(false)
  const [addFriendLoading, setAddFriendLoading] = useState(false)
  const [acceptRequestLoading, setAcceptRequestLoading] = useState(false)

  const isOwnProfile = Boolean(
    username &&
      currentUser?.username &&
      username.toLowerCase() === currentUser.username.toLowerCase()
  )

  useEffect(() => {
    if (!username) {
      setLoading(false)
      setError('Username required')
      return
    }
    setLoading(true)
    setError(null)
    usersApi
      .getByUsername(username)
      .then(setProfile)
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => {
    if (!currentUser || !profile || isOwnProfile) return
    Promise.all([
      socialApi.getFollowing(),
      friendsApi.getFriends(),
      friendsApi.getRequests(),
    ])
      .then(([following, friends, requests]) => {
        setIsFollowing(following.some((u) => u.id === profile.id))
        setIsFriend(friends.some((u) => u.id === profile.id))
        const sentToProfile = requests.sent.find((r) => r.receiver?.id === profile.id)
        const receivedFromProfile = requests.received.find((r) => r.sender?.id === profile.id)
        setRequestSent(!!sentToProfile)
        setRequestReceived(!!receivedFromProfile)
        setIncomingRequestId(receivedFromProfile?.id ?? null)
      })
      .catch(() => {})
  }, [currentUser, profile?.id, isOwnProfile])

  const handleFollow = async () => {
    if (!profile || !currentUser || followLoading) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await socialApi.unfollow(profile.id)
        setIsFollowing(false)
      } else {
        await socialApi.follow(profile.id)
        setIsFollowing(true)
      }
    } catch {
    } finally {
      setFollowLoading(false)
    }
  }

  const handleAddFriend = async () => {
    if (!profile || !currentUser || addFriendLoading || isFriend || requestSent || requestReceived) return
    setAddFriendLoading(true)
    try {
      await friendsApi.sendRequest(profile.id)
      setRequestSent(true)
    } catch {
    } finally {
      setAddFriendLoading(false)
    }
  }

  const handleAcceptRequest = async () => {
    if (!incomingRequestId || acceptRequestLoading) return
    setAcceptRequestLoading(true)
    try {
      await friendsApi.acceptRequest(incomingRequestId)
      setIsFriend(true)
      setRequestReceived(false)
      setIncomingRequestId(null)
    } catch {
    } finally {
      setAcceptRequestLoading(false)
    }
  }

  if (!username) return null

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-theme-bg-alt rounded-xl p-4 sm:p-6 md:p-8 animate-pulse">
          <div className="h-24 w-24 rounded-full bg-theme-surface mb-6" />
          <div className="h-8 w-48 bg-theme-surface rounded mb-4" />
          <div className="h-4 w-32 bg-theme-surface rounded" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-theme-bg-alt rounded-xl p-4 sm:p-6 md:p-8 text-center">
          <p className="text-profile-muted">{error || 'User not found'}</p>
          <Link to="/" className="text-thistle-500 hover:underline mt-4 inline-block">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full profile-page">
      <UserProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        otherProfileActions={
          !isOwnProfile && currentUser
            ? {
                isFollowing,
                isFriend,
                requestSent,
                requestReceived,
                onFollow: handleFollow,
                onAddFriend: handleAddFriend,
                onAcceptRequest: handleAcceptRequest,
                followLoading,
                addFriendLoading,
                acceptRequestLoading,
              }
            : undefined
        }
      />
      <Outlet context={{ profile, loading: false, error: null, isOwnProfile } satisfies UserProfileLayoutContext} />
    </div>
  )
}
