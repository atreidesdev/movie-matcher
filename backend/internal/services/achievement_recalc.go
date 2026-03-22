package services

import (
	"log/slog"

	"github.com/movie-matcher/backend/internal/database"
	"github.com/movie-matcher/backend/internal/repository"
	"gorm.io/gorm"
)

// listTables — таблицы списков (user_id есть в каждой). Кэш прогресса считаем только для пользователей, у которых есть хотя бы одна запись.
var listTables = []string{
	"movie_lists", "tv_series_lists", "anime_series_lists", "cartoon_series_lists",
	"cartoon_movie_lists", "anime_movie_lists", "manga_lists", "game_lists",
	"book_lists", "light_novel_lists",
}

// Только пользователи с хотя бы одной записью в списках — кэш не раздувается на неактивных.
func getActiveUserIDs(db *gorm.DB) ([]uint, error) {
	if len(listTables) == 0 {
		return nil, nil
	}
	query := "SELECT DISTINCT user_id FROM ("
	for i, t := range listTables {
		if i > 0 {
			query += " UNION "
		}
		query += "SELECT user_id FROM " + t
	}
	query += ") u"
	var ids []uint
	if err := db.Raw(query).Pluck("user_id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

// RecalculateAllUsersAchievementProgress пересчитывает прогресс по ачивкам только для «активных» пользователей
// (у кого есть записи в списках) и сохраняет в user_achievement_progress. Остальные при запросе получают расчёт на лету — кэш остаётся ограниченным.
func RecalculateAllUsersAchievementProgress(db *gorm.DB) error {
	if db == nil {
		db = database.DB
	}
	achievements, err := repository.ListAchievements(db)
	if err != nil {
		return err
	}
	userIDs, err := getActiveUserIDs(db)
	if err != nil {
		return err
	}
	slog.Default().Info("achievement recalc started", slog.Int("activeUsers", len(userIDs)), slog.Int("achievements", len(achievements)))
	for _, userID := range userIDs {
		for i := range achievements {
			prog, err := repository.GetAchievementProgress(db, userID, &achievements[i])
			if err != nil {
				continue
			}
			if err := repository.UpsertUserAchievementProgress(db, userID, achievements[i].ID, prog); err != nil {
				slog.Default().Error("achievement progress upsert failed", slog.Uint64("userID", uint64(userID)), slog.Uint64("achievementID", uint64(achievements[i].ID)), slog.String("error", err.Error()))
			}
		}
	}
	slog.Default().Info("achievement recalc completed")
	return nil
}
