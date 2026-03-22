package handlers

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

// true — скрывать is_hidden (обычный пользователь); false — для админа/контент-крейтора.
func ShouldApplyHiddenFilter(c *gin.Context, db *gorm.DB) bool {
	userIDVal, ok := c.Get("userID")
	if !ok || userIDVal == nil {
		return true
	}
	var user models.User
	if err := db.First(&user, userIDVal).Error; err != nil {
		return true
	}
	return !user.CanManageContent()
}

type QueryParams struct {
	Page           int
	PageSize       int
	SortBy         string
	Order          string
	Search         string
	GenreIDs       []string
	ThemeIDs       []string
	Year           int
	YearFrom       int
	YearTo         int
	Seasons        []string // winter, spring, summer, autumn — только для anime_series
	MinRating      float64
	MaxRating      float64
	AgeRatings     []string
	Countries      []string
	StudioIDs      []string
	Status         string
	Professions    []string
	RoleTypes      []string
	GenreMode       string   // "and" or "or" (default: "or")
	ThemeMode       string   // "and" or "or" (default: "or")
	ExcludeGenreIDs []string // жанры для исключения
	ExcludeThemeIDs []string // темы для исключения
	AuthorIDs      []string
	IllustratorIDs []string
	PublisherIDs   []string
	DeveloperIDs   []string
	PlatformIDs    []string
	SearchIn    string
	MediaType   string // movie, tv-series, anime, game, manga, book, etc.
	CompanyType string // studio, developer, publisher
}

var allowedSortFields = map[string]map[string]string{
	"media": {
		"created_at":   "created_at",
		"updated_at":   "updated_at",
		"title":        "title",
		"rating":       "rating",
		"release_date": "release_date",
		"popularity":   "popularity_score",
	},
	"person": {
		"created_at": "created_at",
		"first_name": "first_name",
		"last_name":  "last_name",
		"birth_date": "birth_date",
		"popularity": "popularity_score",
	},
	"character": {
		"created_at": "created_at",
		"name":       "name",
		"popularity": "popularity_score",
	},
	"default": {
		"created_at": "created_at",
		"updated_at": "updated_at",
		"id":         "id",
	},
}

