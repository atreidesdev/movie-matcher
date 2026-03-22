package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
)

func CreateActivityForUser(userID uint, activityType, mediaType string, mediaID uint, mediaTitle string, extra models.JSONMap) {
	a := models.Activity{
		UserID:     userID,
		Type:       activityType,
		MediaType:  mediaType,
		MediaID:    mediaID,
		MediaTitle: mediaTitle,
		Extra:      extra,
	}
	_ = deps.Default().DB.Create(&a).Error
}

func GetMyActivity(c *gin.Context) {
	userID, _ := c.Get("userID")
	limit := api.ParseLimitParam(c, 50, 100)

	db := deps.GetDB(c)
	var list []models.Activity
	if err := db.Where("user_id = ?", userID).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch activity")
		return
	}

	c.JSON(http.StatusOK, list)
}

func GetActivityFeed(c *gin.Context) {
	userID, _ := c.Get("userID")
	limit := api.ParseLimitParam(c, 50, 100)

	db := deps.GetDB(c)
	friendIDs, err := services.GetFriendIDs(db, userID.(uint))
	if err != nil || len(friendIDs) == 0 {
		c.JSON(http.StatusOK, []models.Activity{})
		return
	}
	var list []models.Activity
	if err := db.Where("user_id IN ?", friendIDs).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch feed")
		return
	}

	c.JSON(http.StatusOK, list)
}
