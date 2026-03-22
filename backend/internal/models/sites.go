package models

import "time"

type Site struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Name        string    `gorm:"uniqueIndex;not null" json:"name"`
	URL         string    `gorm:"not null" json:"url"`
	Icon        *string   `json:"icon"`
	Description *string   `json:"description"`
}

type MovieSite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	SiteID    uint      `gorm:"not null" json:"siteId"`
	Site      Site      `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	MovieID   uint      `gorm:"not null" json:"movieId"`
	Movie     Movie     `gorm:"foreignKey:MovieID" json:"movie,omitempty"`
	URL       string    `gorm:"not null" json:"url"`
}

type TVSeriesSite struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	SiteID     uint      `gorm:"not null" json:"siteId"`
	Site       Site      `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	TVSeriesID uint      `gorm:"not null" json:"tvSeriesId"`
	TVSeries   TVSeries  `gorm:"foreignKey:TVSeriesID" json:"tvSeries,omitempty"`
	URL        string    `gorm:"not null" json:"url"`
}

type AnimeSeriesSite struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
	SiteID        uint        `gorm:"not null" json:"siteId"`
	Site          Site        `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	AnimeSeriesID uint        `gorm:"not null" json:"animeSeriesId"`
	AnimeSeries   AnimeSeries `gorm:"foreignKey:AnimeSeriesID" json:"animeSeries,omitempty"`
	URL           string      `gorm:"not null" json:"url"`
}

type CartoonSeriesSite struct {
	ID              uint          `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time     `json:"createdAt"`
	UpdatedAt       time.Time     `json:"updatedAt"`
	SiteID          uint          `gorm:"not null" json:"siteId"`
	Site            Site          `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	CartoonSeriesID uint          `gorm:"not null" json:"cartoonSeriesId"`
	CartoonSeries   CartoonSeries `gorm:"foreignKey:CartoonSeriesID" json:"cartoonSeries,omitempty"`
	URL             string        `gorm:"not null" json:"url"`
}

type CartoonMovieSite struct {
	ID             uint         `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
	SiteID         uint         `gorm:"not null" json:"siteId"`
	Site           Site         `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	CartoonMovieID uint         `gorm:"not null" json:"cartoonMovieId"`
	CartoonMovie   CartoonMovie `gorm:"foreignKey:CartoonMovieID" json:"cartoonMovie,omitempty"`
	URL            string       `gorm:"not null" json:"url"`
}

type AnimeMovieSite struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	SiteID       uint       `gorm:"not null" json:"siteId"`
	Site         Site       `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	AnimeMovieID uint       `gorm:"not null" json:"animeMovieId"`
	AnimeMovie   AnimeMovie `gorm:"foreignKey:AnimeMovieID" json:"animeMovie,omitempty"`
	URL          string     `gorm:"not null" json:"url"`
}

type MangaSite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	SiteID    uint      `gorm:"not null" json:"siteId"`
	Site      Site      `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	MangaID   uint      `gorm:"not null" json:"mangaId"`
	Manga     Manga     `gorm:"foreignKey:MangaID" json:"manga,omitempty"`
	URL       string    `gorm:"not null" json:"url"`
}

type GameSite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	SiteID    uint      `gorm:"not null" json:"siteId"`
	Site      Site      `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	GameID    uint      `gorm:"not null" json:"gameId"`
	Game      Game      `gorm:"foreignKey:GameID" json:"game,omitempty"`
	URL       string    `gorm:"not null" json:"url"`
}

type BookSite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	SiteID    uint      `gorm:"not null" json:"siteId"`
	Site      Site      `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	BookID    uint      `gorm:"not null" json:"bookId"`
	Book      Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
	URL       string    `gorm:"not null" json:"url"`
}

type LightNovelSite struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	SiteID       uint       `gorm:"not null" json:"siteId"`
	Site         Site       `gorm:"foreignKey:SiteID" json:"site,omitempty"`
	LightNovelID uint       `gorm:"not null" json:"lightNovelId"`
	LightNovel   LightNovel `gorm:"foreignKey:LightNovelID" json:"lightNovel,omitempty"`
	URL          string     `gorm:"not null" json:"url"`
}
