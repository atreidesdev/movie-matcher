package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

const (
	bookmarkTypeCollection = "collection"
	bookmarkTypeNews       = "news"
)

// GET /api/v1/bookmarks
func GetBookmarks(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	db := deps.GetDB(c)

	var bookmarks []models.Bookmark
	db.Where("user_id = ?", userID).Order("created_at DESC").Find(&bookmarks)
	if len(bookmarks) == 0 {
		c.JSON(http.StatusOK, gin.H{"bookmarks": []gin.H{}})
		return
	}


	collectionIDs := make([]uint, 0)
	newsIDs := make([]uint, 0)
	for _, b := range bookmarks {
		if b.TargetType == bookmarkTypeCollection {
			collectionIDs = append(collectionIDs, b.TargetID)
		} else if b.TargetType == bookmarkTypeNews {
			newsIDs = append(newsIDs, b.TargetID)
		}
	}

	collectionsByID := make(map[uint]models.Collection)
	if len(collectionIDs) > 0 {
		var collections []models.Collection
		db.Preload("User").Where("id IN ?", collectionIDs).Find(&collections)
		for _, col := range collections {
			collectionsByID[col.ID] = col
		}
	}

	newsByID := make(map[uint]models.News)
	if len(newsIDs) > 0 {
		var newsList []models.News
		db.Preload("Author").Where("id IN ?", newsIDs).Find(&newsList)
		for _, n := range newsList {
			newsByID[n.ID] = n
		}
	}

	type bookmarkItem struct {
		ID         uint        `json:"id"`
		TargetType string      `json:"targetType"`
		TargetID   uint        `json:"targetId"`
		CreatedAt  string      `json:"createdAt"`
		Target     interface{} `json:"target"`
	}

	result := make([]bookmarkItem, 0, len(bookmarks))
	for _, b := range bookmarks {
		item := bookmarkItem{ID: b.ID, TargetType: b.TargetType, TargetID: b.TargetID, CreatedAt: b.CreatedAt.Format("2006-01-02T15:04:05Z07:00")}
		if b.TargetType == bookmarkTypeCollection {
			if col, ok := collectionsByID[b.TargetID]; ok {
				item.Target = col
			}
		} else if b.TargetType == bookmarkTypeNews {
			if n, ok := newsByID[b.TargetID]; ok {
				item.Target = n
			}
		}
		result = append(result, item)
	}

	c.JSON(http.StatusOK, gin.H{"bookmarks": result})
}

type AddBookmarkRequest struct {
	TargetType string `json:"targetType" binding:"required"` // collection | news
	TargetID   uint   `json:"targetId" binding:"required"`
}

// POST /api/v1/bookmarks
func AddBookmark(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req AddBookmarkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	if req.TargetType != bookmarkTypeCollection && req.TargetType != bookmarkTypeNews {
		api.RespondBadRequest(c, "targetType must be collection or news", nil)
		return
	}

	db := deps.GetDB(c)
	if req.TargetType == bookmarkTypeCollection {
		var col models.Collection
		if err := db.First(&col, req.TargetID).Error; err != nil {
			api.RespondNotFound(c, "Collection not found")
			return
		}
		if col.UserID == userID {
			api.RespondBadRequest(c, "Cannot bookmark your own collection", nil)
			return
		}
	} else if req.TargetType == bookmarkTypeNews {
		var n models.News
		if err := db.First(&n, req.TargetID).Error; err != nil {
			api.RespondNotFound(c, "News not found")
			return
		}
	}

	var existing models.Bookmark
	if err := db.Where("user_id = ? AND target_type = ? AND target_id = ?", userID, req.TargetType, req.TargetID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"bookmark": existing, "message": "Already bookmarked"})
		return
	}

	bookmark := models.Bookmark{UserID: userID, TargetType: req.TargetType, TargetID: req.TargetID}
	if err := db.Create(&bookmark).Error; err != nil {
		api.RespondInternal(c, "Failed to create bookmark")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"bookmark": bookmark})
}

// DELETE /api/v1/bookmarks/:targetType/:targetId
func RemoveBookmark(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	targetType := c.Param("targetType")
	targetIDStr := c.Param("targetId")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid target id", nil)
		return
	}
	if targetType != bookmarkTypeCollection && targetType != bookmarkTypeNews {
		api.RespondBadRequest(c, "Invalid target type", nil)
		return
	}

	db := deps.GetDB(c)
	res := db.Where("user_id = ? AND target_type = ? AND target_id = ?", userIDVal.(uint), targetType, uint(targetID)).Delete(&models.Bookmark{})
	if res.RowsAffected == 0 {
		api.RespondNotFound(c, "Bookmark not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /api/v1/bookmarks/check/:targetType/:targetId
func GetBookmarkCheck(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusOK, gin.H{"bookmarked": false})
		return
	}
	targetType := c.Param("targetType")
	targetIDStr := c.Param("targetId")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil || (targetType != bookmarkTypeCollection && targetType != bookmarkTypeNews) {
		c.JSON(http.StatusOK, gin.H{"bookmarked": false})
		return
	}
	var count int64
	deps.GetDB(c).Model(&models.Bookmark{}).Where("user_id = ? AND target_type = ? AND target_id = ?", userIDVal.(uint), targetType, uint(targetID)).Count(&count)
	c.JSON(http.StatusOK, gin.H{"bookmarked": count > 0})
}
