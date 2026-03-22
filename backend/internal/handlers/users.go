package handlers

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/repository"
	"github.com/movie-matcher/backend/internal/services"
	"github.com/movie-matcher/backend/internal/storage"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// usernameRegex — только латиница, цифры, подчёркивание; 3–32 символа (как при регистрации).
var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{3,32}$`)

// UserUploadAvatar godoc
// @Summary  Upload current user avatar
// @Tags     Users
// @Accept   multipart/form-data
// @Produce  json
// @Param    file  formData  file  true  "Image file"
// @Success  200   {object}  map[string]interface{}  "path, user"
// @Failure  400,401  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /users/me/avatar [post]
func UserUploadAvatar(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)

	cfg := deps.GetConfig(c)
	if cfg == nil || cfg.UploadDir == "" {
		api.RespondInternal(c, "Upload not configured")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		api.RespondBadRequest(c, "file is required", nil)
		return
	}

	maxSize := int64(cfg.MaxUploadSizeImage)
	path, err := storage.Save(cfg.UploadDir, "avatar", file, maxSize, "")
	if err != nil {
		api.RespondValidationError(c, err)
		return
	}

	db := deps.GetDB(c)
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	user.Avatar = &path
	if err := db.Save(&user).Error; err != nil {
		api.RespondInternal(c, "Failed to update avatar")
		return
	}

	c.JSON(http.StatusOK, gin.H{"path": path, "user": user.ToResponse()})
}

// При profileHidden == true доступны только id, name, avatar и счётчики; списки/коллекции/рецензии — см. RestrictedWhenHidden.
type PublicProfileResponse struct {
	ID        uint    `json:"id"`
	Username  *string `json:"username"`
	Name      *string `json:"name"`
	Avatar    *string `json:"avatar"`
	CreatedAt string  `json:"createdAt,omitempty"` // только при открытом профиле
	LastSeenAt *string `json:"lastSeenAt,omitempty"`
	// true = профиль закрыт или только для друзей, а зритель не друг — детальные данные недоступны
	ProfileHidden bool `json:"profileHidden,omitempty"`
	// Разбивка списков: по типам контента (movie, tvSeries, ...) и сводка по статусам. Берётся из user_list_stats.
	ListCounts       *services.ListStatsResult `json:"listCounts,omitempty"`
	FavoritesCount   *int                      `json:"favoritesCount,omitempty"`
	ReviewsCount     *int                      `json:"reviewsCount,omitempty"`
	CollectionsCount *int                      `json:"collectionsCount,omitempty"`
	FriendsCount     *int                      `json:"friendsCount,omitempty"`
	FollowersCount   *int                      `json:"followersCount,omitempty"`
	// При profileHidden == true: что именно недоступно по API (списки, коллекции, избранное, рецензии).
	RestrictedWhenHidden []string `json:"restrictedWhenHidden,omitempty"`
	// Ссылки на соцсети (telegram, vk и т.д.). Показываются при открытом профиле.
	SocialLinks map[string]string `json:"socialLinks,omitempty"`
}

// GetUserByID godoc
// @Summary  Get user profile by ID
// @Tags     Users
// @Produce  json
// @Param    id   path  int  true  "User ID"
// @Success  200  {object}  PublicProfileResponse
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /users/{id} [get]
func GetUserByID(c *gin.Context) {
	idParam := c.Param("id")
	userID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid user ID", nil)
		return
	}
	ownerID := uint(userID)

	db := deps.GetDB(c)
	var owner models.User
	if err := db.First(&owner, ownerID).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}

	var viewerID *uint
	if v, exists := c.Get("userID"); exists {
		uid := v.(uint)
		viewerID = &uid
	}

	visibility := services.GetProfileVisibility(db, ownerID)
	canView := services.CanViewProfile(db, viewerID, ownerID, visibility)

	resp := PublicProfileResponse{
		ID:            owner.ID,
		Username:      owner.Username,
		Name:          owner.Name,
		Avatar:        owner.Avatar,
		ProfileHidden: !canView,
	}
	// Счётчики показываем всегда (только числа, без содержимого списков/коллекций и т.д.)
	if stats, ok := services.GetListStatsForUser(db, ownerID); ok {
		resp.ListCounts = stats
	}
	countFavorites(db, ownerID, &resp.FavoritesCount)
	countReviews(db, ownerID, &resp.ReviewsCount)
	countCollections(db, ownerID, &resp.CollectionsCount)
	countFriends(db, ownerID, &resp.FriendsCount)
	countFollowers(db, ownerID, &resp.FollowersCount)

	if canView {
		resp.CreatedAt = owner.CreatedAt.Format("2006-01-02")
		if owner.LastSeenAt != nil {
			t := owner.LastSeenAt.Format(time.RFC3339)
			resp.LastSeenAt = &t
		}
		if len(owner.SocialLinks) > 0 {
			resp.SocialLinks = owner.SocialLinks
		}
	} else {
		// Явно перечисляем, что нельзя получить при закрытом профиле / не в друзьях
		resp.RestrictedWhenHidden = []string{
			"list_items",           // содержимое списков (фильмы, сериалы и т.д.)
			"collection_contents",  // содержимое коллекций
			"favorite_items",       // что именно в избранном
			"reviews",              // тексты и оценки рецензий
		}
	}

	c.JSON(http.StatusOK, resp)
}

// GetUserByUsername godoc
// @Summary  Get user profile by username
// @Tags     Users
// @Produce  json
// @Param    username  path  string  true  "Username"
// @Success  200  {object}  PublicProfileResponse
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /users/username/{username} [get]
func GetUserByUsername(c *gin.Context) {
	username := strings.TrimSpace(strings.ToLower(c.Param("username")))
	if username == "" {
		api.RespondBadRequest(c, "Username required", nil)
		return
	}

	db := deps.GetDB(c)
	var owner models.User
	if err := db.Where("username = ?", username).First(&owner).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}

	var viewerID *uint
	if v, exists := c.Get("userID"); exists {
		uid := v.(uint)
		viewerID = &uid
	}

	visibility := services.GetProfileVisibility(db, owner.ID)
	canView := services.CanViewProfile(db, viewerID, owner.ID, visibility)

	resp := PublicProfileResponse{
		ID:            owner.ID,
		Username:      owner.Username,
		Name:          owner.Name,
		Avatar:        owner.Avatar,
		ProfileHidden: !canView,
	}
	if stats, ok := services.GetListStatsForUser(db, owner.ID); ok {
		resp.ListCounts = stats
	}
	countFavorites(db, owner.ID, &resp.FavoritesCount)
	countReviews(db, owner.ID, &resp.ReviewsCount)
	countCollections(db, owner.ID, &resp.CollectionsCount)
	countFriends(db, owner.ID, &resp.FriendsCount)
	countFollowers(db, owner.ID, &resp.FollowersCount)

	if canView {
		resp.CreatedAt = owner.CreatedAt.Format("2006-01-02")
		if owner.LastSeenAt != nil {
			t := owner.LastSeenAt.Format(time.RFC3339)
			resp.LastSeenAt = &t
		}
		if len(owner.SocialLinks) > 0 {
			resp.SocialLinks = owner.SocialLinks
		}
	} else {
		resp.RestrictedWhenHidden = []string{
			"list_items", "collection_contents", "favorite_items", "reviews",
		}
	}

	c.JSON(http.StatusOK, resp)
}

// GetUserAchievementsByUsername godoc
// @Summary  Get user achievements by username
// @Tags     Users
// @Produce  json
// @Param    username  path  string  true  "Username"
// @Success  200  {object}  map[string]interface{}  "achievements"
// @Failure  403,404  {object}  map[string]interface{}
// @Router   /users/username/{username}/achievements [get]
func GetUserAchievementsByUsername(c *gin.Context) {
	username := strings.TrimSpace(strings.ToLower(c.Param("username")))
	if username == "" {
		api.RespondBadRequest(c, "Username required", nil)
		return
	}

	db := deps.GetDB(c)
	var owner models.User
	if err := db.Where("username = ?", username).First(&owner).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}

	var viewerID *uint
	if v, exists := c.Get("userID"); exists {
		uid := v.(uint)
		viewerID = &uid
	}
	if !services.CanViewProfileByUserID(db, viewerID, owner.ID) {
		api.RespondForbidden(c, "Profile is hidden or visible only to friends")
		return
	}

	list, err := repository.ListAchievements(db)
	if err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	progressMap, _ := repository.GetUserAchievementProgressMap(db, owner.ID, list)
	totalUsers, _ := repository.CountTotalUsers(db)
	if totalUsers == 0 {
		totalUsers = 1
	}
	out := make([]AchievementWithProgress, len(list))
	for i := range list {
		out[i] = AchievementWithProgress{Achievement: list[i]}
		if prog, ok := progressMap[list[i].ID]; ok {
			out[i].Progress = &prog
		} else {
			prog, err := repository.GetAchievementProgress(db, owner.ID, &list[i])
			if err == nil {
				out[i].Progress = &prog
			}
		}
		if out[i].Progress != nil && totalUsers > 0 {
			minPercent := 0.0
			if out[i].Progress.CurrentLevel != nil {
				minPercent = float64(out[i].Progress.CurrentLevel.ThresholdPercent)
			}
			count, _ := repository.CountUsersReachedAchievementAtLeast(db, list[i].ID, minPercent)
			out[i].Progress.UsersReachedPercent = float64(count) / float64(totalUsers) * 100
		}
	}
	c.JSON(http.StatusOK, gin.H{"achievements": out})
}

// PingMe godoc
// @Summary  Update last seen (heartbeat)
// @Tags     Users
// @Success  204  "No content"
// @Failure  401  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /users/me/ping [post]
func PingMe(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	db := deps.GetDB(c)
	now := time.Now()
	if err := db.Model(&models.User{}).Where("id = ?", userID).Update("last_seen_at", now).Error; err != nil {
		api.RespondInternal(c, "Failed to update last seen")
		return
	}
	c.Status(http.StatusNoContent)
}

type UpdateProfileRequest struct {
	Username    *string           `json:"username"`
	Name        *string           `json:"name"`
	Email       *string           `json:"email"`
	SocialLinks *map[string]string `json:"socialLinks"`
}

// UpdateProfile godoc
// @Summary  Update current user profile
// @Tags     Users
// @Accept   json
// @Produce  json
// @Param    body  body  UpdateProfileRequest  true  "username?, name?, email?, socialLinks?"
// @Success  200  {object}  models.UserResponse
// @Failure  400,401,409  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /users/me [patch]
func UpdateProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	db := deps.GetDB(c)
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	if req.Username != nil {
		u := strings.TrimSpace(strings.ToLower(*req.Username))
		if u == "" {
			api.RespondBadRequest(c, "Username cannot be empty", nil)
			return
		}
		if !usernameRegex.MatchString(u) {
			api.RespondBadRequest(c, "Username: 3–32 characters, only letters, numbers and underscore", nil)
			return
		}
		var other models.User
		if err := db.Where("username = ? AND id != ?", u, userID).First(&other).Error; err == nil {
			api.RespondConflict(c, "Username already taken")
			return
		}
		user.Username = &u
	}
	if req.Name != nil {
		n := strings.TrimSpace(*req.Name)
		user.Name = &n
	}
	if req.Email != nil {
		email := strings.TrimSpace(strings.ToLower(*req.Email))
		if email == "" {
			api.RespondBadRequest(c, "Email cannot be empty", nil)
			return
		}
		if !strings.Contains(email, "@") {
			api.RespondBadRequest(c, "Invalid email", nil)
			return
		}
		var other models.User
		if err := db.Where("email = ? AND id != ?", email, userID).First(&other).Error; err == nil {
			api.RespondConflict(c, "Email already in use")
			return
		}
		user.Email = email
	}
	if req.SocialLinks != nil {
		user.SocialLinks = models.SocialLinksMap(*req.SocialLinks)
	}
	if err := db.Save(&user).Error; err != nil {
		api.RespondInternal(c, "Failed to update profile")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user.ToResponse()})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

// ChangePassword godoc
// @Summary  Change current user password
// @Tags     Users
// @Accept   json
// @Produce  json
// @Param    body  body  ChangePasswordRequest  true  "currentPassword, newPassword"
// @Success  200   {object}  map[string]interface{}
// @Failure  400,401  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /users/me/change-password [post]
func ChangePassword(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	db := deps.GetDB(c)
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		api.RespondUnauthorized(c, "Current password is incorrect")
		return
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		api.RespondInternal(c, "Failed to hash password")
		return
	}
	user.Password = string(hashed)
	if err := db.Save(&user).Error; err != nil {
		api.RespondInternal(c, "Failed to update password")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}

// MustCanViewUserProfile проверяет, может ли текущий пользователь (если есть) видеть профиль ownerID.
// Если нет — прерывает запрос с 403. Использовать в эндпоинтах вида GET /users/:id/favorites, /users/:id/lists и т.д.
func MustCanViewUserProfile(c *gin.Context, ownerID uint) bool {
	var viewerID *uint
	if v, exists := c.Get("userID"); exists {
		uid := v.(uint)
		viewerID = &uid
	}
	db := deps.GetDB(c)
	if services.CanViewProfileByUserID(db, viewerID, ownerID) {
		return true
	}
	api.RespondForbidden(c, "Profile is hidden or visible only to friends")
	c.Abort()
	return false
}

func countFavorites(db *gorm.DB, userID uint, out **int) {
	var n int64
	for _, q := range []interface{}{
		&models.MovieFavorite{}, &models.TVSeriesFavorite{}, &models.AnimeSeriesFavorite{},
		&models.CartoonSeriesFavorite{}, &models.CartoonMovieFavorite{}, &models.AnimeMovieFavorite{},
		&models.GameFavorite{}, &models.MangaFavorite{}, &models.BookFavorite{}, &models.LightNovelFavorite{},
		&models.CharacterFavorite{}, &models.PersonFavorite{}, &models.CastFavorite{},
	} {
		var c int64
		db.Model(q).Where("user_id = ?", userID).Count(&c)
		n += c
	}
	v := int(n)
	*out = &v
}

func countReviews(db *gorm.DB, userID uint, out **int) {
	var n int64
	for _, q := range []interface{}{
		&models.MovieReview{}, &models.TVSeriesReview{}, &models.AnimeSeriesReview{},
		&models.CartoonSeriesReview{}, &models.CartoonMovieReview{}, &models.AnimeMovieReview{},
		&models.GameReview{}, &models.MangaReview{}, &models.BookReview{}, &models.LightNovelReview{},
	} {
		var c int64
		db.Model(q).Where("user_id = ?", userID).Count(&c)
		n += c
	}
	v := int(n)
	*out = &v
}

// countCollections считает только коллекции, автором которых является пользователь userID (его коллекции, не общее число).
func countCollections(db *gorm.DB, userID uint, out **int) {
	var n int64
	db.Model(&models.Collection{}).Where("user_id = ?", userID).Count(&n)
	v := int(n)
	*out = &v
}

func countFriends(db *gorm.DB, userID uint, out **int) {
	var n int64
	db.Model(&models.Friendship{}).Where("user_id = ?", userID).Count(&n)
	v := int(n)
	*out = &v
}

func countFollowers(db *gorm.DB, userID uint, out **int) {
	var n int64
	db.Model(&models.Follow{}).Where("following_id = ?", userID).Count(&n)
	v := int(n)
	*out = &v
}

// GetMySettings godoc
// @Summary  Get current user settings
// @Tags     Users
// @Produce  json
// @Success  200  {object}  models.UserSettings
// @Failure  401  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /users/me/settings [get]
func GetMySettings(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	db := deps.GetDB(c)

	var s models.UserSettings
	if err := db.Where("user_id = ?", userID).First(&s).Error; err != nil {
		// Создать настройки по умолчанию
		s = models.UserSettings{
			UserID:            userID,
			Theme:             "system",
			EmailNotifications: true,
			NotifyNewFollowers: true,
			NotifyCommentReplies: true,
			ProfileVisibility: models.ProfileVisibilityPublic,
			Locale:            "ru",
		}
		_ = db.Create(&s)
	}

	c.JSON(http.StatusOK, s)
}

type UpdateMySettingsRequest struct {
	Theme                *string `json:"theme"`
	EmailNotifications   *bool   `json:"emailNotifications"`
	NotifyNewFollowers   *bool   `json:"notifyNewFollowers"`
	NotifyCommentReplies *bool   `json:"notifyCommentReplies"`
	ProfileVisibility    *string `json:"profileVisibility"`
	Locale               *string `json:"locale"`
}

// UpdateMySettings обновляет настройки текущего пользователя.
// UpdateMySettings godoc
// @Summary  Update current user settings
// @Tags     Users
// @Accept   json
// @Produce  json
// @Param    body  body  UpdateMySettingsRequest  true  "profileVisibility, etc."
// @Success  200  {object}  models.UserSettings
// @Failure  400,401  {object}  map[string]interface{}
// @Security BearerAuth
// @Router   /users/me/settings [patch]
func UpdateMySettings(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var req UpdateMySettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	db := deps.GetDB(c)
	var s models.UserSettings
	err := db.Where("user_id = ?", userID).First(&s).Error
	if err != nil {
		s = models.UserSettings{UserID: userID}
		if err := db.Create(&s).Error; err != nil {
			api.RespondInternal(c, "Failed to create settings")
			return
		}
	}

	if req.Theme != nil {
		s.Theme = *req.Theme
	}
	if req.EmailNotifications != nil {
		s.EmailNotifications = *req.EmailNotifications
	}
	if req.NotifyNewFollowers != nil {
		s.NotifyNewFollowers = *req.NotifyNewFollowers
	}
	if req.NotifyCommentReplies != nil {
		s.NotifyCommentReplies = *req.NotifyCommentReplies
	}
	if req.ProfileVisibility != nil {
		switch *req.ProfileVisibility {
		case models.ProfileVisibilityPublic, models.ProfileVisibilityFriends, models.ProfileVisibilityPrivate:
			s.ProfileVisibility = *req.ProfileVisibility
		default:
			api.RespondBadRequest(c, "profileVisibility must be public, friends or private", nil)
			return
		}
	}
	if req.Locale != nil {
		s.Locale = *req.Locale
	}

	if err := db.Save(&s).Error; err != nil {
		api.RespondInternal(c, "Failed to save settings")
		return
	}

	c.JSON(http.StatusOK, s)
}

type UserListItemResponse struct {
	ID         uint    `json:"id"`
	Username   *string `json:"username"`
	Name       *string `json:"name"`
	Avatar     *string `json:"avatar"`
	LastSeenAt *string `json:"lastSeenAt,omitempty"`
}

func userListItemsFromUsers(users []models.User) []UserListItemResponse {
	out := make([]UserListItemResponse, len(users))
	for i := range users {
		out[i] = UserListItemResponse{
			ID:       users[i].ID,
			Username: users[i].Username,
			Name:     users[i].Name,
			Avatar:   users[i].Avatar,
		}
		if users[i].LastSeenAt != nil {
			s := users[i].LastSeenAt.Format(time.RFC3339)
			out[i].LastSeenAt = &s
		}
	}
	return out
}

// GetUserFriendsByUsername godoc
// @Summary  Get user friends by username
// @Tags     Users
// @Produce  json
// @Param    username  path  string  true  "Username"
// @Success  200  {object}  map[string]interface{}
// @Failure  403,404  {object}  map[string]interface{}
// @Router   /users/username/{username}/friends [get]
func GetUserFriendsByUsername(c *gin.Context) {
	username := strings.TrimSpace(strings.ToLower(c.Param("username")))
	if username == "" {
		api.RespondBadRequest(c, "Username required", nil)
		return
	}
	db := deps.GetDB(c)
	var owner models.User
	if err := db.Where("username = ?", username).First(&owner).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	if !MustCanViewUserProfile(c, owner.ID) {
		return
	}
	var friendships []models.Friendship
	db.Where("user_id = ?", owner.ID).Find(&friendships)
	friendIDs := make([]uint, 0, len(friendships))
	for _, f := range friendships {
		friendIDs = append(friendIDs, f.FriendID)
	}
	var friends []models.User
	if len(friendIDs) > 0 {
		db.Where("id IN ?", friendIDs).Find(&friends)
	}
	c.JSON(http.StatusOK, userListItemsFromUsers(friends))
}

// GetUserFollowersByUsername godoc
// @Summary  Get user followers by username
// @Tags     Users
// @Produce  json
// @Param    username  path  string  true  "Username"
// @Success  200  {object}  map[string]interface{}
// @Failure  403,404  {object}  map[string]interface{}
// @Router   /users/username/{username}/followers [get]
func GetUserFollowersByUsername(c *gin.Context) {
	username := strings.TrimSpace(strings.ToLower(c.Param("username")))
	if username == "" {
		api.RespondBadRequest(c, "Username required", nil)
		return
	}
	db := deps.GetDB(c)
	var owner models.User
	if err := db.Where("username = ?", username).First(&owner).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	if !MustCanViewUserProfile(c, owner.ID) {
		return
	}
	var follows []models.Follow
	db.Where("following_id = ?", owner.ID).Find(&follows)
	followerIDs := make([]uint, 0, len(follows))
	for _, f := range follows {
		followerIDs = append(followerIDs, f.FollowerID)
	}
	var followers []models.User
	if len(followerIDs) > 0 {
		db.Where("id IN ?", followerIDs).Find(&followers)
	}
	c.JSON(http.StatusOK, userListItemsFromUsers(followers))
}

// SearchUsers godoc
// @Summary  Search users by query
// @Tags     Users
// @Produce  json
// @Param    q      query  string  false  "Search query"
// @Param    limit  query  int     false  "Limit"
// @Success  200  {object}  map[string]interface{}
// @Router   /users/search [get]
func SearchUsers(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	limit := 20
	if l := c.Query("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	db := deps.GetDB(c)
	var users []models.User
	query := db.Model(&models.User{}).Where("username IS NOT NULL AND username != ''")
	if q != "" {
		pattern := "%" + strings.ToLower(q) + "%"
		query = query.Where(
			"LOWER(username) LIKE ? OR (name IS NOT NULL AND LOWER(name) LIKE ?)",
			pattern, pattern,
		)
	}
	if err := query.Order("username ASC").Limit(limit).Find(&users).Error; err != nil {
		api.RespondInternal(c, "Failed to search users")
		return
	}
	c.JSON(http.StatusOK, userListItemsFromUsers(users))
}

// GetUsersActivity godoc
// @Summary  Get users activity list
// @Tags     Users
// @Produce  json
// @Param    sort    query  string  false  "Sort"
// @Param    limit   query  int     false  "Limit"
// @Param    offset  query  int     false  "Offset"
// @Success  200  {object}  map[string]interface{}
// @Router   /users [get]
func GetUsersActivity(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	offset := 0
	if o := c.Query("offset"); o != "" {
		if n, err := strconv.Atoi(o); err == nil && n >= 0 {
			offset = n
		}
	}
	db := deps.GetDB(c)
	var users []models.User
	err := db.Model(&models.User{}).
		Where("username IS NOT NULL AND username != ''").
		Order("last_seen_at DESC NULLS LAST").
		Limit(limit).
		Offset(offset).
		Find(&users).Error
	if err != nil {
		api.RespondInternal(c, "Failed to fetch users")
		return
	}
	c.JSON(http.StatusOK, userListItemsFromUsers(users))
}
