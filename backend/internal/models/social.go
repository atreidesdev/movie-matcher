package models

import "time"

type FriendRequest struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	SenderID   uint      `gorm:"not null" json:"senderId"`
	Sender     User      `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	ReceiverID uint      `gorm:"not null" json:"receiverId"`
	Receiver   User      `gorm:"foreignKey:ReceiverID" json:"receiver,omitempty"`
}

type Friendship struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex:idx_friendship_pair;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	FriendID  uint      `gorm:"uniqueIndex:idx_friendship_pair;not null" json:"friendId"`
}

type Follow struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	FollowerID  uint      `gorm:"uniqueIndex:idx_follow_pair;not null" json:"followerId"`
	Follower    User      `gorm:"foreignKey:FollowerID" json:"follower,omitempty"`
	FollowingID uint      `gorm:"uniqueIndex:idx_follow_pair;not null" json:"followingId"`
	Following   User      `gorm:"foreignKey:FollowingID" json:"following,omitempty"`
}
