package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/repository"
	"github.com/movie-matcher/backend/internal/services"
	"gorm.io/gorm"
)

var bookRepo = &repository.BookRepository{}

// GetBooks godoc
// @Summary  Get books list
// @Tags     Books
// @Produce  json
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /books [get]
func GetBooks(c *gin.Context) {
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Book{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "books")
		q = ApplyAuthorFilter(q, params, "books")
		q = ApplyPublisherFilter(q, params, "books")
		return ApplyPopularitySort(q, params, models.EntityTypeBook)
	}
	list, total, err := bookRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch books")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

// GetBook godoc
// @Summary  Get book by ID
// @Tags     Books
// @Param    id   path  int  true  "Book ID"
// @Success  200  {object}  models.Book
// @Failure  400,404  {object}  map[string]interface{}
// @Router   /books/{id} [get]
func GetBook(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid book ID", nil)
		return
	}
	db := deps.GetDB(c)
	book, err := bookRepo.GetByID(db, uint(id))
	if err != nil {
		api.RespondNotFound(c, "Book not found")
		return
	}
	RecordEntityView(c, models.EntityTypeBook, book.ID)
	book.Staff = LoadMediaStaff(db, "book", book.ID)
	if len(book.Similar) > 0 {
		EnrichBooksWithListStatus(c, db, &book.Similar)
	}
	c.JSON(http.StatusOK, book)
}

// GetPopularBooks godoc
// @Summary  Get popular books
// @Tags     Books
// @Param    limit  query  int  false  "Limit"  default(10)
// @Param    mode   query  string  false  "popular|trending|rating"  default(popular)
// @Success  200  {array}  models.Book
// @Router   /books/popular [get]
func GetPopularBooks(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	mode := c.DefaultQuery("mode", "popular")

	if limit < 1 || limit > 50 {
		limit = 10
	}

	popService := services.NewPopularityServiceWithDB(deps.GetDB(c))

	var ids []uint
	var err error

	if mode == "trending" {
		ids, err = popService.GetTrendingIDs(models.EntityTypeBook, limit)
	} else if mode == "popular" {
		ids, err = popService.GetPopularIDs(models.EntityTypeBook, limit)
	}

	db := deps.GetDB(c)
	var books []models.Book

	if err != nil || len(ids) == 0 || mode == "rating" {
		if err := db.Preload("Genres").
			Model(&models.Book{}).
			Order("rating DESC NULLS LAST").
			Limit(limit).
			Find(&books).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular books")
			return
		}
	} else {
		orderClause := "CASE id "
		for i, id := range ids {
			orderClause += "WHEN " + strconv.Itoa(int(id)) + " THEN " + strconv.Itoa(i) + " "
		}
		orderClause += "END"

		if err := db.Preload("Genres").
			Model(&models.Book{}).
			Where("id IN ?", ids).
			Order(orderClause).
			Find(&books).Error; err != nil {
			api.RespondInternal(c, "Failed to fetch popular books")
			return
		}
	}

	c.JSON(http.StatusOK, books)
}

// SearchBooks godoc
// @Summary  Search books
// @Tags     Books
// @Param    q  query  string  true  "Search query"
// @Success  200  {object}  ExtendedPaginatedResponse
// @Router   /books/search [get]
func SearchBooks(c *gin.Context) {
	searchQuery := c.Query("q")
	if searchQuery == "" {
		api.RespondBadRequest(c, "Search query required", nil)
		return
	}
	db := deps.GetDB(c)
	params := ParseQueryParams(c)
	params.Search = searchQuery
	buildQuery := func(d *gorm.DB) *gorm.DB {
		q := d.Model(&models.Book{})
		if ShouldApplyHiddenFilter(c, db) {
			q = q.Where("is_hidden = ?", false)
		}
		q = ApplyMediaFilters(q, params, "books")
		q = ApplyAuthorFilter(q, params, "books")
		q = ApplyPublisherFilter(q, params, "books")
		return ApplyPopularitySort(q, params, models.EntityTypeBook)
	}
	list, total, err := bookRepo.List(db, params.Offset(), params.PageSize, buildQuery)
	if err != nil {
		api.RespondInternal(c, "Failed to search books")
		return
	}
	c.JSON(http.StatusOK, BuildExtendedResponse(list, total, params))
}

func GetBookFilters(c *gin.Context) {
	db := deps.GetDB(c)
	filters := GetAvailableFilters(db, models.EntityTypeBook)
	c.JSON(http.StatusOK, filters)
}
