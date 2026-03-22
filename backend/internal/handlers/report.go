package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

type CreateReportRequest struct {
	TargetType       string  `json:"targetType" binding:"required,oneof=comment review user"` // comment, review, user
	TargetID         uint    `json:"targetId" binding:"required"`
	TargetEntityType string  `json:"targetEntityType"` // опционально: movies, anime, tv-series, ...
	TargetEntityID   uint    `json:"targetEntityId"`
	Reason           string  `json:"reason" binding:"required"` // spam, abuse, spoiler, other
	Comment          *string `json:"comment"`
}

type UpdateReportStatusRequest struct {
	Status        string  `json:"status" binding:"required,oneof=resolved rejected"`
	ModeratorNote *string `json:"moderatorNote"`
}

func CreateReport(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	report := models.Report{
		ReporterID:       userID.(uint),
		TargetType:       req.TargetType,
		TargetID:         req.TargetID,
		TargetEntityType: req.TargetEntityType,
		TargetEntityID:   req.TargetEntityID,
		Reason:           req.Reason,
		Comment:          req.Comment,
		Status:            models.ReportStatusPending,
	}
	if err := deps.GetDB(c).Create(&report).Error; err != nil {
		api.RespondInternal(c, "Failed to create report")
		return
	}
	c.JSON(http.StatusCreated, report)
}

func ListReports(c *gin.Context) {
	status := c.Query("status") // pending, resolved, rejected или пусто — все
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
	db := deps.GetDB(c).Model(&models.Report{}).Order("created_at DESC")
	if status != "" {
		db = db.Where("status = ?", status)
	}
	var total int64
	db.Count(&total)
	var list []models.Report
	if err := db.Preload("Reporter").Offset(offset).Limit(limit).Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch reports")
		return
	}
	c.JSON(http.StatusOK, gin.H{"reports": list, "total": total})
}

func UpdateReportStatus(c *gin.Context) {
	reportID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid report ID", nil)
		return
	}
	userID, _ := c.Get("userID")
	moderatorID := userID.(uint)
	var req UpdateReportStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	db := deps.GetDB(c)
	var report models.Report
	if err := db.First(&report, reportID).Error; err != nil {
		api.RespondNotFound(c, "Report not found")
		return
	}
	now := time.Now()
	report.Status = req.Status
	report.ResolvedAt = &now
	report.ResolvedBy = ptrUint(moderatorID)
	report.ModeratorNote = req.ModeratorNote
	if err := db.Save(&report).Error; err != nil {
		api.RespondInternal(c, "Failed to update report")
		return
	}
	action := models.ModeratorActionResolve
	if req.Status == models.ReportStatusRejected {
		action = models.ModeratorActionReject
	}
	logEntry := models.ModeratorActionLog{
		ReportID:    uint(reportID),
		ModeratorID: moderatorID,
		Action:      action,
		Note:        req.ModeratorNote,
	}
	_ = db.Create(&logEntry).Error
	c.JSON(http.StatusOK, report)
}

type BulkUpdateReportsRequest struct {
	IDs            []uint  `json:"ids" binding:"required,max=50"`
	Status         string  `json:"status" binding:"required,oneof=resolved rejected"`
	ModeratorNote  *string `json:"moderatorNote"`
}

func BulkUpdateReports(c *gin.Context) {
	userID, _ := c.Get("userID")
	moderatorID := userID.(uint)
	var req BulkUpdateReportsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	if len(req.IDs) == 0 || len(req.IDs) > 50 {
		api.RespondBadRequest(c, "ids: 1-50 items", nil)
		return
	}
	db := deps.GetDB(c)
	now := time.Now()
	updated := 0
	for _, id := range req.IDs {
		var report models.Report
		if err := db.First(&report, id).Error; err != nil {
			continue
		}
		if report.Status != models.ReportStatusPending {
			continue
		}
		report.Status = req.Status
		report.ResolvedAt = &now
		report.ResolvedBy = ptrUint(moderatorID)
		report.ModeratorNote = req.ModeratorNote
		if db.Save(&report).Error != nil {
			continue
		}
		updated++
		action := models.ModeratorActionResolve
		if req.Status == models.ReportStatusRejected {
			action = models.ModeratorActionReject
		}
		logEntry := models.ModeratorActionLog{
			ReportID:    report.ID,
			ModeratorID: moderatorID,
			Action:      action,
			Note:        req.ModeratorNote,
		}
		_ = db.Create(&logEntry).Error
	}
	c.JSON(http.StatusOK, gin.H{"updated": updated, "message": "Bulk update applied"})
}

func ptrUint(u uint) *uint {
	return &u
}

func ListReportTemplates(c *gin.Context) {
	db := deps.GetDB(c)
	var list []models.ReportResponseTemplate
	if err := db.Order("order_num ASC, id ASC").Find(&list).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch templates")
		return
	}
	c.JSON(http.StatusOK, gin.H{"templates": list})
}

type CreateReportTemplateRequest struct {
	Title    string `json:"title" binding:"required,max=255"`
	Body     string `json:"body" binding:"required"`
	OrderNum int    `json:"orderNum"`
}

func CreateReportTemplate(c *gin.Context) {
	var req CreateReportTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	tpl := models.ReportResponseTemplate{
		Title:    req.Title,
		Body:     req.Body,
		OrderNum: req.OrderNum,
	}
	if err := deps.GetDB(c).Create(&tpl).Error; err != nil {
		api.RespondInternal(c, "Failed to create template")
		return
	}
	c.JSON(http.StatusCreated, tpl)
}
