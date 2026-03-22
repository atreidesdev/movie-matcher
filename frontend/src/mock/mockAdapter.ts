/**
 * Axios-адаптер: в dev при VITE_USE_MOCK=true подменяет ответы API мок-данными.
 */

import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import type {
  Movie,
  Genre,
  Theme,
  Studio,
  Person,
  ListStatus,
  DevBlogPost,
  NewsListItem,
  NewsDetail,
  NewsComment,
  NewsAttachment,
} from '@/types'
import { isRecord } from '@/utils/typeGuards'
import {
  mockGenres,
  mockThemes,
  mockStudios,
  mockPlatforms,
  mockSites,
  mockDevelopers,
  mockPublishers,
  mockMovies,
  mockAnime,
  mockGames,
  mockTVSeries,
  mockManga,
  mockBooks,
  mockLightNovels,
  mockCartoonSeries,
  mockCartoonMovies,
  mockAnimeMovies,
  mockCurrentUser,
  mockSessions,
  getMockProfileByUsername,
  mockListItems,
  mockListItemsAlice,
  mockListItemsBob,
  mockFavorites,
  mockFavoritesBob,
  mockFavoritesAlice,
  mockCollections,
  mockRecommendations,
  mockReviews,
  mockComments,
  mockFriendRequests,
  mockFriends,
  mockNotifications,
  mockFollowers,
  mockFollowing,
  mockConversations,
  mockMessages,
  mockActivity,
  mockActivityFeed,
  mockCast,
  mockCastByMovieId,
  mockCharacters,
  getMockCharacterAppearances,
  mockPersons,
  mockPersonWorksByPersonId,
  paginate,
  getMockFranchiseLinksByMedia,
  getMockFranchiseLinksByFranchiseId,
  mockFranchises,
  filterAndSortMedia,
  getListStatusByMediaId,
  getFiltersGenresAndThemesForMediaType,
  getMockAchievements,
  mockReports,
  mockCommentBannedUsers,
  mockReportTemplatesSeed,
  past,
  mockUsers,
} from '@/mock/mockData'

// Мутабельные копии для мока (жалобы, баны, шаблоны ответов)
let mockReportsState = [...mockReports]
let mockCommentBannedState = [...mockCommentBannedUsers]

function findCommentById(comments: typeof mockComments, id: number): (typeof mockComments)[0] | undefined {
  for (const c of comments) {
    if (c.id === id) return c
    if (c.replies?.length) {
      const found = findCommentById(c.replies, id)
      if (found) return found
    }
  }
  return undefined
}

type CommentEmojiReactionState = { counts: Record<string, number>; myReaction: string }
const COMMENT_EMOJI_TYPES = ['like', 'heart', 'laugh', 'sad', 'angry', 'wow'] as const
function getDefaultCommentEmojiReactions(commentId: number): CommentEmojiReactionState {
  const seed = commentId % 7
  const counts: Record<string, number> = {}
  COMMENT_EMOJI_TYPES.forEach((emoji, i) => {
    const n = (seed + i) % 4
    if (n > 0) counts[emoji] = n
  })
  return { counts, myReaction: commentId % 3 === 0 ? 'like' : '' }
}
const mockCommentEmojiReactions: Record<number, CommentEmojiReactionState> = {}
function getCommentEmojiReaction(commentId: number): CommentEmojiReactionState {
  if (!mockCommentEmojiReactions[commentId]) {
    mockCommentEmojiReactions[commentId] = getDefaultCommentEmojiReactions(commentId)
  }
  return mockCommentEmojiReactions[commentId]
}

let mockReportTemplates = [...mockReportTemplatesSeed]

// ——— Discussions mock (in-memory) ———
type MockDiscussion = {
  id: number
  entityType: string
  entityId: number
  title: string
  description: string
  userId: number
  user?: { id: number; name?: string; username?: string; avatar?: string }
  createdAt: string
  updatedAt: string
  commentsCount: number
}
const _discussionsNow = new Date().toISOString()
const mockDiscussionsSeed: MockDiscussion[] = [
  {
    id: 1,
    entityType: 'tv_series',
    entityId: 1,
    title: 'Начало',
    description: 'Обсуждение для начала.',
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      name: mockCurrentUser.name,
      username: mockCurrentUser.username,
      avatar: mockCurrentUser.avatar,
    },
    createdAt: _discussionsNow,
    updatedAt: _discussionsNow,
    commentsCount: 0,
  },
]
let mockDiscussionsState: MockDiscussion[] = [...mockDiscussionsSeed]

// ——— Communities mock (in-memory) ———
type MockCommunity = {
  id: number
  name: string
  slug: string
  description: string
  avatar?: string
  cover?: string
  creatorId: number
}
type MockCommunityPost = {
  id: number
  communityId: number
  authorId: number
  title: string
  body: string
  createdAt: string
}
type MockCommunitySubscription = { userId: number; communityId: number }
function communitySlugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'community'
}
const _communitiesNow = new Date().toISOString()
const mockCommunitiesSeed: MockCommunity[] = [
  { id: 1, name: 'Кинолюбители', slug: 'kinolyubiteli', description: 'Сообщество любителей кино', creatorId: mockCurrentUser.id },
  { id: 2, name: 'Аниме-клуб', slug: 'anime-klub', description: 'Обсуждаем аниме и мангу', creatorId: mockUsers[1]?.id ?? 2 },
  { id: 3, name: 'Игроманы', slug: 'igromany', description: 'Новости и обзоры игр', creatorId: mockUsers[2]?.id ?? 3 },
]
const mockCommunityPostsSeed: MockCommunityPost[] = [
  { id: 1, communityId: 1, authorId: mockCurrentUser.id, title: 'Добро пожаловать!', body: 'Первая запись в сообществе Кинолюбители.', createdAt: _communitiesNow },
  { id: 2, communityId: 1, authorId: mockCurrentUser.id, title: 'Топ фильмов недели', body: 'Рекомендую посмотреть...', createdAt: past(1) },
  { id: 3, communityId: 2, authorId: mockUsers[1]?.id ?? 2, title: 'Новый сезон аниме', body: 'Обсуждаем премьеры весны.', createdAt: past(2) },
  { id: 4, communityId: 3, authorId: mockUsers[2]?.id ?? 3, title: 'Игра года', body: 'Мои впечатления от релиза.', createdAt: past(3) },
]
const mockCommunitySubsSeed: MockCommunitySubscription[] = [
  { userId: mockCurrentUser.id, communityId: 1 },
  { userId: mockCurrentUser.id, communityId: 2 },
]
let mockCommunitiesState = [...mockCommunitiesSeed]
let mockCommunityPostsState = [...mockCommunityPostsSeed]
let mockCommunitySubsState = [...mockCommunitySubsSeed]
let mockDiscussionNextId = 2
function getMockDiscussionsList(entityType: string, entityId: number): MockDiscussion[] {
  const norm = (s: string) => (s || '').replace(/-/g, '_')
  const forThisMedia = mockDiscussionsState.filter(
    (d) => norm(d.entityType) === norm(entityType) && d.entityId === entityId
  )
  if (forThisMedia.length > 0) return forThisMedia
  // В моке для любого медиа показываем обсуждение «Начало» (id 1), подменяя entityType/entityId для отображения
  const startDiscussion = mockDiscussionsState.find((d) => d.id === 1)
  if (startDiscussion)
    return [{ ...startDiscussion, entityType: norm(entityType) || startDiscussion.entityType, entityId }]
  return []
}
function getMockDiscussionById(id: number): MockDiscussion | undefined {
  return mockDiscussionsState.find((d) => d.id === id)
}
function mockDiscussionCreate(
  entityType: string,
  entityId: number,
  title: string,
  description: string
): MockDiscussion {
  const now = new Date().toISOString()
  const normType = (entityType || '').replace(/-/g, '_')
  const newId = mockDiscussionNextId++
  const d: MockDiscussion = {
    id: newId,
    entityType: normType,
    entityId,
    title,
    description,
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      name: mockCurrentUser.name,
      username: mockCurrentUser.username,
      avatar: mockCurrentUser.avatar,
    },
    createdAt: now,
    updatedAt: now,
    commentsCount: 0,
  }
  mockDiscussionsState = [...mockDiscussionsState, d]
  return d
}

// DevBlog mock (in-memory)
const mockDevBlogPostsSeed: DevBlogPost[] = [
  {
    id: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: mockCurrentUser.id,
    author: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    title: 'Welcome to the Dev Blog',
    body: 'This is the first post. Here we will share updates from the development team.',
    slug: 'welcome',
  },
]
let mockDevBlogPostsState: DevBlogPost[] = [...mockDevBlogPostsSeed]
function getMockDevBlogPosts(): DevBlogPost[] {
  return mockDevBlogPostsState
}
function mockDevBlogCreate(title: string, body: string, slug?: string): DevBlogPost {
  const id = Math.max(0, ...mockDevBlogPostsState.map((p) => p.id)) + 1
  const now = new Date().toISOString()
  const post: DevBlogPost = {
    id,
    createdAt: now,
    updatedAt: now,
    authorId: mockCurrentUser.id,
    author: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    title,
    body,
    slug: slug || undefined,
  }
  mockDevBlogPostsState = [...mockDevBlogPostsState, post]
  return post
}
function mockDevBlogUpdate(id: number, title: string, body: string, slug?: string): DevBlogPost | null {
  const idx = mockDevBlogPostsState.findIndex((p) => p.id === id)
  if (idx === -1) return null
  const prev = mockDevBlogPostsState[idx]
  const updated: DevBlogPost = {
    ...prev,
    title,
    body,
    slug: slug || undefined,
    updatedAt: new Date().toISOString(),
  }
  mockDevBlogPostsState = mockDevBlogPostsState.slice()
  mockDevBlogPostsState[idx] = updated
  return updated
}
function mockDevBlogDelete(id: number): void {
  mockDevBlogPostsState = mockDevBlogPostsState.filter((p) => p.id !== id)
}

// ——— News mock (in-memory) ———
const newsAuthor = {
  id: mockCurrentUser.id,
  username: mockCurrentUser.username,
  name: mockCurrentUser.name,
  avatar: mockCurrentUser.avatar,
}
let mockNewsState: NewsDetail[] = [
  {
    id: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: mockCurrentUser.id,
    author: newsAuthor,
    title: 'Welcome to News',
    slug: 'welcome-news',
    previewImage: '',
    previewTitle: 'First news',
    body: '<p>This is the first news post. Rich text with <strong>bold</strong> and <a href="https://example.com">links</a>.</p>',
    tags: 'updates, welcome',
    attachments: [],
    commentCount: 0,
  },
  {
    id: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    authorId: mockCurrentUser.id,
    author: newsAuthor,
    title: 'Events and Updates',
    slug: 'events-updates',
    previewImage: '',
    previewTitle: "What's new",
    body: '<p>Check out our upcoming events and platform updates.</p>',
    tags: 'events, updates',
    attachments: [],
    commentCount: 0,
  },
]
function parseTagsFromString(s: string | undefined): string[] {
  if (!s?.trim()) return []
  return s
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

function mockNewsHasAnyTag(item: NewsDetail, filterTags: string[]): boolean {
  if (filterTags.length === 0) return true
  const newsTags = parseTagsFromString(item.tags)
  const set = new Set(filterTags.map((t) => t.toLowerCase()))
  return newsTags.some((t) => set.has(t))
}

function getMockNewsList(filterTags?: string[]): NewsListItem[] {
  let list = mockNewsState
  if (filterTags?.length) {
    list = list.filter((n) => mockNewsHasAnyTag(n, filterTags))
  }
  return list.map((n) => ({
    id: n.id,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    authorId: n.authorId,
    author: n.author,
    title: n.title,
    slug: n.slug,
    previewImage: n.previewImage,
    previewTitle: n.previewTitle,
    tags: n.tags,
    commentCount: n.commentCount,
  }))
}
function getMockNewsById(id: number): NewsDetail | null {
  return mockNewsState.find((n) => n.id === id) ?? null
}
function mockNewsCommentCreate(_newsId: number, text: string, _parentId?: number): NewsComment {
  return {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    text,
    depth: 0,
    plusCount: 0,
    minusCount: 0,
    userId: mockCurrentUser.id,
    user: newsAuthor,
    parentId: _parentId,
    repliesCount: 0,
    replies: [],
  }
}
function mockNewsCreate(body: {
  title: string
  body?: string
  previewImage?: string
  previewTitle?: string
  tags?: string
  attachments?: { type: string; path: string }[]
}): NewsDetail {
  const id = Math.max(0, ...mockNewsState.map((n) => n.id)) + 1
  const now = new Date().toISOString()
  const item: NewsDetail = {
    id,
    createdAt: now,
    updatedAt: now,
    authorId: mockCurrentUser.id,
    author: newsAuthor,
    title: body.title ?? '',
    slug: '',
    previewImage: body.previewImage ?? '',
    previewTitle: body.previewTitle ?? '',
    body: body.body ?? '<p></p>',
    tags: body.tags ?? '',
    attachments: (body.attachments ?? []) as NewsAttachment[],
    commentCount: 0,
  }
  mockNewsState = [...mockNewsState, item]
  return item
}
function mockNewsUpdate(
  id: number,
  body: {
    title: string
    body?: string
    previewImage?: string
    previewTitle?: string
    tags?: string
    attachments?: NewsAttachment[]
  }
): NewsDetail | null {
  const idx = mockNewsState.findIndex((n) => n.id === id)
  if (idx === -1) return null
  const prev = mockNewsState[idx]
  const updated: NewsDetail = {
    ...prev,
    title: body.title ?? prev.title,
    body: body.body ?? prev.body,
    previewImage: body.previewImage ?? prev.previewImage,
    previewTitle: body.previewTitle ?? prev.previewTitle,
    tags: body.tags ?? prev.tags,
    attachments: (body.attachments ?? prev.attachments) as NewsAttachment[],
    updatedAt: new Date().toISOString(),
  }
  mockNewsState = mockNewsState.slice()
  mockNewsState[idx] = updated
  return updated
}

function parseUrl(url: string): { path: string; query: Record<string, string> } {
  const [path, search] = (url || '').split('?')
  const query: Record<string, string> = {}
  if (search) {
    search.split('&').forEach((s) => {
      const [k, v] = s.split('=')
      if (k && v) query[decodeURIComponent(k)] = decodeURIComponent(v)
    })
  }
  return { path: path || '', query }
}

const MOCK_LOG = true // лог при возврате данных из мока (видно в консоли браузера)

function mockResponse<T>(data: T, status = 200, label?: string): Promise<AxiosResponse<T>> {
  if (MOCK_LOG && typeof console !== 'undefined') {
    let msg = label ?? ''
    if (!msg && Array.isArray(data)) msg = `[${data.length} items]`
    else if (!msg && typeof data === 'object' && data != null && 'data' in data) {
      const arr = (data as { data?: unknown[] }).data
      msg = Array.isArray(arr) ? `[${arr.length} items]` : '[object]'
    } else if (!msg) msg = String(data).slice(0, 50)
    console.info('[Mock] ← данные из мока:', msg)
    console.log('[Mock] данные (объект):', data)
  }
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  })
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function asRecordOrEmpty(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {}
}

