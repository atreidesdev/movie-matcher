package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

type AdminFranchiseInput struct {
	Name        string                 `json:"name" binding:"required"`
	NameI18n    *models.LocalizedString `json:"nameI18n"`
	Description *string                 `json:"description"`
	Poster      *string                 `json:"poster"`
	Aliases     []string                `json:"aliases"`
}

type AdminFranchiseLinkInput struct {
	FromMediaType string `json:"fromMediaType" binding:"required"` // path: movie, tv-series, anime, ...
	FromMediaID   uint   `json:"fromMediaId" binding:"required"`
	ToMediaType   string `json:"toMediaType" binding:"required"`
	ToMediaID     uint   `json:"toMediaId" binding:"required"`
	RelationType  string `json:"relationType" binding:"required"` // sequel, prequel, adaptation, ...
	OrderNumber   *int   `json:"orderNumber"`
	Note          *string `json:"note"`
}

func AdminCreateFranchise(c *gin.Context) {
	var input AdminFranchiseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	f := models.Franchise{
		Name:        input.Name,
		NameI18n:    input.NameI18n,
		Description: input.Description,
		Poster:      input.Poster,
		Aliases:     input.Aliases,
	}
	if err := deps.GetDB(c).Create(&f).Error; err != nil {
		api.RespondInternal(c, "Failed to create franchise")
		return
	}
	c.JSON(http.StatusCreated, f)
}

func AdminUpdateFranchise(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	var f models.Franchise
	if err := deps.GetDB(c).First(&f, id).Error; err != nil {
		api.RespondNotFound(c, "Franchise not found")
		return
	}
	var input AdminFranchiseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	f.Name = input.Name
	f.NameI18n = input.NameI18n
	f.Description = input.Description
	f.Poster = input.Poster
	f.Aliases = input.Aliases
	if err := deps.GetDB(c).Save(&f).Error; err != nil {
		api.RespondInternal(c, "Failed to update franchise")
		return
	}
	c.JSON(http.StatusOK, f)
}

func AdminDeleteFranchise(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	if err := db.Where("franchise_id = ?", id).Delete(&models.FranchiseMediaLink{}).Error; err != nil {
		api.RespondInternal(c, "Failed to delete franchise links")
		return
	}
	if err := db.Delete(&models.Franchise{}, id).Error; err != nil {
		api.RespondInternal(c, "Failed to delete franchise")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Franchise deleted"})
}

func parseMediaType(pathType string) (models.MediaType, bool) {
	t, ok := pathMediaTypeToModel[pathType]
	return t, ok
}

// inverseRelationForAdmin returns the inverse relation (for duplicate check: A sequel B === B prequel A).
func inverseRelationForAdmin(rel models.MediaRelationType) models.MediaRelationType {
	switch rel {
	case models.MediaRelationSequel:
		return models.MediaRelationPrequel
	case models.MediaRelationPrequel:
		return models.MediaRelationSequel
	default:
		return rel
	}
}

func AdminAddFranchiseLink(c *gin.Context) {
	franchiseIDStr := c.Param("id")
	franchiseID, err := strconv.ParseUint(franchiseIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid franchise ID", nil)
		return
	}
	var input AdminFranchiseLinkInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fromType, ok := parseMediaType(input.FromMediaType)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid fromMediaType"})
		return
	}
	toType, ok := parseMediaType(input.ToMediaType)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid toMediaType"})
		return
	}
	relType := models.MediaRelationType(input.RelationType)
	switch relType {
	case models.MediaRelationSequel, models.MediaRelationPrequel, models.MediaRelationSpinOff,
		models.MediaRelationAlternativeVersion, models.MediaRelationSideStory, models.MediaRelationCrossover,
		models.MediaRelationCompilation, models.MediaRelationRemake, models.MediaRelationRemaster, models.MediaRelationAdaptation:
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid relationType"})
		return
	}
	db := deps.GetDB(c)
	var fr models.Franchise
	if err := db.First(&fr, franchiseID).Error; err != nil {
		api.RespondNotFound(c, "Franchise not found")
		return
	}
	// Двусторонняя связь: не создаём дубликат — ни точную копию, ни обратную ссылку.
	var existing models.FranchiseMediaLink
	// Та же связь (A→B, relation)
	if findErr := db.Where("franchise_id = ? AND from_media_type = ? AND from_media_id = ? AND to_media_type = ? AND to_media_id = ? AND relation_type = ?",
		franchiseID, fromType, input.FromMediaID, toType, input.ToMediaID, relType).First(&existing).Error; findErr == nil {
		c.JSON(http.StatusOK, existing)
		return
	}
	// Обратная связь (B→A, inverse relation)
	inverseRel := inverseRelationForAdmin(relType)
	if findErr := db.Where("franchise_id = ? AND from_media_type = ? AND from_media_id = ? AND to_media_type = ? AND to_media_id = ? AND relation_type = ?",
		franchiseID, toType, input.ToMediaID, fromType, input.FromMediaID, inverseRel).First(&existing).Error; findErr == nil {
		c.JSON(http.StatusOK, existing)
		return
	}
	link := models.FranchiseMediaLink{
		FranchiseID:   uint(franchiseID),
		FromMediaType: fromType,
		FromMediaID:   input.FromMediaID,
		ToMediaType:   toType,
		ToMediaID:     input.ToMediaID,
		RelationType:  relType,
		OrderNumber:   input.OrderNumber,
		Note:          input.Note,
	}
	if err := db.Create(&link).Error; err != nil {
		api.RespondInternal(c, "Failed to create franchise link")
		return
	}
	c.JSON(http.StatusCreated, link)
}

func AdminUpdateFranchiseLink(c *gin.Context) {
	linkID, ok := api.ParseUintParam(c, "linkId")
	if !ok {
		return
	}
	var link models.FranchiseMediaLink
	if err := deps.GetDB(c).First(&link, linkID).Error; err != nil {
		api.RespondNotFound(c, "Franchise link not found")
		return
	}
	var input struct {
		RelationType *string `json:"relationType"`
		OrderNumber  *int    `json:"orderNumber"`
		Note         *string `json:"note"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.RelationType != nil {
		link.RelationType = models.MediaRelationType(*input.RelationType)
	}
	if input.OrderNumber != nil {
		link.OrderNumber = input.OrderNumber
	}
	if input.Note != nil {
		link.Note = input.Note
	}
	if err := deps.GetDB(c).Save(&link).Error; err != nil {
		api.RespondInternal(c, "Failed to update franchise link")
		return
	}
	c.JSON(http.StatusOK, link)
}

func AdminDeleteFranchiseLink(c *gin.Context) {
	linkID, ok := api.ParseUintParam(c, "linkId")
	if !ok {
		return
	}
	if err := deps.GetDB(c).Delete(&models.FranchiseMediaLink{}, linkID).Error; err != nil {
		api.RespondInternal(c, "Failed to delete franchise link")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Link deleted"})
}
