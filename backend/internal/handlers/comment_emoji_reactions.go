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

var allowedCommentEmojis = map[string]bool{
	"like": true, "heart": true, "laugh": true, "sad": true, "angry": true, "wow": true,
}

type SetCommentEmojiReactionRequest struct {
	Emoji string `json:"emoji" binding:"required"`
}

func BuildCommentEmojiReactionsMap(c *gin.Context, entityType string, commentIDs []uint) map[string]gin.H {
	reactions := make(map[string]gin.H)
	if len(commentIDs) == 0 || !isValidCommentEntityType(entityType) {
		return reactions
	}
	db := deps.GetDB(c)

	var rows []struct {
		CommentID uint
		Emoji     string
		Count     int64
	}
	db.Model(&models.CommentEmojiReaction{}).
		Select("comment_id, emoji, count(*) as count").
		Where("entity_type = ? AND comment_id IN ?", entityType, commentIDs).
		Group("comment_id, emoji").
		Find(&rows)

	countsByComment := make(map[uint]map[string]int)
	for _, r := range rows {
		if countsByComment[r.CommentID] == nil {
			countsByComment[r.CommentID] = make(map[string]int)
		}
		countsByComment[r.CommentID][r.Emoji] = int(r.Count)
	}

	myReactions := make(map[uint]string)
	if userIDVal, ok := c.Get("userID"); ok {
		var myRows []models.CommentEmojiReaction
		db.Where("entity_type = ? AND comment_id IN ? AND user_id = ?", entityType, commentIDs, userIDVal.(uint)).Find(&myRows)
		for _, r := range myRows {
			myReactions[r.CommentID] = r.Emoji
		}
	}

	for _, cid := range commentIDs {
		counts := countsByComment[cid]
		if counts == nil {
			counts = make(map[string]int)
		}
		myReaction, _ := myReactions[cid]
		key := strconv.FormatUint(uint64(cid), 10)
		reactions[key] = gin.H{"counts": counts, "myReaction": myReaction}
	}
	return reactions
}

// GetCommentEmojiReactions godoc
// @Summary  Get comment emoji reactions
// @Tags     Comment Reactions
// @Param    entityType   query  string  true   "Entity type"
// @Param    commentIds   query  string  true   "Comma-separated comment IDs"
// @Success  200  {object}  map[string]interface{}
// @Router   /comment-emoji-reactions [get]
func GetCommentEmojiReactions(c *gin.Context) {
	entityType := c.Query("entityType")
	commentIdsStr := c.Query("commentIds")
	if entityType == "" || commentIdsStr == "" {
		c.JSON(http.StatusOK, gin.H{"reactions": gin.H{}})
		return
	}
	if !isValidCommentEntityType(entityType) {
		api.RespondBadRequest(c, "Invalid entity type", nil)
		return
	}
	parts := strings.Split(commentIdsStr, ",")
	commentIDs := make([]uint, 0, len(parts))
	for _, p := range parts {
		id, err := strconv.ParseUint(strings.TrimSpace(p), 10, 32)
		if err != nil {
			continue
		}
		commentIDs = append(commentIDs, uint(id))
	}
	reactions := BuildCommentEmojiReactionsMap(c, entityType, commentIDs)
	c.JSON(http.StatusOK, gin.H{"reactions": reactions})
}

// POST /api/v1/comment-emoji-reactions
func SetCommentEmojiReaction(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req struct {
		EntityType string `json:"entityType" binding:"required"`
		CommentID  uint   `json:"commentId" binding:"required"`
		Emoji      string `json:"emoji" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	if !isValidCommentEntityType(req.EntityType) || !allowedCommentEmojis[req.Emoji] {
		api.RespondBadRequest(c, "Invalid entity type or emoji", nil)
		return
	}

	if !commentExistsForEntity(c, req.EntityType, req.CommentID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}

	db := deps.GetDB(c)
	var existing models.CommentEmojiReaction
	err := db.Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, req.EntityType, req.CommentID).First(&existing).Error
	if err != nil {
		db.Create(&models.CommentEmojiReaction{
			UserID:     userID,
			EntityType: req.EntityType,
			CommentID:  req.CommentID,
			Emoji:      req.Emoji,
		})
	} else {
		existing.Emoji = req.Emoji
		db.Save(&existing)
	}

	var counts []struct {
		Emoji string
		Count int64
	}
	db.Model(&models.CommentEmojiReaction{}).Select("emoji, count(*) as count").
		Where("entity_type = ? AND comment_id = ?", req.EntityType, req.CommentID).
		Group("emoji").Find(&counts)
	countMap := make(map[string]int)
	for _, row := range counts {
		countMap[row.Emoji] = int(row.Count)
	}
	c.JSON(http.StatusOK, gin.H{"counts": countMap, "myReaction": req.Emoji})
}

// DELETE /api/v1/comment-emoji-reactions/:entityType/:commentId
func DeleteCommentEmojiReaction(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	entityType := c.Param("entityType")
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil || !isValidCommentEntityType(entityType) {
		api.RespondBadRequest(c, "Invalid parameters", nil)
		return
	}

	db := deps.GetDB(c)
	res := db.Where("user_id = ? AND entity_type = ? AND comment_id = ?", userIDVal.(uint), entityType, uint(commentID)).Delete(&models.CommentEmojiReaction{})
	if res.RowsAffected == 0 {
		c.JSON(http.StatusOK, gin.H{"counts": map[string]int{}, "myReaction": ""})
		return
	}

	var counts []struct {
		Emoji string
		Count int64
	}
	db.Model(&models.CommentEmojiReaction{}).Select("emoji, count(*) as count").
		Where("entity_type = ? AND comment_id = ?", entityType, uint(commentID)).
		Group("emoji").Find(&counts)
	countMap := make(map[string]int)
	for _, row := range counts {
		countMap[row.Emoji] = int(row.Count)
	}
	c.JSON(http.StatusOK, gin.H{"counts": countMap, "myReaction": ""})
}

func isValidCommentEntityType(t string) bool {
	switch t {
	case models.CommentEntityMovie, models.CommentEntityTVSeries, models.CommentEntityCartoonSeries,
		models.CommentEntityCartoonMovie, models.CommentEntityAnime, models.CommentEntityAnimeMovie,
		models.CommentEntityGame, models.CommentEntityManga, models.CommentEntityBook, models.CommentEntityLightNovel:
		return true
	}
	return false
}

// commentExistsForEntity checks that a comment with given ID exists in the table for entityType.
func commentExistsForEntity(c *gin.Context, entityType string, commentID uint) bool {
	db := deps.GetDB(c)
	switch entityType {
	case models.CommentEntityMovie:
		var x models.MovieComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityTVSeries:
		var x models.TVSeriesComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityAnime:
		var x models.AnimeSeriesComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityCartoonSeries:
		var x models.CartoonSeriesComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityCartoonMovie:
		var x models.CartoonMovieComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityAnimeMovie:
		var x models.AnimeMovieComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityGame:
		var x models.GameComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityManga:
		var x models.MangaComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityBook:
		var x models.BookComment
		return db.First(&x, commentID).Error == nil
	case models.CommentEntityLightNovel:
		var x models.LightNovelComment
		return db.First(&x, commentID).Error == nil
	}
	return false
}
