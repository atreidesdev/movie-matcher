package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
)

func registerCast(api *gin.RouterGroup) {
	cast := api.Group("/cast")
	{
		cast.GET("", handlers.GetCasts)
		cast.GET("/search", handlers.SearchCasts)
		cast.GET("/:id", handlers.GetCast)
		cast.GET("/:id/media", handlers.GetCastMedia)
	}

	api.GET("/movies/:id/cast", handlers.GetMovieCast)
	api.GET("/movies/:id/staff", handlers.GetMovieStaff)
	api.GET("/anime/:id/cast", handlers.GetAnimeCast)
	api.GET("/games/:id/cast", handlers.GetGameCast)
}
