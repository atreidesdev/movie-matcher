package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerMedia(api *gin.RouterGroup) {
	movies := api.Group("/movies")
	{
		movies.GET("", middleware.OptionalAuthMiddleware(), handlers.GetMovies)
		movies.GET("/popular", handlers.GetPopularMovies)
		movies.GET("/search", handlers.SearchMovies)
		movies.GET("/filters", handlers.GetMovieFilters)
		movies.GET("/:id/reviews", handlers.GetMovieReviews)
		// listStatus у similar только для авторизованных
		movies.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetMovie)
	}

	anime := api.Group("/anime")
	{
		anime.GET("", middleware.OptionalAuthMiddleware(), handlers.GetAnimeSeries)
		anime.GET("/popular", handlers.GetPopularAnime)
		anime.GET("/search", handlers.SearchAnime)
		anime.GET("/:id/reviews", handlers.GetAnimeReviews)
		anime.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetAnimeSeriesById)
	}

	games := api.Group("/games")
	{
		games.GET("", middleware.OptionalAuthMiddleware(), handlers.GetGames)
		games.GET("/popular", handlers.GetPopularGames)
		games.GET("/search", handlers.SearchGames)
		games.GET("/filters", handlers.GetGameFilters)
		games.GET("/:id/reviews", handlers.GetGameReviews)
		games.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetGame)
	}

	tvseries := api.Group("/tv-series")
	{
		tvseries.GET("", middleware.OptionalAuthMiddleware(), handlers.GetTVSeriesList)
		tvseries.GET("/popular", handlers.GetPopularTVSeries)
		tvseries.GET("/search", handlers.SearchTVSeries)
		tvseries.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetTVSeries)
	}

	cartoonSeries := api.Group("/cartoon-series")
	{
		cartoonSeries.GET("", middleware.OptionalAuthMiddleware(), handlers.GetCartoonSeriesList)
		cartoonSeries.GET("/popular", handlers.GetPopularCartoonSeries)
		cartoonSeries.GET("/search", handlers.SearchCartoonSeries)
		cartoonSeries.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetCartoonSeries)
	}

	cartoonMovies := api.Group("/cartoon-movies")
	{
		cartoonMovies.GET("", middleware.OptionalAuthMiddleware(), handlers.GetCartoonMovies)
		cartoonMovies.GET("/popular", handlers.GetPopularCartoonMovies)
		cartoonMovies.GET("/search", handlers.SearchCartoonMovies)
		cartoonMovies.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetCartoonMovie)
	}

	animeMovies := api.Group("/anime-movies")
	{
		animeMovies.GET("", middleware.OptionalAuthMiddleware(), handlers.GetAnimeMovies)
		animeMovies.GET("/popular", handlers.GetPopularAnimeMovies)
		animeMovies.GET("/search", handlers.SearchAnimeMovies)
		animeMovies.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetAnimeMovie)
	}

	manga := api.Group("/manga")
	{
		manga.GET("", middleware.OptionalAuthMiddleware(), handlers.GetMangaList)
		manga.GET("/popular", handlers.GetPopularManga)
		manga.GET("/search", handlers.SearchManga)
		manga.GET("/:id/reviews", handlers.GetMangaReviews)
		manga.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetManga)
	}

	books := api.Group("/books")
	{
		books.GET("", middleware.OptionalAuthMiddleware(), handlers.GetBooks)
		books.GET("/popular", handlers.GetPopularBooks)
		books.GET("/search", handlers.SearchBooks)
		books.GET("/:id/reviews", handlers.GetBookReviews)
		books.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetBook)
	}

	lightNovels := api.Group("/light-novels")
	{
		lightNovels.GET("", middleware.OptionalAuthMiddleware(), handlers.GetLightNovels)
		lightNovels.GET("/popular", handlers.GetPopularLightNovels)
		lightNovels.GET("/search", handlers.SearchLightNovels)
		lightNovels.GET("/:id/reviews", handlers.GetLightNovelReviews)
		lightNovels.GET("/:id", middleware.OptionalAuthMiddleware(), handlers.GetLightNovel)
	}
}
