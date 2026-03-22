package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/ws"
)

const defaultCommentsPageSize = 10

// canDeleteComment проверяет: пользователь — автор комментария или модератор/админ.
func canDeleteComment(c *gin.Context, commentUserID uint) bool {
	userIDVal, ok := c.Get("userID")
	if !ok {
		return false
	}
	currentID := userIDVal.(uint)
	if currentID == commentUserID {
		return true
	}
	db := deps.GetDB(c)
	var user models.User
	if err := db.First(&user, currentID).Error; err != nil {
		return false
	}
	return user.CanDeleteAnyComment()
}

func checkCommentBan(c *gin.Context) bool {
	userIDVal, ok := c.Get("userID")
	if !ok {
		return true
	}
	db := deps.GetDB(c)
	var user models.User
	if err := db.First(&user, userIDVal).Error; err != nil {
		return true
	}
	if user.CommentBanUntil != nil && time.Now().Before(*user.CommentBanUntil) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are temporarily banned from commenting", "commentBanUntil": user.CommentBanUntil})
		return false
	}
	return true
}

type CreateCommentRequest struct {
	Text     string `json:"text" binding:"required"`
	ParentID *uint  `json:"parentId"`
}

type UpdateCommentRequest struct {
	Text string `json:"text" binding:"required"`
}

func getMovieCommentsPage(c *gin.Context, movieID string, page, pageSize int) ([]models.MovieComment, int64) {
	db := deps.GetDB(c)
	mID, _ := strconv.ParseUint(movieID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.MovieComment{}).Where("movie_id = ? AND parent_id IS NULL", mID).Count(&total)

	var roots []models.MovieComment
	db.Where("movie_id = ? AND parent_id IS NULL", mID).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}

	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}

	var firstChildren []models.MovieComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParent(firstChildren)

	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.MovieComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParent(grandchildren)

	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.MovieComment{gc}
			}
			roots[i].Replies = []models.MovieComment{fc}
		}
	}
	setMovieRepliesCountTree(c, &roots)
	return roots, total
}

func setMovieRepliesCountTree(c *gin.Context, comments *[]models.MovieComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectMovieCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.MovieComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyMovieRepliesCount(comments, byParent)
}

func collectMovieCommentIDs(comments []models.MovieComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectMovieCommentIDs(c.Replies)...)
	}
	return ids
}

