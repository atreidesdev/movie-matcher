package handlers

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/storage"
)

type NewsAuthor struct {
	ID       uint    `json:"id"`
	Username *string `json:"username"`
	Name     *string `json:"name"`
	Avatar   *string `json:"avatar"`
}

type NewsListItem struct {
	ID            uint       `json:"id"`
	CreatedAt     string     `json:"createdAt"`
	UpdatedAt     string     `json:"updatedAt"`
	AuthorID      uint       `json:"authorId"`
	Author        *NewsAuthor `json:"author,omitempty"`
	Title         string     `json:"title"`
	Slug          string     `json:"slug,omitempty"`
	PreviewImage  string     `json:"previewImage,omitempty"`
	PreviewTitle  string     `json:"previewTitle,omitempty"`
	Tags          string     `json:"tags,omitempty"`
	CommentCount  int        `json:"commentCount"`
}

type NewsDetailResponse struct {
	ID            uint                `json:"id"`
	CreatedAt     string              `json:"createdAt"`
	UpdatedAt     string              `json:"updatedAt"`
	AuthorID      uint                `json:"authorId"`
	Author        *NewsAuthor         `json:"author,omitempty"`
	Title         string              `json:"title"`
	Slug          string              `json:"slug,omitempty"`
	PreviewImage  string              `json:"previewImage,omitempty"`
	PreviewTitle  string              `json:"previewTitle,omitempty"`
	Body          string              `json:"body"`
	Tags          string              `json:"tags,omitempty"`
	Attachments   []models.NewsAttachment `json:"attachments,omitempty"`
	CommentCount  int                 `json:"commentCount"`
}

func toNewsAuthor(u *models.User) *NewsAuthor {
	if u == nil || u.ID == 0 {
		return nil
	}
	return &NewsAuthor{ID: u.ID, Username: u.Username, Name: u.Name, Avatar: u.Avatar}
}

func toNewsListItem(n *models.News, commentCount int) NewsListItem {
	item := NewsListItem{
		ID:           n.ID,
		CreatedAt:    n.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    n.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		AuthorID:     n.AuthorID,
		Title:        n.Title,
		Slug:         n.Slug,
		PreviewImage: n.PreviewImage,
		PreviewTitle: n.PreviewTitle,
		Tags:         n.Tags,
		CommentCount: commentCount,
	}
	if n.Author.ID != 0 {
		item.Author = toNewsAuthor(&n.Author)
	}
	return item
}

func toNewsDetail(n *models.News, commentCount int) NewsDetailResponse {
	resp := NewsDetailResponse{
		ID:           n.ID,
		CreatedAt:    n.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    n.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		AuthorID:     n.AuthorID,
		Title:        n.Title,
		Slug:         n.Slug,
		PreviewImage: n.PreviewImage,
		PreviewTitle: n.PreviewTitle,
		Body:         n.Body,
		Tags:         n.Tags,
		CommentCount: commentCount,
	}
	if n.Attachments != nil {
		resp.Attachments = n.Attachments
	}
	if n.Author.ID != 0 {
		resp.Author = toNewsAuthor(&n.Author)
	}
	return resp
}

// parseTagsFromString разбивает строку тегов (запятая, пробелы) в нижний регистр, без пустых.
func parseTagsFromString(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		t := strings.ToLower(strings.TrimSpace(p))
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}

func newsHasAnyTag(n *models.News, filterTags []string) bool {
	if len(filterTags) == 0 {
		return true
	}
	newsTags := parseTagsFromString(n.Tags)
	for _, ft := range filterTags {
		ft = strings.ToLower(strings.TrimSpace(ft))
		for _, nt := range newsTags {
			if nt == ft {
				return true
			}
		}
	}
	return false
}

// GET /news/tags — список уникальных тегов (для фильтра).
func NewsTags(c *gin.Context) {
	db := deps.GetDB(c)
	var list []models.News
	if err := db.Select("tags").Find(&list).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to load tags", nil)
		return
	}
	seen := make(map[string]struct{})
	for i := range list {
		for _, t := range parseTagsFromString(list[i].Tags) {
			seen[t] = struct{}{}
		}
	}
	tags := make([]string, 0, len(seen))
	for k := range seen {
		tags = append(tags, k)
	}

	sort.Strings(tags)
	c.JSON(http.StatusOK, gin.H{"tags": tags})
}

