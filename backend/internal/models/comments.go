package models

import (
	"time"

	"gorm.io/gorm"
)

// CommentEntityType для реакций (таблица comment_reactions).
const (
	CommentEntityMovie        = "movie"
	CommentEntityTVSeries     = "tv_series"
	CommentEntityCartoonSeries = "cartoon_series"
	CommentEntityCartoonMovie = "cartoon_movie"
	CommentEntityAnime        = "anime"
	CommentEntityAnimeMovie   = "anime_movie"
	CommentEntityGame         = "game"
	CommentEntityManga        = "manga"
	CommentEntityBook         = "book"
	CommentEntityLightNovel   = "light_novel"
)

type CommentReaction struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	UserID     uint   `gorm:"uniqueIndex:idx_comment_reaction;not null" json:"userId"`
	User       User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	EntityType string `gorm:"uniqueIndex:idx_comment_reaction;size:32;not null" json:"entityType"` // movie, anime, game, ...
	CommentID  uint   `gorm:"uniqueIndex:idx_comment_reaction;not null" json:"commentId"`
	Value      int    `gorm:"not null" json:"value"` // 1 = plus, -1 = minus
}

type MovieComment struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	Text       string         `gorm:"not null" json:"text"`
	Depth      int            `gorm:"default:0" json:"depth"`
	PlusCount  int            `gorm:"default:0" json:"plusCount"`
	MinusCount int            `gorm:"default:0" json:"minusCount"`
	UserID     uint           `gorm:"not null" json:"userId"`
	User       User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID   *uint          `json:"parentId"`
	Parent     *MovieComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies      []MovieComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int            `gorm:"-" json:"repliesCount,omitempty"` // число прямых ответов в БД
	MovieID      uint           `gorm:"not null" json:"movieId"`
	Movie        Movie          `gorm:"foreignKey:MovieID" json:"movie,omitempty"`
}

type TVSeriesComment struct {
	ID           uint              `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt    `gorm:"index" json:"-"`
	Text         string            `gorm:"not null" json:"text"`
	Depth        int               `gorm:"default:0" json:"depth"`
	PlusCount    int               `gorm:"default:0" json:"plusCount"`
	MinusCount   int               `gorm:"default:0" json:"minusCount"`
	UserID       uint              `gorm:"not null" json:"userId"`
	User         User              `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID     *uint             `json:"parentId"`
	Parent       *TVSeriesComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies      []TVSeriesComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int               `gorm:"-" json:"repliesCount,omitempty"`
	TVSeriesID   uint              `gorm:"not null" json:"tvSeriesId"`
	TVSeries     TVSeries          `gorm:"foreignKey:TVSeriesID" json:"tvSeries,omitempty"`
}

type AnimeSeriesComment struct {
	ID            uint                 `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time            `json:"createdAt"`
	UpdatedAt     time.Time            `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt       `gorm:"index" json:"-"`
	Text          string               `gorm:"not null" json:"text"`
	Depth         int                  `gorm:"default:0" json:"depth"`
	PlusCount     int                  `gorm:"default:0" json:"plusCount"`
	MinusCount    int                  `gorm:"default:0" json:"minusCount"`
	UserID        uint                 `gorm:"not null" json:"userId"`
	User          User                 `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID      *uint                `json:"parentId"`
	Parent        *AnimeSeriesComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies       []AnimeSeriesComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount  int                 `gorm:"-" json:"repliesCount,omitempty"`
	AnimeSeriesID uint                `gorm:"not null" json:"animeSeriesId"`
	AnimeSeries   AnimeSeries          `gorm:"foreignKey:AnimeSeriesID" json:"animeSeries,omitempty"`
}

type CartoonSeriesComment struct {
	ID              uint                   `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time              `json:"createdAt"`
	UpdatedAt       time.Time              `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt          `gorm:"index" json:"-"`
	Text            string                 `gorm:"not null" json:"text"`
	Depth           int                    `gorm:"default:0" json:"depth"`
	PlusCount       int                    `gorm:"default:0" json:"plusCount"`
	MinusCount      int                    `gorm:"default:0" json:"minusCount"`
	UserID          uint                   `gorm:"not null" json:"userId"`
	User            User                    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID        *uint                  `json:"parentId"`
	Parent          *CartoonSeriesComment   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies         []CartoonSeriesComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount    int                    `gorm:"-" json:"repliesCount,omitempty"`
	CartoonSeriesID uint                    `gorm:"not null" json:"cartoonSeriesId"`
	CartoonSeries   CartoonSeries           `gorm:"foreignKey:CartoonSeriesID" json:"cartoonSeries,omitempty"`
}

type CartoonMovieComment struct {
	ID             uint                   `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time              `json:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt          `gorm:"index" json:"-"`
	Text           string                 `gorm:"not null" json:"text"`
	Depth          int                     `gorm:"default:0" json:"depth"`
	PlusCount      int                     `gorm:"default:0" json:"plusCount"`
	MinusCount     int                     `gorm:"default:0" json:"minusCount"`
	UserID         uint                    `gorm:"not null" json:"userId"`
	User           User                     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID       *uint                   `json:"parentId"`
	Parent         *CartoonMovieComment    `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies        []CartoonMovieComment  `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount   int                     `gorm:"-" json:"repliesCount,omitempty"`
	CartoonMovieID uint                    `gorm:"not null" json:"cartoonMovieId"`
	CartoonMovie   CartoonMovie            `gorm:"foreignKey:CartoonMovieID" json:"cartoonMovie,omitempty"`
}

type AnimeMovieComment struct {
	ID           uint                 `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time            `json:"createdAt"`
	UpdatedAt    time.Time            `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt        `gorm:"index" json:"-"`
	Text         string               `gorm:"not null" json:"text"`
	Depth        int                  `gorm:"default:0" json:"depth"`
	PlusCount    int                  `gorm:"default:0" json:"plusCount"`
	MinusCount   int                  `gorm:"default:0" json:"minusCount"`
	UserID       uint                 `gorm:"not null" json:"userId"`
	User         User                  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID     *uint                `json:"parentId"`
	Parent       *AnimeMovieComment   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies      []AnimeMovieComment  `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int                  `gorm:"-" json:"repliesCount,omitempty"`
	AnimeMovieID uint                 `gorm:"not null" json:"animeMovieId"`
	AnimeMovie   AnimeMovie           `gorm:"foreignKey:AnimeMovieID" json:"animeMovie,omitempty"`
}

