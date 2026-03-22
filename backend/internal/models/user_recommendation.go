package models

import "time"

// UserRecommendation — сохранённая персональная рекомендация для пользователя (тип 2).
// Тайтлы, которые уже в списках пользователя (просмотрено/пройдено/прочитано и т.д.), в реки не попадают.
type UserRecommendation struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UserID     uint      `gorm:"uniqueIndex:idx_user_rec;not null;index" json:"userId"`
	EntityType string    `gorm:"uniqueIndex:idx_user_rec;not null;size:32" json:"entityType"` // movie, anime_series, game, ...
	EntityID   uint      `gorm:"uniqueIndex:idx_user_rec;not null" json:"entityId"`
	Score      float64   `gorm:"default:0" json:"score"`
	Position   int       `gorm:"default:0" json:"position"` // порядок выдачи
}

func (UserRecommendation) TableName() string {
	return "user_recommendations"
}
