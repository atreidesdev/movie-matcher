package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerNews(api *gin.RouterGroup) {
	news := api.Group("/news")
	{
		news.GET("", handlers.NewsList)
		news.GET("/tags", handlers.NewsTags) // до /:id, иначе "tags" попадёт как id
		news.GET("/:id", handlers.NewsGet)
		news.GET("/:id/comments", handlers.NewsCommentsList)
		news.POST("/:id/comments", middleware.AuthMiddleware(), handlers.NewsCommentCreate)
		news.PUT("/:id/comments/:commentId", middleware.AuthMiddleware(), handlers.NewsCommentUpdate)
		news.DELETE("/:id/comments/:commentId", middleware.AuthMiddleware(), handlers.NewsCommentDelete)
	}
}
