# Восстановление go.sum и зависимостей. Запускать из папки backend.
go mod download
go mod tidy
go build ./...
