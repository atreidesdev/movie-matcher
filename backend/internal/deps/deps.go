package deps

import (
	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/config"
	"github.com/movie-matcher/backend/internal/database"
	"github.com/movie-matcher/backend/internal/queue"
	"gorm.io/gorm"
)

// Deps хранит зависимости для хендлеров (БД, конфиг, очередь).
// В тестах можно подставить моки через middleware или передачу в контекст.
type Deps struct {
	DB     *gorm.DB
	Config *config.Config
	Queue  *queue.RequestQueue
}

func Default() *Deps {
	return &Deps{
		DB:     database.DB,
		Config: config.Current,
		Queue:  queue.Default,
	}
}

const ContextKey = "deps"

// Если нет в контексте — возвращает Default() (для обратной совместимости).
func Get(c *gin.Context) *Deps {
	if v, ok := c.Get(ContextKey); ok {
		if d, ok := v.(*Deps); ok && d != nil {
			return d
		}
	}
	return Default()
}

// Если Deps не установлен (middleware не использован), возвращается database.DB.
func GetDB(c *gin.Context) *gorm.DB {
	return Get(c).DB
}

// Если Deps не установлен — config.Current.
func GetConfig(c *gin.Context) *config.Config {
	d := Get(c)
	if d != nil && d.Config != nil {
		return d.Config
	}
	return config.Current
}

// Если Deps не установлен — queue.Default.
func GetQueue(c *gin.Context) *queue.RequestQueue {
	d := Get(c)
	if d != nil && d.Queue != nil {
		return d.Queue
	}
	return queue.Default
}
