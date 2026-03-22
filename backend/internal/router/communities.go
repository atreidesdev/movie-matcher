package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerCommunities(api *gin.RouterGroup) {
	comm := api.Group("/communities")
	{
		comm.GET("", middleware.OptionalAuthMiddleware(), handlers.CommunitiesList)
		comm.POST("", middleware.AuthMiddleware(), handlers.CommunitiesCreate)
		comm.GET("/feed", middleware.AuthMiddleware(), handlers.CommunitiesFeed)
		comm.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.CommunityGet)
		comm.PUT("/:id", middleware.AuthMiddleware(), handlers.CommunityUpdate)
		comm.DELETE("/:id", middleware.AuthMiddleware(), handlers.CommunityDelete)
		comm.POST("/:id/subscribe", middleware.AuthMiddleware(), handlers.CommunitySubscribe)
		comm.POST("/:id/unsubscribe", middleware.AuthMiddleware(), handlers.CommunityUnsubscribe)
		comm.GET("/:id/posts", handlers.CommunityPostsList)
		comm.POST("/:id/posts", middleware.AuthMiddleware(), handlers.CommunityPostCreate)
		comm.POST("/:id/posts/upload", middleware.AuthMiddleware(), handlers.CommunityPostUpload)
		comm.GET("/:id/posts/:postId", handlers.CommunityPostGet)
		comm.PUT("/:id/posts/:postId", middleware.AuthMiddleware(), handlers.CommunityPostUpdate)
		comm.DELETE("/:id/posts/:postId", middleware.AuthMiddleware(), handlers.CommunityPostDelete)
	}
}
