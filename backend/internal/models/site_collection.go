package models

import "time"

// SiteCollection — публичная (сайтовая) коллекция, не привязанная к пользователю.
type SiteCollection struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Name        string    `gorm:"not null" json:"name"`
	Description *string   `json:"description"`
	Poster      *string   `json:"poster"`
	SortOrder   int       `gorm:"default:0" json:"sortOrder"`

	Items []SiteCollectionItem `gorm:"foreignKey:SiteCollectionID" json:"items,omitempty"`
}

// SiteCollectionItem — элемент публичной коллекции (тип медиа + id).
type SiteCollectionItem struct {
	ID               uint   `gorm:"primaryKey" json:"id"`
	SiteCollectionID uint   `gorm:"not null;index" json:"siteCollectionId"`
	MediaType        string `gorm:"not null;size:32" json:"mediaType"` // movie, anime, game, tv-series, ...
	MediaID          uint   `gorm:"not null" json:"mediaId"`
	Position         int    `gorm:"default:0" json:"position"`
}
