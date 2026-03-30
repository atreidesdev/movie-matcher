package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

func CreateMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	movieID, err := strconv.ParseUint(c.Param("movieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid movie ID", nil)
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var movie models.Movie
	if err := deps.GetDB(c).First(&movie, movieID).Error; err != nil {
		api.RespondNotFound(c, "Movie not found")
		return
	}

	var existingReview models.MovieReview
	if err := deps.GetDB(c).Where("user_id = ? AND movie_id = ?", userID, movieID).First(&existingReview).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this movie")
		return
	}

	review := models.MovieReview{
		UserID:           userID.(uint),
		MovieID:          uint(movieID),
		OverallRating:    req.OverallRating,
		Review:           req.Review,
		ReviewStatus:     req.ReviewStatus,
		StoryRating:      req.StoryRating,
		ProductionRating: req.ProductionRating,
		ActingRating:     req.ActingRating,
		MusicRating:      req.MusicRating,
		VisualsRating:    req.VisualsRating,
		CharacterRating:  req.CharacterRating,
	}

	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}

	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "movies", uint(movieID), movie.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("Movie").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func UpdateMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	movieID, err := strconv.ParseUint(c.Param("movieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid movie ID", nil)
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var review models.MovieReview
	if err := deps.GetDB(c).Where("user_id = ? AND movie_id = ?", userID, movieID).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}

	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.ProductionRating = req.ProductionRating
	review.ActingRating = req.ActingRating
	review.MusicRating = req.MusicRating
	review.VisualsRating = req.VisualsRating
	review.CharacterRating = req.CharacterRating

	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}

	c.JSON(http.StatusOK, review)
}

func DeleteMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	movieID, err := strconv.ParseUint(c.Param("movieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid movie ID", nil)
		return
	}

	result := deps.GetDB(c).Where("user_id = ? AND movie_id = ?", userID, movieID).Delete(&models.MovieReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func GetMovieReviews(c *gin.Context) {
	movieID := c.Param("id")

	var reviews []models.MovieReview
	if err := deps.GetDB(c).Where("movie_id = ?", movieID).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}

	c.JSON(http.StatusOK, reviews)
}

func GetUserReviews(c *gin.Context) {
	userID, _ := c.Get("userID")

	type AllReviews struct {
		Movies         []models.MovieReview          `json:"movies"`
		TVSeries       []models.TVSeriesReview       `json:"tvSeries"`
		CartoonSeries  []models.CartoonSeriesReview `json:"cartoonSeries"`
		CartoonMovies  []models.CartoonMovieReview  `json:"cartoonMovies"`
		Anime          []models.AnimeSeriesReview   `json:"anime"`
		AnimeMovies    []models.AnimeMovieReview    `json:"animeMovies"`
		Games          []models.GameReview          `json:"games"`
		Manga          []models.MangaReview         `json:"manga"`
		Books          []models.BookReview          `json:"books"`
		LightNovels    []models.LightNovelReview    `json:"lightNovels"`
	}

	var allReviews AllReviews

	deps.GetDB(c).Where("user_id = ?", userID).Preload("Movie").Find(&allReviews.Movies)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("TVSeries").Find(&allReviews.TVSeries)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("CartoonSeries").Find(&allReviews.CartoonSeries)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("CartoonMovie").Find(&allReviews.CartoonMovies)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("AnimeSeries").Find(&allReviews.Anime)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("AnimeMovie").Find(&allReviews.AnimeMovies)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("Game").Find(&allReviews.Games)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("Manga").Find(&allReviews.Manga)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("Book").Find(&allReviews.Books)
	deps.GetDB(c).Where("user_id = ?", userID).Preload("LightNovel").Find(&allReviews.LightNovels)

	c.JSON(http.StatusOK, allReviews)
}

