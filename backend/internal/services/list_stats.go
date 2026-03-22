package services

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

// IncrementListStat увеличивает счётчик на 1 для пары (userID, entityType, status). Создаёт запись с 0 при отсутствии.
func IncrementListStat(db *gorm.DB, userID uint, entityType, status string) {
	ensureListStatRow(db, userID, entityType, status)
	db.Model(&models.UserListStat{}).
		Where("user_id = ? AND entity_type = ? AND status = ?", userID, entityType, status).
		UpdateColumn("count", gorm.Expr("count + ?", 1))
}

// DecrementListStat уменьшает счётчик на 1. Не уходит ниже 0.
func DecrementListStat(db *gorm.DB, userID uint, entityType, status string) {
	db.Model(&models.UserListStat{}).
		Where("user_id = ? AND entity_type = ? AND status = ? AND count > 0", userID, entityType, status).
		UpdateColumn("count", gorm.Expr("count - 1"))
}

func ensureListStatRow(db *gorm.DB, userID uint, entityType, status string) {
	var s models.UserListStat
	db.Where("user_id = ? AND entity_type = ? AND status = ?", userID, entityType, status).FirstOrCreate(&s, models.UserListStat{
		UserID:     userID,
		EntityType: entityType,
		Status:     status,
		Count:      0,
	})
}

type ListStatsResult struct {
	ByType   map[string]models.ListCountsByStatus `json:"byType"`
	ByStatus *models.ListCountsByStatus           `json:"byStatus"`
}

func GetListStatsForUser(db *gorm.DB, userID uint) (*ListStatsResult, bool) {
	var rows []models.UserListStat
	if err := db.Where("user_id = ?", userID).Find(&rows).Error; err != nil || len(rows) == 0 {
		BackfillListStatsForUser(db, userID)
		db.Where("user_id = ?", userID).Find(&rows)
	}
	if len(rows) == 0 {
		return emptyListStatsResult(), true
	}
	byType := make(map[string]models.ListCountsByStatus)
	byStatus := &models.ListCountsByStatus{}
	for _, r := range rows {
		addToByType(byType, r.EntityType, r.Status, r.Count)
		addToByStatus(byStatus, r.Status, r.Count)
	}
	for k := range byType {
		t := byType[k]
		t.Total = t.Planned + t.Watching + t.Completed + t.OnHold + t.Dropped + t.Rewatching
		byType[k] = t
	}
	byStatus.Total = byStatus.Planned + byStatus.Watching + byStatus.Completed + byStatus.OnHold + byStatus.Dropped + byStatus.Rewatching
	return &ListStatsResult{ByType: byType, ByStatus: byStatus}, true
}

func addToByType(m map[string]models.ListCountsByStatus, entityType, status string, count int) {
	t := m[entityType]
	switch status {
	case string(models.ListStatusPlanned):
		t.Planned += count
	case string(models.ListStatusWatching):
		t.Watching += count
	case string(models.ListStatusCompleted):
		t.Completed += count
	case string(models.ListStatusOnHold):
		t.OnHold += count
	case string(models.ListStatusDropped):
		t.Dropped += count
	case string(models.ListStatusRewatching):
		t.Rewatching += count
	}
	m[entityType] = t
}

func addToByStatus(s *models.ListCountsByStatus, status string, count int) {
	switch status {
	case string(models.ListStatusPlanned):
		s.Planned += count
	case string(models.ListStatusWatching):
		s.Watching += count
	case string(models.ListStatusCompleted):
		s.Completed += count
	case string(models.ListStatusOnHold):
		s.OnHold += count
	case string(models.ListStatusDropped):
		s.Dropped += count
	case string(models.ListStatusRewatching):
		s.Rewatching += count
	}
}

func emptyListStatsResult() *ListStatsResult {
	return &ListStatsResult{
		ByType:   make(map[string]models.ListCountsByStatus),
		ByStatus: &models.ListCountsByStatus{},
	}
}

// BackfillListStatsForUser пересчитывает статистику из таблиц списков и записывает в user_list_stats.
func BackfillListStatsForUser(db *gorm.DB, userID uint) {
	db.Where("user_id = ?", userID).Delete(&models.UserListStat{})
	type row struct {
		Status string
		Count  int64
	}
	entityModels := []struct {
		EntityType string
		Model      interface{}
	}{
		{models.ListEntityMovie, &models.MovieList{}},
		{models.ListEntityTVSeries, &models.TVSeriesList{}},
		{models.ListEntityAnimeSeries, &models.AnimeSeriesList{}},
		{models.ListEntityCartoonSeries, &models.CartoonSeriesList{}},
		{models.ListEntityCartoonMovie, &models.CartoonMovieList{}},
		{models.ListEntityAnimeMovie, &models.AnimeMovieList{}},
		{models.ListEntityGame, &models.GameList{}},
		{models.ListEntityManga, &models.MangaList{}},
		{models.ListEntityBook, &models.BookList{}},
		{models.ListEntityLightNovel, &models.LightNovelList{}},
	}
	for _, em := range entityModels {
		var rows []row
		db.Model(em.Model).Where("user_id = ?", userID).Select("status, count(*) as count").Group("status").Scan(&rows)
		for _, r := range rows {
			if r.Count <= 0 {
				continue
			}
			db.Create(&models.UserListStat{
				UserID:     userID,
				EntityType: em.EntityType,
				Status:     r.Status,
				Count:      int(r.Count),
			})
		}
	}
}