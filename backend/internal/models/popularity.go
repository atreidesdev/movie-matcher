package models

import "time"

type PopularityStats struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	EntityType      string    `gorm:"not null;uniqueIndex:idx_entity" json:"entityType"`
	EntityID        uint      `gorm:"not null;uniqueIndex:idx_entity" json:"entityId"`
	ViewsTotal      int64     `gorm:"default:0" json:"viewsTotal"`
	ViewsWeekly     float64   `gorm:"default:0" json:"viewsWeekly"`
	FavoritesCount  int64     `gorm:"default:0" json:"favoritesCount"`
	CommentsCount   int64     `gorm:"default:0" json:"commentsCount"`
	ListsCount      int64     `gorm:"default:0" json:"listsCount"`
	ReviewsCount    int64     `gorm:"default:0" json:"reviewsCount"`
	AvgRating       float64   `gorm:"default:0" json:"avgRating"`
	PopularityScore float64   `gorm:"default:0;index" json:"popularityScore"`
	LastDecayAt     time.Time `json:"lastDecayAt"`
}

func (PopularityStats) TableName() string {
	return "popularity_stats"
}

type ViewLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	EntityType string    `gorm:"not null;index" json:"entityType"`
	EntityID   uint      `gorm:"not null;index" json:"entityId"`
	UserID     *uint     `json:"userId"`
	IPHash     string    `json:"ipHash"`
}

func (ViewLog) TableName() string {
	return "view_logs"
}

const (
	EntityTypeMovie         = "movie"
	EntityTypeTVSeries      = "tv_series"
	EntityTypeAnimeSeries   = "anime_series"
	EntityTypeAnimeMovie    = "anime_movie"
	EntityTypeCartoonSeries = "cartoon_series"
	EntityTypeCartoonMovie  = "cartoon_movie"
	EntityTypeManga         = "manga"
	EntityTypeBook          = "book"
	EntityTypeLightNovel    = "light_novel"
	EntityTypeGame          = "game"
	EntityTypeCharacter     = "character"
	EntityTypePerson        = "person"
	EntityTypeCast          = "cast"
	EntityTypeFranchise     = "franchise"
)

type PopularityWeights struct {
	ViewsWeekly    float64
	ViewsTotal     float64
	Favorites      float64
	Comments       float64
	Lists          float64
	Reviews        float64
	Rating         float64
	RatingCount    float64
	RecencyBonus   float64
}

var DefaultWeights = PopularityWeights{
	ViewsWeekly:  0.30, // 30% - недельные просмотры (с decay)
	ViewsTotal:   0.10, // 10% - всего просмотров
	Favorites:    0.20, // 20% - добавления в избранное
	Comments:     0.10, // 10% - комментарии
	Lists:        0.15, // 15% - добавления в списки
	Reviews:      0.10, // 10% - отзывы
	Rating:       0.05, // 5% - средний рейтинг (нормализованный)
}

const (
	WeeklyDecayRate = 0.7 // Каждую неделю weekly views умножаются на 0.7 (теряют 30%)
)
