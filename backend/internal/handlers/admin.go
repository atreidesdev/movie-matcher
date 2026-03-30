package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
	"github.com/movie-matcher/backend/internal/storage"
	"gorm.io/gorm"
)

type ImageEntryInput struct {
	Url     string `json:"url"`
	Caption string `json:"caption"`
	Width   *int   `json:"width,omitempty"`
	Height  *int   `json:"height,omitempty"`
}

func (e *ImageEntryInput) UnmarshalJSON(b []byte) error {
	if len(b) == 0 {
		return nil
	}
	if b[0] == '"' {
		var s string
		if err := json.Unmarshal(b, &s); err != nil {
			return err
		}
		e.Url = s
		return nil
	}
	var o struct {
		Url     string `json:"url"`
		Caption string `json:"caption"`
		Width   *int   `json:"width,omitempty"`
		Height  *int   `json:"height,omitempty"`
	}
	if err := json.Unmarshal(b, &o); err != nil {
		return err
	}
	e.Url = o.Url
	e.Caption = o.Caption
	e.Width = o.Width
	e.Height = o.Height
	return nil
}

func toJSONArrayFromImageEntries(entries []ImageEntryInput) models.JSONArray {
	if entries == nil {
		return models.JSONArray{}
	}
	arr := make(models.JSONArray, len(entries))
	for i, e := range entries {
		m := map[string]interface{}{"url": e.Url, "caption": e.Caption}
		if e.Width != nil {
			m["width"] = *e.Width
		}
		if e.Height != nil {
			m["height"] = *e.Height
		}
		arr[i] = m
	}
	return arr
}

type VideoEntryInput struct {
	Url  string `json:"url"`
	Name string `json:"name"`
}

func (e *VideoEntryInput) UnmarshalJSON(b []byte) error {
	if len(b) == 0 {
		return nil
	}
	if b[0] == '"' {
		var s string
		if err := json.Unmarshal(b, &s); err != nil {
			return err
		}
		e.Url = s
		return nil
	}
	var o struct {
		Url  string `json:"url"`
		Name string `json:"name"`
	}
	if err := json.Unmarshal(b, &o); err != nil {
		return err
	}
	e.Url = o.Url
	e.Name = o.Name
	return nil
}

func toJSONArrayFromVideoEntries(entries []VideoEntryInput) models.JSONArray {
	if entries == nil {
		return models.JSONArray{}
	}
	arr := make(models.JSONArray, len(entries))
	for i, e := range entries {
		arr[i] = map[string]interface{}{"url": e.Url, "name": e.Name}
	}
	return arr
}

// ——— Genres ———
type AdminGenreInput struct {
	Name            string                  `json:"name" binding:"required"`
	NameI18n        *models.LocalizedString `json:"nameI18n"`
	Description     *string                 `json:"description"`
	DescriptionI18n *models.LocalizedString `json:"descriptionI18n"`
	Emoji           *string                 `json:"emoji"`
	MediaTypes      []string                `json:"mediaTypes"`
}

func AdminCreateGenre(c *gin.Context) {
	var input AdminGenreInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	genre := models.Genre{
		Name:            input.Name,
		NameI18n:        input.NameI18n,
		Description:     input.Description,
		DescriptionI18n: input.DescriptionI18n,
		Emoji:           input.Emoji,
		MediaTypes:      toJSONArray(input.MediaTypes),
	}
	if err := deps.GetDB(c).Create(&genre).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create genre"})
		return
	}
	c.JSON(http.StatusCreated, genre)
}

func AdminUpdateGenre(c *gin.Context) {
	id := c.Param("id")
	var genre models.Genre
	if err := deps.GetDB(c).First(&genre, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Genre not found"})
		return
	}
	var input AdminGenreInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	genre.Name = input.Name
	genre.NameI18n = input.NameI18n
	genre.Description = input.Description
	genre.DescriptionI18n = input.DescriptionI18n
	genre.Emoji = input.Emoji
	genre.MediaTypes = toJSONArray(input.MediaTypes)
	if err := deps.GetDB(c).Save(&genre).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update genre"})
		return
	}
	c.JSON(http.StatusOK, genre)
}

func AdminDeleteGenre(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Genre{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete genre"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Genre deleted"})
}

// ——— Themes ———
type AdminThemeInput struct {
	Name            string                  `json:"name" binding:"required"`
	NameI18n        *models.LocalizedString `json:"nameI18n"`
	Description     *string                 `json:"description"`
	DescriptionI18n *models.LocalizedString `json:"descriptionI18n"`
	Emoji           *string                 `json:"emoji"`
	MediaTypes      []string                `json:"mediaTypes"`
}

func AdminCreateTheme(c *gin.Context) {
	var input AdminThemeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	theme := models.Theme{
		Name:            input.Name,
		NameI18n:        input.NameI18n,
		Description:     input.Description,
		DescriptionI18n: input.DescriptionI18n,
		Emoji:           input.Emoji,
		MediaTypes:      toJSONArray(input.MediaTypes),
	}
	if err := deps.GetDB(c).Create(&theme).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create theme"})
		return
	}
	c.JSON(http.StatusCreated, theme)
}

func AdminUpdateTheme(c *gin.Context) {
	id := c.Param("id")
	var theme models.Theme
	if err := deps.GetDB(c).First(&theme, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Theme not found"})
		return
	}
	var input AdminThemeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	theme.Name = input.Name
	theme.NameI18n = input.NameI18n
	theme.Description = input.Description
	theme.DescriptionI18n = input.DescriptionI18n
	theme.Emoji = input.Emoji
	theme.MediaTypes = toJSONArray(input.MediaTypes)
	if err := deps.GetDB(c).Save(&theme).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update theme"})
		return
	}
	c.JSON(http.StatusOK, theme)
}

func AdminDeleteTheme(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Theme{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete theme"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Theme deleted"})
}

// ——— Studios ———
type AdminStudioInput struct {
	Name            string                  `json:"name" binding:"required"`
	NameI18n        *models.LocalizedString `json:"nameI18n"`
	Description     *string                 `json:"description"`
	DescriptionI18n *models.LocalizedString `json:"descriptionI18n"`
	Country         *string                 `json:"country"`
	Poster          *string                 `json:"poster"`
}

func AdminCreateStudio(c *gin.Context) {
	var input AdminStudioInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	studio := models.Studio{Name: input.Name, NameI18n: input.NameI18n, Description: input.Description, DescriptionI18n: input.DescriptionI18n, Country: input.Country, Poster: input.Poster}
	if err := deps.GetDB(c).Create(&studio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create studio"})
		return
	}
	c.JSON(http.StatusCreated, studio)
}

func AdminUpdateStudio(c *gin.Context) {
	id := c.Param("id")
	var studio models.Studio
	if err := deps.GetDB(c).First(&studio, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Studio not found"})
		return
	}
	var input AdminStudioInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	studio.Name = input.Name
	studio.NameI18n = input.NameI18n
	studio.Description = input.Description
	studio.DescriptionI18n = input.DescriptionI18n
	studio.Country = input.Country
	studio.Poster = input.Poster
	if err := deps.GetDB(c).Save(&studio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update studio"})
		return
	}
	c.JSON(http.StatusOK, studio)
}

