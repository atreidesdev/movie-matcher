package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

// Типы медиа для единого роута /api/v1/media/:type. Ключ — значение :type в URL.
const (
	MediaTypeMovies         = "movies"
	MediaTypeAnime          = "anime"
	MediaTypeGames          = "games"
	MediaTypeTVSeries       = "tv-series"
	MediaTypeCartoonSeries  = "cartoon-series"
	MediaTypeCartoonMovies  = "cartoon-movies"
	MediaTypeAnimeMovies    = "anime-movies"
	MediaTypeManga          = "manga"
	MediaTypeBooks          = "books"
	MediaTypeLightNovels    = "light-novels"
)

var (
	mediaListHandlers = map[string]gin.HandlerFunc{
		MediaTypeMovies:        handlers.GetMovies,
		MediaTypeAnime:         handlers.GetAnimeSeries,
		MediaTypeGames:         handlers.GetGames,
		MediaTypeTVSeries:      handlers.GetTVSeriesList,
		MediaTypeCartoonSeries: handlers.GetCartoonSeriesList,
		MediaTypeCartoonMovies: handlers.GetCartoonMovies,
		MediaTypeAnimeMovies:   handlers.GetAnimeMovies,
		MediaTypeManga:         handlers.GetMangaList,
		MediaTypeBooks:         handlers.GetBooks,
		MediaTypeLightNovels:   handlers.GetLightNovels,
	}
	mediaGetHandlers = map[string]gin.HandlerFunc{
		MediaTypeMovies:        handlers.GetMovie,
		MediaTypeAnime:         handlers.GetAnimeSeriesById,
		MediaTypeGames:         handlers.GetGame,
		MediaTypeTVSeries:      handlers.GetTVSeries,
		MediaTypeCartoonSeries: handlers.GetCartoonSeries,
		MediaTypeCartoonMovies: handlers.GetCartoonMovie,
		MediaTypeAnimeMovies:   handlers.GetAnimeMovie,
		MediaTypeManga:         handlers.GetManga,
		MediaTypeBooks:         handlers.GetBook,
		MediaTypeLightNovels:   handlers.GetLightNovel,
	}
	mediaPopularHandlers = map[string]gin.HandlerFunc{
		MediaTypeMovies:        handlers.GetPopularMoviesV2,
		MediaTypeAnime:         handlers.GetPopularAnimeV2,
		MediaTypeGames:         handlers.GetPopularGamesV2,
		MediaTypeTVSeries:      handlers.GetPopularTVSeriesV2,
		MediaTypeCartoonSeries: handlers.GetPopularCartoonSeriesV2,
		MediaTypeCartoonMovies: handlers.GetPopularCartoonMoviesV2,
		MediaTypeAnimeMovies:   handlers.GetPopularAnimeMoviesV2,
		MediaTypeManga:         handlers.GetPopularMangaV2,
		MediaTypeBooks:         handlers.GetPopularBooksV2,
		MediaTypeLightNovels:   handlers.GetPopularLightNovelsV2,
	}
	mediaSearchHandlers = map[string]gin.HandlerFunc{
		MediaTypeMovies:        handlers.SearchMovies,
		MediaTypeAnime:         handlers.SearchAnime,
		MediaTypeGames:         handlers.SearchGames,
		MediaTypeTVSeries:      handlers.SearchTVSeries,
		MediaTypeCartoonSeries: handlers.SearchCartoonSeries,
		MediaTypeCartoonMovies: handlers.SearchCartoonMovies,
		MediaTypeAnimeMovies:   handlers.SearchAnimeMovies,
		MediaTypeManga:         handlers.SearchManga,
		MediaTypeBooks:         handlers.SearchBooks,
		MediaTypeLightNovels:   handlers.SearchLightNovels,
	}
	mediaFiltersHandlers = map[string]gin.HandlerFunc{
		MediaTypeMovies:        handlers.GetMovieFilters,
		MediaTypeTVSeries:      handlers.GetTVSeriesFilters,
		MediaTypeCartoonSeries: handlers.GetCartoonSeriesFilters,
		MediaTypeCartoonMovies: handlers.GetCartoonMovieFilters,
		MediaTypeAnime:         handlers.GetAnimeFilters,
		MediaTypeAnimeMovies:   handlers.GetAnimeMovieFilters,
		MediaTypeGames:         handlers.GetGameFilters,
		MediaTypeManga:         handlers.GetMangaFilters,
		MediaTypeBooks:         handlers.GetBookFilters,
		MediaTypeLightNovels:   handlers.GetLightNovelFilters,
	}
	mediaReviewsHandlers = map[string]gin.HandlerFunc{
		MediaTypeMovies:        handlers.GetMovieReviews,
		MediaTypeTVSeries:      handlers.GetTVSeriesReviews,
		MediaTypeCartoonSeries: handlers.GetCartoonSeriesReviews,
		MediaTypeCartoonMovies: handlers.GetCartoonMovieReviews,
		MediaTypeAnime:         handlers.GetAnimeReviews,
		MediaTypeAnimeMovies:   handlers.GetAnimeMovieReviews,
		MediaTypeGames:         handlers.GetGameReviews,
		MediaTypeManga:         handlers.GetMangaReviews,
		MediaTypeBooks:         handlers.GetBookReviews,
		MediaTypeLightNovels:   handlers.GetLightNovelReviews,
	}
)

