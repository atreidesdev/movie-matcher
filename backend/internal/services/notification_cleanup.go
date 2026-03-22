package services

import (
	"time"

	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

const (
	// RetentionRead — хранить прочитанные уведомления 1 неделю.
	RetentionRead = 7 * 24 * time.Hour
	// RetentionUnread — удалять непрочитанные старше 2 недель.
	RetentionUnread = 14 * 24 * time.Hour
)

// DeleteExpiredNotifications удаляет уведомления:
// - прочитанные более RetentionRead назад (1 неделя);
// - непрочитанные старше RetentionUnread (2 недели).
func DeleteExpiredNotifications(db *gorm.DB) (int64, error) {
	now := time.Now()
	readBefore := now.Add(-RetentionRead)
	unreadCreatedBefore := now.Add(-RetentionUnread)

	r1 := db.Where("read_at IS NOT NULL AND read_at < ?", readBefore).Delete(&models.Notification{})
	if r1.Error != nil {
		return 0, r1.Error
	}
	r2 := db.Where("read_at IS NULL AND created_at < ?", unreadCreatedBefore).Delete(&models.Notification{})
	if r2.Error != nil {
		return 0, r2.Error
	}
	return r1.RowsAffected + r2.RowsAffected, nil
}