func AdminDeleteStudio(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Studio{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete studio"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Studio deleted"})
}

// ——— Developers ———
type AdminDeveloperInput struct {
	Name            string                  `json:"name" binding:"required"`
	NameI18n        *models.LocalizedString `json:"nameI18n"`
	Description     *string                 `json:"description"`
	DescriptionI18n *models.LocalizedString `json:"descriptionI18n"`
	Country         *string                 `json:"country"`
	Poster          *string                 `json:"poster"`
}

func AdminCreateDeveloper(c *gin.Context) {
	var input AdminDeveloperInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dev := models.Developer{Name: input.Name, NameI18n: input.NameI18n, Description: input.Description, DescriptionI18n: input.DescriptionI18n, Country: input.Country, Poster: input.Poster}
	if err := deps.GetDB(c).Create(&dev).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create developer"})
		return
	}
	c.JSON(http.StatusCreated, dev)
}

func AdminUpdateDeveloper(c *gin.Context) {
	id := c.Param("id")
	var dev models.Developer
	if err := deps.GetDB(c).First(&dev, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Developer not found"})
		return
	}
	var input AdminDeveloperInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dev.Name = input.Name
	dev.NameI18n = input.NameI18n
	dev.Description = input.Description
	dev.DescriptionI18n = input.DescriptionI18n
	dev.Country = input.Country
	dev.Poster = input.Poster
	if err := deps.GetDB(c).Save(&dev).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update developer"})
		return
	}
	c.JSON(http.StatusOK, dev)
}

func AdminDeleteDeveloper(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Developer{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete developer"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Developer deleted"})
}

// ——— Publishers ———
type AdminPublisherInput struct {
	Name            string                  `json:"name" binding:"required"`
	NameI18n        *models.LocalizedString `json:"nameI18n"`
	Description     *string                 `json:"description"`
	DescriptionI18n *models.LocalizedString `json:"descriptionI18n"`
	Country         *string                 `json:"country"`
	Poster          *string                 `json:"poster"`
	PublicationTypes []string                `json:"publicationTypes"`
}

func normalizePublisherPublicationTypes(types []string) models.StringArray {
	allowed := map[string]struct{}{
		"game":        {},
		"manga":       {},
		"book":        {},
		"light-novel": {},
	}
	seen := make(map[string]struct{}, len(types))
	out := make(models.StringArray, 0, len(types))
	for _, item := range types {
		key := strings.TrimSpace(strings.ToLower(item))
		if _, ok := allowed[key]; !ok {
			continue
		}
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, key)
	}
	return out
}

func AdminCreatePublisher(c *gin.Context) {
	var input AdminPublisherInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pub := models.Publisher{
		Name:             input.Name,
		NameI18n:         input.NameI18n,
		Description:      input.Description,
		DescriptionI18n:  input.DescriptionI18n,
		Country:          input.Country,
		Poster:           input.Poster,
		PublicationTypes: normalizePublisherPublicationTypes(input.PublicationTypes),
	}
	if err := deps.GetDB(c).Create(&pub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create publisher"})
		return
	}
	c.JSON(http.StatusCreated, pub)
}

func AdminUpdatePublisher(c *gin.Context) {
	id := c.Param("id")
	var pub models.Publisher
	if err := deps.GetDB(c).First(&pub, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Publisher not found"})
		return
	}
	var input AdminPublisherInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pub.Name = input.Name
	pub.NameI18n = input.NameI18n
	pub.Description = input.Description
	pub.DescriptionI18n = input.DescriptionI18n
	pub.Country = input.Country
	pub.Poster = input.Poster
	pub.PublicationTypes = normalizePublisherPublicationTypes(input.PublicationTypes)
	if err := deps.GetDB(c).Save(&pub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update publisher"})
		return
	}
	c.JSON(http.StatusOK, pub)
}

func AdminDeletePublisher(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Publisher{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete publisher"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Publisher deleted"})
}

// ——— Platforms ———
type AdminPlatformInput struct {
	Name     string                  `json:"name" binding:"required"`
	NameI18n *models.LocalizedString `json:"nameI18n"`
	Icon     *string                 `json:"icon"`
}

func AdminCreatePlatform(c *gin.Context) {
	var input AdminPlatformInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	platform := models.Platform{Name: input.Name, NameI18n: input.NameI18n, Icon: input.Icon}
	if err := deps.GetDB(c).Create(&platform).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create platform"})
		return
	}
	c.JSON(http.StatusCreated, platform)
}

func AdminUpdatePlatform(c *gin.Context) {
	id := c.Param("id")
	var platform models.Platform
	if err := deps.GetDB(c).First(&platform, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platform not found"})
		return
	}
	var input AdminPlatformInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	platform.Name = input.Name
	platform.NameI18n = input.NameI18n
	platform.Icon = input.Icon
	if err := deps.GetDB(c).Save(&platform).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update platform"})
		return
	}
	c.JSON(http.StatusOK, platform)
}

func AdminDeletePlatform(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Platform{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete platform"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Platform deleted"})
}

// ——— Persons ———
type AdminPersonInput struct {
	FirstName     string                  `json:"firstName" binding:"required"`
	FirstNameI18n *models.LocalizedString `json:"firstNameI18n"`
	LastName      string                  `json:"lastName" binding:"required"`
	LastNameI18n  *models.LocalizedString `json:"lastNameI18n"`
	BirthDate     *string                 `json:"birthDate"` // ISO date
	Country       *string                 `json:"country"`
	Biography     *string                 `json:"biography"`
	BiographyI18n *models.LocalizedString `json:"biographyI18n"`
	Profession    []string                `json:"profession"`
	Avatar        *string                 `json:"avatar"`
	Images        []ImageEntryInput       `json:"images"`
}

func AdminCreatePerson(c *gin.Context) {
	var input AdminPersonInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	person := models.Person{
		FirstName:     input.FirstName,
		FirstNameI18n: input.FirstNameI18n,
		LastName:      input.LastName,
		LastNameI18n:  input.LastNameI18n,
		Country:       input.Country,
		Biography:     input.Biography,
		BiographyI18n: input.BiographyI18n,
		Profession:    toJSONArray(input.Profession),
		Avatar:        input.Avatar,
		Images:        toJSONArrayFromImageEntries(input.Images),
	}
	if input.BirthDate != nil && *input.BirthDate != "" {
		if t, err := parseDate(*input.BirthDate); err == nil {
			person.BirthDate = &t
		}
	}
	if err := deps.GetDB(c).Create(&person).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create person"})
		return
	}
	c.JSON(http.StatusCreated, person)
}

