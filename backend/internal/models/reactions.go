package models

import "time"

const (
	ReviewTargetMovie         = "movie_review"
	ReviewTargetTVSeries      = "tv_series_review"
	ReviewTargetAnimeSeries   = "anime_series_review"
	ReviewTargetCartoonSeries = "cartoon_series_review"
	ReviewTargetCartoonMovie  = "cartoon_movie_review"
	ReviewTargetAnimeMovie    = "anime_movie_review"
	ReviewTargetGame          = "game_review"
	ReviewTargetManga         = "manga_review"
	ReviewTargetBook          = "book_review"
	ReviewTargetLightNovel     = "light_novel_review"
)

// ReviewReaction — реакция на отзыв (лайк, полезно, любовь, смех, грусть, злость, дизлайк).
// Один пользователь — одна реакция на отзыв (можно менять тип).
type ReviewReaction struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	UserID     uint   `gorm:"uniqueIndex:idx_review_reaction;not null" json:"userId"`
	User       User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TargetType string `gorm:"uniqueIndex:idx_review_reaction;size:32;not null" json:"targetType"` // movie_review, game_review, ...
	TargetID   uint   `gorm:"uniqueIndex:idx_review_reaction;not null" json:"targetId"`
	Reaction   string `gorm:"size:24;not null" json:"reaction"` // like, useful, love, laugh, sad, angry, dislike
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// CommentEmojiReaction — эмодзи-реакция на комментарий (один эмодзи на пользователя на комментарий).
type CommentEmojiReaction struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UserID     uint      `gorm:"uniqueIndex:idx_comment_emoji_reaction;not null" json:"userId"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	EntityType string    `gorm:"uniqueIndex:idx_comment_emoji_reaction;size:32;not null" json:"entityType"` // movie, anime, game, ...
	CommentID  uint      `gorm:"uniqueIndex:idx_comment_emoji_reaction;not null" json:"commentId"`
	Emoji      string    `gorm:"size:24;not null" json:"emoji"` // like, heart, laugh, sad, angry, wow
}
