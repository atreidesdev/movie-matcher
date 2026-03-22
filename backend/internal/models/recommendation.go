package models

import "time"

// ContentSimilar хранит предвычисленные связи "похожий контент".
// Используется: (1) тип 1 — блок «Похожее» на странице деталей (GET /similar/store/...);
// (2) тип 2 — персональные рекомендации пользователя (агрегация похожих к лайкнутым тайтлам).
// source: "content" — по описанию/темам/жанрам; "users" — по совпадению выборов пользователей.
// same_type: entity_type == similar_entity_type; cross_type: entity_type != similar_entity_type.
type ContentSimilar struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	CreatedAt         time.Time `json:"createdAt"`
	EntityType        string    `gorm:"not null;uniqueIndex:idx_similar" json:"entityType"`        // movie, book, manga, ...
	EntityID          uint      `gorm:"not null;uniqueIndex:idx_similar" json:"entityId"`
	SimilarEntityType string    `gorm:"not null;uniqueIndex:idx_similar" json:"similarEntityType"`
	SimilarEntityID   uint      `gorm:"not null;uniqueIndex:idx_similar" json:"similarEntityId"`
	Source            string    `gorm:"not null;uniqueIndex:idx_similar" json:"source"` // "content" | "users"
	Score             float64   `gorm:"default:0" json:"score"`
}

func (ContentSimilar) TableName() string {
	return "content_similar"
}

const (
	SimilarSourceContent = "content"
	SimilarSourceUsers   = "users"
)
