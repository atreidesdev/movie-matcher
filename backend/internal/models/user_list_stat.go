package models

import "time"

// Типы контента для списков (ключи в listCounts.byType).
const (
	ListEntityMovie         = "movie"
	ListEntityTVSeries      = "tvSeries"
	ListEntityAnimeSeries   = "animeSeries"
	ListEntityCartoonSeries = "cartoonSeries"
	ListEntityCartoonMovie  = "cartoonMovie"
	ListEntityAnimeMovie    = "animeMovie"
	ListEntityGame          = "game"
	ListEntityManga         = "manga"
	ListEntityBook          = "book"
	ListEntityLightNovel    = "lightNovel"
)

// Обновляется при добавлении/изменении/удалении записей в списках.
type UserListStat struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	UserID     uint      `gorm:"uniqueIndex:idx_user_entity_status;not null" json:"userId"`
	EntityType string    `gorm:"uniqueIndex:idx_user_entity_status;not null" json:"entityType"` // movie, tvSeries, ...
	Status     string    `gorm:"uniqueIndex:idx_user_entity_status;not null" json:"status"`     // planned, watching, ...
	Count      int       `gorm:"default:0;not null" json:"count"`
}

func (UserListStat) TableName() string {
	return "user_list_stats"
}

type ListCountsByStatus struct {
	Planned    int `json:"planned"`
	Watching   int `json:"watching"`
	Completed  int `json:"completed"`
	OnHold     int `json:"onHold"`
	Dropped    int `json:"dropped"`
	Rewatching int `json:"rewatching"`
	Total      int `json:"total"`
}
