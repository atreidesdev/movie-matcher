package handlers

import (
	"net/http"
	"sort"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/queue"
	"github.com/movie-matcher/backend/internal/services"
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
	limit := c.DefaultQuery("limit", "10")

	uid := userID.(uint)
	q := deps.GetQueue(c)
	res, err := q.Submit(c.Request.Context(), queue.Job{
		Fn: func() (interface{}, error) {
			return services.GetRecommendations(uid, mediaType, limit)
		},
	})
	if err != nil {
		if err == c.Request.Context().Err() {
			api.RespondError(c, http.StatusRequestTimeout, api.ErrCodeBadRequest, "Request cancelled or timeout", nil)
			return
		}
		api.RespondInternal(c, "Failed to get recommendations")
		return
	}
	if res.Err != nil {
		api.RespondInternal(c, "Failed to get recommendations")
		return
	}

	recResp, _ := res.Data.(*services.RecommendationResponse)
	if recResp == nil || len(recResp.Recommendations) == 0 {
		c.JSON(http.StatusOK, res.Data)
		return
	}

	db := deps.GetDB(c)
	listed := getUserListedEntityIDs(db, uid, mediaType)
	var filtered []services.RecommendedItem
	for _, r := range recResp.Recommendations {
		if _, inList := listed[r.MediaID]; inList {
			continue
		}
		filtered = append(filtered, r)
	}
	recResp.Recommendations = filtered

	entityType := apiMediaTypeToEntityType(mediaType)
	_ = db.Where("user_id = ? AND entity_type = ?", uid, entityType).Delete(&models.UserRecommendation{}).Error
	for i, r := range filtered {
		rec := models.UserRecommendation{
			UserID:     uid,
			EntityType: entityType,
			EntityID:   r.MediaID,
			Score:      r.Score,
			Position:   i + 1,
		}
		_ = db.Create(&rec).Error
	}

	c.JSON(http.StatusOK, recResp)
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
	limit := c.DefaultQuery("limit", "20")

	q := deps.GetQueue(c)
	res, err := q.Submit(c.Request.Context(), queue.Job{
		Fn: func() (interface{}, error) {
			return services.GetSimilarUsers(uid, limit)
		},
	})
	if err != nil {
		if err == c.Request.Context().Err() {
			api.RespondError(c, http.StatusRequestTimeout, api.ErrCodeBadRequest, "Request cancelled or timeout", nil)
			return
		}
		api.RespondInternal(c, "Failed to get similar users")
		return
	}
	if res.Err != nil {
		api.RespondInternal(c, "Failed to get similar users")
		return
	}

	recResp, _ := res.Data.(*services.SimilarUsersResponse)
	if recResp == nil || len(recResp.SimilarUsers) == 0 {
		c.JSON(http.StatusOK, gin.H{"similarUsers": []SimilarUserEnriched{}})
		return
	}

	db := deps.GetDB(c)
	ids := make([]uint, 0, len(recResp.SimilarUsers))
	for _, u := range recResp.SimilarUsers {
		ids = append(ids, u.UserID)
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

	out := make([]SimilarUserEnriched, 0, len(recResp.SimilarUsers))
	for _, item := range recResp.SimilarUsers {
		u, ok := userByID[item.UserID]
		if !ok {
			continue
		}
		out = append(out, SimilarUserEnriched{
			UserID:   item.UserID,
			Score:    item.Score,
			Username: u.Username,
			Name:     u.Name,
			Avatar:   u.Avatar,
		})
	}
	c.JSON(http.StatusOK, gin.H{"similarUsers": out})
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

	q := deps.GetQueue(c)
	res, err := q.Submit(c.Request.Context(), queue.Job{
		Fn: func() (interface{}, error) {
			return services.GetSimilarUsers(uid, "30")
		},
	})
	if err != nil {
		if err == c.Request.Context().Err() {
			api.RespondError(c, http.StatusRequestTimeout, api.ErrCodeBadRequest, "Request cancelled or timeout", nil)
			return
		}
		api.RespondInternal(c, "Failed to get similar users")
		return
	}
	if res.Err != nil {
		api.RespondInternal(c, "Failed to get similar users")
		return
	}
	similarResp, _ := res.Data.(*services.SimilarUsersResponse)
	scoreByUser := make(map[uint]float64)
	if similarResp != nil {
		for _, u := range similarResp.SimilarUsers {
			scoreByUser[u.UserID] = u.Score
		}
	}
	if len(scoreByUser) == 0 {
		c.JSON(http.StatusOK, []SimilarUserListRating{})
		return
	}

	db := deps.GetDB(c)
	const limit = 20

	type row struct {
		UserID uint
		Rating int
	}
	var rows []row

	switch mediaType {
	case "movies":
		var list []models.MovieList
		if e := db.Where("movie_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "tv-series":
		var list []models.TVSeriesList
		if e := db.Where("tv_series_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "cartoon-series":
		var list []models.CartoonSeriesList
		if e := db.Where("cartoon_series_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "cartoon-movies":
		var list []models.CartoonMovieList
		if e := db.Where("cartoon_movie_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "anime":
		var list []models.AnimeSeriesList
		if e := db.Where("anime_series_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "anime-movies":
		var list []models.AnimeMovieList
		if e := db.Where("anime_movie_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "games":
		var list []models.GameList
		if e := db.Where("game_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "manga":
		var list []models.MangaList
		if e := db.Where("manga_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "books":
		var list []models.BookList
		if e := db.Where("book_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	case "light-novels":
		var list []models.LightNovelList
		if e := db.Where("light_novel_id = ? AND user_id IN ? AND rating IS NOT NULL", id, mapKeys(scoreByUser)).Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch list ratings")
			return
		}
		for _, l := range list {
			if l.Rating != nil {
				rows = append(rows, row{UserID: l.UserID, Rating: *l.Rating})
			}
		}
	default:
		c.JSON(http.StatusOK, []SimilarUserListRating{})
		return
	}

	userIDs := make([]uint, 0, len(rows))
	for _, r := range rows {
		userIDs = append(userIDs, r.UserID)
	}
	var users []models.User
	if err := db.Where("id IN ?", userIDs).Find(&users).Error; err != nil {
		api.RespondInternal(c, "Failed to load users")
		return
	}
	userByID := make(map[uint]models.User)
	for _, u := range users {
		userByID[u.ID] = u
	}

	out := make([]SimilarUserListRating, 0, len(rows))
	for _, r := range rows {
		score, ok := scoreByUser[r.UserID]
		if !ok {
			continue
		}
		u := userByID[r.UserID]
		out = append(out, SimilarUserListRating{
			UserID:          r.UserID,
			Username:        u.Username,
			Name:            u.Name,
			Avatar:          u.Avatar,
			SimilarityScore: score,
			Rating:          r.Rating,
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].SimilarityScore > out[j].SimilarityScore })
	c.JSON(http.StatusOK, out)
}

func mapKeys[M ~map[uint]float64](m M) []uint {
	keys := make([]uint, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
