package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

type LocalizedString map[string]string

func (l *LocalizedString) Value() (driver.Value, error) {
	if l == nil || *l == nil {
		return nil, nil
	}
	return json.Marshal(*l)
}

func (l *LocalizedString) Scan(value interface{}) error {
	if value == nil {
		*l = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, l)
}

type JSONArray []interface{}

func (j JSONArray) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *StringArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, s)
}

type Movie struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string           `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster      *string    `json:"poster"`
	Backdrop    *string    `json:"backdrop"` // Горизонтальный задник (доп. картинка)
	Images      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating       *float64   `json:"rating"`
	RatingCount  *int       `json:"ratingCount"`
	AgeRating    *AgeRating `json:"ageRating"`
	Duration     *int       `json:"duration"`
	Country      *string      `json:"country"`
	Countries    JSONArray    `gorm:"type:jsonb;default:'[]'" json:"countries,omitempty"`
	Status       *MediaStatus `json:"status"` // announced, in_production, released, finished, cancelled, postponed
	IsHidden     bool         `json:"isHidden"` // Скрыт: не показывать в каталоге; на странице тайтла — «Заблокирован»

	Genres    []Genre         `gorm:"many2many:movie_genres" json:"genres,omitempty"`
	Themes    []Theme         `gorm:"many2many:movie_themes" json:"themes,omitempty"`
	Cast      []Cast          `gorm:"many2many:movie_cast" json:"cast,omitempty"`
	Staff     []MovieStaff    `gorm:"foreignKey:MovieID" json:"staff,omitempty"`
	Studios   []Studio        `gorm:"many2many:movie_studios" json:"studios,omitempty"`
	Reviews   []MovieReview   `gorm:"foreignKey:MovieID" json:"reviews,omitempty"`
	Lists     []MovieList     `gorm:"foreignKey:MovieID" json:"lists,omitempty"`
	Favorites []MovieFavorite `gorm:"foreignKey:MovieID" json:"favorites,omitempty"`
	Comments  []MovieComment  `gorm:"foreignKey:MovieID" json:"comments,omitempty"`
	Sites     []MovieSite     `gorm:"foreignKey:MovieID" json:"sites,omitempty"`
	Similar   []Movie         `gorm:"many2many:similar_movies;joinForeignKey:movie_id;JoinReferences:similar_id" json:"similar,omitempty"`

	ListStatus *ListStatus `json:"listStatus,omitempty" gorm:"-"`
}

type TVSeries struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string           `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster          *string    `json:"poster"`
	Backdrop        *string    `json:"backdrop"`
	Images          JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos          JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating          *float64   `json:"rating"`
	RatingCount     *int       `json:"ratingCount"`
	AgeRating       *AgeRating `json:"ageRating"`
	SeasonNumber    *int         `json:"seasonNumber"`
	EpisodesCount   *int         `json:"episodesCount"`
	EpisodeDuration *int         `json:"episodeDuration"`
	CurrentEpisode  *int         `json:"currentEpisode"`  // Текущая вышедшая серия
	ReleaseSchedule JSONMap      `gorm:"type:jsonb" json:"releaseSchedule"`
	Status          *MediaStatus `json:"status"`
	IsHidden        bool         `json:"isHidden"`

	Genres    []Genre            `gorm:"many2many:tvseries_genres" json:"genres,omitempty"`
	Themes    []Theme            `gorm:"many2many:tvseries_themes" json:"themes,omitempty"`
	Cast      []Cast             `gorm:"many2many:tvseries_cast" json:"cast,omitempty"`
	Studios   []Studio           `gorm:"many2many:tvseries_studios" json:"studios,omitempty"`
	Reviews   []TVSeriesReview   `gorm:"foreignKey:TVSeriesID" json:"reviews,omitempty"`
	Lists     []TVSeriesList     `gorm:"foreignKey:TVSeriesID" json:"lists,omitempty"`
	Favorites []TVSeriesFavorite `gorm:"foreignKey:TVSeriesID" json:"favorites,omitempty"`
	Comments  []TVSeriesComment  `gorm:"foreignKey:TVSeriesID" json:"comments,omitempty"`
	Sites     []TVSeriesSite     `gorm:"foreignKey:TVSeriesID" json:"sites,omitempty"`
	Similar   []TVSeries         `gorm:"many2many:similar_tvseries;joinForeignKey:tv_series_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Staff     []MediaStaff       `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus       `json:"listStatus,omitempty" gorm:"-"`
}

