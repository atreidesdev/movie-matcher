package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/middleware"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	Email      string  `json:"email" binding:"required,email"`
	Password   string  `json:"password" binding:"required,min=6"`
	Username   string  `json:"username" binding:"required"`
	Name       *string `json:"name"`
	DeviceName *string `json:"deviceName"`
}

type LoginRequest struct {
	Email      string  `json:"email" binding:"required,email"`
	Password   string  `json:"password" binding:"required"`
	DeviceName *string `json:"deviceName"`
}

type AuthResponse struct {
	User         models.UserResponse `json:"user"`
	AccessToken  string              `json:"accessToken"`
	RefreshToken string              `json:"refreshToken"`
	ExpiresIn    int64               `json:"expiresIn"` // секунды до истечения access
	SessionID    uint                `json:"sessionId"` // ID сессии для отображения «где авторизован»
}

type RefreshRequest struct {
	RefreshToken string  `json:"refreshToken" binding:"required"`
	DeviceName   *string `json:"deviceName"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

// Register godoc
// @Summary  Register a new user
// @Tags     Auth
// @Accept   json
// @Produce  json
// @Param    body  body  RegisterRequest  true  "email, password, username, name?, deviceName?"
// @Success  201   {object}  AuthResponse
// @Failure  400   {object}  map[string]interface{}
// @Failure  409   {object}  map[string]interface{}
// @Router   /auth/register [post]
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	username := strings.TrimSpace(strings.ToLower(req.Username))
	if !usernameRegex.MatchString(username) {
		api.RespondBadRequest(c, "Username: 3–32 characters, only letters, numbers and underscore", nil)
		return
	}

	db := deps.GetDB(c)
	var existingUser models.User
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		api.RespondConflict(c, "User with this email already exists")
		return
	}
	if err := db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		api.RespondConflict(c, "Username already taken")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		api.RespondInternal(c, "Failed to hash password")
		return
	}

	user := models.User{
		Email:    req.Email,
		Username: &username,
		Password: string(hashedPassword),
		Name:     req.Name,
	}

	if err := db.Create(&user).Error; err != nil {
		api.RespondInternal(c, "Failed to create user")
		return
	}

	deviceName := ""
	if req.DeviceName != nil {
		deviceName = *req.DeviceName
	}
	accessToken, refreshToken, sessionID, expiresIn, err := issueTokenPair(db, c, user, deviceName)
	if err != nil {
		api.RespondInternal(c, "Failed to generate token")
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		User:         user.ToResponse(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		SessionID:    sessionID,
	})
}

// Login godoc
// @Summary  Login user
// @Tags     Auth
// @Accept   json
// @Produce  json
// @Param    body  body  LoginRequest  true  "email, password, deviceName?"
// @Success  200   {object}  AuthResponse
// @Failure  401   {object}  map[string]interface{}
// @Router   /auth/login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	db := deps.GetDB(c)
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		api.RespondUnauthorized(c, "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		api.RespondUnauthorized(c, "Invalid email or password")
		return
	}

	deviceName := ""
	if req.DeviceName != nil {
		deviceName = *req.DeviceName
	}
	accessToken, refreshToken, sessionID, expiresIn, err := issueTokenPair(db, c, user, deviceName)
	if err != nil {
		api.RespondInternal(c, "Failed to generate token")
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		User:         user.ToResponse(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		SessionID:    sessionID,
	})
}

// Logout godoc
// @Summary  Logout (invalidate refresh token)
// @Tags     Auth
// @Accept   json
// @Produce  json
// @Param    body  body  LogoutRequest  true  "refreshToken"
// @Success  200   {object}  map[string]interface{}
// @Router   /auth/logout [post]
func Logout(c *gin.Context) {
	var req LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondBadRequest(c, "refreshToken required", nil)
		return
	}

	deps.GetDB(c).Where("token = ?", req.RefreshToken).Delete(&models.Token{})
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Refresh godoc
// @Summary  Exchange refresh token for new access and refresh tokens
// @Tags     Auth
// @Accept   json
// @Produce  json
// @Param    body  body  RefreshRequest  true  "refreshToken, deviceName?"
// @Success  200   {object}  AuthResponse
// @Failure  401   {object}  map[string]interface{}
// @Router   /auth/refresh [post]
func Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondBadRequest(c, "refreshToken required", nil)
		return
	}

	db := deps.GetDB(c)
	var dbToken models.Token
	if err := db.Where("token = ? AND is_active = ?", req.RefreshToken, true).First(&dbToken).Error; err != nil {
		api.RespondUnauthorized(c, "Invalid or expired refresh token")
		return
	}
	if dbToken.ExpiresAt != nil && time.Now().After(*dbToken.ExpiresAt) {
		db.Delete(&dbToken)
		api.RespondUnauthorized(c, "Refresh token expired")
		return
	}

	var user models.User
	if err := db.First(&user, dbToken.UserID).Error; err != nil {
		api.RespondUnauthorized(c, "User not found")
		return
	}

	db.Delete(&dbToken)

	deviceName := ""
	if req.DeviceName != nil {
		deviceName = *req.DeviceName
	}
	accessToken, refreshToken, sessionID, expiresIn, err := issueTokenPair(db, c, user, deviceName)
	if err != nil {
		api.RespondInternal(c, "Failed to generate token")
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		User:         user.ToResponse(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		SessionID:    sessionID,
	})
}

// LogoutOthers godoc
// @Summary  Logout from all other devices (keep current session)
// @Tags     Auth
// @Accept   json
// @Produce  json
// @Param    body  body  LogoutRequest  true  "refreshToken of current device"
// @Success  200   {object}  map[string]interface{}
// @Failure  401   {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /auth/logout-others [post]
func LogoutOthers(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)

	var req LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondBadRequest(c, "refreshToken required", nil)
		return
	}

	db := deps.GetDB(c)
	var current models.Token
	if err := db.Where("token = ? AND user_id = ? AND is_active = ?", req.RefreshToken, userID, true).First(&current).Error; err != nil {
		api.RespondBadRequest(c, "Invalid refresh token for this user", nil)
		return
	}

	db.Where("user_id = ? AND token != ?", userID, req.RefreshToken).Delete(&models.Token{})
	c.JSON(http.StatusOK, gin.H{"message": "Logged out from all other devices"})
}

// GetSessions godoc
// @Summary  List current user sessions
// @Tags     Auth
// @Produce  json
// @Success  200   {object}  map[string]interface{}  "sessions"
// @Failure  401   {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /auth/sessions [get]
func GetSessions(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	var tokens []models.Token
	if err := db.Where("user_id = ? AND is_active = ?", userID, true).
		Order("last_used_at DESC, created_at DESC").
		Find(&tokens).Error; err != nil {
		api.RespondInternal(c, "Failed to load sessions")
		return
	}

	sessions := make([]models.SessionResponse, 0, len(tokens))
	for i := range tokens {
		sessions = append(sessions, tokens[i].ToSessionResponse())
	}
	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

// RevokeSession godoc
// @Summary  Revoke one session by ID
// @Tags     Auth
// @Produce  json
// @Param    id   path  int  true  "Session ID"
// @Success  200  {object}  map[string]interface{}
// @Failure  401,404  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /auth/sessions/{id} [delete]
func RevokeSession(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)

	var uri struct {
		ID uint `uri:"id" binding:"required"`
	}
	if err := c.ShouldBindUri(&uri); err != nil {
		api.RespondBadRequest(c, "Session ID required", nil)
		return
	}

	db := deps.GetDB(c)
	res := db.Where("id = ? AND user_id = ?", uri.ID, userID).Delete(&models.Token{})
	if res.Error != nil {
		api.RespondInternal(c, "Failed to revoke session")
		return
	}
	if res.RowsAffected == 0 {
		api.RespondNotFound(c, "Session not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Session revoked"})
}

type MeResponse struct {
	User    models.UserResponse    `json:"user"`
	Settings *MeResponseSettings    `json:"settings,omitempty"`
}

type MeResponseSettings struct {
	ProfileVisibility string `json:"profileVisibility"`
}

// GetCurrentUser godoc
// @Summary  Get current authenticated user (me)
// @Tags     Auth
// @Produce  json
// @Success  200  {object}  MeResponse
// @Failure  401  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /auth/me [get]
func GetCurrentUser(c *gin.Context) {
	userID, _ := c.Get("userID")

	var user models.User
	db := deps.GetDB(c)
	if err := db.Preload("Settings").First(&user, userID).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}

	resp := MeResponse{User: user.ToResponse()}
	if user.Settings != nil {
		pv := user.Settings.ProfileVisibility
		if pv == "" {
			pv = models.ProfileVisibilityPublic
		}
		resp.Settings = &MeResponseSettings{ProfileVisibility: pv}
	} else {
		resp.Settings = &MeResponseSettings{ProfileVisibility: models.ProfileVisibilityPublic}
	}

	c.JSON(http.StatusOK, resp)
}

const (
	accessTokenDuration  = 15 * time.Minute
	refreshTokenDuration = 24 * 7 * time.Hour
)

func issueTokenPair(db *gorm.DB, c *gin.Context, user models.User, deviceName string) (accessToken, refreshToken string, sessionID uint, expiresInSec int64, err error) {
	accessExpires := time.Now().Add(accessTokenDuration)
	claims := &middleware.Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpires),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err = jwtToken.SignedString(middleware.JWTSecret)
	if err != nil {
		return "", "", 0, 0, err
	}

	refreshBytes := make([]byte, 32)
	if _, err := rand.Read(refreshBytes); err != nil {
		return "", "", 0, 0, err
	}
	refreshToken = hex.EncodeToString(refreshBytes)
	refreshExpires := time.Now().Add(refreshTokenDuration)
	now := time.Now()

	userAgent := ""
	if c != nil {
		userAgent = c.GetHeader("User-Agent")
		if len(userAgent) > 512 {
			userAgent = userAgent[:512]
		}
	}

	dbRow := models.Token{
		UserID:     user.ID,
		Token:      refreshToken,
		IsActive:   true,
		ExpiresAt:  &refreshExpires,
		DeviceName: deviceName,
		UserAgent:  userAgent,
		LastUsedAt: &now,
	}
	if err := db.Create(&dbRow).Error; err != nil {
		return "", "", 0, 0, err
	}

	expiresInSec = int64(accessTokenDuration.Seconds())
	return accessToken, refreshToken, dbRow.ID, expiresInSec, nil
}

// ForgotPassword godoc
// @Summary  Request password reset email
// @Tags     Auth
// @Accept   json
// @Produce  json
// @Param    body  body  ForgotPasswordRequest  true  "email"
// @Success  200   {object}  map[string]interface{}
// @Router   /auth/forgot-password [post]
func ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	db := deps.GetDB(c)
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent"})
		return
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		api.RespondInternal(c, "Failed to generate token")
		return
	}
	tokenStr := hex.EncodeToString(tokenBytes)

	expiresAt := time.Now().Add(1 * time.Hour)
	resetToken := models.PasswordResetToken{
		UserID:    user.ID,
		Token:     tokenStr,
		ExpiresAt: expiresAt,
	}
	if err := db.Create(&resetToken).Error; err != nil {
		api.RespondInternal(c, "Failed to create reset token")
		return
	}

	cfg := deps.GetConfig(c)
	if cfg == nil {
		api.RespondInternal(c, "Config not available")
		return
	}

	resetLink := cfg.FrontendResetPasswordURL + "?token=" + tokenStr
	emailSvc := services.NewEmailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPFrom)
	if err := emailSvc.SendPasswordReset(user.Email, resetLink); err != nil {
		db.Delete(&resetToken)
		api.RespondInternal(c, "Failed to send email. Check SMTP settings.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a reset link has been sent"})
}

// ResetPassword godoc
// @Summary  Set new password using token from email
// @Tags     Auth
// @Accept   json
// @Produce  json
// @Param    body  body  ResetPasswordRequest  true  "token, newPassword"
// @Success  200   {object}  map[string]interface{}
// @Failure  400   {object}  map[string]interface{}
// @Router   /auth/reset-password [post]
func ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	db := deps.GetDB(c)
	var resetToken models.PasswordResetToken
	if err := db.Where("token = ? AND used = ?", req.Token, false).First(&resetToken).Error; err != nil {
		api.RespondBadRequest(c, "Invalid or expired reset link", nil)
		return
	}

	if time.Now().After(resetToken.ExpiresAt) {
		api.RespondBadRequest(c, "Reset link has expired", nil)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		api.RespondInternal(c, "Failed to hash password")
		return
	}

	if err := db.Model(&models.User{}).Where("id = ?", resetToken.UserID).Update("password", string(hashedPassword)).Error; err != nil {
		api.RespondInternal(c, "Failed to update password")
		return
	}

	db.Model(&resetToken).Update("used", true)

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
}
