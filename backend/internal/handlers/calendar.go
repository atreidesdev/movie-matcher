package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

type CalendarRelease struct {
	ID          uint        `json:"id"`
	Title       string      `json:"title"`
	TitleI18n   interface{} `json:"titleI18n,omitempty"`
	Poster      *string     `json:"poster,omitempty"`
	ReleaseDate string      `json:"releaseDate"` // YYYY-MM-DD
	MediaType   string      `json:"mediaType"`
	ListStatus  *string     `json:"listStatus,omitempty"`
}

// GetCalendarReleases godoc
// @Summary  Get calendar releases
// @Tags     Calendar
// @Param    from       query  string  true   "From date YYYY-MM-DD"
// @Param    to         query  string  true   "To date YYYY-MM-DD"
// @Param    mediaType  query  string  false  "movie|tv-series|anime|..."  default(movie)
// @Success  200  {array}  CalendarRelease
// @Router   /calendar/releases [get]
func GetCalendarReleases(c *gin.Context) {
	fromStr := c.Query("from")
	toStr := c.Query("to")
	if fromStr == "" || toStr == "" {
		api.RespondBadRequest(c, "from and to (YYYY-MM-DD) required", nil)
		return
	}
	from, err1 := time.Parse("2006-01-02", fromStr)
	to, err2 := time.Parse("2006-01-02", toStr)
	if err1 != nil || err2 != nil {
		api.RespondBadRequest(c, "from and to must be YYYY-MM-DD", nil)
		return
	}
	if from.After(to) {
		api.RespondBadRequest(c, "from must be before or equal to to", nil)
		return
	}
	mediaType := c.DefaultQuery("mediaType", "movie")
	// Конец дня to
	toEnd := to.Add(24*time.Hour - time.Second)

	db := deps.GetDB(c)
	var out []CalendarRelease
	switch mediaType {
	case "movie":
		out, err1 = getMovieReleases(db, c, from, toEnd)
	case "anime":
		out, err1 = getAnimeReleases(db, c, from, toEnd)
	case "tv-series":
		out, err1 = getTVSeriesReleases(db, c, from, toEnd)
	case "game":
		out, err1 = getGameReleases(db, c, from, toEnd)
	case "manga":
		out, err1 = getMangaReleases(db, c, from, toEnd)
	case "book":
		out, err1 = getBookReleases(db, c, from, toEnd)
	case "light-novel":
		out, err1 = getLightNovelReleases(db, c, from, toEnd)
	case "cartoon-series":
		out, err1 = getCartoonSeriesReleases(db, c, from, toEnd)
	case "cartoon-movies":
		out, err1 = getCartoonMovieReleases(db, c, from, toEnd)
	case "anime-movies":
		out, err1 = getAnimeMovieReleases(db, c, from, toEnd)
	default:
		api.RespondBadRequest(c, "invalid mediaType", nil)
		return
	}
	if err1 != nil {
		api.RespondInternal(c, "Failed to fetch releases")
		return
	}
	c.JSON(http.StatusOK, gin.H{"releases": out})
}

func getMovieReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.Movie
	q := db.Model(&models.Movie{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	EnrichMoviesWithListStatus(c, db, &list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "movie",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if m.ListStatus != nil {
			s := string(*m.ListStatus)
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getAnimeReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.AnimeSeries
	q := db.Model(&models.AnimeSeries{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getAnimeListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "anime",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getTVSeriesReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.TVSeries
	q := db.Model(&models.TVSeries{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getTVSeriesListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "tv-series",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getGameReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.Game
	q := db.Model(&models.Game{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getGameListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "game",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getMangaReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.Manga
	q := db.Model(&models.Manga{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getMangaListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "manga",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getBookReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.Book
	q := db.Model(&models.Book{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getBookListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "book",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getLightNovelReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.LightNovel
	q := db.Model(&models.LightNovel{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getLightNovelListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "light-novel",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getCartoonSeriesReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.CartoonSeries
	q := db.Model(&models.CartoonSeries{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getCartoonSeriesListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "cartoon-series",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getCartoonMovieReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.CartoonMovie
	q := db.Model(&models.CartoonMovie{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getCartoonMovieListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "cartoon-movies",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func getAnimeMovieReleases(db *gorm.DB, c *gin.Context, from, toEnd time.Time) ([]CalendarRelease, error) {
	var list []models.AnimeMovie
	q := db.Model(&models.AnimeMovie{}).Where("release_date >= ? AND release_date <= ?", from, toEnd)
	if ShouldApplyHiddenFilter(c, db) {
		q = q.Where("is_hidden = ?", false)
	}
	if err := q.Order("release_date ASC").Limit(500).Find(&list).Error; err != nil {
		return nil, err
	}
	statusByID := getAnimeMovieListStatusMap(c, db, list)
	out := make([]CalendarRelease, 0, len(list))
	for _, m := range list {
		rel := CalendarRelease{
			ID:          m.ID,
			Title:       m.Title,
			TitleI18n:   m.TitleI18n,
			Poster:      m.Poster,
			MediaType:   "anime-movies",
			ReleaseDate: formatReleaseDate(m.ReleaseDate),
		}
		if s, ok := statusByID[m.ID]; ok {
			rel.ListStatus = &s
		}
		out = append(out, rel)
	}
	return out, nil
}

func formatReleaseDate(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}

func getMovieListStatusMap(c *gin.Context, db *gorm.DB, list []models.Movie) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.MovieList
	if err := db.Where("user_id = ? AND movie_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.MovieID] = string(r.Status)
	}
	return out
}

func getAnimeListStatusMap(c *gin.Context, db *gorm.DB, list []models.AnimeSeries) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.AnimeSeriesList
	if err := db.Where("user_id = ? AND anime_series_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.AnimeSeriesID] = string(r.Status)
	}
	return out
}

func getTVSeriesListStatusMap(c *gin.Context, db *gorm.DB, list []models.TVSeries) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.TVSeriesList
	if err := db.Where("user_id = ? AND tv_series_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.TVSeriesID] = string(r.Status)
	}
	return out
}

func getGameListStatusMap(c *gin.Context, db *gorm.DB, list []models.Game) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.GameList
	if err := db.Where("user_id = ? AND game_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.GameID] = string(r.Status)
	}
	return out
}

func getMangaListStatusMap(c *gin.Context, db *gorm.DB, list []models.Manga) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.MangaList
	if err := db.Where("user_id = ? AND manga_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.MangaID] = string(r.Status)
	}
	return out
}

func getBookListStatusMap(c *gin.Context, db *gorm.DB, list []models.Book) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.BookList
	if err := db.Where("user_id = ? AND book_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.BookID] = string(r.Status)
	}
	return out
}

func getLightNovelListStatusMap(c *gin.Context, db *gorm.DB, list []models.LightNovel) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.LightNovelList
	if err := db.Where("user_id = ? AND light_novel_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.LightNovelID] = string(r.Status)
	}
	return out
}

func getCartoonSeriesListStatusMap(c *gin.Context, db *gorm.DB, list []models.CartoonSeries) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.CartoonSeriesList
	if err := db.Where("user_id = ? AND cartoon_series_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.CartoonSeriesID] = string(r.Status)
	}
	return out
}

func getCartoonMovieListStatusMap(c *gin.Context, db *gorm.DB, list []models.CartoonMovie) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.CartoonMovieList
	if err := db.Where("user_id = ? AND cartoon_movie_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.CartoonMovieID] = string(r.Status)
	}
	return out
}

func getAnimeMovieListStatusMap(c *gin.Context, db *gorm.DB, list []models.AnimeMovie) map[uint]string {
	out := make(map[uint]string)
	userIDVal, ok := c.Get("userID")
	if !ok || len(list) == 0 {
		return out
	}
	userID := userIDVal.(uint)
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var rows []models.AnimeMovieList
	if err := db.Where("user_id = ? AND anime_movie_id IN ?", userID, ids).Find(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.AnimeMovieID] = string(r.Status)
	}
	return out
}
