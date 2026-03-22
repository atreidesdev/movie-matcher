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

var movieRepo = &repository.MovieRepository{}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// @Summary Get movies list
// @Description Get paginated list of movies with filtering and sorting
// @Tags movies
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Items per page (max 100)" default(20)
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
// @Param country query string false "Filter by country"
// @Param studioId query int false "Filter by studio ID"
// @Success 200 {object} ExtendedPaginatedResponse
// @Router /movies [get]
func GetMovies(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Movie{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "movies")
		q = ApplyStudioFilter(q, params, "movies")
		return ApplyPopularitySort(q, params, models.EntityTypeMovie)
	}
	movies, total, err := movieRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch movies")
		return
	}
	EnrichMoviesWithListStatus(c, db, &movies)
	c.JSON(http.StatusOK, BuildExtendedResponse(movies, total, params))
}

// GetMovie godoc
// @Summary  Get movie by ID
// @Tags     Movies
// @Produce  json
// @Param    id   path  int  true  "Movie ID"
// @Success  200  {object}  models.Movie
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /movies/{id} [get]
func GetMovie(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid movie ID", nil)
		return
	}
	db := deps.GetDB(c)
	movie, err := movieRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Movie not found")
		return
	}
	RecordEntityView(c, models.EntityTypeMovie, movie.ID)
	if len(movie.Similar) > 0 {
		EnrichMoviesWithListStatus(c, db, &movie.Similar)
	}
	c.JSON(http.StatusOK, movie)
}

// @Summary Get popular movies
// @Tags movies
// @Param limit query int false "Number of items" default(10)
// @Param mode query string false "Mode: popular, trending, rating" default(popular)
// @Success 200 {array} models.Movie
// @Router /movies/popular [get]
func GetPopularMovies(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	db := deps.GetDB(c)
	popService := services.NewPopularityServiceWithDB(db)

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeMovie, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeMovie, limit)
	}

	var movies []models.Movie

	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.Movie{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&movies).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular movies")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.Movie{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&movies).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular movies")
			return
		}
	}

	c.JSON(http.StatusOK, movies)
}

// @Summary Search movies
// @Tags movies
// @Param q query string true "Search query"
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Items per page" default(20)
// @Param sortBy query string false "Sort field" default(created_at)
// @Param order query string false "Sort order" default(DESC)
// @Success 200 {object} ExtendedPaginatedResponse
// @Router /movies/search [get]
func SearchMovies(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}

	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Movie{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "movies")
		q = ApplyStudioFilter(q, params, "movies")
		return ApplyPopularitySort(q, params, models.EntityTypeMovie)
	}
	movies, total, err := movieRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search movies")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(movies, total, params))
}

// GetMovieFilters godoc
// @Summary  Get movie filter options
// @Tags     Movies
// @Produce  json
// @Success  200  {object}  map[string]interface{}
// @Router   /movies/filters [get]
func GetMovieFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeMovie)

	var countries []string
	db.Model(&models.Movie{}).Distinct("country").Where("country IS NOT NULL").Pluck("country", &countries)
	filters["countries"] = countries

	c.JSON(http.StatusOK, filters)
}
