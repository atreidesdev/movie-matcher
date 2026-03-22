package models

import "time"

const (
	AchievementTargetGenre    = "genre"
	AchievementTargetFranchise = "franchise"
	AchievementTargetMediaList = "media_list"
)

const (
	AchievementRarityCommon    = "common"
	AchievementRarityUncommon  = "uncommon"
	AchievementRarityRare      = "rare"
	AchievementRarityEpic      = "epic"
	AchievementRarityLegendary = "legendary"
)

type Achievement struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Slug        string    `gorm:"uniqueIndex;not null;size:120" json:"slug"`
	Title       string    `gorm:"not null;size:200" json:"title"`
	TitleI18n   *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	ImageURL    *string   `json:"imageUrl"`
	Rarity      string    `gorm:"size:32;default:common" json:"rarity"` // common, uncommon, rare, epic, legendary
	TargetType  string    `gorm:"not null;size:32" json:"targetType"`    // genre, franchise, media_list
	GenreID     *uint     `json:"genreId,omitempty"`
	Genre       *Genre    `gorm:"foreignKey:GenreID" json:"genre,omitempty"`
	FranchiseID *uint     `json:"franchiseId,omitempty"`
	Franchise   *Franchise `gorm:"foreignKey:FranchiseID" json:"franchise,omitempty"`
	OrderNum    int       `gorm:"default:0" json:"orderNum"`

	Levels  []AchievementLevel    `gorm:"foreignKey:AchievementID;order:level_order" json:"levels,omitempty"`
	Targets []AchievementTargetMedia `gorm:"foreignKey:AchievementID" json:"targets,omitempty"`
}

type AchievementLevel struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
	AchievementID     uint      `gorm:"not null;index" json:"achievementId"`
	Achievement       Achievement `gorm:"foreignKey:AchievementID" json:"-"`
	LevelOrder        int      `gorm:"not null" json:"levelOrder"`   // 1, 2, 3...
	ThresholdPercent  int      `gorm:"not null" json:"thresholdPercent"` // 20, 50, 100
	Title             string   `gorm:"size:200" json:"title"`
	TitleI18n         *LocalizedString `gorm:"type:jsonb" json:"titleI18n,omitempty"`
	ImageURL          *string  `json:"imageUrl"`
}

type AchievementTargetMedia struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
	AchievementID uint   `gorm:"not null;uniqueIndex:idx_ach_media" json:"achievementId"`
	MediaType     string `gorm:"not null;size:32;uniqueIndex:idx_ach_media" json:"mediaType"`
	MediaID       uint   `gorm:"not null;uniqueIndex:idx_ach_media" json:"mediaId"`
}

type UserAchievementProgress struct {
	UserID         uint      `gorm:"primaryKey;uniqueIndex:idx_user_achievement" json:"userId"`
	AchievementID  uint      `gorm:"primaryKey;uniqueIndex:idx_user_achievement" json:"achievementId"`
	Total          int       `gorm:"not null;default:0" json:"total"`
	Completed      int       `gorm:"not null;default:0" json:"completed"`
	Percent        float64   `gorm:"not null;default:0" json:"percent"`
	CurrentLevelID *uint     `json:"currentLevelId,omitempty"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
