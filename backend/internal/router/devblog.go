package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
)

func registerDevBlog(api *gin.RouterGroup) {
	devblog := api.Group("/devblog")
	{
		devblog.GET("", handlers.DevBlogList)
		devblog.GET("/:id", handlers.DevBlogGet)
	}
}
