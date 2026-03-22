package repository

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

type MovieRepository struct{}

// buildQuery вызывается дважды, чтобы после Count() не использовать изменённый запрос.
func (r *MovieRepository) List(db *gorm.DB, offset, limit int, buildQuery BuildQueryFn) ([]models.Movie, int64, error) {
	var total int64
	if err := buildQuery(db).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.Movie
	q := buildQuery(db)
	if err := q.Preload("Genres").Preload("Studios").Preload("Themes").
		Offset(offset).Limit(limit).
		Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *MovieRepository) GetByID(db *gorm.DB, id uint) (*models.Movie, error) {
	var m models.Movie
	err := db.Preload("Genres").Preload("Themes").
		Preload("Cast.Character").Preload("Cast.Person").Preload("Cast.Dubbings").Preload("Cast.Dubbings.Person").
		Preload("Staff").Preload("Staff.Person").
		Preload("Studios").Preload("Similar").Preload("Sites.Site").
		First(&m, id).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}
