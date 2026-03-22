package models

import "time"

type MovieFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MovieID   uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"movieId"`
	Movie     Movie     `gorm:"foreignKey:MovieID" json:"movie,omitempty"`
}

type TVSeriesFavorite struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	UserID     uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TVSeriesID uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"tvSeriesId"`
	TVSeries   TVSeries  `gorm:"foreignKey:TVSeriesID" json:"tvSeries,omitempty"`
}

type AnimeSeriesFavorite struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
	UserID        uint        `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User          User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AnimeSeriesID uint        `gorm:"uniqueIndex:idx_user_entity;not null" json:"animeSeriesId"`
	AnimeSeries   AnimeSeries `gorm:"foreignKey:AnimeSeriesID" json:"animeSeries,omitempty"`
}

type CartoonSeriesFavorite struct {
	ID              uint          `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time     `json:"createdAt"`
	UpdatedAt       time.Time     `json:"updatedAt"`
	UserID          uint          `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User            User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CartoonSeriesID uint          `gorm:"uniqueIndex:idx_user_entity;not null" json:"cartoonSeriesId"`
	CartoonSeries   CartoonSeries `gorm:"foreignKey:CartoonSeriesID" json:"cartoonSeries,omitempty"`
}

type CartoonMovieFavorite struct {
	ID             uint         `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
	UserID         uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User           User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CartoonMovieID uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"cartoonMovieId"`
	CartoonMovie   CartoonMovie `gorm:"foreignKey:CartoonMovieID" json:"cartoonMovie,omitempty"`
}

type AnimeMovieFavorite struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	UserID       uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User         User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AnimeMovieID uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"animeMovieId"`
	AnimeMovie   AnimeMovie `gorm:"foreignKey:AnimeMovieID" json:"animeMovie,omitempty"`
}

type GameFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	GameID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"gameId"`
	Game      Game      `gorm:"foreignKey:GameID" json:"game,omitempty"`
}

type MangaFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MangaID   uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"mangaId"`
	Manga     Manga     `gorm:"foreignKey:MangaID" json:"manga,omitempty"`
}

type BookFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BookID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"bookId"`
	Book      Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
}

type LightNovelFavorite struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	UserID       uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User         User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	LightNovelID uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"lightNovelId"`
	LightNovel   LightNovel `gorm:"foreignKey:LightNovelID" json:"lightNovel,omitempty"`
}

type CharacterFavorite struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	UserID      uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CharacterID uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"characterId"`
	Character   Character `gorm:"foreignKey:CharacterID" json:"character,omitempty"`
}

type PersonFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PersonID  uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"personId"`
	Person    Person    `gorm:"foreignKey:PersonID" json:"person,omitempty"`
}

type CastFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CastID    uint      `gorm:"uniqueIndex:idx_user_entity;not null" json:"castId"`
	Cast      Cast      `gorm:"foreignKey:CastID" json:"cast,omitempty"`
}
