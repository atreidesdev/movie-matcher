package handlers

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/storage"
	"gorm.io/gorm"
)

var communitySlugCleanRegex = regexp.MustCompile(`[^a-z0-9-]+`)

func communitySlugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = communitySlugCleanRegex.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "community"
	}
	return s
}

type CommunityListItem struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	Description  string `json:"description"`
	Avatar       string `json:"avatar,omitempty"`
	Cover        string `json:"cover,omitempty"`
	CreatorID    uint   `json:"creatorId"`
	CreatorName  string `json:"creatorName,omitempty"`
	Subscribers  int    `json:"subscribers"`
	IsSubscribed bool   `json:"isSubscribed,omitempty"`
}

type CommunityDetailResponse struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	Description  string `json:"description"`
	Avatar       string `json:"avatar,omitempty"`
	Cover        string `json:"cover,omitempty"`
	CreatorID    uint   `json:"creatorId"`
	CreatorName  string `json:"creatorName,omitempty"`
	CreatorUsername *string `json:"creatorUsername,omitempty"`
	Subscribers  int    `json:"subscribers"`
	IsSubscribed bool   `json:"isSubscribed,omitempty"`
}

type CommunityPostItem struct {
	ID            uint                        `json:"id"`
	CommunityID   uint                        `json:"communityId"`
	CommunityName string                      `json:"communityName,omitempty"`
	CommunitySlug string                      `json:"communitySlug,omitempty"`
	AuthorID      uint                        `json:"authorId"`
	AuthorName    string                      `json:"authorName,omitempty"`
	AuthorUsername *string                    `json:"authorUsername,omitempty"`
	Title         string                      `json:"title"`
	PreviewImage  string                      `json:"previewImage,omitempty"`
	Attachments   []models.CommunityPostAttachment `json:"attachments,omitempty"`
	Body         string `json:"body"`
	CreatedAt    string `json:"createdAt"`
}

type CreateCommunityInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Avatar      string `json:"avatar"`
	Cover       string `json:"cover"`
}

type UpdateCommunityInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Avatar      *string `json:"avatar"`
	Cover       *string `json:"cover"`
}

type CreatePostInput struct {
	Title         string                         `json:"title" binding:"required"`
	Body          string                         `json:"body" binding:"required"`
	PreviewImage  string                         `json:"previewImage"`
	Attachments   []models.CommunityPostAttachment `json:"attachments"`
}

// GET /communities — список сообществ (публично).
func CommunitiesList(c *gin.Context) {
	db := deps.GetDB(c)
	var list []models.Community
	if err := db.Preload("Creator").Order("created_at DESC").Find(&list).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to load communities", nil)
		return
	}
	userIDVal, hasUser := c.Get("userID")
	var userID uint
	if hasUser {
		userID = userIDVal.(uint)
	}

	communityIDs := make([]uint, 0, len(list))
	for i := range list {
		communityIDs = append(communityIDs, list[i].ID)
	}

	var subCounts []struct {
		CommunityID uint
		Count       int64
	}
	db.Model(&models.CommunitySubscription{}).Select("community_id, count(*) as count").Where("community_id IN ?", communityIDs).Group("community_id").Scan(&subCounts)
	subMap := make(map[uint]int)
	for _, r := range subCounts {
		subMap[r.CommunityID] = int(r.Count)
	}

	subscribed := make(map[uint]bool)
	if userID > 0 {
		var subs []models.CommunitySubscription
		db.Where("user_id = ? AND community_id IN ?", userID, communityIDs).Find(&subs)
		for _, s := range subs {
			subscribed[s.CommunityID] = true
		}
	}

	out := make([]CommunityListItem, 0, len(list))
	for i := range list {
		item := CommunityListItem{
			ID:          list[i].ID,
			Name:        list[i].Name,
			Slug:        list[i].Slug,
			Description: list[i].Description,
			Avatar:      list[i].Avatar,
			Cover:       list[i].Cover,
			CreatorID:   list[i].CreatorID,
			Subscribers: subMap[list[i].ID],
		}
		if list[i].Creator.ID != 0 {
			if list[i].Creator.Name != nil {
				item.CreatorName = *list[i].Creator.Name
			} else if list[i].Creator.Username != nil {
				item.CreatorName = *list[i].Creator.Username
			}
		}
		if hasUser {
			item.IsSubscribed = subscribed[list[i].ID]
		}
		out = append(out, item)
	}
	c.JSON(http.StatusOK, gin.H{"communities": out})
}

