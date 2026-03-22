package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

type SimilarItem struct {
	SimilarEntityType string  `json:"similarEntityType"`
	SimilarEntityID   uint    `json:"similarEntityId"`
	Source            string  `json:"source"` // "content" | "users"
	SameType          bool    `json:"sameType"`
	Score             float64 `json:"score"`
}

type PrecomputedSimilarResponse struct {
	EntityType string        `json:"entityType"`
	EntityID   uint          `json:"entityId"`
	SameType   []SimilarItem `json:"sameType"`   // среди своего типа (content + users)
	CrossType  []SimilarItem `json:"crossType"`  // среди других типов
}

// GetPrecomputedSimilar godoc
// @Summary  Get precomputed similar entities
// @Tags     Similar
// @Param    entityType  path   string  true   "Entity type"
// @Param    id          path   int     true   "Entity ID"
// @Param    source      query  string  false  "content|users"
// @Param    limit       query  int     false  "Limit"  default(20)
// @Success  200  {object}  PrecomputedSimilarResponse
// @Router   /similar/store/{entityType}/{id} [get]
func GetPrecomputedSimilar(c *gin.Context) {
	entityType := c.Param("entityType")
	idStr := c.Param("id")
	source := c.Query("source") // пусто = оба, "content" или "users"
	limit := 20
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "20")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	entityID, ok := api.ParseUintParamValue(c, idStr, "id")
	if !ok {
		return
	}

	db := deps.GetDB(c)
	var rows []models.ContentSimilar
	query := db.Where("entity_type = ? AND entity_id = ?", entityType, entityID)
	if source == models.SimilarSourceContent || source == models.SimilarSourceUsers {
		query = query.Where("source = ?", source)
	}
	query.Order("score DESC").Limit(limit * 2).Find(&rows) // взять с запасом для разделения

	var sameType, crossType []SimilarItem
	for _, r := range rows {
		item := SimilarItem{
			SimilarEntityType: r.SimilarEntityType,
			SimilarEntityID:   r.SimilarEntityID,
			Source:            r.Source,
			SameType:          r.EntityType == r.SimilarEntityType,
			Score:             r.Score,
		}
		if item.SameType {
			sameType = append(sameType, item)
		} else {
			crossType = append(crossType, item)
		}
	}

	if len(sameType) > limit {
		sameType = sameType[:limit]
	}
	if len(crossType) > limit {
		crossType = crossType[:limit]
	}

	c.JSON(http.StatusOK, PrecomputedSimilarResponse{
		EntityType: entityType,
		EntityID:   entityID,
		SameType:   sameType,
		CrossType:  crossType,
	})
}
