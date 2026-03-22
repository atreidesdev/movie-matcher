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

// @Summary Get persons list
// @Tags persons
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Items per page" default(20)
// @Param sortBy query string false "Sort field: created_at, first_name, last_name, birth_date, popularity" default(created_at)
// @Param order query string false "Sort order: ASC, DESC" default(DESC)
// @Param search query string false "Search in name"
// @Param profession query string false "Filter by profession: actor, actress, director, producer, writer, etc."
// @Param country query string false "Filter by country"
// @Success 200 {object} ExtendedPaginatedResponse
// @Router /persons [get]
func GetPersons(c *gin.Context) {
	params := ParseQueryParams(c)
	db := deps.GetDB(c)

	var persons []models.Person
	var total int64

	query := db.Model(&models.Person{})

	if params.Search != "" {
		searchTerm := "%" + params.Search + "%"
		query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR CONCAT(first_name, ' ', last_name) ILIKE ?",
			searchTerm, searchTerm, searchTerm)
	}

	if len(params.Professions) > 0 {
		query = query.Where("? = ANY(profession)", params.Professions[0])
		for _, p := range params.Professions[1:] {
			query = query.Or("? = ANY(profession)", p)
		}
	}

	if len(params.Countries) > 0 {
		query = query.Where("country IN ?", params.Countries)
	}

	if params.MediaType != "" {
		if subq := personIDsInMediaType(db, params.MediaType); subq != nil {
			query = query.Where("people.id IN (?)", subq)
		}
	}
	if params.CompanyType != "" {
		if subq := personIDsInCompanyType(db, params.CompanyType); subq != nil {
			query = query.Where("people.id IN (?)", subq)
		}
	}

	query.Count(&total)

	sortField := params.ValidateSortField("person")
	order := params.ValidateOrder()

	if sortField == "popularity_score" {
		query = query.Joins("LEFT JOIN popularity_stats ON popularity_stats.entity_type = ? AND popularity_stats.entity_id = people.id", models.EntityTypePerson).
			Order("popularity_stats.popularity_score " + order + " NULLS LAST")
	} else {
		query = query.Order(sortField + " " + order + " NULLS LAST")
	}

	if err := query.Offset(params.Offset()).Limit(params.PageSize).
		Find(&persons).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch persons")
		return
	}

	c.JSON(http.StatusOK, BuildExtendedResponse(persons, total, params))
}

func GetPerson(c *gin.Context) {
	id, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var person models.Person
	if err := db.First(&person, id).Error; err != nil {
		api.RespondNotFound(c, "Person not found")
		return
	}

	RecordEntityView(c, models.EntityTypePerson, person.ID)

	c.JSON(http.StatusOK, person)
}

func GetPersonCredits(c *gin.Context) {
	personID, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var casts []models.Cast
	if err := db.Where("person_id = ?", personID).
		Preload("Character").
		Find(&casts).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch credits")
		return
	}

	c.JSON(http.StatusOK, casts)
}

func GetPersonMovies(c *gin.Context) {
	personID, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var movies []models.Movie
	if err := db.
		Joins("JOIN movie_cast ON movie_cast.movie_id = movies.id").
		Joins("JOIN casts ON casts.id = movie_cast.cast_id").
		Where("casts.person_id = ?", personID).
		Preload("Genres").
		Find(&movies).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch movies")
		return
	}

	c.JSON(http.StatusOK, movies)
}

func GetPersonAnime(c *gin.Context) {
	personID, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var anime []models.AnimeSeries
	if err := db.
		Joins("JOIN animeseries_cast ON animeseries_cast.anime_series_id = anime_series.id").
		Joins("JOIN casts ON casts.id = animeseries_cast.cast_id").
		Where("casts.person_id = ?", personID).
		Preload("Genres").
		Find(&anime).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch anime")
		return
	}

	c.JSON(http.StatusOK, anime)
}

func SearchPersons(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}

	params := ParseQueryParams(c)
	params.Search = searchQuery
	db := deps.GetDB(c)

	var persons []models.Person
	var total int64

	query := db.Model(&models.Person{})
	searchTerm := "%" + params.Search + "%"
	query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR CONCAT(first_name, ' ', last_name) ILIKE ?",
		searchTerm, searchTerm, searchTerm)

	if params.MediaType != "" {
		if subq := personIDsInMediaType(db, params.MediaType); subq != nil {
			query = query.Where("people.id IN (?)", subq)
		}
	}
	if params.CompanyType != "" {
		if subq := personIDsInCompanyType(db, params.CompanyType); subq != nil {
			query = query.Where("people.id IN (?)", subq)
		}
	}

	if len(params.Professions) > 0 {
		query = query.Where("? = ANY(profession)", params.Professions[0])
		for _, p := range params.Professions[1:] {
			query = query.Or("? = ANY(profession)", p)
		}
	}

	query.Count(&total)

	sortField := params.ValidateSortField("person")
	order := params.ValidateOrder()
	query = query.Order(sortField + " " + order + " NULLS LAST")

	if err := query.Offset(params.Offset()).Limit(params.PageSize).
		Find(&persons).Error; err != nil {
		api.RespondInternal(c, "Failed to search persons")
		return
	}

	c.JSON(http.StatusOK, BuildExtendedResponse(persons, total, params))
}

func GetPopularPersons(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")
	profession := c.Query("profession")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityService()

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypePerson, limit)
	} else {
		ids, err = popService.GetPopularIDs(models.EntityTypePerson, limit)
	}

	var persons []models.Person

	if err != nil || len(ids) == 0 {
		query := deps.GetDB(c).Model(&models.Person{})
		if profession != "" {
			query = query.Where("? = ANY(profession)", profession)
		}
		if err := query.Limit(limit).Find(&persons).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular persons")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		query := deps.GetDB(c).Where("id IN ?", ids)
		if profession != "" {
			query = query.Where("? = ANY(profession)", profession)
		}
		if err := query.Order(orderClause).Find(&persons).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular persons")
			return
		}
	}

	c.JSON(http.StatusOK, persons)
}

func GetPersonComments(c *gin.Context) {
	personID, ok := api.ParseUintParam(c, "id")
	if !ok {
		return
	}
	page, pageSize := api.ParsePageParams(c, 0, 10, api.MaxPageSize)

	comments, total := GetPersonCommentsPage(c, strconv.FormatUint(uint64(personID), 10), page, pageSize)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total})
}

func GetPersonFilters(c *gin.Context) {
	filters := map[string]interface{}{
		"sortOptions":  []string{"created_at", "first_name", "last_name", "birth_date", "popularity"},
		"orderOptions": []string{"ASC", "DESC"},
		"professions":  []string{"actor", "actress", "director", "producer", "writer", "cinematographer", "composer", "editor", "animator", "voiceActor"},
	}

	var countries []string
	deps.GetDB(c).Model(&models.Person{}).Distinct("country").Where("country IS NOT NULL").Pluck("country", &countries)
	filters["countries"] = countries

	c.JSON(http.StatusOK, filters)
}