// POST /communities — создать сообщество (auth).
func CommunitiesCreate(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	var input CreateCommunityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}

	slug := communitySlugify(input.Name)
	db := deps.GetDB(c)
	var exists models.Community
	if err := db.Where("slug = ?", slug).First(&exists).Error; err == nil {
		base := slug
		for i := 1; ; i++ {
			slug = base + "-" + strconv.Itoa(i)
			if err := db.Where("slug = ?", slug).First(&exists).Error; err != nil {
				break
			}
		}
	}

	comm := models.Community{
		Name:        strings.TrimSpace(input.Name),
		Slug:        slug,
		Description: strings.TrimSpace(input.Description),
		Avatar:      strings.TrimSpace(input.Avatar),
		Cover:       strings.TrimSpace(input.Cover),
		CreatorID:   userID,
	}
	if err := db.Create(&comm).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to create community", nil)
		return
	}
	_ = db.Preload("Creator").First(&comm, comm.ID)
	resp := toCommunityDetail(&comm, 0, false)
	c.JSON(http.StatusCreated, resp)
}

// GET /communities/feed — лента постов из подписок (auth).
func CommunitiesFeed(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	var subIDs []uint
	db.Model(&models.CommunitySubscription{}).Where("user_id = ?", userID).Pluck("community_id", &subIDs)
	if len(subIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"posts": []CommunityPostItem{}})
		return
	}

	var posts []models.CommunityPost
	if err := db.Preload("Author").Preload("Community").Where("community_id IN ?", subIDs).Order("created_at DESC").Limit(100).Find(&posts).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to load feed", nil)
		return
	}

	out := make([]CommunityPostItem, 0, len(posts))
	for i := range posts {
		out = append(out, toPostItem(&posts[i]))
	}
	c.JSON(http.StatusOK, gin.H{"posts": out})
}

// GET /communities/:id или /communities/slug/:slug
func CommunityGet(c *gin.Context) {
	idOrSlug := c.Param("id")
	if idOrSlug == "" {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid community ID or slug", nil)
		return
	}

	db := deps.GetDB(c)
	var comm models.Community
	if id, err := strconv.ParseUint(idOrSlug, 10, 32); err == nil {
		if err := db.Preload("Creator").First(&comm, id).Error; err != nil {
			api.RespondNotFound(c, "Community not found")
			return
		}
	} else {
		if err := db.Preload("Creator").Where("slug = ?", idOrSlug).First(&comm).Error; err != nil {
			api.RespondNotFound(c, "Community not found")
			return
		}
	}

	var subCount int64
	db.Model(&models.CommunitySubscription{}).Where("community_id = ?", comm.ID).Count(&subCount)

	userIDVal, hasUser := c.Get("userID")
	var isSubscribed bool
	if hasUser {
		var count int64
		db.Model(&models.CommunitySubscription{}).Where("user_id = ? AND community_id = ?", userIDVal.(uint), comm.ID).Count(&count)
		isSubscribed = count > 0
	}

	c.JSON(http.StatusOK, toCommunityDetail(&comm, int(subCount), isSubscribed))
}

func toCommunityDetail(c *models.Community, subCount int, isSubscribed bool) CommunityDetailResponse {
	resp := CommunityDetailResponse{
		ID:           c.ID,
		Name:         c.Name,
		Slug:         c.Slug,
		Description:  c.Description,
		Avatar:       c.Avatar,
		Cover:        c.Cover,
		CreatorID:    c.CreatorID,
		Subscribers:  subCount,
		IsSubscribed: isSubscribed,
	}
	if c.Creator.ID != 0 {
		if c.Creator.Name != nil {
			resp.CreatorName = *c.Creator.Name
		} else if c.Creator.Username != nil {
			resp.CreatorName = *c.Creator.Username
		}
		resp.CreatorUsername = c.Creator.Username
	}
	return resp
}

