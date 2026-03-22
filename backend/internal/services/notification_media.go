package services

import (
	"fmt"

	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

const (
	MediaTypeMovie         = "movie"
	MediaTypeTVSeries      = "tv_series"
	MediaTypeAnimeSeries   = "anime_series"
	MediaTypeCartoonSeries = "cartoon_series"
	MediaTypeCartoonMovie  = "cartoon_movie"
	MediaTypeAnimeMovie    = "anime_movie"
	MediaTypeGame          = "game"
	MediaTypeManga         = "manga"
	MediaTypeBook          = "book"
	MediaTypeLightNovel    = "light_novel"
)

func GetUserIDsWithMediaInList(db *gorm.DB, mediaType string, mediaID uint) ([]uint, error) {
	var userIDs []uint
	var err error
	switch mediaType {
	case MediaTypeMovie:
		err = db.Model(&models.MovieList{}).Where("movie_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeTVSeries:
		err = db.Model(&models.TVSeriesList{}).Where("tv_series_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeAnimeSeries:
		err = db.Model(&models.AnimeSeriesList{}).Where("anime_series_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeCartoonSeries:
		err = db.Model(&models.CartoonSeriesList{}).Where("cartoon_series_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeCartoonMovie:
		err = db.Model(&models.CartoonMovieList{}).Where("cartoon_movie_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeAnimeMovie:
		err = db.Model(&models.AnimeMovieList{}).Where("anime_movie_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeGame:
		err = db.Model(&models.GameList{}).Where("game_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeManga:
		err = db.Model(&models.MangaList{}).Where("manga_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeBook:
		err = db.Model(&models.BookList{}).Where("book_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	case MediaTypeLightNovel:
		err = db.Model(&models.LightNovelList{}).Where("light_novel_id = ?", mediaID).Distinct("user_id").Pluck("user_id", &userIDs).Error
	default:
		return nil, fmt.Errorf("unsupported media type for list: %s", mediaType)
	}
	if err != nil {
		return nil, err
	}
	return userIDs, nil
}

// extra может содержать: reason (status_change | release_date), mediaType, mediaId, newStatus, releaseDate.
func NotifyMediaUpdate(db *gorm.DB, mediaType string, mediaID uint, title string, body *string, extra models.JSONMap) {
	userIDs, err := GetUserIDsWithMediaInList(db, mediaType, mediaID)
	if err != nil || len(userIDs) == 0 {
		return
	}
	if extra == nil {
		extra = models.JSONMap{}
	}
	extra["mediaType"] = mediaType
	extra["mediaId"] = mediaID
	for _, uid := range userIDs {
		n := models.Notification{
			UserID:      uid,
			Type:        models.NotificationTypeMediaUpdate,
			Title:       title,
			Body:        body,
			RelatedType: mediaType,
			RelatedID:   mediaID,
			Extra:       extra,
		}
		_ = db.Create(&n).Error
		bodyStr := ""
		if body != nil {
			bodyStr = *body
		}
		go SendPushForUser(db, uid, title, bodyStr)
	}
}