type AnimeSeries struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string           `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	TitleKatakana   *string          `json:"titleKatakana,omitempty"`   // Оригинальное название на катакане (или кане)
	TitleRomaji     *string          `json:"titleRomaji,omitempty"`     // Транслитерация: Yuusha-kei ni Shosu: Choubatsu...
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster          *string    `json:"poster"`
	Backdrop        *string    `json:"backdrop"`
	Images          JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos          JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating          *float64   `json:"rating"`
	RatingCount     *int       `json:"ratingCount"`
	AgeRating       *AgeRating `json:"ageRating"`
	Season          *AnimeSeason `json:"season"` // winter, spring, summer, autumn — сезон выхода (зима/весна/лето/осень)
	SeasonNumber    *int         `json:"seasonNumber"`
	EpisodesCount   *int         `json:"episodesCount"`
	EpisodeDuration *int         `json:"episodeDuration"`
	CurrentEpisode  *int         `json:"currentEpisode"`
	ReleaseSchedule JSONMap      `gorm:"type:jsonb" json:"releaseSchedule"`
	Status          *MediaStatus `json:"status"`
	IsHidden        bool         `json:"isHidden"`

	Genres    []Genre               `gorm:"many2many:animeseries_genres" json:"genres,omitempty"`
	Themes    []Theme               `gorm:"many2many:animeseries_themes" json:"themes,omitempty"`
	Cast      []Cast                `gorm:"many2many:animeseries_cast" json:"cast,omitempty"`
	Studios   []Studio              `gorm:"many2many:animeseries_studios" json:"studios,omitempty"`
	Reviews   []AnimeSeriesReview   `gorm:"foreignKey:AnimeSeriesID" json:"reviews,omitempty"`
	Lists     []AnimeSeriesList     `gorm:"foreignKey:AnimeSeriesID" json:"lists,omitempty"`
	Favorites []AnimeSeriesFavorite `gorm:"foreignKey:AnimeSeriesID" json:"favorites,omitempty"`
	Comments  []AnimeSeriesComment  `gorm:"foreignKey:AnimeSeriesID" json:"comments,omitempty"`
	Sites     []AnimeSeriesSite     `gorm:"foreignKey:AnimeSeriesID" json:"sites,omitempty"`
	Similar   []AnimeSeries         `gorm:"many2many:similar_animeseries;joinForeignKey:anime_series_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Staff     []MediaStaff          `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus          `json:"listStatus,omitempty" gorm:"-"`
}

type CartoonSeries struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string           `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster          *string    `json:"poster"`
	Backdrop        *string    `json:"backdrop"`
	Images          JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos          JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating          *float64   `json:"rating"`
	RatingCount     *int       `json:"ratingCount"`
	AgeRating       *AgeRating `json:"ageRating"`
	SeasonNumber    *int         `json:"seasonNumber"`
	EpisodesCount   *int         `json:"episodesCount"`
	EpisodeDuration *int         `json:"episodeDuration"`
	CurrentEpisode  *int         `json:"currentEpisode"`
	ReleaseSchedule JSONMap      `gorm:"type:jsonb" json:"releaseSchedule"`
	Status          *MediaStatus `json:"status"`
	IsHidden        bool         `json:"isHidden"`

	Genres    []Genre                 `gorm:"many2many:cartoonseries_genres" json:"genres,omitempty"`
	Themes    []Theme                 `gorm:"many2many:cartoonseries_themes" json:"themes,omitempty"`
	Cast      []Cast                  `gorm:"many2many:cartoonseries_cast" json:"cast,omitempty"`
	Studios   []Studio                `gorm:"many2many:cartoonseries_studios" json:"studios,omitempty"`
	Reviews   []CartoonSeriesReview   `gorm:"foreignKey:CartoonSeriesID" json:"reviews,omitempty"`
	Lists     []CartoonSeriesList     `gorm:"foreignKey:CartoonSeriesID" json:"lists,omitempty"`
	Favorites []CartoonSeriesFavorite `gorm:"foreignKey:CartoonSeriesID" json:"favorites,omitempty"`
	Comments  []CartoonSeriesComment  `gorm:"foreignKey:CartoonSeriesID" json:"comments,omitempty"`
	Sites     []CartoonSeriesSite     `gorm:"foreignKey:CartoonSeriesID" json:"sites,omitempty"`
	Similar   []CartoonSeries         `gorm:"many2many:similar_cartoonseries;joinForeignKey:cartoon_series_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Staff     []MediaStaff            `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus            `json:"listStatus,omitempty" gorm:"-"`
}