func AdminUpdatePerson(c *gin.Context) {
	id := c.Param("id")
	var person models.Person
	if err := deps.GetDB(c).First(&person, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Person not found"})
		return
	}
	var input AdminPersonInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	person.FirstName = input.FirstName
	person.FirstNameI18n = input.FirstNameI18n
	person.LastName = input.LastName
	person.LastNameI18n = input.LastNameI18n
	person.Country = input.Country
	person.Biography = input.Biography
	person.BiographyI18n = input.BiographyI18n
	person.Profession = toJSONArray(input.Profession)
	person.Avatar = input.Avatar
	person.Images = toJSONArrayFromImageEntries(input.Images)
	if input.BirthDate != nil && *input.BirthDate != "" {
		if t, err := parseDate(*input.BirthDate); err == nil {
			person.BirthDate = &t
		}
	} else {
		person.BirthDate = nil
	}
	if err := deps.GetDB(c).Save(&person).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update person"})
		return
	}
	c.JSON(http.StatusOK, person)
}

func AdminDeletePerson(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Person{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete person"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Person deleted"})
}

// ——— Characters ———
type AdminCharacterInput struct {
	Name            string                  `json:"name" binding:"required"`
	NameI18n        *models.LocalizedString `json:"nameI18n"`
	Description     *string                 `json:"description"`
	DescriptionI18n *models.LocalizedString `json:"descriptionI18n"`
	Avatar          *string                 `json:"avatar"`
	Images          []ImageEntryInput       `json:"images"`
}

func AdminCreateCharacter(c *gin.Context) {
	var input AdminCharacterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ch := models.Character{
		Name:            input.Name,
		NameI18n:        input.NameI18n,
		Description:     input.Description,
		DescriptionI18n: input.DescriptionI18n,
		Avatar:          input.Avatar,
		Images:          toJSONArrayFromImageEntries(input.Images),
	}
	if err := deps.GetDB(c).Create(&ch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create character"})
		return
	}
	c.JSON(http.StatusCreated, ch)
}

func AdminUpdateCharacter(c *gin.Context) {
	id := c.Param("id")
	var ch models.Character
	if err := deps.GetDB(c).First(&ch, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
		return
	}
	var input AdminCharacterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ch.Name = input.Name
	ch.NameI18n = input.NameI18n
	ch.Description = input.Description
	ch.DescriptionI18n = input.DescriptionI18n
	ch.Avatar = input.Avatar
	ch.Images = toJSONArrayFromImageEntries(input.Images)
	if err := deps.GetDB(c).Save(&ch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update character"})
		return
	}
	c.JSON(http.StatusOK, ch)
}

func AdminDeleteCharacter(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Character{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete character"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Character deleted"})
}

// ——— Sites (интернет-ресурсы для ссылок «Где смотреть») ———
func AdminGetSites(c *gin.Context) {
	var sites []models.Site
	if err := deps.GetDB(c).Order("name").Find(&sites).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sites"})
		return
	}
	c.JSON(http.StatusOK, sites)
}

type AdminSiteInput struct {
	Name        string  `json:"name" binding:"required"`
	URL         string  `json:"url" binding:"required"`
	Icon        *string `json:"icon"`
	Description *string `json:"description"`
}

func AdminCreateSite(c *gin.Context) {
	var input AdminSiteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	site := models.Site{
		Name:        input.Name,
		URL:         input.URL,
		Icon:        input.Icon,
		Description: input.Description,
	}
	if err := deps.GetDB(c).Create(&site).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create site"})
		return
	}
	c.JSON(http.StatusCreated, site)
}

func AdminUpdateSite(c *gin.Context) {
	id := c.Param("id")
	var site models.Site
	if err := deps.GetDB(c).First(&site, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Site not found"})
		return
	}
	var input AdminSiteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	site.Name = input.Name
	site.URL = input.URL
	site.Icon = input.Icon
	site.Description = input.Description
	if err := deps.GetDB(c).Save(&site).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update site"})
		return
	}
	c.JSON(http.StatusOK, site)
}

func AdminDeleteSite(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Site{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete site"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Site deleted"})
}

// ——— Movies ———
type AdminMovieSiteInput struct {
	SiteID uint   `json:"siteId"`
	URL    string `json:"url"`
}

type AdminMovieInput struct {
	Title            string                  `json:"title" binding:"required"`
	TitleI18n        *models.LocalizedString `json:"titleI18n"`
	TitleKatakana    *string                 `json:"titleKatakana"` // Аниме: оригинал (катакана)
	TitleRomaji      *string                 `json:"titleRomaji"`   // Аниме: ромадзи
	Description      *string                 `json:"description"`
	DescriptionI18n  *models.LocalizedString `json:"descriptionI18n"`
	ReleaseDate      *string                 `json:"releaseDate"`
	Poster           *string                 `json:"poster"`
	Backdrop         *string                 `json:"backdrop"`
	Images           []ImageEntryInput       `json:"images"`
	Videos           []VideoEntryInput       `json:"videos"`
	Rating           *float64                `json:"rating"`
	AgeRating        *string                 `json:"ageRating"`
	Duration         *int                    `json:"duration"`
	Country          *string                 `json:"country"`
	GenreIDs         []uint                  `json:"genreIds"`
	ThemeIDs         []uint                  `json:"themeIds"`
	StudioIDs        []uint                  `json:"studioIds"`
	IsHidden         *bool                   `json:"isHidden"`
	Status           *string                 `json:"status"`
	Sites            []AdminMovieSiteInput   `json:"sites"`
	// Аниме-сериалы: сезон выхода (winter, spring, summer, autumn)
	Season *string `json:"season"`
	PlatformIDs   []uint `json:"platformIds"`
	DeveloperIDs  []uint `json:"developerIds"`
	PublisherIDs   []uint `json:"publisherIds"`
	Volumes                 *int   `json:"volumes"`
	CurrentVolume           *int   `json:"currentVolume"`
	CurrentChapter          *int   `json:"currentChapter"`
	Pages                   *int   `json:"pages"`
	ReadingDurationMinutes  *int   `json:"readingDurationMinutes"`
	AuthorIDs               []uint `json:"authorIds"`
	IllustratorIDs          []uint `json:"illustratorIds"`
}

func AdminCreateMovie(c *gin.Context) {
	var input AdminMovieInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	movie := models.Movie{
		Title:           input.Title,
		TitleI18n:       input.TitleI18n,
		Description:     input.Description,
		DescriptionI18n: input.DescriptionI18n,
		Poster:          input.Poster,
		Backdrop:        input.Backdrop,
		Images:          toJSONArrayFromImageEntries(input.Images),
		Videos:          toJSONArrayFromVideoEntries(input.Videos),
		Rating:          input.Rating,
		Duration:        input.Duration,
		Country:         input.Country,
	}
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		movie.AgeRating = &ar
	}
	if input.IsHidden != nil {
		movie.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		movie.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			movie.ReleaseDate = &t
		}
	}
	if err := deps.GetDB(c).Create(&movie).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create movie"})
		return
	}
	associateMovieGenresThemesStudios(deps.GetDB(c), &movie, input.GenreIDs, input.ThemeIDs, input.StudioIDs)
	associateMovieSites(deps.GetDB(c), movie.ID, input.Sites)
	c.JSON(http.StatusCreated, movie)
}

