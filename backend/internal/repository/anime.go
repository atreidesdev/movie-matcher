package repository

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

type AnimeSeriesRepository struct{}

// buildQuery вызывается дважды, чтобы после Count() не использовать изменённый запрос.
func (r *AnimeSeriesRepository) List(db *gorm.DB, offset, limit int, buildQuery BuildQueryFn) ([]models.AnimeSeries, int64, error) {
	var total int64
	if err := buildQuery(db).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.AnimeSeries
	q := buildQuery(db)
	if err := q.Preload("Genres").Preload("Studios").Preload("Themes").
		Offset(offset).Limit(limit).
		Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *AnimeSeriesRepository) GetByID(db *gorm.DB, id uint) (*models.AnimeSeries, error) {
	var m models.AnimeSeries
	err := db.Preload("Genres").Preload("Themes").
		Preload("Cast.Character").Preload("Cast.Person").Preload("Cast.Dubbings").Preload("Cast.Dubbings.Person").
		Preload("Studios").Preload("Similar").Preload("Sites.Site").
		First(&m, id).Error
	if err != nil {
		return nil, err
	}
	var staff []models.MediaStaff
	if e := db.Where("media_type = ? AND media_id = ?", "anime", id).Preload("Person").Find(&staff).Error; e == nil {
		m.Staff = staff
	}
	return &m, nil
}
