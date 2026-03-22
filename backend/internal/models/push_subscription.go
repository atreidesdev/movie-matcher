package models

// PushSubscription — подписка пользователя на браузерные push-уведомления (Web Push API).
type PushSubscription struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	UserID    uint   `gorm:"not null;index;uniqueIndex:idx_user_push_endpoint" json:"userId"`
	Endpoint  string `gorm:"not null;uniqueIndex:idx_user_push_endpoint;size:2048" json:"endpoint"`
	P256dhKey string `gorm:"not null;size:512" json:"p256dhKey"` // ключ для ECDH (base64url)
	AuthKey   string `gorm:"not null;size:128" json:"authKey"`   // секрет (base64url)
}
