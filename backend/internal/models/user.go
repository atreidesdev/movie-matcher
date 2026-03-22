package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

type SocialLinksMap map[string]string

func (s *SocialLinksMap) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("invalid type for SocialLinksMap")
	}
	if len(b) == 0 {
		*s = nil
		return nil
	}
	var m map[string]string
	if err := json.Unmarshal(b, &m); err != nil {
		return err
	}
	*s = m
	return nil
}

func (s SocialLinksMap) Value() (driver.Value, error) {
	if s == nil || len(s) == 0 {
		return nil, nil
	}
	return json.Marshal(s)
}

const (
	RoleUser           = "user"
	RoleAdmin          = "admin"
	RoleModerator      = "moderator"
	RoleContentCreator = "content_creator"
	RoleDeveloper      = "developer"
	RoleOwner          = "owner"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Username  *string        `gorm:"uniqueIndex;size:64" json:"username"` // уникальный для URL, латиница/цифры (nullable для старых записей)
	Name      *string        `json:"name"`
	Password  string         `gorm:"not null" json:"-"`
	Avatar    *string        `json:"avatar"`
	Role      string         `gorm:"default:user;not null" json:"role"`
	// SocialLinks — ссылки на соцсети (telegram, vk, twitter и т.д.). Ключ — платформа, значение — URL.
	SocialLinks SocialLinksMap `gorm:"type:text" json:"socialLinks,omitempty"`
	// CommentBanUntil — до этой даты пользователь не может писать комментарии (модератор/админ).
	CommentBanUntil *time.Time `json:"commentBanUntil,omitempty"`
	// LastSeenAt — последняя активность (обновляется при вызове POST /users/me/ping или при заходе).
	LastSeenAt *time.Time `json:"-"`

	Tokens               []Token               `gorm:"foreignKey:UserID" json:"-"`
	MovieReviews         []MovieReview         `gorm:"foreignKey:UserID" json:"movieReviews,omitempty"`
	MovieLists           []MovieList           `gorm:"foreignKey:UserID" json:"movieLists,omitempty"`
	MovieFavorites       []MovieFavorite       `gorm:"foreignKey:UserID" json:"movieFavorites,omitempty"`
	TVSeriesReviews      []TVSeriesReview      `gorm:"foreignKey:UserID" json:"tvSeriesReviews,omitempty"`
	TVSeriesLists        []TVSeriesList        `gorm:"foreignKey:UserID" json:"tvSeriesLists,omitempty"`
	TVSeriesFavorites    []TVSeriesFavorite    `gorm:"foreignKey:UserID" json:"tvSeriesFavorites,omitempty"`
	AnimeSeriesReviews   []AnimeSeriesReview   `gorm:"foreignKey:UserID" json:"animeSeriesReviews,omitempty"`
	AnimeSeriesLists     []AnimeSeriesList     `gorm:"foreignKey:UserID" json:"animeSeriesLists,omitempty"`
	AnimeSeriesFavorites []AnimeSeriesFavorite `gorm:"foreignKey:UserID" json:"animeSeriesFavorites,omitempty"`
	GameReviews          []GameReview          `gorm:"foreignKey:UserID" json:"gameReviews,omitempty"`
	GameLists            []GameList            `gorm:"foreignKey:UserID" json:"gameLists,omitempty"`
	GameFavorites        []GameFavorite        `gorm:"foreignKey:UserID" json:"gameFavorites,omitempty"`
	Collections          []Collection          `gorm:"foreignKey:UserID" json:"collections,omitempty"`

	CartoonSeriesReviews   []CartoonSeriesReview   `gorm:"foreignKey:UserID" json:"cartoonSeriesReviews,omitempty"`
	CartoonSeriesLists     []CartoonSeriesList     `gorm:"foreignKey:UserID" json:"cartoonSeriesLists,omitempty"`
	CartoonSeriesFavorites []CartoonSeriesFavorite `gorm:"foreignKey:UserID" json:"cartoonSeriesFavorites,omitempty"`
	CartoonMovieReviews    []CartoonMovieReview    `gorm:"foreignKey:UserID" json:"cartoonMovieReviews,omitempty"`
	CartoonMovieLists      []CartoonMovieList      `gorm:"foreignKey:UserID" json:"cartoonMovieLists,omitempty"`
	CartoonMovieFavorites  []CartoonMovieFavorite  `gorm:"foreignKey:UserID" json:"cartoonMovieFavorites,omitempty"`
	BookReviews            []BookReview            `gorm:"foreignKey:UserID" json:"bookReviews,omitempty"`
	BookLists              []BookList              `gorm:"foreignKey:UserID" json:"bookLists,omitempty"`
	BookFavorites          []BookFavorite          `gorm:"foreignKey:UserID" json:"bookFavorites,omitempty"`
	LightNovelReviews      []LightNovelReview      `gorm:"foreignKey:UserID" json:"lightNovelReviews,omitempty"`
	LightNovelLists        []LightNovelList        `gorm:"foreignKey:UserID" json:"lightNovelLists,omitempty"`
	LightNovelFavorites    []LightNovelFavorite    `gorm:"foreignKey:UserID" json:"lightNovelFavorites,omitempty"`

	CharacterFavorites []CharacterFavorite `gorm:"foreignKey:UserID" json:"characterFavorites,omitempty"`
	PersonFavorites    []PersonFavorite     `gorm:"foreignKey:UserID" json:"personFavorites,omitempty"`
	CastFavorites      []CastFavorite       `gorm:"foreignKey:UserID" json:"castFavorites,omitempty"`

	SentFriendRequests     []FriendRequest `gorm:"foreignKey:SenderID" json:"-"`
	ReceivedFriendRequests []FriendRequest `gorm:"foreignKey:ReceiverID" json:"-"`
	Friendships            []Friendship    `gorm:"foreignKey:UserID" json:"-"`
	Following              []Follow        `gorm:"foreignKey:FollowerID" json:"-"`
	Followers              []Follow        `gorm:"foreignKey:FollowingID" json:"-"`

	Notifications []Notification `gorm:"foreignKey:UserID" json:"-"`
	Settings      *UserSettings  `gorm:"foreignKey:UserID" json:"settings,omitempty"`
}

