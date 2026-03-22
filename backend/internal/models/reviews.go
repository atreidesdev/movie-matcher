package models

import "time"

type MovieReview struct {
	ID               uint         `gorm:"primaryKey" json:"id"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
	OverallRating    int          `gorm:"not null" json:"overallRating"`
	Review           *string      `json:"review"`
	ReviewStatus     ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating      *int         `json:"storyRating"`
	ProductionRating *int         `json:"productionRating"`
	ActingRating     *int         `json:"actingRating"`
	MusicRating      *int         `json:"musicRating"`
	VisualsRating    *int         `json:"visualsRating"`
	CharacterRating  *int         `json:"characterRating"`
	UserID           uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User             User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MovieID          uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"movieId"`
	Movie            Movie        `gorm:"foreignKey:MovieID" json:"movie,omitempty"`
}

type TVSeriesReview struct {
	ID               uint         `gorm:"primaryKey" json:"id"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
	OverallRating    int          `gorm:"not null" json:"overallRating"`
	Review           *string      `json:"review"`
	ReviewStatus     ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating      *int         `json:"storyRating"`
	ProductionRating *int         `json:"productionRating"`
	ActingRating     *int         `json:"actingRating"`
	MusicRating      *int         `json:"musicRating"`
	VisualsRating    *int         `json:"visualsRating"`
	CharacterRating  *int         `json:"characterRating"`
	UserID           uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User             User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TVSeriesID       uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"tvSeriesId"`
	TVSeries         TVSeries     `gorm:"foreignKey:TVSeriesID" json:"tvSeries,omitempty"`
}

type AnimeSeriesReview struct {
	ID               uint         `gorm:"primaryKey" json:"id"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
	OverallRating    int          `gorm:"not null" json:"overallRating"`
	Review           *string      `json:"review"`
	ReviewStatus     ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating      *int         `json:"storyRating"`
	ProductionRating *int         `json:"productionRating"`
	ActingRating     *int         `json:"actingRating"`
	MusicRating      *int         `json:"musicRating"`
	VisualsRating    *int         `json:"visualsRating"`
	CharacterRating  *int         `json:"characterRating"`
	UserID           uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User             User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AnimeSeriesID    uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"animeSeriesId"`
	AnimeSeries      AnimeSeries  `gorm:"foreignKey:AnimeSeriesID" json:"animeSeries,omitempty"`
}

type CartoonSeriesReview struct {
	ID               uint          `gorm:"primaryKey" json:"id"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
	OverallRating    int           `gorm:"not null" json:"overallRating"`
	Review           *string       `json:"review"`
	ReviewStatus     ReviewStatus  `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating      *int          `json:"storyRating"`
	ProductionRating *int          `json:"productionRating"`
	ActingRating     *int          `json:"actingRating"`
	MusicRating      *int          `json:"musicRating"`
	VisualsRating    *int          `json:"visualsRating"`
	CharacterRating  *int          `json:"characterRating"`
	UserID           uint          `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User             User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CartoonSeriesID  uint          `gorm:"uniqueIndex:idx_user_entity;not null" json:"cartoonSeriesId"`
	CartoonSeries    CartoonSeries `gorm:"foreignKey:CartoonSeriesID" json:"cartoonSeries,omitempty"`
}

type CartoonMovieReview struct {
	ID               uint         `gorm:"primaryKey" json:"id"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
	OverallRating    int          `gorm:"not null" json:"overallRating"`
	Review           *string      `json:"review"`
	ReviewStatus     ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating      *int         `json:"storyRating"`
	ProductionRating *int         `json:"productionRating"`
	ActingRating     *int         `json:"actingRating"`
	MusicRating      *int         `json:"musicRating"`
	VisualsRating    *int         `json:"visualsRating"`
	CharacterRating  *int         `json:"characterRating"`
	UserID           uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User             User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CartoonMovieID   uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"cartoonMovieId"`
	CartoonMovie     CartoonMovie `gorm:"foreignKey:CartoonMovieID" json:"cartoonMovie,omitempty"`
}

type AnimeMovieReview struct {
	ID               uint         `gorm:"primaryKey" json:"id"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
	OverallRating    int          `gorm:"not null" json:"overallRating"`
	Review           *string      `json:"review"`
	ReviewStatus     ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating      *int         `json:"storyRating"`
	ProductionRating *int         `json:"productionRating"`
	ActingRating     *int         `json:"actingRating"`
	MusicRating      *int         `json:"musicRating"`
	VisualsRating    *int         `json:"visualsRating"`
	CharacterRating  *int         `json:"characterRating"`
	UserID           uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User             User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AnimeMovieID     uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"animeMovieId"`
	AnimeMovie       AnimeMovie   `gorm:"foreignKey:AnimeMovieID" json:"animeMovie,omitempty"`
}

type GameReview struct {
	ID                  uint         `gorm:"primaryKey" json:"id"`
	CreatedAt           time.Time    `json:"createdAt"`
	UpdatedAt           time.Time    `json:"updatedAt"`
	OverallRating       int          `gorm:"not null" json:"overallRating"`
	Review              *string      `json:"review"`
	ReviewStatus        ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	GameplayRating      *int         `json:"gameplayRating"`
	VisualsRating       *int         `json:"visualsRating"`
	WorldBuildingRating *int         `json:"worldBuildingRating"`
	StoryRating         *int         `json:"storyRating"`
	UserID              uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User                User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	GameID              uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"gameId"`
	Game                Game         `gorm:"foreignKey:GameID" json:"game,omitempty"`
}

