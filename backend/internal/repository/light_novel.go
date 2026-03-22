package repository

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

type LightNovelRepository struct{}

// buildQuery вызывается дважды, чтобы после Count() не использовать изменённый запрос.
func (r *LightNovelRepository) List(db *gorm.DB, offset, limit int, buildQuery BuildQueryFn) ([]models.LightNovel, int64, error) {
	var total int64
	if err := buildQuery(db).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.LightNovel
	q := buildQuery(db)
	if err := q.Preload("Genres").Preload("Themes").
		Preload("Authors").Preload("Illustrators").Preload("Publishers").
		Offset(offset).Limit(limit).
		Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *LightNovelRepository) GetByID(db *gorm.DB, id uint) (*models.LightNovel, error) {
	var m models.LightNovel
	err := db.Preload("Genres").Preload("Themes").
		Preload("Authors").Preload("Illustrators").Preload("Publishers").Preload("Similar").Preload("Sites.Site").
		Preload("Cast.Character").Preload("Cast.Person").Preload("Cast.Dubbings").Preload("Cast.Dubbings.Person").
		First(&m, id).Error
	if err != nil {
		return nil, err
	}
	var staff []models.MediaStaff
	if e := db.Where("media_type = ? AND media_id = ?", "light-novels", id).Preload("Person").Find(&staff).Error; e == nil {
		m.Staff = staff
	}
	return &m, nil
}
