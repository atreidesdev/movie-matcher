package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
)

func registerDiscussions(api *gin.RouterGroup) {
	api.GET("/discussions", handlers.ListDiscussions)
	api.GET("/discussions/:id", handlers.GetDiscussion)
	api.GET("/discussions/:id/comments", handlers.GetDiscussionComments)
	api.GET("/discussions/:id/comments/:commentId/replies", handlers.GetDiscussionCommentReplies)
}
