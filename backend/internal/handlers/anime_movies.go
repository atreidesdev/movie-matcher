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

var animeMovieRepo = &repository.AnimeMovieRepository{}

// GetAnimeMovies godoc
// @Summary  Get anime movies list
// @Tags     Anime Movies
// @Produce  json
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /anime-movies [get]
func GetAnimeMovies(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.AnimeMovie{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "anime_movies")
		q = ApplyStudioFilter(q, params, "anime_movies")
		return ApplyPopularitySort(q, params, models.EntityTypeAnimeMovie)
	}
	list, total, err := animeMovieRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch anime movies")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetAnimeMovie godoc
// @Summary  Get anime movie by ID
// @Tags     Anime Movies
// @Param    id   path  int  true  "Anime Movie ID"
// @Success  200  {object}  models.AnimeMovie
// @Router   /anime-movies/{id} [get]
func GetAnimeMovie(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime movie ID", nil)
		return
	}
	db := deps.GetDB(c)
	movie, err := animeMovieRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Anime movie not found")
		return
	}
	RecordEntityView(c, models.EntityTypeAnimeMovie, movie.ID)
	movie.Staff = LoadMediaStaff(db, "anime-movies", movie.ID)
	if len(movie.Similar) > 0 {
		EnrichAnimeMoviesWithListStatus(c, db, &movie.Similar)
	}
	c.JSON(http.StatusOK, movie)
}

// GetPopularAnimeMovies godoc
// @Summary  Get popular anime movies
// @Tags     Anime Movies
// @Param    limit  query  int  false  "Limit"  default(10)
// @Success  200  {array}  models.AnimeMovie
// @Router   /anime-movies/popular [get]
func GetPopularAnimeMovies(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeAnimeMovie, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeAnimeMovie, limit)
	}

	var movies []models.AnimeMovie

	db := deps.GetDB(c)
	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.AnimeMovie{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&movies).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular anime movies")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").Preload("Studios").
			Model(&models.AnimeMovie{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&movies).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular anime movies")
			return
		}
	}

	c.JSON(http.StatusOK, movies)
}

// SearchAnimeMovies godoc
// @Summary  Search anime movies
// @Tags     Anime Movies
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /anime-movies/search [get]
func SearchAnimeMovies(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.AnimeMovie{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "anime_movies")
		q = ApplyStudioFilter(q, params, "anime_movies")
		return ApplyPopularitySort(q, params, models.EntityTypeAnimeMovie)
	}
	list, total, err := animeMovieRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search anime movies")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

func GetAnimeMovieFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeAnimeMovie)
	c.JSON(http.StatusOK, filters)
}
