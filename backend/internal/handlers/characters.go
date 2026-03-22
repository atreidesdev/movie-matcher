package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
)

// @Summary Get characters list
// @Tags characters
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Items per page" default(20)
// @Param sortBy query string false "Sort field: created_at, name, popularity" default(created_at)
// @Param order query string false "Sort order: ASC, DESC" default(DESC)
// @Param search query string false "Search in name and description"
// @Success 200 {object} ExtendedPaginatedResponse
// @Router /characters [get]
func GetCharacters(c *gin.Context) {
	params := ParseQueryParams(c)
	db := deps.GetDB(c)

	var characters []models.Character
	var total int64

	query := db.Model(&models.Character{})

	if params.Search != "" {
		searchTerm := "%" + params.Search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}

	if params.MediaType != "" {
		if subq := characterIDsInMediaType(db, params.MediaType); subq != nil {
			query = query.Where("characters.id IN (?)", subq)
		}
	}

	query.Count(&total)

	sortField := params.ValidateSortField("character")
	order := params.ValidateOrder()

	if sortField == "popularity_score" {
		query = query.Joins("LEFT JOIN popularity_stats ON popularity_stats.entity_type = ? AND popularity_stats.entity_id = characters.id", models.EntityTypeCharacter).
			Order("popularity_stats.popularity_score " + order + " NULLS LAST")
	} else {
		query = query.Order(sortField + " " + order)
	}

	if err := query.Offset(params.Offset()).Limit(params.PageSize).
		Find(&characters).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch characters")
		return
	}

	c.JSON(http.StatusOK, BuildExtendedResponse(characters, total, params))
}

func GetCharacter(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var character models.Character
	if err := db.First(&character, id).Error; err != nil {
		api.RespondNotFound(c, "Character not found")
		return
	}

	RecordEntityView(c, models.EntityTypeCharacter, character.ID)

	c.JSON(http.StatusOK, character)
}

func GetCharacterVoiceActors(c *gin.Context) {
	characterID, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var casts []models.Cast
	if err := db.Where("character_id = ?", characterID).
		Preload("Person").
		Find(&casts).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch voice actors")
		return
	}

	c.JSON(http.StatusOK, casts)
}

func GetCharacterAppearances(c *gin.Context) {
	characterID := c.Param("id")

	type Appearances struct {
		Movies        []models.Movie         `json:"movies"`
		TVSeries      []models.TVSeries      `json:"tvSeries"`
		AnimeSeries   []models.AnimeSeries   `json:"animeSeries"`
		AnimeMovies   []models.AnimeMovie    `json:"animeMovies"`
		CartoonSeries []models.CartoonSeries `json:"cartoonSeries"`
		CartoonMovies []models.CartoonMovie  `json:"cartoonMovies"`
		Games         []models.Game          `json:"games"`
	}

	var appearances Appearances

	deps.GetDB(c).
		Joins("JOIN movie_cast ON movie_cast.movie_id = movies.id").
		Joins("JOIN casts ON casts.id = movie_cast.cast_id").
		Where("casts.character_id = ?", characterID).
		Find(&appearances.Movies)

	deps.GetDB(c).
		Joins("JOIN tvseries_cast ON tvseries_cast.tv_series_id = tv_series.id").
		Joins("JOIN casts ON casts.id = tvseries_cast.cast_id").
		Where("casts.character_id = ?", characterID).
		Find(&appearances.TVSeries)

	deps.GetDB(c).
		Joins("JOIN animeseries_cast ON animeseries_cast.anime_series_id = anime_series.id").
		Joins("JOIN casts ON casts.id = animeseries_cast.cast_id").
		Where("casts.character_id = ?", characterID).
		Find(&appearances.AnimeSeries)

	deps.GetDB(c).
		Joins("JOIN animemovie_cast ON animemovie_cast.anime_movie_id = anime_movies.id").
		Joins("JOIN casts ON casts.id = animemovie_cast.cast_id").
		Where("casts.character_id = ?", characterID).
		Find(&appearances.AnimeMovies)

	deps.GetDB(c).
		Joins("JOIN cartoonseries_cast ON cartoonseries_cast.cartoon_series_id = cartoon_series.id").
		Joins("JOIN casts ON casts.id = cartoonseries_cast.cast_id").
		Where("casts.character_id = ?", characterID).
		Find(&appearances.CartoonSeries)

	deps.GetDB(c).
		Joins("JOIN cartoonmovie_cast ON cartoonmovie_cast.cartoon_movie_id = cartoon_movies.id").
		Joins("JOIN casts ON casts.id = cartoonmovie_cast.cast_id").
		Where("casts.character_id = ?", characterID).
		Find(&appearances.CartoonMovies)

	deps.GetDB(c).
		Joins("JOIN game_cast ON game_cast.game_id = games.id").
		Joins("JOIN casts ON casts.id = game_cast.cast_id").
		Where("casts.character_id = ?", characterID).
		Find(&appearances.Games)

	c.JSON(http.StatusOK, appearances)
}

func SearchCharacters(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}

	params := ParseQueryParams(c)
	params.Search = searchQuery
	db := deps.GetDB(c)

	var characters []models.Character
	var total int64

	query := db.Model(&models.Character{})
	searchTerm := "%" + params.Search + "%"
	query = query.Where("name ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)

	if params.MediaType != "" {
		if subq := characterIDsInMediaType(db, params.MediaType); subq != nil {
			query = query.Where("characters.id IN (?)", subq)
		}
	}

	query.Count(&total)

	sortField := params.ValidateSortField("character")
	order := params.ValidateOrder()

	if sortField == "popularity_score" {
		query = query.Joins("LEFT JOIN popularity_stats ON popularity_stats.entity_type = ? AND popularity_stats.entity_id = characters.id", models.EntityTypeCharacter).
			Order("popularity_stats.popularity_score " + order + " NULLS LAST")
	} else {
		query = query.Order(sortField + " " + order)
	}

	if err := query.Offset(params.Offset()).Limit(params.PageSize).
		Find(&characters).Error; err != nil {
		api.RespondInternal(c, "Failed to search characters")
		return
	}

	c.JSON(http.StatusOK, BuildExtendedResponse(characters, total, params))
}

func GetPopularCharacters(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityService()

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeCharacter, limit)
	} else {
		ids, err = popService.GetPopularIDs(models.EntityTypeCharacter, limit)
	}

	var characters []models.Character

	if err != nil || len(ids) == 0 {
		if err := deps.GetDB(c).Limit(limit).Find(&characters).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular characters")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := deps.GetDB(c).Where("id IN ?", ids).Order(orderClause).Find(&characters).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular characters")
			return
		}
	}

	c.JSON(http.StatusOK, characters)
}

func GetCharacterComments(c *gin.Context) {
	characterID, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	page, pageSize := api.ParsePageParams(c, 0, 10, api.MaxPageSize)

	comments, total := GetCharacterCommentsPage(c, strconv.FormatUint(uint64(characterID), 10), page, pageSize)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total})
}
