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

type UserFavorites struct {
	Movies        []models.MovieFavorite         `json:"movies"`
	TVSeries      []models.TVSeriesFavorite      `json:"tvSeries"`
	AnimeSeries   []models.AnimeSeriesFavorite   `json:"animeSeries"`
	CartoonSeries []models.CartoonSeriesFavorite `json:"cartoonSeries"`
	CartoonMovies []models.CartoonMovieFavorite  `json:"cartoonMovies"`
	AnimeMovies   []models.AnimeMovieFavorite    `json:"animeMovies"`
	Games         []models.GameFavorite          `json:"games"`
	Manga         []models.MangaFavorite         `json:"manga"`
	Books         []models.BookFavorite          `json:"books"`
	LightNovels   []models.LightNovelFavorite    `json:"lightNovels"`
	Characters    []models.CharacterFavorite     `json:"characters"`
	Persons       []models.PersonFavorite        `json:"persons"`
	Casts         []models.CastFavorite          `json:"casts"`
}

func GetUserFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")

	var favorites UserFavorites

	db := deps.GetDB(c)
	db.Where("user_id = ?", userID).Preload("Movie").Find(&favorites.Movies)
	db.Where("user_id = ?", userID).Preload("TVSeries").Find(&favorites.TVSeries)
	db.Where("user_id = ?", userID).Preload("AnimeSeries").Find(&favorites.AnimeSeries)
	db.Where("user_id = ?", userID).Preload("CartoonSeries").Find(&favorites.CartoonSeries)
	db.Where("user_id = ?", userID).Preload("CartoonMovie").Find(&favorites.CartoonMovies)
	db.Where("user_id = ?", userID).Preload("AnimeMovie").Find(&favorites.AnimeMovies)
	db.Where("user_id = ?", userID).Preload("Game").Find(&favorites.Games)
	db.Where("user_id = ?", userID).Preload("Manga").Find(&favorites.Manga)
	db.Where("user_id = ?", userID).Preload("Book").Find(&favorites.Books)
	db.Where("user_id = ?", userID).Preload("LightNovel").Find(&favorites.LightNovels)
	db.Where("user_id = ?", userID).Preload("Character").Find(&favorites.Characters)
	db.Where("user_id = ?", userID).Preload("Person").Find(&favorites.Persons)
	db.Where("user_id = ?", userID).Preload("Cast.Character").Preload("Cast.Person").Find(&favorites.Casts)

	c.JSON(http.StatusOK, favorites)
}

// GET /users/username/:username/favorites. Требует MustCanViewUserProfile.
func GetUserFavoritesByUsername(c *gin.Context) {
	username := strings.TrimSpace(strings.ToLower(c.Param("username")))
	if username == "" {
		api.RespondBadRequest(c, "Username required", nil)
		return
	}
	db := deps.GetDB(c)
	var owner models.User
	if err := db.Where("username = ?", username).First(&owner).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	if !MustCanViewUserProfile(c, owner.ID) {
		return
	}
	ownerID := owner.ID

	var favorites UserFavorites
	db.Where("user_id = ?", ownerID).Preload("Movie").Find(&favorites.Movies)
	db.Where("user_id = ?", ownerID).Preload("TVSeries").Find(&favorites.TVSeries)
	db.Where("user_id = ?", ownerID).Preload("AnimeSeries").Find(&favorites.AnimeSeries)
	db.Where("user_id = ?", ownerID).Preload("CartoonSeries").Find(&favorites.CartoonSeries)
	db.Where("user_id = ?", ownerID).Preload("CartoonMovie").Find(&favorites.CartoonMovies)
	db.Where("user_id = ?", ownerID).Preload("AnimeMovie").Find(&favorites.AnimeMovies)
	db.Where("user_id = ?", ownerID).Preload("Game").Find(&favorites.Games)
	db.Where("user_id = ?", ownerID).Preload("Manga").Find(&favorites.Manga)
	db.Where("user_id = ?", ownerID).Preload("Book").Find(&favorites.Books)
	db.Where("user_id = ?", ownerID).Preload("LightNovel").Find(&favorites.LightNovels)
	db.Where("user_id = ?", ownerID).Preload("Character").Find(&favorites.Characters)
	db.Where("user_id = ?", ownerID).Preload("Person").Find(&favorites.Persons)
	db.Where("user_id = ?", ownerID).Preload("Cast.Character").Preload("Cast.Person").Find(&favorites.Casts)
	c.JSON(http.StatusOK, favorites)
}

func AddMovieToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	movieID, _ := strconv.ParseUint(c.Param("movieId"), 10, 32)

	var movie models.Movie
	if err := deps.GetDB(c).First(&movie, movieID).Error; err != nil {
		api.RespondNotFound(c, "Movie not found")
		return
	}

	var existing models.MovieFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND movie_id = ?", userID, movieID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.MovieFavorite{UserID: userID.(uint), MovieID: uint(movieID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeFavoriteAdd, "movies", uint(movieID), movie.Title, nil)
	c.JSON(http.StatusCreated, favorite)
}

func RemoveMovieFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	movieID := c.Param("movieId")

	result := deps.GetDB(c).Where("user_id = ? AND movie_id = ?", userID, movieID).Delete(&models.MovieFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddAnimeToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	animeID, _ := strconv.ParseUint(c.Param("animeId"), 10, 32)

	var anime models.AnimeSeries
	if err := deps.GetDB(c).First(&anime, animeID).Error; err != nil {
		api.RespondNotFound(c, "Anime not found")
		return
	}

	var existing models.AnimeSeriesFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND anime_series_id = ?", userID, animeID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.AnimeSeriesFavorite{UserID: userID.(uint), AnimeSeriesID: uint(animeID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeFavoriteAdd, "anime", uint(animeID), anime.Title, nil)
	c.JSON(http.StatusCreated, favorite)
}

func RemoveAnimeFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	animeID := c.Param("animeId")

	result := deps.GetDB(c).Where("user_id = ? AND anime_series_id = ?", userID, animeID).Delete(&models.AnimeSeriesFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddGameToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	gameID, _ := strconv.ParseUint(c.Param("gameId"), 10, 32)

	var game models.Game
	if err := deps.GetDB(c).First(&game, gameID).Error; err != nil {
		api.RespondNotFound(c, "Game not found")
		return
	}

	var existing models.GameFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND game_id = ?", userID, gameID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.GameFavorite{UserID: userID.(uint), GameID: uint(gameID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeFavoriteAdd, "games", uint(gameID), game.Title, nil)
	c.JSON(http.StatusCreated, favorite)
}

func RemoveGameFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	gameID := c.Param("gameId")

	result := deps.GetDB(c).Where("user_id = ? AND game_id = ?", userID, gameID).Delete(&models.GameFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddMangaToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	mangaID, _ := strconv.ParseUint(c.Param("mangaId"), 10, 32)

	var manga models.Manga
	if err := deps.GetDB(c).First(&manga, mangaID).Error; err != nil {
		api.RespondNotFound(c, "Manga not found")
		return
	}

	var existing models.MangaFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND manga_id = ?", userID, mangaID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.MangaFavorite{UserID: userID.(uint), MangaID: uint(mangaID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeFavoriteAdd, "manga", uint(mangaID), manga.Title, nil)
	c.JSON(http.StatusCreated, favorite)
}

func RemoveMangaFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	mangaID := c.Param("mangaId")

	result := deps.GetDB(c).Where("user_id = ? AND manga_id = ?", userID, mangaID).Delete(&models.MangaFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddBookToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	bookID, _ := strconv.ParseUint(c.Param("bookId"), 10, 32)

	var book models.Book
	if err := deps.GetDB(c).First(&book, bookID).Error; err != nil {
		api.RespondNotFound(c, "Book not found")
		return
	}

	var existing models.BookFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND book_id = ?", userID, bookID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.BookFavorite{UserID: userID.(uint), BookID: uint(bookID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeFavoriteAdd, "books", uint(bookID), book.Title, nil)
	c.JSON(http.StatusCreated, favorite)
}

func RemoveBookFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	bookID := c.Param("bookId")

	result := deps.GetDB(c).Where("user_id = ? AND book_id = ?", userID, bookID).Delete(&models.BookFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddLightNovelToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	novelID, _ := strconv.ParseUint(c.Param("novelId"), 10, 32)

	var novel models.LightNovel
	if err := deps.GetDB(c).First(&novel, novelID).Error; err != nil {
		api.RespondNotFound(c, "Light novel not found")
		return
	}

	var existing models.LightNovelFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND light_novel_id = ?", userID, novelID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.LightNovelFavorite{UserID: userID.(uint), LightNovelID: uint(novelID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	CreateActivityForUser(userID.(uint), models.ActivityTypeFavoriteAdd, "light-novels", uint(novelID), novel.Title, nil)
	c.JSON(http.StatusCreated, favorite)
}

func RemoveLightNovelFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	novelID := c.Param("novelId")

	result := deps.GetDB(c).Where("user_id = ? AND light_novel_id = ?", userID, novelID).Delete(&models.LightNovelFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddCharacterToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	characterID, _ := strconv.ParseUint(c.Param("characterId"), 10, 32)

	var character models.Character
	if err := deps.GetDB(c).First(&character, characterID).Error; err != nil {
		api.RespondNotFound(c, "Character not found")
		return
	}

	var existing models.CharacterFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND character_id = ?", userID, characterID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.CharacterFavorite{UserID: userID.(uint), CharacterID: uint(characterID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

func RemoveCharacterFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	characterID := c.Param("characterId")

	result := deps.GetDB(c).Where("user_id = ? AND character_id = ?", userID, characterID).Delete(&models.CharacterFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddPersonToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	personID, _ := strconv.ParseUint(c.Param("personId"), 10, 32)

	var person models.Person
	if err := deps.GetDB(c).First(&person, personID).Error; err != nil {
		api.RespondNotFound(c, "Person not found")
		return
	}

	var existing models.PersonFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND person_id = ?", userID, personID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.PersonFavorite{UserID: userID.(uint), PersonID: uint(personID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

func RemovePersonFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	personID := c.Param("personId")

	result := deps.GetDB(c).Where("user_id = ? AND person_id = ?", userID, personID).Delete(&models.PersonFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddTVSeriesToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	tvSeriesID, _ := strconv.ParseUint(c.Param("tvSeriesId"), 10, 32)

	var tvSeries models.TVSeries
	if err := deps.GetDB(c).First(&tvSeries, tvSeriesID).Error; err != nil {
		api.RespondNotFound(c, "TV series not found")
		return
	}

	var existing models.TVSeriesFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND tv_series_id = ?", userID, tvSeriesID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.TVSeriesFavorite{UserID: userID.(uint), TVSeriesID: uint(tvSeriesID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

func RemoveTVSeriesFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	tvSeriesID := c.Param("tvSeriesId")

	result := deps.GetDB(c).Where("user_id = ? AND tv_series_id = ?", userID, tvSeriesID).Delete(&models.TVSeriesFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddCartoonSeriesToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	cartoonSeriesID, _ := strconv.ParseUint(c.Param("cartoonSeriesId"), 10, 32)

	var cartoonSeries models.CartoonSeries
	if err := deps.GetDB(c).First(&cartoonSeries, cartoonSeriesID).Error; err != nil {
		api.RespondNotFound(c, "Cartoon series not found")
		return
	}

	var existing models.CartoonSeriesFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND cartoon_series_id = ?", userID, cartoonSeriesID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.CartoonSeriesFavorite{UserID: userID.(uint), CartoonSeriesID: uint(cartoonSeriesID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

func RemoveCartoonSeriesFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	cartoonSeriesID := c.Param("cartoonSeriesId")

	result := deps.GetDB(c).Where("user_id = ? AND cartoon_series_id = ?", userID, cartoonSeriesID).Delete(&models.CartoonSeriesFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddCartoonMovieToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	cartoonMovieID, _ := strconv.ParseUint(c.Param("cartoonMovieId"), 10, 32)

	var cartoonMovie models.CartoonMovie
	if err := deps.GetDB(c).First(&cartoonMovie, cartoonMovieID).Error; err != nil {
		api.RespondNotFound(c, "Cartoon movie not found")
		return
	}

	var existing models.CartoonMovieFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND cartoon_movie_id = ?", userID, cartoonMovieID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.CartoonMovieFavorite{UserID: userID.(uint), CartoonMovieID: uint(cartoonMovieID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

func RemoveCartoonMovieFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	cartoonMovieID := c.Param("cartoonMovieId")

	result := deps.GetDB(c).Where("user_id = ? AND cartoon_movie_id = ?", userID, cartoonMovieID).Delete(&models.CartoonMovieFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddAnimeMovieToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	animeMovieID, _ := strconv.ParseUint(c.Param("animeMovieId"), 10, 32)

	var animeMovie models.AnimeMovie
	if err := deps.GetDB(c).First(&animeMovie, animeMovieID).Error; err != nil {
		api.RespondNotFound(c, "Anime movie not found")
		return
	}

	var existing models.AnimeMovieFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND anime_movie_id = ?", userID, animeMovieID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.AnimeMovieFavorite{UserID: userID.(uint), AnimeMovieID: uint(animeMovieID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

func RemoveAnimeMovieFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	animeMovieID := c.Param("animeMovieId")

	result := deps.GetDB(c).Where("user_id = ? AND anime_movie_id = ?", userID, animeMovieID).Delete(&models.AnimeMovieFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}

func AddCastToFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	castID, _ := strconv.ParseUint(c.Param("castId"), 10, 32)

	var cast models.Cast
	if err := deps.GetDB(c).First(&cast, castID).Error; err != nil {
		api.RespondNotFound(c, "Cast not found")
		return
	}

	var existing models.CastFavorite
	if err := deps.GetDB(c).Where("user_id = ? AND cast_id = ?", userID, castID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already in favorites")
		return
	}

	favorite := models.CastFavorite{UserID: userID.(uint), CastID: uint(castID)}
	if err := deps.GetDB(c).Create(&favorite).Error; err != nil {
		api.RespondInternal(c, "Failed to add to favorites")
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

func RemoveCastFromFavorites(c *gin.Context) {
	userID, _ := c.Get("userID")
	castID := c.Param("castId")

	result := deps.GetDB(c).Where("user_id = ? AND cast_id = ?", userID, castID).Delete(&models.CastFavorite{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not in favorites")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from favorites"})
}
