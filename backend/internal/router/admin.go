package router

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/handlers"
	"github.com/movie-matcher/backend/internal/middleware"
)

func registerAdmin(api *gin.RouterGroup) {
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	{
		adminOnly := admin.Group("")
		adminOnly.Use(middleware.AdminMiddleware())
		{
			adminOnly.POST("/popularity/recalculate", handlers.AdminRecalculatePopularity)
			adminOnly.POST("/popularity/decay", handlers.AdminApplyDecay)
			adminOnly.POST("/achievements/recalculate", handlers.AdminRecalculateAchievements)
			adminOnly.PUT("/users/:id/role", handlers.AdminSetUserRole)
		}

		adminMod := admin.Group("")
		adminMod.Use(middleware.ModeratorOrAdminMiddleware())
		{
			adminMod.PUT("/users/:id/comment-ban", handlers.AdminSetCommentBan)
			adminMod.DELETE("/users/:id/comment-ban", handlers.AdminClearCommentBan)
			adminMod.GET("/users/comment-banned", handlers.AdminListCommentBannedUsers)
			adminMod.GET("/users/:id/comment-ban-history", handlers.AdminGetCommentBanHistory)
			adminMod.GET("/reports", handlers.ListReports)
			adminMod.PATCH("/reports/:id", handlers.UpdateReportStatus)
			adminMod.PATCH("/reports/bulk", handlers.BulkUpdateReports)
			adminMod.GET("/reports/templates", handlers.ListReportTemplates)
			adminMod.POST("/reports/templates", handlers.CreateReportTemplate)
		}

		adminContent := admin.Group("")
		adminContent.Use(middleware.ContentCreatorOrAdminMiddleware())
		{
			adminContent.POST("/genres", handlers.AdminCreateGenre)
			adminContent.PUT("/genres/:id", handlers.AdminUpdateGenre)
			adminContent.DELETE("/genres/:id", handlers.AdminDeleteGenre)

			adminContent.POST("/themes", handlers.AdminCreateTheme)
			adminContent.PUT("/themes/:id", handlers.AdminUpdateTheme)
			adminContent.DELETE("/themes/:id", handlers.AdminDeleteTheme)

			adminContent.POST("/studios", handlers.AdminCreateStudio)
			adminContent.PUT("/studios/:id", handlers.AdminUpdateStudio)
			adminContent.DELETE("/studios/:id", handlers.AdminDeleteStudio)

			adminContent.POST("/developers", handlers.AdminCreateDeveloper)
			adminContent.PUT("/developers/:id", handlers.AdminUpdateDeveloper)
			adminContent.DELETE("/developers/:id", handlers.AdminDeleteDeveloper)

			adminContent.POST("/publishers", handlers.AdminCreatePublisher)
			adminContent.PUT("/publishers/:id", handlers.AdminUpdatePublisher)
			adminContent.DELETE("/publishers/:id", handlers.AdminDeletePublisher)

			adminContent.POST("/platforms", handlers.AdminCreatePlatform)
			adminContent.PUT("/platforms/:id", handlers.AdminUpdatePlatform)
			adminContent.DELETE("/platforms/:id", handlers.AdminDeletePlatform)

			adminContent.POST("/persons", handlers.AdminCreatePerson)
			adminContent.PUT("/persons/:id", handlers.AdminUpdatePerson)
			adminContent.DELETE("/persons/:id", handlers.AdminDeletePerson)

			adminContent.POST("/characters", handlers.AdminCreateCharacter)
			adminContent.PUT("/characters/:id", handlers.AdminUpdateCharacter)
			adminContent.DELETE("/characters/:id", handlers.AdminDeleteCharacter)

			adminContent.POST("/movies", handlers.AdminCreateMovie)
			adminContent.PUT("/movies/:id", handlers.AdminUpdateMovie)
			adminContent.DELETE("/movies/:id", handlers.AdminDeleteMovie)
			adminContent.PUT("/media/:type/:id", handlers.AdminUpdateMedia)
			adminContent.POST("/media/:type/:id/cast", handlers.AdminAddMediaCast)
			adminContent.DELETE("/media/:type/:id/cast/:castId", handlers.AdminRemoveMediaCast)
			adminContent.POST("/media/:type/:id/staff", handlers.AdminAddMediaStaff)
			adminContent.DELETE("/media/:type/:id/staff/:staffId", handlers.AdminRemoveMediaStaff)
			adminContent.GET("/sites", handlers.AdminGetSites)
			adminContent.POST("/sites", handlers.AdminCreateSite)
			adminContent.PUT("/sites/:id", handlers.AdminUpdateSite)
			adminContent.DELETE("/sites/:id", handlers.AdminDeleteSite)
			adminContent.GET("/cast", handlers.AdminGetCastList)
			adminContent.GET("/staff", handlers.AdminGetStaffList)

			adminContent.POST("/franchises", handlers.AdminCreateFranchise)
			adminContent.PUT("/franchises/:id", handlers.AdminUpdateFranchise)
			adminContent.DELETE("/franchises/:id", handlers.AdminDeleteFranchise)
			adminContent.POST("/franchises/:id/links", handlers.AdminAddFranchiseLink)
			adminContent.PUT("/franchises/links/:linkId", handlers.AdminUpdateFranchiseLink)
			adminContent.DELETE("/franchises/links/:linkId", handlers.AdminDeleteFranchiseLink)

			adminContent.POST("/achievements", handlers.AdminCreateAchievement)
			adminContent.PUT("/achievements/:id", handlers.AdminUpdateAchievement)
			adminContent.DELETE("/achievements/:id", handlers.AdminDeleteAchievement)

			adminContent.POST("/upload", handlers.AdminUpload)
		}

		adminDevBlog := admin.Group("")
		adminDevBlog.Use(middleware.DeveloperOrAdminOrOwnerMiddleware())
		{
			adminDevBlog.POST("/devblog", handlers.DevBlogCreate)
			adminDevBlog.PUT("/devblog/:id", handlers.DevBlogUpdate)
			adminDevBlog.DELETE("/devblog/:id", handlers.DevBlogDelete)
		}

		adminNews := admin.Group("")
		adminNews.Use(middleware.NewsEditorMiddleware())
		{
			adminNews.POST("/news/upload", handlers.NewsUpload)
			adminNews.POST("/news", handlers.NewsCreate)
			adminNews.PUT("/news/:id", handlers.NewsUpdate)
			adminNews.DELETE("/news/:id", handlers.NewsDelete)
		}
	}
}
