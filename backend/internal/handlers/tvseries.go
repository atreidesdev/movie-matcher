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

var tvSeriesRepo = &repository.TVSeriesRepository{}

// GetTVSeriesList godoc
// @Summary  Get TV series list
// @Tags     TV Series
// @Produce  json
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /tv-series [get]
func GetTVSeriesList(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.TVSeries{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "tv_series")
		q = ApplyStudioFilter(q, params, "tv_series")
		return ApplyPopularitySort(q, params, models.EntityTypeTVSeries)
	}
	list, total, err := tvSeriesRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch TV series")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetTVSeries godoc
// @Summary  Get TV series by ID
// @Tags     TV Series
// @Param    id   path  int  true  "TV Series ID"
// @Success  200  {object}  models.TVSeries
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /tv-series/{id} [get]
func GetTVSeries(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid TV series ID", nil)
		return
	}
	db := deps.GetDB(c)
	series, err := tvSeriesRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "TV series not found")
		return
	}
	RecordEntityView(c, models.EntityTypeTVSeries, series.ID)
	series.Staff = LoadMediaStaff(db, "tv-series", series.ID)
	if len(series.Similar) > 0 {
		EnrichTVSeriesWithListStatus(c, db, &series.Similar)
	}
	c.JSON(http.StatusOK, series)
}

// GetPopularTVSeries godoc
// @Summary  Get popular TV series
// @Tags     TV Series
// @Param    limit  query  int  false  "Limit"  default(10)
// @Param    mode   query  string  false  "popular|trending|rating"  default(popular)
// @Success  200  {array}  models.TVSeries
// @Router   /tv-series/popular [get]
func GetPopularTVSeries(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeTVSeries, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeTVSeries, limit)
	}

	var series []models.TVSeries

	db := deps.GetDB(c)
	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.TVSeries{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&series).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular TV series")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.TVSeries{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&series).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular TV series")
			return
		}
	}

	c.JSON(http.StatusOK, series)
}

// SearchTVSeries godoc
// @Summary  Search TV series
// @Tags     TV Series
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /tv-series/search [get]
func SearchTVSeries(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.TVSeries{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "tv_series")
		q = ApplyStudioFilter(q, params, "tv_series")
		return ApplyPopularitySort(q, params, models.EntityTypeTVSeries)
	}
	list, total, err := tvSeriesRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search TV series")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

func GetTVSeriesFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeTVSeries)
	c.JSON(http.StatusOK, filters)
}
