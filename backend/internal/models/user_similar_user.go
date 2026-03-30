package models

import "time"

// UserSimilarUser — сохранённый список похожих пользователей для user_id (тип 1).
// Хранит топ-N по вкусовому сходству, вычисленные recommendation service.
type UserSimilarUser struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time `json:"createdAt"`
	UserID         uint      `gorm:"uniqueIndex:idx_user_similar;not null;index" json:"userId"`
	SimilarUserID  uint      `gorm:"uniqueIndex:idx_user_similar;not null" json:"similarUserId"`
	Score          float64   `gorm:"default:0" json:"score"`
	Position       int       `gorm:"default:0" json:"position"`
}

func (UserSimilarUser) TableName() string {
	return "user_similar_users"
}

