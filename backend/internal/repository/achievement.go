package repository

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// genreJoinTables — таблицы связей медиа с жанрами (для target_type=genre).
var genreJoinTables = []struct {
	JoinTable string
	ListTable string
	EntityCol string
}{
	{"movie_genres", "movie_lists", "movie_id"},
	{"tvseries_genres", "tv_series_lists", "tv_series_id"},
	{"animeseries_genres", "anime_series_lists", "anime_series_id"},
	{"cartoonseries_genres", "cartoon_series_lists", "cartoon_series_id"},
	{"cartoonmovie_genres", "cartoon_movie_lists", "cartoon_movie_id"},
	{"animemovie_genres", "anime_movie_lists", "anime_movie_id"},
	{"manga_genres", "manga_lists", "manga_id"},
	{"game_genres", "game_lists", "game_id"},
	{"book_genres", "book_lists", "book_id"},
	{"lightnovel_genres", "light_novel_lists", "light_novel_id"},
}

// mediaTypeToListTable — тип медиа (как в models.MediaType) -> таблица списка и колонка id.
var mediaTypeToListTable = map[string]struct {
	Table string
	Col   string
}{
	"movie":         {"movie_lists", "movie_id"},
	"tvSeries":      {"tv_series_lists", "tv_series_id"},
	"animeSeries":   {"anime_series_lists", "anime_series_id"},
	"cartoonSeries": {"cartoon_series_lists", "cartoon_series_id"},
	"cartoonMovie":  {"cartoon_movie_lists", "cartoon_movie_id"},
	"animeMovie":    {"anime_movie_lists", "anime_movie_id"},
	"manga":         {"manga_lists", "manga_id"},
	"game":          {"game_lists", "game_id"},
	"book":          {"book_lists", "book_id"},
	"lightNovel":    {"light_novel_lists", "light_novel_id"},
}

func ListAchievements(db *gorm.DB) ([]models.Achievement, error) {
	var list []models.Achievement
	err := db.Preload("Levels", func(q *gorm.DB) *gorm.DB { return q.Order("level_order") }).
		Preload("Genre").
		Preload("Franchise").
		Preload("Targets").
		Order("order_num, id").
		Find(&list).Error
	return list, err
}

type AchievementProgress struct {
	Total                int      `json:"total"`
	Completed            int      `json:"completed"`
	Percent              float64  `json:"percent"`
	CurrentLevel         *models.AchievementLevel `json:"currentLevel,omitempty"`
	CurrentOrder         int      `json:"currentOrder"`
	UsersReachedPercent  float64  `json:"usersReachedPercent,omitempty"` // % пользователей, достигших хотя бы текущего уровня
}

