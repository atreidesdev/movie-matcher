package handlers

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

// Множество entity_id уже в списках/избранном пользователя — не добавлять в сохранённые рекомендации.
func getUserListedEntityIDs(db *gorm.DB, userID uint, mediaType string) map[uint]struct{} {
	out := make(map[uint]struct{})
	switch mediaType {
	case "movie":
		var ids []uint
		db.Model(&models.MovieList{}).Where("user_id = ?", userID).Pluck("movie_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.MovieReview{}).Where("user_id = ?", userID).Pluck("movie_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.MovieFavorite{}).Where("user_id = ?", userID).Pluck("movie_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "anime", "animeSeries":
		var ids []uint
		db.Model(&models.AnimeSeriesList{}).Where("user_id = ?", userID).Pluck("anime_series_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.AnimeSeriesFavorite{}).Where("user_id = ?", userID).Pluck("anime_series_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "tvSeries":
		var ids []uint
		db.Model(&models.TVSeriesList{}).Where("user_id = ?", userID).Pluck("tv_series_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.TVSeriesFavorite{}).Where("user_id = ?", userID).Pluck("tv_series_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "game":
		var ids []uint
		db.Model(&models.GameList{}).Where("user_id = ?", userID).Pluck("game_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.GameFavorite{}).Where("user_id = ?", userID).Pluck("game_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "manga":
		var ids []uint
		db.Model(&models.MangaList{}).Where("user_id = ?", userID).Pluck("manga_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.MangaFavorite{}).Where("user_id = ?", userID).Pluck("manga_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "book":
		var ids []uint
		db.Model(&models.BookList{}).Where("user_id = ?", userID).Pluck("book_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.BookFavorite{}).Where("user_id = ?", userID).Pluck("book_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "lightNovel":
		var ids []uint
		db.Model(&models.LightNovelList{}).Where("user_id = ?", userID).Pluck("light_novel_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.LightNovelFavorite{}).Where("user_id = ?", userID).Pluck("light_novel_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "cartoonSeries":
		var ids []uint
		db.Model(&models.CartoonSeriesList{}).Where("user_id = ?", userID).Pluck("cartoon_series_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.CartoonSeriesFavorite{}).Where("user_id = ?", userID).Pluck("cartoon_series_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "cartoonMovie":
		var ids []uint
		db.Model(&models.CartoonMovieList{}).Where("user_id = ?", userID).Pluck("cartoon_movie_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.CartoonMovieFavorite{}).Where("user_id = ?", userID).Pluck("cartoon_movie_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	case "animeMovie":
		var ids []uint
		db.Model(&models.AnimeMovieList{}).Where("user_id = ?", userID).Pluck("anime_movie_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
		db.Model(&models.AnimeMovieFavorite{}).Where("user_id = ?", userID).Pluck("anime_movie_id", &ids)
		for _, id := range ids {
			out[id] = struct{}{}
		}
	}
	return out
}

// apiMediaTypeToEntityType — маппинг API mediaType в entity_type для БД (как в content_similar).
func apiMediaTypeToEntityType(mediaType string) string {
	switch mediaType {
	case "movie":
		return "movie"
	case "anime", "animeSeries":
		return "anime_series"
	case "tvSeries":
		return "tv_series"
	case "game":
		return "game"
	case "manga":
		return "manga"
	case "book":
		return "book"
	case "lightNovel":
		return "light_novel"
	case "cartoonSeries":
		return "cartoon_series"
	case "cartoonMovie":
		return "cartoon_movie"
	case "animeMovie":
		return "anime_movie"
	default:
		return mediaType
	}
}
