package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
)

func registerPersons(api *gin.RouterGroup) {
	persons := api.Group("/persons")
	{
		persons.GET("", handlers.GetPersons)
		persons.GET("/popular", handlers.GetPopularPersons)
		persons.GET("/search", handlers.SearchPersons)
		persons.GET("/filters", handlers.GetPersonFilters)
		persons.GET("/:id", handlers.GetPerson)
		persons.GET("/:id/credits", handlers.GetPersonCredits)
		persons.GET("/:id/movies", handlers.GetPersonMovies)
		persons.GET("/:id/anime", handlers.GetPersonAnime)
		persons.GET("/:id/comments/:commentId/replies", handlers.GetPersonCommentReplies)
		persons.GET("/:id/comments", handlers.GetPersonComments)
	}
}