type MangaReview struct {
	ID                  uint         `gorm:"primaryKey" json:"id"`
	CreatedAt           time.Time    `json:"createdAt"`
	UpdatedAt           time.Time    `json:"updatedAt"`
	OverallRating       int          `gorm:"not null" json:"overallRating"`
	Review              *string      `json:"review"`
	ReviewStatus        ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating         *int         `json:"storyRating"`
	CharacterRating     *int         `json:"characterRating"`
	WorldBuildingRating *int         `json:"worldBuildingRating"`
	WritingRating       *int         `json:"writingRating"`
	UserID              uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User                User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MangaID             uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"mangaId"`
	Manga               Manga        `gorm:"foreignKey:MangaID" json:"manga,omitempty"`
}

type BookReview struct {
	ID                  uint         `gorm:"primaryKey" json:"id"`
	CreatedAt           time.Time    `json:"createdAt"`
	UpdatedAt           time.Time    `json:"updatedAt"`
	OverallRating       int          `gorm:"not null" json:"overallRating"`
	Review              *string      `json:"review"`
	ReviewStatus        ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating         *int         `json:"storyRating"`
	CharacterRating     *int         `json:"characterRating"`
	WorldBuildingRating *int         `json:"worldBuildingRating"`
	WritingRating       *int         `json:"writingRating"`
	UserID              uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User                User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BookID              uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"bookId"`
	Book                Book         `gorm:"foreignKey:BookID" json:"book,omitempty"`
}

type LightNovelReview struct {
	ID                  uint         `gorm:"primaryKey" json:"id"`
	CreatedAt           time.Time    `json:"createdAt"`
	UpdatedAt           time.Time    `json:"updatedAt"`
	OverallRating       int          `gorm:"not null" json:"overallRating"`
	Review              *string      `json:"review"`
	ReviewStatus        ReviewStatus `gorm:"default:'neutral'" json:"reviewStatus"`
	StoryRating         *int         `json:"storyRating"`
	CharacterRating     *int         `json:"characterRating"`
	WorldBuildingRating *int         `json:"worldBuildingRating"`
	WritingRating       *int         `json:"writingRating"`
	UserID              uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"userId"`
	User                User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	LightNovelID        uint         `gorm:"uniqueIndex:idx_user_entity;not null" json:"lightNovelId"`
	LightNovel          LightNovel   `gorm:"foreignKey:LightNovelID" json:"lightNovel,omitempty"`
}

type CreateReviewRequest struct {
	OverallRating    int          `json:"overallRating" binding:"required,min=1,max=100"`
	Review           *string      `json:"review"`
	ReviewStatus     ReviewStatus `json:"reviewStatus"`
	StoryRating      *int         `json:"storyRating"`
	ProductionRating *int         `json:"productionRating"`
	ActingRating     *int         `json:"actingRating"`
	MusicRating      *int         `json:"musicRating"`
	VisualsRating    *int         `json:"visualsRating"`
	CharacterRating  *int         `json:"characterRating"`
}
