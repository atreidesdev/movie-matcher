package models

import (
	"time"

	"gorm.io/gorm"
)

// DevBlogPost — пост в блоге разработчика. Писать могут developer, admin, owner.
type DevBlogPost struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	AuthorID uint  `gorm:"not null;index" json:"authorId"`
	Author   User  `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Title    string `gorm:"not null" json:"title"`
	Body     string `gorm:"type:text;not null" json:"body"`
	// Slug для URL (опционально, можно строить из id).
	Slug string `gorm:"size:256;index" json:"slug,omitempty"`
}