func mediaDispatch(c *gin.Context, m map[string]gin.HandlerFunc, unknownMessage string) {
	typ := c.Param("type")
	if typ == "" {
		api.RespondBadRequest(c, "media type is required", nil)
		return
	}
	h, ok := m[typ]
	if !ok {
		api.RespondNotFound(c, unknownMessage)
		return
	}
	h(c)
}

func mediaListDispatcher(c *gin.Context)   { mediaDispatch(c, mediaListHandlers, "Unknown media type") }
func mediaGetDispatcher(c *gin.Context)    { mediaDispatch(c, mediaGetHandlers, "Unknown media type") }
func mediaPopularDispatcher(c *gin.Context) { mediaDispatch(c, mediaPopularHandlers, "Unknown media type") }
func mediaSearchDispatcher(c *gin.Context) { mediaDispatch(c, mediaSearchHandlers, "Unknown media type") }

func mediaFiltersDispatcher(c *gin.Context) {
	typ := c.Param("type")
	if typ == "" {
		api.RespondBadRequest(c, "media type is required", nil)
		return
	}
	h, ok := mediaFiltersHandlers[typ]
	if !ok {
		c.JSON(http.StatusOK, gin.H{"sortOptions": []string{}, "orderOptions": []string{}, "genres": []interface{}{}, "themes": []interface{}{}})
		return
	}
	h(c)
}

func mediaReviewsDispatcher(c *gin.Context) {
	mediaDispatch(c, mediaReviewsHandlers, "Reviews not available for this media type")
}

// Старые URL (/movies, /anime, ...) сохраняются в registerMedia.
func registerMediaUnified(api *gin.RouterGroup) {
	media := api.Group("/media")
	media.GET("/:type/:id/reviews-from-similar-users", middleware.OptionalAuthMiddleware(), handlers.GetMediaReviewsFromSimilarUsers)
	media.GET("/:type/:id/similar-users-ratings", middleware.OptionalAuthMiddleware(), handlers.GetMediaListRatingsFromSimilarUsers)
	media.GET("/:type/:id/reviews", mediaReviewsDispatcher)
	media.GET("/:type/:id", mediaGetDispatcher)
	media.GET("/:type/popular", mediaPopularDispatcher)
	media.GET("/:type/search", mediaSearchDispatcher)
	media.GET("/:type/filters", mediaFiltersDispatcher)
	media.GET("/:type", mediaListDispatcher)
}
