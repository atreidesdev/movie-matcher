package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerAchievements(api *gin.RouterGroup) {
	api.GET("/achievements", middleware.OptionalAuthMiddleware(), handlers.GetAchievements)
}
