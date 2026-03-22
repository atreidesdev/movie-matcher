package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

// pathMediaTypeToModel maps frontend path segment to backend MediaType.
var pathMediaTypeToModel = map[string]models.MediaType{
	"movie":           models.MediaTypeMovie,
	"tv-series":       models.MediaTypeTVSeries,
	"anime":           models.MediaTypeAnimeSeries,
	"anime-movies":    models.MediaTypeAnimeMovie,
	"cartoon-series":  models.MediaTypeCartoonSeries,
	"cartoon-movies":  models.MediaTypeCartoonMovie,
	"game":            models.MediaTypeGame,
	"manga":           models.MediaTypeManga,
	"book":            models.MediaTypeBook,
	"light-novel":     models.MediaTypeLightNovel,
}

// modelMediaTypeToPath maps backend MediaType to frontend path segment.
var modelMediaTypeToPath = map[models.MediaType]string{
	models.MediaTypeMovie:         "movies",
	models.MediaTypeTVSeries:      "tv-series",
	models.MediaTypeAnimeSeries:   "anime",
	models.MediaTypeAnimeMovie:    "anime-movies",
	models.MediaTypeCartoonSeries: "cartoon-series",
	models.MediaTypeCartoonMovie:  "cartoon-movies",
	models.MediaTypeGame:          "games",
	models.MediaTypeManga:         "manga",
	models.MediaTypeBook:          "books",
	models.MediaTypeLightNovel:    "light-novels",
}

// inverseRelationType returns the relation from the "other" media's perspective (for bidirectional display).
func inverseRelationType(rel models.MediaRelationType) models.MediaRelationType {
	switch rel {
	case models.MediaRelationSequel:
		return models.MediaRelationPrequel
	case models.MediaRelationPrequel:
		return models.MediaRelationSequel
	default:
		return rel
	}
}

type FranchiseLinkResponse struct {
	ID                 uint                   `json:"id"`
	FranchiseID        uint                   `json:"franchiseId"`
	FranchiseName      string                 `json:"franchiseName"`
	FranchiseNameI18n  models.LocalizedString `json:"franchiseNameI18n,omitempty"`
	RelationType       string                 `json:"relationType"`
	RelatedType        string                 `json:"relatedType"`
	RelatedMediaID     uint                   `json:"relatedMediaId"`
	RelatedTitle       string                 `json:"relatedTitle"`
	RelatedTitleI18n   models.LocalizedString `json:"relatedTitleI18n,omitempty"`
	RelatedPoster      *string                `json:"relatedPoster,omitempty"`
	RelatedRating      *float64               `json:"relatedRating,omitempty"`
	ListStatus         *models.ListStatus     `json:"listStatus,omitempty"`
}

// GetFranchises godoc
// @Summary  Get franchises list
// @Tags     Franchises
// @Param    page      query  int  false  "Page"  default(1)
// @Param    pageSize  query  int  false  "Page size"  default(20)
// @Success  200  {object}  PaginatedResponse
// @Router   /franchises [get]
func GetFranchises(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	db := deps.GetDB(c)
	var franchises []models.Franchise
	var total int64

	db.Model(&models.Franchise{}).Count(&total)

	offset := (page - 1) * pageSize
	if err := db.Order("name ASC").
		Offset(offset).Limit(pageSize).
		Find(&franchises).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch franchises")
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, PaginatedResponse{
		Data:       franchises,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// GetFranchise godoc
// @Summary  Get franchise by ID
// @Tags     Franchises
// @Param    id   path  int  true  "Franchise ID"
// @Success  200  {object}  models.Franchise
// @Router   /franchises/{id} [get]
func GetFranchise(c *gin.Context) {
	id := c.Param("id")
	db := deps.GetDB(c)

	var franchise models.Franchise
	if err := db.Preload("Links").First(&franchise, id).Error; err != nil {
		api.RespondNotFound(c, "Franchise not found")
		return
	}

	c.JSON(http.StatusOK, franchise)
}

// SearchFranchises godoc
// @Summary  Search franchises
// @Tags     Franchises
// @Param    q  query  string  true  "Search query"
// @Success  200  {array}  models.Franchise
// @Router   /franchises/search [get]
func SearchFranchises(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}

	var franchises []models.Franchise
	searchQuery := "%" + query + "%"

	db := deps.GetDB(c)
	if err := db.Where("name ILIKE ? OR description ILIKE ?", searchQuery, searchQuery).
		Limit(20).Find(&franchises).Error; err != nil {
		api.RespondInternal(c, "Failed to search franchises")
		return
	}

	c.JSON(http.StatusOK, franchises)
}

// GetFranchiseMedia godoc
// @Summary  Get franchise media links
// @Tags     Franchises
// @Param    id   path  int  true  "Franchise ID"
// @Success  200  {array}  models.FranchiseMediaLink
// @Router   /franchises/{id}/media [get]
func GetFranchiseMedia(c *gin.Context) {
	id := c.Param("id")
	db := deps.GetDB(c)

	var links []models.FranchiseMediaLink
	if err := db.Where("franchise_id = ?", id).
		Order("order_number ASC NULLS LAST").
		Find(&links).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch franchise media")
		return
	}

	c.JSON(http.StatusOK, links)
}

