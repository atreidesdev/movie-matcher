package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerFranchises(api *gin.RouterGroup) {
	franchises := api.Group("/franchises")
	{
		// listStatus в ответе только для авторизованных — OptionalAuth подставляет userID
		franchises.GET("/by-media", middleware.OptionalAuthMiddleware(), handlers.GetFranchiseLinksByMedia)
		franchises.GET("", handlers.GetFranchises)
		franchises.GET("/search", handlers.SearchFranchises)
		franchises.GET("/:id", handlers.GetFranchise)
		franchises.GET("/:id/media", handlers.GetFranchiseMedia)
	}
}
