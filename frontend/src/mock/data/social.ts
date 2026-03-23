import type { User } from '@/types'

export interface MockNotificationItem {
  id: number
  createdAt: string
  type: 'new_follower' | 'friend_request' | 'friend_accepted' | 'media_update' | 'comment_reply'
  title: string
  body?: string
  readAt?: string
  relatedType?: 'user' | 'media' | 'comment' | 'movie' | 'anime' | 'tv-series' | 'game'
  relatedId?: number
  extra?: Record<string, unknown>
}

export interface MockConversationItem {
  id: number
  otherUser: User | null
  lastBody: string
  lastAt: string
  unread: number
  updatedAt: string
}

export interface MockMessageItem {
  id: number
  conversationId: number
  senderId: number
  body: string
  createdAt: string
  readAt: string | null
  sender?: User
}

export interface MockActivityItem {
  id: number
  createdAt: string
  userId: number
  user?: { id: number; username?: string; name?: string; avatar?: string }
  type: string
  mediaType: string
  mediaId: number
  mediaTitle: string
  mediaPoster?: string | null
  extra?: Record<string, unknown>
}

type SocialDeps = {
  past: (days: number) => string
  mockUsers: User[]
  mockCurrentUser: User
  mockMovies: { id: number; title: string; poster?: string }[]
  mockAnime: { id: number; title: string; poster?: string }[]
  mockGames: { id: number; title: string; poster?: string }[]
  mockCollections: { name: string }[]
}

