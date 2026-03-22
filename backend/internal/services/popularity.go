package services

import (
	"crypto/sha256"
	"encoding/hex"
	"math"
	"time"

	"github.com/movie-matcher/backend/internal/database"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PopularityService struct {
	db      *gorm.DB
	weights models.PopularityWeights
}

func NewPopularityService() *PopularityService {
	return NewPopularityServiceWithDB(database.DB)
}

func NewPopularityServiceWithDB(db *gorm.DB) *PopularityService {
	return &PopularityService{
		db:      db,
		weights: models.DefaultWeights,
	}
}

func (s *PopularityService) RecordView(entityType string, entityID uint, userID *uint, ipAddress string) error {
	ipHash := hashIP(ipAddress)

	var recentView models.ViewLog
	oneHourAgo := time.Now().Add(-1 * time.Hour)
	
	query := s.db.Where("entity_type = ? AND entity_id = ? AND created_at > ?", entityType, entityID, oneHourAgo)
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	} else {
		query = query.Where("ip_hash = ?", ipHash)
	}
	
	if err := query.First(&recentView).Error; err == nil {
		return nil
	}

	viewLog := models.ViewLog{
		EntityType: entityType,
		EntityID:   entityID,
		UserID:     userID,
		IPHash:     ipHash,
	}
	if err := s.db.Create(&viewLog).Error; err != nil {
		return err
	}

	return s.incrementViews(entityType, entityID)
}

func (s *PopularityService) incrementViews(entityType string, entityID uint) error {
	stats := models.PopularityStats{
		EntityType: entityType,
		EntityID:   entityID,
	}

	return s.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "entity_type"}, {Name: "entity_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"views_total":  gorm.Expr("views_total + 1"),
			"views_weekly": gorm.Expr("views_weekly + 1"),
			"updated_at":   time.Now(),
		}),
	}).Create(&stats).Error
}

func (s *PopularityService) ApplyWeeklyDecay() error {
	oneWeekAgo := time.Now().AddDate(0, 0, -7)
	
	return s.db.Model(&models.PopularityStats{}).
		Where("last_decay_at < ? OR last_decay_at IS NULL", oneWeekAgo).
		Updates(map[string]interface{}{
			"views_weekly":  gorm.Expr("views_weekly * ?", models.WeeklyDecayRate),
			"last_decay_at": time.Now(),
		}).Error
}

func (s *PopularityService) RecalculatePopularity(entityType string) error {
	var stats []models.PopularityStats
	if err := s.db.Where("entity_type = ?", entityType).Find(&stats).Error; err != nil {
		return err
	}

	if len(stats) == 0 {
		return nil
	}

	maxViews := float64(1)
	maxWeekly := float64(1)
	maxFavorites := float64(1)
	maxComments := float64(1)
	maxLists := float64(1)
	maxReviews := float64(1)

	for _, stat := range stats {
		if float64(stat.ViewsTotal) > maxViews {
			maxViews = float64(stat.ViewsTotal)
		}
		if stat.ViewsWeekly > maxWeekly {
			maxWeekly = stat.ViewsWeekly
		}
		if float64(stat.FavoritesCount) > maxFavorites {
			maxFavorites = float64(stat.FavoritesCount)
		}
		if float64(stat.CommentsCount) > maxComments {
			maxComments = float64(stat.CommentsCount)
		}
		if float64(stat.ListsCount) > maxLists {
			maxLists = float64(stat.ListsCount)
		}
		if float64(stat.ReviewsCount) > maxReviews {
			maxReviews = float64(stat.ReviewsCount)
		}
	}

	for _, stat := range stats {
		score := s.calculateScore(stat, maxViews, maxWeekly, maxFavorites, maxComments, maxLists, maxReviews)
		s.db.Model(&stat).Update("popularity_score", score)
	}

	return nil
}

func (s *PopularityService) calculateScore(stat models.PopularityStats, maxViews, maxWeekly, maxFavorites, maxComments, maxLists, maxReviews float64) float64 {
	normalizedViewsTotal := float64(stat.ViewsTotal) / maxViews
	normalizedViewsWeekly := stat.ViewsWeekly / maxWeekly
	normalizedFavorites := float64(stat.FavoritesCount) / maxFavorites
	normalizedComments := float64(stat.CommentsCount) / maxComments
	normalizedLists := float64(stat.ListsCount) / maxLists
	normalizedReviews := float64(stat.ReviewsCount) / maxReviews
	normalizedRating := stat.AvgRating / 10.0

	score := normalizedViewsWeekly*s.weights.ViewsWeekly +
		normalizedViewsTotal*s.weights.ViewsTotal +
		normalizedFavorites*s.weights.Favorites +
		normalizedComments*s.weights.Comments +
		normalizedLists*s.weights.Lists +
		normalizedReviews*s.weights.Reviews +
		normalizedRating*s.weights.Rating

	return math.Round(score*10000) / 100
}

