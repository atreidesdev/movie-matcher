package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerProtected(api *gin.RouterGroup) {
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		usersMe := protected.Group("/users/me")
		{
			usersMe.GET("/settings", handlers.GetMySettings)
			usersMe.PATCH("/settings", handlers.UpdateMySettings)
			usersMe.PATCH("", handlers.UpdateProfile)
			usersMe.POST("/change-password", handlers.ChangePassword)
			usersMe.POST("/avatar", handlers.UserUploadAvatar)
			usersMe.POST("/ping", handlers.PingMe)
		}

		lists := protected.Group("/lists")
		{
			lists.GET("/:type", handlers.GetUserList)
			lists.POST("/:type/:id", handlers.AddToList)
			lists.PUT("/:type/:id", handlers.UpdateInList)
			lists.DELETE("/:type/:id", handlers.RemoveFromList)
		}

		reviews := protected.Group("/reviews")
		{
			reviews.GET("", handlers.GetUserReviews)
			reviews.POST("/movies/:movieId", handlers.CreateMovieReview)
			reviews.PUT("/movies/:movieId", handlers.UpdateMovieReview)
			reviews.DELETE("/movies/:movieId", handlers.DeleteMovieReview)
			reviews.POST("/tv-series/:tvSeriesId", handlers.CreateTVSeriesReview)
			reviews.PUT("/tv-series/:tvSeriesId", handlers.UpdateTVSeriesReview)
			reviews.DELETE("/tv-series/:tvSeriesId", handlers.DeleteTVSeriesReview)
			reviews.POST("/cartoon-series/:cartoonSeriesId", handlers.CreateCartoonSeriesReview)
			reviews.PUT("/cartoon-series/:cartoonSeriesId", handlers.UpdateCartoonSeriesReview)
			reviews.DELETE("/cartoon-series/:cartoonSeriesId", handlers.DeleteCartoonSeriesReview)
			reviews.POST("/cartoon-movies/:cartoonMovieId", handlers.CreateCartoonMovieReview)
			reviews.PUT("/cartoon-movies/:cartoonMovieId", handlers.UpdateCartoonMovieReview)
			reviews.DELETE("/cartoon-movies/:cartoonMovieId", handlers.DeleteCartoonMovieReview)
			reviews.POST("/anime/:animeId", handlers.CreateAnimeReview)
			reviews.PUT("/anime/:animeId", handlers.UpdateAnimeReview)
			reviews.DELETE("/anime/:animeId", handlers.DeleteAnimeReview)
			reviews.POST("/anime-movies/:animeMovieId", handlers.CreateAnimeMovieReview)
			reviews.PUT("/anime-movies/:animeMovieId", handlers.UpdateAnimeMovieReview)
			reviews.DELETE("/anime-movies/:animeMovieId", handlers.DeleteAnimeMovieReview)
			reviews.POST("/games/:gameId", handlers.CreateGameReview)
			reviews.PUT("/games/:gameId", handlers.UpdateGameReview)
			reviews.DELETE("/games/:gameId", handlers.DeleteGameReview)
			reviews.POST("/manga/:mangaId", handlers.CreateMangaReview)
			reviews.PUT("/manga/:mangaId", handlers.UpdateMangaReview)
			reviews.DELETE("/manga/:mangaId", handlers.DeleteMangaReview)
			reviews.POST("/books/:bookId", handlers.CreateBookReview)
			reviews.PUT("/books/:bookId", handlers.UpdateBookReview)
			reviews.DELETE("/books/:bookId", handlers.DeleteBookReview)
			reviews.POST("/light-novels/:novelId", handlers.CreateLightNovelReview)
			reviews.PUT("/light-novels/:novelId", handlers.UpdateLightNovelReview)
			reviews.DELETE("/light-novels/:novelId", handlers.DeleteLightNovelReview)
		}

		collections := protected.Group("/collections")
		{
			collections.GET("", handlers.GetUserCollections)
			collections.POST("", handlers.CreateCollection)
			collections.GET("/:id", handlers.GetCollection)
			collections.PUT("/:id", handlers.UpdateCollection)
			collections.DELETE("/:id", handlers.DeleteCollection)

			collections.POST("/:id/movies", handlers.AddMovieToCollection)
			collections.DELETE("/:id/movies/:movieId", handlers.RemoveMovieFromCollection)
			collections.POST("/:id/tv-series", handlers.AddTVSeriesToCollection)
			collections.DELETE("/:id/tv-series/:tvSeriesId", handlers.RemoveTVSeriesFromCollection)
			collections.POST("/:id/anime", handlers.AddAnimeToCollection)
			collections.DELETE("/:id/anime/:animeId", handlers.RemoveAnimeFromCollection)
			collections.POST("/:id/cartoon-series", handlers.AddCartoonSeriesToCollection)
			collections.DELETE("/:id/cartoon-series/:cartoonSeriesId", handlers.RemoveCartoonSeriesFromCollection)
			collections.POST("/:id/cartoon-movies", handlers.AddCartoonMovieToCollection)
			collections.DELETE("/:id/cartoon-movies/:cartoonMovieId", handlers.RemoveCartoonMovieFromCollection)
			collections.POST("/:id/anime-movies", handlers.AddAnimeMovieToCollection)
			collections.DELETE("/:id/anime-movies/:animeMovieId", handlers.RemoveAnimeMovieFromCollection)
			collections.POST("/:id/games", handlers.AddGameToCollection)
			collections.DELETE("/:id/games/:gameId", handlers.RemoveGameFromCollection)
			collections.POST("/:id/manga", handlers.AddMangaToCollection)
			collections.DELETE("/:id/manga/:mangaId", handlers.RemoveMangaFromCollection)
			collections.POST("/:id/books", handlers.AddBookToCollection)
			collections.DELETE("/:id/books/:bookId", handlers.RemoveBookFromCollection)
			collections.POST("/:id/light-novels", handlers.AddLightNovelToCollection)
			collections.DELETE("/:id/light-novels/:novelId", handlers.RemoveLightNovelFromCollection)
		}

		recommendations := protected.Group("/recommendations")
		{
			recommendations.GET("", handlers.GetRecommendations)
			recommendations.GET("/similar/:mediaType/:mediaId", handlers.GetSimilarMedia)
			recommendations.GET("/similar-users", handlers.GetSimilarUsers)
		}

		protected.POST("/reports", handlers.CreateReport)

		favorites := protected.Group("/favorites")
		{
			favorites.GET("", handlers.GetUserFavorites)
			favorites.POST("/movies/:movieId", handlers.AddMovieToFavorites)
			favorites.DELETE("/movies/:movieId", handlers.RemoveMovieFromFavorites)
			favorites.POST("/tv-series/:tvSeriesId", handlers.AddTVSeriesToFavorites)
			favorites.DELETE("/tv-series/:tvSeriesId", handlers.RemoveTVSeriesFromFavorites)
			favorites.POST("/anime/:animeId", handlers.AddAnimeToFavorites)
			favorites.DELETE("/anime/:animeId", handlers.RemoveAnimeFromFavorites)
			favorites.POST("/cartoon-series/:cartoonSeriesId", handlers.AddCartoonSeriesToFavorites)
			favorites.DELETE("/cartoon-series/:cartoonSeriesId", handlers.RemoveCartoonSeriesFromFavorites)
			favorites.POST("/cartoon-movies/:cartoonMovieId", handlers.AddCartoonMovieToFavorites)
			favorites.DELETE("/cartoon-movies/:cartoonMovieId", handlers.RemoveCartoonMovieFromFavorites)
			favorites.POST("/anime-movies/:animeMovieId", handlers.AddAnimeMovieToFavorites)
			favorites.DELETE("/anime-movies/:animeMovieId", handlers.RemoveAnimeMovieFromFavorites)
			favorites.POST("/games/:gameId", handlers.AddGameToFavorites)
			favorites.DELETE("/games/:gameId", handlers.RemoveGameFromFavorites)
			favorites.POST("/manga/:mangaId", handlers.AddMangaToFavorites)
			favorites.DELETE("/manga/:mangaId", handlers.RemoveMangaFromFavorites)
			favorites.POST("/books/:bookId", handlers.AddBookToFavorites)
			favorites.DELETE("/books/:bookId", handlers.RemoveBookFromFavorites)
			favorites.POST("/light-novels/:novelId", handlers.AddLightNovelToFavorites)
			favorites.DELETE("/light-novels/:novelId", handlers.RemoveLightNovelFromFavorites)
			favorites.POST("/characters/:characterId", handlers.AddCharacterToFavorites)
			favorites.DELETE("/characters/:characterId", handlers.RemoveCharacterFromFavorites)
			favorites.POST("/persons/:personId", handlers.AddPersonToFavorites)
			favorites.DELETE("/persons/:personId", handlers.RemovePersonFromFavorites)
			favorites.POST("/cast/:castId", handlers.AddCastToFavorites)
			favorites.DELETE("/cast/:castId", handlers.RemoveCastFromFavorites)
		}

		notifications := protected.Group("/notifications")
		{
			notifications.GET("", handlers.GetNotifications)
			notifications.PATCH("/:id/read", handlers.MarkNotificationRead)
			notifications.POST("/read-all", handlers.MarkAllNotificationsRead)
			notifications.POST("/push-subscribe", handlers.PushSubscribe)
		}

		activity := protected.Group("/activity")
		{
			activity.GET("/me", handlers.GetMyActivity)
			activity.GET("/feed", handlers.GetActivityFeed)
		}

		friends := protected.Group("/friends")
		{
			friends.GET("", handlers.GetFriends)
			friends.DELETE("/:friendId", handlers.RemoveFriend)
			friends.GET("/requests", handlers.GetFriendRequests)
			friends.POST("/requests/:id/accept", handlers.AcceptFriendRequest)
			friends.POST("/requests/:id/reject", handlers.RejectFriendRequest)
			friends.DELETE("/requests/:id", handlers.CancelFriendRequest)
			friends.POST("/requests/:id", handlers.SendFriendRequest)
		}

		messages := protected.Group("/messages")
		{
			messages.GET("/conversations", handlers.GetConversations)
			messages.GET("/conversations/with/:friendId", handlers.GetOrCreateConversation)
			messages.GET("/conversations/:conversationId/messages", handlers.GetMessages)
			messages.POST("/conversations/:conversationId/messages", handlers.SendMessage)
			messages.POST("/conversations/:conversationId/read", handlers.MarkConversationRead)
		}

		social := protected.Group("/social")
		{
			social.POST("/follow/:userId", handlers.FollowUser)
			social.DELETE("/follow/:userId", handlers.UnfollowUser)
			social.GET("/followers", handlers.GetFollowers)
			social.GET("/following", handlers.GetFollowing)
		}

		discussions := protected.Group("/discussions")
		{
			discussions.POST("", handlers.CreateDiscussion)
			discussions.POST("/:id/comments", handlers.CreateDiscussionComment)
			discussions.PUT("/:id/comments/:commentId", handlers.UpdateDiscussionComment)
			discussions.DELETE("/:id/comments/:commentId", handlers.DeleteDiscussionComment)
		}

		commentsProtected := protected.Group("/comments")
		{
			commentsProtected.POST("/movies/:id", handlers.CreateMovieComment)
			commentsProtected.PUT("/movies/:id", handlers.UpdateMovieComment)
			commentsProtected.DELETE("/movies/:id", handlers.DeleteMovieComment)
			commentsProtected.POST("/tv-series/:id", handlers.CreateTVSeriesComment)
			commentsProtected.PUT("/tv-series/:id", handlers.UpdateTVSeriesComment)
			commentsProtected.DELETE("/tv-series/:id", handlers.DeleteTVSeriesComment)
			commentsProtected.POST("/cartoon-series/:id", handlers.CreateCartoonSeriesComment)
			commentsProtected.PUT("/cartoon-series/:id", handlers.UpdateCartoonSeriesComment)
			commentsProtected.DELETE("/cartoon-series/:id", handlers.DeleteCartoonSeriesComment)
			commentsProtected.POST("/cartoon-movies/:id", handlers.CreateCartoonMovieComment)
			commentsProtected.PUT("/cartoon-movies/:id", handlers.UpdateCartoonMovieComment)
			commentsProtected.DELETE("/cartoon-movies/:id", handlers.DeleteCartoonMovieComment)
			commentsProtected.POST("/anime/:id", handlers.CreateAnimeComment)
			commentsProtected.PUT("/anime/:id", handlers.UpdateAnimeComment)
			commentsProtected.DELETE("/anime/:id", handlers.DeleteAnimeComment)
			commentsProtected.POST("/anime-movies/:id", handlers.CreateAnimeMovieComment)
			commentsProtected.PUT("/anime-movies/:id", handlers.UpdateAnimeMovieComment)
			commentsProtected.DELETE("/anime-movies/:id", handlers.DeleteAnimeMovieComment)
			commentsProtected.POST("/games/:id", handlers.CreateGameComment)
			commentsProtected.PUT("/games/:id", handlers.UpdateGameComment)
			commentsProtected.DELETE("/games/:id", handlers.DeleteGameComment)
			commentsProtected.POST("/manga/:id", handlers.CreateMangaComment)
			commentsProtected.PUT("/manga/:id", handlers.UpdateMangaComment)
			commentsProtected.DELETE("/manga/:id", handlers.DeleteMangaComment)
			commentsProtected.POST("/books/:id", handlers.CreateBookComment)
			commentsProtected.PUT("/books/:id", handlers.UpdateBookComment)
			commentsProtected.DELETE("/books/:id", handlers.DeleteBookComment)
			commentsProtected.POST("/light-novels/:id", handlers.CreateLightNovelComment)
			commentsProtected.PUT("/light-novels/:id", handlers.UpdateLightNovelComment)
			commentsProtected.DELETE("/light-novels/:id", handlers.DeleteLightNovelComment)
			commentsProtected.POST("/persons/:id", handlers.CreatePersonComment)
			commentsProtected.PUT("/persons/:id", handlers.UpdatePersonComment)
			commentsProtected.DELETE("/persons/:id", handlers.DeletePersonComment)
			commentsProtected.POST("/characters/:id", handlers.CreateCharacterComment)
			commentsProtected.PUT("/characters/:id", handlers.UpdateCharacterComment)
			commentsProtected.DELETE("/characters/:id", handlers.DeleteCharacterComment)
		}

		reviewReactions := protected.Group("/review-reactions")
		{
			reviewReactions.POST("", handlers.SetReviewReaction)
			reviewReactions.DELETE("/:targetType/:targetId", handlers.DeleteReviewReaction)
		}

		commentEmojiReactions := protected.Group("/comment-emoji-reactions")
		{
			commentEmojiReactions.POST("", handlers.SetCommentEmojiReaction)
			commentEmojiReactions.DELETE("/:entityType/:commentId", handlers.DeleteCommentEmojiReaction)
		}

		bookmarks := protected.Group("/bookmarks")
		{
			bookmarks.GET("", handlers.GetBookmarks)
			bookmarks.GET("/check/:targetType/:targetId", handlers.GetBookmarkCheck)
			bookmarks.POST("", handlers.AddBookmark)
			bookmarks.DELETE("/:targetType/:targetId", handlers.RemoveBookmark)
		}

		protected.POST("/movies/:id/comments/:commentId/reaction", handlers.SetCommentReactionMovie)
		protected.POST("/tv-series/:id/comments/:commentId/reaction", handlers.SetCommentReactionTVSeries)
		protected.POST("/cartoon-series/:id/comments/:commentId/reaction", handlers.SetCommentReactionCartoonSeries)
		protected.POST("/cartoon-movies/:id/comments/:commentId/reaction", handlers.SetCommentReactionCartoonMovie)
		protected.POST("/anime/:id/comments/:commentId/reaction", handlers.SetCommentReactionAnime)
		protected.POST("/anime-movies/:id/comments/:commentId/reaction", handlers.SetCommentReactionAnimeMovie)
		protected.POST("/games/:id/comments/:commentId/reaction", handlers.SetCommentReactionGame)
		protected.POST("/manga/:id/comments/:commentId/reaction", handlers.SetCommentReactionManga)
		protected.POST("/books/:id/comments/:commentId/reaction", handlers.SetCommentReactionBook)
		protected.POST("/light-novels/:id/comments/:commentId/reaction", handlers.SetCommentReactionLightNovel)
	}
}
