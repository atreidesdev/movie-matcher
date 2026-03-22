package models

import "time"

const (
	ProfileVisibilityPublic  = "public"  // открытый: все видят списки, избранное, рецензии, коллекции
	ProfileVisibilityFriends = "friends" // только друзьям
	ProfileVisibilityPrivate = "private" // скрытый: только владелец
)

type UserSettings struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`

	// Тема: "light", "dark", "system"
	Theme string `gorm:"default:system" json:"theme"`
	// Уведомления по email
	EmailNotifications bool `gorm:"default:true" json:"emailNotifications"`
	// Уведомления о новых подписчиках
	NotifyNewFollowers bool `gorm:"default:true" json:"notifyNewFollowers"`
	// Уведомления об ответах на комментарии
	NotifyCommentReplies bool `gorm:"default:true" json:"notifyCommentReplies"`
	// Видимость профиля: public | friends | private
	ProfileVisibility string `gorm:"default:public;not null" json:"profileVisibility"`
	// Язык интерфейса
	Locale string `gorm:"default:ru" json:"locale"`
}