func applyMovieRepliesCount(comments *[]models.MovieComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyMovieRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

// firstReplyByParent оставляет для каждого parent_id только первый по created_at ответ.
func firstReplyByParent(comments []models.MovieComment) map[uint]models.MovieComment {
	out := make(map[uint]models.MovieComment)
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

func firstReplyByParentAnime(comments []models.AnimeSeriesComment) map[uint]models.AnimeSeriesComment {
	out := make(map[uint]models.AnimeSeriesComment)
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

func firstReplyByParentGame(comments []models.GameComment) map[uint]models.GameComment {
	out := make(map[uint]models.GameComment)
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

func firstReplyByParentManga(comments []models.MangaComment) map[uint]models.MangaComment {
	out := make(map[uint]models.MangaComment)
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

func firstReplyByParentBook(comments []models.BookComment) map[uint]models.BookComment {
	out := make(map[uint]models.BookComment)
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

func firstReplyByParentLightNovel(comments []models.LightNovelComment) map[uint]models.LightNovelComment {
	out := make(map[uint]models.LightNovelComment)
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

func firstReplyByParentPerson(comments []models.PersonComment) map[uint]models.PersonComment {
	out := make(map[uint]models.PersonComment)
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

func firstReplyByParentCharacter(comments []models.CharacterComment) map[uint]models.CharacterComment {
	out := make(map[uint]models.CharacterComment)
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

func GetMovieComments(c *gin.Context) {
	movieID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	comments, total := getMovieCommentsPage(c, movieID, page, pageSize)
	ids := collectMovieCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityMovie, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetMovieCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.MovieComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.MovieComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.MovieComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParent(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.MovieComment{gc}
		}
	}
	setMovieRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateMovieComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	movieID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var movie models.Movie
	if err := deps.GetDB(c).First(&movie, movieID).Error; err != nil {
		api.RespondNotFound(c, "Movie not found")
		return
	}

	comment := models.MovieComment{
		UserID:   userID.(uint),
		MovieID:  uint(movieID),
		Text:     req.Text,
		ParentID: req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.MovieComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.MovieComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "movie", uint(movieID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("movies", uint(movieID), ws.CommentMessage{
				Type: "new", EntityType: "movies", EntityID: uint(movieID), Payload: payload,
			})
		}
	}
	c.JSON(http.StatusCreated, comment)
}

func DeleteMovieComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.MovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	movieID := comment.MovieID
	deps.GetDB(c).Delete(&comment)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(gin.H{"commentId": comment.ID}); err == nil {
			ws.GlobalCommentsHub.Broadcast("movies", movieID, ws.CommentMessage{
				Type: "deleted", EntityType: "movies", EntityID: movieID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateMovieComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.MovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("movies", comment.MovieID, ws.CommentMessage{
				Type: "updated", EntityType: "movies", EntityID: comment.MovieID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, comment)
}

func getAnimeCommentsPage(c *gin.Context, animeID string, page, pageSize int) ([]models.AnimeSeriesComment, int64) {
	db := deps.GetDB(c)
	aID, _ := strconv.ParseUint(animeID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.AnimeSeriesComment{}).Where("anime_series_id = ? AND parent_id IS NULL", aID).Count(&total)
	var roots []models.AnimeSeriesComment
	db.Where("anime_series_id = ? AND parent_id IS NULL", aID).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.AnimeSeriesComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentAnime(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.AnimeSeriesComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentAnime(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.AnimeSeriesComment{gc}
			}
			roots[i].Replies = []models.AnimeSeriesComment{fc}
		}
	}
	setAnimeRepliesCountTree(c, &roots)
	return roots, total
}

func setAnimeRepliesCountTree(c *gin.Context, comments *[]models.AnimeSeriesComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectAnimeCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.AnimeSeriesComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyAnimeRepliesCount(comments, byParent)
}

func collectAnimeCommentIDs(comments []models.AnimeSeriesComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectAnimeCommentIDs(c.Replies)...)
	}
	return ids
}

func applyAnimeRepliesCount(comments *[]models.AnimeSeriesComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyAnimeRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetAnimeComments(c *gin.Context) {
	animeID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getAnimeCommentsPage(c, animeID, page, pageSize)
	ids := collectAnimeCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityAnime, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetAnimeCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.AnimeSeriesComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.AnimeSeriesComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.AnimeSeriesComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentAnime(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.AnimeSeriesComment{gc}
		}
	}
	setAnimeRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateAnimeComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	animeID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var anime models.AnimeSeries
	if err := deps.GetDB(c).First(&anime, animeID).Error; err != nil {
		api.RespondNotFound(c, "Anime not found")
		return
	}

	comment := models.AnimeSeriesComment{
		UserID:        userID.(uint),
		AnimeSeriesID: uint(animeID),
		Text:          req.Text,
		ParentID:      req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.AnimeSeriesComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.AnimeSeriesComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "anime", uint(animeID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("anime", uint(animeID), ws.CommentMessage{
				Type: "new", EntityType: "anime", EntityID: uint(animeID), Payload: payload,
			})
		}
	}
	c.JSON(http.StatusCreated, comment)
}

func DeleteAnimeComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.AnimeSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	animeID := comment.AnimeSeriesID
	deps.GetDB(c).Delete(&comment)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(gin.H{"commentId": comment.ID}); err == nil {
			ws.GlobalCommentsHub.Broadcast("anime", animeID, ws.CommentMessage{
				Type: "deleted", EntityType: "anime", EntityID: animeID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateAnimeComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.AnimeSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("anime", comment.AnimeSeriesID, ws.CommentMessage{
				Type: "updated", EntityType: "anime", EntityID: comment.AnimeSeriesID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, comment)
}

func getGameCommentsPage(c *gin.Context, gameID string, page, pageSize int) ([]models.GameComment, int64) {
	db := deps.GetDB(c)
	gID, _ := strconv.ParseUint(gameID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.GameComment{}).Where("game_id = ? AND parent_id IS NULL", gID).Count(&total)
	var roots []models.GameComment
	db.Where("game_id = ? AND parent_id IS NULL", gID).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.GameComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentGame(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.GameComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentGame(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.GameComment{gc}
			}
			roots[i].Replies = []models.GameComment{fc}
		}
	}
	setGameRepliesCountTree(c, &roots)
	return roots, total
}

func setGameRepliesCountTree(c *gin.Context, comments *[]models.GameComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectGameCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.GameComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyGameRepliesCount(comments, byParent)
}

func collectGameCommentIDs(comments []models.GameComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectGameCommentIDs(c.Replies)...)
	}
	return ids
}

func applyGameRepliesCount(comments *[]models.GameComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyGameRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetGameComments(c *gin.Context) {
	gameID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getGameCommentsPage(c, gameID, page, pageSize)
	ids := collectGameCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityGame, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetGameCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.GameComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.GameComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.GameComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentGame(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.GameComment{gc}
		}
	}
	setGameRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateGameComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	gameID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var game models.Game
	if err := deps.GetDB(c).First(&game, gameID).Error; err != nil {
		api.RespondNotFound(c, "Game not found")
		return
	}

	comment := models.GameComment{
		UserID:   userID.(uint),
		GameID:   uint(gameID),
		Text:     req.Text,
		ParentID: req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.GameComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.GameComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "game", uint(gameID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("games", uint(gameID), ws.CommentMessage{
				Type: "new", EntityType: "games", EntityID: uint(gameID), Payload: payload,
			})
		}
	}
	c.JSON(http.StatusCreated, comment)
}

func DeleteGameComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.GameComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	gameID := comment.GameID
	deps.GetDB(c).Delete(&comment)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(gin.H{"commentId": comment.ID}); err == nil {
			ws.GlobalCommentsHub.Broadcast("games", gameID, ws.CommentMessage{
				Type: "deleted", EntityType: "games", EntityID: gameID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateGameComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.GameComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("games", comment.GameID, ws.CommentMessage{
				Type: "updated", EntityType: "games", EntityID: comment.GameID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, comment)
}

func getMangaCommentsPage(c *gin.Context, mangaID string, page, pageSize int) ([]models.MangaComment, int64) {
	db := deps.GetDB(c)
	mID, _ := strconv.ParseUint(mangaID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.MangaComment{}).Where("manga_id = ? AND parent_id IS NULL", mID).Count(&total)
	var roots []models.MangaComment
	db.Where("manga_id = ? AND parent_id IS NULL", mID).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.MangaComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentManga(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.MangaComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentManga(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.MangaComment{gc}
			}
			roots[i].Replies = []models.MangaComment{fc}
		}
	}
	setMangaRepliesCountTree(c, &roots)
	return roots, total
}

func setMangaRepliesCountTree(c *gin.Context, comments *[]models.MangaComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectMangaCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.MangaComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyMangaRepliesCount(comments, byParent)
}

func collectMangaCommentIDs(comments []models.MangaComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectMangaCommentIDs(c.Replies)...)
	}
	return ids
}

func applyMangaRepliesCount(comments *[]models.MangaComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyMangaRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetMangaComments(c *gin.Context) {
	mangaID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getMangaCommentsPage(c, mangaID, page, pageSize)
	ids := collectMangaCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityManga, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetMangaCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.MangaComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.MangaComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.MangaComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentManga(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.MangaComment{gc}
		}
	}
	setMangaRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateMangaComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	mangaID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var manga models.Manga
	if err := deps.GetDB(c).First(&manga, mangaID).Error; err != nil {
		api.RespondNotFound(c, "Manga not found")
		return
	}

	comment := models.MangaComment{
		UserID:   userID.(uint),
		MangaID:  uint(mangaID),
		Text:     req.Text,
		ParentID: req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.MangaComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.MangaComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "manga", uint(mangaID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}

func DeleteMangaComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.MangaComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	deps.GetDB(c).Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateMangaComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.MangaComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusOK, comment)
}

func getBookCommentsPage(c *gin.Context, bookID string, page, pageSize int) ([]models.BookComment, int64) {
	db := deps.GetDB(c)
	bID, _ := strconv.ParseUint(bookID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.BookComment{}).Where("book_id = ? AND parent_id IS NULL", bID).Count(&total)
	var roots []models.BookComment
	db.Where("book_id = ? AND parent_id IS NULL", bID).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.BookComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentBook(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.BookComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentBook(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.BookComment{gc}
			}
			roots[i].Replies = []models.BookComment{fc}
		}
	}
	setBookRepliesCountTree(c, &roots)
	return roots, total
}

func setBookRepliesCountTree(c *gin.Context, comments *[]models.BookComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectBookCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.BookComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyBookRepliesCount(comments, byParent)
}

func collectBookCommentIDs(comments []models.BookComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectBookCommentIDs(c.Replies)...)
	}
	return ids
}

func applyBookRepliesCount(comments *[]models.BookComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyBookRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetBookComments(c *gin.Context) {
	bookID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getBookCommentsPage(c, bookID, page, pageSize)
	ids := collectBookCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityBook, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetBookCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.BookComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.BookComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.BookComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentBook(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.BookComment{gc}
		}
	}
	setBookRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateBookComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	bookID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var book models.Book
	if err := deps.GetDB(c).First(&book, bookID).Error; err != nil {
		api.RespondNotFound(c, "Book not found")
		return
	}

	comment := models.BookComment{
		UserID:   userID.(uint),
		BookID:   uint(bookID),
		Text:     req.Text,
		ParentID: req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.BookComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.BookComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "book", uint(bookID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}

func DeleteBookComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.BookComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	deps.GetDB(c).Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateBookComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.BookComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusOK, comment)
}

func getLightNovelCommentsPage(c *gin.Context, novelID string, page, pageSize int) ([]models.LightNovelComment, int64) {
	db := deps.GetDB(c)
	nID, _ := strconv.ParseUint(novelID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.LightNovelComment{}).Where("light_novel_id = ? AND parent_id IS NULL", nID).Count(&total)
	var roots []models.LightNovelComment
	db.Where("light_novel_id = ? AND parent_id IS NULL", nID).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.LightNovelComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentLightNovel(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, el := range firstByParent {
		childIDs = append(childIDs, el.ID)
	}
	var grandchildren []models.LightNovelComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentLightNovel(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.LightNovelComment{gc}
			}
			roots[i].Replies = []models.LightNovelComment{fc}
		}
	}
	setLightNovelRepliesCountTree(c, &roots)
	return roots, total
}

func setLightNovelRepliesCountTree(c *gin.Context, comments *[]models.LightNovelComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectLightNovelCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.LightNovelComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyLightNovelRepliesCount(comments, byParent)
}

func collectLightNovelCommentIDs(comments []models.LightNovelComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectLightNovelCommentIDs(c.Replies)...)
	}
	return ids
}

func applyLightNovelRepliesCount(comments *[]models.LightNovelComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyLightNovelRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetLightNovelComments(c *gin.Context) {
	novelID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getLightNovelCommentsPage(c, novelID, page, pageSize)
	ids := collectLightNovelCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityLightNovel, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetLightNovelCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.LightNovelComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.LightNovelComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.LightNovelComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentLightNovel(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.LightNovelComment{gc}
		}
	}
	setLightNovelRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func GetPersonCommentsPage(c *gin.Context, personID string, page, pageSize int) ([]models.PersonComment, int64) {
	db := deps.GetDB(c)
	pID, _ := strconv.ParseUint(personID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.PersonComment{}).Where("person_id = ? AND parent_id IS NULL", pID).Count(&total)
	var roots []models.PersonComment
	db.Where("person_id = ? AND parent_id IS NULL", pID).
		Order("created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.PersonComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentPerson(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, el := range firstByParent {
		childIDs = append(childIDs, el.ID)
	}
	var grandchildren []models.PersonComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentPerson(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.PersonComment{gc}
			}
			roots[i].Replies = []models.PersonComment{fc}
		}
	}
	return roots, total
}

func GetPersonCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.PersonComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.PersonComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.PersonComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentPerson(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.PersonComment{gc}
		}
	}
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func GetCharacterCommentsPage(c *gin.Context, characterID string, page, pageSize int) ([]models.CharacterComment, int64) {
	db := deps.GetDB(c)
	cID, _ := strconv.ParseUint(characterID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.CharacterComment{}).Where("character_id = ? AND parent_id IS NULL", cID).Count(&total)
	var roots []models.CharacterComment
	db.Where("character_id = ? AND parent_id IS NULL", cID).
		Order("created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.CharacterComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentCharacter(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, el := range firstByParent {
		childIDs = append(childIDs, el.ID)
	}
	var grandchildren []models.CharacterComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentCharacter(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.CharacterComment{gc}
			}
			roots[i].Replies = []models.CharacterComment{fc}
		}
	}
	return roots, total
}

func GetCharacterCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.CharacterComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.CharacterComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.CharacterComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentCharacter(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.CharacterComment{gc}
		}
	}
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateLightNovelComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	novelID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var novel models.LightNovel
	if err := deps.GetDB(c).First(&novel, novelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Light novel not found"})
		return
	}

	comment := models.LightNovelComment{
		UserID:       userID.(uint),
		LightNovelID: uint(novelID),
		Text:         req.Text,
		ParentID:     req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.LightNovelComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.LightNovelComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "light-novel", uint(novelID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}

func DeleteLightNovelComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.LightNovelComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	deps.GetDB(c).Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateLightNovelComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.LightNovelComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusOK, comment)
}

func CreatePersonComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	personID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var person models.Person
	if err := deps.GetDB(c).First(&person, personID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Person not found"})
		return
	}

	comment := models.PersonComment{
		UserID:   userID.(uint),
		PersonID: uint(personID),
		Text:     req.Text,
		ParentID: req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.PersonComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.PersonComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "person", uint(personID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}

func DeletePersonComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.PersonComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	deps.GetDB(c).Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdatePersonComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.PersonComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusOK, comment)
}

func CreateCharacterComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	characterID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}

	var character models.Character
	if err := deps.GetDB(c).First(&character, characterID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
		return
	}

	comment := models.CharacterComment{
		UserID:      userID.(uint),
		CharacterID: uint(characterID),
		Text:        req.Text,
		ParentID:    req.ParentID,
	}

	if req.ParentID != nil {
		var parent models.CharacterComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}

	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}

	if req.ParentID != nil {
		var parent models.CharacterComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "character", uint(characterID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}

	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}

func DeleteCharacterComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.CharacterComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}

	deps.GetDB(c).Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateCharacterComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.CharacterComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusOK, comment)
}

type SetCommentReactionRequest struct {
	Value int `json:"value" binding:"required"` // 1 = plus, -1 = minus
}

func SetCommentReactionMovie(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.MovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.MovieID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityMovie, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityMovie, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityMovie, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityMovie, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

func SetCommentReactionAnime(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.AnimeSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.AnimeSeriesID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityAnime, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityAnime, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityAnime, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityAnime, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

func SetCommentReactionGame(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.GameComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.GameID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityGame, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityGame, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityGame, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityGame, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

func SetCommentReactionManga(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.MangaComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.MangaID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityManga, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityManga, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityManga, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityManga, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

func SetCommentReactionBook(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.BookComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.BookID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityBook, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityBook, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityBook, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityBook, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

func SetCommentReactionLightNovel(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.LightNovelComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.LightNovelID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityLightNovel, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityLightNovel, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityLightNovel, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityLightNovel, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

// ——— TV Series comments ———
func firstReplyByParentTVSeries(comments []models.TVSeriesComment) map[uint]models.TVSeriesComment {
	out := make(map[uint]models.TVSeriesComment)
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

func getTVSeriesCommentsPage(c *gin.Context, tvID string, page, pageSize int) ([]models.TVSeriesComment, int64) {
	db := deps.GetDB(c)
	tID, _ := strconv.ParseUint(tvID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.TVSeriesComment{}).Where("tv_series_id = ? AND parent_id IS NULL", tID).Count(&total)
	var roots []models.TVSeriesComment
	db.Where("tv_series_id = ? AND parent_id IS NULL", tID).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.TVSeriesComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentTVSeries(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.TVSeriesComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentTVSeries(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.TVSeriesComment{gc}
			}
			roots[i].Replies = []models.TVSeriesComment{fc}
		}
	}
	setTVSeriesRepliesCountTree(c, &roots)
	return roots, total
}

func setTVSeriesRepliesCountTree(c *gin.Context, comments *[]models.TVSeriesComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectTVSeriesCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.TVSeriesComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyTVSeriesRepliesCount(comments, byParent)
}

func collectTVSeriesCommentIDs(comments []models.TVSeriesComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectTVSeriesCommentIDs(c.Replies)...)
	}
	return ids
}

func applyTVSeriesRepliesCount(comments *[]models.TVSeriesComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyTVSeriesRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetTVSeriesComments(c *gin.Context) {
	tvID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getTVSeriesCommentsPage(c, tvID, page, pageSize)
	ids := collectTVSeriesCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityTVSeries, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetTVSeriesCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.TVSeriesComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.TVSeriesComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.TVSeriesComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentTVSeries(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.TVSeriesComment{gc}
		}
	}
	setTVSeriesRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateTVSeriesComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	tvID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var tv models.TVSeries
	if err := deps.GetDB(c).First(&tv, tvID).Error; err != nil {
		api.RespondNotFound(c, "TV series not found")
		return
	}
	comment := models.TVSeriesComment{
		UserID:     userID.(uint),
		TVSeriesID: uint(tvID),
		Text:       req.Text,
		ParentID:   req.ParentID,
	}
	if req.ParentID != nil {
		var parent models.TVSeriesComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}
	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}
	if req.ParentID != nil {
		var parent models.TVSeriesComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "tv-series", uint(tvID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("tv-series", uint(tvID), ws.CommentMessage{
				Type: "new", EntityType: "tv-series", EntityID: uint(tvID), Payload: payload,
			})
		}
	}
	c.JSON(http.StatusCreated, comment)
}

func DeleteTVSeriesComment(c *gin.Context) {
	commentID := c.Param("id")
	var comment models.TVSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}
	tvID := comment.TVSeriesID
	deps.GetDB(c).Delete(&comment)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(gin.H{"commentId": comment.ID}); err == nil {
			ws.GlobalCommentsHub.Broadcast("tv-series", tvID, ws.CommentMessage{
				Type: "deleted", EntityType: "tv-series", EntityID: tvID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateTVSeriesComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.TVSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("tv-series", comment.TVSeriesID, ws.CommentMessage{
				Type: "updated", EntityType: "tv-series", EntityID: comment.TVSeriesID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, comment)
}

func SetCommentReactionTVSeries(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.TVSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.TVSeriesID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityTVSeries, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityTVSeries, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityTVSeries, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityTVSeries, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

// ——— Cartoon Series comments ———
func firstReplyByParentCartoonSeries(comments []models.CartoonSeriesComment) map[uint]models.CartoonSeriesComment {
	out := make(map[uint]models.CartoonSeriesComment)
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

func getCartoonSeriesCommentsPage(c *gin.Context, csID string, page, pageSize int) ([]models.CartoonSeriesComment, int64) {
	db := deps.GetDB(c)
	id, _ := strconv.ParseUint(csID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.CartoonSeriesComment{}).Where("cartoon_series_id = ? AND parent_id IS NULL", id).Count(&total)
	var roots []models.CartoonSeriesComment
	db.Where("cartoon_series_id = ? AND parent_id IS NULL", id).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.CartoonSeriesComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentCartoonSeries(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.CartoonSeriesComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentCartoonSeries(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.CartoonSeriesComment{gc}
			}
			roots[i].Replies = []models.CartoonSeriesComment{fc}
		}
	}
	setCartoonSeriesRepliesCountTree(c, &roots)
	return roots, total
}

func setCartoonSeriesRepliesCountTree(c *gin.Context, comments *[]models.CartoonSeriesComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectCartoonSeriesCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.CartoonSeriesComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyCartoonSeriesRepliesCount(comments, byParent)
}

func collectCartoonSeriesCommentIDs(comments []models.CartoonSeriesComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectCartoonSeriesCommentIDs(c.Replies)...)
	}
	return ids
}

func applyCartoonSeriesRepliesCount(comments *[]models.CartoonSeriesComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyCartoonSeriesRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetCartoonSeriesComments(c *gin.Context) {
	csID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getCartoonSeriesCommentsPage(c, csID, page, pageSize)
	ids := collectCartoonSeriesCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityCartoonSeries, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetCartoonSeriesCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.CartoonSeriesComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.CartoonSeriesComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.CartoonSeriesComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentCartoonSeries(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.CartoonSeriesComment{gc}
		}
	}
	setCartoonSeriesRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateCartoonSeriesComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	csID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var cs models.CartoonSeries
	if err := deps.GetDB(c).First(&cs, csID).Error; err != nil {
		api.RespondNotFound(c, "Cartoon series not found")
		return
	}
	comment := models.CartoonSeriesComment{
		UserID:          userID.(uint),
		CartoonSeriesID: uint(csID),
		Text:            req.Text,
		ParentID:        req.ParentID,
	}
	if req.ParentID != nil {
		var parent models.CartoonSeriesComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}
	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}
	if req.ParentID != nil {
		var parent models.CartoonSeriesComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "cartoon-series", uint(csID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("cartoon-series", uint(csID), ws.CommentMessage{
				Type: "new", EntityType: "cartoon-series", EntityID: uint(csID), Payload: payload,
			})
		}
	}
	c.JSON(http.StatusCreated, comment)
}

func DeleteCartoonSeriesComment(c *gin.Context) {
	commentID := c.Param("id")
	var comment models.CartoonSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}
	csID := comment.CartoonSeriesID
	deps.GetDB(c).Delete(&comment)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(gin.H{"commentId": comment.ID}); err == nil {
			ws.GlobalCommentsHub.Broadcast("cartoon-series", csID, ws.CommentMessage{
				Type: "deleted", EntityType: "cartoon-series", EntityID: csID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateCartoonSeriesComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.CartoonSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("cartoon-series", comment.CartoonSeriesID, ws.CommentMessage{
				Type: "updated", EntityType: "cartoon-series", EntityID: comment.CartoonSeriesID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, comment)
}

func SetCommentReactionCartoonSeries(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.CartoonSeriesComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.CartoonSeriesID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityCartoonSeries, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityCartoonSeries, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityCartoonSeries, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityCartoonSeries, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

// ——— Cartoon Movie comments ———
func firstReplyByParentCartoonMovie(comments []models.CartoonMovieComment) map[uint]models.CartoonMovieComment {
	out := make(map[uint]models.CartoonMovieComment)
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

func getCartoonMovieCommentsPage(c *gin.Context, cmID string, page, pageSize int) ([]models.CartoonMovieComment, int64) {
	db := deps.GetDB(c)
	id, _ := strconv.ParseUint(cmID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.CartoonMovieComment{}).Where("cartoon_movie_id = ? AND parent_id IS NULL", id).Count(&total)
	var roots []models.CartoonMovieComment
	db.Where("cartoon_movie_id = ? AND parent_id IS NULL", id).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.CartoonMovieComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentCartoonMovie(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.CartoonMovieComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentCartoonMovie(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.CartoonMovieComment{gc}
			}
			roots[i].Replies = []models.CartoonMovieComment{fc}
		}
	}
	setCartoonMovieRepliesCountTree(c, &roots)
	return roots, total
}

func setCartoonMovieRepliesCountTree(c *gin.Context, comments *[]models.CartoonMovieComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectCartoonMovieCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.CartoonMovieComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyCartoonMovieRepliesCount(comments, byParent)
}

func collectCartoonMovieCommentIDs(comments []models.CartoonMovieComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectCartoonMovieCommentIDs(c.Replies)...)
	}
	return ids
}

func applyCartoonMovieRepliesCount(comments *[]models.CartoonMovieComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyCartoonMovieRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetCartoonMovieComments(c *gin.Context) {
	cmID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getCartoonMovieCommentsPage(c, cmID, page, pageSize)
	ids := collectCartoonMovieCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityCartoonMovie, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetCartoonMovieCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.CartoonMovieComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.CartoonMovieComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.CartoonMovieComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentCartoonMovie(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.CartoonMovieComment{gc}
		}
	}
	setCartoonMovieRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateCartoonMovieComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	cmID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var cm models.CartoonMovie
	if err := deps.GetDB(c).First(&cm, cmID).Error; err != nil {
		api.RespondNotFound(c, "Cartoon movie not found")
		return
	}
	comment := models.CartoonMovieComment{
		UserID:          userID.(uint),
		CartoonMovieID:  uint(cmID),
		Text:            req.Text,
		ParentID:        req.ParentID,
	}
	if req.ParentID != nil {
		var parent models.CartoonMovieComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}
	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}
	if req.ParentID != nil {
		var parent models.CartoonMovieComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "cartoon-movie", uint(cmID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("cartoon-movies", uint(cmID), ws.CommentMessage{
				Type: "new", EntityType: "cartoon-movies", EntityID: uint(cmID), Payload: payload,
			})
		}
	}
	c.JSON(http.StatusCreated, comment)
}

func DeleteCartoonMovieComment(c *gin.Context) {
	commentID := c.Param("id")
	var comment models.CartoonMovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}
	cmID := comment.CartoonMovieID
	deps.GetDB(c).Delete(&comment)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(gin.H{"commentId": comment.ID}); err == nil {
			ws.GlobalCommentsHub.Broadcast("cartoon-movies", cmID, ws.CommentMessage{
				Type: "deleted", EntityType: "cartoon-movies", EntityID: cmID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateCartoonMovieComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.CartoonMovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("cartoon-movies", comment.CartoonMovieID, ws.CommentMessage{
				Type: "updated", EntityType: "cartoon-movies", EntityID: comment.CartoonMovieID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, comment)
}

func SetCommentReactionCartoonMovie(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.CartoonMovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.CartoonMovieID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityCartoonMovie, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityCartoonMovie, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityCartoonMovie, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityCartoonMovie, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}

// ——— Anime Movie comments ———
func firstReplyByParentAnimeMovie(comments []models.AnimeMovieComment) map[uint]models.AnimeMovieComment {
	out := make(map[uint]models.AnimeMovieComment)
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

func getAnimeMovieCommentsPage(c *gin.Context, amID string, page, pageSize int) ([]models.AnimeMovieComment, int64) {
	db := deps.GetDB(c)
	id, _ := strconv.ParseUint(amID, 10, 32)
	if pageSize <= 0 {
		pageSize = defaultCommentsPageSize
	}
	var total int64
	db.Model(&models.AnimeMovieComment{}).Where("anime_movie_id = ? AND parent_id IS NULL", id).Count(&total)
	var roots []models.AnimeMovieComment
	db.Where("anime_movie_id = ? AND parent_id IS NULL", id).
		Order("(plus_count - minus_count) DESC, created_at DESC").Limit(pageSize).Offset(page * pageSize).
		Preload("User").Find(&roots)
	if len(roots) == 0 {
		return roots, total
	}
	rootIDs := make([]uint, len(roots))
	for i := range roots {
		rootIDs[i] = roots[i].ID
	}
	var firstChildren []models.AnimeMovieComment
	db.Where("parent_id IN ?", rootIDs).Order("created_at ASC").Preload("User").Find(&firstChildren)
	firstByParent := firstReplyByParentAnimeMovie(firstChildren)
	childIDs := make([]uint, 0, len(firstByParent))
	for _, c := range firstByParent {
		childIDs = append(childIDs, c.ID)
	}
	var grandchildren []models.AnimeMovieComment
	if len(childIDs) > 0 {
		db.Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	}
	grandFirstByParent := firstReplyByParentAnimeMovie(grandchildren)
	for i := range roots {
		if fc, ok := firstByParent[roots[i].ID]; ok {
			if gc, ok2 := grandFirstByParent[fc.ID]; ok2 {
				fc.Replies = []models.AnimeMovieComment{gc}
			}
			roots[i].Replies = []models.AnimeMovieComment{fc}
		}
	}
	setAnimeMovieRepliesCountTree(c, &roots)
	return roots, total
}

func setAnimeMovieRepliesCountTree(c *gin.Context, comments *[]models.AnimeMovieComment) {
	if comments == nil || len(*comments) == 0 {
		return
	}
	ids := collectAnimeMovieCommentIDs(*comments)
	if len(ids) == 0 {
		return
	}
	db := deps.GetDB(c)
	var countRows []struct {
		ParentID uint
		Count    int64
	}
	db.Model(&models.AnimeMovieComment{}).Where("parent_id IN ?", ids).Select("parent_id, count(*) as count").Group("parent_id").Scan(&countRows)
	byParent := make(map[uint]int64)
	for _, r := range countRows {
		byParent[r.ParentID] = r.Count
	}
	applyAnimeMovieRepliesCount(comments, byParent)
}

func collectAnimeMovieCommentIDs(comments []models.AnimeMovieComment) []uint {
	ids := make([]uint, 0)
	for _, c := range comments {
		ids = append(ids, c.ID)
		ids = append(ids, collectAnimeMovieCommentIDs(c.Replies)...)
	}
	return ids
}

func applyAnimeMovieRepliesCount(comments *[]models.AnimeMovieComment, byParent map[uint]int64) {
	for i := range *comments {
		(*comments)[i].RepliesCount = int(byParent[(*comments)[i].ID])
		if len((*comments)[i].Replies) > 0 {
			applyAnimeMovieRepliesCount(&(*comments)[i].Replies, byParent)
		}
	}
}

func GetAnimeMovieComments(c *gin.Context) {
	amID := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	comments, total := getAnimeMovieCommentsPage(c, amID, page, pageSize)
	ids := collectAnimeMovieCommentIDs(comments)
	emojiReactions := BuildCommentEmojiReactionsMap(c, models.CommentEntityAnimeMovie, ids)
	c.JSON(http.StatusOK, gin.H{"comments": comments, "total": total, "emojiReactions": emojiReactions})
}

func GetAnimeMovieCommentReplies(c *gin.Context) {
	commentID := c.Param("commentId")
	cID, err := strconv.ParseUint(commentID, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
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
	var total int64
	deps.GetDB(c).Model(&models.AnimeMovieComment{}).Where("parent_id = ?", cID).Count(&total)
	var children []models.AnimeMovieComment
	deps.GetDB(c).Where("parent_id = ?", cID).Order("created_at ASC").Preload("User").Limit(limit).Offset(offset).Find(&children)
	if len(children) == 0 {
		c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
		return
	}
	childIDs := make([]uint, len(children))
	for i := range children {
		childIDs[i] = children[i].ID
	}
	var grandchildren []models.AnimeMovieComment
	deps.GetDB(c).Where("parent_id IN ?", childIDs).Order("created_at ASC").Preload("User").Find(&grandchildren)
	grandFirstByParent := firstReplyByParentAnimeMovie(grandchildren)
	for i := range children {
		if gc, ok := grandFirstByParent[children[i].ID]; ok {
			children[i].Replies = []models.AnimeMovieComment{gc}
		}
	}
	setAnimeMovieRepliesCountTree(c, &children)
	c.JSON(http.StatusOK, gin.H{"replies": children, "total": total})
}

func CreateAnimeMovieComment(c *gin.Context) {
	if !checkCommentBan(c) {
		return
	}
	userID, _ := c.Get("userID")
	amID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	var am models.AnimeMovie
	if err := deps.GetDB(c).First(&am, amID).Error; err != nil {
		api.RespondNotFound(c, "Anime movie not found")
		return
	}
	comment := models.AnimeMovieComment{
		UserID:        userID.(uint),
		AnimeMovieID:  uint(amID),
		Text:          req.Text,
		ParentID:      req.ParentID,
	}
	if req.ParentID != nil {
		var parent models.AnimeMovieComment
		if err := deps.GetDB(c).First(&parent, *req.ParentID).Error; err != nil {
			api.RespondNotFound(c, "Parent comment not found")
			return
		}
		comment.Depth = parent.Depth + 1
	}
	if err := deps.GetDB(c).Create(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to create comment")
		return
	}
	if req.ParentID != nil {
		var parent models.AnimeMovieComment
		if deps.GetDB(c).First(&parent, *req.ParentID).Error == nil && parent.UserID != userID.(uint) {
			preview := req.Text
			if len(preview) > 150 {
				preview = preview[:150] + "..."
			}
			CreateNotificationForUser(parent.UserID, models.NotificationTypeCommentReply, "New reply to your comment", &preview, "anime-movie", uint(amID), models.JSONMap{"preview": preview, "commentId": parent.ID})
		}
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("anime-movies", uint(amID), ws.CommentMessage{
				Type: "new", EntityType: "anime-movies", EntityID: uint(amID), Payload: payload,
			})
		}
	}
	c.JSON(http.StatusCreated, comment)
}

func DeleteAnimeMovieComment(c *gin.Context) {
	commentID := c.Param("id")
	var comment models.AnimeMovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if !canDeleteComment(c, comment.UserID) {
		api.RespondForbidden(c, "You can only delete your own comments")
		return
	}
	amID := comment.AnimeMovieID
	deps.GetDB(c).Delete(&comment)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(gin.H{"commentId": comment.ID}); err == nil {
			ws.GlobalCommentsHub.Broadcast("anime-movies", amID, ws.CommentMessage{
				Type: "deleted", EntityType: "anime-movies", EntityID: amID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func UpdateAnimeMovieComment(c *gin.Context) {
	commentID := c.Param("id")
	userIDVal, ok := c.Get("userID")
	if !ok {
		api.RespondUnauthorized(c, "Authorization required")
		return
	}
	userID := userIDVal.(uint)
	var comment models.AnimeMovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	if comment.UserID != userID {
		api.RespondForbidden(c, "You can only edit your own comments")
		return
	}
	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	comment.Text = strings.TrimSpace(req.Text)
	if err := deps.GetDB(c).Save(&comment).Error; err != nil {
		api.RespondInternal(c, "Failed to update comment")
		return
	}
	deps.GetDB(c).Preload("User").First(&comment, comment.ID)
	if ws.GlobalCommentsHub != nil {
		if payload, err := json.Marshal(comment); err == nil {
			ws.GlobalCommentsHub.Broadcast("anime-movies", comment.AnimeMovieID, ws.CommentMessage{
				Type: "updated", EntityType: "anime-movies", EntityID: comment.AnimeMovieID, Payload: payload,
			})
		}
	}
	c.JSON(http.StatusOK, comment)
}

func SetCommentReactionAnimeMovie(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)
	commentIDStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid comment id", nil)
		return
	}
	var req SetCommentReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Value != 1 && req.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}
	var comment models.AnimeMovieComment
	if err := deps.GetDB(c).First(&comment, commentID).Error; err != nil {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	entityIDStr := c.Param("id")
	entityID, _ := strconv.ParseUint(entityIDStr, 10, 32)
	if comment.AnimeMovieID != uint(entityID) {
		api.RespondNotFound(c, "Comment not found")
		return
	}
	var reaction models.CommentReaction
	err = deps.GetDB(c).Where("user_id = ? AND entity_type = ? AND comment_id = ?", userID, models.CommentEntityAnimeMovie, comment.ID).First(&reaction).Error
	if err != nil {
		deps.GetDB(c).Create(&models.CommentReaction{UserID: userID, EntityType: models.CommentEntityAnimeMovie, CommentID: comment.ID, Value: req.Value})
	} else {
		reaction.Value = req.Value
		deps.GetDB(c).Save(&reaction)
	}
	var plus, minus int64
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityAnimeMovie, comment.ID, 1).Count(&plus)
	deps.GetDB(c).Model(&models.CommentReaction{}).Where("entity_type = ? AND comment_id = ? AND value = ?", models.CommentEntityAnimeMovie, comment.ID, -1).Count(&minus)
	deps.GetDB(c).Model(&comment).Updates(map[string]interface{}{"plus_count": plus, "minus_count": minus})
	c.JSON(http.StatusOK, gin.H{"plusCount": plus, "minusCount": minus})
}
