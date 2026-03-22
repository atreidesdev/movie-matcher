package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

type projectEntry struct {
	Type   string  `json:"type"`
	ID     uint    `json:"id"`
	Title  string  `json:"title"`
	Poster *string `json:"poster,omitempty"`
}
type projectSection struct {
	Type     string         `json:"type"`
	LabelKey string         `json:"labelKey"`
	Entries  []projectEntry `json:"entries"`
}

// GetGenres godoc
// @Summary  Get all genres
// @Tags     Catalog
// @Produce  json
// @Success  200  {array}  models.Genre
// @Router   /genres [get]
func GetGenres(c *gin.Context) {
	db := deps.GetDB(c)
	var genres []models.Genre
	if err := db.Find(&genres).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch genres")
		return
	}
	c.JSON(http.StatusOK, genres)
}

// GetGenre godoc
// @Summary  Get genre by ID
// @Tags     Catalog
// @Param    id   path  int  true  "Genre ID"
// @Success  200  {object}  models.Genre
// @Router   /genres/{id} [get]
func GetGenre(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var genre models.Genre
	if err := db.First(&genre, id).Error; err != nil {
		api.RespondNotFound(c, "Genre not found")
		return
	}
	c.JSON(http.StatusOK, genre)
}

// GetThemes godoc
// @Summary  Get all themes
// @Tags     Catalog
// @Produce  json
// @Success  200  {array}  models.Theme
// @Router   /themes [get]
func GetThemes(c *gin.Context) {
	db := deps.GetDB(c)
	var themes []models.Theme
	if err := db.Find(&themes).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch themes")
		return
	}
	c.JSON(http.StatusOK, themes)
}

// GetPlatforms godoc
// @Summary  Get all platforms
// @Tags     Catalog
// @Produce  json
// @Success  200  {array}  models.Platform
// @Router   /platforms [get]
func GetPlatforms(c *gin.Context) {
	db := deps.GetDB(c)
	var platforms []models.Platform
	if err := db.Find(&platforms).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch platforms")
		return
	}
	c.JSON(http.StatusOK, platforms)
}

func parseIDsQuery(val string) []uint {
	if val == "" {
		return nil
	}
	parts := strings.Split(val, ",")
	var ids []uint
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		id, err := strconv.ParseUint(p, 10, 64)
		if err != nil {
			continue
		}
		ids = append(ids, uint(id))
	}
	return ids
}

// GetStudios godoc
// @Summary  Get studios list
// @Tags     Catalog
// @Param    search  query  string  false  "Search by name"
// @Param    ids     query  string  false  "Comma-separated IDs"
// @Success  200  {array}  models.Studio
// @Router   /studios [get]
func GetStudios(c *gin.Context) {
	db := deps.GetDB(c)
	search := strings.TrimSpace(c.Query("search"))
	ids := parseIDsQuery(c.Query("ids"))

	var studios []models.Studio
	q := db.Model(&models.Studio{})
	if len(ids) > 0 {
		q = q.Where("id IN ?", ids)
	} else if search != "" {
		term := "%" + search + "%"
		q = q.Where("name ILIKE ?", term)
	}
	// Без ids и без search — возвращаем всех (для админки). С search/ids — только подмножество.
	if err := q.Find(&studios).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch studios")
		return
	}
	c.JSON(http.StatusOK, studios)
}

// GetDevelopers godoc
// @Summary  Get developers list
// @Tags     Catalog
// @Param    search  query  string  false  "Search by name"
// @Param    ids     query  string  false  "Comma-separated IDs"
// @Success  200  {array}  models.Developer
// @Router   /developers [get]
func GetDevelopers(c *gin.Context) {
	db := deps.GetDB(c)
	search := strings.TrimSpace(c.Query("search"))
	ids := parseIDsQuery(c.Query("ids"))

	var list []models.Developer
	q := db.Model(&models.Developer{})
	if len(ids) > 0 {
		q = q.Where("id IN ?", ids)
	} else if search != "" {
		term := "%" + search + "%"
		q = q.Where("name ILIKE ?", term)
	}
	if err := q.Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch developers")
		return
	}
	c.JSON(http.StatusOK, list)
}