type CartoonMovie struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string          `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster      *string    `json:"poster"`
	Backdrop    *string    `json:"backdrop"`
	Images      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating      *float64   `json:"rating"`
	RatingCount *int       `json:"ratingCount"`
	AgeRating   *AgeRating   `json:"ageRating"`
	Duration    *int         `json:"duration"`
	Status      *MediaStatus `json:"status"`
	IsHidden    bool         `json:"isHidden"`

	Genres    []Genre                `gorm:"many2many:cartoonmovie_genres" json:"genres,omitempty"`
	Themes    []Theme                `gorm:"many2many:cartoonmovie_themes" json:"themes,omitempty"`
	Cast      []Cast                 `gorm:"many2many:cartoonmovie_cast" json:"cast,omitempty"`
	Studios   []Studio               `gorm:"many2many:cartoonmovie_studios" json:"studios,omitempty"`
	Reviews   []CartoonMovieReview   `gorm:"foreignKey:CartoonMovieID" json:"reviews,omitempty"`
	Lists     []CartoonMovieList     `gorm:"foreignKey:CartoonMovieID" json:"lists,omitempty"`
	Favorites []CartoonMovieFavorite `gorm:"foreignKey:CartoonMovieID" json:"favorites,omitempty"`
	Comments  []CartoonMovieComment  `gorm:"foreignKey:CartoonMovieID" json:"comments,omitempty"`
	Sites     []CartoonMovieSite     `gorm:"foreignKey:CartoonMovieID" json:"sites,omitempty"`
	Similar   []CartoonMovie         `gorm:"many2many:similar_cartoonmovies;joinForeignKey:cartoon_movie_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Staff     []MediaStaff           `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus           `json:"listStatus,omitempty" gorm:"-"`
}

type AnimeMovie struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string          `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster      *string    `json:"poster"`
	Backdrop    *string    `json:"backdrop"`
	Images      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating      *float64   `json:"rating"`
	RatingCount *int       `json:"ratingCount"`
	AgeRating   *AgeRating   `json:"ageRating"`
	Duration    *int         `json:"duration"`
	Status      *MediaStatus `json:"status"`
	IsHidden    bool         `json:"isHidden"`

	Genres    []Genre              `gorm:"many2many:animemovie_genres" json:"genres,omitempty"`
	Themes    []Theme              `gorm:"many2many:animemovie_themes" json:"themes,omitempty"`
	Cast      []Cast               `gorm:"many2many:animemovie_cast" json:"cast,omitempty"`
	Studios   []Studio             `gorm:"many2many:animemovie_studios" json:"studios,omitempty"`
	Reviews   []AnimeMovieReview   `gorm:"foreignKey:AnimeMovieID" json:"reviews,omitempty"`
	Lists     []AnimeMovieList     `gorm:"foreignKey:AnimeMovieID" json:"lists,omitempty"`
	Favorites []AnimeMovieFavorite `gorm:"foreignKey:AnimeMovieID" json:"favorites,omitempty"`
	Comments  []AnimeMovieComment  `gorm:"foreignKey:AnimeMovieID" json:"comments,omitempty"`
	Sites     []AnimeMovieSite     `gorm:"foreignKey:AnimeMovieID" json:"sites,omitempty"`
	Similar   []AnimeMovie         `gorm:"many2many:similar_animemovies;joinForeignKey:anime_movie_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Staff     []MediaStaff         `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus         `json:"listStatus,omitempty" gorm:"-"`
}

