package models

import "time"

// ModeratorActionType — тип действия модератора по жалобе.
const (
	ModeratorActionResolve = "resolve"
	ModeratorActionReject  = "reject"
	ModeratorActionBan     = "ban"
)

// ModeratorActionLog — лог решения модератора по жалобе (resolve/reject/ban).
type ModeratorActionLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	ReportID    uint      `gorm:"not null;index" json:"reportId"`
	ModeratorID uint      `gorm:"not null" json:"moderatorId"`
	Action      string    `gorm:"not null;size:32" json:"action"` // resolve, reject, ban
	Note        *string   `gorm:"type:text" json:"note,omitempty"`
	// При action=ban — до какой даты забанен автор (опционально для лога).
	BanUntil *time.Time `json:"banUntil,omitempty"`
}

func (ModeratorActionLog) TableName() string {
	return "moderator_action_logs"
}
