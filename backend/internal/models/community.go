package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// CommunityPostAttachment — прикреплённое изображение/видео к посту.
type CommunityPostAttachment struct {
	Type string `json:"type"` // "image" | "video"
	Path string `json:"path"`
}

// CommunityPostAttachmentsSlice — JSON slice для GORM.
type CommunityPostAttachmentsSlice []CommunityPostAttachment

func (c *CommunityPostAttachmentsSlice) Scan(value interface{}) error {
	if value == nil {
		*c = nil
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for CommunityPostAttachmentsSlice")
	}
	if len(b) == 0 {
		*c = nil
		return nil
	}
	var s []CommunityPostAttachment
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	*c = s
	return nil
}

func (c CommunityPostAttachmentsSlice) Value() (driver.Value, error) {
	if c == nil || len(c) == 0 {
		return nil, nil
	}
	return json.Marshal(c)
}

// Community — сообщество, созданное пользователем. Другие могут подписаться и видеть посты в ленте.
type Community struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string `gorm:"size:256;not null" json:"name"`
	Slug        string `gorm:"size:256;uniqueIndex;not null" json:"slug"`
	Description string `gorm:"type:text" json:"description"`
	Avatar      string `gorm:"size:512" json:"avatar,omitempty"`
	Cover       string `gorm:"size:512" json:"cover,omitempty"`

	CreatorID uint `gorm:"not null;index" json:"creatorId"`
	Creator   User `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`
}

// CommunitySubscription — подписка пользователя на сообщество.
type CommunitySubscription struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UserID      uint      `gorm:"uniqueIndex:idx_community_sub_user;not null" json:"userId"`
	CommunityID uint      `gorm:"uniqueIndex:idx_community_sub_user;not null" json:"communityId"`
}

// CommunityPost — пост (новость) в сообществе.
type CommunityPost struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	CommunityID uint `gorm:"not null;index" json:"communityId"`
	Community   Community `gorm:"foreignKey:CommunityID" json:"community,omitempty"`

	AuthorID uint `gorm:"not null" json:"authorId"`
	Author   User `gorm:"foreignKey:AuthorID" json:"author,omitempty"`

	Title        string                     `gorm:"size:512;not null" json:"title"`
	Body         string                     `gorm:"type:text;not null" json:"body"`
	PreviewImage string                     `gorm:"size:512" json:"previewImage,omitempty"`
	Attachments  CommunityPostAttachmentsSlice `gorm:"type:text" json:"attachments,omitempty"`
}
