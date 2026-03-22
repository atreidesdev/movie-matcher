package models

import "time"

const (
	NotificationTypeFriendRequest   = "friend_request"
	NotificationTypeFriendAccepted  = "friend_accepted"
	NotificationTypeNewFollower      = "new_follower"
	NotificationTypeCommentReply     = "comment_reply"
	NotificationTypeReviewReply      = "review_reply"
	NotificationTypeMention          = "mention"
	NotificationTypeListUpdate       = "list_update"
	NotificationTypeCollectionAdd    = "collection_add"
	NotificationTypeCommentBan       = "comment_ban"
	NotificationTypeMediaUpdate = "media_update"
)

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UserID    uint      `gorm:"not null;index" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Type      string    `gorm:"not null" json:"type"`
	Title     string    `gorm:"not null" json:"title"`
	Body      *string   `json:"body"`
	ReadAt    *time.Time `json:"readAt"`
	RelatedType string `json:"relatedType"` // comment, review, user, friend_request, ...
	RelatedID   uint   `json:"relatedId"`
	Extra       JSONMap `gorm:"type:jsonb" json:"extra,omitempty"`
}
