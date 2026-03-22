package models

import (
	"time"

	"gorm.io/gorm"
)

// Conversation — личный диалог между двумя пользователями (друзьями).
// Храним упорядоченную пару User1ID < User2ID для уникальности.
type Conversation struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	User1ID   uint      `gorm:"uniqueIndex:idx_conv_pair;not null" json:"user1Id"`
	User1     User      `gorm:"foreignKey:User1ID" json:"user1,omitempty"`
	User2ID   uint      `gorm:"uniqueIndex:idx_conv_pair;not null" json:"user2Id"`
	User2     User      `gorm:"foreignKey:User2ID" json:"user2,omitempty"`

	Messages []Message `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

// Message — сообщение в диалоге. Тело хранится в зашифрованном виде.
type Message struct {
	ID             uint            `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time       `json:"createdAt"`
	ConversationID uint            `gorm:"index;not null" json:"conversationId"`
	SenderID       uint            `gorm:"not null" json:"senderId"`
	Sender         User            `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	BodyEncrypted  []byte          `gorm:"type:bytea;not null" json:"-"` // AES-GCM ciphertext
	Nonce          []byte          `gorm:"type:bytea;not null" json:"-"` // 12 bytes for GCM
	ReadAt         *time.Time      `json:"readAt"`
	DeletedAt      gorm.DeletedAt  `gorm:"index" json:"-"`

	// Body — расшифрованный текст, только при отдаче клиенту (gorm не сохраняет).
	Body string `gorm:"-" json:"body,omitempty"`
}
