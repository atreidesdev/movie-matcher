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

var lightNovelRepo = &repository.LightNovelRepository{}

// GetLightNovels godoc
// @Summary  Get light novels list
// @Tags     Light Novels
// @Produce  json
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /light-novels [get]
func GetLightNovels(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.LightNovel{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "light_novels")
		q = ApplyAuthorFilter(q, params, "light_novels")
		q = ApplyIllustratorFilter(q, params, "light_novels")
		q = ApplyPublisherFilter(q, params, "light_novels")
		return ApplyPopularitySort(q, params, models.EntityTypeLightNovel)
	}
	list, total, err := lightNovelRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch light novels")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetLightNovel godoc
// @Summary  Get light novel by ID
// @Tags     Light Novels
// @Param    id   path  int  true  "Light Novel ID"
// @Success  200  {object}  models.LightNovel
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /light-novels/{id} [get]
func GetLightNovel(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid light novel ID", nil)
		return
	}
	db := deps.GetDB(c)
	novel, err := lightNovelRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Light novel not found")
		return
	}
	RecordEntityView(c, models.EntityTypeLightNovel, novel.ID)
	novel.Staff = LoadMediaStaff(db, "light-novel", novel.ID)
	if len(novel.Similar) > 0 {
		EnrichLightNovelsWithListStatus(c, db, &novel.Similar)
	}
	c.JSON(http.StatusOK, novel)
}

// GetPopularLightNovels godoc
// @Summary  Get popular light novels
// @Tags     Light Novels
// @Param    limit  query  int  false  "Limit"  default(10)
// @Param    mode   query  string  false  "popular|trending|rating"  default(popular)
// @Success  200  {array}  models.LightNovel
// @Router   /light-novels/popular [get]
func GetPopularLightNovels(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeLightNovel, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeLightNovel, limit)
	}

	db := deps.GetDB(c)
	var novels []models.LightNovel

	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").
			Model(&models.LightNovel{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&novels).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular light novels")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").
			Model(&models.LightNovel{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&novels).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular light novels")
			return
		}
	}

	c.JSON(http.StatusOK, novels)
}

// SearchLightNovels godoc
// @Summary  Search light novels
// @Tags     Light Novels
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /light-novels/search [get]
func SearchLightNovels(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.LightNovel{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "light_novels")
		q = ApplyAuthorFilter(q, params, "light_novels")
		q = ApplyIllustratorFilter(q, params, "light_novels")
		q = ApplyPublisherFilter(q, params, "light_novels")
		return ApplyPopularitySort(q, params, models.EntityTypeLightNovel)
	}
	list, total, err := lightNovelRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search light novels")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

func GetLightNovelFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeLightNovel)
	c.JSON(http.StatusOK, filters)
}
