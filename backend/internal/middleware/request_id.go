package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

const requestIDKey = "request_id"

// Генерирует request_id, кладёт в контекст и X-Request-ID; логирует завершение (status, duration_ms, ip, user_id, error при 4xx/5xx).
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := make([]byte, 8)
		if _, err := rand.Read(id); err != nil {
			id = []byte("fallback")
		}
		requestID := hex.EncodeToString(id)
		c.Set(requestIDKey, requestID)
		c.Header("X-Request-ID", requestID)

		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		clientIP := c.ClientIP()

		c.Next()

		status := c.Writer.Status()
		duration := time.Since(start)
		attrs := []any{
			slog.String("request_id", requestID),
			slog.String("method", method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Int64("duration_ms", duration.Milliseconds()),
			slog.String("ip", clientIP),
		}
		if userIDVal, exists := c.Get("userID"); exists {
			if uid, ok := userIDVal.(uint); ok {
				attrs = append(attrs, slog.Uint64("user_id", uint64(uid)))
			}
		}
		if status >= 500 {
			attrs = append(attrs, slog.String("error", "server error"))
			slog.Default().Error("request", attrs...)
		} else if status >= 400 {
			attrs = append(attrs, slog.String("error", "client error"))
			slog.Default().Warn("request", attrs...)
		} else {
			slog.Default().Info("request", attrs...)
		}
	}
}
