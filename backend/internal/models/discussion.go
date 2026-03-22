package models

import (
	"time"

	"gorm.io/gorm"
)

// Discussion — обсуждение (тред) на тему медиа. Привязано к entity_type + entity_id (фильм, сериал и т.д.).
type Discussion struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	EntityType  string         `gorm:"size:32;not null;index:idx_discussion_entity" json:"entityType"` // movie, tv_series, anime, ...
	EntityID    uint           `gorm:"not null;index:idx_discussion_entity" json:"entityId"`
	Title       string         `gorm:"size:512;not null" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	UserID      uint           `gorm:"not null" json:"userId"`
	User        User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CommentsCount int          `gorm:"-" json:"commentsCount,omitempty"`
}

// DiscussionComment — комментарий внутри обсуждения (дерево ответов через ParentID).
type DiscussionComment struct {
	ID         uint                `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time           `json:"createdAt"`
	UpdatedAt  time.Time           `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt      `gorm:"index" json:"-"`
	DiscussionID uint              `gorm:"not null;index" json:"discussionId"`
	Discussion   *Discussion      `gorm:"foreignKey:DiscussionID" json:"discussion,omitempty"`
	Text       string              `gorm:"type:text;not null" json:"text"`
	Depth      int                 `gorm:"default:0" json:"depth"`
	PlusCount  int                 `gorm:"default:0" json:"plusCount"`
	MinusCount int                 `gorm:"default:0" json:"minusCount"`
	UserID     uint                `gorm:"not null" json:"userId"`
	User       User                `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID   *uint               `json:"parentId"`
	Parent     *DiscussionComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies    []DiscussionComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int               `gorm:"-" json:"repliesCount,omitempty"`
}
