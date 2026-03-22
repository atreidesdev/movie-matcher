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

var gameRepo = &repository.GameRepository{}

// @Summary Get games list
// @Tags games
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Items per page" default(20)
// @Param sortBy query string false "Sort field" default(created_at)
// @Param order query string false "Sort order" default(DESC)
// @Param search query string false "Search in title and description"
// @Param genreId query int false "Filter by genre ID"
// @Param themeId query int false "Filter by theme ID"
// @Param platformId query int false "Filter by platform ID"
// @Param developerId query int false "Filter by developer ID"
// @Param publisherId query int false "Filter by publisher ID"
// @Param year query int false "Filter by release year"
// @Param minRating query number false "Minimum rating"
// @Param maxRating query number false "Maximum rating"
// @Param ageRating query string false "Filter by age rating"
// @Success 200 {object} ExtendedPaginatedResponse
// @Router /games [get]
func GetGames(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Game{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "games")
		q = ApplyPlatformFilter(q, params, "games")
		q = ApplyDeveloperFilter(q, params, "games")
		q = ApplyPublisherFilter(q, params, "games")
		return ApplyPopularitySort(q, params, models.EntityTypeGame)
	}
	games, total, err := gameRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch games")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(games, total, params))
}

// GetGame godoc
// @Summary  Get game by ID
// @Tags     Games
// @Produce  json
// @Param    id   path  int  true  "Game ID"
// @Success  200  {object}  models.Game
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /games/{id} [get]
func GetGame(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid game ID", nil)
		return
	}
	db := deps.GetDB(c)
	game, err := gameRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Game not found")
		return
	}
	RecordEntityView(c, models.EntityTypeGame, game.ID)
	game.Staff = LoadMediaStaff(db, "game", game.ID)
	if len(game.Similar) > 0 {
		EnrichGamesWithListStatus(c, db, &game.Similar)
	}
	c.JSON(http.StatusOK, game)
}

// GetPopularGames godoc
// @Summary  Get popular games
// @Tags     Games
// @Param    limit  query  int  false  "Limit"  default(10)
// @Param    mode   query  string  false  "popular|trending|rating"  default(popular)
// @Success  200  {array}  models.Game
// @Router   /games/popular [get]
func GetPopularGames(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeGame, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeGame, limit)
	}

	db := deps.GetDB(c)
	var games []models.Game

	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").Preload("Platforms").
			Model(&models.Game{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&games).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular games")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").Preload("Platforms").
			Model(&models.Game{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&games).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular games")
			return
		}
	}

	c.JSON(http.StatusOK, games)
}

// SearchGames godoc
// @Summary  Search games
// @Tags     Games
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /games/search [get]
func SearchGames(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}

	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Game{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "games")
		q = ApplyPlatformFilter(q, params, "games")
		q = ApplyDeveloperFilter(q, params, "games")
		q = ApplyPublisherFilter(q, params, "games")
		return ApplyPopularitySort(q, params, models.EntityTypeGame)
	}
	games, total, err := gameRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search games")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(games, total, params))
}

// GetGameFilters godoc
// @Summary  Get game filter options
// @Tags     Games
// @Produce  json
// @Success  200  {object}  map[string]interface{}
// @Router   /games/filters [get]
func GetGameFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeGame)

	var platforms []models.Platform
	db.Find(&platforms)
	filters["platforms"] = platforms

	c.JSON(http.StatusOK, filters)
}
