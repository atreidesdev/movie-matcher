package handlers

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

var slugSanitizeRe = regexp.MustCompile(`[^a-z0-9-]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	s = slugSanitizeRe.ReplaceAllString(s, "")
	s = strings.Trim(s, "-")
	if len(s) > 120 {
		s = s[:120]
	}
	return s
}

type AdminAchievementLevelInput struct {
	LevelOrder       int                    `json:"levelOrder" binding:"required"`
	ThresholdPercent int                    `json:"thresholdPercent" binding:"required"`
	Title            string                 `json:"title" binding:"required"`
	TitleI18n        *models.LocalizedString `json:"titleI18n"`
	ImageURL         *string                `json:"imageUrl"`
}

type AdminAchievementTargetInput struct {
	MediaType string `json:"mediaType" binding:"required"`
	MediaID   uint   `json:"mediaId" binding:"required"`
}

type AdminAchievementInput struct {
	Slug        string                        `json:"slug"`
	Title       string                        `json:"title" binding:"required"`
	TitleI18n   *models.LocalizedString       `json:"titleI18n"`
	ImageURL    *string                       `json:"imageUrl"`
	Rarity      string                        `json:"rarity"` // common, uncommon, rare, epic, legendary
	TargetType  string                        `json:"targetType" binding:"required"`
	GenreID     *uint                         `json:"genreId"`
	FranchiseID *uint                         `json:"franchiseId"`
	OrderNum    int                           `json:"orderNum"`
	Levels      []AdminAchievementLevelInput  `json:"levels" binding:"required,dive"`
	Targets     []AdminAchievementTargetInput `json:"targets"`
}

// POST /admin/achievements
func AdminCreateAchievement(c *gin.Context) {
	var input AdminAchievementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.TargetType != models.AchievementTargetGenre &&
		input.TargetType != models.AchievementTargetFranchise &&
		input.TargetType != models.AchievementTargetMediaList {
		c.JSON(http.StatusBadRequest, gin.H{"error": "targetType must be genre, franchise or media_list"})
		return
	}
	slug := strings.TrimSpace(input.Slug)
	if slug == "" {
		slug = slugify(input.Title)
	}
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug required or provide non-empty title"})
		return
	}
	switch input.TargetType {
	case models.AchievementTargetGenre:
		if input.GenreID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "genreId required for targetType=genre"})
			return
		}
	case models.AchievementTargetFranchise:
		if input.FranchiseID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "franchiseId required for targetType=franchise"})
			return
		}
	case models.AchievementTargetMediaList:
		if len(input.Targets) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "targets required for targetType=media_list"})
			return
		}
	}

	db := deps.GetDB(c)
	var existing models.Achievement
	if err := db.Where("slug = ?", slug).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "achievement with this slug already exists"})
		return
	}

	rarity := strings.TrimSpace(input.Rarity)
	if rarity == "" {
		rarity = models.AchievementRarityCommon
	}
	ach := models.Achievement{
		Slug:        slug,
		Title:       input.Title,
		TitleI18n:   input.TitleI18n,
		ImageURL:    input.ImageURL,
		Rarity:      rarity,
		TargetType:  input.TargetType,
		GenreID:     input.GenreID,
		FranchiseID: input.FranchiseID,
		OrderNum:    input.OrderNum,
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&ach).Error; err != nil {
			return err
		}
		for _, lv := range input.Levels {
			level := models.AchievementLevel{
				AchievementID:    ach.ID,
				LevelOrder:       lv.LevelOrder,
				ThresholdPercent: lv.ThresholdPercent,
				Title:            lv.Title,
				TitleI18n:        lv.TitleI18n,
				ImageURL:         lv.ImageURL,
			}
			if err := tx.Create(&level).Error; err != nil {
				return err
			}
		}
		for _, t := range input.Targets {
			target := models.AchievementTargetMedia{
				AchievementID: ach.ID,
				MediaType:     t.MediaType,
				MediaID:       t.MediaID,
			}
			if err := tx.Create(&target).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ach)
}

// PUT /admin/achievements/:id
func AdminUpdateAchievement(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	db := deps.GetDB(c)
	var ach models.Achievement
	if err := db.First(&ach, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "achievement not found"})
		return
	}

	var input AdminAchievementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.TargetType != models.AchievementTargetGenre &&
		input.TargetType != models.AchievementTargetFranchise &&
		input.TargetType != models.AchievementTargetMediaList {
		c.JSON(http.StatusBadRequest, gin.H{"error": "targetType must be genre, franchise or media_list"})
		return
	}
	slug := strings.TrimSpace(input.Slug)
	if slug != "" {
		var other models.Achievement
		if err := db.Where("slug = ? AND id != ?", slug, id).First(&other).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "achievement with this slug already exists"})
			return
		}
		ach.Slug = slug
	}
	ach.Title = input.Title
	ach.TitleI18n = input.TitleI18n
	ach.ImageURL = input.ImageURL
	if input.Rarity != "" {
		ach.Rarity = strings.TrimSpace(input.Rarity)
	}
	ach.TargetType = input.TargetType
	ach.GenreID = input.GenreID
	ach.FranchiseID = input.FranchiseID
	ach.OrderNum = input.OrderNum

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&ach).Error; err != nil {
			return err
		}
		if err := tx.Where("achievement_id = ?", ach.ID).Delete(&models.AchievementLevel{}).Error; err != nil {
			return err
		}
		for _, lv := range input.Levels {
			level := models.AchievementLevel{
				AchievementID:    ach.ID,
				LevelOrder:       lv.LevelOrder,
				ThresholdPercent: lv.ThresholdPercent,
				Title:            lv.Title,
				TitleI18n:        lv.TitleI18n,
				ImageURL:         lv.ImageURL,
			}
			if err := tx.Create(&level).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("achievement_id = ?", ach.ID).Delete(&models.AchievementTargetMedia{}).Error; err != nil {
			return err
		}
		for _, t := range input.Targets {
			target := models.AchievementTargetMedia{
				AchievementID: ach.ID,
				MediaType:     t.MediaType,
				MediaID:       t.MediaID,
			}
			if err := tx.Create(&target).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ach)
}

// DELETE /admin/achievements/:id
func AdminDeleteAchievement(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	db := deps.GetDB(c)
	if err := db.Delete(&models.Achievement{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
