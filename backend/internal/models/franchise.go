package models

import (
	"time"

	"github.com/lib/pq"
)

type Franchise struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	Name        string         `gorm:"uniqueIndex;not null" json:"name"`
	NameI18n    *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Description *string        `json:"description"`
	Poster      *string        `json:"poster"`
	Aliases     pq.StringArray `gorm:"type:text[]" json:"aliases"`
	Links       []FranchiseMediaLink `gorm:"foreignKey:FranchiseID" json:"links,omitempty"`
}

type FranchiseMediaLink struct {
	ID            uint              `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time         `json:"createdAt"`
	UpdatedAt     time.Time         `json:"updatedAt"`
	FranchiseID   uint              `gorm:"not null" json:"franchiseId"`
	Franchise     Franchise         `gorm:"foreignKey:FranchiseID" json:"franchise,omitempty"`
	FromMediaType MediaType         `gorm:"not null" json:"fromMediaType"`
	FromMediaID   uint              `gorm:"not null" json:"fromMediaId"`
	ToMediaType   MediaType         `gorm:"not null" json:"toMediaType"`
	ToMediaID     uint              `gorm:"not null" json:"toMediaId"`
	RelationType  MediaRelationType `gorm:"not null" json:"relationType"`
	OrderNumber   *int              `json:"orderNumber"`
	IsCanon       *bool             `json:"isCanon"`
	Note          *string           `json:"note"`
}
