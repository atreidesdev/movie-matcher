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

// GET /users/username/:username/collections
func GetUserCollectionsByUsername(c *gin.Context) {
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

	var collections []models.Collection
	if err := deps.GetDB(c).Where("user_id = ?", owner.ID).Find(&collections).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch collections")
		return
	}

	c.JSON(http.StatusOK, collections)
}

func GetUserCollections(c *gin.Context) {
	userID, _ := c.Get("userID")

	var collections []models.Collection
	if err := deps.GetDB(c).Where("user_id = ?", userID).Find(&collections).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch collections")
		return
	}

	c.JSON(http.StatusOK, collections)
}

func GetCollection(c *gin.Context) {
	collectionID := c.Param("id")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ?", collectionID).
		Preload("User").Preload("Movies").Preload("TVSeries").Preload("AnimeSeries").
		Preload("CartoonSeries").Preload("CartoonMovies").Preload("AnimeMovies").
		Preload("Games").Preload("Manga").Preload("Books").Preload("LightNovels").
		First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	c.JSON(http.StatusOK, collection)
}

func CreateCollection(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req models.CreateCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	collection := models.Collection{
		UserID:      userID.(uint),
		Name:        req.Name,
		Description: req.Description,
	}

	if err := deps.GetDB(c).Create(&collection).Error; err != nil {
		api.RespondInternal(c, "Failed to create collection")
		return
	}

	c.JSON(http.StatusCreated, collection)
}

func UpdateCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req models.CreateCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	collection.Name = req.Name
	collection.Description = req.Description

	if err := deps.GetDB(c).Save(&collection).Error; err != nil {
		api.RespondInternal(c, "Failed to update collection")
		return
	}

	c.JSON(http.StatusOK, collection)
}

func DeleteCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")

	result := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).Delete(&models.Collection{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Collection deleted"})
}

type AddToCollectionRequest struct {
	MediaID uint `json:"mediaId" binding:"required"`
}

func AddMovieToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var movie models.Movie
	if err := deps.GetDB(c).First(&movie, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Movie not found")
		return
	}

	item := models.CollectionMovie{
		CollectionID: uint(collectionID),
		MovieID:      req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add movie to collection")
		return
	}

	title := "Added «" + movie.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "movies", req.MediaID, movie.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveMovieFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	movieID := c.Param("movieId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND movie_id = ?", collectionID, movieID).Delete(&models.CollectionMovie{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Movie not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Movie removed from collection"})
}

func AddAnimeToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var anime models.AnimeSeries
	if err := deps.GetDB(c).First(&anime, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Anime not found")
		return
	}

	item := models.CollectionAnimeSeries{
		CollectionID:  uint(collectionID),
		AnimeSeriesID: req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add anime to collection")
		return
	}

	title := "Added «" + anime.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "anime", req.MediaID, anime.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveAnimeFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	animeID := c.Param("animeId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND anime_series_id = ?", collectionID, animeID).Delete(&models.CollectionAnimeSeries{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Anime not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Anime removed from collection"})
}

func AddGameToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var game models.Game
	if err := deps.GetDB(c).First(&game, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Game not found")
		return
	}

	item := models.CollectionGame{
		CollectionID: uint(collectionID),
		GameID:       req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add game to collection")
		return
	}

	title := "Added «" + game.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "games", req.MediaID, game.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveGameFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	gameID := c.Param("gameId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND game_id = ?", collectionID, gameID).Delete(&models.CollectionGame{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Game not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Game removed from collection"})
}

func AddMangaToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var manga models.Manga
	if err := deps.GetDB(c).First(&manga, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Manga not found")
		return
	}

	item := models.CollectionManga{
		CollectionID: uint(collectionID),
		MangaID:      req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add manga to collection")
		return
	}

	title := "Added «" + manga.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "manga", req.MediaID, manga.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveMangaFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	mangaID := c.Param("mangaId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND manga_id = ?", collectionID, mangaID).Delete(&models.CollectionManga{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Manga not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Manga removed from collection"})
}

func AddBookToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var book models.Book
	if err := deps.GetDB(c).First(&book, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Book not found")
		return
	}

	item := models.CollectionBook{
		CollectionID: uint(collectionID),
		BookID:       req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add book to collection")
		return
	}

	title := "Added «" + book.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "books", req.MediaID, book.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveBookFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	bookID := c.Param("bookId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND book_id = ?", collectionID, bookID).Delete(&models.CollectionBook{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Book not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book removed from collection"})
}

func AddLightNovelToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var novel models.LightNovel
	if err := deps.GetDB(c).First(&novel, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Light novel not found")
		return
	}

	item := models.CollectionLightNovel{
		CollectionID: uint(collectionID),
		LightNovelID: req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add light novel to collection")
		return
	}

	title := "Added «" + novel.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "light-novels", req.MediaID, novel.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveLightNovelFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	novelID := c.Param("novelId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND light_novel_id = ?", collectionID, novelID).Delete(&models.CollectionLightNovel{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Light novel not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Light novel removed from collection"})
}

func AddTVSeriesToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var tv models.TVSeries
	if err := deps.GetDB(c).First(&tv, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "TV series not found")
		return
	}

	item := models.CollectionTVSeries{
		CollectionID: uint(collectionID),
		TVSeriesID:   req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add TV series to collection")
		return
	}

	title := "Added «" + tv.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "tv-series", req.MediaID, tv.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveTVSeriesFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	tvSeriesID := c.Param("tvSeriesId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND tv_series_id = ?", collectionID, tvSeriesID).Delete(&models.CollectionTVSeries{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "TV series not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "TV series removed from collection"})
}

func AddCartoonSeriesToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var cs models.CartoonSeries
	if err := deps.GetDB(c).First(&cs, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Cartoon series not found")
		return
	}

	item := models.CollectionCartoonSeries{
		CollectionID:    uint(collectionID),
		CartoonSeriesID: req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add cartoon series to collection")
		return
	}

	title := "Added «" + cs.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "cartoon-series", req.MediaID, cs.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveCartoonSeriesFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	cartoonSeriesID := c.Param("cartoonSeriesId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND cartoon_series_id = ?", collectionID, cartoonSeriesID).Delete(&models.CollectionCartoonSeries{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Cartoon series not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cartoon series removed from collection"})
}

func AddCartoonMovieToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var cm models.CartoonMovie
	if err := deps.GetDB(c).First(&cm, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Cartoon movie not found")
		return
	}

	item := models.CollectionCartoonMovie{
		CollectionID:   uint(collectionID),
		CartoonMovieID: req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add cartoon movie to collection")
		return
	}

	title := "Added «" + cm.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "cartoon-movies", req.MediaID, cm.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveCartoonMovieFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	cartoonMovieID := c.Param("cartoonMovieId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND cartoon_movie_id = ?", collectionID, cartoonMovieID).Delete(&models.CollectionCartoonMovie{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Cartoon movie not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cartoon movie removed from collection"})
}

func AddAnimeMovieToCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	var req AddToCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var am models.AnimeMovie
	if err := deps.GetDB(c).First(&am, req.MediaID).Error; err != nil {
		api.RespondNotFound(c, "Anime movie not found")
		return
	}

	item := models.CollectionAnimeMovie{
		CollectionID:  uint(collectionID),
		AnimeMovieID: req.MediaID,
	}

	if err := deps.GetDB(c).Create(&item).Error; err != nil {
		api.RespondInternal(c, "Failed to add anime movie to collection")
		return
	}

	title := "Added «" + am.Title + "» to collection «" + collection.Name + "»"
	CreateNotificationInAppOnly(userID.(uint), models.NotificationTypeCollectionAdd, title, nil, "collection", uint(collectionID), nil)
	CreateActivityForUser(userID.(uint), models.ActivityTypeCollectionAdd, "anime-movies", req.MediaID, am.Title, models.JSONMap{"collectionName": collection.Name})
	c.JSON(http.StatusCreated, item)
}

func RemoveAnimeMovieFromCollection(c *gin.Context) {
	userID, _ := c.Get("userID")
	collectionID := c.Param("id")
	animeMovieID := c.Param("animeMovieId")

	var collection models.Collection
	if err := deps.GetDB(c).Where("id = ? AND user_id = ?", collectionID, userID).First(&collection).Error; err != nil {
		api.RespondNotFound(c, "Collection not found")
		return
	}

	result := deps.GetDB(c).Where("collection_id = ? AND anime_movie_id = ?", collectionID, animeMovieID).Delete(&models.CollectionAnimeMovie{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Anime movie not in collection")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Anime movie removed from collection"})
}

// ——— Публичные (сайтовые) коллекции ———

// GET /public-collections
func GetPublicCollections(c *gin.Context) {
	var list []models.SiteCollection
	if err := deps.GetDB(c).Order("sort_order ASC, id ASC").Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch public collections")
		return
	}
	c.JSON(http.StatusOK, list)
}

// GET /public-collections/:id (опциональная авторизация — при наличии возвращает listStatus пользователя).
func GetPublicCollection(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid collection id", nil)
		return
	}

	var sc models.SiteCollection
	if err := deps.GetDB(c).Where("id = ?", id).Preload("Items").First(&sc).Error; err != nil {
		api.RespondNotFound(c, "Public collection not found")
		return
	}

	db := deps.GetDB(c)
	resp := gin.H{
		"id":          sc.ID,
		"name":        sc.Name,
		"description": sc.Description,
		"poster":      sc.Poster,
		"createdAt":   sc.CreatedAt,
		"updatedAt":   sc.UpdatedAt,
		"user":        nil,
		"owner":       nil,
	}

	// Группируем по типу и загружаем медиа
	byType := make(map[string][]uint)
	for _, it := range sc.Items {
		byType[it.MediaType] = append(byType[it.MediaType], it.MediaID)
	}

	if ids := byType["movie"]; len(ids) > 0 {
		var movies []models.Movie
		db.Where("id IN ?", ids).Find(&movies)
		byID := make(map[uint]models.Movie)
		for _, m := range movies {
			byID[m.ID] = m
		}
		statusMap := getMovieListStatusMap(c, db, movies)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"movieId": m.ID, "movie": obj})
			}
		}
		resp["movies"] = items
	}
	if ids := byType["tv-series"]; len(ids) > 0 {
		var list []models.TVSeries
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.TVSeries)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getTVSeriesListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"tvSeriesId": m.ID, "tvSeries": obj})
			}
		}
		resp["tvSeries"] = items
	}
	if ids := byType["anime"]; len(ids) > 0 {
		var list []models.AnimeSeries
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.AnimeSeries)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getAnimeListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"animeSeriesId": m.ID, "animeSeries": obj})
			}
		}
		resp["animeSeries"] = items
	}
	if ids := byType["game"]; len(ids) > 0 {
		var list []models.Game
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.Game)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getGameListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"gameId": m.ID, "game": obj})
			}
		}
		resp["games"] = items
	}
	if ids := byType["manga"]; len(ids) > 0 {
		var list []models.Manga
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.Manga)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getMangaListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"mangaId": m.ID, "manga": obj})
			}
		}
		resp["manga"] = items
	}
	if ids := byType["book"]; len(ids) > 0 {
		var list []models.Book
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.Book)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getBookListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"bookId": m.ID, "book": obj})
			}
		}
		resp["books"] = items
	}
	if ids := byType["light-novel"]; len(ids) > 0 {
		var list []models.LightNovel
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.LightNovel)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getLightNovelListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"lightNovelId": m.ID, "lightNovel": obj})
			}
		}
		resp["lightNovels"] = items
	}
	if ids := byType["cartoon-series"]; len(ids) > 0 {
		var list []models.CartoonSeries
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.CartoonSeries)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getCartoonSeriesListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"cartoonSeriesId": m.ID, "cartoonSeries": obj})
			}
		}
		resp["cartoonSeries"] = items
	}
	if ids := byType["cartoon-movies"]; len(ids) > 0 {
		var list []models.CartoonMovie
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.CartoonMovie)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getCartoonMovieListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"cartoonMovieId": m.ID, "cartoonMovie": obj})
			}
		}
		resp["cartoonMovies"] = items
	}
	if ids := byType["anime-movies"]; len(ids) > 0 {
		var list []models.AnimeMovie
		db.Where("id IN ?", ids).Find(&list)
		byID := make(map[uint]models.AnimeMovie)
		for _, m := range list {
			byID[m.ID] = m
		}
		statusMap := getAnimeMovieListStatusMap(c, db, list)
		items := make([]gin.H, 0, len(ids))
		for _, mid := range ids {
			if m, ok := byID[uint(mid)]; ok {
				obj := gin.H{"id": m.ID, "title": m.Title, "poster": m.Poster, "rating": m.Rating}
				if s, ok := statusMap[m.ID]; ok {
					obj["listStatus"] = s
				}
				items = append(items, gin.H{"animeMovieId": m.ID, "animeMovie": obj})
			}
		}
		resp["animeMovies"] = items
	}

	c.JSON(http.StatusOK, resp)
}
