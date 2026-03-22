package services

import (
	"log/slog"
	"time"

	"github.com/movie-matcher/backend/internal/database"
	"github.com/movie-matcher/backend/internal/models"
)

type Scheduler struct {
	popularity *PopularityService
	stopChan   chan struct{}
}

const dailySchedulerHour = 22

func NewScheduler() *Scheduler {
	return &Scheduler{
		popularity: NewPopularityService(),
		stopChan:   make(chan struct{}),
	}
}

func (s *Scheduler) Start() {
	go s.runWeeklyDecay()
	go s.runDailyRecalculation()
	go s.runNotificationCleanup()
	go s.runReleaseDateNotifications()
	go s.runAchievementRecalc()
	slog.Default().Info("scheduler started")
}

func (s *Scheduler) Stop() {
	close(s.stopChan)
	slog.Default().Info("scheduler stopped")
}

func (s *Scheduler) runWeeklyDecay() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	s.applyDecayIfNeeded()

	for {
		select {
		case <-ticker.C:
			s.applyDecayIfNeeded()
		case <-s.stopChan:
			return
		}
	}
}

func (s *Scheduler) applyDecayIfNeeded() {
	if time.Now().Weekday() == time.Monday {
		slog.Default().Info("applying weekly views decay")
		if err := s.popularity.ApplyWeeklyDecay(); err != nil {
			slog.Default().Error("weekly decay failed", slog.String("error", err.Error()))
		} else {
			slog.Default().Info("weekly decay applied")
		}
	}
}

func (s *Scheduler) runDailyRecalculation() {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.recalculateAllPopularity()
		case <-s.stopChan:
			return
		}
	}
}

func (s *Scheduler) recalculateAllPopularity() {
	slog.Default().Info("recalculating popularity scores")

	entityTypes := []string{
		models.EntityTypeMovie,
		models.EntityTypeTVSeries,
		models.EntityTypeAnimeSeries,
		models.EntityTypeAnimeMovie,
		models.EntityTypeCartoonSeries,
		models.EntityTypeCartoonMovie,
		models.EntityTypeManga,
		models.EntityTypeBook,
		models.EntityTypeLightNovel,
		models.EntityTypeGame,
		models.EntityTypeCharacter,
		models.EntityTypePerson,
	}

	for _, entityType := range entityTypes {
		if err := s.popularity.RecalculatePopularity(entityType); err != nil {
			slog.Default().Error("popularity recalc failed", slog.String("entity_type", entityType), slog.String("error", err.Error()))
		}
	}

	slog.Default().Info("popularity recalculation completed")
}

func (s *Scheduler) ForceRecalculate() {
	s.recalculateAllPopularity()
}

func (s *Scheduler) ForceDecay() {
	slog.Default().Info("forcing weekly views decay")
	if err := s.popularity.ApplyWeeklyDecay(); err != nil {
		slog.Default().Error("weekly decay failed", slog.String("error", err.Error()))
	} else {
		slog.Default().Info("weekly decay applied")
	}
}

// runNotificationCleanup раз в сутки удаляет устаревшие уведомления (прочитанные > 1 нед., непрочитанные > 2 нед.).
func (s *Scheduler) runNotificationCleanup() {
	doCleanup := func() {
		n, err := DeleteExpiredNotifications(database.DB)
		if err != nil {
			slog.Default().Error("notification cleanup failed", slog.String("error", err.Error()))
		} else if n > 0 {
			slog.Default().Info("notification cleanup deleted", slog.Int64("count", n))
		}
	}
	s.runDailyAt(doCleanup)
}

// runAchievementRecalc по расписанию пересчитывает прогресс по ачивкам для каждого пользователя и сохраняет в user_achievement_progress.
func (s *Scheduler) runAchievementRecalc() {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			if err := RecalculateAllUsersAchievementProgress(database.DB); err != nil {
				slog.Default().Error("achievement recalc failed", slog.String("error", err.Error()))
			}
		case <-s.stopChan:
			return
		}
	}
}

func (s *Scheduler) runReleaseDateNotifications() {
	s.runDailyAt(s.notifyReleaseDateToday)
}

func (s *Scheduler) runDailyAt(task func()) {
	nextRun := nextDailyRunTime(time.Now(), dailySchedulerHour)
	timer := time.NewTimer(time.Until(nextRun))
	defer timer.Stop()

	for {
		select {
		case <-timer.C:
			task()
			nextRun = nextDailyRunTime(time.Now(), dailySchedulerHour)
			timer.Reset(time.Until(nextRun))
		case <-s.stopChan:
			return
		}
	}
}

func nextDailyRunTime(now time.Time, hour int) time.Time {
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, 0, 0, 0, now.Location())
	if !next.After(now) {
		next = next.Add(24 * time.Hour)
	}
	return next
}

func (s *Scheduler) notifyReleaseDateToday() {
	db := database.DB
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	todayEnd := todayStart.Add(24 * time.Hour)

	var movies []models.Movie
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&movies).Error; err == nil {
		for i := range movies {
			title := "Вышел в прокат: " + movies[i].Title
			NotifyMediaUpdate(db, MediaTypeMovie, movies[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}

	var games []models.Game
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&games).Error; err == nil {
		for i := range games {
			title := "Вышла игра: " + games[i].Title
			NotifyMediaUpdate(db, MediaTypeGame, games[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}

	var anime []models.AnimeSeries
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&anime).Error; err == nil {
		for i := range anime {
			title := "Вышел релиз: " + anime[i].Title
			NotifyMediaUpdate(db, MediaTypeAnimeSeries, anime[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}

	var animeMovies []models.AnimeMovie
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&animeMovies).Error; err == nil {
		for i := range animeMovies {
			title := "Вышел релиз: " + animeMovies[i].Title
			NotifyMediaUpdate(db, MediaTypeAnimeMovie, animeMovies[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}

	var manga []models.Manga
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&manga).Error; err == nil {
		for i := range manga {
			title := "Вышел релиз: " + manga[i].Title
			NotifyMediaUpdate(db, MediaTypeManga, manga[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}

	var books []models.Book
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&books).Error; err == nil {
		for i := range books {
			title := "Вышла книга: " + books[i].Title
			NotifyMediaUpdate(db, MediaTypeBook, books[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}

	var lightNovels []models.LightNovel
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&lightNovels).Error; err == nil {
		for i := range lightNovels {
			title := "Вышел релиз: " + lightNovels[i].Title
			NotifyMediaUpdate(db, MediaTypeLightNovel, lightNovels[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}

	var tvSeries []models.TVSeries
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&tvSeries).Error; err == nil {
		for i := range tvSeries {
			title := "Вышел релиз: " + tvSeries[i].Title
			NotifyMediaUpdate(db, MediaTypeTVSeries, tvSeries[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}
	var cartoonSeries []models.CartoonSeries
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&cartoonSeries).Error; err == nil {
		for i := range cartoonSeries {
			title := "Вышел релиз: " + cartoonSeries[i].Title
			NotifyMediaUpdate(db, MediaTypeCartoonSeries, cartoonSeries[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}
	var cartoonMovies []models.CartoonMovie
	if err := db.Where("release_date >= ? AND release_date < ?", todayStart, todayEnd).Find(&cartoonMovies).Error; err == nil {
		for i := range cartoonMovies {
			title := "Вышел релиз: " + cartoonMovies[i].Title
			NotifyMediaUpdate(db, MediaTypeCartoonMovie, cartoonMovies[i].ID, title, nil, models.JSONMap{"reason": "release_date"})
		}
	}
}
