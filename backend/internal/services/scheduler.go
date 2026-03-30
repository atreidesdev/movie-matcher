package services

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"sync"
	"time"

	"github.com/movie-matcher/backend/internal/database"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/queue"
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
	go s.runSimilarUsersRecalc()
	go s.runUserRecommendationsRecalc()
	go s.runWeeklyPrecomputeSimilarContent()
	slog.Default().Info("scheduler started")
}

// Похожие тайтлы (content_similar) — пересчёт раз в неделю (в понедельник, в dailySchedulerHour).
func (s *Scheduler) runWeeklyPrecomputeSimilarContent() {
	task := func() {
		if time.Now().Weekday() != time.Monday {
			return
		}
		slog.Default().Info("precomputing content_similar (weekly)")
		res, err := queue.Default.Submit(context.Background(), queue.Job{
			Fn: func() (interface{}, error) {
				return nil, ComputeSimilarPrecomputed("")
			},
		})
		if err != nil || res.Err != nil {
			slog.Default().Error("content_similar precompute failed", slog.String("error", errString(err, res.Err)))
			return
		}
		slog.Default().Info("content_similar precompute completed")
	}
	s.runDailyAt(task)
}

func (s *Scheduler) Stop() {
	close(s.stopChan)
	slog.Default().Info("scheduler stopped")
}

const (
	activeUsersLookbackDays        = 7
	similarUsersRecalcInterval     = 12 * time.Hour
	similarUsersActiveBatchSize    = 50
	similarUsersComputedLimit     = 30

	userRecommendationsRecalcInterval      = 12 * time.Hour
	userRecommendationsActiveBatchSize    = 10
	userRecommendationsComputedLimit      = 24
)