func AdminUpdateMovie(c *gin.Context) {
	id := c.Param("id")
	db := deps.GetDB(c)
	var movie models.Movie
	if err := db.First(&movie, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Movie not found"})
		return
	}
	oldStatus, oldRelease := movie.Status, movie.ReleaseDate

	var input AdminMovieInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	movie.Title = input.Title
	movie.TitleI18n = input.TitleI18n
	movie.Description = input.Description
	movie.DescriptionI18n = input.DescriptionI18n
	movie.Poster = input.Poster
	movie.Backdrop = input.Backdrop
	movie.Images = toJSONArrayFromImageEntries(input.Images)
	movie.Videos = toJSONArrayFromVideoEntries(input.Videos)
	movie.Rating = input.Rating
	movie.Duration = input.Duration
	movie.Country = input.Country
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		movie.AgeRating = &ar
	}
	if input.IsHidden != nil {
		movie.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		movie.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			movie.ReleaseDate = &t
		}
	}
	if err := db.Save(&movie).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update movie"})
		return
	}
	associateMovieGenresThemesStudios(db, &movie, input.GenreIDs, input.ThemeIDs, input.StudioIDs)
	associateMovieSites(db, movie.ID, input.Sites)

	// Уведомления для пользователей, у которых фильм в списке: смена статуса или даты выхода
	statusChanged := input.Status != nil && (oldStatus == nil || *oldStatus != *movie.Status)
	releaseChanged := input.ReleaseDate != nil && *input.ReleaseDate != "" && !releaseEqual(oldRelease, movie.ReleaseDate)
	if statusChanged {
		title := "Обновление статуса: «" + movie.Title + "»"
		body := string(*movie.Status)
		services.NotifyMediaUpdate(db, services.MediaTypeMovie, movie.ID, title, &body, models.JSONMap{"reason": "status_change", "newStatus": string(*movie.Status)})
	}
	if releaseChanged && movie.ReleaseDate != nil {
		title := "Установлена дата выхода: «" + movie.Title + "»"
		body := movie.ReleaseDate.Format("02.01.2006")
		services.NotifyMediaUpdate(db, services.MediaTypeMovie, movie.ID, title, &body, models.JSONMap{"reason": "release_date"})
	}

	c.JSON(http.StatusOK, movie)
}

func releaseEqual(a, b *time.Time) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return a.Equal(*b)
}

func AdminDeleteMovie(c *gin.Context) {
	id := c.Param("id")
	if err := deps.GetDB(c).Delete(&models.Movie{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete movie"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Movie deleted"})
}

// PUT /admin/media/:type/:id (type: tv-series, anime, anime-movies, games, manga, books, light-novels, cartoon-series, cartoon-movies)
func AdminUpdateMedia(c *gin.Context) {
	mediaType := c.Param("type")
	idStr := c.Param("id")
	db := deps.GetDB(c)

	var input AdminMovieInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	switch mediaType {
	case "tv-series":
		adminUpdateTVSeries(db, c, uint(id), input)
	case "anime":
		adminUpdateAnimeSeries(db, c, uint(id), input)
	case "anime-movies":
		adminUpdateAnimeMovie(db, c, uint(id), input)
	case "cartoon-series":
		adminUpdateCartoonSeries(db, c, uint(id), input)
	case "cartoon-movies":
		adminUpdateCartoonMovie(db, c, uint(id), input)
	case "games":
		adminUpdateGame(db, c, uint(id), input)
	case "manga":
		adminUpdateManga(db, c, uint(id), input)
	case "books":
		adminUpdateBook(db, c, uint(id), input)
	case "light-novels":
		adminUpdateLightNovel(db, c, uint(id), input)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported media type"})
	}
}

func applyMediaInputToSeries(m *models.TVSeries, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
}

func applyMediaInputToMovieLike(m *models.AnimeMovie, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.Duration != nil {
		m.Duration = input.Duration
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
}

func applyMediaInputToGame(m *models.Game, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
}

func applyMediaInputToManga(m *models.Manga, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
	m.Volumes = input.Volumes
	m.CurrentVolume = input.CurrentVolume
	m.CurrentChapter = input.CurrentChapter
}

func adminUpdateTVSeries(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.TVSeries
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "TV series not found"})
		return
	}
	applyMediaInputToSeries((*models.TVSeries)(&m), input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateGenresThemesStudios(db, &m, input.GenreIDs, input.ThemeIDs, input.StudioIDs)
	associateTVSeriesSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func adminUpdateAnimeSeries(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.AnimeSeries
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}
	applyMediaInputToAnimeSeries(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateAnimeSeriesGenresThemesStudios(db, &m, input.GenreIDs, input.ThemeIDs, input.StudioIDs)
	associateAnimeSeriesSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func applyMediaInputToAnimeSeries(m *models.AnimeSeries, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	if input.TitleKatakana != nil {
		s := strings.TrimSpace(*input.TitleKatakana)
		if s == "" {
			m.TitleKatakana = nil
		} else {
			m.TitleKatakana = &s
		}
	}
	if input.TitleRomaji != nil {
		s := strings.TrimSpace(*input.TitleRomaji)
		if s == "" {
			m.TitleRomaji = nil
		} else {
			m.TitleRomaji = &s
		}
	}
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
	if input.Season != nil {
		if *input.Season == "" {
			m.Season = nil
		} else {
			s := models.AnimeSeason(*input.Season)
			switch s {
			case models.AnimeSeasonWinter, models.AnimeSeasonSpring, models.AnimeSeasonSummer, models.AnimeSeasonAutumn:
				m.Season = &s
			default:
				m.Season = nil
			}
		}
	}
}

func associateGenresThemesStudios(db *gorm.DB, m *models.TVSeries, genreIDs, themeIDs, studioIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
	if len(studioIDs) > 0 {
		var studios []models.Studio
		db.Find(&studios, studioIDs)
		db.Model(m).Association("Studios").Replace(studios)
	}
}

func associateTVSeriesSites(db *gorm.DB, tvSeriesID uint, sites []AdminMovieSiteInput) {
	db.Where("tv_series_id = ?", tvSeriesID).Delete(&models.TVSeriesSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.TVSeriesSite{TVSeriesID: tvSeriesID, SiteID: s.SiteID, URL: s.URL})
	}
}

func associateAnimeSeriesGenresThemesStudios(db *gorm.DB, m *models.AnimeSeries, genreIDs, themeIDs, studioIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
	if len(studioIDs) > 0 {
		var studios []models.Studio
		db.Find(&studios, studioIDs)
		db.Model(m).Association("Studios").Replace(studios)
	}
}

func associateAnimeSeriesSites(db *gorm.DB, animeSeriesID uint, sites []AdminMovieSiteInput) {
	db.Where("anime_series_id = ?", animeSeriesID).Delete(&models.AnimeSeriesSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.AnimeSeriesSite{AnimeSeriesID: animeSeriesID, SiteID: s.SiteID, URL: s.URL})
	}
}

