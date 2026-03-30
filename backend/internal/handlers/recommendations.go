package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/queue"
	"github.com/movie-matcher/backend/internal/services"
	"gorm.io/gorm"
)

type SimilarUserListRating struct {
	UserID          uint     `json:"userId"`
	Username        *string  `json:"username,omitempty"`
	Name            *string  `json:"name,omitempty"`
	Avatar          *string  `json:"avatar,omitempty"`
	SimilarityScore float64  `json:"similarityScore"` // 0–1, на фронте показывать в %
	Rating          int      `json:"rating"`          // оценка из list item (1–100)
}

// Тайтлы, уже в списках пользователя, отфильтровываются; отфильтрованный список пишется в user_recommendations.
func GetRecommendations(c *gin.Context) {
	userID, _ := c.Get("userID")
	mediaType := c.DefaultQuery("mediaType", "movie")
	limitStr := c.DefaultQuery("limit", "10")

	uid := userID.(uint)
	limitInt, err := strconv.Atoi(limitStr)
	if err != nil || limitInt <= 0 {
		limitInt = 10
	}

	db := deps.GetDB(c)
	entityType := apiMediaTypeToEntityType(mediaType)

	// Попробуем прочитать готовые рекомендации из БД.
	var cached []models.UserRecommendation
	if cacheErr := db.Where("user_id = ? AND entity_type = ?", uid, entityType).
		Order("position ASC").
		Limit(limitInt * 2).
		Find(&cached).Error; cacheErr == nil && len(cached) > 0 {
		// Если данные для старых записей неполные — считаем кеш "пустым" и пересчитываем.
		hasDetails := false
		for _, r := range cached {
			if r.Title != "" || r.Poster != "" || r.Description != "" {
				hasDetails = true
				break
			}
		}
		if hasDetails {
			listed := getUserListedEntityIDs(db, uid, mediaType)
			out := make([]services.RecommendedItem, 0, len(cached))
			for _, r := range cached {
				if _, inList := listed[r.EntityID]; inList {
					continue
				}
				out = append(out, services.RecommendedItem{
					MediaID:     r.EntityID,
					Title:       r.Title,
					Score:       r.Score,
					Poster:      r.Poster,
					Description: r.Description,
				})
				if len(out) >= limitInt {
					break
				}
			}
			c.JSON(http.StatusOK, services.RecommendationResponse{
				Recommendations: out,
				UserID:          uid,
				MediaType:       mediaType,
			})
			return
		}
	}

	// Кеш пустой/неполный: строго не пересчитываем по запросу.
	c.JSON(http.StatusOK, services.RecommendationResponse{
		Recommendations: []services.RecommendedItem{},
		UserID:          uid,
		MediaType:       mediaType,
	})
	return
}

func GetSimilarMedia(c *gin.Context) {
	mediaID := c.Param("mediaId")
	mediaType := c.Param("mediaType")
	limit := c.DefaultQuery("limit", "10")

	q := deps.GetQueue(c)
	res, err := q.Submit(c.Request.Context(), queue.Job{
		Fn: func() (interface{}, error) {
			return services.GetSimilarMedia(mediaID, mediaType, limit)
		},
	})
	if err != nil {
		if err == c.Request.Context().Err() {
			api.RespondError(c, http.StatusRequestTimeout, api.ErrCodeBadRequest, "Request cancelled or timeout", nil)
			return
		}
		api.RespondInternal(c, "Failed to get similar media")
		return
	}
	if res.Err != nil {
		api.RespondInternal(c, "Failed to get similar media")
		return
	}

	c.JSON(http.StatusOK, res.Data)
}

type SimilarUserEnriched struct {
	UserID   uint    `json:"userId"`
	Score    float64 `json:"score"`
	Username *string `json:"username,omitempty"`
	Name     *string `json:"name,omitempty"`
	Avatar   *string `json:"avatar,omitempty"`
}

func GetSimilarUsers(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid := userID.(uint)
	limitStr := c.DefaultQuery("limit", "20")
	limitInt, err := strconv.Atoi(limitStr)
	if err != nil || limitInt <= 0 {
		limitInt = 20
	}

	db := deps.GetDB(c)
	var cached []models.UserSimilarUser
	if cacheErr := db.Where("user_id = ?", uid).
		Order("position ASC").
		Limit(limitInt).
		Find(&cached).Error; cacheErr == nil && len(cached) > 0 {
		ids := make([]uint, 0, len(cached))
		for _, row := range cached {
			ids = append(ids, row.SimilarUserID)
		}

		var users []models.User
		if err := db.Where("id IN ?", ids).Find(&users).Error; err != nil {
			api.RespondInternal(c, "Failed to load users")
			return
		}
		userByID := make(map[uint]models.User)
		for _, u := range users {
			userByID[u.ID] = u
		}

		out := make([]SimilarUserEnriched, 0, len(cached))
		for _, row := range cached {
			u, ok := userByID[row.SimilarUserID]
			if !ok {
				continue
			}
			out = append(out, SimilarUserEnriched{
				UserID:   row.SimilarUserID,
				Score:    row.Score,
				Username: u.Username,
				Name:     u.Name,
				Avatar:   u.Avatar,
			})
		}
		c.JSON(http.StatusOK, gin.H{"similarUsers": out})
		return
	}

	// Кеш пустой: строго не пересчитываем по запросу.
	c.JSON(http.StatusOK, gin.H{"similarUsers": []SimilarUserEnriched{}})
	return
}

