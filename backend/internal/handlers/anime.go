package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/repository"
	"github.com/movie-matcher/backend/internal/services"
	"gorm.io/gorm"
)

var animeSeriesRepo = &repository.AnimeSeriesRepository{}

// @Summary Get anime series list
// @Tags anime
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Items per page" default(20)
// @Param sortBy query string false "Sort field: created_at, title, rating, release_date, popularity" default(created_at)
// @Param order query string false "Sort order: ASC, DESC" default(DESC)
// @Param search query string false "Search in title and description"
// @Param genreId query int false "Filter by genre ID"
// @Param themeId query int false "Filter by theme ID"
// @Param year query int false "Filter by release year"
// @Param yearFrom query int false "Filter by release year from"
// @Param yearTo query int false "Filter by release year to"
// @Param minRating query number false "Minimum rating"
// @Param maxRating query number false "Maximum rating"
// @Param ageRating query string false "Filter by age rating"
// @Param studioId query int false "Filter by studio ID"
// @Param status query string false "Filter by airing status"
// @Success 200 {object} ExtendedPaginatedResponse
// @Router /anime [get]
func GetAnimeSeries(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.AnimeSeries{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "anime_series")
		q = ApplyStudioFilter(q, params, "anime_series")
		return ApplyPopularitySort(q, params, models.EntityTypeAnimeSeries)
	}
	list, total, err := animeSeriesRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch anime series")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetAnimeSeriesById godoc
// @Summary  Get anime series by ID
// @Tags     Anime
// @Produce  json
// @Param    id   path  int  true  "Anime ID"
// @Success  200  {object}  models.AnimeSeries
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /anime/{id} [get]
func GetAnimeSeriesById(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime ID", nil)
		return
	}
	db := deps.GetDB(c)
	anime, err := animeSeriesRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Anime series not found")
		return
	}
	RecordEntityView(c, models.EntityTypeAnimeSeries, anime.ID)
	anime.Staff = LoadMediaStaff(db, "anime", anime.ID)
	if len(anime.Similar) > 0 {
		EnrichAnimeSeriesWithListStatus(c, db, &anime.Similar)
	}
	c.JSON(http.StatusOK, anime)
}

// GetPopularAnime godoc
// @Summary  Get popular anime series
// @Tags     Anime
// @Param    limit  query  int     false  "Limit"  default(10)
// @Param    mode   query  string  false  "popular|trending|rating"  default(popular)
// @Success  200  {array}  models.AnimeSeries
// @Router   /anime/popular [get]
func GetPopularAnime(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeAnimeSeries, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeAnimeSeries, limit)
	}

	db := deps.GetDB(c)
	var animeSeries []models.AnimeSeries

	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.AnimeSeries{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&animeSeries).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular anime")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.AnimeSeries{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&animeSeries).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular anime")
			return
		}
	}

	c.JSON(http.StatusOK, animeSeries)
}

// SearchAnime godoc
// @Summary  Search anime series
// @Tags     Anime
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /anime/search [get]
func SearchAnime(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.AnimeSeries{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "anime_series")
		q = ApplyStudioFilter(q, params, "anime_series")
		return ApplyPopularitySort(q, params, models.EntityTypeAnimeSeries)
	}
	list, total, err := animeSeriesRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search anime")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetAnimeFilters godoc
// @Summary  Get anime filter options
// @Tags     Anime
// @Produce  json
// @Success  200  {object}  map[string]interface{}
// @Router   /anime/filters [get]
func GetAnimeFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeAnimeSeries)
	c.JSON(http.StatusOK, filters)
}
