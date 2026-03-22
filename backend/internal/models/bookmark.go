package models

import "time"

const (
	BookmarkTargetCollection = "collection"
	BookmarkTargetNews      = "news"
)

// Bookmark — закладка пользователя (чужая коллекция или новость).
// Один пользователь может сохранить одну сущность одного типа один раз.
type Bookmark struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UserID     uint      `gorm:"uniqueIndex:idx_bookmark;not null" json:"userId"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TargetType string    `gorm:"uniqueIndex:idx_bookmark;size:32;not null" json:"targetType"` // collection, news
	TargetID   uint      `gorm:"uniqueIndex:idx_bookmark;not null" json:"targetId"`
}
