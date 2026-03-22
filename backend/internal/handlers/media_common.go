package handlers

import (
	"gorm.io/gorm"
)

// RunMediaList выполняет подсчёт total и выборку страницы по уже настроенному запросу.
// buildQuery вызывается дважды (для Count и для Find). dest — указатель на срез (например &[]models.Game).
// Уменьшает дублирование в хендлерах списков медиа (movies, games, anime и т.д.).
func RunMediaList(db *gorm.DB, buildQuery func(*gorm.DB) *gorm.DB, offset, limit int, dest interface{}, preloads []string) (total int64, err error) {
	if err = buildQuery(db).Count(&total).Error; err != nil {
		return 0, err
	}
	q := buildQuery(db)
	for _, p := range preloads {
		q = q.Preload(p)
	}
	if err = q.Offset(offset).Limit(limit).Find(dest).Error; err != nil {
		return 0, err
	}
	return total, nil
}