type Manga struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string          `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster      *string    `json:"poster"`
	Backdrop    *string    `json:"backdrop"`
	Images      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating        *float64     `json:"rating"`
	RatingCount   *int         `json:"ratingCount"`
	AgeRating     *AgeRating   `json:"ageRating"`
	Volumes        *int         `json:"volumes"`        // Максимум томов (nil = выходит, без фиксированного числа)
	CurrentVolume  *int         `json:"currentVolume"` // Текущий вышедший том
	CurrentChapter *int         `json:"currentChapter"` // Текущая вышедшая глава
	VolumesList    JSONArray    `gorm:"type:jsonb" json:"volumesList"` // По томам: [{ "chapters": N }, ...]
	Status         *MediaStatus `json:"status"`
	IsHidden       bool         `json:"isHidden"`

	Genres     []Genre         `gorm:"many2many:manga_genres" json:"genres,omitempty"`
	Themes     []Theme         `gorm:"many2many:manga_themes" json:"themes,omitempty"`
	Authors    []Person        `gorm:"many2many:manga_authors" json:"authors,omitempty"`
	Publishers []Publisher     `gorm:"many2many:manga_publishers" json:"publishers,omitempty"`
	Reviews    []MangaReview   `gorm:"foreignKey:MangaID" json:"reviews,omitempty"`
	Lists      []MangaList     `gorm:"foreignKey:MangaID" json:"lists,omitempty"`
	Favorites  []MangaFavorite `gorm:"foreignKey:MangaID" json:"favorites,omitempty"`
	Comments   []MangaComment  `gorm:"foreignKey:MangaID" json:"comments,omitempty"`
	Sites      []MangaSite     `gorm:"foreignKey:MangaID" json:"sites,omitempty"`
	Similar    []Manga         `gorm:"many2many:similar_manga;joinForeignKey:manga_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Cast       []Cast          `gorm:"many2many:manga_cast" json:"cast,omitempty"`
	Staff      []MediaStaff    `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus     `json:"listStatus,omitempty" gorm:"-"`
}

type Game struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string          `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster      *string    `json:"poster"`
	Backdrop    *string    `json:"backdrop"`
	Images      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating      *float64     `json:"rating"`
	RatingCount *int         `json:"ratingCount"`
	AgeRating   *AgeRating   `json:"ageRating"`
	Status      *MediaStatus `json:"status"`
	IsHidden    bool         `json:"isHidden"`

	Genres     []Genre        `gorm:"many2many:game_genres" json:"genres,omitempty"`
	Themes     []Theme        `gorm:"many2many:game_themes" json:"themes,omitempty"`
	Platforms  []Platform     `gorm:"many2many:game_platforms" json:"platforms,omitempty"`
	Developers []Developer    `gorm:"many2many:game_developers" json:"developers,omitempty"`
	Publishers []Publisher    `gorm:"many2many:game_publishers" json:"publishers,omitempty"`
	Reviews    []GameReview   `gorm:"foreignKey:GameID" json:"reviews,omitempty"`
	Lists      []GameList     `gorm:"foreignKey:GameID" json:"lists,omitempty"`
	Favorites  []GameFavorite `gorm:"foreignKey:GameID" json:"favorites,omitempty"`
	Comments   []GameComment  `gorm:"foreignKey:GameID" json:"comments,omitempty"`
	Sites      []GameSite     `gorm:"foreignKey:GameID" json:"sites,omitempty"`
	Similar    []Game         `gorm:"many2many:similar_games;joinForeignKey:game_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Cast       []Cast         `gorm:"many2many:game_cast" json:"cast,omitempty"`
	Staff      []MediaStaff   `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus    `json:"listStatus,omitempty" gorm:"-"`
}

type Book struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string          `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster      *string    `json:"poster"`
	Backdrop    *string    `json:"backdrop"`
	Images      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating                *float64     `json:"rating"`
	RatingCount           *int         `json:"ratingCount"`
	AgeRating             *AgeRating   `json:"ageRating"`
	Pages                 *int         `json:"pages"`
	ReadingDurationMinutes *int         `json:"readingDurationMinutes"`
	Status                *MediaStatus `json:"status"`
	IsHidden              bool         `json:"isHidden"`

	Genres     []Genre        `gorm:"many2many:book_genres" json:"genres,omitempty"`
	Themes     []Theme        `gorm:"many2many:book_themes" json:"themes,omitempty"`
	Authors    []Person       `gorm:"many2many:book_authors" json:"authors,omitempty"`
	Publishers []Publisher    `gorm:"many2many:book_publishers" json:"publishers,omitempty"`
	Reviews    []BookReview   `gorm:"foreignKey:BookID" json:"reviews,omitempty"`
	Lists      []BookList     `gorm:"foreignKey:BookID" json:"lists,omitempty"`
	Favorites  []BookFavorite `gorm:"foreignKey:BookID" json:"favorites,omitempty"`
	Comments   []BookComment  `gorm:"foreignKey:BookID" json:"comments,omitempty"`
	Sites      []BookSite     `gorm:"foreignKey:BookID" json:"sites,omitempty"`
	Similar    []Book         `gorm:"many2many:similar_books;joinForeignKey:book_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Cast       []Cast         `gorm:"many2many:book_cast" json:"cast,omitempty"`
	Staff      []MediaStaff   `gorm:"-" json:"staff,omitempty"`
	ListStatus *ListStatus    `json:"listStatus,omitempty" gorm:"-"`
}

