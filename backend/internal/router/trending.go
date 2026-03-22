package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
)

func registerTrendingAndSimilar(api *gin.RouterGroup) {
	api.GET("/trending", handlers.GetTrending)
	api.GET("/stats/:type/:id", handlers.GetPopularityStats)
	api.GET("/similar/store/:entityType/:id", handlers.GetPrecomputedSimilar)
}