// GET /news — лента новостей (публично). Поддержка ?tags=tag1,tag2.
func NewsList(c *gin.Context) {
	db := deps.GetDB(c)
	var list []models.News
	if err := db.Order("created_at DESC").Preload("Author").Find(&list).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to load news", nil)
		return
	}
	filterTags := parseTagsFromString(c.Query("tags"))
	if len(filterTags) > 0 {
		filtered := make([]models.News, 0, len(list))
		for i := range list {
			if newsHasAnyTag(&list[i], filterTags) {
				filtered = append(filtered, list[i])
			}
		}
		list = filtered
	}
	if len(list) == 0 {
		c.JSON(http.StatusOK, gin.H{"news": []NewsListItem{}})
		return
	}
	ids := make([]uint, 0, len(list))
	for i := range list {
		ids = append(ids, list[i].ID)
	}
	var counts []struct {
		NewsID uint
		Count  int64
	}
	db.Model(&models.NewsComment{}).Select("news_id as news_id, count(*) as count").Where("news_id IN ?", ids).Group("news_id").Scan(&counts)
	countMap := make(map[uint]int)
	for _, r := range counts {
		countMap[r.NewsID] = int(r.Count)
	}
	out := make([]NewsListItem, 0, len(list))
	for i := range list {
		out = append(out, toNewsListItem(&list[i], countMap[list[i].ID]))
	}
	c.JSON(http.StatusOK, gin.H{"news": out})
}

// GET /news/:id — одна новость (публично).
func NewsGet(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid news ID", nil)
		return
	}
	db := deps.GetDB(c)
	var news models.News
	if err := db.Preload("Author").First(&news, id).Error; err != nil {
		api.RespondNotFound(c, "News not found")
		return
	}
	var commentCount int64
	db.Model(&models.NewsComment{}).Where("news_id = ?", news.ID).Count(&commentCount)
	c.JSON(http.StatusOK, toNewsDetail(&news, int(commentCount)))
}

type NewsCreateInput struct {
	Title        string                   `json:"title" binding:"required"`
	Slug         string                   `json:"slug"`
	PreviewImage string                   `json:"previewImage"`
	PreviewTitle string                   `json:"previewTitle"`
	Body        string                   `json:"body" binding:"required"`
	Tags        string                   `json:"tags"`
	Attachments []models.NewsAttachment   `json:"attachments"`
}

// POST /admin/news
func NewsCreate(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	authorID := userIDVal.(uint)

	var input NewsCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}

	news := models.News{
		AuthorID:     authorID,
		Title:        strings.TrimSpace(input.Title),
		Slug:         strings.TrimSpace(input.Slug),
		PreviewImage: strings.TrimSpace(input.PreviewImage),
		PreviewTitle: strings.TrimSpace(input.PreviewTitle),
		Body:         input.Body,
		Tags:         strings.TrimSpace(input.Tags),
		Attachments:  input.Attachments,
	}
	if err := deps.GetDB(c).Create(&news).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to create news", nil)
		return
	}
	db := deps.GetDB(c)
	_ = db.Preload("Author").First(&news, news.ID)
	c.JSON(http.StatusCreated, toNewsDetail(&news, 0))
}

// PUT /admin/news/:id
func NewsUpdate(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid news ID", nil)
		return
	}
	db := deps.GetDB(c)
	var news models.News
	if err := db.First(&news, id).Error; err != nil {
		api.RespondNotFound(c, "News not found")
		return
	}

	var input NewsCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}

	news.Title = strings.TrimSpace(input.Title)
	news.Slug = strings.TrimSpace(input.Slug)
	news.PreviewImage = strings.TrimSpace(input.PreviewImage)
	news.PreviewTitle = strings.TrimSpace(input.PreviewTitle)
	news.Body = input.Body
	news.Tags = strings.TrimSpace(input.Tags)
	news.Attachments = input.Attachments
	if err := db.Save(&news).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to update news", nil)
		return
	}
	_ = db.Preload("Author").First(&news, news.ID)
	var commentCount int64
	db.Model(&models.NewsComment{}).Where("news_id = ?", news.ID).Count(&commentCount)
	c.JSON(http.StatusOK, toNewsDetail(&news, int(commentCount)))
}

// POST /admin/news/upload — загрузка изображения/видео (превью или вложение).
func NewsUpload(c *gin.Context) {
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

// DELETE /admin/news/:id
func NewsDelete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid news ID", nil)
		return
	}
	if err := deps.GetDB(c).Delete(&models.News{}, id).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to delete news", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "News deleted"})
}

type NewsCommentResponse struct {
	ID           uint                  `json:"id"`
	CreatedAt    string                `json:"createdAt"`
	Text         string                `json:"text"`
	Depth        int                   `json:"depth"`
	PlusCount    int                   `json:"plusCount"`
	MinusCount   int                   `json:"minusCount"`
	UserID       uint                  `json:"userId"`
	User         *NewsAuthor           `json:"user,omitempty"`
	ParentID     *uint                 `json:"parentId"`
	RepliesCount int                   `json:"repliesCount"`
	Replies      []NewsCommentResponse `json:"replies,omitempty"`
}

func toNewsCommentResponse(c *models.NewsComment) NewsCommentResponse {
	r := NewsCommentResponse{
		ID:        c.ID,
		CreatedAt: c.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		Text:      c.Text,
		Depth:     c.Depth,
		PlusCount: c.PlusCount,
		MinusCount: c.MinusCount,
		UserID:    c.UserID,
		ParentID:  c.ParentID,
	}
	if c.User.ID != 0 {
		r.User = toNewsAuthor(&c.User)
	}
	if c.RepliesCount > 0 {
		r.RepliesCount = c.RepliesCount
	}
	return r
}

