package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/movie-matcher/backend/internal/database"
	"github.com/movie-matcher/backend/internal/models"
)

var JWTSecret []byte

func SetJWTSecret(secret string) {
	JWTSecret = []byte(secret)
}

type Claims struct {
	UserID uint   `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Next()
	}
}

// AdminMiddleware требует роль admin (только админ).
func AdminMiddleware() gin.HandlerFunc {
	return roleCheckMiddleware(func(u *models.User) bool { return u.IsAdmin() }, "Admin access required")
}

func ContentCreatorOrAdminMiddleware() gin.HandlerFunc {
	return roleCheckMiddleware(func(u *models.User) bool { return u.CanManageContent() }, "Content creator or admin access required")
}

// ModeratorOrAdminMiddleware разрешает модератору, админу или владельцу (удаление комментариев, бан на комментарии).
func ModeratorOrAdminMiddleware() gin.HandlerFunc {
	return roleCheckMiddleware(func(u *models.User) bool {
		return u.Role == models.RoleModerator || u.Role == models.RoleAdmin || u.Role == models.RoleOwner
	}, "Moderator, admin or owner access required")
}

// DeveloperOrAdminOrOwnerMiddleware разрешает разработчику, админу или владельцу (напр. DevBlog).
func DeveloperOrAdminOrOwnerMiddleware() gin.HandlerFunc {
	return roleCheckMiddleware(func(u *models.User) bool { return u.CanWriteDevBlog() }, "Developer, admin or owner access required")
}

func NewsEditorMiddleware() gin.HandlerFunc {
	return roleCheckMiddleware(func(u *models.User) bool { return u.CanWriteNews() }, "News editor access required")
}

func roleCheckMiddleware(allowed func(*models.User) bool, errMsg string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
			c.Abort()
			return
		}

		var user models.User
		if err := database.DB.First(&user, userIDVal).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		if !allowed(&user) {
			c.JSON(http.StatusForbidden, gin.H{"error": errMsg})
			c.Abort()
			return
		}

		c.Next()
	}
}

func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		tokenString := parts[1]
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return JWTSecret, nil
		})

		if err == nil && token.Valid {
			c.Set("userID", claims.UserID)
			c.Set("email", claims.Email)
		}

		c.Next()
	}
}
