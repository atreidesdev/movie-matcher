package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

func EnrichMoviesWithListStatus(c *gin.Context, db *gorm.DB, movies *[]models.Movie) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*movies) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*movies))
	for i := range *movies {
		ids = append(ids, (*movies)[i].ID)
	}
	var list []models.MovieList
	if err := db.Where("user_id = ? AND movie_id IN ?", userID, ids).Find(&list).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range list {
		statusByID[l.MovieID] = l.Status
	}
	for i := range *movies {
		if s, ok := statusByID[(*movies)[i].ID]; ok {
			(*movies)[i].ListStatus = &s
		}
	}
}

func EnrichTVSeriesWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.TVSeries) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.TVSeriesList
	if err := db.Where("user_id = ? AND tv_series_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.TVSeriesID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichAnimeSeriesWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.AnimeSeries) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.AnimeSeriesList
	if err := db.Where("user_id = ? AND anime_series_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.AnimeSeriesID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichCartoonSeriesWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.CartoonSeries) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.CartoonSeriesList
	if err := db.Where("user_id = ? AND cartoon_series_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.CartoonSeriesID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichCartoonMoviesWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.CartoonMovie) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.CartoonMovieList
	if err := db.Where("user_id = ? AND cartoon_movie_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.CartoonMovieID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichAnimeMoviesWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.AnimeMovie) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.AnimeMovieList
	if err := db.Where("user_id = ? AND anime_movie_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.AnimeMovieID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichMangaWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.Manga) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.MangaList
	if err := db.Where("user_id = ? AND manga_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.MangaID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichGamesWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.Game) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.GameList
	if err := db.Where("user_id = ? AND game_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.GameID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichBooksWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.Book) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.BookList
	if err := db.Where("user_id = ? AND book_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.BookID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}

func EnrichLightNovelsWithListStatus(c *gin.Context, db *gorm.DB, list *[]models.LightNovel) {
	userIDVal, ok := c.Get("userID")
	if !ok || len(*list) == 0 {
		return
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(*list))
	for i := range *list {
		ids = append(ids, (*list)[i].ID)
	}
	var rows []models.LightNovelList
	if err := db.Where("user_id = ? AND light_novel_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return
	}
	statusByID := make(map[uint]models.ListStatus)
	for _, l := range rows {
		statusByID[l.LightNovelID] = l.Status
	}
	for i := range *list {
		if s, ok := statusByID[(*list)[i].ID]; ok {
			(*list)[i].ListStatus = &s
		}
	}
}
