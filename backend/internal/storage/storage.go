package storage

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

// Допустимые типы загрузки и подпапки в UploadDir.
var typeSubdir = map[string]string{
	"poster":   "posters",
	"backdrop": "backdrops",
	"avatar":   "avatars",
	"trailer":  "trailers",
	"image":    "images",
	"video":    "videos",
}

// Разрешённые MIME-типы по категории (расширения для сохранения файла).
var allowedByType = map[string][]string{
	"poster":   {".jpg", ".jpeg", ".png", ".gif", ".webp"},
	"backdrop": {".jpg", ".jpeg", ".png", ".gif", ".webp"},
	"avatar":   {".jpg", ".jpeg", ".png", ".gif", ".webp"},
	"image":    {".jpg", ".jpeg", ".png", ".gif", ".webp"},
	"trailer":  {".mp4", ".webm", ".mov"},
	"video":    {".mp4", ".webm", ".mov"},
}

var fileBaseSanitizeRe = regexp.MustCompile(`[^a-zA-Z0-9_-]+`)

// Returns path like "/uploads/posters/abc123.jpg" (URL path for response and DB).
func Save(baseDir, typeKind string, fileHeader *multipart.FileHeader, maxSize int64, preferredBaseName string) (path string, err error) {
	subdir, ok := typeSubdir[typeKind]
	if !ok {
		return "", fmt.Errorf("invalid upload type: %s", typeKind)
	}

	exts := allowedByType[typeKind]
	contentType := fileHeader.Header.Get("Content-Type")
	ext, err := extensionFromContentType(contentType, fileHeader.Filename, exts)
	if err != nil {
		return "", err
	}

	if fileHeader.Size > maxSize {
		return "", fmt.Errorf("file too large: max %d bytes", maxSize)
	}

	dir := filepath.Join(baseDir, subdir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	name := uniqueName() + ext
	if cleaned := sanitizeFileBaseName(preferredBaseName); cleaned != "" {
		name = uniqueAvailableName(dir, cleaned, ext)
	}
	fullPath := filepath.Join(dir, name)
	dst, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(fullPath)
		return "", err
	}

	// URL path: /uploads/posters/xxx.jpg (forward slashes, no leading .)
	path = "/uploads/" + subdir + "/" + name
	return path, nil
}

func uniqueName() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func sanitizeFileBaseName(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	if s == "" {
		return ""
	}
	s = strings.ReplaceAll(s, " ", "-")
	s = fileBaseSanitizeRe.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-_")
	s = strings.ReplaceAll(s, "--", "-")
	return s
}

func uniqueAvailableName(dir, baseName, ext string) string {
	name := baseName + ext
	if _, err := os.Stat(filepath.Join(dir, name)); os.IsNotExist(err) {
		return name
	}
	for i := 2; ; i++ {
		candidate := baseName + "-" + strconv.Itoa(i) + ext
		if _, err := os.Stat(filepath.Join(dir, candidate)); os.IsNotExist(err) {
			return candidate
		}
	}
}

func extensionFromContentType(contentType string, filename string, allowed []string) (string, error) {
	if contentType != "" {
		exts, _ := mime.ExtensionsByType(contentType)
		for _, e := range exts {
			e = strings.ToLower(e)
			for _, a := range allowed {
				if e == a {
					return e, nil
				}
			}
		}
	}
	if filename != "" {
		e := strings.ToLower(filepath.Ext(filename))
		for _, a := range allowed {
			if e == a {
				return e, nil
			}
		}
	}
	if len(allowed) > 0 {
		return allowed[0], nil
	}
	return "", fmt.Errorf("content type %s not allowed", contentType)
}

// GetImageDimensions reads width and height from an image file.
// uploadDir is the root upload directory; urlPath is the stored path like "/uploads/images/xxx.jpg".
func GetImageDimensions(uploadDir, urlPath string) (width, height int, err error) {
	const prefix = "/uploads/"
	if !strings.HasPrefix(urlPath, prefix) {
		return 0, 0, fmt.Errorf("invalid url path: %s", urlPath)
	}
	rel := strings.TrimPrefix(urlPath, prefix)
	rel = filepath.FromSlash(rel)
	fullPath := filepath.Join(uploadDir, rel)
	f, err := os.Open(fullPath)
	if err != nil {
		return 0, 0, err
	}
	defer f.Close()
	cfg, _, err := image.DecodeConfig(f)
	if err != nil {
		return 0, 0, err
	}
	return cfg.Width, cfg.Height, nil
}