func adminUpdateAnimeMovie(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.AnimeMovie
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime movie not found"})
		return
	}
	applyMediaInputToMovieLike(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateAnimeMovieGenresThemesStudios(db, &m, input.GenreIDs, input.ThemeIDs, input.StudioIDs)
	associateAnimeMovieSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func associateAnimeMovieGenresThemesStudios(db *gorm.DB, m *models.AnimeMovie, genreIDs, themeIDs, studioIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
	if len(studioIDs) > 0 {
		var studios []models.Studio
		db.Find(&studios, studioIDs)
		db.Model(m).Association("Studios").Replace(studios)
	}
}

func associateAnimeMovieSites(db *gorm.DB, animeMovieID uint, sites []AdminMovieSiteInput) {
	db.Where("anime_movie_id = ?", animeMovieID).Delete(&models.AnimeMovieSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.AnimeMovieSite{AnimeMovieID: animeMovieID, SiteID: s.SiteID, URL: s.URL})
	}
}

func adminUpdateCartoonSeries(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.CartoonSeries
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cartoon series not found"})
		return
	}
	applyMediaInputToCartoonSeries(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateCartoonSeriesGenresThemesStudios(db, &m, input.GenreIDs, input.ThemeIDs, input.StudioIDs)
	associateCartoonSeriesSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func applyMediaInputToCartoonSeries(m *models.CartoonSeries, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
}

func associateCartoonSeriesGenresThemesStudios(db *gorm.DB, m *models.CartoonSeries, genreIDs, themeIDs, studioIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
	if len(studioIDs) > 0 {
		var studios []models.Studio
		db.Find(&studios, studioIDs)
		db.Model(m).Association("Studios").Replace(studios)
	}
}

func associateCartoonSeriesSites(db *gorm.DB, cartoonSeriesID uint, sites []AdminMovieSiteInput) {
	db.Where("cartoon_series_id = ?", cartoonSeriesID).Delete(&models.CartoonSeriesSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.CartoonSeriesSite{CartoonSeriesID: cartoonSeriesID, SiteID: s.SiteID, URL: s.URL})
	}
}

func adminUpdateCartoonMovie(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.CartoonMovie
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cartoon movie not found"})
		return
	}
	applyMediaInputToCartoonMovie(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateCartoonMovieGenresThemesStudios(db, &m, input.GenreIDs, input.ThemeIDs, input.StudioIDs)
	associateCartoonMovieSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func applyMediaInputToCartoonMovie(m *models.CartoonMovie, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.Duration != nil {
		m.Duration = input.Duration
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
}

func associateCartoonMovieGenresThemesStudios(db *gorm.DB, m *models.CartoonMovie, genreIDs, themeIDs, studioIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
	if len(studioIDs) > 0 {
		var studios []models.Studio
		db.Find(&studios, studioIDs)
		db.Model(m).Association("Studios").Replace(studios)
	}
}

func associateCartoonMovieSites(db *gorm.DB, cartoonMovieID uint, sites []AdminMovieSiteInput) {
	db.Where("cartoon_movie_id = ?", cartoonMovieID).Delete(&models.CartoonMovieSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.CartoonMovieSite{CartoonMovieID: cartoonMovieID, SiteID: s.SiteID, URL: s.URL})
	}
}

func adminUpdateGame(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.Game
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
		return
	}
	applyMediaInputToGame(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateGameGenresThemes(db, &m, input.GenreIDs, input.ThemeIDs)
	associateGamePlatformsDevelopersPublishers(db, &m, input.PlatformIDs, input.DeveloperIDs, input.PublisherIDs)
	associateGameSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func associateGamePlatformsDevelopersPublishers(db *gorm.DB, m *models.Game, platformIDs, developerIDs, publisherIDs []uint) {
	if len(platformIDs) > 0 {
		var platforms []models.Platform
		db.Find(&platforms, platformIDs)
		db.Model(m).Association("Platforms").Replace(platforms)
	}
	if len(developerIDs) > 0 {
		var devs []models.Developer
		db.Find(&devs, developerIDs)
		db.Model(m).Association("Developers").Replace(devs)
	}
	if len(publisherIDs) > 0 {
		var pubs []models.Publisher
		db.Find(&pubs, publisherIDs)
		db.Model(m).Association("Publishers").Replace(pubs)
	}
}

func associateGameGenresThemes(db *gorm.DB, m *models.Game, genreIDs, themeIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
}

func associateGameSites(db *gorm.DB, gameID uint, sites []AdminMovieSiteInput) {
	db.Where("game_id = ?", gameID).Delete(&models.GameSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.GameSite{GameID: gameID, SiteID: s.SiteID, URL: s.URL})
	}
}

func adminUpdateManga(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.Manga
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Manga not found"})
		return
	}
	applyMediaInputToManga(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateMangaGenresThemes(db, &m, input.GenreIDs, input.ThemeIDs)
	associateMangaPublishersAuthors(db, &m, input.PublisherIDs, input.AuthorIDs)
	associateMangaSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func associateMangaPublishersAuthors(db *gorm.DB, m *models.Manga, publisherIDs, authorIDs []uint) {
	if len(publisherIDs) > 0 {
		var pubs []models.Publisher
		db.Find(&pubs, publisherIDs)
		db.Model(m).Association("Publishers").Replace(pubs)
	}
	if len(authorIDs) > 0 {
		var authors []models.Person
		db.Find(&authors, authorIDs)
		db.Model(m).Association("Authors").Replace(authors)
	}
}

func associateMangaGenresThemes(db *gorm.DB, m *models.Manga, genreIDs, themeIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
}

func associateMangaSites(db *gorm.DB, mangaID uint, sites []AdminMovieSiteInput) {
	db.Where("manga_id = ?", mangaID).Delete(&models.MangaSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.MangaSite{MangaID: mangaID, SiteID: s.SiteID, URL: s.URL})
	}
}

func adminUpdateBook(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.Book
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}
	applyMediaInputToBook(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateBookGenresThemes(db, &m, input.GenreIDs, input.ThemeIDs)
	associateBookPublishersAuthors(db, &m, input.PublisherIDs, input.AuthorIDs)
	associateBookSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func applyMediaInputToBook(m *models.Book, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
	m.Pages = input.Pages
	m.ReadingDurationMinutes = input.ReadingDurationMinutes
}

func associateBookPublishersAuthors(db *gorm.DB, m *models.Book, publisherIDs, authorIDs []uint) {
	if len(publisherIDs) > 0 {
		var pubs []models.Publisher
		db.Find(&pubs, publisherIDs)
		db.Model(m).Association("Publishers").Replace(pubs)
	}
	if len(authorIDs) > 0 {
		var authors []models.Person
		db.Find(&authors, authorIDs)
		db.Model(m).Association("Authors").Replace(authors)
	}
}

func associateBookGenresThemes(db *gorm.DB, m *models.Book, genreIDs, themeIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
}

func associateBookSites(db *gorm.DB, bookID uint, sites []AdminMovieSiteInput) {
	db.Where("book_id = ?", bookID).Delete(&models.BookSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.BookSite{BookID: bookID, SiteID: s.SiteID, URL: s.URL})
	}
}

func adminUpdateLightNovel(db *gorm.DB, c *gin.Context, id uint, input AdminMovieInput) {
	var m models.LightNovel
	if err := db.First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Light novel not found"})
		return
	}
	applyMediaInputToLightNovel(&m, input)
	if err := db.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	associateLightNovelGenresThemes(db, &m, input.GenreIDs, input.ThemeIDs)
	associateLightNovelPublishersAuthorsIllustrators(db, &m, input.PublisherIDs, input.AuthorIDs, input.IllustratorIDs)
	associateLightNovelSites(db, m.ID, input.Sites)
	c.JSON(http.StatusOK, m)
}

