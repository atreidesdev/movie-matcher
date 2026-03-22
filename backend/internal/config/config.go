package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL           string
	JWTSecret             string
	Port                  string
	RecommendationService string
	// Очередь запросов к recommendation service: макс. параллельных запросов и размер очереди ожидания
	RecommendationQueueConcurrent int
	RecommendationQueueSize       int

	// SMTP для отправки писем (восстановление пароля)
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	// Базовый URL страницы сброса пароля на фронте (например https://app.example.com/reset-password)
	FrontendResetPasswordURL string

	// Начальный владелец: создаётся при первом запуске, если пользователя с таким email нет
	OwnerEmail    string
	OwnerPassword string
	OwnerName     string
	OwnerUsername string

	// Хранение загруженных файлов на сервере (постеры, аватарки, трейлеры и т.д.). Путь на диске.
	UploadDir string
	// Макс. размер файла: изображения (байты), по умолчанию 10MB
	MaxUploadSizeImage int
	// Макс. размер файла: видео (байты), по умолчанию 100MB
	MaxUploadSizeVideo int

	// Ключ шифрования сообщений (32 байта в hex = 64 символа, или любая строка — тогда SHA-256 от неё).
	// Если пусто, используется JWTSecret (не рекомендуется для продакшена).
	MessageEncryptionKey string

	VAPIDPublicKey  string
	VAPIDPrivateKey string
}

var Current *Config

func Load() (*Config, error) {
	godotenv.Load()

	Current = &Config{
		DatabaseURL:             getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/movie_matcher?sslmode=disable"),
		JWTSecret:               getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		Port:                    getEnv("PORT", "8080"),
		RecommendationService:   getEnv("RECOMMENDATION_SERVICE_URL", "http://localhost:8000"),
		RecommendationQueueConcurrent: getEnvInt("RECOMMENDATION_QUEUE_CONCURRENT", 5),
		RecommendationQueueSize:       getEnvInt("RECOMMENDATION_QUEUE_SIZE", 100),
		SMTPHost:                getEnv("SMTP_HOST", ""),
		SMTPPort:                getEnv("SMTP_PORT", "587"),
		SMTPUser:                getEnv("SMTP_USER", ""),
		SMTPPassword:            getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:                getEnv("SMTP_FROM", "noreply@movie-matcher.local"),
		FrontendResetPasswordURL: getEnv("FRONTEND_RESET_PASSWORD_URL", "http://localhost:3000/reset-password"),
		OwnerEmail:               getEnv("OWNER_EMAIL", ""),
		OwnerPassword:            getEnv("OWNER_PASSWORD", ""),
		OwnerName:                getEnv("OWNER_NAME", "Owner"),
		OwnerUsername:            getEnv("OWNER_USERNAME", "owner"),
		UploadDir:                getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadSizeImage:       getEnvInt("MAX_UPLOAD_SIZE_IMAGE", 10*1024*1024),
		MaxUploadSizeVideo:       getEnvInt("MAX_UPLOAD_SIZE_VIDEO", 1024*1024*1024),
		MessageEncryptionKey:    getEnv("MESSAGE_ENCRYPTION_KEY", ""),
		VAPIDPublicKey:             getEnv("VAPID_PUBLIC_KEY", ""),
		VAPIDPrivateKey:            getEnv("VAPID_PRIVATE_KEY", ""),
	}
	return Current, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if n, err := strconv.Atoi(value); err == nil {
			return n
		}
	}
	return defaultValue
}