// PUT /communities/:id — обновить (только создатель).
func CommunityUpdate(c *gin.Context) {
	idStr := c.Param("id")
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}
	if comm.CreatorID != userID {
		api.RespondError(c, http.StatusForbidden, api.ErrCodeForbidden, "Only creator can update community", nil)
		return
	}

	var input UpdateCommunityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}

	updates := make(map[string]interface{})
	if input.Name != nil {
		updates["name"] = strings.TrimSpace(*input.Name)
	}
	if input.Description != nil {
		updates["description"] = strings.TrimSpace(*input.Description)
	}
	if input.Avatar != nil {
		updates["avatar"] = strings.TrimSpace(*input.Avatar)
	}
	if input.Cover != nil {
		updates["cover"] = strings.TrimSpace(*input.Cover)
	}
	if len(updates) == 0 {
		_ = db.Preload("Creator").First(comm, comm.ID)
		var subCount int64
		db.Model(&models.CommunitySubscription{}).Where("community_id = ?", comm.ID).Count(&subCount)
		var isSub int64
		db.Model(&models.CommunitySubscription{}).Where("user_id = ? AND community_id = ?", userID, comm.ID).Count(&isSub)
		c.JSON(http.StatusOK, toCommunityDetail(comm, int(subCount), isSub > 0))
		return
	}
	if err := db.Model(comm).Updates(updates).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to update", nil)
		return
	}
	_ = db.Preload("Creator").First(comm, comm.ID)
	var subCount int64
	db.Model(&models.CommunitySubscription{}).Where("community_id = ?", comm.ID).Count(&subCount)
	var isSub int64
	db.Model(&models.CommunitySubscription{}).Where("user_id = ? AND community_id = ?", userID, comm.ID).Count(&isSub)
	c.JSON(http.StatusOK, toCommunityDetail(comm, int(subCount), isSub > 0))
}

// DELETE /communities/:id — удалить (только создатель). :id может быть числом или slug.
func CommunityDelete(c *gin.Context) {
	idStr := c.Param("id")
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}
	if comm.CreatorID != userID {
		api.RespondError(c, http.StatusForbidden, api.ErrCodeForbidden, "Only creator can delete community", nil)
		return
	}
	if err := db.Delete(comm).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to delete", nil)
		return
	}
	c.Status(http.StatusNoContent)
}

// POST /communities/:id/subscribe — подписаться.
func CommunitySubscribe(c *gin.Context) {
	communityID, userID, ok := getCommunityAndUser(c)
	if !ok {
		return
	}
	db := deps.GetDB(c)
	var sub models.CommunitySubscription
	if err := db.Where("user_id = ? AND community_id = ?", userID, communityID).First(&sub).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"subscribed": true})
		return
	}
	sub = models.CommunitySubscription{UserID: userID, CommunityID: communityID}
	if err := db.Create(&sub).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to subscribe", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"subscribed": true})
}

// POST /communities/:id/unsubscribe — отписаться.
func CommunityUnsubscribe(c *gin.Context) {
	communityID, userID, ok := getCommunityAndUser(c)
	if !ok {
		return
	}
	db := deps.GetDB(c)
	db.Where("user_id = ? AND community_id = ?", userID, communityID).Delete(&models.CommunitySubscription{})
	c.JSON(http.StatusOK, gin.H{"subscribed": false})
}

func resolveCommunity(db *gorm.DB, idOrSlug string) (*models.Community, bool) {
	var comm models.Community
	if id, err := strconv.ParseUint(idOrSlug, 10, 32); err == nil {
		if err := db.First(&comm, id).Error; err != nil {
			return nil, false
		}
		return &comm, true
	}
	if err := db.Where("slug = ?", idOrSlug).First(&comm).Error; err != nil {
		return nil, false
	}
	return &comm, true
}

func getCommunityAndUser(c *gin.Context) (communityID, userID uint, ok bool) {
	idStr := c.Param("id")
	userIDVal, _ := c.Get("userID")
	userID = userIDVal.(uint)

	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return 0, 0, false
	}
	return comm.ID, userID, true
}

