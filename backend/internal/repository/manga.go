package repository

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

type MangaRepository struct{}

// buildQuery вызывается дважды, чтобы после Count() не использовать изменённый запрос.
func (r *MangaRepository) List(db *gorm.DB, offset, limit int, buildQuery BuildQueryFn) ([]models.Manga, int64, error) {
	var total int64
	if err := buildQuery(db).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []models.Manga
	q := buildQuery(db)
	if err := q.Preload("Genres").Preload("Themes").
		Preload("Authors").Preload("Publishers").
		Offset(offset).Limit(limit).
		Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *MangaRepository) GetByID(db *gorm.DB, id uint) (*models.Manga, error) {
	var m models.Manga
	err := db.Preload("Genres").Preload("Themes").
		Preload("Authors").Preload("Publishers").Preload("Similar").Preload("Sites.Site").
		Preload("Cast.Character").Preload("Cast.Person").Preload("Cast.Dubbings").Preload("Cast.Dubbings.Person").
		First(&m, id).Error
	if err != nil {
		return nil, err
	}
	var staff []models.MediaStaff
	if e := db.Where("media_type = ? AND media_id = ?", "manga", id).Preload("Person").Find(&staff).Error; e == nil {
		m.Staff = staff
	}
	return &m, nil
}