// GET /users/username/:username/reviews. Требует права просмотра профиля (MustCanViewUserProfile).
func GetUserReviewsByUsername(c *gin.Context) {
	username := strings.TrimSpace(strings.ToLower(c.Param("username")))
	if username == "" {
		api.RespondBadRequest(c, "Username required", nil)
		return
	}
	var owner models.User
	if err := deps.GetDB(c).Where("username = ?", username).First(&owner).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	if !MustCanViewUserProfile(c, owner.ID) {
		return
	}
	ownerID := owner.ID

	type AllReviews struct {
		Movies         []models.MovieReview          `json:"movies"`
		TVSeries       []models.TVSeriesReview       `json:"tvSeries"`
		CartoonSeries  []models.CartoonSeriesReview  `json:"cartoonSeries"`
		CartoonMovies  []models.CartoonMovieReview   `json:"cartoonMovies"`
		Anime          []models.AnimeSeriesReview    `json:"anime"`
		AnimeMovies    []models.AnimeMovieReview     `json:"animeMovies"`
		Games          []models.GameReview          `json:"games"`
		Manga          []models.MangaReview         `json:"manga"`
		Books          []models.BookReview          `json:"books"`
		LightNovels    []models.LightNovelReview     `json:"lightNovels"`
	}
	var allReviews AllReviews
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("Movie").Find(&allReviews.Movies)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("TVSeries").Find(&allReviews.TVSeries)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("CartoonSeries").Find(&allReviews.CartoonSeries)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("CartoonMovie").Find(&allReviews.CartoonMovies)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("AnimeSeries").Find(&allReviews.Anime)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("AnimeMovie").Find(&allReviews.AnimeMovies)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("Game").Find(&allReviews.Games)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("Manga").Find(&allReviews.Manga)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("Book").Find(&allReviews.Books)
	deps.GetDB(c).Where("user_id = ?", ownerID).Preload("LightNovel").Find(&allReviews.LightNovels)
	c.JSON(http.StatusOK, allReviews)
}

func CreateAnimeReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	animeID, err := strconv.ParseUint(c.Param("animeId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime ID", nil)
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var anime models.AnimeSeries
	if err := deps.GetDB(c).First(&anime, animeID).Error; err != nil {
		api.RespondNotFound(c, "Anime not found")
		return
	}

	var existingReview models.AnimeSeriesReview
	if err := deps.GetDB(c).Where("user_id = ? AND anime_series_id = ?", userID, animeID).First(&existingReview).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this anime")
		return
	}

	review := models.AnimeSeriesReview{
		UserID:           userID.(uint),
		AnimeSeriesID:    uint(animeID),
		OverallRating:    req.OverallRating,
		Review:           req.Review,
		ReviewStatus:     req.ReviewStatus,
		StoryRating:      req.StoryRating,
		ProductionRating: req.ProductionRating,
		ActingRating:     req.ActingRating,
		MusicRating:      req.MusicRating,
		VisualsRating:    req.VisualsRating,
		CharacterRating:  req.CharacterRating,
	}

	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}

	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "anime", uint(animeID), anime.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("AnimeSeries").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func DeleteAnimeReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	animeID, err := strconv.ParseUint(c.Param("animeId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime ID", nil)
		return
	}
	result := deps.GetDB(c).Where("user_id = ? AND anime_series_id = ?", userID, animeID).Delete(&models.AnimeSeriesReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func CreateGameReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	gameID, err := strconv.ParseUint(c.Param("gameId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid game ID", nil)
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var game models.Game
	if err := deps.GetDB(c).First(&game, gameID).Error; err != nil {
		api.RespondNotFound(c, "Game not found")
		return
	}

	var existingReview models.GameReview
	if err := deps.GetDB(c).Where("user_id = ? AND game_id = ?", userID, gameID).First(&existingReview).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this game")
		return
	}

	review := models.GameReview{
		UserID:        userID.(uint),
		GameID:        uint(gameID),
		OverallRating: req.OverallRating,
		Review:        req.Review,
		ReviewStatus:  req.ReviewStatus,
		StoryRating:   req.StoryRating,
		VisualsRating: req.VisualsRating,
	}

	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}

	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "games", uint(gameID), game.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("Game").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func DeleteGameReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	gameID, err := strconv.ParseUint(c.Param("gameId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid game ID", nil)
		return
	}

	result := deps.GetDB(c).Where("user_id = ? AND game_id = ?", userID, gameID).Delete(&models.GameReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func CreateMangaReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	mangaID, err := strconv.ParseUint(c.Param("mangaId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid manga ID", nil)
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var manga models.Manga
	if err := deps.GetDB(c).First(&manga, mangaID).Error; err != nil {
		api.RespondNotFound(c, "Manga not found")
		return
	}

	var existingReview models.MangaReview
	if err := deps.GetDB(c).Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&existingReview).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this manga")
		return
	}

	review := models.MangaReview{
		UserID:          userID.(uint),
		MangaID:         uint(mangaID),
		OverallRating:   req.OverallRating,
		Review:          req.Review,
		ReviewStatus:    req.ReviewStatus,
		StoryRating:     req.StoryRating,
		CharacterRating: req.CharacterRating,
	}

	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}

	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "manga", uint(mangaID), manga.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("Manga").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func DeleteMangaReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	mangaID, err := strconv.ParseUint(c.Param("mangaId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid manga ID", nil)
		return
	}

	result := deps.GetDB(c).Where("user_id = ? AND manga_id = ?", userID, mangaID).Delete(&models.MangaReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func CreateBookReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	bookID, err := strconv.ParseUint(c.Param("bookId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid book ID", nil)
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var book models.Book
	if err := deps.GetDB(c).First(&book, bookID).Error; err != nil {
		api.RespondNotFound(c, "Book not found")
		return
	}

	var existingReview models.BookReview
	if err := deps.GetDB(c).Where("user_id = ? AND book_id = ?", userID, bookID).First(&existingReview).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this book")
		return
	}

	review := models.BookReview{
		UserID:          userID.(uint),
		BookID:          uint(bookID),
		OverallRating:   req.OverallRating,
		Review:          req.Review,
		ReviewStatus:    req.ReviewStatus,
		StoryRating:     req.StoryRating,
		CharacterRating: req.CharacterRating,
	}

	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}

	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "books", uint(bookID), book.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("Book").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func DeleteBookReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	bookID, err := strconv.ParseUint(c.Param("bookId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid book ID", nil)
		return
	}

	result := deps.GetDB(c).Where("user_id = ? AND book_id = ?", userID, bookID).Delete(&models.BookReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func CreateLightNovelReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	novelID, err := strconv.ParseUint(c.Param("novelId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid light novel ID", nil)
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var novel models.LightNovel
	if err := deps.GetDB(c).First(&novel, novelID).Error; err != nil {
		api.RespondNotFound(c, "Light novel not found")
		return
	}

	var existingReview models.LightNovelReview
	if err := deps.GetDB(c).Where("user_id = ? AND light_novel_id = ?", userID, novelID).First(&existingReview).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this light novel")
		return
	}

	review := models.LightNovelReview{
		UserID:          userID.(uint),
		LightNovelID:    uint(novelID),
		OverallRating:   req.OverallRating,
		Review:          req.Review,
		ReviewStatus:    req.ReviewStatus,
		StoryRating:     req.StoryRating,
		CharacterRating: req.CharacterRating,
	}

	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}

	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "light-novels", uint(novelID), novel.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("LightNovel").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func DeleteLightNovelReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	novelID, err := strconv.ParseUint(c.Param("novelId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid light novel ID", nil)
		return
	}

	result := deps.GetDB(c).Where("user_id = ? AND light_novel_id = ?", userID, novelID).Delete(&models.LightNovelReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func GetAnimeReviews(c *gin.Context) {
	animeID := c.Param("id")
	var reviews []models.AnimeSeriesReview
	if err := deps.GetDB(c).Where("anime_series_id = ?", animeID).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func GetGameReviews(c *gin.Context) {
	gameID := c.Param("id")
	var reviews []models.GameReview
	if err := deps.GetDB(c).Where("game_id = ?", gameID).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func GetMangaReviews(c *gin.Context) {
	mangaID := c.Param("id")
	var reviews []models.MangaReview
	if err := deps.GetDB(c).Where("manga_id = ?", mangaID).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func GetBookReviews(c *gin.Context) {
	bookID := c.Param("id")
	var reviews []models.BookReview
	if err := deps.GetDB(c).Where("book_id = ?", bookID).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func GetLightNovelReviews(c *gin.Context) {
	novelID := c.Param("id")
	var reviews []models.LightNovelReview
	if err := deps.GetDB(c).Where("light_novel_id = ?", novelID).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

// ——— TV Series reviews ———
func GetTVSeriesReviews(c *gin.Context) {
	id := c.Param("id")
	var reviews []models.TVSeriesReview
	if err := deps.GetDB(c).Where("tv_series_id = ?", id).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func CreateTVSeriesReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	tvID, err := strconv.ParseUint(c.Param("tvSeriesId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid tv series ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var tv models.TVSeries
	if err := deps.GetDB(c).First(&tv, tvID).Error; err != nil {
		api.RespondNotFound(c, "TV series not found")
		return
	}
	var existing models.TVSeriesReview
	if err := deps.GetDB(c).Where("user_id = ? AND tv_series_id = ?", userID, tvID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this tv series")
		return
	}
	review := models.TVSeriesReview{
		UserID:           userID.(uint),
		TVSeriesID:       uint(tvID),
		OverallRating:    req.OverallRating,
		Review:           req.Review,
		ReviewStatus:     req.ReviewStatus,
		StoryRating:      req.StoryRating,
		ProductionRating: req.ProductionRating,
		ActingRating:     req.ActingRating,
		MusicRating:      req.MusicRating,
		VisualsRating:    req.VisualsRating,
		CharacterRating:  req.CharacterRating,
	}
	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}
	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}
	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "tv-series", uint(tvID), tv.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("TVSeries").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func UpdateTVSeriesReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	tvID, err := strconv.ParseUint(c.Param("tvSeriesId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid tv series ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.TVSeriesReview
	if err := deps.GetDB(c).Where("user_id = ? AND tv_series_id = ?", userID, tvID).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.ProductionRating = req.ProductionRating
	review.ActingRating = req.ActingRating
	review.MusicRating = req.MusicRating
	review.VisualsRating = req.VisualsRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func DeleteTVSeriesReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	tvID, err := strconv.ParseUint(c.Param("tvSeriesId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid tv series ID", nil)
		return
	}
	result := deps.GetDB(c).Where("user_id = ? AND tv_series_id = ?", userID, tvID).Delete(&models.TVSeriesReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

// ——— Cartoon Series reviews ———
func GetCartoonSeriesReviews(c *gin.Context) {
	id := c.Param("id")
	var reviews []models.CartoonSeriesReview
	if err := deps.GetDB(c).Where("cartoon_series_id = ?", id).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func CreateCartoonSeriesReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("cartoonSeriesId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon series ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var cs models.CartoonSeries
	if err := deps.GetDB(c).First(&cs, id).Error; err != nil {
		api.RespondNotFound(c, "Cartoon series not found")
		return
	}
	var existing models.CartoonSeriesReview
	if err := deps.GetDB(c).Where("user_id = ? AND cartoon_series_id = ?", userID, id).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this cartoon series")
		return
	}
	review := models.CartoonSeriesReview{
		UserID:           userID.(uint),
		CartoonSeriesID:  uint(id),
		OverallRating:    req.OverallRating,
		Review:           req.Review,
		ReviewStatus:     req.ReviewStatus,
		StoryRating:      req.StoryRating,
		ProductionRating: req.ProductionRating,
		ActingRating:     req.ActingRating,
		MusicRating:      req.MusicRating,
		VisualsRating:    req.VisualsRating,
		CharacterRating:  req.CharacterRating,
	}
	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}
	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}
	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "cartoon-series", uint(id), cs.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("CartoonSeries").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func UpdateCartoonSeriesReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("cartoonSeriesId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon series ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.CartoonSeriesReview
	if err := deps.GetDB(c).Where("user_id = ? AND cartoon_series_id = ?", userID, id).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.ProductionRating = req.ProductionRating
	review.ActingRating = req.ActingRating
	review.MusicRating = req.MusicRating
	review.VisualsRating = req.VisualsRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func DeleteCartoonSeriesReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("cartoonSeriesId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon series ID", nil)
		return
	}
	result := deps.GetDB(c).Where("user_id = ? AND cartoon_series_id = ?", userID, id).Delete(&models.CartoonSeriesReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

// ——— Cartoon Movie reviews ———
func GetCartoonMovieReviews(c *gin.Context) {
	id := c.Param("id")
	var reviews []models.CartoonMovieReview
	if err := deps.GetDB(c).Where("cartoon_movie_id = ?", id).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func CreateCartoonMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("cartoonMovieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon movie ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var cm models.CartoonMovie
	if err := deps.GetDB(c).First(&cm, id).Error; err != nil {
		api.RespondNotFound(c, "Cartoon movie not found")
		return
	}
	var existing models.CartoonMovieReview
	if err := deps.GetDB(c).Where("user_id = ? AND cartoon_movie_id = ?", userID, id).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this cartoon movie")
		return
	}
	review := models.CartoonMovieReview{
		UserID:           userID.(uint),
		CartoonMovieID:   uint(id),
		OverallRating:    req.OverallRating,
		Review:           req.Review,
		ReviewStatus:     req.ReviewStatus,
		StoryRating:      req.StoryRating,
		ProductionRating: req.ProductionRating,
		ActingRating:     req.ActingRating,
		MusicRating:      req.MusicRating,
		VisualsRating:    req.VisualsRating,
		CharacterRating:  req.CharacterRating,
	}
	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}
	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}
	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "cartoon-movies", uint(id), cm.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("CartoonMovie").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func UpdateCartoonMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("cartoonMovieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon movie ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.CartoonMovieReview
	if err := deps.GetDB(c).Where("user_id = ? AND cartoon_movie_id = ?", userID, id).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.ProductionRating = req.ProductionRating
	review.ActingRating = req.ActingRating
	review.MusicRating = req.MusicRating
	review.VisualsRating = req.VisualsRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func DeleteCartoonMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("cartoonMovieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid cartoon movie ID", nil)
		return
	}
	result := deps.GetDB(c).Where("user_id = ? AND cartoon_movie_id = ?", userID, id).Delete(&models.CartoonMovieReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

// ——— Anime Movie reviews ———
func GetAnimeMovieReviews(c *gin.Context) {
	id := c.Param("id")
	var reviews []models.AnimeMovieReview
	if err := deps.GetDB(c).Where("anime_movie_id = ?", id).Preload("User").Find(&reviews).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reviews")
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func CreateAnimeMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("animeMovieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime movie ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var am models.AnimeMovie
	if err := deps.GetDB(c).First(&am, id).Error; err != nil {
		api.RespondNotFound(c, "Anime movie not found")
		return
	}
	var existing models.AnimeMovieReview
	if err := deps.GetDB(c).Where("user_id = ? AND anime_movie_id = ?", userID, id).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Review already exists for this anime movie")
		return
	}
	review := models.AnimeMovieReview{
		UserID:           userID.(uint),
		AnimeMovieID:     uint(id),
		OverallRating:    req.OverallRating,
		Review:           req.Review,
		ReviewStatus:     req.ReviewStatus,
		StoryRating:      req.StoryRating,
		ProductionRating: req.ProductionRating,
		ActingRating:     req.ActingRating,
		MusicRating:      req.MusicRating,
		VisualsRating:    req.VisualsRating,
		CharacterRating:  req.CharacterRating,
	}
	if review.ReviewStatus == "" {
		review.ReviewStatus = models.ReviewStatusNeutral
	}
	if err := deps.GetDB(c).Create(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to create review")
		return
	}
	CreateActivityForUser(userID.(uint), models.ActivityTypeReview, "anime-movies", uint(id), am.Title, models.JSONMap{"rating": review.OverallRating})
	deps.GetDB(c).Preload("AnimeMovie").First(&review, review.ID)
	c.JSON(http.StatusCreated, review)
}

func UpdateAnimeMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("animeMovieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime movie ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.AnimeMovieReview
	if err := deps.GetDB(c).Where("user_id = ? AND anime_movie_id = ?", userID, id).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.ProductionRating = req.ProductionRating
	review.ActingRating = req.ActingRating
	review.MusicRating = req.MusicRating
	review.VisualsRating = req.VisualsRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func DeleteAnimeMovieReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, err := strconv.ParseUint(c.Param("animeMovieId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime movie ID", nil)
		return
	}
	result := deps.GetDB(c).Where("user_id = ? AND anime_movie_id = ?", userID, id).Delete(&models.AnimeMovieReview{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Review not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

// ——— Update (PUT) for anime, game, manga, book, light-novel ———
func UpdateAnimeReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	animeID, err := strconv.ParseUint(c.Param("animeId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid anime ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.AnimeSeriesReview
	if err := deps.GetDB(c).Where("user_id = ? AND anime_series_id = ?", userID, animeID).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.ProductionRating = req.ProductionRating
	review.ActingRating = req.ActingRating
	review.MusicRating = req.MusicRating
	review.VisualsRating = req.VisualsRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func UpdateGameReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	gameID, err := strconv.ParseUint(c.Param("gameId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid game ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.GameReview
	if err := deps.GetDB(c).Where("user_id = ? AND game_id = ?", userID, gameID).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.VisualsRating = req.VisualsRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func UpdateMangaReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	mangaID, err := strconv.ParseUint(c.Param("mangaId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid manga ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.MangaReview
	if err := deps.GetDB(c).Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func UpdateBookReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	bookID, err := strconv.ParseUint(c.Param("bookId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid book ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.BookReview
	if err := deps.GetDB(c).Where("user_id = ? AND book_id = ?", userID, bookID).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

func UpdateLightNovelReview(c *gin.Context) {
	userID, _ := c.Get("userID")
	novelID, err := strconv.ParseUint(c.Param("novelId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid light novel ID", nil)
		return
	}
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var review models.LightNovelReview
	if err := deps.GetDB(c).Where("user_id = ? AND light_novel_id = ?", userID, novelID).First(&review).Error; err != nil {
		api.RespondNotFound(c, "Review not found")
		return
	}
	review.OverallRating = req.OverallRating
	review.Review = req.Review
	if req.ReviewStatus != "" {
		review.ReviewStatus = req.ReviewStatus
	}
	review.StoryRating = req.StoryRating
	review.CharacterRating = req.CharacterRating
	if err := deps.GetDB(c).Save(&review).Error; err != nil {
		api.RespondInternal(c, "Failed to update review")
		return
	}
	c.JSON(http.StatusOK, review)
}

// GET /api/v1/media/:type/:id/reviews-from-similar-users (OptionalAuth). Без авторизации — пустой массив.
func GetMediaReviewsFromSimilarUsers(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}
	uid := userIDVal.(uint)
	mediaType := c.Param("type")
	entityIDStr := c.Param("id")
	entityID, err := strconv.ParseUint(entityIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid entity ID", nil)
		return
	}
	id := uint(entityID)

	db := deps.GetDB(c)
	const desiredSimilarLimit = 30

	similarIDs := make([]uint, 0, desiredSimilarLimit)
	{
		var cached []models.UserSimilarUser
		if err := db.Where("user_id = ?", uid).
			Order("position ASC").
			Limit(desiredSimilarLimit).
			Find(&cached).Error; err == nil && len(cached) > 0 {
			for _, row := range cached {
				similarIDs = append(similarIDs, row.SimilarUserID)
			}
		}
	}

	if len(similarIDs) == 0 {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	if len(similarIDs) == 0 {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	const limit = 20

	switch mediaType {
	case "movies":
		var list []models.MovieReview
		if e := db.Where("movie_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "tv-series":
		var list []models.TVSeriesReview
		if e := db.Where("tv_series_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "cartoon-series":
		var list []models.CartoonSeriesReview
		if e := db.Where("cartoon_series_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "cartoon-movies":
		var list []models.CartoonMovieReview
		if e := db.Where("cartoon_movie_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "anime":
		var list []models.AnimeSeriesReview
		if e := db.Where("anime_series_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "anime-movies":
		var list []models.AnimeMovieReview
		if e := db.Where("anime_movie_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "games":
		var list []models.GameReview
		if e := db.Where("game_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "manga":
		var list []models.MangaReview
		if e := db.Where("manga_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "books":
		var list []models.BookReview
		if e := db.Where("book_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	case "light-novels":
		var list []models.LightNovelReview
		if e := db.Where("light_novel_id = ? AND user_id IN ?", id, similarIDs).Preload("User").Limit(limit).Find(&list).Error; e != nil {
			api.RespondInternal(c, "Failed to fetch reviews")
			return
		}
		c.JSON(http.StatusOK, list)
	default:
		api.RespondNotFound(c, "Reviews not available for this media type")
	}
}
