package api

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// DefaultPageSize и MaxPageSize — рекомендуемые лимиты для списков.
const (
	DefaultPageSize = 20
	MaxPageSize     = 100
	DefaultPage     = 1
)

// ParseUintParam парсит path-параметр как положительное целое (uint).
// При пустом или невалидном значении отправляет 400 и возвращает (0, false).
func ParseUintParam(c *gin.Context, paramName string) (uint, bool) {
	s := c.Param(paramName)
	if s == "" {
		RespondBadRequest(c, paramName+" is required", nil)
		return 0, false
	}
	u, err := strconv.ParseUint(s, 10, 32)
	if err != nil || u == 0 {
		RespondBadRequest(c, "invalid "+paramName, nil)
		return 0, false
	}
	return uint(u), true
}

// ParseUintParamValue парсит уже полученное значение (например c.Param("id")) как положительное uint.
// paramName используется только в сообщении об ошибке.
func ParseUintParamValue(c *gin.Context, value, paramName string) (uint, bool) {
	if value == "" {
		RespondBadRequest(c, paramName+" is required", nil)
		return 0, false
	}
	u, err := strconv.ParseUint(value, 10, 32)
	if err != nil || u == 0 {
		RespondBadRequest(c, "invalid "+paramName, nil)
		return 0, false
	}
	return uint(u), true
}

// defaultLimit и maxLimit при 0 заменяются на 50 и 100.
func ParseLimitParam(c *gin.Context, defaultLimit, maxLimit int) int {
	if defaultLimit <= 0 {
		defaultLimit = 50
	}
	if maxLimit <= 0 {
		maxLimit = 100
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultLimit)))
	if limit < 1 {
		return defaultLimit
	}
	if limit > maxLimit {
		return maxLimit
	}
	return limit
}

// defaultPage, defaultPageSize и maxPageSize задают границы (если 0, используются api.Default* / api.MaxPageSize).
func ParsePageParams(c *gin.Context, defaultPage, defaultPageSize, maxPageSize int) (page, pageSize int) {
	if defaultPage <= 0 {
		defaultPage = DefaultPage
	}
	if defaultPageSize <= 0 {
		defaultPageSize = DefaultPageSize
	}
	if maxPageSize <= 0 {
		maxPageSize = MaxPageSize
	}
	page, _ = strconv.Atoi(c.DefaultQuery("page", strconv.Itoa(defaultPage)))
	pageSize, _ = strconv.Atoi(c.DefaultQuery("pageSize", strconv.Itoa(defaultPageSize)))
	if page < 1 {
		page = defaultPage
	}
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	return page, pageSize
}
