package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

// entityTypeToDB конвертирует тип из URL/фронта (tv-series) в значение для БД (tv_series).
func entityTypeToDB(s string) string {
	return strings.ReplaceAll(strings.TrimSpace(s), "-", "_")
}

// ListDiscussions godoc
// @Summary  List discussions for entity
// @Tags     Discussions
// @Param    entityType  query  string  true   "Entity type (e.g. tv-series)"
// @Param    entityId   query  int     true   "Entity ID"
// @Param    page       query  int     false  "Page"  default(0)
// @Param    pageSize   query  int     false  "Page size"  default(20)
// @Success  200  {object}  map[string]interface{}  "discussions, total"
// @Router   /discussions [get]
func ListDiscussions(c *gin.Context) {
	entityType := entityTypeToDB(c.Query("entityType"))
	entityIDStr := c.Query("entityId")
	if entityType == "" || entityIDStr == "" {
		api.RespondBadRequest(c, "entityType and entityId are required", nil)
		return
	}
	entityID, err := strconv.ParseUint(entityIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid entityId", nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if pageSize <= 0 {
		pageSize = 20
	}
	if page < 0 {
		page = 0
	}

	db := deps.GetDB(c)
	var total int64
	db.Model(&models.Discussion{}).Where("entity_type = ? AND entity_id = ?", entityType, entityID).Count(&total)

	var list []models.Discussion
	err = db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("updated_at DESC").
		Preload("User").
		Limit(pageSize).Offset(page * pageSize).
		Find(&list).Error
	if err != nil {
		api.RespondInternal(c, err.Error())
		return
	}

	for i := range list {
		var count int64
		db.Model(&models.DiscussionComment{}).Where("discussion_id = ?", list[i].ID).Count(&count)
		list[i].CommentsCount = int(count)
	}

	c.JSON(http.StatusOK, gin.H{"discussions": list, "total": total})
}

