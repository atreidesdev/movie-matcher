package models

import (
	"time"
)

const (
	ActivityTypeListAdd      = "list_add"
	ActivityTypeListUpdate   = "list_update"
	ActivityTypeFavoriteAdd  = "favorite_add"
	ActivityTypeCollectionAdd = "collection_add"
	ActivityTypeReview       = "review"
)

type Activity struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UserID     uint      `gorm:"not null;index" json:"userId"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type       string    `gorm:"not null" json:"type"`
	MediaType  string    `json:"mediaType"`  // movie, anime, game, ...
	MediaID    uint      `json:"mediaId"`
	MediaTitle string    `json:"mediaTitle"` // для отображения без джойна
	Extra      JSONMap   `gorm:"type:jsonb" json:"extra,omitempty"`
}