type LightNovel struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string          `gorm:"not null" json:"title"`
	TitleI18n       *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	ReleaseDate     *time.Time       `json:"releaseDate"`
	Poster      *string    `json:"poster"`
	Backdrop    *string    `json:"backdrop"`
	Images      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Videos      JSONArray  `gorm:"type:jsonb;default:'[]'" json:"videos"`
	Rating      *float64   `json:"rating"`
	RatingCount *int       `json:"ratingCount"`
	AgeRating     *AgeRating   `json:"ageRating"`
	Volumes       *int         `json:"volumes"`       // Максимум томов (nil = выходит без фиксированного числа)
	CurrentVolume *int         `json:"currentVolume"`
	Pages         *int         `json:"pages"`
	VolumesList   JSONArray    `gorm:"type:jsonb" json:"volumesList"`
	Status        *MediaStatus `json:"status"`
	IsHidden      bool         `json:"isHidden"`

	Genres       []Genre              `gorm:"many2many:lightnovel_genres" json:"genres,omitempty"`
	Themes       []Theme              `gorm:"many2many:lightnovel_themes" json:"themes,omitempty"`
	Authors      []Person             `gorm:"many2many:lightnovel_authors" json:"authors,omitempty"`
	Illustrators []Person             `gorm:"many2many:lightnovel_illustrators" json:"illustrators,omitempty"`
	Publishers   []Publisher          `gorm:"many2many:lightnovel_publishers" json:"publishers,omitempty"`
	Reviews      []LightNovelReview   `gorm:"foreignKey:LightNovelID" json:"reviews,omitempty"`
	Lists        []LightNovelList     `gorm:"foreignKey:LightNovelID" json:"lists,omitempty"`
	Favorites    []LightNovelFavorite `gorm:"foreignKey:LightNovelID" json:"favorites,omitempty"`
	Comments     []LightNovelComment  `gorm:"foreignKey:LightNovelID" json:"comments,omitempty"`
	Sites        []LightNovelSite     `gorm:"foreignKey:LightNovelID" json:"sites,omitempty"`
	Similar      []LightNovel         `gorm:"many2many:similar_lightnovels;joinForeignKey:light_novel_id;JoinReferences:similar_id" json:"similar,omitempty"`
	Cast         []Cast               `gorm:"many2many:light_novel_cast" json:"cast,omitempty"`
	Staff        []MediaStaff         `gorm:"-" json:"staff,omitempty"`
	ListStatus   *ListStatus          `json:"listStatus,omitempty" gorm:"-"`
}

type Genre struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time        `json:"createdAt"`
	UpdatedAt     time.Time        `json:"updatedAt"`
	Name          string           `gorm:"uniqueIndex;not null" json:"name"`
	NameI18n      *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Description   *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	Emoji         *string          `json:"emoji"`
	MediaTypes    JSONArray        `gorm:"type:jsonb;default:'[]'" json:"mediaTypes"`
}

type Theme struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time        `json:"createdAt"`
	UpdatedAt     time.Time        `json:"updatedAt"`
	Name          string           `gorm:"uniqueIndex;not null" json:"name"`
	NameI18n      *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Description   *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	Emoji         *string          `json:"emoji"`
	MediaTypes    JSONArray        `gorm:"type:jsonb;default:'[]'" json:"mediaTypes"`
}

type Person struct {
	ID             uint             `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time        `json:"createdAt"`
	UpdatedAt      time.Time        `json:"updatedAt"`
	FirstName      string           `gorm:"not null" json:"firstName"`
	FirstNameI18n  *LocalizedString `gorm:"type:jsonb" json:"firstNameI18n,omitempty"`
	LastName       string           `gorm:"not null" json:"lastName"`
	LastNameI18n   *LocalizedString `gorm:"type:jsonb" json:"lastNameI18n,omitempty"`
	BirthDate      *time.Time       `json:"birthDate"`
	Country        *string          `json:"country"`
	Biography      *string          `json:"biography"`
	BiographyI18n  *LocalizedString `gorm:"type:jsonb" json:"biographyI18n,omitempty"`
	Profession     JSONArray        `gorm:"type:jsonb;default:'[]'" json:"profession"`
	Avatar         *string          `json:"avatar"`
	Images         JSONArray        `gorm:"type:jsonb;default:'[]'" json:"images"`

	Cast []Cast `gorm:"foreignKey:PersonID" json:"cast,omitempty"`
}

type Character struct {
	ID              uint             `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time        `json:"createdAt"`
	UpdatedAt       time.Time        `json:"updatedAt"`
	Name            string           `gorm:"not null" json:"name"`
	NameI18n        *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	Avatar          *string          `json:"avatar"`
	Images          JSONArray        `gorm:"type:jsonb;default:'[]'" json:"images"`

	Cast []Cast `gorm:"foreignKey:CharacterID" json:"cast,omitempty"`
}

