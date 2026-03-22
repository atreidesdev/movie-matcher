package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerCalendar(api *gin.RouterGroup) {
	api.GET("/calendar/releases", middleware.OptionalAuthMiddleware(), handlers.GetCalendarReleases)
}

func registerCatalog(api *gin.RouterGroup) {
	genres := api.Group("/genres")
	{
		genres.GET("", handlers.GetGenres)
		genres.GET("/:id", handlers.GetGenre)
	}

	api.GET("/themes", handlers.GetThemes)
	api.GET("/platforms", handlers.GetPlatforms)
	api.GET("/studios", handlers.GetStudios)
	api.GET("/studios/:id", handlers.GetStudio)
	api.GET("/developers", handlers.GetDevelopers)
	api.GET("/developers/:id", handlers.GetDeveloper)
	api.GET("/publishers", handlers.GetPublishers)
	api.GET("/publishers/:id", handlers.GetPublisher)
	api.GET("/search/semantic", handlers.SemanticSearch)
}