// GetPublishers godoc
// @Summary  Get publishers list
// @Tags     Catalog
// @Param    search  query  string  false  "Search by name"
// @Param    ids     query  string  false  "Comma-separated IDs"
// @Success  200  {array}  models.Publisher
// @Router   /publishers [get]
func GetPublishers(c *gin.Context) {
	db := deps.GetDB(c)
	search := strings.TrimSpace(c.Query("search"))
	ids := parseIDsQuery(c.Query("ids"))
	mediaType := strings.TrimSpace(strings.ToLower(c.Query("mediaType")))

	var list []models.Publisher
	q := db.Model(&models.Publisher{})
	if len(ids) > 0 {
		q = q.Where("id IN ?", ids)
	} else if search != "" {
		term := "%" + search + "%"
		q = q.Where("name ILIKE ?", term)
	}
	if err := q.Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch publishers")
		return
	}
	if mediaType != "" {
		filtered := make([]models.Publisher, 0, len(list))
		for _, pub := range list {
			if len(pub.PublicationTypes) == 0 {
				filtered = append(filtered, pub)
				continue
			}
			for _, item := range pub.PublicationTypes {
				if item == mediaType {
					filtered = append(filtered, pub)
					break
				}
			}
		}
		list = filtered
	}
	c.JSON(http.StatusOK, list)
}

// GetStudio godoc
// @Summary  Get studio by ID with projects
// @Tags     Catalog
// @Param    id   path  int  true  "Studio ID"
// @Success  200  {object}  map[string]interface{}
// @Router   /studios/{id} [get]
func GetStudio(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var studio models.Studio
	if err := db.First(&studio, id).Error; err != nil {
		api.RespondNotFound(c, "Studio not found")
		return
	}
	sections := loadStudioProjects(db, id)
	c.JSON(http.StatusOK, gin.H{
		"id": studio.ID, "createdAt": studio.CreatedAt, "updatedAt": studio.UpdatedAt,
		"name": studio.Name, "nameI18n": studio.NameI18n, "description": studio.Description,
		"descriptionI18n": studio.DescriptionI18n, "country": studio.Country, "poster": studio.Poster,
		"projects": sections,
	})
}

func loadStudioProjects(db *gorm.DB, studioID uint) []projectSection {
	var sections []projectSection
	type row struct{ ID uint; Title string; Poster *string }
	var movies []row
	db.Table("movies").Joins("JOIN movie_studios ON movie_studios.movie_id = movies.id AND movie_studios.studio_id = ?", studioID).
		Select("movies.id, movies.title, movies.poster").Find(&movies)
	if len(movies) > 0 {
		entries := make([]projectEntry, len(movies))
		for i, m := range movies {
			entries[i] = projectEntry{Type: "movie", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "movie", LabelKey: "nav.movies", Entries: entries})
	}
	var tv []row
	db.Table("tv_series").Joins("JOIN tvseries_studios ON tvseries_studios.tv_series_id = tv_series.id AND tvseries_studios.studio_id = ?", studioID).
		Select("tv_series.id, tv_series.title, tv_series.poster").Find(&tv)
	if len(tv) > 0 {
		entries := make([]projectEntry, len(tv))
		for i, m := range tv {
			entries[i] = projectEntry{Type: "tv-series", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "tv-series", LabelKey: "nav.tvSeries", Entries: entries})
	}
	var anime []row
	db.Table("anime_series").Joins("JOIN animeseries_studios ON animeseries_studios.anime_series_id = anime_series.id AND animeseries_studios.studio_id = ?", studioID).
		Select("anime_series.id, anime_series.title, anime_series.poster").Find(&anime)
	if len(anime) > 0 {
		entries := make([]projectEntry, len(anime))
		for i, m := range anime {
			entries[i] = projectEntry{Type: "anime", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "anime", LabelKey: "nav.anime", Entries: entries})
	}
	var cs []row
	db.Table("cartoon_series").Joins("JOIN cartoonseries_studios ON cartoonseries_studios.cartoon_series_id = cartoon_series.id AND cartoonseries_studios.studio_id = ?", studioID).
		Select("cartoon_series.id, cartoon_series.title, cartoon_series.poster").Find(&cs)
	if len(cs) > 0 {
		entries := make([]projectEntry, len(cs))
		for i, m := range cs {
			entries[i] = projectEntry{Type: "cartoon-series", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "cartoon-series", LabelKey: "nav.cartoonSeries", Entries: entries})
	}
	var cm []row
	db.Table("cartoon_movies").Joins("JOIN cartoonmovie_studios ON cartoonmovie_studios.cartoon_movie_id = cartoon_movies.id AND cartoonmovie_studios.studio_id = ?", studioID).
		Select("cartoon_movies.id, cartoon_movies.title, cartoon_movies.poster").Find(&cm)
	if len(cm) > 0 {
		entries := make([]projectEntry, len(cm))
		for i, m := range cm {
			entries[i] = projectEntry{Type: "cartoon-movies", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "cartoon-movies", LabelKey: "nav.cartoonMovies", Entries: entries})
	}
	var am []row
	db.Table("anime_movies").Joins("JOIN animemovie_studios ON animemovie_studios.anime_movie_id = anime_movies.id AND animemovie_studios.studio_id = ?", studioID).
		Select("anime_movies.id, anime_movies.title, anime_movies.poster").Find(&am)
	if len(am) > 0 {
		entries := make([]projectEntry, len(am))
		for i, m := range am {
			entries[i] = projectEntry{Type: "anime-movies", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "anime-movies", LabelKey: "nav.animeMovies", Entries: entries})
	}
	return sections
}