func applyMediaInputToLightNovel(m *models.LightNovel, input AdminMovieInput) {
	m.Title = input.Title
	m.TitleI18n = input.TitleI18n
	m.Description = input.Description
	m.DescriptionI18n = input.DescriptionI18n
	m.Poster = input.Poster
	m.Backdrop = input.Backdrop
	m.Images = toJSONArrayFromImageEntries(input.Images)
	m.Videos = toJSONArrayFromVideoEntries(input.Videos)
	m.Rating = input.Rating
	if input.AgeRating != nil {
		ar := models.AgeRating(*input.AgeRating)
		m.AgeRating = &ar
	}
	if input.IsHidden != nil {
		m.IsHidden = *input.IsHidden
	}
	if input.Status != nil {
		st := models.MediaStatus(*input.Status)
		m.Status = &st
	}
	if input.ReleaseDate != nil && *input.ReleaseDate != "" {
		if t, err := parseDate(*input.ReleaseDate); err == nil {
			m.ReleaseDate = &t
		}
	}
	m.Volumes = input.Volumes
	m.CurrentVolume = input.CurrentVolume
	m.Pages = input.Pages
}

func associateLightNovelPublishersAuthorsIllustrators(db *gorm.DB, m *models.LightNovel, publisherIDs, authorIDs, illustratorIDs []uint) {
	if len(publisherIDs) > 0 {
		var pubs []models.Publisher
		db.Find(&pubs, publisherIDs)
		db.Model(m).Association("Publishers").Replace(pubs)
	}
	if len(authorIDs) > 0 {
		var authors []models.Person
		db.Find(&authors, authorIDs)
		db.Model(m).Association("Authors").Replace(authors)
	}
	if len(illustratorIDs) > 0 {
		var illustrators []models.Person
		db.Find(&illustrators, illustratorIDs)
		db.Model(m).Association("Illustrators").Replace(illustrators)
	}
}

func associateLightNovelGenresThemes(db *gorm.DB, m *models.LightNovel, genreIDs, themeIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(m).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(m).Association("Themes").Replace(themes)
	}
}

func associateLightNovelSites(db *gorm.DB, lightNovelID uint, sites []AdminMovieSiteInput) {
	db.Where("light_novel_id = ?", lightNovelID).Delete(&models.LightNovelSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.LightNovelSite{LightNovelID: lightNovelID, SiteID: s.SiteID, URL: s.URL})
	}
}

type CastWithMediaID struct {
	models.Cast
	MediaType string `json:"mediaType"`
	MediaID   uint   `json:"mediaId"`
}

func AdminGetCastList(c *gin.Context) {
	type pair struct {
		CastID  uint
		MovieID uint
	}
	var pairs []pair
	if err := deps.GetDB(c).Table("movie_cast").
		Select("movie_cast.cast_id as cast_id, movie_cast.movie_id as movie_id").
		Joins("JOIN casts ON casts.id = movie_cast.cast_id").
		Where("casts.character_id IS NOT NULL").
		Find(&pairs).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch cast list")
		return
	}
	if len(pairs) == 0 {
		c.JSON(http.StatusOK, []CastWithMediaID{})
		return
	}
	castIDs := make([]uint, 0, len(pairs))
	seen := make(map[uint]struct{})
	for _, p := range pairs {
		if _, ok := seen[p.CastID]; !ok {
			seen[p.CastID] = struct{}{}
			castIDs = append(castIDs, p.CastID)
		}
	}
	var casts []models.Cast
	if err := deps.GetDB(c).Preload("Character").Preload("Person").Find(&casts, castIDs).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch casts")
		return
	}
	castByID := make(map[uint]*models.Cast)
	for i := range casts {
		castByID[casts[i].ID] = &casts[i]
	}
	list := make([]CastWithMediaID, 0, len(pairs))
	for _, p := range pairs {
		c := castByID[p.CastID]
		if c == nil {
			continue
		}
		list = append(list, CastWithMediaID{
			Cast:     *c,
			MediaType: "movie",
			MediaID:   p.MovieID,
		})
	}
	c.JSON(http.StatusOK, list)
}

type StaffWithMediaID struct {
	models.MovieStaff
	MediaType string `json:"mediaType"`
	MediaID   uint   `json:"mediaId"`
}

// staffListRow — общий формат для списка персонала (movie_staff + media_staff).
type staffListRow struct {
	ID         uint        `json:"id"`
	MovieID    *uint       `json:"movieId,omitempty"`
	MediaType  string      `json:"mediaType"`
	MediaID    uint        `json:"mediaId"`
	PersonID   uint        `json:"personId"`
	Person     *models.Person `json:"person,omitempty"`
	Profession string      `json:"profession"`
}

func AdminGetStaffList(c *gin.Context) {
	db := deps.GetDB(c)
	var list []staffListRow

	var movieStaff []models.MovieStaff
	if err := db.Preload("Person").Find(&movieStaff).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch staff list")
		return
	}
	for _, s := range movieStaff {
		mID := s.MovieID
		list = append(list, staffListRow{
			ID: s.ID, MovieID: &mID, MediaType: "movie", MediaID: s.MovieID,
			PersonID: s.PersonID, Person: s.Person, Profession: string(s.Profession),
		})
	}

	var mediaStaff []models.MediaStaff
	if err := db.Preload("Person").Find(&mediaStaff).Error; err != nil {
		api.RespondInternal(c, "Failed to fetch staff list")
		return
	}
	for _, s := range mediaStaff {
		list = append(list, staffListRow{
			ID: s.ID, MediaType: s.MediaType, MediaID: s.MediaID,
			PersonID: s.PersonID, Person: s.Person, Profession: string(s.Profession),
		})
	}

	c.JSON(http.StatusOK, list)
}

func associateMovieGenresThemesStudios(db *gorm.DB, movie *models.Movie, genreIDs, themeIDs, studioIDs []uint) {
	if len(genreIDs) > 0 {
		var genres []models.Genre
		db.Find(&genres, genreIDs)
		db.Model(movie).Association("Genres").Replace(genres)
	}
	if len(themeIDs) > 0 {
		var themes []models.Theme
		db.Find(&themes, themeIDs)
		db.Model(movie).Association("Themes").Replace(themes)
	}
	if len(studioIDs) > 0 {
		var studios []models.Studio
		db.Find(&studios, studioIDs)
		db.Model(movie).Association("Studios").Replace(studios)
	}
}

func associateMovieSites(db *gorm.DB, movieID uint, sites []AdminMovieSiteInput) {
	db.Where("movie_id = ?", movieID).Delete(&models.MovieSite{})
	for _, s := range sites {
		if s.SiteID == 0 || s.URL == "" {
			continue
		}
		db.Create(&models.MovieSite{MovieID: movieID, SiteID: s.SiteID, URL: s.URL})
	}
}

