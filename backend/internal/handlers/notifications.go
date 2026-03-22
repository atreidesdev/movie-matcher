package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
)

func GetNotifications(c *gin.Context) {
	userID, _ := c.Get("userID")
	limit := api.ParseLimitParam(c, 50, 100)

	db := deps.GetDB(c)
	var list []models.Notification
	if err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch notifications")
		return
	}

	c.JSON(http.StatusOK, list)
}

// MarkNotificationRead marks a single notification as read.
func MarkNotificationRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}

	db := deps.GetDB(c)
	result := db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("read_at", time.Now())
	if result.Error != nil {
		api.RespondInternal(c, "Failed to update notification")
		return
	}
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Notification not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

// MarkAllNotificationsRead marks all notifications of the current user as read.
func MarkAllNotificationsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	db := deps.GetDB(c)
	if err := db.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", time.Now()).Error; err != nil {
		api.RespondInternal(c, "Failed to update notifications")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func CreateNotificationForUser(userID uint, notifType, title string, body *string, relatedType string, relatedID uint, extra models.JSONMap) {
	db := deps.Default().DB
	n := models.Notification{
		UserID:      userID,
		Type:        notifType,
		Title:       title,
		Body:        body,
		RelatedType: relatedType,
		RelatedID:   relatedID,
		Extra:       extra,
	}
	_ = db.Create(&n).Error
	bodyStr := ""
	if body != nil {
		bodyStr = *body
	}
	go services.SendPushForUser(db, userID, title, bodyStr)
}

func CreateNotificationInAppOnly(userID uint, notifType, title string, body *string, relatedType string, relatedID uint, extra models.JSONMap) {
	db := deps.Default().DB
	n := models.Notification{
		UserID:      userID,
		Type:        notifType,
		Title:       title,
		Body:        body,
		RelatedType: relatedType,
		RelatedID:   relatedID,
		Extra:       extra,
	}
	_ = db.Create(&n).Error
}

type PushSubscribeBody struct {
	Endpoint string            `json:"endpoint" binding:"required"`
	Keys     PushSubscribeKeys `json:"keys" binding:"required"`
}
type PushSubscribeKeys struct {
	P256dh string `json:"p256dh" binding:"required"`
	Auth   string `json:"auth" binding:"required"`
}

// POST /notifications/push-subscribe
func PushSubscribe(c *gin.Context) {
	userID, _ := c.Get("userID")
	var body PushSubscribeBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "endpoint and keys.p256dh, keys.auth required"})
		return
	}
	db := deps.GetDB(c)
	uid := userID.(uint)
	var existing models.PushSubscription
	err := db.Where("user_id = ? AND endpoint = ?", uid, body.Endpoint).First(&existing).Error
	if err == nil {
		existing.P256dhKey = body.Keys.P256dh
		existing.AuthKey = body.Keys.Auth
		if err = db.Save(&existing).Error; err != nil {
			api.RespondInternal(c, "Failed to update push subscription")
			return
		}
	} else {
		sub := models.PushSubscription{
			UserID:    uid,
			Endpoint:  body.Endpoint,
			P256dhKey: body.Keys.P256dh,
			AuthKey:   body.Keys.Auth,
		}
		if err = db.Create(&sub).Error; err != nil {
			api.RespondInternal(c, "Failed to save push subscription")
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "subscribed"})
}
