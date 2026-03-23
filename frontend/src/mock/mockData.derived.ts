import { paginate } from '@/mock/data/listUtils'
import { type MockActivityItem, type MockConversationItem, type MockMessageItem, type MockNotificationItem } from '@/mock/data/social'
import { assembled } from '@/mock/mockData.runtime'

const derivedMocks = assembled.derivedMocks

export const mockListItems = assembled.listProfiles.mockListItems
export const mockListItemsAlice = assembled.listProfiles.mockListItemsAlice
export const mockListItemsBob = assembled.listProfiles.mockListItemsBob
export const mockPublicProfile = assembled.listProfiles.mockPublicProfile
export const mockPublicProfileAlice = assembled.listProfiles.mockPublicProfileAlice
export const mockPublicProfileBob = assembled.listProfiles.mockPublicProfileBob
export const getMockProfileByUsername = assembled.listProfiles.getMockProfileByUsername

export const mockFavorites = derivedMocks.favoritesData.mockFavorites
export const mockFavoritesBob = derivedMocks.favoritesData.mockFavoritesBob
export const mockFavoritesAlice = derivedMocks.favoritesData.mockFavoritesAlice
export const mockCollections = derivedMocks.mockCollections
export const mockRecommendations = derivedMocks.mockRecommendations
export const mockFranchises = derivedMocks.franchiseMocks.mockFranchises
export const getMockFranchiseLinksByFranchiseId = derivedMocks.franchiseMocks.getMockFranchiseLinksByFranchiseId
export const getMockFranchiseLinksByMedia = derivedMocks.franchiseMocks.getMockFranchiseLinksByMedia
export const mockReviews = derivedMocks.reviewsCommentsMocks.mockReviews
export const mockComments = derivedMocks.reviewsCommentsMocks.mockComments

export type { MockNotificationItem, MockConversationItem, MockMessageItem, MockActivityItem }
export const mockFriendRequestsReceived = derivedMocks.socialMocks.mockFriendRequestsReceived
export const mockFriendRequestsSent = derivedMocks.socialMocks.mockFriendRequestsSent
export const mockFriendRequests = derivedMocks.socialMocks.mockFriendRequests
export const mockFriends = derivedMocks.socialMocks.mockFriends
export const mockNotifications = derivedMocks.socialMocks.mockNotifications
export const mockConversations = derivedMocks.socialMocks.mockConversations
export const mockMessages = derivedMocks.socialMocks.mockMessages
export const mockFollowers = derivedMocks.socialMocks.mockFollowers
export const mockFollowing = derivedMocks.socialMocks.mockFollowing
export const mockActivity = derivedMocks.socialMocks.mockActivity
export const mockActivityFeed = derivedMocks.socialMocks.mockActivityFeed

export const getFiltersGenresAndThemesForMediaType = assembled.getFiltersGenresAndThemesForMediaType
export const getListStatusByMediaId = assembled.getListStatusByMediaId
export { paginate }

export const getMockAchievements = assembled.getMockAchievements
const moderationMocks = assembled.moderationMocks
export const mockReports = moderationMocks.mockReports
export const mockReportTemplatesSeed = moderationMocks.mockReportTemplatesSeed
export const mockCommentBannedUsers = moderationMocks.mockCommentBannedUsers
