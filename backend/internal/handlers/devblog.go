package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

type DevBlogPostResponse struct {
	ID        uint   `json:"id"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
	AuthorID  uint   `json:"authorId"`
	Author    *struct {
		ID        uint    `json:"id"`
		Username  *string `json:"username"`
		Name      *string `json:"name"`
		Avatar    *string `json:"avatar"`
	} `json:"author,omitempty"`
	Title string `json:"title"`
	Body  string `json:"body"`
	Slug  string `json:"slug,omitempty"`
}

func toDevBlogResponse(p *models.DevBlogPost) DevBlogPostResponse {
	r := DevBlogPostResponse{
		ID:        p.ID,
		CreatedAt: p.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: p.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		AuthorID:  p.AuthorID,
		Title:     p.Title,
		Body:      p.Body,
		Slug:      p.Slug,
	}
	if p.Author.ID != 0 {
		r.Author = &struct {
			ID       uint    `json:"id"`
			Username *string `json:"username"`
			Name     *string `json:"name"`
			Avatar   *string `json:"avatar"`
		}{
			ID:       p.Author.ID,
			Username: p.Author.Username,
			Name:     p.Author.Name,
			Avatar:   p.Author.Avatar,
		}
	}
	return r
}

// GET /devblog
func DevBlogList(c *gin.Context) {
	db := deps.GetDB(c)
	var posts []models.DevBlogPost
	if err := db.Order("created_at DESC").Preload("Author").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load posts"})
		return
	}
	out := make([]DevBlogPostResponse, 0, len(posts))
	for i := range posts {
		out = append(out, toDevBlogResponse(&posts[i]))
	}
	c.JSON(http.StatusOK, gin.H{"posts": out})
}

// GET /devblog/:id
func DevBlogGet(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}
	db := deps.GetDB(c)
	var post models.DevBlogPost
	if err := db.Preload("Author").First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	c.JSON(http.StatusOK, toDevBlogResponse(&post))
}

type DevBlogCreateInput struct {
	Title string `json:"title" binding:"required"`
	Body  string `json:"body" binding:"required"`
	Slug  string `json:"slug"`
}

// POST /admin/devblog
func DevBlogCreate(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	authorID := userIDVal.(uint)

	var input DevBlogCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post := models.DevBlogPost{
		AuthorID: authorID,
		Title:    input.Title,
		Body:     input.Body,
		Slug:     input.Slug,
	}
	if err := deps.GetDB(c).Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	db := deps.GetDB(c)
	_ = db.Preload("Author").First(&post, post.ID)
	c.JSON(http.StatusCreated, toDevBlogResponse(&post))
}

// PUT /admin/devblog/:id
func DevBlogUpdate(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}
	db := deps.GetDB(c)
	var post models.DevBlogPost
	if err := db.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	var input DevBlogCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	post.Title = input.Title
	post.Body = input.Body
	post.Slug = input.Slug
	if err := db.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}
	_ = db.Preload("Author").First(&post, post.ID)
	c.JSON(http.StatusOK, toDevBlogResponse(&post))
}

// DELETE /admin/devblog/:id
func DevBlogDelete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}
	if err := deps.GetDB(c).Delete(&models.DevBlogPost{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted"})
}
