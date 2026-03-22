package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
)

func registerCharacters(api *gin.RouterGroup) {
	characters := api.Group("/characters")
	{
		characters.GET("", handlers.GetCharacters)
		characters.GET("/popular", handlers.GetPopularCharacters)
		characters.GET("/search", handlers.SearchCharacters)
		characters.GET("/:id", handlers.GetCharacter)
		characters.GET("/:id/voice-actors", handlers.GetCharacterVoiceActors)
		characters.GET("/:id/appearances", handlers.GetCharacterAppearances)
		characters.GET("/:id/comments/:commentId/replies", handlers.GetCharacterCommentReplies)
		characters.GET("/:id/comments", handlers.GetCharacterComments)
	}
}
