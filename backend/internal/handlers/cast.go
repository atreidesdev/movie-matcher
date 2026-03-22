package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

// LoadMediaStaff загружает персонал из media_staff для указанного типа и ID медиа.
func LoadMediaStaff(db *gorm.DB, mediaType string, mediaID uint) []models.MediaStaff {
	var list []models.MediaStaff
	_ = db.Where("media_type = ? AND media_id = ?", mediaType, mediaID).Preload("Person").Find(&list).Error
	return list
}

// GetCasts godoc
// @Summary  Get casts list
// @Tags     Cast
// @Param    page      query  int     false  "Page"
// @Param    pageSize  query  int     false  "Page size"
// @Param    roleType  query  string  false  "Filter by role type"
// @Success  200  {object}  PaginatedResponse
// @Router   /cast [get]
func GetCasts(c *gin.Context) {
	page, pageSize := api.ParsePageParams(c, api.DefaultPage, api.DefaultPageSize, api.MaxPageSize)
	roleType := c.Query("roleType")

	var casts []models.Cast
	var total int64

	query := deps.GetDB(c).Model(&models.Cast{})

	if roleType != "" {
		query = query.Where("role_type = ?", roleType)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Preload("Character").Preload("Person").
		Offset(offset).Limit(pageSize).
		Find(&casts).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch casts")
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, PaginatedResponse{
		Data:       casts,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// GetCast godoc
// @Summary  Get cast by ID
// @Tags     Cast
// @Param    id   path  int  true  "Cast ID"
// @Success  200  {object}  models.Cast
// @Router   /cast/{id} [get]
func GetCast(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var cast models.Cast
	if err := db.Preload("Character").Preload("Person").
		First(&cast, id).Error; err != nil {
		api.RespondNotFound(c, "Cast not found")
		return
	}

	c.JSON(http.StatusOK, cast)
}

// GetCastMedia godoc
// @Summary  Get media for cast
// @Tags     Cast
// @Param    id   path  int  true  "Cast ID"
// @Success  200  {object}  map[string]interface{}
// @Router   /cast/{id}/media [get]
func GetCastMedia(c *gin.Context) {
	castID := c.Param("id")

	type CastMedia struct {
		Movies        []models.Movie        `json:"movies"`
		TVSeries      []models.TVSeries     `json:"tvSeries"`
		AnimeSeries   []models.AnimeSeries  `json:"animeSeries"`
		AnimeMovies   []models.AnimeMovie   `json:"animeMovies"`
		CartoonSeries []models.CartoonSeries `json:"cartoonSeries"`
		CartoonMovies []models.CartoonMovie `json:"cartoonMovies"`
	}

	var media CastMedia

	deps.GetDB(c).
		Joins("JOIN movie_cast ON movie_cast.movie_id = movies.id").
		Where("movie_cast.cast_id = ?", castID).
		Find(&media.Movies)

	deps.GetDB(c).
		Joins("JOIN tvseries_cast ON tvseries_cast.tv_series_id = tv_series.id").
		Where("tvseries_cast.cast_id = ?", castID).
		Find(&media.TVSeries)

	deps.GetDB(c).
		Joins("JOIN animeseries_cast ON animeseries_cast.anime_series_id = anime_series.id").
		Where("animeseries_cast.cast_id = ?", castID).
		Find(&media.AnimeSeries)

	deps.GetDB(c).
		Joins("JOIN animemovie_cast ON animemovie_cast.anime_movie_id = anime_movies.id").
		Where("animemovie_cast.cast_id = ?", castID).
		Find(&media.AnimeMovies)

	deps.GetDB(c).
		Joins("JOIN cartoonseries_cast ON cartoonseries_cast.cartoon_series_id = cartoon_series.id").
		Where("cartoonseries_cast.cast_id = ?", castID).
		Find(&media.CartoonSeries)

	deps.GetDB(c).
		Joins("JOIN cartoonmovie_cast ON cartoonmovie_cast.cartoon_movie_id = cartoon_movies.id").
		Where("cartoonmovie_cast.cast_id = ?", castID).
		Find(&media.CartoonMovies)

	c.JSON(http.StatusOK, media)
}

// SearchCasts godoc
// @Summary  Search casts
// @Tags     Cast
// @Param    q  query  string  true  "Search query"
// @Success  200  {array}  models.Cast
// @Router   /cast/search [get]
func SearchCasts(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}

	var casts []models.Cast
	searchQuery := "%" + query + "%"

	if err := deps.GetDB(c).
		Joins("LEFT JOIN characters ON characters.id = casts.character_id").
		Joins("LEFT JOIN people ON people.id = casts.person_id").
		Where("casts.role ILIKE ? OR characters.name ILIKE ? OR CONCAT(people.first_name, ' ', people.last_name) ILIKE ?",
			searchQuery, searchQuery, searchQuery).
		Preload("Character").Preload("Person").
		Limit(20).Find(&casts).Error; err != nil {
		api.RespondInternal(c, "Failed to search casts")
		return
	}

	c.JSON(http.StatusOK, casts)
}

// GetMovieCast godoc
// @Summary  Get movie cast
// @Tags     Cast
// @Param    id   path  int  true  "Movie ID"
// @Success  200  {array}  models.Cast
// @Router   /movies/{id}/cast [get]
func GetMovieCast(c *gin.Context) {
	movieID := c.Param("id")

	var casts []models.Cast
	if err := deps.GetDB(c).
		Joins("JOIN movie_cast ON movie_cast.cast_id = casts.id").
		Where("movie_cast.movie_id = ? AND casts.character_id IS NOT NULL", movieID).
		Preload("Character").Preload("Person").Preload("Dubbings").Preload("Dubbings.Person").
		Find(&casts).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch cast")
		return
	}

	c.JSON(http.StatusOK, casts)
}

// GetMovieStaff godoc
// @Summary  Get movie staff
// @Tags     Cast
// @Param    id   path  int  true  "Movie ID"
// @Success  200  {array}  models.MovieStaff
// @Router   /movies/{id}/staff [get]
func GetMovieStaff(c *gin.Context) {
	movieID := c.Param("id")

	var staff []models.MovieStaff
	if err := deps.GetDB(c).
		Where("movie_id = ?", movieID).
		Preload("Person").
		Find(&staff).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch staff")
		return
	}

	c.JSON(http.StatusOK, staff)
}

// GetAnimeCast godoc
// @Summary  Get anime cast
// @Tags     Cast
// @Param    id   path  int  true  "Anime ID"
// @Success  200  {array}  models.Cast
// @Router   /anime/{id}/cast [get]
func GetAnimeCast(c *gin.Context) {
	animeID := c.Param("id")

	var casts []models.Cast
	if err := deps.GetDB(c).
		Joins("JOIN animeseries_cast ON animeseries_cast.cast_id = casts.id").
		Where("animeseries_cast.anime_series_id = ?", animeID).
		Preload("Character").Preload("Person").
		Find(&casts).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch cast")
		return
	}

	c.JSON(http.StatusOK, casts)
}

// GetGameCast godoc
// @Summary  Get game cast
// @Tags     Cast
// @Param    id   path  int  true  "Game ID"
// @Success  200  {array}  models.Cast
// @Router   /games/{id}/cast [get]
func GetGameCast(c *gin.Context) {
	gameID := c.Param("id")

	var casts []models.Cast
	if err := deps.GetDB(c).
		Joins("JOIN game_cast ON game_cast.cast_id = casts.id").
		Where("game_cast.game_id = ?", gameID).
		Preload("Character").Preload("Person").
		Find(&casts).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch cast")
		return
	}

	c.JSON(http.StatusOK, casts)
}
