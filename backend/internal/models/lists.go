package models

import "time"

type RewatchSession struct {
	StartedAt   *time.Time `json:"startedAt"`
	CompletedAt *time.Time `json:"completedAt"`
}

type MovieList struct {
	ID             uint         `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
	Status         ListStatus   `gorm:"default:'planned'" json:"status"`
	Comment        *string      `json:"comment"`
	Rating         *int         `json:"rating"`
	TitleReaction  *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt      *time.Time   `json:"startedAt"`
	CompletedAt    *time.Time   `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	UserID      uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User        User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MovieID     uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"movieId"`
	Movie       Movie      `gorm:"foreignKey:MovieID" json:"movie,omitempty"`
}

type TVSeriesList struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	Status          ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment         *string        `json:"comment"`
	Rating          *int           `json:"rating"`
	TitleReaction   *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt       *time.Time     `json:"startedAt"`
	CompletedAt     *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	CurrentEpisode  *int       `json:"currentEpisode"`
	CurrentProgress *float64   `json:"currentProgress"`
	UserID          uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User            User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TVSeriesID      uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"tvSeriesId"`
	TVSeries        TVSeries   `gorm:"foreignKey:TVSeriesID" json:"tvSeries,omitempty"`
}

type AnimeSeriesList struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	Status          ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment         *string        `json:"comment"`
	Rating          *int           `json:"rating"`
	TitleReaction   *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt       *time.Time     `json:"startedAt"`
	CompletedAt     *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	CurrentEpisode  *int        `json:"currentEpisode"`
	CurrentProgress *float64    `json:"currentProgress"`
	UserID          uint        `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User            User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AnimeSeriesID   uint        `gorm:"uniqueIndex:idx_user_entity;not null" json:"animeSeriesId"`
	AnimeSeries     AnimeSeries `gorm:"foreignKey:AnimeSeriesID" json:"animeSeries,omitempty"`
}

type CartoonSeriesList struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	Status          ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment         *string        `json:"comment"`
	Rating          *int           `json:"rating"`
	TitleReaction   *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt       *time.Time     `json:"startedAt"`
	CompletedAt     *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	CurrentEpisode  *int          `json:"currentEpisode"`
	CurrentProgress *float64      `json:"currentProgress"`
	UserID          uint          `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User            User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CartoonSeriesID uint          `gorm:"uniqueIndex:idx_user_entity;not null" json:"cartoonSeriesId"`
	CartoonSeries   CartoonSeries `gorm:"foreignKey:CartoonSeriesID" json:"cartoonSeries,omitempty"`
}

type CartoonMovieList struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	Status         ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment        *string        `json:"comment"`
	Rating         *int           `json:"rating"`
	TitleReaction  *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt      *time.Time     `json:"startedAt"`
	CompletedAt    *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	UserID         uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User           User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CartoonMovieID uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"cartoonMovieId"`
	CartoonMovie   CartoonMovie `gorm:"foreignKey:CartoonMovieID" json:"cartoonMovie,omitempty"`
}

type AnimeMovieList struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	Status         ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment        *string        `json:"comment"`
	Rating         *int           `json:"rating"`
	TitleReaction  *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt      *time.Time     `json:"startedAt"`
	CompletedAt    *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	UserID       uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User         User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AnimeMovieID uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"animeMovieId"`
	AnimeMovie   AnimeMovie `gorm:"foreignKey:AnimeMovieID" json:"animeMovie,omitempty"`
}

type GameList struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	Status         ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment        *string        `json:"comment"`
	Rating         *int           `json:"rating"`
	TitleReaction  *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt      *time.Time     `json:"startedAt"`
	CompletedAt    *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	TotalTime       *int       `json:"totalTime"`
	Playthroughs    JSONArray  `gorm:"type:jsonb;default:'[]'" json:"playthroughs"`
	CurrentProgress *int       `json:"currentProgress"`
	UserID          uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User            User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	GameID          uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"gameId"`
	Game            Game       `gorm:"foreignKey:GameID" json:"game,omitempty"`
}

type MangaList struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	Status         ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment        *string        `json:"comment"`
	Rating         *int           `json:"rating"`
	TitleReaction  *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt      *time.Time     `json:"startedAt"`
	CompletedAt    *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	CurrentVolume   *int       `json:"currentVolume"`
	CurrentChapter  *int       `json:"currentChapter"`
	CurrentProgress *float64   `json:"currentProgress"`
	UserID          uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User            User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MangaID         uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"mangaId"`
	Manga           Manga      `gorm:"foreignKey:MangaID" json:"manga,omitempty"`
}