// ——— Загрузка файлов (постеры, аватарки, трейлеры и т.д.) ———
// Сохранение на сервер, в БД хранится путь вида /uploads/posters/xxx.jpg

func AdminUpload(c *gin.Context) {
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

	typeKind := c.PostForm("type")
	if typeKind == "" {
		typeKind = "image"
	}
	switch typeKind {
	case "poster", "backdrop", "trailer", "image", "video":
	default:
		api.RespondBadRequest(c, "type must be one of: poster, backdrop, trailer, image, video", nil)
		return
	}

	maxSize := int64(cfg.MaxUploadSizeImage)
	if typeKind == "trailer" || typeKind == "video" {
		maxSize = int64(cfg.MaxUploadSizeVideo)
	}

	path, err := storage.Save(cfg.UploadDir, typeKind, file, maxSize, c.PostForm("baseName"))
	if err != nil {
		api.RespondValidationError(c, err)
		return
	}

	if typeKind == "trailer" || typeKind == "video" {
		services.TranscodeVideo(cfg.UploadDir, path)
	}

	resp := gin.H{"path": path}
	if typeKind == "image" || typeKind == "poster" || typeKind == "backdrop" {
		if w, h, err := storage.GetImageDimensions(cfg.UploadDir, path); err == nil {
			resp["width"] = w
			resp["height"] = h
		}
	}
	c.JSON(http.StatusOK, resp)
}

// ——— Смена роли пользователя ———
// Владелец может назначать любые роли (включая admin и owner). Админ — только user, moderator, content_creator.

var allowedRoles = []string{models.RoleUser, models.RoleModerator, models.RoleContentCreator, models.RoleDeveloper, models.RoleAdmin, models.RoleOwner}

type SetRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

func AdminSetUserRole(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
		return
	}
	currentUserID := userIDVal.(uint)

	var currentUser models.User
	if err := deps.GetDB(c).First(&currentUser, currentUserID).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "User not found"})
		return
	}

	idStr := c.Param("id")
	targetID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req SetRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role is required"})
		return
	}

	validRole := false
	for _, r := range allowedRoles {
		if req.Role == r {
			validRole = true
			break
		}
	}
	if !validRole {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Allowed: user, moderator, content_creator, developer, admin, owner"})
		return
	}

	if !currentUser.CanAssignRole(req.Role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You cannot assign this role (admin cannot assign admin or owner)"})
		return
	}

	var target models.User
	if err := deps.GetDB(c).First(&target, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	target.Role = req.Role
	if err := deps.GetDB(c).Save(&target).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": target.ToResponse(), "message": "Role updated"})
}

type SetCommentBanRequest struct {
	Until       time.Time `json:"until" binding:"required"` // до этой даты пользователь не может писать комментарии
	CommentText *string   `json:"commentText,omitempty"`   // снимок комментария (для истории)
	Reason      *string   `json:"reason,omitempty"`       // причина/заметка (для истории)
	ReportID    *uint     `json:"reportId,omitempty"`      // ID жалобы, если бан по решению по report
}

func AdminSetCommentBan(c *gin.Context) {
	idStr := c.Param("id")
	targetID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req SetCommentBanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "until is required (RFC3339)"})
		return
	}
	if req.Until.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "until must be in the future"})
		return
	}

	db := deps.GetDB(c)
	uid, _ := c.Get("userID")
	actorID, _ := uid.(uint)
	if actorID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var target models.User
	if err := db.First(&target, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	target.CommentBanUntil = &req.Until
	if err := db.Save(&target).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Запись в историю банов
	hist := models.CommentBanHistory{
		UserID:      uint(targetID),
		BannedUntil: req.Until,
		BannedBy:    actorID,
		CommentText: req.CommentText,
		Reason:      req.Reason,
		ReportID:    req.ReportID,
	}
	if err := db.Create(&hist).Error; err != nil {
		// не отменяем бан при ошибке записи истории
	}
	// Лог действия модератора (бан по жалобе)
	if req.ReportID != nil {
		logEntry := models.ModeratorActionLog{
			ReportID:    *req.ReportID,
			ModeratorID: actorID,
			Action:      models.ModeratorActionBan,
			Note:        req.Reason,
			BanUntil:    &req.Until,
		}
		_ = db.Create(&logEntry).Error
	}

	title := "Commenting temporarily restricted"
	body := "You are temporarily banned from writing comments until " + req.Until.Format("2006-01-02 15:04") + "."
	CreateNotificationForUser(uint(targetID), models.NotificationTypeCommentBan, title, &body, "user", uint(targetID), models.JSONMap{"until": req.Until.Format(time.RFC3339)})
	c.JSON(http.StatusOK, gin.H{"user": target.ToResponse(), "commentBanUntil": req.Until, "message": "Comment ban set"})
}

func AdminListCommentBannedUsers(c *gin.Context) {
	db := deps.GetDB(c)
	now := time.Now()
	var users []models.User
	if err := db.Where("comment_ban_until IS NOT NULL AND comment_ban_until > ?", now).
		Order("comment_ban_until ASC").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	list := make([]gin.H, 0, len(users))
	for _, u := range users {
		list = append(list, gin.H{
			"id":                u.ID,
			"username":          u.Username,
			"name":              u.Name,
			"email":             u.Email,
			"commentBanUntil":   u.CommentBanUntil,
		})
	}
	c.JSON(http.StatusOK, gin.H{"users": list})
}

func AdminClearCommentBan(c *gin.Context) {
	idStr := c.Param("id")
	targetID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	db := deps.GetDB(c)
	if err := db.Model(&models.User{}).Where("id = ?", targetID).Update("comment_ban_until", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear ban"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Comment ban cleared"})
}

func AdminGetCommentBanHistory(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	db := deps.GetDB(c)
	var list []models.CommentBanHistory
	if err := db.Where("user_id = ?", userID).Order("created_at DESC").Limit(50).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ban history"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"history": list})
}

func AdminRecalculateAchievements(c *gin.Context) {
	db := deps.GetDB(c)
	if err := services.RecalculateAllUsersAchievementProgress(db); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Achievement progress recalculated"})
}

func AdminRecalculateSimilarUsers(c *gin.Context) {
	go func() {
		if err := services.PrecomputeSimilarUsersForActiveUsersAll(); err != nil {
			slog.Default().Error("similar users recalc (admin) failed", slog.String("error", err.Error()))
		}
	}()
	c.JSON(http.StatusAccepted, gin.H{"message": "Similar users precompute started"})
}

func AdminRecalculateSimilarContent(c *gin.Context) {
	go func() {
		if err := services.ComputeSimilarPrecomputed(""); err != nil {
			slog.Default().Error("content_similar recalc (admin) failed", slog.String("error", err.Error()))
		}
	}()
	c.JSON(http.StatusAccepted, gin.H{"message": "content_similar precompute started"})
}

func toJSONArray(s []string) models.JSONArray {
	if s == nil {
		return models.JSONArray{}
	}
	arr := make(models.JSONArray, len(s))
	for i, v := range s {
		arr[i] = v
	}
	return arr
}

