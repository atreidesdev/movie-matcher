package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

var allowedReviewReactions = map[string]bool{
	"like": true, "useful": true, "love": true, "laugh": true,
	"sad": true, "angry": true, "dislike": true,
}

type SetReviewReactionRequest struct {
	Reaction string `json:"reaction" binding:"required"`
}

// GetReviewReactionsBatch godoc
// @Summary  Get review reactions for multiple targets
// @Tags     Review Reactions
// @Param    items  query  string  true  "Comma-separated targetType:id"
// @Success  200  {object}  map[string]interface{}  "reactions"
// @Router   /review-reactions/batch [get]
func GetReviewReactionsBatch(c *gin.Context) {
	itemsStr := c.Query("items")
	if itemsStr == "" {
		c.JSON(http.StatusOK, gin.H{"reactions": gin.H{}})
		return
	}

	type keyT struct {
		TargetType string
		TargetID   uint
	}
	var pairs []keyT
	for _, s := range strings.Split(itemsStr, ",") {
		s = strings.TrimSpace(s)
		colon := strings.Index(s, ":")
		if colon <= 0 || colon >= len(s)-1 {
			continue
		}
		targetType := strings.TrimSpace(s[:colon])
		idStr := strings.TrimSpace(s[colon+1:])
		if !isValidReviewTargetType(targetType) {
			continue
		}
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			continue
		}
		pairs = append(pairs, keyT{targetType, uint(id)})
	}
	if len(pairs) == 0 {
		c.JSON(http.StatusOK, gin.H{"reactions": gin.H{}})
		return
	}

	db := deps.GetDB(c)
	var userID *uint
	if uid, ok := c.Get("userID"); ok {
		u := uid.(uint)
		userID = &u
	}

	result := make(map[string]gin.H)
	seen := make(map[keyT]bool)
	for _, p := range pairs {
		if seen[p] {
			continue
		}
		seen[p] = true
		key := p.TargetType + ":" + strconv.FormatUint(uint64(p.TargetID), 10)

		var counts []struct {
			Reaction string
			Count    int64
		}
		db.Model(&models.ReviewReaction{}).
			Select("reaction, count(*) as count").
			Where("target_type = ? AND target_id = ?", p.TargetType, p.TargetID).
			Group("reaction").Find(&counts)
		countMap := make(map[string]int)
		for _, row := range counts {
			countMap[row.Reaction] = int(row.Count)
		}
		var myReaction *string
		if userID != nil {
			var r models.ReviewReaction
			if err := db.Where("user_id = ? AND target_type = ? AND target_id = ?", *userID, p.TargetType, p.TargetID).First(&r).Error; err == nil {
				myReaction = &r.Reaction
			}
		}
		result[key] = gin.H{"counts": countMap, "myReaction": myReaction}
	}
	c.JSON(http.StatusOK, gin.H{"reactions": result})
}

// GetReviewReactions godoc
// @Summary  Get review reactions for one target
// @Tags     Review Reactions
// @Param    targetType  path  string  true  "e.g. movie_review"
// @Param    targetId   path  int     true  "Target ID"
// @Success  200  {object}  map[string]interface{}
// @Router   /review-reactions/{targetType}/{targetId} [get]
func GetReviewReactions(c *gin.Context) {
	targetType := c.Param("targetType")
	targetIDStr := c.Param("targetId")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid target id", nil)
		return
	}
	if !isValidReviewTargetType(targetType) {
		api.RespondBadRequest(c, "Invalid target type", nil)
		return
	}

	db := deps.GetDB(c)
	var counts []struct {
		Reaction string
		Count    int64
	}
	db.Model(&models.ReviewReaction{}).
		Select("reaction, count(*) as count").
		Where("target_type = ? AND target_id = ?", targetType, uint(targetID)).
		Group("reaction").
		Find(&counts)

	countMap := make(map[string]int)
	for _, row := range counts {
		countMap[row.Reaction] = int(row.Count)
	}

	var myReaction *string
	if userIDVal, ok := c.Get("userID"); ok {
		var r models.ReviewReaction
		if err := db.Where("user_id = ? AND target_type = ? AND target_id = ?", userIDVal.(uint), targetType, uint(targetID)).First(&r).Error; err == nil {
			myReaction = &r.Reaction
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"counts":     countMap,
		"myReaction": myReaction,
	})
}

// POST /api/v1/review-reactions
func SetReviewReaction(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req struct {
		TargetType string `json:"targetType" binding:"required"`
		TargetID   uint   `json:"targetId" binding:"required"`
		Reaction   string `json:"reaction" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	if !isValidReviewTargetType(req.TargetType) || !allowedReviewReactions[req.Reaction] {
		api.RespondBadRequest(c, "Invalid target type or reaction", nil)
		return
	}

	db := deps.GetDB(c)
	var existing models.ReviewReaction
	err := db.Where("user_id = ? AND target_type = ? AND target_id = ?", userID, req.TargetType, req.TargetID).First(&existing).Error
	if err != nil {
		db.Create(&models.ReviewReaction{
			UserID:     userID,
			TargetType: req.TargetType,
			TargetID:   req.TargetID,
			Reaction:   req.Reaction,
		})
	} else {
		existing.Reaction = req.Reaction
		db.Save(&existing)
	}


	var counts []struct {
		Reaction string
		Count    int64
	}
	db.Model(&models.ReviewReaction{}).Select("reaction, count(*) as count").
		Where("target_type = ? AND target_id = ?", req.TargetType, req.TargetID).
		Group("reaction").Find(&counts)
	countMap := make(map[string]int)
	for _, row := range counts {
		countMap[row.Reaction] = int(row.Count)
	}
	c.JSON(http.StatusOK, gin.H{"counts": countMap, "myReaction": req.Reaction})
}

// DELETE /api/v1/review-reactions/:targetType/:targetId
func DeleteReviewReaction(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	targetType := c.Param("targetType")
	targetIDStr := c.Param("targetId")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil || !isValidReviewTargetType(targetType) {
		api.RespondBadRequest(c, "Invalid parameters", nil)
		return
	}

	db := deps.GetDB(c)
	res := db.Where("user_id = ? AND target_type = ? AND target_id = ?", userIDVal.(uint), targetType, uint(targetID)).Delete(&models.ReviewReaction{})
	if res.RowsAffected == 0 {
		c.JSON(http.StatusOK, gin.H{"counts": map[string]int{}, "myReaction": nil})
		return
	}

	var counts []struct {
		Reaction string
		Count    int64
	}
	db.Model(&models.ReviewReaction{}).Select("reaction, count(*) as count").
		Where("target_type = ? AND target_id = ?", targetType, uint(targetID)).
		Group("reaction").Find(&counts)
	countMap := make(map[string]int)
	for _, row := range counts {
		countMap[row.Reaction] = int(row.Count)
	}
	c.JSON(http.StatusOK, gin.H{"counts": countMap, "myReaction": nil})
}

func isValidReviewTargetType(t string) bool {
	switch t {
	case models.ReviewTargetMovie, models.ReviewTargetTVSeries, models.ReviewTargetAnimeSeries,
		models.ReviewTargetCartoonSeries, models.ReviewTargetCartoonMovie, models.ReviewTargetAnimeMovie,
		models.ReviewTargetGame, models.ReviewTargetManga, models.ReviewTargetBook, models.ReviewTargetLightNovel:
		return true
	}
	return false
}