func buildNewsCommentTree(comments []models.NewsComment) []NewsCommentResponse {
	type key = uint
	byID := make(map[key]models.NewsComment)
	for _, c := range comments {
		byID[c.ID] = c
	}
	var roots []NewsCommentResponse
	for _, c := range comments {
		if c.ParentID == nil {
			roots = append(roots, buildNewsCommentNode(c, comments, byID))
		}
	}

	for i := 0; i < len(roots); i++ {
		for j := i + 1; j < len(roots); j++ {
			if roots[j].CreatedAt < roots[i].CreatedAt {
				roots[i], roots[j] = roots[j], roots[i]
			}
		}
	}
	return roots
}

func buildNewsCommentNode(c models.NewsComment, all []models.NewsComment, byID map[uint]models.NewsComment) NewsCommentResponse {
	node := toNewsCommentResponse(&c)
	for _, child := range all {
		if child.ParentID != nil && *child.ParentID == c.ID {
			node.Replies = append(node.Replies, buildNewsCommentNode(child, all, byID))
			node.RepliesCount++
		}
	}
	return node
}

// GET /news/:id/comments — список комментариев (дерево).
func NewsCommentsList(c *gin.Context) {
	idStr := c.Param("id")
	newsID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid news ID", nil)
		return
	}
	db := deps.GetDB(c)
	var count int64
	if err := db.Model(&models.News{}).Where("id = ?", newsID).Count(&count).Error; err != nil || count == 0 {
		api.RespondNotFound(c, "News not found")
		return
	}
	var comments []models.NewsComment
	if err := db.Where("news_id = ?", newsID).Preload("User").Order("created_at ASC").Find(&comments).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to load comments", nil)
		return
	}
	var parentIDs []uint
	for _, c := range comments {
		if c.ParentID != nil {
			parentIDs = append(parentIDs, *c.ParentID)
		}
	}
	counts := make(map[uint]int)
	for _, pid := range parentIDs {
		counts[pid]++
	}
	for i := range comments {
		comments[i].RepliesCount = counts[comments[i].ID]
	}
	tree := buildNewsCommentTree(comments)
	c.JSON(http.StatusOK, gin.H{"comments": tree})
}

// POST /news/:id/comments
func NewsCommentCreate(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	idStr := c.Param("id")
	newsID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid news ID", nil)
		return
	}
	db := deps.GetDB(c)
	var news models.News
	if err := db.First(&news, newsID).Error; err != nil {
		api.RespondNotFound(c, "News not found")
		return
	}
	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}
	depth := 0
	if req.ParentID != nil {
		var parent models.NewsComment
		if err := db.Where("id = ? AND news_id = ?", *req.ParentID, newsID).First(&parent).Error; err != nil {
			api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Parent comment not found", nil)
			return
		}
		depth = parent.Depth + 1
	}
	comment := models.NewsComment{
		NewsID:   uint(newsID),
		UserID:   userID,
		Text:     strings.TrimSpace(req.Text),
		ParentID: req.ParentID,
		Depth:    depth,
	}
	if err := db.Create(&comment).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to create comment", nil)
		return
	}
	if req.ParentID != nil {
		var parent models.NewsComment
		if db.First(&parent, *req.ParentID).Error == nil && parent.UserID != userID {
			preview := strings.TrimSpace(req.Text)
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "news", uint(newsID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}
	_ = db.Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, toNewsCommentResponse(&comment))
}

// DELETE /news/:id/comments/:commentId
func NewsCommentDelete(c *gin.Context) {
	newsIDStr := c.Param("id")
	commentIDStr := c.Param("commentId")
	newsID, err1 := strconv.ParseUint(newsIDStr, 10, 32)
	commentID, err2 := strconv.ParseUint(commentIDStr, 10, 32)
	if err1 != nil || err2 != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid ID", nil)
		return
	}
	db := deps.GetDB(c)
	var comment models.NewsComment
	if err := db.Where("id = ? AND news_id = ?", commentID, newsID).First(&comment).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}
	if err := db.Delete(&comment).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to delete comment", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

// PUT /news/:id/comments/:commentId — только автор.
func NewsCommentUpdate(c *gin.Context) {
	newsIDStr := c.Param("id")
	commentIDStr := c.Param("commentId")
	newsID, err1 := strconv.ParseUint(newsIDStr, 10, 32)
	commentID, err2 := strconv.ParseUint(commentIDStr, 10, 32)
	if err1 != nil || err2 != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeBadRequest, "Invalid ID", nil)
		return
	}
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	db := deps.GetDB(c)
	var comment models.NewsComment
	if err := db.Where("id = ? AND news_id = ?", commentID, newsID).First(&comment).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondError(c, http.StatusBadRequest, api.ErrCodeValidation, err.Error(), nil)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := db.Save(&comment).Error; err != nil {
		api.RespondError(c, http.StatusInternalServerError, api.ErrCodeInternal, "Failed to update comment", nil)
		return
	}
	_ = db.Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusOK, toNewsCommentResponse(&comment))
}