type Token struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	UserID     uint       `gorm:"not null" json:"userId"`
	User       User       `gorm:"foreignKey:UserID" json:"-"`
	Token      string     `gorm:"uniqueIndex;not null" json:"-"`
	IsActive   bool       `gorm:"default:true" json:"isActive"`
	ExpiresAt  *time.Time `json:"expiresAt"`
	DeviceName string     `gorm:"size:255" json:"deviceName,omitempty"`
	UserAgent  string     `gorm:"size:512" json:"userAgent,omitempty"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
}

type SessionResponse struct {
	ID         uint       `json:"id"`
	DeviceName string     `json:"deviceName"`
	UserAgent  string     `json:"userAgent"`
	CreatedAt  time.Time  `json:"createdAt"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
}

func (t *Token) ToSessionResponse() SessionResponse {
	return SessionResponse{
		ID:         t.ID,
		DeviceName: t.DeviceName,
		UserAgent:  t.UserAgent,
		CreatedAt:  t.CreatedAt,
		LastUsedAt: t.LastUsedAt,
	}
}

type UserResponse struct {
	ID          uint            `json:"id"`
	Username    *string         `json:"username"`
	Email       string          `json:"email"`
	Name        *string         `json:"name"`
	Avatar      *string         `json:"avatar"`
	Role        string          `json:"role"`
	CreatedAt   time.Time       `json:"createdAt"`
	SocialLinks SocialLinksMap  `json:"socialLinks,omitempty"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:          u.ID,
		Username:    u.Username,
		Name:        u.Name,
		Email:       u.Email,
		Avatar:      u.Avatar,
		Role:        u.Role,
		CreatedAt:   u.CreatedAt,
		SocialLinks: u.SocialLinks,
	}
}

func (u *User) IsOwner() bool {
	return u.Role == RoleOwner
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin || u.Role == RoleOwner
}

func (u *User) IsModerator() bool {
	return u.Role == RoleModerator
}

func (u *User) IsContentCreator() bool {
	return u.Role == RoleContentCreator
}

// CanManageContent — добавление/редактирование контента (жанры, фильмы и т.д.)
func (u *User) CanManageContent() bool {
	return u.Role == RoleAdmin || u.Role == RoleContentCreator || u.Role == RoleOwner
}

func (u *User) CanWriteDevBlog() bool {
	return u.Role == RoleDeveloper || u.Role == RoleAdmin || u.Role == RoleOwner
}

func (u *User) CanWriteNews() bool {
	return u.Role == RoleAdmin || u.Role == RoleContentCreator || u.Role == RoleDeveloper || u.Role == RoleOwner
}

func (u *User) CanDeleteAnyComment() bool {
	return u.Role == RoleAdmin || u.Role == RoleModerator || u.Role == RoleOwner
}

func (u *User) CanAssignRole(targetRole string) bool {
	if u.Role == RoleOwner {
		return true
	}
	if u.Role != RoleAdmin {
		return false
	}
	return targetRole != RoleAdmin && targetRole != RoleOwner
}

type PasswordResetToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UserID    uint      `gorm:"not null;index" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Token     string    `gorm:"uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	Used      bool      `gorm:"default:false" json:"used"`
}
