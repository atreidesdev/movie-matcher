package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
	"gorm.io/gorm"
)

func GetConversations(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	db := deps.GetDB(c)
	crypto := services.DefaultMessageCrypto
	if crypto == nil {
		api.RespondInternal(c, "Messaging not configured")
		return
	}

	var convs []models.Conversation
	if err := db.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").Preload("User2").
		Order("updated_at DESC").
		Find(&convs).Error; err != nil {
		api.RespondInternal(c, "Failed to load conversations")
		return
	}

	type convItem struct {
		ID        uint        `json:"id"`
		OtherUser *models.User `json:"otherUser"`
		LastBody  string      `json:"lastBody,omitempty"`
		LastAt    string      `json:"lastAt,omitempty"`
		Unread    int64       `json:"unread"`
		UpdatedAt string      `json:"updatedAt"`
	}
	out := make([]convItem, 0, len(convs))
	for _, conv := range convs {
		other := &conv.User2
		if conv.User1ID != userID {
			other = &conv.User1
		}
		var lastMsg models.Message
		db.Where("conversation_id = ?", conv.ID).Order("created_at DESC").Limit(1).Find(&lastMsg)
		lastBody := ""
		lastAt := ""
		if lastMsg.ID != 0 {
			if dec, err := crypto.Decrypt(lastMsg.BodyEncrypted, lastMsg.Nonce); err == nil {
				lastBody = string(dec)
			}
			lastBody = truncatePreview(lastBody, 80)
			lastAt = lastMsg.CreatedAt.Format("2006-01-02T15:04:05Z07:00")
		}
		var unread int64
		db.Model(&models.Message{}).Where("conversation_id = ? AND sender_id != ? AND read_at IS NULL", conv.ID, userID).Count(&unread)
		out = append(out, convItem{
			ID:        conv.ID,
			OtherUser: other,
			LastBody:  lastBody,
			LastAt:    lastAt,
			Unread:    unread,
			UpdatedAt: conv.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}
	c.JSON(http.StatusOK, out)
}

func GetOrCreateConversation(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	friendID, ok := api.ParseUintParam(c, "friendId")
	if !ok {
		return
	}
	if friendID == userID {
		api.RespondBadRequest(c, "Cannot chat with yourself", nil)
		return
	}
	db := deps.GetDB(c)
	if !areFriends(db, userID, friendID) {
		api.RespondForbidden(c, "User is not your friend")
		return
	}
	u1, u2 := userID, friendID
	if u1 > u2 {
		u1, u2 = u2, u1
	}
	var conv models.Conversation
	err := db.Where("user1_id = ? AND user2_id = ?", u1, u2).First(&conv).Error
	if err == gorm.ErrRecordNotFound {
		conv = models.Conversation{User1ID: u1, User2ID: u2}
		if err = db.Create(&conv).Error; err != nil {
			api.RespondInternal(c, "Failed to create conversation")
			return
		}
	} else if err != nil {
		api.RespondInternal(c, "Failed to load conversation")
		return
	}
	if conv.User1ID == userID {
		db.First(&conv.User2, conv.User2ID)
		conv.User2ID = conv.User2.ID
	} else {
		db.First(&conv.User1, conv.User1ID)
		conv.User1ID = conv.User1.ID
	}
	c.JSON(http.StatusOK, conv)
}

func GetMessages(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	convID, ok := api.ParseUintParam(c, "conversationId")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	crypto := services.DefaultMessageCrypto
	if crypto == nil {
		api.RespondInternal(c, "Messaging not configured")
		return
	}
	var conv models.Conversation
	if err := db.First(&conv, convID).Error; err != nil {
		api.RespondNotFound(c, "Conversation not found")
		return
	}
	if conv.User1ID != userID && conv.User2ID != userID {
		api.RespondForbidden(c, "Not a participant")
		return
	}
	// Сначала помечаем входящие как прочитанные, чтобы отправитель видел readAt при следующей загрузке
	db.Model(&models.Message{}).Where("conversation_id = ? AND sender_id != ? AND read_at IS NULL", convID, userID).Update("read_at", time.Now())

	page, pageSize := api.ParsePageParams(c, 1, 20, 100)
	offset := (page - 1) * pageSize
	var messages []models.Message
	if err := db.Where("conversation_id = ?", convID).Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&messages).Error; err != nil {
		api.RespondInternal(c, "Failed to load messages")
		return
	}
	for i := range messages {
		if dec, err := crypto.Decrypt(messages[i].BodyEncrypted, messages[i].Nonce); err == nil {
			messages[i].Body = string(dec)
		}
		messages[i].BodyEncrypted = nil
		messages[i].Nonce = nil
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

type SendMessageRequest struct {
	Body string `json:"body" binding:"required,max=10000"`
}

func SendMessage(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	convID, ok := api.ParseUintParam(c, "conversationId")
	if !ok {
		return
	}
	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	db := deps.GetDB(c)
	crypto := services.DefaultMessageCrypto
	if crypto == nil {
		api.RespondInternal(c, "Messaging not configured")
		return
	}
	var conv models.Conversation
	if err := db.First(&conv, convID).Error; err != nil {
		api.RespondNotFound(c, "Conversation not found")
		return
	}
	if conv.User1ID != userID && conv.User2ID != userID {
		api.RespondForbidden(c, "Not a participant")
		return
	}
	ciphertext, nonce, err := crypto.Encrypt([]byte(req.Body))
	if err != nil {
		api.RespondInternal(c, "Failed to encrypt message")
		return
	}
	msg := models.Message{
		ConversationID: convID,
		SenderID:       userID,
		BodyEncrypted:  ciphertext,
		Nonce:          nonce,
	}
	if err := db.Create(&msg).Error; err != nil {
		api.RespondInternal(c, "Failed to send message")
		return
	}
	db.Model(&models.Conversation{}).Where("id = ?", convID).Update("updated_at", time.Now())
	msg.Body = req.Body
	msg.BodyEncrypted = nil
	msg.Nonce = nil
	c.JSON(http.StatusCreated, msg)
}

func MarkConversationRead(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	convID, ok := api.ParseUintParam(c, "conversationId")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var conv models.Conversation
	if err := db.First(&conv, convID).Error; err != nil {
		api.RespondNotFound(c, "Conversation not found")
		return
	}
	if conv.User1ID != userID && conv.User2ID != userID {
		api.RespondForbidden(c, "Not a participant")
		return
	}
	db.Model(&models.Message{}).Where("conversation_id = ? AND sender_id != ?", convID, userID).Update("read_at", time.Now())
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func areFriends(db *gorm.DB, a, b uint) bool {
	var n int64
	// Дружба хранится в обе стороны: (user_id, friend_id) и (friend_id, user_id)
	db.Model(&models.Friendship{}).Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", a, b, b, a).Count(&n)
	return n > 0
}

func truncatePreview(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "…"
}
