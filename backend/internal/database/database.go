package database

import (
	"log/slog"
	"strings"

	"github.com/movie-matcher/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(databaseURL string) error {
	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Info),
	})
	if err != nil {
		return err
	}

	slog.Default().Info("database connected")
	return nil
}

func AutoMigrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.Token{},
		&models.PasswordResetToken{},

		&models.Genre{},
		&models.Theme{},
		&models.Person{},
		&models.Character{},
		&models.Cast{},
		&models.Dubbing{},
		&models.MovieStaff{},
		&models.MediaStaff{},
		&models.Studio{},
		&models.Developer{},
		&models.Publisher{},
		&models.Platform{},
		&models.Site{},

		&models.Movie{},
		&models.TVSeries{},
		&models.AnimeSeries{},
		&models.CartoonSeries{},
		&models.CartoonMovie{},
		&models.AnimeMovie{},
		&models.Manga{},
		&models.Game{},
		&models.Book{},
		&models.LightNovel{},

		&models.MovieReview{},
		&models.TVSeriesReview{},
		&models.AnimeSeriesReview{},
		&models.CartoonSeriesReview{},
		&models.CartoonMovieReview{},
		&models.AnimeMovieReview{},
		&models.MangaReview{},
		&models.GameReview{},
		&models.BookReview{},
		&models.LightNovelReview{},

		&models.MovieList{},
		&models.TVSeriesList{},
		&models.AnimeSeriesList{},
		&models.CartoonSeriesList{},
		&models.CartoonMovieList{},
		&models.AnimeMovieList{},
		&models.MangaList{},
		&models.GameList{},
		&models.BookList{},
		&models.LightNovelList{},

		&models.MovieFavorite{},
		&models.TVSeriesFavorite{},
		&models.AnimeSeriesFavorite{},
		&models.CartoonSeriesFavorite{},
		&models.CartoonMovieFavorite{},
		&models.AnimeMovieFavorite{},
		&models.MangaFavorite{},
		&models.GameFavorite{},
		&models.BookFavorite{},
		&models.LightNovelFavorite{},
		&models.CharacterFavorite{},
		&models.PersonFavorite{},
		&models.CastFavorite{},

		&models.MovieSite{},
		&models.TVSeriesSite{},
		&models.AnimeSeriesSite{},
		&models.CartoonSeriesSite{},
		&models.CartoonMovieSite{},
		&models.AnimeMovieSite{},
		&models.MangaSite{},
		&models.GameSite{},
		&models.BookSite{},
		&models.LightNovelSite{},

		&models.Discussion{},
		&models.DiscussionComment{},

		&models.MovieComment{},
		&models.TVSeriesComment{},
		&models.AnimeSeriesComment{},
		&models.CartoonSeriesComment{},
		&models.CartoonMovieComment{},
		&models.AnimeMovieComment{},
		&models.MangaComment{},
		&models.GameComment{},
		&models.BookComment{},
		&models.LightNovelComment{},
		&models.PersonComment{},
		&models.CharacterComment{},
		&models.CommentReaction{},
		&models.CommentEmojiReaction{},
		&models.ReviewReaction{},

		&models.Collection{},
		&models.SiteCollection{},
		&models.SiteCollectionItem{},
		&models.CollectionMovie{},
		&models.CollectionTVSeries{},
		&models.CollectionAnimeSeries{},
		&models.CollectionCartoonSeries{},
		&models.CollectionCartoonMovie{},
		&models.CollectionAnimeMovie{},
		&models.CollectionManga{},
		&models.CollectionGame{},
		&models.CollectionBook{},
		&models.CollectionLightNovel{},

		&models.FriendRequest{},
		&models.Friendship{},
		&models.Follow{},

		&models.Franchise{},
		&models.FranchiseMediaLink{},

		&models.PopularityStats{},
		&models.ViewLog{},

		&models.ContentSimilar{},
		// Личные рекомендации пользователя (тип 2)
		&models.UserRecommendation{},
		// Список похожих пользователей (кеш)
		&models.UserSimilarUser{},

		// Messaging (encrypted)
		&models.Conversation{},
		&models.Message{},

		&models.Notification{},
		&models.UserSettings{},
		&models.Report{},
		&models.Activity{},
		&models.CommentBanHistory{},
		&models.ModeratorActionLog{},
		&models.ReportResponseTemplate{},

		// Предвычисленная статистика списков (user_list_stats)
		&models.UserListStat{},

		&models.Achievement{},
		&models.AchievementLevel{},
		&models.AchievementTargetMedia{},
		&models.UserAchievementProgress{},

		&models.DevBlogPost{},

		&models.News{},
		&models.NewsComment{},

		&models.Community{},
		&models.CommunitySubscription{},
		&models.CommunityPost{},

		&models.Bookmark{},

		&models.PushSubscription{},
	)
}

func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func EnsureInitialOwner(ownerEmail, ownerPassword, ownerName, ownerUsername string) error {
	if ownerEmail == "" {
		return nil
	}
	var existing models.User
	if err := DB.Where("email = ?", ownerEmail).First(&existing).Error; err == nil {
		return nil
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(ownerPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	un := strings.ToLower(strings.TrimSpace(ownerUsername))
	if un == "" {
		un = "owner"
	}
	user := models.User{
		Email:    ownerEmail,
		Username: &un,
		Password: string(hashed),
		Name:     &ownerName,
		Role:     models.RoleOwner,
	}
	if err := DB.Create(&user).Error; err != nil {
		return err
	}
	slog.Default().Info("initial owner created", slog.String("email", ownerEmail))
	return nil
}

// Email должен быть валидным для binding:"email" в auth (admin@localhost не проходит валидацию).
func EnsureDefaultOwner() error {
	const (
		email    = "admin@example.com"
		password = "admin"
		name     = "Admin"
		username = "admin"
	)
	var existing models.User
	if err := DB.Where("email = ?", email).First(&existing).Error; err == nil {
		return nil
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user := models.User{
		Email:    email,
		Username: ptr(strings.ToLower(username)),
		Password: string(hashed),
		Name:     ptr(name),
		Role:     models.RoleOwner,
	}
	if err := DB.Create(&user).Error; err != nil {
		return err
	}
	slog.Default().Info("default owner created", slog.String("email", email), slog.String("username", username))
	return nil
}

func ptr(s string) *string { return &s }
