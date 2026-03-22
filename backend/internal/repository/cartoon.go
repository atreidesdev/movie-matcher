package repository

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

type CartoonSeriesRepository struct{}

// buildQuery вызывается дважды, чтобы после Count() не использовать изменённый запрос.
func (r *CartoonSeriesRepository) List(db *gorm.DB, offset, limit int, buildQuery BuildQueryFn) ([]models.CartoonSeries, int64, error) {
	var total int64
	if err := buildQuery(db).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.CartoonSeries
	q := buildQuery(db)
	if err := q.Preload("Genres").Preload("Themes").Preload("Studios").
		Offset(offset).Limit(limit).
		Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *CartoonSeriesRepository) GetByID(db *gorm.DB, id uint) (*models.CartoonSeries, error) {
	var m models.CartoonSeries
	err := db.Preload("Genres").Preload("Themes").
		Preload("Cast.Character").Preload("Cast.Person").Preload("Cast.Dubbings").Preload("Cast.Dubbings.Person").
		Preload("Studios").Preload("Similar").Preload("Sites.Site").
		First(&m, id).Error
	if err != nil {
		return nil, err
	}
	var staff []models.MediaStaff
	if e := db.Where("media_type = ? AND media_id = ?", "cartoon-series", id).Preload("Person").Find(&staff).Error; e == nil {
		m.Staff = staff
	}
	return &m, nil
}

type CartoonMovieRepository struct{}

// buildQuery вызывается дважды, чтобы после Count() не использовать изменённый запрос.
func (r *CartoonMovieRepository) List(db *gorm.DB, offset, limit int, buildQuery BuildQueryFn) ([]models.CartoonMovie, int64, error) {
	var total int64
	if err := buildQuery(db).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.CartoonMovie
	q := buildQuery(db)
	if err := q.Preload("Genres").Preload("Themes").Preload("Studios").
		Offset(offset).Limit(limit).
		Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *CartoonMovieRepository) GetByID(db *gorm.DB, id uint) (*models.CartoonMovie, error) {
	var m models.CartoonMovie
	err := db.Preload("Genres").Preload("Themes").
		Preload("Cast.Character").Preload("Cast.Person").Preload("Cast.Dubbings").Preload("Cast.Dubbings.Person").
		Preload("Studios").Preload("Similar").Preload("Sites.Site").
		First(&m, id).Error
	if err != nil {
		return nil, err
	}
	var staff []models.MediaStaff
	if e := db.Where("media_type = ? AND media_id = ?", "cartoon-movies", id).Preload("Person").Find(&staff).Error; e == nil {
		m.Staff = staff
	}
	return &m, nil
}
