package services

import (
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

func GetFriendIDs(db *gorm.DB, userID uint) ([]uint, error) {
	var friendships []models.Friendship
	if err := db.Where("user_id = ?", userID).Find(&friendships).Error; err != nil {
		return nil, err
	}
	ids := make([]uint, 0, len(friendships))
	for _, f := range friendships {
		ids = append(ids, f.FriendID)
	}
	return ids, nil
}

func AreFriends(db *gorm.DB, userID, otherID uint) bool {
	if userID == otherID {
		return true
	}
	var count int64
	db.Model(&models.Friendship{}).
		Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", userID, otherID, otherID, userID).
		Count(&count)
	return count >= 1
}

func GetProfileVisibility(db *gorm.DB, userID uint) string {
	var s models.UserSettings
	if err := db.Where("user_id = ?", userID).First(&s).Error; err != nil {
		return models.ProfileVisibilityPublic
	}
	if s.ProfileVisibility == "" {
		return models.ProfileVisibilityPublic
	}
	return s.ProfileVisibility
}

// viewerID == nil для неавторизованного. db — для проверки дружбы (Friends).
func CanViewProfile(db *gorm.DB, viewerID *uint, ownerID uint, visibility string) bool {
	// Владелец всегда видит свой профиль
	if viewerID != nil && *viewerID == ownerID {
		return true
	}
	switch visibility {
	case models.ProfileVisibilityPrivate:
		return false
	case models.ProfileVisibilityFriends:
		if viewerID == nil {
			return false
		}
		return AreFriends(db, *viewerID, ownerID)
	case models.ProfileVisibilityPublic:
		return true
	default:
		return true
	}
}

// CanViewProfileByUserID то же, что CanViewProfile, но видимость загружается по ownerID.
func CanViewProfileByUserID(db *gorm.DB, viewerID *uint, ownerID uint) bool {
	visibility := GetProfileVisibility(db, ownerID)
	return CanViewProfile(db, viewerID, ownerID, visibility)
}