// getMediaTitle returns the title of a media by type and id, or empty string.
func getMediaTitle(db *gorm.DB, mediaType models.MediaType, mediaID uint) string {
	title, _ := getMediaTitleAndI18n(db, mediaType, mediaID)
	return title
}

// getMediaTitleAndI18n returns title and titleI18n for a media by type and id.
func getMediaTitleAndI18n(db *gorm.DB, mediaType models.MediaType, mediaID uint) (string, models.LocalizedString) {
	var title string
	var i18n models.LocalizedString
	switch mediaType {
	case models.MediaTypeMovie:
		var m models.Movie
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeTVSeries:
		var m models.TVSeries
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeAnimeSeries:
		var m models.AnimeSeries
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeAnimeMovie:
		var m models.AnimeMovie
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeCartoonSeries:
		var m models.CartoonSeries
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeCartoonMovie:
		var m models.CartoonMovie
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeGame:
		var m models.Game
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeManga:
		var m models.Manga
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeBook:
		var m models.Book
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	case models.MediaTypeLightNovel:
		var m models.LightNovel
		if db.First(&m, mediaID).Error == nil {
			title = m.Title
			if m.TitleI18n != nil {
				i18n = *m.TitleI18n
			}
		}
	}
	return title, i18n
}

// getMediaPosterAndRating returns poster and rating for a media by type and id.
func getMediaPosterAndRating(db *gorm.DB, mediaType models.MediaType, mediaID uint) (*string, *float64) {
	var poster *string
	var rating *float64
	switch mediaType {
	case models.MediaTypeMovie:
		var m models.Movie
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeTVSeries:
		var m models.TVSeries
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeAnimeSeries:
		var m models.AnimeSeries
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeAnimeMovie:
		var m models.AnimeMovie
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeCartoonSeries:
		var m models.CartoonSeries
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeCartoonMovie:
		var m models.CartoonMovie
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeGame:
		var m models.Game
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeManga:
		var m models.Manga
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeBook:
		var m models.Book
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	case models.MediaTypeLightNovel:
		var m models.LightNovel
		if db.Select("Poster", "Rating").First(&m, mediaID).Error == nil {
			poster, rating = m.Poster, m.Rating
		}
	}
	return poster, rating
}

