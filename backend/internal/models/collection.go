package models

import "time"

type Collection struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	UserID      uint      `gorm:"not null" json:"userId"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Name        string    `gorm:"not null" json:"name"`
	Description *string   `json:"description"`
	Poster      *string   `json:"poster"`

	Movies         []CollectionMovie         `gorm:"foreignKey:CollectionID" json:"movies,omitempty"`
	TVSeries       []CollectionTVSeries      `gorm:"foreignKey:CollectionID" json:"tvSeries,omitempty"`
	AnimeSeries    []CollectionAnimeSeries   `gorm:"foreignKey:CollectionID" json:"animeSeries,omitempty"`
	CartoonSeries  []CollectionCartoonSeries `gorm:"foreignKey:CollectionID" json:"cartoonSeries,omitempty"`
	CartoonMovies  []CollectionCartoonMovie  `gorm:"foreignKey:CollectionID" json:"cartoonMovies,omitempty"`
	AnimeMovies    []CollectionAnimeMovie    `gorm:"foreignKey:CollectionID" json:"animeMovies,omitempty"`
	Games          []CollectionGame          `gorm:"foreignKey:CollectionID" json:"games,omitempty"`
	Manga          []CollectionManga         `gorm:"foreignKey:CollectionID" json:"manga,omitempty"`
	Books          []CollectionBook          `gorm:"foreignKey:CollectionID" json:"books,omitempty"`
	LightNovels    []CollectionLightNovel    `gorm:"foreignKey:CollectionID" json:"lightNovels,omitempty"`
}

type CollectionMovie struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	CollectionID uint       `gorm:"not null" json:"collectionId"`
	Collection   Collection `gorm:"foreignKey:CollectionID" json:"-"`
	MovieID      uint       `gorm:"not null" json:"movieId"`
}

type CollectionTVSeries struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	CollectionID uint       `gorm:"not null" json:"collectionId"`
	Collection   Collection `gorm:"foreignKey:CollectionID" json:"-"`
	TVSeriesID   uint       `gorm:"not null" json:"tvSeriesId"`
}

type CollectionAnimeSeries struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	CollectionID  uint       `gorm:"not null" json:"collectionId"`
	Collection    Collection `gorm:"foreignKey:CollectionID" json:"-"`
	AnimeSeriesID uint       `gorm:"not null" json:"animeSeriesId"`
}

type CollectionCartoonSeries struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
	CollectionID    uint       `gorm:"not null" json:"collectionId"`
	Collection      Collection `gorm:"foreignKey:CollectionID" json:"-"`
	CartoonSeriesID uint       `gorm:"not null" json:"cartoonSeriesId"`
}

type CollectionCartoonMovie struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	CollectionID   uint       `gorm:"not null" json:"collectionId"`
	Collection     Collection `gorm:"foreignKey:CollectionID" json:"-"`
	CartoonMovieID uint       `gorm:"not null" json:"cartoonMovieId"`
}

type CollectionAnimeMovie struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	CollectionID uint       `gorm:"not null" json:"collectionId"`
	Collection   Collection `gorm:"foreignKey:CollectionID" json:"-"`
	AnimeMovieID uint       `gorm:"not null" json:"animeMovieId"`
}

type CollectionGame struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	CollectionID uint       `gorm:"not null" json:"collectionId"`
	Collection   Collection `gorm:"foreignKey:CollectionID" json:"-"`
	GameID       uint       `gorm:"not null" json:"gameId"`
}

type CollectionManga struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	CollectionID uint       `gorm:"not null" json:"collectionId"`
	Collection   Collection `gorm:"foreignKey:CollectionID" json:"-"`
	MangaID      uint       `gorm:"not null" json:"mangaId"`
}

type CollectionBook struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	CollectionID uint       `gorm:"not null" json:"collectionId"`
	Collection   Collection `gorm:"foreignKey:CollectionID" json:"-"`
	BookID       uint       `gorm:"not null" json:"bookId"`
}

type CollectionLightNovel struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	CollectionID uint       `gorm:"not null" json:"collectionId"`
	Collection   Collection `gorm:"foreignKey:CollectionID" json:"-"`
	LightNovelID uint       `gorm:"not null" json:"lightNovelId"`
}

type CreateCollectionRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
}
