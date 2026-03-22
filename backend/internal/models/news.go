package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

type NewsAttachment struct {
	Type string `json:"type"` // "image" | "video"
	Path string `json:"path"` // URL путь, напр. /uploads/images/xxx.jpg
}

type NewsAttachmentsSlice []NewsAttachment

func (n *NewsAttachmentsSlice) Scan(value interface{}) error {
	if value == nil {
		*n = nil
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for NewsAttachmentsSlice")
	}
	if len(b) == 0 {
		*n = nil
		return nil
	}
	var s []NewsAttachment
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	*n = s
	return nil
}

func (n NewsAttachmentsSlice) Value() (driver.Value, error) {
	if n == nil || len(n) == 0 {
		return nil, nil
	}
	return json.Marshal(n)
}

type News struct {
	ID            uint                 `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time            `json:"createdAt"`
	UpdatedAt     time.Time            `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt       `gorm:"index" json:"-"`

	AuthorID      uint   `gorm:"not null;index" json:"authorId"`
	Author        User   `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Title         string `gorm:"not null" json:"title"`
	Slug          string `gorm:"size:256;index" json:"slug,omitempty"`
	PreviewImage  string `gorm:"size:512" json:"previewImage,omitempty"`  // URL превью
	PreviewTitle  string `gorm:"size:512" json:"previewTitle,omitempty"`   // подпись под превью (если отличается от Title)
	Body          string `gorm:"type:text;not null" json:"body"`           // HTML контент
	Tags          string `gorm:"type:text" json:"tags,omitempty"`          // через запятую или JSON массив — храним как строку
	Attachments   NewsAttachmentsSlice `gorm:"type:text" json:"attachments,omitempty"` // прикреплённые картинки/видео
}

type NewsComment struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Text         string         `gorm:"not null" json:"text"`
	Depth        int            `gorm:"default:0" json:"depth"`
	PlusCount    int            `gorm:"default:0" json:"plusCount"`
	MinusCount   int            `gorm:"default:0" json:"minusCount"`
	UserID       uint           `gorm:"not null" json:"userId"`
	User         User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID     *uint          `json:"parentId"`
	Parent       *NewsComment   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies      []NewsComment  `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int            `gorm:"-" json:"repliesCount,omitempty"`
	NewsID       uint           `gorm:"not null;index" json:"newsId"`
	News         News           `gorm:"foreignKey:NewsID" json:"news,omitempty"`
}
