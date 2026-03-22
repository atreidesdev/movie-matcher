package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
	"github.com/movie-matcher/backend/internal/ws"
)

// Статические файлы (uploads) и порт задаются в main.
func RegisterRoutes(r *gin.Engine) {
	r.GET("/ws/comments/:entityType/:entityId", ws.ServeCommentsWS)

	api := r.Group("/api/v1")
	api.Use(middleware.RequestIDMiddleware())
	api.Use(func(c *gin.Context) { c.Set(deps.ContextKey, deps.Default()); c.Next() })
	{
		api.GET("/stream/video", handlers.StreamVideo)
		registerAuth(api)
		api.GET("/review-reactions/:targetType/:targetId", middleware.OptionalAuthMiddleware(), handlers.GetReviewReactions)
		api.GET("/review-reactions/batch", middleware.OptionalAuthMiddleware(), handlers.GetReviewReactionsBatch)
		api.GET("/comment-emoji-reactions", middleware.OptionalAuthMiddleware(), handlers.GetCommentEmojiReactions)
		registerUsers(api)
		registerMedia(api)
		registerMediaUnified(api)
		registerCatalog(api)
		registerProtected(api)
		registerCommentsPublic(api)
		registerDiscussions(api)
		registerFranchises(api)
		registerPersons(api)
		registerCharacters(api)
		registerCast(api)
		registerTrendingAndSimilar(api)
		registerAchievements(api)
		registerCalendar(api)
		registerDevBlog(api)
		registerNews(api)
		registerCommunities(api)
		registerAdmin(api)
	}
}

func registerAuth(api *gin.RouterGroup) {
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.POST("/logout", handlers.Logout)
		auth.POST("/refresh", handlers.Refresh)
		auth.GET("/me", middleware.AuthMiddleware(), handlers.GetCurrentUser)
		auth.POST("/forgot-password", handlers.ForgotPassword)
		auth.POST("/reset-password", handlers.ResetPassword)
		auth.POST("/logout-others", middleware.AuthMiddleware(), handlers.LogoutOthers)
		auth.GET("/sessions", middleware.AuthMiddleware(), handlers.GetSessions)
		auth.DELETE("/sessions/:id", middleware.AuthMiddleware(), handlers.RevokeSession)
	}
}

func registerUsers(api *gin.RouterGroup) {
	api.GET("/users/search", middleware.OptionalAuthMiddleware(), handlers.SearchUsers)
	api.GET("/users", middleware.OptionalAuthMiddleware(), handlers.GetUsersActivity)
	api.GET("/users/username/:username", middleware.OptionalAuthMiddleware(), handlers.GetUserByUsername)
	api.GET("/users/username/:username/collections", handlers.GetUserCollectionsByUsername)
	api.GET("/users/username/:username/reviews", middleware.OptionalAuthMiddleware(), handlers.GetUserReviewsByUsername)
	api.GET("/users/username/:username/favorites", middleware.OptionalAuthMiddleware(), handlers.GetUserFavoritesByUsername)
	api.GET("/users/username/:username/friends", middleware.OptionalAuthMiddleware(), handlers.GetUserFriendsByUsername)
	api.GET("/users/username/:username/followers", middleware.OptionalAuthMiddleware(), handlers.GetUserFollowersByUsername)
	api.GET("/users/username/:username/community-subscriptions", middleware.OptionalAuthMiddleware(), handlers.GetUserCommunitySubscriptionsByUsername)
	api.GET("/users/username/:username/lists/:type", middleware.OptionalAuthMiddleware(), handlers.GetUserListByUsername)
	api.GET("/users/username/:username/achievements", middleware.OptionalAuthMiddleware(), handlers.GetUserAchievementsByUsername)
	api.GET("/users/:id", middleware.OptionalAuthMiddleware(), handlers.GetUserByID)

	// Публичные (сайтовые) коллекции — список без авторизации; деталь с опциональной авторизацией (для listStatus юзера)
	api.GET("/public-collections", handlers.GetPublicCollections)
	api.GET("/public-collections/:id", middleware.OptionalAuthMiddleware(), handlers.GetPublicCollection)
}
