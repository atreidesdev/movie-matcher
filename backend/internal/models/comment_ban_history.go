package models

import "time"

// CommentBanHistory — запись истории бана на комментарии (для админки и отображения в модалке жалоб).
type CommentBanHistory struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"bannedAt"` // дата вынесения бана
	UserID      uint      `gorm:"not null;index" json:"userId"`
	BannedUntil time.Time `gorm:"not null" json:"bannedUntil"`
	BannedBy    uint      `gorm:"not null" json:"bannedBy"` // кто выставил бан (user_id)
	// Опционально: снимок комментария и причина (при банке по жалобе)
	CommentText *string `gorm:"type:text" json:"bannedCommentText,omitempty"`
	Reason      *string `gorm:"type:text" json:"bannedCommentReason,omitempty"`
	// Ссылка на жалобу, если бан вынесен по решению по report
	ReportID *uint `json:"reportId,omitempty"`
}

func (CommentBanHistory) TableName() string {
	return "comment_ban_history"
}