// GetPublisher godoc
// @Summary  Get publisher by ID with projects
// @Tags     Catalog
// @Param    id   path  int  true  "Publisher ID"
// @Success  200  {object}  map[string]interface{}
// @Router   /publishers/{id} [get]
func GetPublisher(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var pub models.Publisher
	if err := db.First(&pub, id).Error; err != nil {
		api.RespondNotFound(c, "Publisher not found")
		return
	}
	sections := loadPublisherProjects(db, id)
	c.JSON(http.StatusOK, gin.H{
		"id": pub.ID, "createdAt": pub.CreatedAt, "updatedAt": pub.UpdatedAt,
		"name": pub.Name, "nameI18n": pub.NameI18n, "description": pub.Description,
		"descriptionI18n": pub.DescriptionI18n, "country": pub.Country, "poster": pub.Poster, "publicationTypes": pub.PublicationTypes,
		"projects": sections,
	})
}

func loadPublisherProjects(db *gorm.DB, publisherID uint) []projectSection {
	var sections []projectSection
	type row struct{ ID uint; Title string; Poster *string }
	var games []row
	db.Table("games").Joins("JOIN game_publishers ON game_publishers.game_id = games.id AND game_publishers.publisher_id = ?", publisherID).
		Select("games.id, games.title, games.poster").Find(&games)
	if len(games) > 0 {
		entries := make([]projectEntry, len(games))
		for i, m := range games {
			entries[i] = projectEntry{Type: "game", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "game", LabelKey: "nav.games", Entries: entries})
	}
	var manga []row
	db.Table("mangas").Joins("JOIN manga_publishers ON manga_publishers.manga_id = mangas.id AND manga_publishers.publisher_id = ?", publisherID).
		Select("mangas.id, mangas.title, mangas.poster").Find(&manga)
	if len(manga) > 0 {
		entries := make([]projectEntry, len(manga))
		for i, m := range manga {
			entries[i] = projectEntry{Type: "manga", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "manga", LabelKey: "nav.manga", Entries: entries})
	}
	var books []row
	db.Table("books").Joins("JOIN book_publishers ON book_publishers.book_id = books.id AND book_publishers.publisher_id = ?", publisherID).
		Select("books.id, books.title, books.poster").Find(&books)
	if len(books) > 0 {
		entries := make([]projectEntry, len(books))
		for i, m := range books {
			entries[i] = projectEntry{Type: "book", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "book", LabelKey: "nav.books", Entries: entries})
	}
	var ln []row
	db.Table("light_novels").Joins("JOIN lightnovel_publishers ON lightnovel_publishers.light_novel_id = light_novels.id AND lightnovel_publishers.publisher_id = ?", publisherID).
		Select("light_novels.id, light_novels.title, light_novels.poster").Find(&ln)
	if len(ln) > 0 {
		entries := make([]projectEntry, len(ln))
		for i, m := range ln {
			entries[i] = projectEntry{Type: "light-novel", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "light-novel", LabelKey: "nav.lightNovels", Entries: entries})
	}
	return sections
}

// GetDeveloper godoc
// @Summary  Get developer by ID with projects
// @Tags     Catalog
// @Param    id   path  int  true  "Developer ID"
// @Success  200  {object}  map[string]interface{}
// @Router   /developers/{id} [get]
func GetDeveloper(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var dev models.Developer
	if err := db.First(&dev, id).Error; err != nil {
		api.RespondNotFound(c, "Developer not found")
		return
	}
	sections := loadDeveloperProjects(db, id)
	c.JSON(http.StatusOK, gin.H{
		"id": dev.ID, "createdAt": dev.CreatedAt, "updatedAt": dev.UpdatedAt,
		"name": dev.Name, "nameI18n": dev.NameI18n, "description": dev.Description,
		"descriptionI18n": dev.DescriptionI18n, "country": dev.Country, "poster": dev.Poster,
		"projects": sections,
	})
}

func loadDeveloperProjects(db *gorm.DB, developerID uint) []projectSection {
	var sections []projectSection
	type row struct{ ID uint; Title string; Poster *string }
	var games []row
	db.Table("games").Joins("JOIN game_developers ON game_developers.game_id = games.id AND game_developers.developer_id = ?", developerID).
		Select("games.id, games.title, games.poster").Find(&games)
	if len(games) > 0 {
		entries := make([]projectEntry, len(games))
		for i, m := range games {
			entries[i] = projectEntry{Type: "game", ID: m.ID, Title: m.Title, Poster: m.Poster}
		}
		sections = append(sections, projectSection{Type: "game", LabelKey: "nav.games", Entries: entries})
	}
	return sections
}
