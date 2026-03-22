package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
	"gorm.io/gorm"
)

var popularityService *services.PopularityService

func init() {
	popularityService = services.NewPopularityService()
}

func GetPopularityService() *services.PopularityService {
	return popularityService
}

func RecordEntityView(c *gin.Context, entityType string, entityID uint) {
	var userID *uint
	if uid, exists := c.Get("userID"); exists {
		id := uid.(uint)
		userID = &id
	}
	
	ip := c.ClientIP()
	go popularityService.RecordView(entityType, entityID, userID, ip)
}

func GetPopularEntities[T any](c *gin.Context, db *gorm.DB, entityType string, preloads ...string) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular") // popular or trending

	if limit < 1 || limit > 50 {
		limit = 10
	}

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popularityService.GetTrendingIDs(entityType, limit)
	} else {
		ids, err = popularityService.GetPopularIDs(entityType, limit)
	}

	if err != nil || len(ids) == 0 {
		getFallbackPopular[T](c, db, limit, preloads...)
		return
	}

	var entities []T
	query := db

	for _, preload := range preloads {
		query = query.Preload(preload)
	}

	orderClause := "CASE id "
	for i, id := range ids {
		orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
	}
	orderClause += "END"

	if err := query.Where("id IN ?", ids).Order(orderClause).Find(&entities).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch popular items")
		return
	}

	c.JSON(http.StatusOK, entities)
}

func getFallbackPopular[T any](c *gin.Context, db *gorm.DB, limit int, preloads ...string) {
	var entities []T
	query := db

	for _, preload := range preloads {
		query = query.Preload(preload)
	}

	if err := query.Order("created_at DESC").Limit(limit).Find(&entities).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch items")
		return
	}

	c.JSON(http.StatusOK, entities)
}

func GetPopularMoviesV2(c *gin.Context) {
	GetPopularEntities[models.Movie](c, deps.GetDB(c), models.EntityTypeMovie, "Genres", "Studios")
}

func GetPopularAnimeV2(c *gin.Context) {
	GetPopularEntities[models.AnimeSeries](c, deps.GetDB(c), models.EntityTypeAnimeSeries, "Genres", "Studios")
}

func GetPopularGamesV2(c *gin.Context) {
	GetPopularEntities[models.Game](c, deps.GetDB(c), models.EntityTypeGame, "Genres", "Platforms")
}

func GetPopularMangaV2(c *gin.Context) {
	GetPopularEntities[models.Manga](c, deps.GetDB(c), models.EntityTypeManga, "Genres")
}

func GetPopularCharactersV2(c *gin.Context) {
	GetPopularEntities[models.Character](c, deps.GetDB(c), models.EntityTypeCharacter)
}

func GetPopularPersonsV2(c *gin.Context) {
	GetPopularEntities[models.Person](c, deps.GetDB(c), models.EntityTypePerson)
}

func GetPopularTVSeriesV2(c *gin.Context) {
	GetPopularEntities[models.TVSeries](c, deps.GetDB(c), models.EntityTypeTVSeries, "Genres", "Studios")
}

func GetPopularBooksV2(c *gin.Context) {
	GetPopularEntities[models.Book](c, deps.GetDB(c), models.EntityTypeBook, "Genres")
}

func GetPopularLightNovelsV2(c *gin.Context) {
	GetPopularEntities[models.LightNovel](c, deps.GetDB(c), models.EntityTypeLightNovel, "Genres")
}

func GetPopularAnimeMoviesV2(c *gin.Context) {
	GetPopularEntities[models.AnimeMovie](c, deps.GetDB(c), models.EntityTypeAnimeMovie, "Genres", "Studios")
}

func GetPopularCartoonSeriesV2(c *gin.Context) {
	GetPopularEntities[models.CartoonSeries](c, deps.GetDB(c), models.EntityTypeCartoonSeries, "Genres", "Studios")
}

func GetPopularCartoonMoviesV2(c *gin.Context) {
	GetPopularEntities[models.CartoonMovie](c, deps.GetDB(c), models.EntityTypeCartoonMovie, "Genres", "Studios")
}

// GetTrending godoc
// @Summary  Get trending entities
// @Tags     Trending
// @Param    type   query  string  false  "Entity type"
// @Param    limit  query  int     false  "Limit"  default(10)
// @Success  200  {array}  object
// @Router   /trending [get]
func GetTrending(c *gin.Context) {
	entityType := c.Query("type")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if limit < 1 || limit > 50 {
		limit = 10
	}

	ids, err := popularityService.GetTrendingIDs(entityType, limit)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch trending")
		return
	}

	type TrendingItem struct {
		ID         uint    `json:"id"`
		EntityType string  `json:"entityType"`
		Score      float64 `json:"score"`
	}

	db := deps.GetDB(c)
	var stats []models.PopularityStats
	db.Where("entity_type = ? AND entity_id IN ?", entityType, ids).Find(&stats)

	items := make([]TrendingItem, len(stats))
	for i, stat := range stats {
		items[i] = TrendingItem{
			ID:         stat.EntityID,
			EntityType: stat.EntityType,
			Score:      stat.ViewsWeekly,
		}
	}

	c.JSON(http.StatusOK, items)
}

// GetPopularityStats godoc
// @Summary  Get popularity stats for entity
// @Tags     Trending
// @Param    type  path  string  true  "Entity type"
// @Param    id    path  int     true  "Entity ID"
// @Success  200  {object}  models.PopularityStats
// @Router   /stats/{type}/{id} [get]
func GetPopularityStats(c *gin.Context) {
	entityType := c.Param("type")
	entityID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	db := deps.GetDB(c)
	var stats models.PopularityStats
	if err := db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).First(&stats).Error; err != nil {
		api.RespondNotFound(c, "Stats not found")
		return
	}

	c.JSON(http.StatusOK, stats)
}

func AdminRecalculatePopularity(c *gin.Context) {
	entityType := c.Query("type")

	if entityType != "" {
		if err := popularityService.RecalculatePopularity(entityType); err != nil {
			api.RespondInternal(c, err.Error())
			return
		}
	} else {
		entityTypes := []string{
			models.EntityTypeMovie,
			models.EntityTypeTVSeries,
			models.EntityTypeAnimeSeries,
			models.EntityTypeAnimeMovie,
			models.EntityTypeCartoonSeries,
			models.EntityTypeCartoonMovie,
			models.EntityTypeManga,
			models.EntityTypeBook,
			models.EntityTypeLightNovel,
			models.EntityTypeGame,
			models.EntityTypeCharacter,
			models.EntityTypePerson,
		}

		for _, t := range entityTypes {
			popularityService.RecalculatePopularity(t)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Popularity recalculated"})
}

func AdminApplyDecay(c *gin.Context) {
	if err := popularityService.ApplyWeeklyDecay(); err != nil {
		api.RespondInternal(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Weekly decay applied"})
}
