package ws

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgraderWS = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// ServeCommentsWS поднимает WebSocket для комнаты комментариев entityType + entityID.
// Клиент подключается к /ws/comments/movies/123 и получает broadcast при новых/удалённых комментариях.
func ServeCommentsWS(c *gin.Context) {
	entityType := c.Param("entityType")
	entityIDStr := c.Param("entityId")
	entityID, err := strconv.ParseUint(entityIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entityId"})
		return
	}

	conn, err := upgraderWS.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	if GlobalCommentsHub == nil {
		conn.Close()
		return
	}
	GlobalCommentsHub.Register(entityType, uint(entityID), conn)
}