function getListParams(query: Record<string, string>, config: InternalAxiosRequestConfig) {
  const params = asRecord(config.params)
  const rawGenres = query.genreIds ?? params?.genreIds
  const genreIds = Array.isArray(rawGenres)
    ? rawGenres.map(String)
    : String(rawGenres ?? '')
        .split(',')
        .filter(Boolean)
  const rawThemes = query.themeIds ?? params?.themeIds
  const themeIds = Array.isArray(rawThemes)
    ? rawThemes.map(String)
    : String(rawThemes ?? '')
        .split(',')
        .filter(Boolean)
  const rawCountries = query.countries ?? params?.countries
  const countries = Array.isArray(rawCountries)
    ? rawCountries.map(String)
    : String(rawCountries ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
  const rawStudioIds = query.studioIds ?? params?.studioIds
  const studioIds = Array.isArray(rawStudioIds)
    ? rawStudioIds.map(String)
    : String(rawStudioIds ?? '')
        .split(',')
        .filter(Boolean)
  const rawPublisherIds = query.publisherIds ?? params?.publisherIds
  const publisherIds = Array.isArray(rawPublisherIds)
    ? rawPublisherIds.map(String)
    : String(rawPublisherIds ?? '')
        .split(',')
        .filter(Boolean)
  const rawDeveloperIds = query.developerIds ?? params?.developerIds
  const developerIds = Array.isArray(rawDeveloperIds)
    ? rawDeveloperIds.map(String)
    : String(rawDeveloperIds ?? '')
        .split(',')
        .filter(Boolean)
  const yearFrom = Number(query.yearFrom ?? params?.yearFrom ?? 0) || undefined
  const yearTo = Number(query.yearTo ?? params?.yearTo ?? 0) || undefined
  const rawSeasons = query.seasons ?? params?.seasons
  const seasons = Array.isArray(rawSeasons)
    ? rawSeasons
    : typeof rawSeasons === 'string'
      ? rawSeasons
          .split(',')
          .map((s) => s.trim())
          .filter((s) => ['winter', 'spring', 'summer', 'autumn'].includes(s))
      : []
  const sortBy = (query.sortBy ?? (params?.sortBy as string)) || 'created_at'
  const order = (query.order ?? (params?.order as string)) || 'DESC'
  const page = Number(query.page ?? params?.page ?? 1) || 1
  const pageSize = Number(query.pageSize ?? params?.pageSize ?? 24) || 24
  return {
    genreIds,
    themeIds,
    countries,
    studioIds,
    publisherIds,
    developerIds,
    yearFrom,
    yearTo,
    seasons,
    sortBy,
    order,
    page,
    pageSize,
  }
}

/** Извлекает путь и query после /api/v1/ из baseURL+url (axios может передавать уже объединённый url). */
function getApiPathAndQuery(config: InternalAxiosRequestConfig): { path: string; query: Record<string, string> } {
  const base = (config.baseURL || '').replace(/\/$/, '')
  const url = (config.url || '').replace(/^\//, '')
  let pathWithQuery = base + (url ? '/' + url : '')
  // Если url уже содержал полный путь (axios объединил), убираем дубликат base
  if (url.startsWith('api/v1') || url.includes('/api/v1/')) {
    pathWithQuery = url
  }
  const afterApi = pathWithQuery.replace(/^.*\/api\/v1\/?/, '')
  return parseUrl(afterApi)
}

export function createMockAdapter(
  defaultAdapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>
): (config: InternalAxiosRequestConfig) => Promise<AxiosResponse> {
  return (config: InternalAxiosRequestConfig) => {
    if (MOCK_LOG && typeof console !== 'undefined') {
      console.info('[Mock] адаптер вызван, url:', config.url, 'baseURL:', config.baseURL)
    }
    const method = (config.method || 'get').toLowerCase()
    const { path, query } = getApiPathAndQuery(config)
    const p = path.startsWith('/') ? path.slice(1) : path

    if (MOCK_LOG && typeof console !== 'undefined' && console.info) {
      console.info('[Mock] запрос:', method.toUpperCase(), p, Object.keys(query).length ? query : '')
    }

    // ——— Discussions (обсуждения на тему медиа) ———
    const mockDiscussionUser = {
      id: mockCurrentUser.id,
      name: mockCurrentUser.name,
      username: mockCurrentUser.username,
      avatar: mockCurrentUser.avatar,
    }
    const now = new Date().toISOString()
    if (p === 'discussions' && method === 'get' && !p.includes('/comments')) {
      const entityType = (query.entityType as string) || ''
      const entityId = Number(query.entityId) || 0
      const list = getMockDiscussionsList(entityType, entityId)
      return mockResponse({ discussions: list, total: list.length }, 200, 'discussions list')
    }
    if (p.match(/^discussions\/\d+$/) && method === 'get' && !p.includes('/comments')) {
      const id = Number(p.split('/')[1])
      const d = getMockDiscussionById(id)
      if (!d) return mockResponse(null as never, 404)
      return mockResponse(d, 200, 'discussion')
    }
    if (p === 'discussions' && method === 'post') {
      const body = config.data as { entityType: string; entityId: number; title: string; description?: string }
      const created = mockDiscussionCreate(
        body?.entityType ?? '',
        body?.entityId ?? 0,
        body?.title ?? '',
        body?.description ?? ''
      )
      return mockResponse(created, 201, 'discussion create')
    }
    if (p.match(/^discussions\/\d+\/comments$/) && method === 'get') {
      return mockResponse({ comments: [], total: 0 }, 200, 'discussion comments')
    }
    if (p.match(/^discussions\/\d+\/comments\/\d+\/replies$/) && method === 'get') {
      return mockResponse({ replies: [], total: 0 }, 200, 'discussion replies')
    }
    if (p.match(/^discussions\/\d+\/comments$/) && method === 'post') {
      const body = config.data as { text: string; parentId?: number }
      const created = {
        id: 1,
        text: body?.text ?? '',
        userId: mockCurrentUser.id,
        user: mockDiscussionUser,
        parentId: body?.parentId,
        depth: 0,
        createdAt: new Date().toISOString(),
        plusCount: 0,
        minusCount: 0,
        replies: [],
        repliesCount: 0,
      }
      return mockResponse(created, 201, 'discussion comment')
    }
    if (p.match(/^discussions\/\d+\/comments\/\d+$/) && (method === 'put' || method === 'delete')) {
      return method === 'put'
        ? mockResponse(
            { id: 1, text: '', userId: 0, depth: 0, createdAt: now, plusCount: 0, minusCount: 0, repliesCount: 0 },
            200
          )
        : mockResponse(undefined, 204)
    }

    // ——— Communities ———
    const communityAuthor = (uid: number) => {
      const u = mockUsers.find((x) => x.id === uid) ?? mockCurrentUser
      return { id: u.id, name: u.name, username: u.username }
    }
    const toCommunityListItem = (c: MockCommunity, subCount: number, isSub: boolean) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      avatar: c.avatar,
      cover: c.cover,
      creatorId: c.creatorId,
      creatorName: communityAuthor(c.creatorId).name,
      creatorUsername: communityAuthor(c.creatorId).username,
      subscribers: subCount,
      isSubscribed: isSub,
    })
    const getSubCount = (cid: number) => mockCommunitySubsState.filter((s) => s.communityId === cid).length
    const isUserSubscribed = (uid: number, cid: number) =>
      mockCommunitySubsState.some((s) => s.userId === uid && s.communityId === cid)
    const resolveCommunity = (idOrSlug: string): MockCommunity | null => {
      const byId = mockCommunitiesState.find((c) => String(c.id) === idOrSlug)
      if (byId) return byId
      return mockCommunitiesState.find((c) => c.slug === idOrSlug) ?? null
    }
    const toPostItem = (p: MockCommunityPost) => {
      const comm = mockCommunitiesState.find((c) => c.id === p.communityId)
      const author = communityAuthor(p.authorId)
      return {
        id: p.id,
        communityId: p.communityId,
        communityName: comm?.name,
        communitySlug: comm?.slug,
        authorId: p.authorId,
        authorName: author.name,
        authorUsername: author.username,
        title: p.title,
        body: p.body,
        createdAt: p.createdAt,
      }
    }

    if (p === 'communities' && method === 'get') {
      const list = mockCommunitiesState.map((c) =>
        toCommunityListItem(c, getSubCount(c.id), isUserSubscribed(mockCurrentUser.id, c.id))
      )
      return mockResponse({ communities: list }, 200, 'communities list')
    }
    if (p === 'communities' && method === 'post') {
      const body = config.data as { name: string; description?: string; avatar?: string; cover?: string }
      const name = (body?.name ?? 'Community').trim() || 'Community'
      const slug = communitySlugify(name)
      const existingSlug = mockCommunitiesState.some((c) => c.slug === slug)
      const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug
      const id = Math.max(0, ...mockCommunitiesState.map((c) => c.id)) + 1
      const comm: MockCommunity = {
        id,
        name,
        slug: finalSlug,
        description: (body?.description ?? '').trim(),
        avatar: body?.avatar?.trim(),
        cover: body?.cover?.trim(),
        creatorId: mockCurrentUser.id,
      }
      mockCommunitiesState = [...mockCommunitiesState, comm]
      const subCount = 0
      return mockResponse(toCommunityListItem(comm, subCount, false), 201, 'community create')
    }
    if (p === 'communities/feed' && method === 'get') {
      const subbedIds = mockCommunitySubsState
        .filter((s) => s.userId === mockCurrentUser.id)
        .map((s) => s.communityId)
      const posts = mockCommunityPostsState
        .filter((p) => subbedIds.includes(p.communityId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50)
        .map(toPostItem)
      return mockResponse({ posts }, 200, 'community feed')
    }
    if (p.match(/^communities\/[^/]+$/) && !p.includes('/posts') && !p.includes('/subscribe') && !p.includes('/unsubscribe') && method === 'get') {
      const idOrSlug = p.replace('communities/', '')
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      return mockResponse(
        toCommunityListItem(comm, getSubCount(comm.id), isUserSubscribed(mockCurrentUser.id, comm.id)),
        200,
        'community detail'
      )
    }
    if (p.match(/^communities\/[^/]+$/) && !p.includes('/posts') && method === 'put') {
      const idOrSlug = p.replace('communities/', '')
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      if (comm.creatorId !== mockCurrentUser.id) return mockResponse(null as never, 403)
      const body = config.data as { name?: string; description?: string; avatar?: string; cover?: string }
      const idx = mockCommunitiesState.findIndex((c) => c.id === comm.id)
      if (idx === -1) return mockResponse(null as never, 404)
      const updated: MockCommunity = {
        ...comm,
        name: body?.name?.trim() ?? comm.name,
        description: body?.description !== undefined ? body.description.trim() : comm.description,
        avatar: body?.avatar !== undefined ? body.avatar.trim() : comm.avatar,
        cover: body?.cover !== undefined ? body.cover.trim() : comm.cover,
      }
      mockCommunitiesState = mockCommunitiesState.slice()
      mockCommunitiesState[idx] = updated
      return mockResponse(
        toCommunityListItem(updated, getSubCount(updated.id), isUserSubscribed(mockCurrentUser.id, updated.id)),
        200,
        'community update'
      )
    }
    if (p.match(/^communities\/[^/]+$/) && !p.includes('/posts') && method === 'delete') {
      const idOrSlug = p.replace('communities/', '')
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      if (comm.creatorId !== mockCurrentUser.id) return mockResponse(null as never, 403)
      mockCommunitiesState = mockCommunitiesState.filter((c) => c.id !== comm.id)
      mockCommunityPostsState = mockCommunityPostsState.filter((p) => p.communityId !== comm.id)
      mockCommunitySubsState = mockCommunitySubsState.filter((s) => s.communityId !== comm.id)
      return mockResponse(undefined as never, 204)
    }
    if (p.match(/^communities\/[^/]+\/subscribe$/) && method === 'post') {
      const idOrSlug = p.replace('communities/', '').replace('/subscribe', '')
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      if (!mockCommunitySubsState.some((s) => s.userId === mockCurrentUser.id && s.communityId === comm.id)) {
        mockCommunitySubsState = [...mockCommunitySubsState, { userId: mockCurrentUser.id, communityId: comm.id }]
      }
      return mockResponse({ subscribed: true }, 200, 'community subscribe')
    }
    if (p.match(/^communities\/[^/]+\/unsubscribe$/) && method === 'post') {
      const idOrSlug = p.replace('communities/', '').replace('/unsubscribe', '')
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      mockCommunitySubsState = mockCommunitySubsState.filter(
        (s) => !(s.userId === mockCurrentUser.id && s.communityId === comm.id)
      )
      return mockResponse({ subscribed: false }, 200, 'community unsubscribe')
    }
    if (p.match(/^communities\/[^/]+\/posts$/) && method === 'get') {
      const idOrSlug = p.replace('communities/', '').replace('/posts', '')
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      const posts = mockCommunityPostsState
        .filter((p) => p.communityId === comm.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50)
        .map(toPostItem)
      return mockResponse({ posts }, 200, 'community posts')
    }
    if (p.match(/^communities\/[^/]+\/posts$/) && method === 'post') {
      const idOrSlug = p.replace('communities/', '').replace('/posts', '')
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      if (comm.creatorId !== mockCurrentUser.id) return mockResponse(null as never, 403)
      const body = config.data as { title: string; body: string }
      const id = Math.max(0, ...mockCommunityPostsState.map((x) => x.id)) + 1
      const post: MockCommunityPost = {
        id,
        communityId: comm.id,
        authorId: mockCurrentUser.id,
        title: (body?.title ?? '').trim() || 'Untitled',
        body: body?.body ?? '',
        createdAt: new Date().toISOString(),
      }
      mockCommunityPostsState = [...mockCommunityPostsState, post]
      return mockResponse(toPostItem(post), 201, 'community post create')
    }
    if (p.match(/^communities\/[^/]+\/posts\/\d+$/) && method === 'get') {
      const parts = p.split('/')
      const idOrSlug = parts[1]
      const postId = Number(parts[3])
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      const post = mockCommunityPostsState.find((x) => x.id === postId && x.communityId === comm.id)
      if (!post) return mockResponse(null as never, 404)
      return mockResponse(toPostItem(post), 200, 'community post')
    }
    if (p.match(/^communities\/[^/]+\/posts\/\d+$/) && method === 'put') {
      const parts = p.split('/')
      const idOrSlug = parts[1]
      const postId = Number(parts[3])
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      const post = mockCommunityPostsState.find((x) => x.id === postId && x.communityId === comm.id)
      if (!post) return mockResponse(null as never, 404)
      if (post.authorId !== mockCurrentUser.id && comm.creatorId !== mockCurrentUser.id)
        return mockResponse(null as never, 403)
      const body = config.data as { title: string; body: string }
      const idx = mockCommunityPostsState.findIndex((x) => x.id === postId && x.communityId === comm.id)
      const updated: MockCommunityPost = {
        ...post,
        title: (body?.title ?? post.title).trim() || post.title,
        body: body?.body ?? post.body,
      }
      mockCommunityPostsState = mockCommunityPostsState.slice()
      mockCommunityPostsState[idx] = updated
      return mockResponse(toPostItem(updated), 200, 'community post update')
    }
    if (p.match(/^communities\/[^/]+\/posts\/\d+$/) && method === 'delete') {
      const parts = p.split('/')
      const idOrSlug = parts[1]
      const postId = Number(parts[3])
      const comm = resolveCommunity(idOrSlug)
      if (!comm) return mockResponse(null as never, 404)
      const post = mockCommunityPostsState.find((x) => x.id === postId && x.communityId === comm.id)
      if (!post) return mockResponse(null as never, 404)
      if (post.authorId !== mockCurrentUser.id && comm.creatorId !== mockCurrentUser.id)
        return mockResponse(null as never, 403)
      mockCommunityPostsState = mockCommunityPostsState.filter((x) => !(x.id === postId && x.communityId === comm.id))
      return mockResponse(undefined as never, 204)
    }
    if (p.match(/^users\/username\/[^/]+\/community-subscriptions$/) && method === 'get') {
      const username = decodeURIComponent(
        p.replace(/^users\/username\//, '').replace(/\/community-subscriptions$/, '') || ''
      ).toLowerCase()
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' } as never, 404)
      const targetUser = mockUsers.find((u) => (u.username || '').toLowerCase() === username)
      const targetId = targetUser?.id ?? profile.id
      const subbedIds = mockCommunitySubsState
        .filter((s) => s.userId === targetId)
        .map((s) => s.communityId)
      const list = mockCommunitiesState
        .filter((c) => subbedIds.includes(c.id))
        .map((c) => toCommunityListItem(c, getSubCount(c.id), isUserSubscribed(mockCurrentUser.id, c.id)))
      return mockResponse({ communities: list }, 200, 'user community subscriptions')
    }

    // ——— Auth ———
    if (p === 'auth/me' && method === 'get') {
      return mockResponse({ user: mockCurrentUser }, 200, 'auth/me')
    }
    if (p === 'achievements' && method === 'get') {
      return mockResponse({ achievements: getMockAchievements() }, 200, 'achievements')
    }
    // ——— DevBlog ———
    if (p === 'devblog' && method === 'get') {
      return mockResponse({ posts: getMockDevBlogPosts() }, 200, 'devblog list')
    }
    if (p.match(/^devblog\/\d+$/) && method === 'get') {
      const id = Number(p.split('/')[1])
      const post = getMockDevBlogPosts().find((x) => x.id === id)
      if (!post) return mockResponse(null as never, 404)
      return mockResponse(post, 200, 'devblog post')
    }
    if (p === 'admin/devblog' && method === 'post') {
      const body = config.data as { title: string; body: string; slug?: string }
      const newPost = mockDevBlogCreate(body?.title ?? '', body?.body ?? '', body?.slug)
      return mockResponse(newPost, 201, 'devblog create')
    }
    if (p.match(/^admin\/devblog\/\d+$/) && method === 'put') {
      const id = Number(p.split('/')[3])
      const body = config.data as { title: string; body: string; slug?: string }
      const updated = mockDevBlogUpdate(id, body?.title ?? '', body?.body ?? '', body?.slug)
      if (!updated) return mockResponse(null as never, 404)
      return mockResponse(updated, 200, 'devblog update')
    }
    if (p.match(/^admin\/devblog\/\d+$/) && method === 'delete') {
      const id = Number(p.split('/')[3])
      mockDevBlogDelete(id)
      return mockResponse({ message: 'Post deleted' }, 200)
    }
    // ——— News ———
    if (p === 'news' && method === 'get') {
      const tagsParam = query.tags as string | undefined
      const filterTags = tagsParam ? parseTagsFromString(tagsParam) : undefined
      return mockResponse({ news: getMockNewsList(filterTags) }, 200, 'news list')
    }
    if (p === 'news/tags' && method === 'get') {
      const seen = new Set<string>()
      mockNewsState.forEach((n) => parseTagsFromString(n.tags).forEach((t) => seen.add(t)))
      const tags = Array.from(seen).sort()
      return mockResponse({ tags }, 200, 'news tags')
    }
    if (p.match(/^news\/\d+$/) && !p.includes('/comments') && !p.includes('/edit') && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = getMockNewsById(id)
      if (!item) return mockResponse(null as never, 404)
      return mockResponse(item, 200, 'news detail')
    }
    if (p.match(/^news\/\d+\/comments$/) && method === 'get') {
      return mockResponse({ comments: [] }, 200, 'news comments')
    }
    if (p.match(/^news\/\d+\/comments$/) && method === 'post') {
      const body = config.data as { text: string; parentId?: number }
      const created = mockNewsCommentCreate(Number(p.split('/')[1]), body?.text ?? '', body?.parentId)
      return mockResponse(created, 201, 'news comment')
    }
    if (p.match(/^news\/\d+\/comments\/\d+$/) && method === 'put') {
      const body = config.data as { text?: string }
      const id = Number(p.split('/').pop())
      return mockResponse(
        {
          id,
          text: body?.text ?? '',
          createdAt: new Date().toISOString(),
          depth: 0,
          plusCount: 0,
          minusCount: 0,
          userId: 0,
          repliesCount: 0,
        },
        200
      )
    }
    if (p.match(/^news\/\d+\/comments\/\d+$/) && method === 'delete') {
      return mockResponse({ message: 'Comment deleted' }, 200)
    }
    if (p === 'admin/news/upload' && method === 'post') {
      return mockResponse({ path: '/uploads/images/mock-' + Date.now() + '.jpg' }, 200, 'news upload')
    }
    if (p === 'admin/news' && method === 'post') {
      const body = config.data as {
        title: string
        body?: string
        previewImage?: string
        previewTitle?: string
        tags?: string
        attachments?: { type: string; path: string }[]
      }
      const created = mockNewsCreate(body)
      return mockResponse(created, 201, 'news create')
    }
    if (p.match(/^admin\/news\/\d+$/) && method === 'put') {
      const id = Number(p.split('/')[3])
      const body = config.data as {
        title: string
        body?: string
        previewImage?: string
        previewTitle?: string
        tags?: string
        attachments?: NewsAttachment[]
      }
      const updated = mockNewsUpdate(id, body)
      if (!updated) return mockResponse(null as never, 404)
      return mockResponse(updated, 200, 'news update')
    }
    if (p.match(/^admin\/news\/\d+$/) && method === 'delete') {
      return mockResponse({ message: 'News deleted' }, 200)
    }
    if (p.match(/^users\/username\/[^/]+\/achievements$/) && method === 'get') {
      const username = decodeURIComponent(
        p.replace(/^users\/username\//, '').replace(/\/achievements$/, '') || ''
      ).toLowerCase()
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' } as never, 404)
      if (profile.profileHidden)
        return mockResponse({ error: 'Profile is hidden or visible only to friends' } as never, 403)
      return mockResponse({ achievements: getMockAchievements() }, 200, 'user achievements')
    }
    if (p === 'auth/login' && method === 'post') {
      return mockResponse({
        user: mockCurrentUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        sessionId: 1,
      })
    }
    if (p === 'auth/register' && method === 'post') {
      return mockResponse({
        user: {
          ...mockCurrentUser,
          username: (config.data?.username as string) || 'newuser',
          email: config.data?.email,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        sessionId: 1,
      })
    }
    if (p === 'auth/refresh' && method === 'post') {
      return mockResponse({
        user: mockCurrentUser,
        accessToken: 'mock-access-token-new',
        refreshToken: 'mock-refresh-token-new',
        expiresIn: 3600,
        sessionId: 1,
      })
    }
    if (p === 'auth/sessions' && method === 'get') {
      return mockResponse({ sessions: [...mockSessions] })
    }
    if (p.match(/^auth\/sessions\/\d+$/) && method === 'delete') {
      const id = Number(p.split('/')[2])
      const idx = mockSessions.findIndex((s) => s.id === id)
      if (idx !== -1) mockSessions.splice(idx, 1)
      return mockResponse({ message: 'Session revoked' })
    }
    if (p === 'auth/logout-others' && method === 'post') {
      return mockResponse({ message: 'Logged out from all other devices' })
    }
    if (p === 'auth/forgot-password' && method === 'post') {
      return mockResponse({ message: 'If the email exists, a reset link has been sent' })
    }
    if (p === 'auth/reset-password' && method === 'post') {
      return mockResponse({ message: 'Password has been reset successfully' })
    }
    if (p.startsWith('auth/')) {
      return mockResponse({})
    }

    // ——— Genres ———
    if (p === 'genres' && method === 'get') {
      return mockResponse(mockGenres)
    }

    // ——— Themes, Studios, Platforms, Developers, Publishers (каталог / админка) ———
    if (p === 'themes' && method === 'get') {
      return mockResponse(mockThemes)
    }
    if (p === 'studios' && method === 'get') {
      const search = (query.search || '').trim().toLowerCase()
      const idsStr = query.ids || ''
      const ids = idsStr
        ? idsStr
            .split(',')
            .map((x) => parseInt(x.trim(), 10))
            .filter((x) => !Number.isNaN(x))
        : []
      let list = mockStudios
      if (ids.length) list = list.filter((s) => ids.includes(s.id))
      else if (search) list = list.filter((s) => (s.name || '').toLowerCase().includes(search))
      return mockResponse(list)
    }
    if (p === 'platforms' && method === 'get') {
      return mockResponse(mockPlatforms)
    }
    if (p === 'developers' && method === 'get') {
      const search = (query.search || '').trim().toLowerCase()
      const idsStr = query.ids || ''
      const ids = idsStr
        ? idsStr
            .split(',')
            .map((x) => parseInt(x.trim(), 10))
            .filter((x) => !Number.isNaN(x))
        : []
      let list = mockDevelopers
      if (ids.length) list = list.filter((d) => ids.includes(d.id))
      else if (search) list = list.filter((d) => (d.name || '').toLowerCase().includes(search))
      return mockResponse(list)
    }
    if (p === 'publishers' && method === 'get') {
      const search = (query.search || '').trim().toLowerCase()
      const idsStr = query.ids || ''
      const mediaType = (query.mediaType || '').trim().toLowerCase()
      const ids = idsStr
        ? idsStr
            .split(',')
            .map((x) => parseInt(x.trim(), 10))
            .filter((x) => !Number.isNaN(x))
        : []
      let list = mockPublishers
      if (ids.length) list = list.filter((pub) => ids.includes(pub.id))
      else if (search) list = list.filter((pub) => (pub.name || '').toLowerCase().includes(search))
      if (mediaType)
        list = list.filter((pub) => !pub.publicationTypes?.length || pub.publicationTypes.includes(mediaType as never))
      return mockResponse(list)
    }

    // ——— Admin: интернет-ресурсы (sites) ———
    if (p === 'admin/upload' && method === 'post') {
      const type = ((config.data as FormData)?.get?.('type') as string) || 'image'
      const subdir = type === 'trailer' || type === 'video' ? 'trailers' : type === 'poster' ? 'posters' : 'images'
      const ext = type === 'trailer' || type === 'video' ? '.mp4' : '.jpg'
      const path = `/uploads/${subdir}/mock-${Date.now()}${ext}`
      return mockResponse({ path })
    }
    if (p === 'admin/sites' && method === 'get') {
      return mockResponse([...mockSites])
    }
    if (p === 'admin/sites' && method === 'post') {
      const body = config.data as { name?: string; url?: string; description?: string }
      const id = mockSites.length ? Math.max(...mockSites.map((s) => s.id)) + 1 : 1
      const site = { id, name: body?.name ?? '', url: body?.url ?? '', description: body?.description }
      mockSites.push(site)
      return mockResponse(site, 201)
    }
    if (/^admin\/sites\/\d+$/.test(p) && method === 'put') {
      const id = Number(p.split('/')[2])
      const body = config.data as { name?: string; url?: string; description?: string }
      const idx = mockSites.findIndex((s) => s.id === id)
      if (idx === -1) return mockResponse({ error: 'Site not found' } as never, 404)
      mockSites[idx] = { ...mockSites[idx], ...body }
      return mockResponse(mockSites[idx])
    }
    if (/^admin\/sites\/\d+$/.test(p) && method === 'delete') {
      const id = Number(p.split('/')[2])
      const idx = mockSites.findIndex((s) => s.id === id)
      if (idx !== -1) mockSites.splice(idx, 1)
      return mockResponse(undefined as never, 204)
    }

    // ——— Admin: жалобы, заблокированные на комментарии ———
    if (p === 'admin/reports' && method === 'get') {
      const status = query.status as string | undefined
      let list = mockReportsState
      if (status) list = list.filter((r) => r.status === status)
      const limit = Math.min(Number(query.limit) || 50, 100)
      const offset = Number(query.offset) || 0
      const reports = list.slice(offset, offset + limit)
      return mockResponse({ reports, total: list.length })
    }
    if (/^admin\/reports\/\d+$/.test(p) && method === 'patch') {
      const id = Number(p.split('/')[2])
      const body = config.data as { status?: string; moderatorNote?: string }
      const idx = mockReportsState.findIndex((r) => r.id === id)
      if (idx === -1) return mockResponse({ error: 'Report not found' } as never, 404)
      if (body.status)
        mockReportsState[idx] = {
          ...mockReportsState[idx],
          status: body.status,
          moderatorNote: body.moderatorNote,
          resolvedAt: new Date().toISOString(),
          resolvedBy: 1,
        }
      return mockResponse(mockReportsState[idx])
    }
    if (p === 'admin/reports/bulk' && method === 'patch') {
      const body = config.data as { ids?: number[]; status?: string; moderatorNote?: string }
      const ids = Array.isArray(body.ids) ? body.ids : []
      let updated = 0
      ids.forEach((id) => {
        const idx = mockReportsState.findIndex((r) => r.id === id && r.status === 'pending')
        if (idx !== -1) {
          mockReportsState[idx] = {
            ...mockReportsState[idx],
            status: body.status || 'resolved',
            moderatorNote: body.moderatorNote,
            resolvedAt: new Date().toISOString(),
            resolvedBy: 1,
          }
          updated++
        }
      })
      return mockResponse({ updated, message: 'Bulk update applied' })
    }
    if (p === 'admin/reports/templates' && method === 'get') {
      return mockResponse({ templates: mockReportTemplates })
    }
    if (p === 'admin/reports/templates' && method === 'post') {
      const body = config.data as { title: string; body: string; orderNum?: number }
      const newId = Math.max(0, ...mockReportTemplates.map((t) => t.id)) + 1
      const t = { id: newId, title: body.title || '', body: body.body || '', orderNum: body.orderNum ?? 0 }
      mockReportTemplates.push(t)
      return mockResponse(t, 201)
    }
    if (p === 'admin/users/comment-banned' && method === 'get') {
      return mockResponse({ users: mockCommentBannedState })
    }
    if (/^admin\/users\/\d+\/comment-ban$/.test(p) && method === 'put') {
      return mockResponse({
        message: 'Comment ban set',
        commentBanUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    }
    if (/^admin\/users\/\d+\/comment-ban$/.test(p) && method === 'delete') {
      const id = Number(p.split('/')[2])
      mockCommentBannedState = mockCommentBannedState.filter((u) => u.id !== id)
      return mockResponse({ message: 'Comment ban cleared' })
    }
    if (/^admin\/users\/\d+\/comment-ban-history$/.test(p) && method === 'get') {
      const userId = Number(p.split('/')[2])
      const past = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
      const history =
        userId === 2 || userId === 3
          ? [
              {
                id: 1,
                bannedAt: past(14),
                bannedUntil: past(11),
                bannedCommentText: 'Оскорбления в обсуждении сериала.',
                bannedCommentReason: 'Нарушение правил.',
              },
            ]
          : []
      return mockResponse({ history })
    }

    // ——— Единый API фильтров: GET /media/:type/filters — жанры/темы только те, что есть у контента этого типа ———
    if (p.match(/^media\/[^/]+\/filters$/) && method === 'get') {
      const type = p.split('/')[1]
      const { genres, themes } = getFiltersGenresAndThemesForMediaType(type)
      const payload: Record<string, unknown> = {
        genres,
        themes,
        sortOptions: ['created_at', 'updated_at', 'title', 'rating', 'release_date', 'popularity'],
        orderOptions: ['ASC', 'DESC'],
        genreModes: ['or', 'and'],
        themeModes: ['or', 'and'],
      }
      if (type === 'movies') {
        const countries = [...new Set(mockMovies.map((m) => m.country).filter(Boolean))] as string[]
        payload.countries = countries
      }
      return mockResponse(payload, 200, 'media/:type/filters')
    }

    // ——— Calendar releases: только по выбранному месяцу (from–to) и типу медиа, не все сразу ———
    // axios передаёт params в config.params, а не в URL — подставляем их из config
    if (p === 'calendar/releases' && method === 'get') {
      const params = asRecord(config.params)
      const from = String(query.from ?? params?.from ?? '').trim()
      const to = String(query.to ?? params?.to ?? '').trim()
      const mediaType = String(query.mediaType ?? params?.mediaType ?? 'movie').trim() || 'movie'
      const listTypeMap: Record<string, string> = {
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
      const listType = listTypeMap[mediaType] || 'movies'
      type Item = {
        id: number
        title: string
        titleI18n?: Record<string, string>
        poster?: string | null
        releaseDate?: string | null
      }
      let list: Item[] = []
      if (mediaType === 'movie') list = mockMovies as Item[]
      else if (mediaType === 'anime') list = mockAnime as Item[]
      else if (mediaType === 'game') list = mockGames as Item[]
      else if (mediaType === 'tv-series') list = mockTVSeries as Item[]
      else if (mediaType === 'manga') list = mockManga as Item[]
      else if (mediaType === 'book') list = mockBooks as Item[]
      else if (mediaType === 'light-novel') list = mockLightNovels as Item[]
      else if (mediaType === 'cartoon-series') list = mockCartoonSeries as Item[]
      else if (mediaType === 'cartoon-movies') list = mockCartoonMovies as Item[]
      else if (mediaType === 'anime-movies') list = mockAnimeMovies as Item[]
      const fromT = from ? new Date(from).getTime() : 0
      const toT = to ? new Date(to + 'T23:59:59').getTime() : Number.MAX_SAFE_INTEGER
      const statusMap = getListStatusByMediaId(listType)
      type CalendarReleaseItem = {
        id: number
        title: string
        titleI18n?: Record<string, string>
        poster?: string | null
        releaseDate: string
        mediaType: string
        listStatus: ListStatus | null
      }
      // Только релизы в диапазоне месяца, лимит чтобы не отдавать всё сразу
      let releases: CalendarReleaseItem[] = list
        .filter((m) => {
          const d = m.releaseDate ? new Date(m.releaseDate).getTime() : 0
          return d >= fromT && d <= toT
        })
        .slice(0, 25)
        .map((m) => ({
          id: m.id,
          title: m.title,
          titleI18n: m.titleI18n,
          poster: m.poster,
          releaseDate: m.releaseDate || '',
          mediaType,
          listStatus: (statusMap[m.id] ?? null) as ListStatus | null,
        }))
      // На 15-е выбранного месяца добавляем 5 мок-релизов в один день (чтобы было видно колоду)
      const fromMatch = from.match(/^(\d{4})-(\d{2})-/)
      if (fromMatch && to >= from) {
        const monthDay = `${fromMatch[1]}-${fromMatch[2]}-15`
        if (monthDay >= from && monthDay <= to) {
          const mockOnOneDay: CalendarReleaseItem[] = [
            {
              id: 9001,
              title: 'Премьера месяца',
              titleI18n: undefined,
              poster: null,
              releaseDate: monthDay,
              mediaType,
              listStatus: null,
            },
            {
              id: 9002,
              title: 'Сезон финала',
              titleI18n: undefined,
              poster: null,
              releaseDate: monthDay,
              mediaType,
              listStatus: 'planned',
            },
            {
              id: 9003,
              title: 'Новый релиз',
              titleI18n: undefined,
              poster: null,
              releaseDate: monthDay,
              mediaType,
              listStatus: null,
            },
            {
              id: 9004,
              title: 'Продолжение',
              titleI18n: undefined,
              poster: null,
              releaseDate: monthDay,
              mediaType,
              listStatus: 'watching',
            },
            {
              id: 9005,
              title: 'Спецвыпуск',
              titleI18n: undefined,
              poster: null,
              releaseDate: monthDay,
              mediaType,
              listStatus: null,
            },
          ]
          releases = [...releases, ...mockOnOneDay]
        }
      }
      // Март 2026: релизы на разные дни и несколько на 1-е число
      if (from <= '2026-03-31' && to >= '2026-03-01') {
        const march2026: CalendarReleaseItem[] = [
          {
            id: 9101,
            title: 'Премьера 1 марта',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-01',
            mediaType,
            listStatus: 'planned',
          },
          {
            id: 9102,
            title: 'Весенний блокбастер',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-01',
            mediaType,
            listStatus: null,
          },
          {
            id: 9103,
            title: 'Старт сезона',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-01',
            mediaType,
            listStatus: 'watching',
          },
          {
            id: 9104,
            title: 'Релиз 5 марта',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-05',
            mediaType,
            listStatus: null,
          },
          {
            id: 9105,
            title: 'Десятое число',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-10',
            mediaType,
            listStatus: null,
          },
          {
            id: 9106,
            title: 'Вторая премьера 10-го',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-10',
            mediaType,
            listStatus: 'completed',
          },
          {
            id: 9107,
            title: 'Двадцатое марта',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-20',
            mediaType,
            listStatus: null,
          },
          {
            id: 9108,
            title: 'Конец месяца',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-25',
            mediaType,
            listStatus: null,
          },
          {
            id: 9109,
            title: 'Ещё один 25-го',
            titleI18n: undefined,
            poster: null,
            releaseDate: '2026-03-25',
            mediaType,
            listStatus: 'onHold',
          },
        ]
        releases = [...releases, ...march2026]
      }
      return mockResponse({ releases }, 200, 'calendar/releases')
    }

    // ——— Movies ———
    if (p === 'movies' && method === 'get') {
      const { page, pageSize, genreIds, themeIds, countries, studioIds, yearFrom, yearTo, sortBy, order } =
        getListParams(query, config)
      const visible = mockMovies.filter((m) => !(m as Movie).isHidden)
      const filtered = filterAndSortMedia(visible, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('movies')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result, 200, `movies: ${result.data.length} items`)
    }
    if (p === 'movies/filters' && method === 'get') {
      return mockResponse(
        {
          genres: mockGenres,
          themes: [],
          sortOptions: ['created_at', 'updated_at', 'title', 'rating', 'release_date', 'popularity'],
          orderOptions: ['ASC', 'DESC'],
        },
        200,
        'movies/filters (genres, sortOptions)'
      )
    }
    if (/^movies\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const movie = mockMovies.find((m) => m.id === id) || mockMovies[0]
      const cast = mockCastByMovieId[id] || []
      const similar = mockMovies.filter((m) => m.id !== id).slice(0, 12)
      return mockResponse({ ...movie, ageRating: (movie as { ageRating?: string }).ageRating ?? 'pg', cast, similar })
    }
    if (p === 'movies/popular' && method === 'get') {
      const limit = Number(query.limit) || 10
      return mockResponse(mockMovies.slice(0, limit))
    }
    if (p === 'movies/search' && method === 'get') {
      const page = Number(query.page) || 1
      const pageSize = 20
      const q = (query.q || '').toLowerCase()
      const visible = mockMovies.filter((m) => !(m as Movie).isHidden)
      const filtered = q ? visible.filter((m) => m.title.toLowerCase().includes(q)) : visible
      return mockResponse(paginate(filtered, page, pageSize))
    }
    if (p.match(/^movies\/\d+\/reviews$/) && method === 'get') {
      const movieId = Number(p.split('/')[1])
      const list = mockReviews.filter((r) => (r as { movieId?: number }).movieId === movieId)
      return mockResponse({ data: list, total: list.length })
    }
    // GET /media/:type/:id/reviews — рецензии для страницы деталей медиа (фильм, аниме и т.д.)
    if (p.match(/^media\/[\w-]+\/\d+\/reviews$/) && method === 'get') {
      const parts = p.split('/')
      const mediaType = parts[1]
      const entityId = Number(parts[2])
      type R = (typeof mockReviews)[0]
      const list: R[] =
        mediaType === 'movies'
          ? mockReviews.filter((r) => (r as R & { movieId?: number }).movieId === entityId)
          : mediaType === 'anime'
            ? mockReviews.filter((r) => (r as R & { animeId?: number }).animeId === entityId)
            : []
      return mockResponse(list)
    }
    if (p.match(/^movies\/\d+\/comments$/) && method === 'get') {
      return mockResponse({ comments: mockComments, total: mockComments.length })
    }

    // ——— Franchises ———
    if (p === 'franchises' && method === 'get') {
      const page = parseInt(query.page || '1', 10)
      const pageSize = parseInt(query.pageSize || '20', 10)
      const result = paginate(mockFranchises, page, pageSize)
      return mockResponse(result)
    }
    if (/^franchises\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const fr = mockFranchises.find((f) => f.id === id) || mockFranchises[0]
      const links = getMockFranchiseLinksByFranchiseId(id)
      return mockResponse({ ...fr, links })
    }
    if (/^franchises\/\d+\/media$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const links = getMockFranchiseLinksByFranchiseId(id)
      return mockResponse(links)
    }
    if (p === 'franchises/by-media' && method === 'get') {
      const params = asRecord(config.params)
      const mediaType = (query.mediaType ?? params?.mediaType ?? 'movie') as string
      const mediaId = Number(query.mediaId ?? params?.mediaId ?? 0)
      const links = getMockFranchiseLinksByMedia(mediaType, mediaId)
      return mockResponse(links)
    }

    // ——— Anime ———
    if (p === 'anime' && method === 'get') {
      const { page, pageSize, genreIds, themeIds, countries, studioIds, yearFrom, yearTo, seasons, sortBy, order } =
        getListParams(query, config)
      const filtered = filterAndSortMedia(mockAnime, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        yearFrom,
        yearTo,
        seasons,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('anime')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^anime\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockAnime.find((a) => a.id === id) || mockAnime[0]
      const similar = mockAnime.filter((a) => a.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'anime/popular' && method === 'get') {
      return mockResponse(mockAnime.slice(0, Number(query.limit) || 10))
    }
    if (p === 'anime/search' && method === 'get') {
      const q = (query.q || '').toLowerCase()
      const filtered = q ? mockAnime.filter((a) => a.title.toLowerCase().includes(q)) : mockAnime
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Games ———
    if (p === 'games' && method === 'get') {
      const {
        page,
        pageSize,
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        developerIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      } = getListParams(query, config)
      const filtered = filterAndSortMedia(mockGames, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        developerIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('games')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (p === 'games/filters' && method === 'get') {
      return mockResponse({
        genres: mockGenres,
        themes: [],
        sortOptions: ['created_at', 'updated_at', 'title', 'rating', 'release_date', 'popularity'],
        orderOptions: ['ASC', 'DESC'],
      })
    }
    if (/^games\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockGames.find((g) => g.id === id) || mockGames[0]
      const similar = mockGames.filter((g) => g.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'games/popular' && method === 'get') {
      return mockResponse(mockGames.slice(0, Number(query.limit) || 10))
    }
    if (p === 'games/search' && method === 'get') {
      const q = (query.q || '').toLowerCase()
      const filtered = q ? mockGames.filter((g) => g.title.toLowerCase().includes(q)) : mockGames
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— TV Series ———
    if (p === 'tv-series' && method === 'get') {
      const { page, pageSize, genreIds, themeIds, countries, studioIds, yearFrom, yearTo, sortBy, order } =
        getListParams(query, config)
      const filtered = filterAndSortMedia(mockTVSeries, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('tv-series')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^tv-series\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockTVSeries.find((t) => t.id === id) || mockTVSeries[0]
      const similar = mockTVSeries.filter((t) => t.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'tv-series/popular' && method === 'get') {
      return mockResponse(mockTVSeries.slice(0, Number(query.limit) || 10))
    }
    if (p === 'tv-series/search' && method === 'get') {
      const filtered =
        query.q || ''
          ? mockTVSeries.filter((t) => t.title.toLowerCase().includes((query.q || '').toLowerCase()))
          : mockTVSeries
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Manga ———
    if (p === 'manga' && method === 'get') {
      const {
        page,
        pageSize,
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      } = getListParams(query, config)
      const filtered = filterAndSortMedia(mockManga, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('manga')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^manga\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockManga.find((m) => m.id === id) || mockManga[0]
      const similar = mockManga.filter((m) => m.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'manga/popular' && method === 'get') {
      return mockResponse(mockManga.slice(0, Number(query.limit) || 10))
    }
    if (p === 'manga/search' && method === 'get') {
      const filtered =
        query.q || ''
          ? mockManga.filter((m) => m.title.toLowerCase().includes((query.q || '').toLowerCase()))
          : mockManga
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Books ———
    if (p === 'books' && method === 'get') {
      const {
        page,
        pageSize,
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      } = getListParams(query, config)
      const filtered = filterAndSortMedia(mockBooks, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('books')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^books\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockBooks.find((b) => b.id === id) || mockBooks[0]
      const similar = mockBooks.filter((b) => b.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'books/popular' && method === 'get') {
      return mockResponse(mockBooks.slice(0, Number(query.limit) || 10))
    }
    if (p === 'books/search' && method === 'get') {
      const filtered =
        query.q || ''
          ? mockBooks.filter((b) => b.title.toLowerCase().includes((query.q || '').toLowerCase()))
          : mockBooks
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Recommendations ———
    if (p === 'recommendations' && method === 'get') {
      return mockResponse({ recommendations: mockRecommendations })
    }

    // ——— Favorites ———
    if (p === 'favorites' && method === 'get') {
      return mockResponse(mockFavorites)
    }
    if (p.match(/^users\/username\/[^/]+\/favorites$/) && method === 'get') {
      const username = decodeURIComponent(
        p.replace(/^users\/username\//, '').replace(/\/favorites$/, '') || ''
      ).toLowerCase()
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' } as never, 404)
      if (profile.profileHidden)
        return mockResponse({ error: 'Profile is hidden or visible only to friends' } as never, 403)
      const isOwn = username === (mockCurrentUser.username || '').toLowerCase()
      const data = isOwn
        ? mockFavorites
        : username === 'bob'
          ? mockFavoritesBob
          : username === 'alice'
            ? mockFavoritesAlice
            : {
                movies: [],
                tvSeries: [],
                animeSeries: [],
                games: [],
                manga: [],
                books: [],
                lightNovels: [],
                cartoonSeries: [],
                cartoonMovies: [],
                animeMovies: [],
                characters: [],
                persons: [],
                casts: [],
              }
      return mockResponse(data)
    }
    if (p.match(/^favorites\/\w+\/\d+$/) && (method === 'post' || method === 'delete')) {
      return mockResponse(undefined as never, 204)
    }

    // ——— Lists ———
    if (
      p.match(
        /^lists\/(movies|anime|games|tv-series|manga|books|light-novels|cartoon-series|cartoon-movies|anime-movies)/
      ) &&
      method === 'get'
    ) {
      const listType = p.split('/')[1]
      const key =
        listType === 'movies'
          ? 'movie'
          : listType === 'anime'
            ? 'animeSeries'
            : listType === 'games'
              ? 'game'
              : listType === 'tv-series'
                ? 'tvSeries'
                : listType === 'manga'
                  ? 'manga'
                  : listType === 'books'
                    ? 'book'
                    : listType === 'light-novels'
                      ? 'lightNovel'
                      : listType === 'cartoon-series'
                        ? 'cartoonSeries'
                        : listType === 'cartoon-movies'
                          ? 'cartoonMovie'
                          : 'animeMovie'
      let filtered = mockListItems.filter((item) => item[key as keyof typeof item])
      const statusParam = String(query.status ?? (config.params as Record<string, unknown> | undefined)?.status ?? '').trim()
      if (statusParam) {
        filtered = filtered.filter((i) => i.status === statusParam)
      }
      return mockResponse(filtered)
    }
    if (
      p.match(
        /^lists\/(movies|anime|games|tv-series|manga|books|light-novels|cartoon-series|cartoon-movies|anime-movies)\/\d+$/
      ) &&
      (method === 'post' || method === 'put' || method === 'delete')
    ) {
      const parts = p.split('/')
      const listType = parts[1]
      const entityId = Number(parts[2])
      const entityKey =
        listType === 'movies'
          ? 'movie'
          : listType === 'anime'
            ? 'animeSeries'
            : listType === 'games'
              ? 'game'
              : listType === 'tv-series'
                ? 'tvSeries'
                : listType === 'manga'
                  ? 'manga'
                  : listType === 'books'
                    ? 'book'
                    : listType === 'light-novels'
                      ? 'lightNovel'
                      : listType === 'cartoon-series'
                        ? 'cartoonSeries'
                        : listType === 'cartoon-movies'
                          ? 'cartoonMovie'
                          : 'animeMovie'
      if (method === 'delete') return mockResponse(undefined as never, 204)
      const existing = mockListItems.find(
        (i) => (i[entityKey as keyof typeof i] as { id?: number } | undefined)?.id === entityId
      )
      const payload = asRecordOrEmpty(config.data)
      if (existing) {
        const merged = { ...existing, ...payload } as Record<string, unknown>
        const isFilmType = listType === 'movies' || listType === 'cartoon-movies' || listType === 'anime-movies'
        if (isFilmType && payload.markRewatched === true) {
          const nowIso = new Date().toISOString()
          const prev = Array.isArray(existing.rewatchSessions) ? existing.rewatchSessions : []
          merged.rewatchSessions = [...prev, { startedAt: nowIso, completedAt: nowIso }]
          merged.completedAt = nowIso
          merged.status = 'completed'
        }
        return mockResponse(merged)
      }
      const mediaByType: Record<string, { id: number }[] | undefined> = {
        movies: mockMovies,
        anime: mockAnime,
        games: mockGames,
        'tv-series': mockTVSeries,
        manga: mockManga,
        books: mockBooks,
        'light-novels': mockLightNovels,
        'cartoon-series': mockCartoonSeries,
        'cartoon-movies': mockCartoonMovies,
        'anime-movies': mockAnimeMovies,
      }
      const arr = mediaByType[listType]
      const media = arr?.find((m) => m.id === entityId)
      const base = media ? { [entityKey]: media } : { [entityKey]: { id: entityId } }
      const item = { ...base, id: entityId, ...payload }
      return mockResponse(item)
    }

    // ——— Collections ———
    if (p === 'collections' && method === 'get') {
      return mockResponse(mockCollections)
    }
    if (p === 'collections' && method === 'post') {
      const name = (config.data as { name?: string })?.name || 'Новая коллекция'
      return mockResponse({
        id: mockCollections.length + 1,
        name,
        description: undefined,
        isPublic: true,
        createdAt: new Date().toISOString(),
      })
    }
    if (/^collections\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const col = mockCollections.find((c) => c.id === id)
      return mockResponse(col || mockCollections[0])
    }
    if (/^collections\/\d+$/.test(p) && (method === 'put' || method === 'delete')) {
      return method === 'delete' ? mockResponse(undefined as never, 204) : mockResponse(mockCollections[0])
    }
    if (
      p.match(/^collections\/\d+\/(movies|anime|games|manga|books|light-novels)$/) &&
      (method === 'post' || method === 'delete')
    ) {
      return mockResponse(undefined as never, 204)
    }
    if (p.match(/^collections\/\d+\/(movies|anime|games|manga|books|light-novels)\/\d+$/)) {
      return mockResponse(undefined as never, 204)
    }
    // ——— Public (site) collections ———
    if (p === 'public-collections' && method === 'get') {
      const list = [
        {
          id: 1,
          name: 'Лучшие фильмы года',
          description: 'Подборка от редакции',
          poster: null,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Топ аниме',
          description: 'Популярное аниме',
          poster: null,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      return mockResponse(list, 200, 'public collections list')
    }
    if (/^public-collections\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const publicList: { id: number; name: string; description: string }[] = [
        { id: 1, name: 'Лучшие фильмы года', description: 'Подборка от редакции' },
        { id: 2, name: 'Топ аниме', description: 'Популярное аниме' },
      ]
      const meta = publicList.find((c) => c.id === id) || publicList[0]
      const baseCol = mockCollections.find((c) => c.id === id) || mockCollections[0]
      const movieStatus = getListStatusByMediaId('movies')
      const animeStatus = getListStatusByMediaId('anime')
      const gameStatus = getListStatusByMediaId('games')
      const col = { ...baseCol, id: meta.id, name: meta.name, description: meta.description, user: null, owner: null }
      if (col.movies?.length) {
        col.movies = col.movies.map((e) => {
          if (!e.movie) return e
          return {
            ...e,
            movie: {
              ...e.movie,
              rating: (mockMovies.find((m) => m.id === e.movie!.id) as { rating?: number })?.rating,
              listStatus: movieStatus[e.movie.id] ?? null,
            },
          }
        })
      }
      if (col.animeSeries?.length) {
        col.animeSeries = col.animeSeries.map((e) => {
          if (!e.animeSeries) return e
          return {
            ...e,
            animeSeries: {
              ...e.animeSeries,
              rating: (mockAnime.find((m) => m.id === e.animeSeries!.id) as { rating?: number })?.rating,
              listStatus: animeStatus[e.animeSeries.id] ?? null,
            },
          }
        })
      }
      if (col.games?.length) {
        col.games = col.games.map((e) => {
          if (!e.game) return e
          return {
            ...e,
            game: {
              ...e.game,
              rating: (mockGames.find((m) => m.id === e.game!.id) as { rating?: number })?.rating,
              listStatus: gameStatus[e.game.id] ?? null,
            },
          }
        })
      }
      return mockResponse(col, 200, 'public collection detail')
    }

    // ——— Users ———
    if (p.match(/^users\/username\/[^/]+\/collections$/) && method === 'get') {
      const username = decodeURIComponent(p.replace(/^users\/username\//, '').replace(/\/collections$/, '') || '')
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' } as never, 404)
      const list = username === mockCurrentUser.username ? mockCollections : []
      return mockResponse(list)
    }
    if (p.match(/^users\/username\/[^/]+\/reviews$/) && method === 'get') {
      const username = decodeURIComponent(
        p.replace(/^users\/username\//, '').replace(/\/reviews$/, '') || ''
      ).toLowerCase()
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' } as never, 404)
      if (profile.profileHidden)
        return mockResponse({ error: 'Profile is hidden or visible only to friends' } as never, 403)
      const isOwn = username === (mockCurrentUser.username || '').toLowerCase()
      let movies: {
        id: number
        overallRating: number
        review: string
        reviewStatus: string
        userId: number
        createdAt: string
        movie: { id: number; title?: string }
      }[]
      if (isOwn) {
        movies = mockReviews.map((r) => {
          const movieId = (r as { movieId?: number }).movieId ?? 0
          const movie = mockMovies.find((m) => m.id === movieId)
          return { ...r, review: r.review ?? '', movie: { id: movieId, title: movie?.title } }
        })
      } else if (username === 'alice' && profile.reviewsCount && profile.reviewsCount > 0) {
        const movie = mockMovies[0]
        movies = [
          {
            id: 101,
            overallRating: 85,
            review: 'Рецензия Alice: очень понравилось.',
            reviewStatus: 'positive',
            userId: profile.id,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            movie: { id: movie.id, title: movie.title },
          },
        ]
      } else {
        movies = []
      }
      return mockResponse({
        movies,
        tvSeries: [],
        anime: [],
        animeMovies: [],
        games: [],
        manga: [],
        books: [],
        lightNovels: [],
      })
    }
    if (
      p.match(
        /^users\/username\/[^/]+\/lists\/(movies|anime|games|tv-series|manga|books|light-novels|cartoon-series|cartoon-movies|anime-movies)$/
      ) &&
      method === 'get'
    ) {
      const parts = p.split('/')
      const username = decodeURIComponent(parts[2] || '').toLowerCase()
      const listType = parts[4]
      const key =
        listType === 'movies'
          ? 'movie'
          : listType === 'anime'
            ? 'animeSeries'
            : listType === 'games'
              ? 'game'
              : listType === 'tv-series'
                ? 'tvSeries'
                : listType === 'manga'
                  ? 'manga'
                  : listType === 'books'
                    ? 'book'
                    : listType === 'light-novels'
                      ? 'lightNovel'
                      : listType === 'cartoon-series'
                        ? 'cartoonSeries'
                        : listType === 'cartoon-movies'
                          ? 'cartoonMovie'
                          : 'animeMovie'
      const baseList =
        username === (mockCurrentUser.username || '').toLowerCase()
          ? mockListItems
          : username === 'alice'
            ? mockListItemsAlice
            : username === 'bob'
              ? mockListItemsBob
              : []
      let filtered = baseList.filter((item) => item[key as keyof typeof item])
      const status = query.status
      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }
      return mockResponse(filtered)
    }
    if (p.match(/^users\/username\/[^/]+\/friends$/) && method === 'get') {
      const username = decodeURIComponent(
        p.replace(/^users\/username\//, '').replace(/\/friends$/, '') || ''
      ).toLowerCase()
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' } as never, 404)
      if (profile.profileHidden)
        return mockResponse({ error: 'Profile is hidden or visible only to friends' } as never, 403)
      const isOwn = username === (mockCurrentUser.username || '').toLowerCase()
      const list = isOwn
        ? mockFriends
        : username === 'bob'
          ? [mockCurrentUser]
          : username === 'alice'
            ? [mockCurrentUser]
            : []
      return mockResponse(list)
    }
    if (p.match(/^users\/username\/[^/]+\/followers$/) && method === 'get') {
      const username = decodeURIComponent(
        p.replace(/^users\/username\//, '').replace(/\/followers$/, '') || ''
      ).toLowerCase()
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' } as never, 404)
      if (profile.profileHidden)
        return mockResponse({ error: 'Profile is hidden or visible only to friends' } as never, 403)
      const isOwn = username === (mockCurrentUser.username || '').toLowerCase()
      const list = isOwn ? mockFollowers : username === 'alice' ? [mockCurrentUser] : []
      return mockResponse(list)
    }
    if (p.startsWith('users/username/') && method === 'get') {
      const username = decodeURIComponent(p.replace('users/username/', '').split('/')[0] || '')
      const profile = getMockProfileByUsername(username)
      if (!profile) return mockResponse({ error: 'User not found' }, 404)
      const isOwn = profile.id === mockCurrentUser.id && mockCurrentUser.socialLinks
      return mockResponse(isOwn ? { ...profile, socialLinks: mockCurrentUser.socialLinks } : profile)
    }
    if (p === 'users/me/settings' && (method === 'get' || method === 'patch')) {
      return mockResponse({ theme: 'light', emailNotifications: true, profileVisibility: 'public', locale: 'ru' })
    }
    if (p === 'users/me/ping' && method === 'post') {
      return mockResponse(undefined as never, 204)
    }
    if (p === 'users/me' && method === 'patch') {
      const body = config.data as {
        username?: string
        name?: string
        email?: string
        socialLinks?: Record<string, string>
      }
      if (body?.username !== undefined) {
        mockCurrentUser.username = body.username.trim().toLowerCase() || mockCurrentUser.username
      }
      if (body?.name !== undefined) {
        mockCurrentUser.name = body.name.trim() || undefined
      }
      if (body?.email !== undefined) {
        mockCurrentUser.email = body.email.trim().toLowerCase() || mockCurrentUser.email
      }
      if (body?.socialLinks !== undefined) {
        mockCurrentUser.socialLinks = body.socialLinks
      }
      return mockResponse({ user: { ...mockCurrentUser } })
    }
    if (p === 'users/me/change-password' && method === 'post') {
      return mockResponse({ message: 'Password updated' })
    }

    // ——— Friends ———
    if (p === 'friends' && method === 'get') {
      return mockResponse(mockFriends)
    }

    // ——— Messages (диалоги с друзьями) ———
    if (p === 'messages/conversations' && method === 'get') {
      return mockResponse(mockConversations)
    }
    if (p.match(/^messages\/conversations\/with\/\d+$/) && method === 'get') {
      const friendId = Number(p.split('/').pop())
      const other = mockFriends.find((f) => f.id === friendId) || mockUsers.find((u) => u.id === friendId)
      const conv = mockConversations.find((c) => c.otherUser?.id === friendId)
      if (conv) {
        return mockResponse({
          id: conv.id,
          user1Id: 1,
          user2Id: friendId,
          user1: mockCurrentUser,
          user2: other,
          createdAt: past(2),
          updatedAt: conv.updatedAt,
        })
      }
      return mockResponse({
        id: 1,
        user1Id: 1,
        user2Id: friendId,
        user1: mockCurrentUser,
        user2: other,
        createdAt: past(2),
        updatedAt: past(0),
      })
    }
    if (p.match(/^messages\/conversations\/\d+\/messages$/) && method === 'get') {
      const convId = Number(p.split('/')[2])
      const list = mockMessages
        .filter((m) => m.conversationId === convId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const page = Number(query.page) || 1
      const pageSize = Number(query.pageSize) || 50
      const result = paginate(list, page, pageSize)
      return mockResponse({ messages: result.data })
    }
    if (p.match(/^messages\/conversations\/\d+\/messages$/) && method === 'post') {
      const convId = Number(p.split('/')[2])
      const body = (config.data as { body?: string })?.body || ''
      const newMsg = {
        id: mockMessages.length + 1,
        conversationId: convId,
        senderId: mockCurrentUser.id,
        body,
        createdAt: new Date().toISOString(),
        readAt: null as string | null,
        sender: mockCurrentUser,
      }
      mockMessages.push(newMsg)
      const conv = mockConversations.find((c) => c.id === convId)
      if (conv) {
        conv.lastBody = body.length > 80 ? body.slice(0, 80) + '…' : body
        conv.lastAt = newMsg.createdAt
        conv.updatedAt = newMsg.createdAt
      }
      return mockResponse(newMsg, 201)
    }
    if (p.match(/^messages\/conversations\/\d+\/read$/) && method === 'post') {
      return mockResponse({ message: 'ok' })
    }
    if (p === 'friends/requests' && method === 'get') {
      return mockResponse({ received: mockFriendRequests.received, sent: mockFriendRequests.sent })
    }
    if (p.match(/^friends\/requests\/\d+$/) && method === 'post') {
      return mockResponse(undefined as never, 204)
    }
    if (p.match(/^friends\/requests\/\d+\/(accept|reject)$/) && method === 'post') {
      return mockResponse(undefined as never, 204)
    }
    if (p.match(/^friends\/\d+$/) && method === 'delete') {
      return mockResponse(undefined as never, 204)
    }

    // ——— Notifications ———
    if (p === 'notifications' && method === 'get') {
      const limit = Math.min(Number(query.limit) || 50, 100)
      return mockResponse(mockNotifications.slice(0, limit))
    }
    if (p.match(/^notifications\/\d+\/read$/) && method === 'patch') {
      const id = Number(p.split('/')[1])
      const n = mockNotifications.find((x) => x.id === id)
      if (n) n.readAt = new Date().toISOString()
      return mockResponse(undefined as never, 204)
    }
    if (p === 'notifications/read-all' && method === 'post') {
      const now = new Date().toISOString()
      mockNotifications.forEach((n) => {
        n.readAt = now
      })
      return mockResponse(undefined as never, 204)
    }

    // ——— Social (подписки) ———
    if (p === 'social/followers' && method === 'get') {
      return mockResponse(mockFollowers)
    }
    if (p === 'social/following' && method === 'get') {
      return mockResponse(mockFollowing)
    }
    if (p.match(/^social\/follow\/\d+$/) && method === 'post') {
      return mockResponse({ id: 1, followerId: mockCurrentUser.id, followingId: Number(p.split('/').pop()) }, 201)
    }
    if (p.match(/^social\/follow\/\d+$/) && method === 'delete') {
      return mockResponse(undefined as never, 200)
    }

    // ——— Activity (лента активностей) ———
    if (p === 'activity/me' && method === 'get') {
      const limit = Math.min(Number(query.limit) || 50, 100)
      return mockResponse(mockActivity.slice(0, limit))
    }
    if (p === 'activity/feed' && method === 'get') {
      const limit = Math.min(Number(query.limit) || 50, 100)
      return mockResponse(mockActivityFeed.slice(0, limit))
    }

    // ——— Reviews ———
    if (p === 'reviews' && method === 'get') {
      return mockResponse(mockReviews)
    }
    if (p.match(/^reviews\/movies\/\d+$/) && method === 'post') {
      const movieId = Number(p.split('/').pop())
      const r = {
        ...mockReviews[0],
        id: mockReviews.length + 1,
        movieId,
        createdAt: new Date().toISOString(),
        ...(config.data as object),
      }
      return mockResponse(r)
    }
    if (p.match(/^reviews\/movies\/\d+$/) && method === 'put') {
      const movieId = Number(p.split('/').pop())
      const existing = mockReviews.find(
        (r) => (r as { movieId?: number }).movieId === movieId && r.userId === mockCurrentUser.id
      )
      const r = existing
        ? { ...existing, ...(config.data as object), movieId }
        : {
            ...mockReviews[0],
            id: mockReviews.length + 1,
            movieId,
            createdAt: new Date().toISOString(),
            ...(config.data as object),
          }
      return mockResponse(r)
    }
    if (p.match(/^reviews\/movies\/\d+$/) && method === 'delete') {
      return mockResponse(undefined as never, 204)
    }

    // ——— Comments (create/delete) ———
    if (p.match(/^comments\/(movies|anime|games|manga|books)\/\d+$/) && method === 'post') {
      const text = (config.data as { text?: string })?.text || 'Новый комментарий'
      return mockResponse({
        id: mockComments.length + 1,
        text,
        userId: mockCurrentUser.id,
        user: {
          id: mockCurrentUser.id,
          email: mockCurrentUser.email!,
          name: mockCurrentUser.name,
          avatar: mockCurrentUser.avatar,
        },
        depth: 0,
        createdAt: new Date().toISOString(),
        plusCount: 0,
        minusCount: 0,
      })
    }
    if (p.match(/^comments\/[\w-]+\/\d+$/) && method === 'put') {
      const body = config.data as { text?: string }
      const id = Number(p.split('/').pop())
      return mockResponse(
        {
          id,
          text: body?.text ?? '',
          createdAt: new Date().toISOString(),
          depth: 0,
          plusCount: 0,
          minusCount: 0,
          userId: 0,
          repliesCount: 0,
          replies: [],
        },
        200
      )
    }
    if (p.match(/^comments\/(movies|anime|games|manga|books)\/\d+$/) && method === 'delete') {
      return mockResponse(undefined as never, 204)
    }
    if (p.match(/^\w+\/\d+\/comments\?/)) {
      const entityId = p.split('/')[1]
      if (entityId && !isNaN(Number(entityId))) {
        const collectIds = (list: typeof mockComments): number[] => {
          const ids: number[] = []
          for (const c of list) {
            ids.push(c.id)
            if (c.replies?.length) ids.push(...collectIds(c.replies))
          }
          return ids
        }
        const ids = collectIds(mockComments)
        const emojiReactions: Record<string, { counts: Record<string, number>; myReaction: string }> = {}
        ids.forEach((id) => {
          const data = getCommentEmojiReaction(id)
          emojiReactions[String(id)] = { counts: { ...data.counts }, myReaction: data.myReaction }
        })
        return mockResponse({ comments: mockComments, total: mockComments.length, emojiReactions })
      }
    }
    if (p.match(/^\w+\/\d+\/comments\/\d+\/replies$/)) {
      return mockResponse({ replies: mockComments[0].replies || [] })
    }
    if (p.match(/^[\w-]+\/\d+\/comments\/\d+\/reaction$/) && method === 'post') {
      const raw = config.data
      const body = (
        typeof raw === 'string'
          ? (() => {
              try {
                return JSON.parse(raw)
              } catch {
                return {}
              }
            })()
          : raw
      ) as { value?: number | string }
      const value = body?.value === -1 || body?.value === '-1' ? -1 : 1
      const parts = p.split('/')
      const commentId = Number(parts[parts.indexOf('comments') + 1])
      const comment = findCommentById(mockComments, commentId)
      const prevPlus = comment?.plusCount ?? 0
      const prevMinus = comment?.minusCount ?? 0
      const plusCount = value === 1 ? prevPlus + 1 : prevPlus
      const minusCount = value === -1 ? prevMinus + 1 : prevMinus
      if (comment) {
        comment.plusCount = plusCount
        comment.minusCount = minusCount
      }
      return mockResponse({ plusCount, minusCount }, 200, 'comment reaction')
    }
    if (p === 'comment-emoji-reactions' && method === 'get') {
      const commentIdsStr = query.commentIds || ''
      const commentIds = commentIdsStr
        ? commentIdsStr
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id))
        : []
      const reactions: Record<string, { counts: Record<string, number>; myReaction: string }> = {}
      commentIds.forEach((id) => {
        const data = getCommentEmojiReaction(id)
        reactions[String(id)] = { counts: { ...data.counts }, myReaction: data.myReaction }
      })
      return mockResponse({ reactions }, 200, 'comment emoji reactions')
    }
    if (p === 'comment-emoji-reactions' && method === 'post') {
      const body = (
        typeof config.data === 'string'
          ? (() => {
              try {
                return JSON.parse(config.data as string)
              } catch {
                return {}
              }
            })()
          : config.data
      ) as { entityType?: string; commentId?: number; emoji?: string }
      const commentId = Number(body?.commentId)
      const emoji = typeof body?.emoji === 'string' ? body.emoji : ''
      if (!commentId || !emoji) return mockResponse({ counts: {}, myReaction: '' }, 200)
      const state = getCommentEmojiReaction(commentId)
      const prev = state.myReaction
      if (prev && prev !== emoji && state.counts[prev] !== undefined) {
        state.counts[prev] = Math.max(0, state.counts[prev] - 1)
      }
      state.counts[emoji] = (state.counts[emoji] ?? 0) + 1
      state.myReaction = emoji
      return mockResponse({ counts: { ...state.counts }, myReaction: state.myReaction }, 200, 'comment emoji set')
    }
    if (p.match(/^comment-emoji-reactions\/[\w-]+\/\d+$/) && method === 'delete') {
      const parts = p.split('/')
      const commentId = Number(parts[parts.length - 1])
      if (!commentId) return mockResponse({ counts: {}, myReaction: '' }, 200)
      const state = getCommentEmojiReaction(commentId)
      const prev = state.myReaction
      if (prev && state.counts[prev] !== undefined) {
        state.counts[prev] = Math.max(0, state.counts[prev] - 1)
      }
      state.myReaction = ''
      return mockResponse({ counts: { ...state.counts }, myReaction: '' }, 200, 'comment emoji delete')
    }

    // ——— Search semantic (тестовые данные: фильмы, аниме, игры; фильтр по вхождению запроса в название) ———
    if (p === 'search/semantic' && method === 'get') {
      const q = (query.q || '').toLowerCase()
      const mediaTypeParam = (query.mediaType || query.media_type || '').toLowerCase()
      const movies = mockMovies.map((m) => ({
        mediaId: m.id,
        mediaType: 'movie',
        title: m.title,
        score: 0.92,
        poster: m.poster,
        description: m.description,
      }))
      const anime = mockAnime.map((m) => ({
        mediaId: m.id,
        mediaType: 'anime',
        title: m.title,
        score: 0.88,
        poster: m.poster,
        description: m.description,
      }))
      const games = mockGames.map((m) => ({
        mediaId: m.id,
        mediaType: 'game',
        title: m.title,
        score: 0.85,
        poster: m.poster,
        description: m.description,
      }))
      let all = [...movies, ...anime, ...games]
      if (mediaTypeParam === 'movie' || mediaTypeParam === 'movies') all = movies
      else if (mediaTypeParam === 'anime' || mediaTypeParam === 'animeseries') all = anime
      else if (mediaTypeParam === 'game' || mediaTypeParam === 'games') all = games
      const results = q ? all.filter((i) => i.title.toLowerCase().includes(q)) : all.slice(0, 24)
      return mockResponse({ results })
    }

    // ——— Similar / Trending (упрощённо) ———
    if (p.startsWith('similar/')) {
      return mockResponse({ data: mockMovies.slice(0, 6) })
    }
    if (p === 'trending') {
      return mockResponse({ movies: mockMovies.slice(0, 5), anime: mockAnime.slice(0, 3) })
    }

    // ——— Ranobe (light-novels API path) ———
    if (p === 'light-novels' && method === 'get') {
      const {
        page,
        pageSize,
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      } = getListParams(query, config)
      const filtered = filterAndSortMedia(mockLightNovels, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        publisherIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('light-novels')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^light-novels\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockLightNovels.find((l) => l.id === id) || mockLightNovels[0]
      const similar = mockLightNovels.filter((l) => l.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'light-novels/popular' && method === 'get') {
      return mockResponse(mockLightNovels.slice(0, Number(query.limit) || 10))
    }
    if (p === 'light-novels/search' && method === 'get') {
      const q = (query.q || '').toLowerCase()
      const filtered = q ? mockLightNovels.filter((l) => l.title.toLowerCase().includes(q)) : mockLightNovels
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Cartoon Series ———
    if (p === 'cartoon-series' && method === 'get') {
      const { page, pageSize, genreIds, themeIds, countries, studioIds, yearFrom, yearTo, sortBy, order } =
        getListParams(query, config)
      const filtered = filterAndSortMedia(mockCartoonSeries, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('cartoon-series')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^cartoon-series\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockCartoonSeries.find((c) => c.id === id) || mockCartoonSeries[0]
      const similar = mockCartoonSeries.filter((c) => c.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'cartoon-series/popular' && method === 'get') {
      return mockResponse(mockCartoonSeries.slice(0, Number(query.limit) || 10))
    }
    if (p === 'cartoon-series/search' && method === 'get') {
      const q = (query.q || '').toLowerCase()
      const filtered = q ? mockCartoonSeries.filter((c) => c.title.toLowerCase().includes(q)) : mockCartoonSeries
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Cartoon Movies ———
    if (p === 'cartoon-movies' && method === 'get') {
      const { page, pageSize, genreIds, themeIds, countries, studioIds, yearFrom, yearTo, sortBy, order } =
        getListParams(query, config)
      const filtered = filterAndSortMedia(mockCartoonMovies, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('cartoon-movies')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^cartoon-movies\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockCartoonMovies.find((c) => c.id === id) || mockCartoonMovies[0]
      const similar = mockCartoonMovies.filter((c) => c.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'cartoon-movies/popular' && method === 'get') {
      return mockResponse(mockCartoonMovies.slice(0, Number(query.limit) || 10))
    }
    if (p === 'cartoon-movies/search' && method === 'get') {
      const q = (query.q || '').toLowerCase()
      const filtered = q ? mockCartoonMovies.filter((c) => c.title.toLowerCase().includes(q)) : mockCartoonMovies
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Anime Movies ———
    if (p === 'anime-movies' && method === 'get') {
      const { page, pageSize, genreIds, themeIds, countries, studioIds, yearFrom, yearTo, sortBy, order } =
        getListParams(query, config)
      const filtered = filterAndSortMedia(mockAnimeMovies, {
        genreIds,
        themeIds,
        countries,
        studioIds,
        yearFrom,
        yearTo,
        sortBy,
        order,
      })
      const result = paginate(filtered, page, pageSize)
      const statusMap = getListStatusByMediaId('anime-movies')
      result.data = result.data.map((m) => ({ ...m, listStatus: statusMap[m.id] }))
      return mockResponse(result)
    }
    if (/^anime-movies\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const item = mockAnimeMovies.find((a) => a.id === id) || mockAnimeMovies[0]
      const similar = mockAnimeMovies.filter((a) => a.id !== item.id).slice(0, 12)
      const cast = id === 1 ? mockCast.slice(0, 4) : []
      return mockResponse({ ...item, ageRating: (item as { ageRating?: string }).ageRating ?? 'pg', similar, cast })
    }
    if (p === 'anime-movies/popular' && method === 'get') {
      return mockResponse(mockAnimeMovies.slice(0, Number(query.limit) || 10))
    }
    if (p === 'anime-movies/search' && method === 'get') {
      const q = (query.q || '').toLowerCase()
      const filtered = q ? mockAnimeMovies.filter((a) => a.title.toLowerCase().includes(q)) : mockAnimeMovies
      return mockResponse(paginate(filtered, Number(query.page) || 1, 20))
    }

    // ——— Characters (список для админки и страницы; один по id) ———
    if (p === 'characters' && method === 'get') {
      const page = Number(query.page) || 1
      const pageSize = Number(query.pageSize) || 20
      const search = (query.search || '').toLowerCase()
      let list = [...mockCharacters]
      if (search) {
        list = list.filter(
          (c) =>
            String(c.id).includes(search) ||
            (c.name ?? '').toLowerCase().includes(search) ||
            (c.description ?? '').toLowerCase().includes(search)
        )
      }
      const result = paginate(list, page, pageSize)
      return mockResponse(result, 200, 'characters list')
    }
    if (/^characters\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const char = mockCharacters.find((c) => c.id === id)
      return mockResponse(char || mockCharacters[0])
    }
    if (/^characters\/\d+\/appearances$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const appearances = getMockCharacterAppearances(id)
      return mockResponse(appearances)
    }

    // ——— Persons ———
    if (p === 'persons' && method === 'get') {
      const page = parseInt(query.page || '1', 10)
      const pageSize = parseInt(query.pageSize || '50', 10)
      const search = (query.search || '').toLowerCase()
      let list = mockPersons
      if (search) {
        list = mockPersons.filter(
          (pr) =>
            String(pr.id).includes(search) ||
            (pr.firstName ?? '').toLowerCase().includes(search) ||
            (pr.lastName ?? '').toLowerCase().includes(search)
        )
      }
      const result = paginate(list, page, pageSize)
      return mockResponse(result, 200, 'persons list')
    }
    if (/^persons\/\d+$/.test(p) && method === 'get') {
      const id = Number(p.split('/')[1])
      const person = mockPersons.find((pr) => pr.id === id)
      const base = person || mockPersons[0]
      const works = mockPersonWorksByPersonId[base.id]
      return mockResponse(works ? { ...base, works } : base)
    }

    // ——— Admin: обновление медиа и персон (мок — принимаем и возвращаем 200) ———
    if (/^admin\/movies\/\d+$/.test(p) && method === 'put') {
      const id = Number(p.replace(/^admin\/movies\//, ''))
      const movie = mockMovies.find((m) => m.id === id) || mockMovies[0]
      const body = asRecordOrEmpty(config.data)
      return mockResponse({ ...movie, ...body, id }, 200, 'admin update movie')
    }
    if (p === 'admin/persons' && method === 'post') {
      const body = config.data as {
        firstName?: string
        lastName?: string
        birthDate?: string
        country?: string
        biography?: string
        profession?: string[]
        avatar?: string
        images?: (string | { url: string; caption?: string })[]
      }
      const newId = mockPersons.length > 0 ? Math.max(...mockPersons.map((pr) => pr.id)) + 1 : 1
      const created = {
        id: newId,
        firstName: body.firstName ?? '',
        lastName: body.lastName ?? '',
        birthDate: body.birthDate ?? undefined,
        country: body.country ?? undefined,
        biography: body.biography ?? undefined,
        profession: body.profession ?? [],
        avatar: body.avatar ?? undefined,
        images: body.images ?? undefined,
      }
      mockPersons.push(created as Person)
      return mockResponse(created, 201, 'admin create person')
    }
    if (/^admin\/persons\/\d+$/.test(p) && method === 'put') {
      const id = Number(p.replace(/^admin\/persons\//, ''))
      const person = mockPersons.find((pr) => pr.id === id) || mockPersons[0]
      const body = asRecordOrEmpty(config.data)
      return mockResponse({ ...person, ...body, id }, 200, 'admin update person')
    }
    if (p === 'admin/franchises' && method === 'post') {
      const body = (config.data as { name: string; nameI18n?: Record<string, string> }) || { name: 'New Franchise' }
      return mockResponse(
        {
          id: mockFranchises.length + 1,
          name: body.name,
          nameI18n: body.nameI18n ?? undefined,
          description: null,
          poster: null,
          aliases: [],
        },
        201
      )
    }
    if (/^admin\/franchises\/\d+$/.test(p) && method === 'put') {
      const id = Number(p.replace(/^admin\/franchises\//, ''))
      const fr = mockFranchises.find((f) => f.id === id) || mockFranchises[0]
      const body = asRecordOrEmpty(config.data)
      return mockResponse({ ...fr, ...body, id }, 200)
    }
    if (/^admin\/franchises\/\d+$/.test(p) && method === 'delete') {
      return mockResponse(undefined as never, 200)
    }
    if (/^admin\/franchises\/\d+\/links$/.test(p) && method === 'post') {
      const id = Number(p.replace(/^admin\/franchises\//, '').replace(/\/links$/, ''))
      const body = config.data as {
        fromMediaType: string
        fromMediaId: number
        toMediaType: string
        toMediaId: number
        relationType: string
      }
      return mockResponse(
        {
          id: 100 + id,
          franchiseId: id,
          fromMediaType: body?.fromMediaType ?? 'movie',
          fromMediaId: body?.fromMediaId ?? 0,
          toMediaType: body?.toMediaType ?? 'movie',
          toMediaId: body?.toMediaId ?? 0,
          relationType: body?.relationType ?? 'sequel',
        },
        201
      )
    }
    if (/^admin\/franchises\/links\/\d+$/.test(p) && method === 'put') {
      const linkId = Number(p.replace(/^admin\/franchises\/links\//, ''))
      const body = asRecordOrEmpty(config.data)
      return mockResponse(
        {
          id: linkId,
          franchiseId: 1,
          fromMediaType: 'movie',
          fromMediaId: 1,
          toMediaType: 'movie',
          toMediaId: 2,
          relationType: 'sequel',
          ...body,
        },
        200
      )
    }
    if (/^admin\/franchises\/links\/\d+$/.test(p) && method === 'delete') {
      return mockResponse(undefined as never, 200)
    }
    if (p === 'admin/characters' && method === 'post') {
      const body = (config.data as { name: string; description?: string; avatar?: string }) || { name: 'Character' }
      const newId = Math.max(0, ...mockCharacters.map((c) => c.id)) + 1
      const created = { id: newId, name: body.name, description: body.description, avatar: body.avatar }
      return mockResponse(created, 201)
    }
    if (/^admin\/characters\/\d+$/.test(p) && (method === 'put' || method === 'delete')) {
      if (method === 'delete') return mockResponse(undefined as never, 200)
      const id = Number(p.replace(/^admin\/characters\//, ''))
      const ch = mockCharacters.find((c) => c.id === id) || mockCharacters[0]
      const body = asRecordOrEmpty(config.data)
      return mockResponse({ ...ch, ...body, id }, 200)
    }
    if (p === 'admin/cast' && method === 'get') {
      const list: Array<{
        id: number
        characterId?: number
        character?: unknown
        personId?: number
        person?: unknown
        role?: string
        roleType?: string
        poster?: string
        mediaType: string
        mediaId: number
      }> = []
      for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
        const mediaId = Number(movieIdStr)
        for (const c of casts) {
          list.push({ ...c, mediaType: 'movie', mediaId })
        }
      }
      return mockResponse(list, 200, 'cast list')
    }
    if (/^admin\/cast\/\d+$/.test(p) && method === 'put') {
      const id = Number(p.replace(/^admin\/cast\//, ''))
      const body = config.data as { role?: string; roleType?: string }
      for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
        const mediaId = Number(movieIdStr)
        const c = casts.find((x) => x.id === id)
        if (c) {
          if (body.role != null) (c as { role?: string }).role = body.role
          if (body.roleType != null) (c as { roleType?: string }).roleType = body.roleType
          return mockResponse({ ...c, mediaType: 'movie', mediaId }, 200, 'admin update cast')
        }
      }
      return mockResponse({ error: 'Cast not found' } as never, 404)
    }
    if (p === 'admin/staff' && method === 'get') {
      // В моке: персонал из каста — записи с ролью «Режиссёр» по каждому фильму.
      const staffList: Array<{
        id: number
        movieId?: number
        mediaId?: number
        mediaType?: string
        personId: number
        person?: Person
        profession: string
      }> = []
      let sid = 1
      for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
        const mediaId = Number(movieIdStr)
        for (const c of casts) {
          if (c.role === 'Режиссёр' && c.personId != null) {
            staffList.push({
              id: sid++,
              movieId: mediaId,
              mediaId,
              mediaType: 'movie',
              personId: c.personId,
              person: c.person,
              profession: c.role,
            })
          }
        }
      }
      return mockResponse(staffList, 200, 'staff list')
    }

    // ——— Admin Movies: create, update, delete ———
    if (p === 'admin/movies' && method === 'post') {
      const body = config.data as {
        title: string
        description?: string
        releaseDate?: string
        poster?: string
        rating?: number
        ageRating?: string
        duration?: number
        country?: string
        genreIds?: number[]
        themeIds?: number[]
        studioIds?: number[]
        isHidden?: boolean
        status?: string
      }
      const newId = mockMovies.length > 0 ? Math.max(...mockMovies.map((m) => m.id)) + 1 : 1
      const genres = (body.genreIds ?? []).map((gid) => mockGenres.find((g) => g.id === gid)).filter(Boolean) as Genre[]
      const themes = (body.themeIds ?? []).map((tid) => mockThemes.find((t) => t.id === tid)).filter(Boolean) as Theme[]
      const studios = (body.studioIds ?? [])
        .map((sid) => mockStudios.find((s) => s.id === sid))
        .filter(Boolean) as Studio[]
      const newMovie: Movie = {
        id: newId,
        title: body.title || 'Новый фильм',
        description: body.description,
        releaseDate: body.releaseDate,
        poster: body.poster,
        rating: body.rating,
        ageRating: body.ageRating,
        duration: body.duration,
        country: body.country,
        genres,
        themes,
        studios,
        isHidden: body.isHidden ?? false,
        status: body.status,
      }
      mockMovies.push(newMovie)
      return mockResponse(newMovie, 201, 'admin create movie')
    }
    if (/^admin\/movies\/\d+$/.test(p)) {
      const id = Number(p.replace(/^admin\/movies\//, ''))
      const idx = mockMovies.findIndex((m) => m.id === id)
      if (method === 'put') {
        const body = asRecordOrEmpty(config.data)
        if (idx === -1) return mockResponse({ error: 'Movie not found' } as never, 404)
        const m = mockMovies[idx]
        if (body.title != null) m.title = body.title as string
        if (body.description != null) m.description = body.description as string
        if (body.releaseDate != null) m.releaseDate = body.releaseDate as string
        if (body.poster != null) m.poster = body.poster as string
        if (body.rating != null) m.rating = body.rating as number
        if (body.ageRating != null) m.ageRating = body.ageRating as string
        if (body.duration != null) m.duration = body.duration as number
        if (body.country != null) m.country = body.country as string
        if (body.isHidden != null) m.isHidden = body.isHidden as boolean
        if (body.status != null) m.status = body.status as string
        if (Array.isArray(body.genreIds))
          m.genres = body.genreIds.map((gid: number) => mockGenres.find((g) => g.id === gid)).filter(Boolean) as Genre[]
        if (Array.isArray(body.themeIds))
          m.themes = body.themeIds.map((tid: number) => mockThemes.find((t) => t.id === tid)).filter(Boolean) as Theme[]
        if (Array.isArray(body.studioIds))
          m.studios = body.studioIds
            .map((sid: number) => mockStudios.find((s) => s.id === sid))
            .filter(Boolean) as Studio[]
        return mockResponse(m, 200, 'admin update movie')
      }
      if (method === 'delete') {
        if (idx !== -1) mockMovies.splice(idx, 1)
        return mockResponse(undefined as never, 200)
      }
    }

    // В режиме мока не дергаем реальный API — иначе запрос уйдёт в proxy и даст ECONNREFUSED
    if (isMockEnabled()) {
      if (MOCK_LOG && console.info)
        console.info('[Mock] ⚠ Необработанный путь (нет мок-данных):', method.toUpperCase(), p)
      return Promise.reject({
        response: { status: 404, data: { error: 'Not mocked: ' + p } },
        message: 'Not mocked: ' + p,
      }) as Promise<AxiosResponse>
    }
    return defaultAdapter(config)
  }
}

/** Включены ли моки: при запуске npm run dev:mock (vite --mode mock) или VITE_USE_MOCK=true в .env */
export const isMockEnabled = (): boolean => {
  if (typeof import.meta.env === 'undefined') return false
  if (import.meta.env.VITE_USE_MOCK === 'true') return true
  if (import.meta.env.MODE === 'mock') return true
  return false
}
