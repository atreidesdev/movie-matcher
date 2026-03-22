package repository

import "gorm.io/gorm"

// BuildQueryFn строит отфильтрованный и отсортированный запрос для списка (без Preload/Offset/Limit).
// Используется в List() репозиториев медиа.
type BuildQueryFn func(db *gorm.DB) *gorm.DB