// getMediaListStatusForUser returns the user's list status for the given media, or nil if not in list.
func getMediaListStatusForUser(db *gorm.DB, userID uint, mediaType models.MediaType, mediaID uint) *models.ListStatus {
	var status models.ListStatus
	var found bool
	switch mediaType {
	case models.MediaTypeMovie:
		var l models.MovieList
		found = db.Where("user_id = ? AND movie_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeTVSeries:
		var l models.TVSeriesList
		found = db.Where("user_id = ? AND tv_series_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeAnimeSeries:
		var l models.AnimeSeriesList
		found = db.Where("user_id = ? AND anime_series_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeAnimeMovie:
		var l models.AnimeMovieList
		found = db.Where("user_id = ? AND anime_movie_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeCartoonSeries:
		var l models.CartoonSeriesList
		found = db.Where("user_id = ? AND cartoon_series_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeCartoonMovie:
		var l models.CartoonMovieList
		found = db.Where("user_id = ? AND cartoon_movie_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeGame:
		var l models.GameList
		found = db.Where("user_id = ? AND game_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeManga:
		var l models.MangaList
		found = db.Where("user_id = ? AND manga_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeBook:
		var l models.BookList
		found = db.Where("user_id = ? AND book_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	case models.MediaTypeLightNovel:
		var l models.LightNovelList
		found = db.Where("user_id = ? AND light_novel_id = ?", userID, mediaID).Select("status").First(&l).Error == nil
		if found {
			status = l.Status
		}
	}
	if !found {
		return nil
	}
	return &status
}

// GET /franchises/by-media?mediaType=movie&mediaId=1
func GetFranchiseLinksByMedia(c *gin.Context) {
	pathType := c.Query("mediaType")
	mediaIDStr := c.Query("mediaId")
	if pathType == "" || mediaIDStr == "" {
		api.RespondBadRequest(c, "mediaType and mediaId required", nil)
		return
	}
	mediaID, err := strconv.ParseUint(mediaIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid mediaId", nil)
		return
	}
	t, ok := pathMediaTypeToModel[pathType]
	if !ok {
		api.RespondBadRequest(c, "Unknown mediaType", nil)
		return
	}

	db := deps.GetDB(c)
	var links []models.FranchiseMediaLink
	if err := db.Where("(from_media_type = ? AND from_media_id = ?) OR (to_media_type = ? AND to_media_id = ?)", t, mediaID, t, mediaID).
		Preload("Franchise").
		Order("order_number ASC NULLS LAST").
		Find(&links).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch franchise links")
		return
	}

	resp := make([]FranchiseLinkResponse, 0, len(links))
	for _, link := range links {
		var otherType models.MediaType
		var otherID uint
		fromCurrentMedia := link.FromMediaType == t && link.FromMediaID == uint(mediaID)
		if fromCurrentMedia {
			otherType = link.ToMediaType
			otherID = link.ToMediaID
		} else {
			otherType = link.FromMediaType
			otherID = link.FromMediaID
		}
		relationForView := link.RelationType
		if !fromCurrentMedia {
			relationForView = inverseRelationType(link.RelationType)
		}
		franchiseName := ""
		var franchiseNameI18n models.LocalizedString
		if link.Franchise.ID != 0 {
			franchiseName = link.Franchise.Name
			if link.Franchise.NameI18n != nil {
				franchiseNameI18n = *link.Franchise.NameI18n
			}
		}
		relatedTitle, relatedTitleI18n := getMediaTitleAndI18n(db, otherType, otherID)
		relatedPoster, relatedRating := getMediaPosterAndRating(db, otherType, otherID)
		var listStatus *models.ListStatus
		if userIDVal, ok := c.Get("userID"); ok {
			listStatus = getMediaListStatusForUser(db, userIDVal.(uint), otherType, otherID)
		}
		resp = append(resp, FranchiseLinkResponse{
			ID:                link.ID,
			FranchiseID:       link.FranchiseID,
			FranchiseName:     franchiseName,
			FranchiseNameI18n: franchiseNameI18n,
			RelationType:      string(relationForView),
			RelatedType:       modelMediaTypeToPath[otherType],
			RelatedMediaID:    otherID,
			RelatedTitle:      relatedTitle,
			RelatedTitleI18n:  relatedTitleI18n,
			RelatedPoster:     relatedPoster,
			RelatedRating:     relatedRating,
			ListStatus:        listStatus,
		})
	}
	c.JSON(http.StatusOK, resp)
}