// GET /communities/:id/posts — посты сообщества.
func CommunityPostsList(c *gin.Context) {
	idStr := c.Param("id")
	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}

	var posts []models.CommunityPost
	if err := db.Preload("Author").Preload("Community").Where("community_id = ?", comm.ID).Order("created_at DESC").Limit(50).Find(&posts).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to load posts", nil)
		return
	}
	out := make([]CommunityPostItem, 0, len(posts))
	for i := range posts {
		out = append(out, toPostItem(&posts[i]))
	}
	c.JSON(http.StatusOK, gin.H{"posts": out})
}

func toPostItem(p *models.CommunityPost) CommunityPostItem {
	item := CommunityPostItem{
		ID:           p.ID,
		CommunityID:  p.CommunityID,
		AuthorID:     p.AuthorID,
		Title:        p.Title,
		Body:         p.Body,
		PreviewImage: p.PreviewImage,
		CreatedAt:    p.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if p.Attachments != nil && len(p.Attachments) > 0 {
		item.Attachments = p.Attachments
	}
	if p.Author.ID != 0 {
		if p.Author.Name != nil {
			item.AuthorName = *p.Author.Name
		} else if p.Author.Username != nil {
			item.AuthorName = *p.Author.Username
		}
		item.AuthorUsername = p.Author.Username
	}
	if p.Community.ID != 0 {
		item.CommunityName = p.Community.Name
		item.CommunitySlug = p.Community.Slug
	}
	return item
}

// POST /communities/:id/posts — создать пост (только создатель сообщества).
func CommunityPostCreate(c *gin.Context) {
	idStr := c.Param("id")
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}
	if comm.CreatorID != userID {
		api.RespondError(c, http.StatusForbidden, api.ErrCodeForbidden, "Only community creator can create posts", nil)
		return
	}

	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}

	post := models.CommunityPost{
		CommunityID:   comm.ID,
		AuthorID:      userID,
		Title:         strings.TrimSpace(input.Title),
		Body:          input.Body,
		PreviewImage:  input.PreviewImage,
		Attachments:   input.Attachments,
	}
	if err := db.Create(&post).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to create post", nil)
		return
	}
	_ = db.Preload("Author").Preload("Community").First(&post, post.ID)
	c.JSON(http.StatusCreated, toPostItem(&post))
}

// POST /communities/:id/posts/upload — загрузка изображения/видео для поста (только создатель сообщества).
func CommunityPostUpload(c *gin.Context) {
	idStr := c.Param("id")
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}
	if comm.CreatorID != userID {
		api.RespondError(c, http.StatusForbidden, api.ErrCodeForbidden, "Only community creator can upload post images", nil)
		return
	}

	cfg := deps.GetConfig(c)
	if cfg == nil || cfg.UploadDir == "" {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Upload not configured", nil)
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "file is required", nil)
		return
	}
	typeKind := c.PostForm("type")
	if typeKind == "" {
		typeKind = "image"
	}
	switch typeKind {
	case "image", "video":
	default:
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "type must be image or video", nil)
		return
	}
	maxSize := int64(cfg.MaxUploadSizeImage)
	if typeKind == "video" {
		maxSize = int64(cfg.MaxUploadSizeVideo)
	}
	path, err := storage.Save(cfg.UploadDir, typeKind, file, maxSize, c.PostForm("baseName"))
	if err != nil {
		api.RespondValidationError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"path": path})
}

// GET /communities/:id/posts/:postId — один пост. :id может быть числом или slug.
func CommunityPostGet(c *gin.Context) {
	idStr := c.Param("id")
	postIDStr := c.Param("postId")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid post ID", nil)
		return
	}
	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}
	var post models.CommunityPost
	if err := db.Preload("Author").Preload("Community").Where("id = ? AND community_id = ?", postID, comm.ID).First(&post).Error; err != nil {
		api.RespondNotFound(c, "Post not found")
		return
	}
	c.JSON(http.StatusOK, toPostItem(&post))
}

