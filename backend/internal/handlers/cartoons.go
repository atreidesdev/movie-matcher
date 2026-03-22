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

var (
	cartoonSeriesRepo = &repository.CartoonSeriesRepository{}
	cartoonMovieRepo  = &repository.CartoonMovieRepository{}
)

// GetCartoonSeriesList godoc
// @Summary  Get cartoon series list
// @Tags     Cartoons
// @Produce  json
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /cartoon-series [get]
func GetCartoonSeriesList(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.CartoonSeries{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "cartoon_series")
		q = ApplyStudioFilter(q, params, "cartoon_series")
		return ApplyPopularitySort(q, params, models.EntityTypeCartoonSeries)
	}
	list, total, err := cartoonSeriesRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch cartoon series")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetCartoonSeries godoc
// @Summary  Get cartoon series by ID
// @Tags     Cartoons
// @Param    id   path  int  true  "Cartoon Series ID"
// @Success  200  {object}  models.CartoonSeries
// @Router   /cartoon-series/{id} [get]
func GetCartoonSeries(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon series ID", nil)
		return
	}
	db := deps.GetDB(c)
	series, err := cartoonSeriesRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Cartoon series not found")
		return
	}
	RecordEntityView(c, models.EntityTypeCartoonSeries, series.ID)
	series.Staff = LoadMediaStaff(db, "cartoon-series", series.ID)
	if len(series.Similar) > 0 {
		EnrichCartoonSeriesWithListStatus(c, db, &series.Similar)
	}
	c.JSON(http.StatusOK, series)
}

// GetPopularCartoonSeries godoc
// @Summary  Get popular cartoon series
// @Tags     Cartoons
// @Param    limit  query  int  false  "Limit"  default(10)
// @Success  200  {array}  models.CartoonSeries
// @Router   /cartoon-series/popular [get]
func GetPopularCartoonSeries(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeCartoonSeries, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeCartoonSeries, limit)
	}

	db := deps.GetDB(c)
	var series []models.CartoonSeries

	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.CartoonSeries{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&series).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular cartoon series")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.CartoonSeries{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&series).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular cartoon series")
			return
		}
	}

	c.JSON(http.StatusOK, series)
}

// SearchCartoonSeries godoc
// @Summary  Search cartoon series
// @Tags     Cartoons
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /cartoon-series/search [get]
func SearchCartoonSeries(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.CartoonSeries{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "cartoon_series")
		q = ApplyStudioFilter(q, params, "cartoon_series")
		return ApplyPopularitySort(q, params, models.EntityTypeCartoonSeries)
	}
	list, total, err := cartoonSeriesRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search cartoon series")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetCartoonMovies godoc
// @Summary  Get cartoon movies list
// @Tags     Cartoons
// @Produce  json
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /cartoon-movies [get]
func GetCartoonMovies(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.CartoonMovie{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "cartoon_movies")
		q = ApplyStudioFilter(q, params, "cartoon_movies")
		return ApplyPopularitySort(q, params, models.EntityTypeCartoonMovie)
	}
	list, total, err := cartoonMovieRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch cartoon movies")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetCartoonMovie godoc
// @Summary  Get cartoon movie by ID
// @Tags     Cartoons
// @Param    id   path  int  true  "Cartoon Movie ID"
// @Success  200  {object}  models.CartoonMovie
// @Router   /cartoon-movies/{id} [get]
func GetCartoonMovie(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon movie ID", nil)
		return
	}
	db := deps.GetDB(c)
	movie, err := cartoonMovieRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Cartoon movie not found")
		return
	}
	RecordEntityView(c, models.EntityTypeCartoonMovie, movie.ID)
	movie.Staff = LoadMediaStaff(db, "cartoon-movies", movie.ID)
	if len(movie.Similar) > 0 {
		EnrichCartoonMoviesWithListStatus(c, db, &movie.Similar)
	}
	c.JSON(http.StatusOK, movie)
}

// GetPopularCartoonMovies godoc
// @Summary  Get popular cartoon movies
// @Tags     Cartoons
// @Param    limit  query  int  false  "Limit"  default(10)
// @Success  200  {array}  models.CartoonMovie
// @Router   /cartoon-movies/popular [get]
func GetPopularCartoonMovies(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeCartoonMovie, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeCartoonMovie, limit)
	}

	db := deps.GetDB(c)
	var movies []models.CartoonMovie

	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.CartoonMovie{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&movies).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular cartoon movies")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.CartoonMovie{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&movies).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular cartoon movies")
			return
		}
	}

	c.JSON(http.StatusOK, movies)
}

// SearchCartoonMovies godoc
// @Summary  Search cartoon movies
// @Tags     Cartoons
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /cartoon-movies/search [get]
func SearchCartoonMovies(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.CartoonMovie{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "cartoon_movies")
		q = ApplyStudioFilter(q, params, "cartoon_movies")
		return ApplyPopularitySort(q, params, models.EntityTypeCartoonMovie)
	}
	list, total, err := cartoonMovieRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search cartoon movies")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

func GetCartoonSeriesFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeCartoonSeries)
	c.JSON(http.StatusOK, filters)
}

func GetCartoonMovieFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeCartoonMovie)
	c.JSON(http.StatusOK, filters)
}
