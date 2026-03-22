package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
)

func registerCommentsPublic(api *gin.RouterGroup) {
	api.GET("/movies/:id/comments/:commentId/replies", handlers.GetMovieCommentReplies)
	api.GET("/movies/:id/comments", handlers.GetMovieComments)
	api.GET("/tv-series/:id/comments/:commentId/replies", handlers.GetTVSeriesCommentReplies)
	api.GET("/tv-series/:id/comments", handlers.GetTVSeriesComments)
	api.GET("/cartoon-series/:id/comments/:commentId/replies", handlers.GetCartoonSeriesCommentReplies)
	api.GET("/cartoon-series/:id/comments", handlers.GetCartoonSeriesComments)
	api.GET("/cartoon-movies/:id/comments/:commentId/replies", handlers.GetCartoonMovieCommentReplies)
	api.GET("/cartoon-movies/:id/comments", handlers.GetCartoonMovieComments)
	api.GET("/anime/:id/comments/:commentId/replies", handlers.GetAnimeCommentReplies)
	api.GET("/anime/:id/comments", handlers.GetAnimeComments)
	api.GET("/anime-movies/:id/comments/:commentId/replies", handlers.GetAnimeMovieCommentReplies)
	api.GET("/anime-movies/:id/comments", handlers.GetAnimeMovieComments)
	api.GET("/games/:id/comments/:commentId/replies", handlers.GetGameCommentReplies)
	api.GET("/games/:id/comments", handlers.GetGameComments)
	api.GET("/manga/:id/comments/:commentId/replies", handlers.GetMangaCommentReplies)
	api.GET("/manga/:id/comments", handlers.GetMangaComments)
	api.GET("/books/:id/comments/:commentId/replies", handlers.GetBookCommentReplies)
	api.GET("/books/:id/comments", handlers.GetBookComments)
	api.GET("/light-novels/:id/comments/:commentId/replies", handlers.GetLightNovelCommentReplies)
	api.GET("/light-novels/:id/comments", handlers.GetLightNovelComments)
}