export function createSocialMocks({
  past,
  mockUsers,
  mockCurrentUser,
  mockMovies,
  mockAnime,
  mockGames,
  mockCollections,
}: SocialDeps) {
  const mockFriendRequestsReceived = [
    { id: 1, fromUser: mockUsers[1], createdAt: past(2) },
    { id: 2, fromUser: mockUsers[2], createdAt: past(5) },
  ]
  const mockFriendRequestsSent = [{ id: 3, toUser: mockUsers[3], createdAt: past(1) }]
  const mockFriendRequests = {
    received: mockFriendRequestsReceived,
    sent: mockFriendRequestsSent,
  }

  const mockFriends: User[] = [mockUsers[2]]

  const mockNotifications: MockNotificationItem[] = [
    {
      id: 1,
      createdAt: past(0),
      type: 'friend_accepted',
      title: 'Bob принял заявку в друзья',
      body: 'Теперь вы друзья.',
      relatedType: 'user',
      relatedId: mockUsers[2].id,
      extra: { username: mockUsers[2].username },
    },
    {
      id: 2,
      createdAt: past(1),
      type: 'media_update',
      title: 'Обновление статуса: «Начало»',
      body: 'in_production',
      relatedType: 'movie',
      relatedId: mockMovies[0].id,
      extra: {
        reason: 'status_change',
        mediaType: 'movie',
        mediaId: mockMovies[0].id,
        mediaTitle: mockMovies[0].title,
        status: 'in_production',
      },
    },
    {
      id: 3,
      createdAt: past(2),
      type: 'media_update',
      title: 'Установлена дата выхода: «Интерстеллар»',
      body: '07.11.2014',
      relatedType: 'movie',
      relatedId: mockMovies[1].id,
      extra: {
        reason: 'release_date',
        mediaType: 'movie',
        mediaId: mockMovies[1].id,
        mediaTitle: mockMovies[1].title,
        date: '07.11.2014',
      },
    },
    {
      id: 4,
      createdAt: past(3),
      type: 'comment_reply',
      title: 'Ответ на комментарий',
      body: 'Согласен, фильм отличный!',
      readAt: past(1),
      relatedType: 'comment',
      relatedId: 2,
      extra: { preview: 'Согласен, фильм отличный!', mediaType: 'movie', mediaId: mockMovies[0].id },
    },
    {
      id: 5,
      createdAt: past(5),
      type: 'new_follower',
      title: 'Alice подписалась на вас',
      relatedType: 'user',
      relatedId: mockUsers[1].id,
      extra: { username: mockUsers[1].username },
    },
  ]

  const mockConversations: MockConversationItem[] = [
    {
      id: 1,
      otherUser: mockUsers[2],
      lastBody: 'Да, давай на выходных!',
      lastAt: past(0),
      unread: 0,
      updatedAt: past(0),
    },
  ]

  const mockMessages: MockMessageItem[] = [
    {
      id: 1,
      conversationId: 1,
      senderId: mockUsers[2].id,
      body: 'Привет! Смотрел «Начало»?',
      createdAt: past(2),
      readAt: past(1),
      sender: mockUsers[2],
    },
    {
      id: 2,
      conversationId: 1,
      senderId: mockCurrentUser.id,
      body: 'Да, отличный фильм! Пересматривал уже два раза.',
      createdAt: past(1.8),
      readAt: past(1.5),
      sender: mockCurrentUser,
    },
    {
      id: 3,
      conversationId: 1,
      senderId: mockUsers[2].id,
      body: 'А «Интерстеллар» сравнишь?',
      createdAt: past(1.5),
      readAt: past(1),
      sender: mockUsers[2],
    },
    {
      id: 4,
      conversationId: 1,
      senderId: mockCurrentUser.id,
      body: 'Оба от Нолана — оба шедевры. Интерстеллар сильнее по эмоциям.',
      createdAt: past(1.2),
      readAt: past(1),
      sender: mockCurrentUser,
    },
    {
      id: 5,
      conversationId: 1,
      senderId: mockUsers[2].id,
      body: 'Да, давай на выходных!',
      createdAt: past(0),
      readAt: null,
      sender: mockUsers[2],
    },
  ]

  const mockFollowers: User[] = [mockUsers[1]]
  const mockFollowing: User[] = [mockUsers[1], mockUsers[2]]

  const userView = {
    id: mockCurrentUser.id,
    username: mockCurrentUser.username,
    name: mockCurrentUser.name,
    avatar: mockCurrentUser.avatar,
  }

  const mockActivity: MockActivityItem[] = [
    {
      id: 1,
      createdAt: past(0),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'favorite_add',
      mediaType: 'movies',
      mediaId: mockMovies[0].id,
      mediaTitle: mockMovies[0].title,
      mediaPoster: mockMovies[0].poster,
    },
    {
      id: 2,
      createdAt: past(1),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'list_add',
      mediaType: 'movies',
      mediaId: mockMovies[2].id,
      mediaTitle: mockMovies[2].title,
      extra: { status: 'completed', rating: 90 },
      mediaPoster: mockMovies[2].poster,
    },
    {
      id: 3,
      createdAt: past(2),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'review',
      mediaType: 'movies',
      mediaId: mockMovies[4].id,
      mediaTitle: mockMovies[4].title,
      extra: { rating: 9 },
      mediaPoster: mockMovies[4].poster,
    },
    {
      id: 4,
      createdAt: past(3),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'collection_add',
      mediaType: 'movies',
      mediaId: mockMovies[1].id,
      mediaTitle: mockMovies[1].title,
      extra: { collectionName: mockCollections[0].name },
      mediaPoster: mockMovies[1].poster,
    },
    {
      id: 5,
      createdAt: past(5),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'list_update',
      mediaType: 'anime',
      mediaId: mockAnime[0].id,
      mediaTitle: mockAnime[0].title,
      extra: { fromStatus: 'planned', toStatus: 'watching', fromEpisode: 3, toEpisode: 8, fromRating: 7, toRating: 8, totalEpisodes: 25 },
      mediaPoster: mockAnime[0].poster,
    },
    {
      id: 6,
      createdAt: past(6),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'list_update',
      mediaType: 'games',
      mediaId: mockGames[0].id,
      mediaTitle: mockGames[0].title,
      extra: { fromStatus: 'watching', toStatus: 'completed', fromHoursPlayed: 10, toHoursPlayed: 15, rating: 9 },
      mediaPoster: mockGames[0].poster,
    },
    {
      id: 7,
      createdAt: past(7),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'favorite_add',
      mediaType: 'anime',
      mediaId: mockAnime[1].id,
      mediaTitle: mockAnime[1].title,
      mediaPoster: mockAnime[1].poster,
    },
    {
      id: 8,
      createdAt: past(7),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'favorite_add',
      mediaType: 'movies',
      mediaId: mockMovies[3].id,
      mediaTitle: mockMovies[3].title,
      mediaPoster: mockMovies[3].poster,
    },
    {
      id: 9,
      createdAt: past(14),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'list_add',
      mediaType: 'anime',
      mediaId: mockAnime[2].id,
      mediaTitle: mockAnime[2].title,
      extra: { status: 'completed', rating: 10 },
      mediaPoster: mockAnime[2].poster,
    },
    {
      id: 10,
      createdAt: past(30),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'review',
      mediaType: 'games',
      mediaId: mockGames[1].id,
      mediaTitle: mockGames[1].title,
      extra: { rating: 8 },
      mediaPoster: mockGames[1].poster,
    },
    {
      id: 11,
      createdAt: past(60),
      userId: mockCurrentUser.id,
      user: userView,
      type: 'collection_add',
      mediaType: 'movies',
      mediaId: mockMovies[5].id,
      mediaTitle: mockMovies[5].title,
      extra: { collectionName: mockCollections[0].name },
      mediaPoster: mockMovies[5].poster,
    },
  ]

  const mockActivityFeed: MockActivityItem[] = [
    {
      id: 10,
      createdAt: past(0),
      userId: mockUsers[1].id,
      user: { id: mockUsers[1].id, username: mockUsers[1].username, name: mockUsers[1].name, avatar: mockUsers[1].avatar },
      type: 'favorite_add',
      mediaType: 'movies',
      mediaId: mockMovies[4].id,
      mediaTitle: mockMovies[4].title,
      mediaPoster: mockMovies[4].poster,
    },
    {
      id: 11,
      createdAt: past(1),
      userId: mockUsers[2].id,
      user: { id: mockUsers[2].id, username: mockUsers[2].username, name: mockUsers[2].name, avatar: mockUsers[2].avatar },
      type: 'list_add',
      mediaType: 'games',
      mediaId: mockGames[0].id,
      mediaTitle: mockGames[0].title,
      extra: { status: 'watching', hoursPlayed: 12 },
      mediaPoster: mockGames[0].poster,
    },
    {
      id: 12,
      createdAt: past(2),
      userId: mockUsers[1].id,
      user: { id: mockUsers[1].id, username: mockUsers[1].username, name: mockUsers[1].name, avatar: mockUsers[1].avatar },
      type: 'review',
      mediaType: 'anime',
      mediaId: mockAnime[0].id,
      mediaTitle: mockAnime[0].title,
      extra: { rating: 8 },
      mediaPoster: mockAnime[0].poster,
    },
  ]

  return {
    mockFriendRequestsReceived,
    mockFriendRequestsSent,
    mockFriendRequests,
    mockFriends,
    mockNotifications,
    mockConversations,
    mockMessages,
    mockFollowers,
    mockFollowing,
    mockActivity,
    mockActivityFeed,
  }
}
