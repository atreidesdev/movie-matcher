package models

import "time"

const (
	ReportStatusPending  = "pending"
	ReportStatusResolved = "resolved"
	ReportStatusRejected = "rejected"
)

// ReportTargetType — тип объекта жалобы.
const (
	ReportTargetComment = "comment"
	ReportTargetReview  = "review"
	ReportTargetUser    = "user"
)

type Report struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	ReporterID uint     `gorm:"not null;index" json:"reporterId"`
	Reporter   User     `gorm:"foreignKey:ReporterID" json:"-"`

	TargetType string `gorm:"not null;index" json:"targetType"` // comment, review, user
	TargetID   uint   `gorm:"not null;index" json:"targetId"`
	// Для комментариев/рецензий — тип медиа и id медиа (опционально, для контекста)
	TargetEntityType string `json:"targetEntityType"`
	TargetEntityID   uint   `json:"targetEntityId"`

	Reason  string  `gorm:"not null" json:"reason"` // spam, abuse, spoiler, other
	Comment *string `json:"comment"`

	Status    string     `gorm:"default:pending;index" json:"status"`
	ResolvedAt *time.Time `json:"resolvedAt"`
	ResolvedBy *uint      `json:"resolvedBy"`
	ModeratorNote *string `json:"moderatorNote"`
}
