package services

import (
	"context"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type videoQualityProfile struct {
	Height       int
	VideoBitrate string
	MaxRate      string
	BufferSize   string
	AudioBitrate string
	CRF          string
}

// Поддерживаемые качества для транскодинга.
// Отличаются не только высотой кадра, но и профилем сжатия/битрейтом.
// Генерируются только версии ниже исходной высоты видео.
var videoQualityProfiles = []videoQualityProfile{
	{Height: 1080, VideoBitrate: "5000k", MaxRate: "5350k", BufferSize: "7500k", AudioBitrate: "192k", CRF: "20"},
	{Height: 720, VideoBitrate: "2800k", MaxRate: "3000k", BufferSize: "4200k", AudioBitrate: "160k", CRF: "22"},
	{Height: 480, VideoBitrate: "1400k", MaxRate: "1498k", BufferSize: "2100k", AudioBitrate: "128k", CRF: "24"},
	{Height: 360, VideoBitrate: "800k", MaxRate: "856k", BufferSize: "1200k", AudioBitrate: "96k", CRF: "26"},
}

const transcodeTimeout = 15 * time.Minute
const probeTimeout = 15 * time.Second

// TranscodeVideo запускает в горутине транскодинг загруженного видео
// в более низкие качества относительно исходного файла.
// pathFromStorage — путь из storage.Save, например "/uploads/trailers/abc123.mp4".
// uploadDir — корень загрузок на диске.
// Исходный файл не изменяется; создаются файлы вида abc123_720p.mp4, abc123_480p.mp4, abc123_360p.mp4.
func TranscodeVideo(uploadDir, pathFromStorage string) {
	if uploadDir == "" || pathFromStorage == "" {
		return
	}
	rel := strings.TrimPrefix(pathFromStorage, "/uploads/")
	rel = strings.TrimPrefix(rel, "uploads/")
	if rel == "" {
		return
	}
	inputPath := filepath.Join(uploadDir, filepath.FromSlash(rel))
	go runTranscode(inputPath, uploadDir, rel)
}

func runTranscode(inputPath, uploadDir, rel string) {
	if _, err := os.Stat(inputPath); os.IsNotExist(err) {
		slog.Warn("transcode: input file not found", "path", inputPath)
		return
	}
	dir := filepath.Dir(filepath.Join(uploadDir, filepath.FromSlash(rel)))
	base := strings.TrimSuffix(filepath.Base(rel), filepath.Ext(rel))
	ext := filepath.Ext(rel)
	if base == "" || ext == "" {
		return
	}

	qualitiesToGenerate := videoQualityProfiles
	sourceHeight, err := getSourceVideoHeight(inputPath)
	if err != nil {
		slog.Warn("transcode: failed to detect source height, using default qualities", "path", inputPath, "err", err)
	} else if sourceHeight > 0 {
		filtered := make([]videoQualityProfile, 0, len(videoQualityProfiles))
		for _, profile := range videoQualityProfiles {
			if profile.Height < sourceHeight {
				filtered = append(filtered, profile)
			}
		}
		qualitiesToGenerate = filtered
		qualityHeights := make([]int, 0, len(qualitiesToGenerate))
		for _, profile := range qualitiesToGenerate {
			qualityHeights = append(qualityHeights, profile.Height)
		}
		slog.Info("transcode: source detected", "path", inputPath, "source_height", sourceHeight, "qualities", qualityHeights)
	}

	for _, profile := range qualitiesToGenerate {
		outName := base + "_" + qualitySuffix(profile.Height) + ext
		outPath := filepath.Join(dir, outName)
		if _, err := os.Stat(outPath); err == nil {
			continue
		}
		ctx, cancel := context.WithTimeout(context.Background(), transcodeTimeout)
		cmd := exec.CommandContext(ctx, "ffmpeg",
			"-i", inputPath,
			"-vf", "scale=-2:"+strconv.Itoa(profile.Height),
			"-c:v", "libx264",
			"-preset", "medium",
			"-profile:v", "high",
			"-pix_fmt", "yuv420p",
			"-b:v", profile.VideoBitrate,
			"-maxrate", profile.MaxRate,
			"-bufsize", profile.BufferSize,
			"-crf", profile.CRF,
			"-c:a", "aac",
			"-b:a", profile.AudioBitrate,
			"-movflags", "+faststart",
			"-y",
			outPath,
		)
		if err := cmd.Run(); err != nil {
			slog.Warn("transcode: ffmpeg failed", "height", profile.Height, "err", err, "path", outPath)
		} else {
			slog.Info(
				"transcode: created",
				"height", profile.Height,
				"path", outPath,
				"video_bitrate", profile.VideoBitrate,
				"audio_bitrate", profile.AudioBitrate,
				"crf", profile.CRF,
			)
		}
		cancel()
	}
}

func getSourceVideoHeight(inputPath string) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), probeTimeout)
	defer cancel()

	out, err := exec.CommandContext(
		ctx,
		"ffprobe",
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=height",
		"-of", "default=noprint_wrappers=1:nokey=1",
		inputPath,
	).Output()
	if err != nil {
		return 0, err
	}

	heightStr := strings.TrimSpace(string(out))
	if heightStr == "" {
		return 0, nil
	}

	height, err := strconv.Atoi(heightStr)
	if err != nil {
		return 0, err
	}
	return height, nil
}

func qualitySuffix(height int) string {
	switch height {
	case 1080:
		return "1080p"
	case 720:
		return "720p"
	case 480:
		return "480p"
	case 360:
		return "360p"
	default:
		return strconv.Itoa(height) + "p"
	}
}