func parseCommaSeparated(value string) []string {
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func ParseQueryParams(c *gin.Context) QueryParams {
	page, pageSize := api.ParsePageParams(c, api.DefaultPage, api.DefaultPageSize, api.MaxPageSize)
	year, _ := strconv.Atoi(c.Query("year"))
	yearFrom, _ := strconv.Atoi(c.Query("yearFrom"))
	yearTo, _ := strconv.Atoi(c.Query("yearTo"))
	minRating, _ := strconv.ParseFloat(c.Query("minRating"), 64)
	maxRating, _ := strconv.ParseFloat(c.Query("maxRating"), 64)

	genreMode := c.DefaultQuery("genreMode", "or")
	if genreMode != "and" && genreMode != "or" {
		genreMode = "or"
	}

	themeMode := c.DefaultQuery("themeMode", "or")
	if themeMode != "and" && themeMode != "or" {
		themeMode = "or"
	}

	return QueryParams{
		Page:           page,
		PageSize:       pageSize,
		SortBy:         c.DefaultQuery("sortBy", "created_at"),
		Order:          strings.ToUpper(c.DefaultQuery("order", "DESC")),
		Search:         c.Query("search"),
		GenreIDs:       parseCommaSeparated(c.Query("genreIds")),
		ThemeIDs:       parseCommaSeparated(c.Query("themeIds")),
		Year:           year,
		YearFrom:       yearFrom,
		YearTo:         yearTo,
		Seasons:        parseCommaSeparated(c.Query("seasons")),
		MinRating:      minRating,
		MaxRating:      maxRating,
		AgeRatings:     parseCommaSeparated(c.Query("ageRatings")),
		Countries:      parseCommaSeparated(c.Query("countries")),
		StudioIDs:      parseCommaSeparated(c.Query("studioIds")),
		Status:         c.Query("status"),
		Professions:    parseCommaSeparated(c.Query("professions")),
		RoleTypes:      parseCommaSeparated(c.Query("roleTypes")),
		GenreMode:       genreMode,
		ThemeMode:       themeMode,
		ExcludeGenreIDs: parseCommaSeparated(c.Query("excludeGenreIds")),
		ExcludeThemeIDs: parseCommaSeparated(c.Query("excludeThemeIds")),
		AuthorIDs:      parseCommaSeparated(c.Query("authorIds")),
		IllustratorIDs: parseCommaSeparated(c.Query("illustratorIds")),
		PublisherIDs:   parseCommaSeparated(c.Query("publisherIds")),
		DeveloperIDs:   parseCommaSeparated(c.Query("developerIds")),
		PlatformIDs:    parseCommaSeparated(c.Query("platformIds")),
		SearchIn:       c.Query("searchIn"),
		MediaType:      c.Query("mediaType"),
		CompanyType:    c.Query("companyType"),
	}
}

func (p QueryParams) ValidateSortField(category string) string {
	fields, ok := allowedSortFields[category]
	if !ok {
		fields = allowedSortFields["default"]
	}

	if mapped, exists := fields[p.SortBy]; exists {
		return mapped
	}
	return "created_at"
}

func (p QueryParams) ValidateOrder() string {
	if p.Order == "ASC" {
		return "ASC"
	}
	return "DESC"
}

func (p QueryParams) Offset() int {
	return (p.Page - 1) * p.PageSize
}

func ApplyMediaFilters(query *gorm.DB, params QueryParams, tableName string) *gorm.DB {
	singular := singularize(tableName)

	if params.Search != "" {
		searchTerm := "%" + params.Search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}

	if len(params.GenreIDs) > 0 {
		if params.GenreMode == "and" {
			for i, genreID := range params.GenreIDs {
				alias := "g" + strconv.Itoa(i)
				joinTable := tableName + "_genres"
				query = query.Joins("JOIN "+joinTable+" AS "+alias+" ON "+alias+"."+singular+"_id = "+tableName+".id").
					Where(alias+".genre_id = ?", genreID)
			}
		} else {
			query = query.Joins("JOIN "+tableName+"_genres ON "+tableName+"_genres."+singular+"_id = "+tableName+".id").
				Where(tableName+"_genres.genre_id IN ?", params.GenreIDs).
				Group(tableName + ".id")
		}
	}

	if len(params.ThemeIDs) > 0 {
		if params.ThemeMode == "and" {
			for i, themeID := range params.ThemeIDs {
				alias := "t" + strconv.Itoa(i)
				joinTable := tableName + "_themes"
				query = query.Joins("JOIN "+joinTable+" AS "+alias+" ON "+alias+"."+singular+"_id = "+tableName+".id").
					Where(alias+".theme_id = ?", themeID)
			}
		} else {
			query = query.Joins("JOIN "+tableName+"_themes ON "+tableName+"_themes."+singular+"_id = "+tableName+".id").
				Where(tableName+"_themes.theme_id IN ?", params.ThemeIDs).
				Group(tableName + ".id")
		}
	}

	if len(params.ExcludeGenreIDs) > 0 {
		query = query.Where(tableName+".id NOT IN (SELECT "+tableName+"_genres."+singular+"_id FROM "+tableName+"_genres WHERE "+tableName+"_genres.genre_id IN ?)", params.ExcludeGenreIDs)
	}

	if len(params.ExcludeThemeIDs) > 0 {
		query = query.Where(tableName+".id NOT IN (SELECT "+tableName+"_themes."+singular+"_id FROM "+tableName+"_themes WHERE "+tableName+"_themes.theme_id IN ?)", params.ExcludeThemeIDs)
	}

	if params.Year > 0 {
		query = query.Where("EXTRACT(YEAR FROM release_date) = ?", params.Year)
	}

	if params.YearFrom > 0 {
		query = query.Where("EXTRACT(YEAR FROM release_date) >= ?", params.YearFrom)
	}

	if params.YearTo > 0 {
		query = query.Where("EXTRACT(YEAR FROM release_date) <= ?", params.YearTo)
	}

	if len(params.Seasons) > 0 && tableName == "anime_series" {
		query = query.Where("season IN ?", params.Seasons)
	}

	if params.MinRating > 0 {
		query = query.Where("rating >= ?", params.MinRating)
	}

	if params.MaxRating > 0 {
		query = query.Where("rating <= ?", params.MaxRating)
	}

	if len(params.AgeRatings) > 0 {
		query = query.Where("age_rating IN ?", params.AgeRatings)
	}

	if len(params.Countries) > 0 {
		query = query.Where("country IN ?", params.Countries)
	}

	return query
}

func ApplyStudioFilter(query *gorm.DB, params QueryParams, tableName string) *gorm.DB {
	if len(params.StudioIDs) > 0 {
		singular := singularize(tableName)
		joinTable := tableName + "_studios"
		query = query.Joins("JOIN "+joinTable+" ON "+joinTable+"."+singular+"_id = "+tableName+".id").
			Where(joinTable+".studio_id IN ?", params.StudioIDs)
	}
	return query
}

func ApplyAuthorFilter(query *gorm.DB, params QueryParams, tableName string) *gorm.DB {
	if len(params.AuthorIDs) > 0 {
		singular := singularize(tableName)
		joinTable := tableName + "_authors"
		query = query.Joins("JOIN "+joinTable+" ON "+joinTable+"."+singular+"_id = "+tableName+".id").
			Where(joinTable+".person_id IN ?", params.AuthorIDs)
	}
	return query
}

func ApplyIllustratorFilter(query *gorm.DB, params QueryParams, tableName string) *gorm.DB {
	if len(params.IllustratorIDs) > 0 {
		singular := singularize(tableName)
		joinTable := tableName + "_illustrators"
		query = query.Joins("JOIN "+joinTable+" ON "+joinTable+"."+singular+"_id = "+tableName+".id").
			Where(joinTable+".person_id IN ?", params.IllustratorIDs)
	}
	return query
}

func ApplyPublisherFilter(query *gorm.DB, params QueryParams, tableName string) *gorm.DB {
	if len(params.PublisherIDs) > 0 {
		singular := singularize(tableName)
		joinTable := tableName + "_publishers"
		query = query.Joins("JOIN "+joinTable+" ON "+joinTable+"."+singular+"_id = "+tableName+".id").
			Where(joinTable+".publisher_id IN ?", params.PublisherIDs)
	}
	return query
}

func ApplyDeveloperFilter(query *gorm.DB, params QueryParams, tableName string) *gorm.DB {
	if len(params.DeveloperIDs) > 0 {
		singular := singularize(tableName)
		joinTable := tableName + "_developers"
		query = query.Joins("JOIN "+joinTable+" ON "+joinTable+"."+singular+"_id = "+tableName+".id").
			Where(joinTable+".developer_id IN ?", params.DeveloperIDs)
	}
	return query
}

func ApplyPlatformFilter(query *gorm.DB, params QueryParams, tableName string) *gorm.DB {
	if len(params.PlatformIDs) > 0 {
		singular := singularize(tableName)
		joinTable := tableName + "_platforms"
		query = query.Joins("JOIN "+joinTable+" ON "+joinTable+"."+singular+"_id = "+tableName+".id").
			Where(joinTable+".platform_id IN ?", params.PlatformIDs)
	}
	return query
}

func ApplyPopularitySort(query *gorm.DB, params QueryParams, entityType string) *gorm.DB {
	sortField := params.ValidateSortField("media")
	order := params.ValidateOrder()

	if sortField == "popularity_score" {
		query = query.Joins("LEFT JOIN popularity_stats ON popularity_stats.entity_type = ? AND popularity_stats.entity_id = id", entityType).
			Order("popularity_stats.popularity_score " + order + " NULLS LAST")
	} else {
		query = query.Order(sortField + " " + order + " NULLS LAST")
	}

	return query
}

func singularize(tableName string) string {
	switch tableName {
	case "movies":
		return "movie"
	case "tv_series":
		return "tv_series"
	case "anime_series":
		return "anime_series"
	case "cartoon_series":
		return "cartoon_series"
	case "cartoon_movies":
		return "cartoon_movie"
	case "anime_movies":
		return "anime_movie"
	case "mangas":
		return "manga"
	case "games":
		return "game"
	case "books":
		return "book"
	case "light_novels":
		return "light_novel"
	default:
		if strings.HasSuffix(tableName, "s") {
			return tableName[:len(tableName)-1]
		}
		return tableName
	}
}

func BuildPaginatedResponse(data interface{}, total int64, params QueryParams) PaginatedResponse {
	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize > 0 {
		totalPages++
	}

	return PaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}
}

type ExtendedPaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
	Filters    FilterInfo  `json:"filters"`
}

type FilterInfo struct {
	SortBy          string   `json:"sortBy"`
	Order           string   `json:"order"`
	Search          string   `json:"search,omitempty"`
	GenreIDs        []string `json:"genreIds,omitempty"`
	ThemeIDs        []string `json:"themeIds,omitempty"`
	GenreMode       string   `json:"genreMode,omitempty"`
	ThemeMode       string   `json:"themeMode,omitempty"`
	ExcludeGenreIDs []string `json:"excludeGenreIds,omitempty"`
	ExcludeThemeIDs []string `json:"excludeThemeIds,omitempty"`
	Year           int      `json:"year,omitempty"`
	YearFrom       int      `json:"yearFrom,omitempty"`
	YearTo         int      `json:"yearTo,omitempty"`
	MinRating      float64  `json:"minRating,omitempty"`
	MaxRating      float64  `json:"maxRating,omitempty"`
	AgeRatings     []string `json:"ageRatings,omitempty"`
	Countries      []string `json:"countries,omitempty"`
	StudioIDs      []string `json:"studioIds,omitempty"`
	AuthorIDs      []string `json:"authorIds,omitempty"`
	IllustratorIDs []string `json:"illustratorIds,omitempty"`
	PublisherIDs   []string `json:"publisherIds,omitempty"`
	DeveloperIDs   []string `json:"developerIds,omitempty"`
	PlatformIDs    []string `json:"platformIds,omitempty"`
}

