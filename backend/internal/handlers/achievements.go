package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/repository"
)

type AchievementWithProgress struct {
	models.Achievement
	Progress *repository.AchievementProgress `json:"progress,omitempty"`
}

// GetAchievements godoc
// @Summary  Get achievements (with progress if authenticated)
// @Tags     Achievements
// @Produce  json
// @Success  200  {object}  map[string]interface{}  "achievements"
// @Router   /achievements [get]
func GetAchievements(c *gin.Context) {
	db := deps.GetDB(c)
	list, err := repository.ListAchievements(db)
	if err != nil {
		api.RespondInternal(c, err.Error())
		return
	}

	userID, hasUser := c.Get("userID")
	if !hasUser {
		out := make([]models.Achievement, len(list))
		for i := range list {
			out[i] = list[i]
		}
		c.JSON(http.StatusOK, gin.H{"achievements": out})
		return
	}

	uid := userID.(uint)
	progressMap, _ := repository.GetUserAchievementProgressMap(db, uid, list)
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
			prog, err := repository.GetAchievementProgress(db, uid, &list[i])
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