var recommendationApiMediaTypes = []string{
	"movie",
	"tvSeries",
	"animeSeries",
	"animeMovie",
	"game",
	"manga",
	"book",
	"lightNovel",
	"cartoonSeries",
	"cartoonMovie",
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

func (s *Scheduler) runSimilarUsersRecalc() {
	ticker := time.NewTicker(similarUsersRecalcInterval)
	defer ticker.Stop()

	// Сразу при старте сервиса.
	s.precomputeSimilarUsersForActiveBatch()

	for {
		select {
		case <-ticker.C:
			s.precomputeSimilarUsersForActiveBatch()
		case <-s.stopChan:
			return
		}
	}
}

func (s *Scheduler) runUserRecommendationsRecalc() {
	ticker := time.NewTicker(userRecommendationsRecalcInterval)
	defer ticker.Stop()

	// Сразу при старте сервиса.
	s.precomputeUserRecommendationsForActiveBatch()

	for {
		select {
		case <-ticker.C:
			s.precomputeUserRecommendationsForActiveBatch()
		case <-s.stopChan:
			return
		}
	}
}

func (s *Scheduler) precomputeSimilarUsersForActiveBatch() {
	cutoff := time.Now().Add(-activeUsersLookbackDays * 24 * time.Hour)

	var userIDs []uint
	if err := database.DB.Model(&models.User{}).
		Where("last_seen_at IS NOT NULL AND last_seen_at >= ?", cutoff).
		Order("last_seen_at DESC NULLS LAST").
		Limit(similarUsersActiveBatchSize).
		Pluck("id", &userIDs).Error; err != nil {
		slog.Default().Error("similar users precompute: failed to select users", slog.String("error", err.Error()))
		return
	}
	if len(userIDs) == 0 {
		return
	}

	slog.Default().Info("similar users precompute: started", slog.Int("batch_users", len(userIDs)))

	var wg sync.WaitGroup
	for _, uid := range userIDs {
		userID := uid
		wg.Add(1)
		go func() {
			defer wg.Done()

			limitStr := strconv.Itoa(similarUsersComputedLimit)
			res, err := queue.Default.Submit(context.Background(), queue.Job{
				Fn: func() (interface{}, error) {
					return GetSimilarUsers(userID, limitStr)
				},
			})
				if err != nil || res.Err != nil {
					slog.Default().Error("similar users precompute: fetch failed", slog.Uint64("user_id", uint64(userID)), slog.String("error", errString(err, res.Err)))
				return
			}

			similarResp, _ := res.Data.(*SimilarUsersResponse)
			if similarResp == nil || len(similarResp.SimilarUsers) == 0 {
				return
			}

			if err := database.DB.Where("user_id = ?", userID).Delete(&models.UserSimilarUser{}).Error; err != nil {
				slog.Default().Error("similar users precompute: delete failed", slog.Uint64("user_id", uint64(userID)), slog.String("error", err.Error()))
				return
			}

			for i, item := range similarResp.SimilarUsers {
				_ = database.DB.Create(&models.UserSimilarUser{
					UserID:        userID,
					SimilarUserID: item.UserID,
					Score:         item.Score,
					Position:      i + 1,
				}).Error
			}
		}()
	}
	wg.Wait()

	slog.Default().Info("similar users precompute: completed", slog.Int("batch_users", len(userIDs)))
}

func (s *Scheduler) precomputeUserRecommendationsForActiveBatch() {
	cutoff := time.Now().Add(-activeUsersLookbackDays * 24 * time.Hour)

	var userIDs []uint
	if err := database.DB.Model(&models.User{}).
		Where("last_seen_at IS NOT NULL AND last_seen_at >= ?", cutoff).
		Order("last_seen_at DESC NULLS LAST").
		Limit(userRecommendationsActiveBatchSize).
		Pluck("id", &userIDs).Error; err != nil {
		slog.Default().Error("user recommendations precompute: failed to select users", slog.String("error", err.Error()))
		return
	}
	if len(userIDs) == 0 {
		return
	}

	slog.Default().Info("user recommendations precompute: started", slog.Int("batch_users", len(userIDs)))

	var wg sync.WaitGroup
	for _, uid := range userIDs {
		userID := uid
		for _, mediaType := range recommendationApiMediaTypes {
			mt := mediaType
			wg.Add(1)
			go func() {
				defer wg.Done()

				limitStr := strconv.Itoa(userRecommendationsComputedLimit)
				res, err := queue.Default.Submit(context.Background(), queue.Job{
					Fn: func() (interface{}, error) {
						return GetRecommendations(userID, mt, limitStr)
					},
				})
				if err != nil || res.Err != nil {
					slog.Default().Error("user recommendations precompute: fetch failed",
						slog.Uint64("user_id", uint64(userID)),
						slog.String("media_type", mt),
						slog.String("error", errString(err, res.Err)),
					)
					return
				}

				recResp, _ := res.Data.(*RecommendationResponse)
				if recResp == nil || len(recResp.Recommendations) == 0 {
					return
				}

				entityType := apiMediaTypeToEntityType(mt)
				if err := database.DB.Where("user_id = ? AND entity_type = ?", userID, entityType).Delete(&models.UserRecommendation{}).Error; err != nil {
					slog.Default().Error("user recommendations precompute: delete failed",
						slog.Uint64("user_id", uint64(userID)),
						slog.String("entity_type", entityType),
						slog.String("error", err.Error()),
					)
					return
				}

				for i, item := range recResp.Recommendations {
					_ = database.DB.Create(&models.UserRecommendation{
						UserID:        userID,
						EntityType:    entityType,
						EntityID:      item.MediaID,
						Title:         item.Title,
						Poster:        item.Poster,
						Description:   item.Description,
						Score:         item.Score,
						Position:      i + 1,
					}).Error
				}
			}()
		}
	}
	wg.Wait()

	slog.Default().Info("user recommendations precompute: completed", slog.Int("batch_users", len(userIDs)))
}

func errString(a error, b error) string {
	if a != nil {
		return a.Error()
	}
	if b != nil {
		return b.Error()
	}
	return "unknown error"
}

// PrecomputeSimilarUsersForActiveUsersAll принудительно пересчитывает кеш похожих пользователей
// для ВСЕХ активных пользователей (последняя активность в пределах активного окна).
// Подходит для ручного запуска из админки.
func PrecomputeSimilarUsersForActiveUsersAll() error {
	cutoff := time.Now().Add(-activeUsersLookbackDays * 24 * time.Hour)

	// Вытаскиваем пачками, чтобы не держать в памяти и не рисковать таймаутом.
	var total int64
	if err := database.DB.Model(&models.User{}).
		Where("last_seen_at IS NOT NULL AND last_seen_at >= ?", cutoff).
		Count(&total).Error; err != nil {
		return err
	}
	if total == 0 {
		return nil
	}

	batchSize := int64(similarUsersActiveBatchSize)
	for offset := int64(0); offset < total; offset += batchSize {
		var userIDs []uint
		if err := database.DB.Model(&models.User{}).
			Where("last_seen_at IS NOT NULL AND last_seen_at >= ?", cutoff).
			Order("last_seen_at DESC NULLS LAST, id DESC").
			Limit(int(batchSize)).
			Offset(int(offset)).
			Pluck("id", &userIDs).Error; err != nil {
			return err
		}
		if len(userIDs) == 0 {
			continue
		}

		slog.Default().Info("similar users precompute (admin): started batch", slog.Int("offset", int(offset)), slog.Int("count", len(userIDs)))

		var wg sync.WaitGroup
		var mu sync.Mutex
		var firstErr error
		for _, uid := range userIDs {
			userID := uid
			wg.Add(1)
			go func() {
				defer wg.Done()

				limitStr := strconv.Itoa(similarUsersComputedLimit)
				res, err := queue.Default.Submit(context.Background(), queue.Job{
					Fn: func() (interface{}, error) {
						return GetSimilarUsers(userID, limitStr)
					},
				})
				if err != nil || res.Err != nil {
					mu.Lock()
					if firstErr == nil {
						firstErr = fmt.Errorf("similar users precompute (admin): fetch failed user_id=%d: %v", userID, errString(err, res.Err))
					}
					mu.Unlock()
					return
				}

				similarResp, _ := res.Data.(*SimilarUsersResponse)
				if similarResp == nil || len(similarResp.SimilarUsers) == 0 {
					return
				}

				if err := database.DB.Where("user_id = ?", userID).Delete(&models.UserSimilarUser{}).Error; err != nil {
					mu.Lock()
					if firstErr == nil {
						firstErr = fmt.Errorf("similar users precompute (admin): delete failed user_id=%d: %w", userID, err)
					}
					mu.Unlock()
					return
				}

				for i, item := range similarResp.SimilarUsers {
					_ = database.DB.Create(&models.UserSimilarUser{
						UserID:        userID,
						SimilarUserID: item.UserID,
						Score:         item.Score,
						Position:      i + 1,
					}).Error
				}
			}()
		}
		wg.Wait()

		slog.Default().Info("similar users precompute (admin): completed batch", slog.Int("offset", int(offset)), slog.Int("count", len(userIDs)))

		if firstErr != nil {
			return firstErr
		}
	}

	return nil
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