func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

// ——— Каст и персонал медиа (добавление/удаление на странице деталей) ———

var mediaTypesWithCast = map[string]bool{
	"movie": true, "tv-series": true, "anime": true,
	"cartoon-series": true, "cartoon-movies": true, "anime-movies": true,
}

type AdminAddCastInput struct {
	PersonID    *uint   `json:"personId"`
	CharacterID *uint   `json:"characterId"`
	Role        *string `json:"role"`
	RoleType    *string `json:"roleType"`
}

type AdminAddStaffInput struct {
	PersonID   uint   `json:"personId" binding:"required"`
	Profession string `json:"profession" binding:"required"`
}

// POST /admin/media/:type/:id/cast
func AdminAddMediaCast(c *gin.Context) {
	mediaType := c.Param("type")
	idStr := c.Param("id")
	db := deps.GetDB(c)
	if !mediaTypesWithCast[mediaType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported media type for cast"})
		return
	}
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var input AdminAddCastInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.PersonID == nil || *input.PersonID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "personId is required"})
		return
	}
	cast := models.Cast{
		PersonID:    input.PersonID,
		CharacterID:  input.CharacterID,
		Role:         input.Role,
		RoleType:     nil,
	}
	if input.RoleType != nil && *input.RoleType != "" {
		rt := models.RoleType(*input.RoleType)
		cast.RoleType = &rt
	}
	if err := db.Create(&cast).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create cast"})
		return
	}
	mediaID := uint(id)
	switch mediaType {
	case "movie":
		if err := db.Table("movie_cast").Create(map[string]interface{}{"movie_id": mediaID, "cast_id": cast.ID}).Error; err != nil {
			db.Delete(&cast)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link cast"})
			return
		}
	case "tv-series":
		if err := db.Table("tvseries_cast").Create(map[string]interface{}{"tv_series_id": mediaID, "cast_id": cast.ID}).Error; err != nil {
			db.Delete(&cast)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link cast"})
			return
		}
	case "anime":
		if err := db.Table("animeseries_cast").Create(map[string]interface{}{"anime_series_id": mediaID, "cast_id": cast.ID}).Error; err != nil {
			db.Delete(&cast)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link cast"})
			return
		}
	case "cartoon-series":
		if err := db.Table("cartoonseries_cast").Create(map[string]interface{}{"cartoon_series_id": mediaID, "cast_id": cast.ID}).Error; err != nil {
			db.Delete(&cast)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link cast"})
			return
		}
	case "cartoon-movies":
		if err := db.Table("cartoonmovie_cast").Create(map[string]interface{}{"cartoon_movie_id": mediaID, "cast_id": cast.ID}).Error; err != nil {
			db.Delete(&cast)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link cast"})
			return
		}
	case "anime-movies":
		if err := db.Table("animemovie_cast").Create(map[string]interface{}{"anime_movie_id": mediaID, "cast_id": cast.ID}).Error; err != nil {
			db.Delete(&cast)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link cast"})
			return
		}
	default:
		db.Delete(&cast)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported media type"})
		return
	}
	if err := db.Preload("Character").Preload("Person").First(&cast, cast.ID).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"id": cast.ID})
		return
	}
	c.JSON(http.StatusCreated, cast)
}

// DELETE /admin/media/:type/:id/cast/:castId
func AdminRemoveMediaCast(c *gin.Context) {
	mediaType := c.Param("type")
	idStr := c.Param("id")
	castIDStr := c.Param("castId")
	db := deps.GetDB(c)
	if !mediaTypesWithCast[mediaType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported media type"})
		return
	}
	mediaID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media ID"})
		return
	}
	castID, err := strconv.ParseUint(castIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cast ID"})
		return
	}
	var table string
	var col string
	switch mediaType {
	case "movie":
		table, col = "movie_cast", "movie_id"
	case "tv-series":
		table, col = "tvseries_cast", "tv_series_id"
	case "anime":
		table, col = "animeseries_cast", "anime_series_id"
	case "cartoon-series":
		table, col = "cartoonseries_cast", "cartoon_series_id"
	case "cartoon-movies":
		table, col = "cartoonmovie_cast", "cartoon_movie_id"
	case "anime-movies":
		table, col = "animemovie_cast", "anime_movie_id"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported media type"})
		return
	}
	res := db.Table(table).Where(col+" = ? AND cast_id = ?", mediaID, castID).Delete(nil)
	if res.Error != nil || res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cast link not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cast removed"})
}

// Типы медиа для staff совпадают с тем, что передаёт фронт в URL: movie, anime, game, tv-series, manga, book, light-novel, cartoon-series, cartoon-movies, anime-movies.
var allowedStaffMediaTypes = map[string]bool{
	"movie": true, "tv-series": true, "anime": true, "cartoon-series": true,
	"cartoon-movies": true, "anime-movies": true, "game": true, "manga": true,
	"book": true, "light-novel": true,
}

// POST /admin/media/:type/:id/staff
func AdminAddMediaStaff(c *gin.Context) {
	mediaType := c.Param("type")
	idStr := c.Param("id")
	db := deps.GetDB(c)
	if !allowedStaffMediaTypes[mediaType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported media type for staff"})
		return
	}
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var input AdminAddStaffInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if mediaType == "movie" {
		staff := models.MovieStaff{
			MovieID:    uint(id),
			PersonID:   input.PersonID,
			Profession: models.Profession(input.Profession),
		}
		if err := db.Create(&staff).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create staff"})
			return
		}
		if err := db.Preload("Person").First(&staff, staff.ID).Error; err != nil {
			c.JSON(http.StatusCreated, gin.H{"id": staff.ID})
			return
		}
		c.JSON(http.StatusCreated, staff)
		return
	}

	staff := models.MediaStaff{
		MediaType:  mediaType,
		MediaID:    uint(id),
		PersonID:   input.PersonID,
		Profession: models.Profession(input.Profession),
	}
	if err := db.Create(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create staff"})
		return
	}
	if err := db.Preload("Person").First(&staff, staff.ID).Error; err != nil {
		c.JSON(http.StatusCreated, gin.H{"id": staff.ID})
		return
	}
	c.JSON(http.StatusCreated, staff)
}

// DELETE /admin/media/:type/:id/staff/:staffId
func AdminRemoveMediaStaff(c *gin.Context) {
	mediaType := c.Param("type")
	idStr := c.Param("id")
	staffIDStr := c.Param("staffId")
	db := deps.GetDB(c)
	if !allowedStaffMediaTypes[mediaType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported media type for staff"})
		return
	}
	mediaID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media ID"})
		return
	}
	staffID, err := strconv.ParseUint(staffIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid staff ID"})
		return
	}
	if mediaType == "movie" {
		res := db.Where("id = ? AND movie_id = ?", staffID, mediaID).Delete(&models.MovieStaff{})
		if res.Error != nil || res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Staff not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Staff removed"})
		return
	}
	res := db.Where("id = ? AND media_type = ? AND media_id = ?", staffID, mediaType, mediaID).Delete(&models.MediaStaff{})
	if res.Error != nil || res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Staff not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Staff removed"})
}