type MangaComment struct {
	ID         uint            `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time       `json:"createdAt"`
	UpdatedAt  time.Time       `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt  `gorm:"index" json:"-"`
	Text       string          `gorm:"not null" json:"text"`
	Depth      int             `gorm:"default:0" json:"depth"`
	PlusCount  int             `gorm:"default:0" json:"plusCount"`
	MinusCount int             `gorm:"default:0" json:"minusCount"`
	UserID     uint            `gorm:"not null" json:"userId"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID  *uint          `json:"parentId"`
	Parent    *MangaComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies       []MangaComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int            `gorm:"-" json:"repliesCount,omitempty"`
	MangaID      uint           `gorm:"not null" json:"mangaId"`
	Manga     Manga          `gorm:"foreignKey:MangaID" json:"manga,omitempty"`
}

type GameComment struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	Text       string         `gorm:"not null" json:"text"`
	Depth      int            `gorm:"default:0" json:"depth"`
	PlusCount  int            `gorm:"default:0" json:"plusCount"`
	MinusCount int            `gorm:"default:0" json:"minusCount"`
	UserID     uint           `gorm:"not null" json:"userId"`
	User      User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID  *uint         `json:"parentId"`
	Parent    *GameComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies       []GameComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int          `gorm:"-" json:"repliesCount,omitempty"`
	GameID       uint         `gorm:"not null" json:"gameId"`
	Game         Game         `gorm:"foreignKey:GameID" json:"game,omitempty"`
}

type BookComment struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	Text       string         `gorm:"not null" json:"text"`
	Depth      int            `gorm:"default:0" json:"depth"`
	PlusCount  int            `gorm:"default:0" json:"plusCount"`
	MinusCount int            `gorm:"default:0" json:"minusCount"`
	UserID     uint           `gorm:"not null" json:"userId"`
	User      User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID  *uint         `json:"parentId"`
	Parent    *BookComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies       []BookComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount int          `gorm:"-" json:"repliesCount,omitempty"`
	BookID       uint         `gorm:"not null" json:"bookId"`
	Book         Book         `gorm:"foreignKey:BookID" json:"book,omitempty"`
}

type LightNovelComment struct {
	ID           uint                `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time           `json:"createdAt"`
	UpdatedAt    time.Time           `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt      `gorm:"index" json:"-"`
	Text         string              `gorm:"not null" json:"text"`
	Depth        int                 `gorm:"default:0" json:"depth"`
	PlusCount    int                 `gorm:"default:0" json:"plusCount"`
	MinusCount   int                 `gorm:"default:0" json:"minusCount"`
	UserID       uint                `gorm:"not null" json:"userId"`
	User         User                `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID     *uint               `json:"parentId"`
	Parent       *LightNovelComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies       []LightNovelComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	RepliesCount  int                 `gorm:"-" json:"repliesCount,omitempty"`
	LightNovelID  uint                `gorm:"not null" json:"lightNovelId"`
	LightNovel   LightNovel          `gorm:"foreignKey:LightNovelID" json:"lightNovel,omitempty"`
}

type PersonComment struct {
	ID        uint            `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
	DeletedAt gorm.DeletedAt  `gorm:"index" json:"-"`
	Text      string          `gorm:"not null" json:"text"`
	Depth     int             `gorm:"default:0" json:"depth"`
	UserID    uint            `gorm:"not null" json:"userId"`
	User      User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID  *uint           `json:"parentId"`
	Parent    *PersonComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies   []PersonComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	PersonID  uint            `gorm:"not null" json:"personId"`
	Person    Person          `gorm:"foreignKey:PersonID" json:"person,omitempty"`
}

type CharacterComment struct {
	ID          uint               `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt     `gorm:"index" json:"-"`
	Text        string             `gorm:"not null" json:"text"`
	Depth       int                `gorm:"default:0" json:"depth"`
	UserID      uint               `gorm:"not null" json:"userId"`
	User        User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID    *uint              `json:"parentId"`
	Parent      *CharacterComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies     []CharacterComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	CharacterID uint               `gorm:"not null" json:"characterId"`
	Character   Character          `gorm:"foreignKey:CharacterID" json:"character,omitempty"`
}