func (s *PopularityService) UpdateEntityStats(entityType string, entityID uint) error {
	var stats models.PopularityStats
	result := s.db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).First(&stats)
	
	if result.Error != nil {
		stats = models.PopularityStats{
			EntityType: entityType,
			EntityID:   entityID,
		}
		s.db.Create(&stats)
	}

	updates := make(map[string]interface{})

	switch entityType {
	case models.EntityTypeMovie:
		var favCount int64
		s.db.Model(&models.MovieFavorite{}).Where("movie_id = ?", entityID).Count(&favCount)
		updates["favorites_count"] = favCount

		var commentCount int64
		s.db.Model(&models.MovieComment{}).Where("movie_id = ?", entityID).Count(&commentCount)
		updates["comments_count"] = commentCount

		var listCount int64
		s.db.Model(&models.MovieList{}).Where("movie_id = ?", entityID).Count(&listCount)
		updates["lists_count"] = listCount

		var reviewCount int64
		s.db.Model(&models.MovieReview{}).Where("movie_id = ?", entityID).Count(&reviewCount)
		updates["reviews_count"] = reviewCount

		var avgRating float64
		s.db.Model(&models.MovieReview{}).Where("movie_id = ?", entityID).Select("COALESCE(AVG(overall_rating), 0)").Scan(&avgRating)
		updates["avg_rating"] = avgRating

	case models.EntityTypeCharacter:
		var favCount int64
		s.db.Model(&models.CharacterFavorite{}).Where("character_id = ?", entityID).Count(&favCount)
		updates["favorites_count"] = favCount

		var commentCount int64
		s.db.Model(&models.CharacterComment{}).Where("character_id = ?", entityID).Count(&commentCount)
		updates["comments_count"] = commentCount

	case models.EntityTypePerson:
		var favCount int64
		s.db.Model(&models.PersonFavorite{}).Where("person_id = ?", entityID).Count(&favCount)
		updates["favorites_count"] = favCount

		var commentCount int64
		s.db.Model(&models.PersonComment{}).Where("person_id = ?", entityID).Count(&commentCount)
		updates["comments_count"] = commentCount

	case models.EntityTypeAnimeSeries:
		var favCount int64
		s.db.Model(&models.AnimeSeriesFavorite{}).Where("anime_series_id = ?", entityID).Count(&favCount)
		updates["favorites_count"] = favCount

		var commentCount int64
		s.db.Model(&models.AnimeSeriesComment{}).Where("anime_series_id = ?", entityID).Count(&commentCount)
		updates["comments_count"] = commentCount

		var listCount int64
		s.db.Model(&models.AnimeSeriesList{}).Where("anime_series_id = ?", entityID).Count(&listCount)
		updates["lists_count"] = listCount

		var reviewCount int64
		s.db.Model(&models.AnimeSeriesReview{}).Where("anime_series_id = ?", entityID).Count(&reviewCount)
		updates["reviews_count"] = reviewCount

		var avgRating float64
		s.db.Model(&models.AnimeSeriesReview{}).Where("anime_series_id = ?", entityID).Select("COALESCE(AVG(overall_rating), 0)").Scan(&avgRating)
		updates["avg_rating"] = avgRating

	case models.EntityTypeGame:
		var favCount int64
		s.db.Model(&models.GameFavorite{}).Where("game_id = ?", entityID).Count(&favCount)
		updates["favorites_count"] = favCount

		var commentCount int64
		s.db.Model(&models.GameComment{}).Where("game_id = ?", entityID).Count(&commentCount)
		updates["comments_count"] = commentCount

		var listCount int64
		s.db.Model(&models.GameList{}).Where("game_id = ?", entityID).Count(&listCount)
		updates["lists_count"] = listCount

		var reviewCount int64
		s.db.Model(&models.GameReview{}).Where("game_id = ?", entityID).Count(&reviewCount)
		updates["reviews_count"] = reviewCount

		var avgRating float64
		s.db.Model(&models.GameReview{}).Where("game_id = ?", entityID).Select("COALESCE(AVG(overall_rating), 0)").Scan(&avgRating)
		updates["avg_rating"] = avgRating
	}

	return s.db.Model(&stats).Updates(updates).Error
}

func (s *PopularityService) GetPopularIDs(entityType string, limit int) ([]uint, error) {
	var stats []models.PopularityStats
	err := s.db.Where("entity_type = ?", entityType).
		Order("popularity_score DESC").
		Limit(limit).
		Find(&stats).Error

	if err != nil {
		return nil, err
	}

	ids := make([]uint, len(stats))
	for i, stat := range stats {
		ids[i] = stat.EntityID
	}

	return ids, nil
}

func (s *PopularityService) GetTrendingIDs(entityType string, limit int) ([]uint, error) {
	var stats []models.PopularityStats
	err := s.db.Where("entity_type = ?", entityType).
		Order("views_weekly DESC").
		Limit(limit).
		Find(&stats).Error

	if err != nil {
		return nil, err
	}

	ids := make([]uint, len(stats))
	for i, stat := range stats {
		ids[i] = stat.EntityID
	}

	return ids, nil
}

func hashIP(ip string) string {
	hash := sha256.Sum256([]byte(ip + "movie-matcher-salt"))
	return hex.EncodeToString(hash[:16])
}