type Cast struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	CharacterID   *uint      `json:"characterId"`
	Character     *Character `gorm:"foreignKey:CharacterID" json:"character,omitempty"`
	PersonID      *uint      `json:"personId"`
	Person        *Person    `gorm:"foreignKey:PersonID" json:"person,omitempty"`
	Role          *string    `json:"role"`
	RoleType      *RoleType  `json:"roleType"`
	EpisodeNumber *int       `json:"episodeNumber"`
	Poster        *string    `gorm:"column:cast_poster" json:"poster"` // CastPoster: изображение для карточки каста
	Images        JSONArray  `gorm:"type:jsonb;default:'[]'" json:"images"`
	Dubbings      []Dubbing  `gorm:"foreignKey:CastID" json:"dubbings,omitempty"` // Дубляж: даббер и язык
}

type MovieStaff struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	MovieID    uint       `gorm:"not null;index" json:"movieId"`
	Movie      *Movie     `gorm:"foreignKey:MovieID" json:"movie,omitempty"`
	PersonID   uint       `gorm:"not null" json:"personId"`
	Person     *Person    `gorm:"foreignKey:PersonID" json:"person,omitempty"`
	Profession Profession `gorm:"type:varchar(32);not null" json:"profession"`
}

func (MovieStaff) TableName() string { return "movie_staff" }

// media_type: tv-series, anime, cartoon-series, cartoon-movies, anime-movies, games, manga, books, light-novels
type MediaStaff struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	MediaType  string     `gorm:"size:32;not null;index:idx_media_staff_media" json:"mediaType"`
	MediaID    uint       `gorm:"not null;index:idx_media_staff_media" json:"mediaId"`
	PersonID   uint       `gorm:"not null" json:"personId"`
	Person     *Person    `gorm:"foreignKey:PersonID" json:"person,omitempty"`
	Profession Profession `gorm:"type:varchar(32);not null" json:"profession"`
}

func (MediaStaff) TableName() string { return "media_staff" }

// Dubbing — дубляж роли: персона (даббер) и язык, на который дублируют
type Dubbing struct {
	ID        uint     `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	CastID    uint     `gorm:"not null;index" json:"castId"`
	Cast      *Cast    `gorm:"foreignKey:CastID" json:"cast,omitempty"`
	PersonID  uint     `gorm:"not null" json:"personId"`
	Person    *Person  `gorm:"foreignKey:PersonID" json:"person,omitempty"`
	Language  string   `gorm:"size:10;not null" json:"language"` // Код языка: ru, en, ja и т.д.
}

type Studio struct {
	ID              uint             `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time        `json:"createdAt"`
	UpdatedAt       time.Time        `json:"updatedAt"`
	Name            string           `gorm:"uniqueIndex;not null" json:"name"`
	NameI18n        *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	Country         *string          `json:"country"`
	Poster          *string          `json:"poster"`
}

type Developer struct {
	ID              uint             `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time        `json:"createdAt"`
	UpdatedAt       time.Time        `json:"updatedAt"`
	Name            string           `gorm:"uniqueIndex;not null" json:"name"`
	NameI18n        *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	Country         *string          `json:"country"`
	Poster          *string          `json:"poster"`
}

type Publisher struct {
	ID              uint             `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time        `json:"createdAt"`
	UpdatedAt       time.Time        `json:"updatedAt"`
	Name            string           `gorm:"uniqueIndex;not null" json:"name"`
	NameI18n        *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Description     *string          `json:"description"`
	DescriptionI18n *LocalizedString `gorm:"type:jsonb" json:"descriptionI18n,omitempty"`
	Country         *string          `json:"country"`
	Poster          *string          `json:"poster"`
	PublicationTypes StringArray      `gorm:"type:jsonb;default:'[]'" json:"publicationTypes,omitempty"`
}

type Platform struct {
	ID        uint             `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time        `json:"createdAt"`
	UpdatedAt time.Time        `json:"updatedAt"`
	Name      string           `gorm:"uniqueIndex;not null" json:"name"`
	NameI18n  *LocalizedString `gorm:"type:jsonb" json:"nameI18n,omitempty"`
	Icon      *string          `json:"icon"`
}