func BuildExtendedResponse(data interface{}, total int64, params QueryParams) ExtendedPaginatedResponse {
	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize > 0 {
		totalPages++
	}

	return ExtendedPaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
		Filters: FilterInfo{
			SortBy:          params.SortBy,
			Order:           params.Order,
			Search:          params.Search,
			GenreIDs:        params.GenreIDs,
			ThemeIDs:        params.ThemeIDs,
			GenreMode:       params.GenreMode,
			ThemeMode:       params.ThemeMode,
			ExcludeGenreIDs: params.ExcludeGenreIDs,
			ExcludeThemeIDs: params.ExcludeThemeIDs,
			Year:           params.Year,
			YearFrom:       params.YearFrom,
			YearTo:         params.YearTo,
			MinRating:      params.MinRating,
			MaxRating:      params.MaxRating,
			AgeRatings:     params.AgeRatings,
			Countries:      params.Countries,
			StudioIDs:      params.StudioIDs,
			AuthorIDs:      params.AuthorIDs,
			IllustratorIDs: params.IllustratorIDs,
			PublisherIDs:   params.PublisherIDs,
			DeveloperIDs:   params.DeveloperIDs,
			PlatformIDs:    params.PlatformIDs,
		},
	}
}

// genreAndThemeJoinTables задаёт для каждого типа медиа таблицы связей many2many с жанрами и темами.
// В фильтрах отображаются только те жанры/темы, которые привязаны хотя бы к одному контенту этого типа
// (при добавлении контента с жанром он автоматически появляется в фильтрах для этого типа).
var genreAndThemeJoinTables = map[string]struct {
	GenreJoin string
	ThemeJoin string
}{
	models.EntityTypeMovie:         {"movie_genres", "movie_themes"},
	models.EntityTypeTVSeries:      {"tvseries_genres", "tvseries_themes"},
	models.EntityTypeAnimeSeries:   {"animeseries_genres", "animeseries_themes"},
	models.EntityTypeCartoonSeries: {"cartoonseries_genres", "cartoonseries_themes"},
	models.EntityTypeCartoonMovie:  {"cartoonmovie_genres", "cartoonmovie_themes"},
	models.EntityTypeAnimeMovie:    {"animemovie_genres", "animemovie_themes"},
	models.EntityTypeManga:         {"manga_genres", "manga_themes"},
	models.EntityTypeGame:          {"game_genres", "game_themes"},
	models.EntityTypeBook:          {"book_genres", "book_themes"},
	models.EntityTypeLightNovel:    {"lightnovel_genres", "lightnovel_themes"},
}

func GetAvailableFilters(db *gorm.DB, entityType string) map[string]interface{} {
	filters := map[string]interface{}{
		"sortOptions":  []string{"created_at", "updated_at", "title", "rating", "release_date", "popularity"},
		"orderOptions": []string{"ASC", "DESC"},
		"genreModes":   []string{"or", "and"},
		"themeModes":   []string{"or", "and"},
	}

	tables, ok := genreAndThemeJoinTables[entityType]
	if ok {
		var genreIDs []uint
		db.Table(tables.GenreJoin).Distinct("genre_id").Pluck("genre_id", &genreIDs)
		var genres []models.Genre
		if len(genreIDs) > 0 {
			db.Where("id IN ?", genreIDs).Order("id").Find(&genres)
		}
		filters["genres"] = genres

		var themeIDs []uint
		db.Table(tables.ThemeJoin).Distinct("theme_id").Pluck("theme_id", &themeIDs)
		var themes []models.Theme
		if len(themeIDs) > 0 {
			db.Where("id IN ?", themeIDs).Order("id").Find(&themes)
		}
		filters["themes"] = themes
	} else {
		var genres []models.Genre
		db.Find(&genres)
		filters["genres"] = genres
		var themes []models.Theme
		db.Find(&themes)
		filters["themes"] = themes
	}

	filters["ageRatings"] = []string{"g", "pg", "pg13", "r", "nc17", "nc21", "tvY", "tvY7", "tvG", "tvPg", "tv14", "tvMa"}

	return filters
}
