package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/deps"
)

// Допустимые значения quality (суффикс файла после транскодинга).
var streamQualitySuffix = map[string]string{
	"1080": "1080p", "1080p": "1080p",
	"720": "720p", "720p": "720p",
	"480": "480p", "480p": "480p",
	"360": "360p", "360p": "360p",
}

// StreamVideo godoc
// @Summary  Stream video file (trailers, etc.)
// @Tags     Stream
// @Param    path     query  string  true   "Path relative to UploadDir"
// @Param    quality  query  string  false  "1080|720|480|360 — transcoded version"
// @Success  200  "video stream"
// @Failure  400,404  "error"
// @Router   /stream/video [get]
func StreamVideo(c *gin.Context) {
	cfg := deps.GetConfig(c)
	if cfg == nil || cfg.UploadDir == "" {
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}

	pathParam := strings.TrimSpace(c.Query("path"))
	if pathParam == "" {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// Убираем ведущий слэш и запрещаем ..
	pathParam = strings.TrimPrefix(pathParam, "/")
	if pathParam == "" || strings.Contains(pathParam, "..") {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// При запросе quality подставляем путь к транскоду (xxx_720p.mp4)
	quality := strings.TrimSpace(c.Query("quality"))
	pathForQuality := pathParam
	if suffix, ok := streamQualitySuffix[quality]; ok {
		dir := filepath.Dir(pathParam)
		base := strings.TrimSuffix(filepath.Base(pathParam), filepath.Ext(pathParam))
		ext := filepath.Ext(pathParam)
		if base != "" && ext != "" {
			pathForQuality = filepath.ToSlash(filepath.Join(dir, base+"_"+suffix+ext))
		}
	}

	fullPath := filepath.Join(cfg.UploadDir, filepath.FromSlash(pathForQuality))
	cleanFull, err := filepath.Abs(fullPath)
	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	uploadAbs, err := filepath.Abs(cfg.UploadDir)
	if err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	rel, err := filepath.Rel(uploadAbs, cleanFull)
	if err != nil || strings.HasPrefix(rel, "..") || rel == ".." {
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	f, err := os.Open(cleanFull)
	if err != nil {
		if os.IsNotExist(err) && pathForQuality != pathParam {
			// Транскод ещё не готов (нет FFmpeg или в процессе) — отдаём оригинал
			fullPath = filepath.Join(cfg.UploadDir, filepath.FromSlash(pathParam))
			cleanFull, _ = filepath.Abs(fullPath)
			rel, _ = filepath.Rel(uploadAbs, cleanFull)
			if strings.HasPrefix(rel, "..") {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}
			f, err = os.Open(cleanFull)
		}
		if err != nil {
			if os.IsNotExist(err) {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil || info.IsDir() {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	contentType := "video/mp4"
	switch strings.ToLower(filepath.Ext(info.Name())) {
	case ".webm":
		contentType = "video/webm"
	case ".mov":
		contentType = "video/quicktime"
	}
	c.Header("Content-Type", contentType)
	c.Header("Accept-Ranges", "bytes")

	http.ServeContent(c.Writer, c.Request, info.Name(), info.ModTime(), f)
}