// GET /api/v1/media/:type/:id/similar-users-ratings (OptionalAuth). Без авторизации — пустой массив.
func GetMediaListRatingsFromSimilarUsers(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusOK, []SimilarUserListRating{})
		return
	}
	uid := userIDVal.(uint)
	mediaType := c.Param("type")
	entityIDStr := c.Param("id")
	entityID, err := strconv.ParseUint(entityIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid entity ID", nil)
		return
	}
	id := uint(entityID)

	db := deps.GetDB(c)
	const (
		desiredSimilarLimit = 30
		answerLimit         = 5
	)

	var cached []models.UserSimilarUser
	if err := db.Where("user_id = ?", uid).
		Order("position ASC").
		Limit(desiredSimilarLimit).
		Find(&cached).Error; err != nil || len(cached) == 0 {
		c.JSON(http.StatusOK, []SimilarUserListRating{})
		return
	}

	type ratingRow struct {
		UserID   uint
		Rating   int
		Similarity float64
	}
	ratingRows := make([]ratingRow, 0, answerLimit)

	// Идём от самого похожего к менее похожему и добавляем rating,
	// пока не наберём ровно 5 или пока не закончатся top-30.
	for _, srow := range cached {
		if len(ratingRows) >= answerLimit {
			break
		}

		simScore := srow.Score
		otherUserID := srow.SimilarUserID

		switch mediaType {
		case "movies":
			var l models.MovieList
			if e := db.Where("movie_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "tv-series":
			var l models.TVSeriesList
			if e := db.Where("tv_series_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "cartoon-series":
			var l models.CartoonSeriesList
			if e := db.Where("cartoon_series_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "cartoon-movies":
			var l models.CartoonMovieList
			if e := db.Where("cartoon_movie_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "anime":
			var l models.AnimeSeriesList
			if e := db.Where("anime_series_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "anime-movies":
			var l models.AnimeMovieList
			if e := db.Where("anime_movie_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "games":
			var l models.GameList
			if e := db.Where("game_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "manga":
			var l models.MangaList
			if e := db.Where("manga_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "books":
			var l models.BookList
			if e := db.Where("book_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		case "light-novels":
			var l models.LightNovelList
			if e := db.Where("light_novel_id = ? AND user_id = ? AND rating IS NOT NULL", id, otherUserID).First(&l).Error; e != nil {
				if errors.Is(e, gorm.ErrRecordNotFound) {
					continue
				}
				api.RespondInternal(c, "Failed to fetch list rating")
				return
			}
			if l.Rating != nil {
				ratingRows = append(ratingRows, ratingRow{UserID: otherUserID, Rating: *l.Rating, Similarity: simScore})
			}
		default:
			c.JSON(http.StatusOK, []SimilarUserListRating{})
			return
		}
	}

	if len(ratingRows) == 0 {
		c.JSON(http.StatusOK, []SimilarUserListRating{})
		return
	}

	userIDs := make([]uint, 0, len(ratingRows))
	seen := make(map[uint]struct{}, len(ratingRows))
	for _, r := range ratingRows {
		if _, ok := seen[r.UserID]; ok {
			continue
		}
		seen[r.UserID] = struct{}{}
		userIDs = append(userIDs, r.UserID)
	}

	var users []models.User
	if err := db.Where("id IN ?", userIDs).Find(&users).Error; err != nil {
		api.RespondInternal(c, "Failed to load users")
		return
	}
	userByID := make(map[uint]models.User, len(users))
	for _, u := range users {
		userByID[u.ID] = u
	}

	out := make([]SimilarUserListRating, 0, len(ratingRows))
	for _, r := range ratingRows {
		u, ok := userByID[r.UserID]
		if !ok {
			continue
		}
		out = append(out, SimilarUserListRating{
			UserID:          r.UserID,
			Username:        u.Username,
			Name:            u.Name,
			Avatar:          u.Avatar,
			SimilarityScore: r.Similarity,
			Rating:          r.Rating,
		})
	}
	c.JSON(http.StatusOK, out)
}

func mapKeys[M ~map[uint]float64](m M) []uint {
	keys := make([]uint, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