type BookList struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	Status         ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment        *string        `json:"comment"`
	Rating         *int           `json:"rating"`
	TitleReaction  *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt      *time.Time     `json:"startedAt"`
	CompletedAt    *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	CurrentPage *int       `json:"currentPage"`
	MaxPages    *int       `json:"maxPages"`
	UserID      uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User        User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BookID      uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"bookId"`
	Book        Book       `gorm:"foreignKey:BookID" json:"book,omitempty"`
}

type LightNovelList struct {
	ID                   uint           `gorm:"primaryKey" json:"id"`
	CreatedAt            time.Time      `json:"createdAt"`
	UpdatedAt            time.Time      `json:"updatedAt"`
	Status               ListStatus     `gorm:"default:'planned'" json:"status"`
	Comment              *string        `json:"comment"`
	Rating               *int           `json:"rating"`
	TitleReaction        *TitleReaction `json:"titleReaction,omitempty"`
	StartedAt            *time.Time     `json:"startedAt"`
	CompletedAt          *time.Time     `json:"completedAt"`
	RewatchSessions []RewatchSession `gorm:"type:jsonb;default:'[]'" json:"rewatchSessions"`
	CurrentVolumeNumber  *int       `json:"currentVolumeNumber"`
	CurrentChapterNumber *int       `json:"currentChapterNumber"`
	CurrentPage          *int       `json:"currentPage"`
	CurrentProgress      *float64   `json:"currentProgress"`
	UserID               uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User                 User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	LightNovelID         uint       `gorm:"uniqueIndex:idx_user_entity;not null" json:"lightNovelId"`
	LightNovel           LightNovel `gorm:"foreignKey:LightNovelID" json:"lightNovel,omitempty"`
}

type AddToListRequest struct {
	Status                 ListStatus `json:"status" binding:"required"`
	Comment                *string    `json:"comment"`
	Rating                 *int       `json:"rating"` // 1–100
	CurrentEpisode         *int       `json:"currentEpisode"`
	CurrentProgress        *float64   `json:"currentProgress"`
	CurrentPage             *int       `json:"currentPage"`
	MaxPages                *int       `json:"maxPages"`
	CurrentVolume           *int       `json:"currentVolume"`
	CurrentChapter          *int       `json:"currentChapter"`
	CurrentVolumeNumber     *int       `json:"currentVolumeNumber"`
	CurrentChapterNumber    *int       `json:"currentChapterNumber"`
	TitleReaction           *string    `json:"titleReaction"` // ключ из enum (surprised, disappointed, ...)
	HoursPlayed             *float64   `json:"hoursPlayed"`   // для игр: сколько часов играл
}

type UpdateListRequest struct {
	Status                 *ListStatus `json:"status"`
	MarkRewatched          *bool       `json:"markRewatched"`
	Comment                *string     `json:"comment"`
	Rating                 *int        `json:"rating"`
	CurrentEpisode         *int        `json:"currentEpisode"`
	CurrentProgress        *float64    `json:"currentProgress"`
	CurrentPage            *int        `json:"currentPage"`
	MaxPages               *int        `json:"maxPages"`
	CurrentVolume          *int        `json:"currentVolume"`
	CurrentChapter         *int        `json:"currentChapter"`
	CurrentVolumeNumber    *int        `json:"currentVolumeNumber"`
	CurrentChapterNumber   *int        `json:"currentChapterNumber"`
	TitleReaction          *string     `json:"titleReaction"`
	HoursPlayed            *float64    `json:"hoursPlayed"` // для игр: сколько часов играл
}
