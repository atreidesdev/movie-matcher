package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/services"
)

// SemanticSearch godoc
// @Summary Semantic search by description/meaning
// @Description Search media by semantic similarity to the query (description, themes, mood). Requires recommendation service.
// @Tags search
// @Param q query string true "Search query (by meaning)"
// @Param mediaType query string false "Filter: movie, anime, game, etc."
// @Param limit query int false "Max results (default 20)"
// @Success 200 {object} services.SemanticSearchResponse
// @Router /search/semantic [get]
func SemanticSearch(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		api.RespondBadRequest(c, "Query 'q' is required", nil)
		return
	}

	mediaType := c.DefaultQuery("mediaType", "")
	limit := c.DefaultQuery("limit", "20")

	result, err := services.GetSemanticSearch(query, mediaType, limit)
	if err != nil {
		api.RespondError(c, http.StatusServiceUnavailable, api.ErrCodeInternal, "Semantic search unavailable", err.Error())
		return
	}

	c.JSON(http.StatusOK, result)
}