// PUT /communities/:id/posts/:postId — обновить пост (создатель сообщества или автор поста).
func CommunityPostUpdate(c *gin.Context) {
	idStr := c.Param("id")
	postIDStr := c.Param("postId")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid post ID", nil)
		return
	}
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}
	var post models.CommunityPost
	if err := db.Where("id = ? AND community_id = ?", postID, comm.ID).First(&post).Error; err != nil {
		api.RespondNotFound(c, "Post not found")
		return
	}
	if post.AuthorID != userID && comm.CreatorID != userID {
		api.RespondError(c, http.StatusForbidden, api.ErrCodeForbidden, "Only author or community creator can update", nil)
		return
	}

	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}
	post.Title = strings.TrimSpace(input.Title)
	post.Body = input.Body
	post.PreviewImage = input.PreviewImage
	post.Attachments = input.Attachments
	if err := db.Save(&post).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to update post", nil)
		return
	}
	_ = db.Preload("Author").Preload("Community").First(&post, post.ID)
	c.JSON(http.StatusOK, toPostItem(&post))
}

// DELETE /communities/:id/posts/:postId — удалить пост. :id может быть числом или slug.
func CommunityPostDelete(c *gin.Context) {
	idStr := c.Param("id")
	postIDStr := c.Param("postId")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid post ID", nil)
		return
	}
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	db := deps.GetDB(c)
	comm, found := resolveCommunity(db, idStr)
	if !found {
		api.RespondNotFound(c, "Community not found")
		return
	}
	var post models.CommunityPost
	if err := db.Where("id = ? AND community_id = ?", postID, comm.ID).First(&post).Error; err != nil {
		api.RespondNotFound(c, "Post not found")
		return
	}
	if post.AuthorID != userID && comm.CreatorID != userID {
		api.RespondError(c, http.StatusForbidden, api.ErrCodeForbidden, "Only author or community creator can delete", nil)
		return
	}
	if err := db.Delete(&post).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to delete", nil)
		return
	}
	c.Status(http.StatusNoContent)
}

// GetUserCommunitySubscriptionsByUsername — GET /users/username/:username/community-subscriptions.
// Список сообществ, на которые подписан пользователь. Требует права просмотра профиля.
func GetUserCommunitySubscriptionsByUsername(c *gin.Context) {
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
	userIDVal, hasUser := c.Get("userID")
	var viewerID uint
	if hasUser {
		viewerID = userIDVal.(uint)
	}

	var subs []models.CommunitySubscription
	db.Where("user_id = ?", owner.ID).Find(&subs)
	communityIDs := make([]uint, 0, len(subs))
	for _, s := range subs {
		communityIDs = append(communityIDs, s.CommunityID)
	}
	if len(communityIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"communities": []CommunityListItem{}})
		return
	}

	var list []models.Community
	if err := db.Preload("Creator").Where("id IN ?", communityIDs).Find(&list).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to load communities", nil)
		return
	}

	var subCounts []struct {
		CommunityID uint
		Count       int64
	}
	db.Model(&models.CommunitySubscription{}).Select("community_id, count(*) as count").Where("community_id IN ?", communityIDs).Group("community_id").Scan(&subCounts)
	subMap := make(map[uint]int)
	for _, r := range subCounts {
		subMap[r.CommunityID] = int(r.Count)
	}

	viewerSubscribed := make(map[uint]bool)
	if hasUser && viewerID > 0 {
		var viewerSubs []models.CommunitySubscription
		db.Where("user_id = ? AND community_id IN ?", viewerID, communityIDs).Find(&viewerSubs)
		for _, s := range viewerSubs {
			viewerSubscribed[s.CommunityID] = true
		}
	}

	out := make([]CommunityListItem, 0, len(list))
	for i := range list {
		item := CommunityListItem{
			ID:          list[i].ID,
			Name:        list[i].Name,
			Slug:        list[i].Slug,
			Description: list[i].Description,
			Avatar:      list[i].Avatar,
			Cover:       list[i].Cover,
			CreatorID:   list[i].CreatorID,
			Subscribers: subMap[list[i].ID],
		}
		if list[i].Creator.ID != 0 {
			if list[i].Creator.Name != nil {
				item.CreatorName = *list[i].Creator.Name
			} else if list[i].Creator.Username != nil {
				item.CreatorName = *list[i].Creator.Username
			}
		}
		if hasUser {
			item.IsSubscribed = viewerSubscribed[list[i].ID]
		}
		out = append(out, item)
	}
	c.JSON(http.StatusOK, gin.H{"communities": out})
}
