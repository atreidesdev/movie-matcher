package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Коды ошибок API для единообразной обработки на клиенте и в логах.
const (
	ErrCodeNotFound      = "not_found"
	ErrCodeValidation     = "validation_error"
	ErrCodeUnauthorized   = "unauthorized"
	ErrCodeForbidden      = "forbidden"
	ErrCodeInternal       = "internal_error"
	ErrCodeBadRequest     = "bad_request"
	ErrCodeConflict       = "conflict"
)

// APIError — структурированный ответ об ошибке.
type APIError struct {
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Details interface{}  `json:"details,omitempty"`
}

// RespondError отправляет JSON с кодом ошибки и сообщением.
// details опционален (валидация полей, доп. контекст).
func RespondError(c *gin.Context, status int, code, message string, details interface{}) {
	body := APIError{Code: code, Message: message}
	if details != nil {
		body.Details = details
	}
	c.JSON(status, body)
}

func RespondNotFound(c *gin.Context, message string) {
	if message == "" {
		message = "Resource not found"
	}
	RespondError(c, http.StatusNotFound, ErrCodeNotFound, message, nil)
}

func RespondUnauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "Authorization required"
	}
	RespondError(c, http.StatusUnauthorized, ErrCodeUnauthorized, message, nil)
}

func RespondForbidden(c *gin.Context, message string) {
	if message == "" {
		message = "Access denied"
	}
	RespondError(c, http.StatusForbidden, ErrCodeForbidden, message, nil)
}

func RespondBadRequest(c *gin.Context, message string, details interface{}) {
	if message == "" {
		message = "Bad request"
	}
	RespondError(c, http.StatusBadRequest, ErrCodeBadRequest, message, details)
}

func RespondInternal(c *gin.Context, message string) {
	if message == "" {
		message = "Internal server error"
	}
	RespondError(c, http.StatusInternalServerError, ErrCodeInternal, message, nil)
}

func RespondConflict(c *gin.Context, message string) {
	if message == "" {
		message = "Conflict"
	}
	RespondError(c, http.StatusConflict, ErrCodeConflict, message, nil)
}

func RespondValidationError(c *gin.Context, err error) {
	var details interface{}
	if err != nil {
		details = err.Error()
	}
	RespondError(c, http.StatusBadRequest, ErrCodeValidation, "Validation failed", details)
}

// Query: page (1-based), pageSize. Ответ: items, total, page, pageSize.
func PaginatedResponse(c *gin.Context, items interface{}, total int64, page, pageSize int) {
	c.JSON(http.StatusOK, gin.H{
		"items":    items,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}
