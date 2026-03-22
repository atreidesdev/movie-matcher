package main

import (
	"log"
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/docs"
	"github.com/movie-matcher/backend/internal/config"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/movie-matcher/backend/internal/database"
	"github.com/movie-matcher/backend/internal/logger"
	"github.com/movie-matcher/backend/internal/middleware"
	"github.com/movie-matcher/backend/internal/queue"
	"github.com/movie-matcher/backend/internal/router"
	"github.com/movie-matcher/backend/internal/services"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	_ = logger.Default() // инициализация JSON-логгера для slog.Default()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	middleware.SetJWTSecret(cfg.JWTSecret)

	if err := services.InitMessageCrypto(cfg.MessageEncryptionKey, cfg.JWTSecret); err != nil {
		log.Fatalf("Failed to init message encryption: %v", err)
	}

	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	if err := database.EnsureInitialOwner(cfg.OwnerEmail, cfg.OwnerPassword, cfg.OwnerName, cfg.OwnerUsername); err != nil {
		log.Fatalf("Failed to ensure initial owner: %v", err)
	}
	if err := database.EnsureDefaultOwner(); err != nil {
		log.Fatalf("Failed to ensure default owner: %v", err)
	}

	queue.Init(cfg.RecommendationQueueConcurrent, cfg.RecommendationQueueSize)
	defer queue.Default.Close()

	scheduler := services.NewScheduler()
	scheduler.Start()
	defer scheduler.Stop()

	r := gin.Default()
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.MetricsMiddleware())

	if cfg.UploadDir != "" {
		r.Static("/uploads", cfg.UploadDir)
	}

	docs.SwaggerInfo.Host = "localhost:" + cfg.Port
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, ginSwagger.URL("/swagger/doc.json"), ginSwagger.DefaultModelsExpandDepth(-1)))
	router.RegisterRoutes(r)

	slog.Default().Info("server starting", slog.String("port", cfg.Port))
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