type CreateDiscussionRequest struct {
	EntityType  string `json:"entityType" binding:"required"`
	EntityID    uint   `json:"entityId" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}

// CreateDiscussion godoc
// @Summary  Create discussion (auth required)
// @Tags     Discussions
// @Accept   json
// @Produce  json
// @Param    body  body  CreateDiscussionRequest  true  "entityType, entityId, title, description"
// @Success  201  {object}  models.Discussion
// @Security BearerAuth
// @Router   /discussions [post]
func CreateDiscussion(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req CreateDiscussionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	entityType := entityTypeToDB(req.EntityType)
	if entityType == "" {
		api.RespondBadRequest(c, "entityType is required", nil)
		return
	}
	if len(req.Title) > 512 {
		api.RespondBadRequest(c, "title too long", nil)
		return
	}

	d := models.Discussion{
		EntityType:  entityType,
		EntityID:    req.EntityID,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		UserID:      userID,
	}
	if d.Title == "" {
		api.RespondBadRequest(c, "title is required", nil)
		return
	}

	db := deps.GetDB(c)
	if err := db.Create(&d).Error; err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	if err := db.Preload("User").First(&d, d.ID).Error; err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	d.CommentsCount = 0
	c.JSON(http.StatusCreated, d)
}

func GetDiscussion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid discussion id", nil)
		return
	}
	db := deps.GetDB(c)
	var d models.Discussion
	if err := db.Preload("User").First(&d, id).Error; err != nil {
		api.RespondNotFound(c, "Discussion not found")
		return
	}
	var count int64
	db.Model(&models.DiscussionComment{}).Where("discussion_id = ?", d.ID).Count(&count)
	d.CommentsCount = int(count)
	c.JSON(http.StatusOK, d)
}

const defaultDiscussionCommentsPageSize = 10

func getDiscussionCommentsPage(c *gin.Context, discussionID uint, page, pageSize int) ([]models.DiscussionComment, int64) {
	db := deps.GetDB(c)
	if pageSize <= 0 {
		pageSize = defaultDiscussionCommentsPageSize
	}
	var total int64
	db.Model(&models.DiscussionComment{}).Where("discussion_id = ? AND parent_id IS NULL", discussionID).Count(&total)

	var roots []models.DiscussionComment
	db.Where("discussion_id = ? AND parent_id IS NULL", discussionID).
		Order("created_at ASC").
		Preload("User").
		Limit(pageSize).Offset(page * pageSize).
		Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}

	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.DiscussionComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentDiscussion(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.DiscussionComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentDiscussion(grandchildren)

	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.DiscussionComment{gc}
			}
			roots[i].Replies = []models.DiscussionComment{fc}
		}
	}
	setDiscussionRepliesCount(db, &roots)
	return roots, total
}

func firstReplyByParentDiscussion(comments []models.DiscussionComment) map[uint]models.DiscussionComment {
	out := make(map[uint]models.DiscussionComment)
	for _, c := range comments {
		if c.ParentID == nil {
			continue
		}
		pID := *c.ParentID
		if _, ok := out[pID]; !ok {
			out[pID] = c
		}
	}
	return out
}

func collectDiscussionCommentIDs(comments []models.DiscussionComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectDiscussionCommentIDs(c.Replies)...)
	}
	return ids
}

func setDiscussionRepliesCount(db *gorm.DB, comments *[]models.DiscussionComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectDiscussionCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.DiscussionComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyDiscussionRepliesCount(comments, byParent)
}

func applyDiscussionRepliesCount(comments *[]models.DiscussionComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyDiscussionRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

// toCommentShape приводит DiscussionComment к формату Comment для фронта (id, text, userId, user, parentId, depth, plusCount, minusCount, replies, repliesCount, createdAt).
func toCommentShape(d *models.DiscussionComment) map[string]interface{} {
	out := map[string]interface{}{
		"id":         d.ID,
		"text":       d.Text,
		"userId":     d.UserID,
		"depth":      d.Depth,
		"createdAt":  d.CreatedAt,
		"plusCount":  d.PlusCount,
		"minusCount": d.MinusCount,
		"repliesCount": d.RepliesCount,
	}
	if d.User.ID != 0 {
		out["user"] = map[string]interface{}{
			"id": d.User.ID, "email": d.User.Email,
			"name": d.User.Name, "avatar": d.User.Avatar,
		}
	}
	if d.ParentID != nil {
		out["parentId"] = *d.ParentID
	}
	if len(d.Replies) > 0 {
		replies := make([]map[string]interface{}, 0, len(d.Replies))
		for i := range d.Replies {
			replies = append(replies, toCommentShape(&d.Replies[i]))
		}
		out["replies"] = replies
	}
	return out
}

func GetDiscussionComments(c *gin.Context) {
	idStr := c.Param("id")
	discussionID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid discussion id", nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	var d models.Discussion
	if err := deps.GetDB(c).First(&d, discussionID).Error; err != nil {
		api.RespondNotFound(c, "Discussion not found")
		return
	}

	comments, total := getDiscussionCommentsPage(c, uint(discussionID), page, pageSize)
	out := make([]map[string]interface{}, 0, len(comments))
	for i := range comments {
		out = append(out, toCommentShape(&comments[i]))
	}
	c.JSON(http.StatusOK, gin.H{"comments": out, "total": total})
}

func GetDiscussionCommentReplies(c *gin.Context) {
	discussionIDStr := c.Param("id")
	commentIDStr := c.Param("commentId")
	discussionID, err1 := strconv.ParseUint(discussionIDStr, 10, 32)
	commentID, err2 := strconv.ParseUint(commentIDStr, 10, 32)
	if err1 != nil || err2 != nil {
		api.RespondBadRequest(c, "Invalid id", nil)
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}

	db := deps.GetDB(c)
	var total int64
	db.Model(&models.DiscussionComment{}).Where("discussion_id = ? AND parent_id = ?", discussionID, commentID).Count(&total)
	var children []models.DiscussionComment
	db.Where("discussion_id = ? AND parent_id = ?", discussionID, commentID).
		Order("created_at ASC").
		Preload("User").
		Limit(limit).Offset(offset).
		Find(&children)
	out := make([]map[string]interface{}, 0, len(children))
	for i := range children {
		setDiscussionRepliesCount(db, &children[i].Replies)
		out = append(out, toCommentShape(&children[i]))
	}
	c.JSON(http.StatusOK, gin.H{"replies": out, "total": total})
}

func CreateDiscussionComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	discussionIDStr := c.Param("id")
	discussionID, err := strconv.ParseUint(discussionIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid discussion id", nil)
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	db := deps.GetDB(c)
	var disc models.Discussion
	if err := db.First(&disc, discussionID).Error; err != nil {
		api.RespondNotFound(c, "Discussion not found")
		return
	}

	depth := 0
	if req.ParentID != nil {
		var parent models.DiscussionComment
		if err := db.Where("discussion_id = ? AND id = ?", discussionID, *req.ParentID).First(&parent).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		depth = parent.Depth + 1
	}

	comment := models.DiscussionComment{
		DiscussionID: uint(discussionID),
		UserID:       userID,
		Text:         req.Text,
		ParentID:     req.ParentID,
		Depth:        depth,
	}
	if err := db.Create(&comment).Error; err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	if err := db.Preload("User").First(&comment, comment.ID).Error; err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	c.JSON(http.StatusCreated, toCommentShape(&comment))
}

func UpdateDiscussionComment(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	discussionIDStr := c.Param("id")
	commentIDStr := c.Param("commentId")
	discussionID, _ := strconv.ParseUint(discussionIDStr, 10, 32)
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}

	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	db := deps.GetDB(c)
	var comment models.DiscussionComment
	if err := db.Where("discussion_id = ? AND id = ?", discussionID, commentID).First(&comment).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userIDVal.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only author can edit"})
		return
	}
	comment.Text = req.Text
	if err := db.Save(&comment).Error; err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	if err := db.Preload("User").First(&comment, comment.ID).Error; err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, toCommentShape(&comment))
}

func DeleteDiscussionComment(c *gin.Context) {
	_, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	discussionIDStr := c.Param("id")
	commentIDStr := c.Param("commentId")
	discussionID, _ := strconv.ParseUint(discussionIDStr, 10, 32)
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}

	db := deps.GetDB(c)
	var comment models.DiscussionComment
	if err := db.Where("discussion_id = ? AND id = ?", discussionID, commentID).First(&comment).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}
	if err := db.Delete(&comment).Error; err != nil {
		api.RespondInternal(c, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}