// За «просмотренное/пройденное» считаются записи в списках со статусом completed.
func GetAchievementProgress(db *gorm.DB, userID uint, a *models.Achievement) (AchievementProgress, error) {
	var total, completed int
	switch a.TargetType {
	case models.AchievementTargetGenre:
		if a.GenreID == nil {
			return AchievementProgress{}, nil
		}
		for _, t := range genreJoinTables {
			var c int64
			db.Table(t.JoinTable).Where("genre_id = ?", *a.GenreID).Count(&c)
			total += int(c)
			var u int64
			db.Table(t.ListTable).
				Joins("INNER JOIN "+t.JoinTable+" g ON g."+t.EntityCol+" = "+t.ListTable+"."+t.EntityCol+" AND g.genre_id = ?", *a.GenreID).
				Where(t.ListTable+".user_id = ? AND "+t.ListTable+".status = ?", userID, models.ListStatusCompleted).
				Count(&u)
			completed += int(u)
		}
	case models.AchievementTargetFranchise:
		if a.FranchiseID == nil {
			return AchievementProgress{}, nil
		}
		// Все пары (media_type, media_id) из связей франшизы
		type row struct {
			MediaType string
			MediaID   uint
		}
		var from []row
		db.Table("franchise_media_links").
			Select("from_media_type AS media_type, from_media_id AS media_id").
			Where("franchise_id = ?", *a.FranchiseID).
			Find(&from)
		var to []row
		db.Table("franchise_media_links").
			Select("to_media_type AS media_type, to_media_id AS media_id").
			Where("franchise_id = ?", *a.FranchiseID).
			Find(&to)
		seen := make(map[string]map[uint]bool)
		for _, r := range from {
			if seen[r.MediaType] == nil {
				seen[r.MediaType] = make(map[uint]bool)
			}
			seen[r.MediaType][r.MediaID] = true
		}
		for _, r := range to {
			if seen[r.MediaType] == nil {
				seen[r.MediaType] = make(map[uint]bool)
			}
			seen[r.MediaType][r.MediaID] = true
		}
		for mt, ids := range seen {
			total += len(ids)
			info, ok := mediaTypeToListTable[mt]
			if !ok {
				continue
			}
			for id := range ids {
				var n int64
				db.Table(info.Table).Where("user_id = ? AND status = ? AND "+info.Col+" = ?", userID, models.ListStatusCompleted, id).Limit(1).Count(&n)
				if n > 0 {
					completed++
				}
			}
		}
	case models.AchievementTargetMediaList:
		var targets []models.AchievementTargetMedia
		db.Where("achievement_id = ?", a.ID).Find(&targets)
		total = len(targets)
		for _, t := range targets {
			info, ok := mediaTypeToListTable[t.MediaType]
			if !ok {
				continue
			}
			var n int64
			db.Table(info.Table).Where("user_id = ? AND status = ? AND "+info.Col+" = ?", userID, models.ListStatusCompleted, t.MediaID).Limit(1).Count(&n)
			if n > 0 {
				completed++
			}
		}
	default:
		return AchievementProgress{}, nil
	}

	percent := 0.0
	if total > 0 {
		percent = float64(completed) / float64(total) * 100
	}

	// Текущий уровень — максимальный уровень, у которого threshold_percent <= percent
	var currentLevel *models.AchievementLevel
	currentOrder := 0
	for i := range a.Levels {
		if a.Levels[i].ThresholdPercent <= int(percent) && a.Levels[i].LevelOrder >= currentOrder {
			currentOrder = a.Levels[i].LevelOrder
			currentLevel = &a.Levels[i]
		}
	}

	return AchievementProgress{
		Total:        total,
		Completed:    completed,
		Percent:      percent,
		CurrentLevel: currentLevel,
		CurrentOrder: currentOrder,
	}, nil
}

// UpsertUserAchievementProgress сохраняет или обновляет кэш прогресса по ачивке для пользователя.
func UpsertUserAchievementProgress(db *gorm.DB, userID, achievementID uint, prog AchievementProgress) error {
	var levelID *uint
	if prog.CurrentLevel != nil {
		levelID = &prog.CurrentLevel.ID
	}
	rec := models.UserAchievementProgress{
		UserID:         userID,
		AchievementID:  achievementID,
		Total:          prog.Total,
		Completed:      prog.Completed,
		Percent:        prog.Percent,
		CurrentLevelID: levelID,
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "achievement_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"total", "completed", "percent", "current_level_id", "updated_at"}),
	}).Create(&rec).Error
}

func CountTotalUsers(db *gorm.DB) (int64, error) {
	var n int64
	err := db.Model(&models.User{}).Count(&n).Error
	return n, err
}

func CountUsersReachedAchievementAtLeast(db *gorm.DB, achievementID uint, minPercent float64) (int64, error) {
	var n int64
	err := db.Model(&models.UserAchievementProgress{}).
		Where("achievement_id = ? AND percent >= ?", achievementID, minPercent).
		Count(&n).Error
	return n, err
}

func GetUserAchievementProgressMap(db *gorm.DB, userID uint, achievements []models.Achievement) (map[uint]AchievementProgress, error) {
	var rows []models.UserAchievementProgress
	if err := db.Where("user_id = ?", userID).Find(&rows).Error; err != nil {
		return nil, err
	}
	achByID := make(map[uint]*models.Achievement)
	for i := range achievements {
		achByID[achievements[i].ID] = &achievements[i]
	}
	out := make(map[uint]AchievementProgress)
	for _, r := range rows {
		prog := AchievementProgress{
			Total:        r.Total,
			Completed:    r.Completed,
			Percent:      r.Percent,
			CurrentOrder: 0,
		}
		if r.CurrentLevelID != nil && achByID[r.AchievementID] != nil {
			for i := range achByID[r.AchievementID].Levels {
				if achByID[r.AchievementID].Levels[i].ID == *r.CurrentLevelID {
					prog.CurrentLevel = &achByID[r.AchievementID].Levels[i]
					prog.CurrentOrder = achByID[r.AchievementID].Levels[i].LevelOrder
					break
				}
			}
		}
		out[r.AchievementID] = prog
	}
	return out, nil
}
