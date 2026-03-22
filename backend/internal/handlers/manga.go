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

var mangaRepo = &repository.MangaRepository{}

// @Summary Get manga list
// @Tags manga
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Items per page" default(20)
// @Param sortBy query string false "Sort field" default(created_at)
// @Param order query string false "Sort order" default(DESC)
// @Param search query string false "Search in title and description"
// @Param genreId query int false "Filter by genre ID"
// @Param themeId query int false "Filter by theme ID"
// @Param authorId query int false "Filter by author ID"
// @Param publisherId query int false "Filter by publisher ID"
// @Param year query int false "Filter by release year"
// @Param minRating query number false "Minimum rating"
// @Param maxRating query number false "Maximum rating"
// @Success 200 {object} ExtendedPaginatedResponse
// @Router /manga [get]
func GetMangaList(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Manga{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "mangas")
		q = ApplyAuthorFilter(q, params, "mangas")
		q = ApplyPublisherFilter(q, params, "mangas")
		return ApplyPopularitySort(q, params, models.EntityTypeManga)
	}
	list, total, err := mangaRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch manga")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetManga godoc
// @Summary  Get manga by ID
// @Tags     Manga
// @Param    id   path  int  true  "Manga ID"
// @Success  200  {object}  models.Manga
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /manga/{id} [get]
func GetManga(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid manga ID", nil)
		return
	}
	db := deps.GetDB(c)
	manga, err := mangaRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Manga not found")
		return
	}
	RecordEntityView(c, models.EntityTypeManga, manga.ID)
	manga.Staff = LoadMediaStaff(db, "manga", manga.ID)
	if len(manga.Similar) > 0 {
		EnrichMangaWithListStatus(c, db, &manga.Similar)
	}
	c.JSON(http.StatusOK, manga)
}

// GetPopularManga godoc
// @Summary  Get popular manga
// @Tags     Manga
// @Param    limit  query  int  false  "Limit"  default(10)
// @Param    mode   query  string  false  "popular|trending|rating"  default(popular)
// @Success  200  {array}  models.Manga
// @Router   /manga/popular [get]
func GetPopularManga(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeManga, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeManga, limit)
	}

	var manga []models.Manga

	db := deps.GetDB(c)
	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").
			Model(&models.Manga{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&manga).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular manga")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").
			Model(&models.Manga{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&manga).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular manga")
			return
		}
	}

	c.JSON(http.StatusOK, manga)
}

// SearchManga godoc
// @Summary  Search manga
// @Tags     Manga
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /manga/search [get]
func SearchManga(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Manga{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "mangas")
		q = ApplyAuthorFilter(q, params, "mangas")
		q = ApplyPublisherFilter(q, params, "mangas")
		return ApplyPopularitySort(q, params, models.EntityTypeManga)
	}
	list, total, err := mangaRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search manga")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

func GetMangaFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeManga)
	c.JSON(http.StatusOK, filters)
}
