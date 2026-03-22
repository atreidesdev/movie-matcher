package logger

import (
	"io"
	"log/slog"
	"os"
)

var defaultLogger *slog.Logger

func init() {
	Default()
}

// Пишет в os.Stderr. Переконфигурировать через SetDefault.
func Default() *slog.Logger {
	if defaultLogger == nil {
		defaultLogger = slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
			Level: slog.LevelInfo,
			AddSource: false,
		}))
		slog.SetDefault(defaultLogger)
	}
	return defaultLogger
}

func New(w io.Writer, level slog.Level) *slog.Logger {
	return slog.New(slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level:     level,
		AddSource: false,
	}))
}

// SetDefault подменяет глобальный логгер (например для тестов с буфером).
func SetDefault(l *slog.Logger) {
	defaultLogger = l
	slog.SetDefault(l)
}
