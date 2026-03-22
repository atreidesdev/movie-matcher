package ws

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type CommentMessage struct {
	Type      string          `json:"type"` // "new" | "deleted"
	EntityType string         `json:"entityType"`
	EntityID  uint            `json:"entityId"`
	Payload   json.RawMessage `json:"payload"`
}

type client struct {
	conn     *websocket.Conn
	send     chan []byte
	entityKey string
}

type CommentsHub struct {
	mu      sync.RWMutex
	clients map[string]map[*client]struct{} // entityKey -> set of clients
}

var GlobalCommentsHub *CommentsHub

func init() {
	GlobalCommentsHub = NewCommentsHub()
}

func NewCommentsHub() *CommentsHub {
	return &CommentsHub{
		clients: make(map[string]map[*client]struct{}),
	}
}

func (h *CommentsHub) entityKey(entityType string, entityID uint) string {
	return entityType + ":" + strconv.FormatUint(uint64(entityID), 10)
}

func (h *CommentsHub) Register(entityType string, entityID uint, conn *websocket.Conn) {
	key := h.entityKey(entityType, entityID)
	c := &client{
		conn:      conn,
		send:      make(chan []byte, 256),
		entityKey: key,
	}

	h.mu.Lock()
	if h.clients[key] == nil {
		h.clients[key] = make(map[*client]struct{})
	}
	h.clients[key][c] = struct{}{}
	h.mu.Unlock()

	go c.writePump()
	c.readPump(h)
}

func (h *CommentsHub) Unregister(c *client) {
	h.mu.Lock()
	if m, ok := h.clients[c.entityKey]; ok {
		delete(m, c)
		if len(m) == 0 {
			delete(h.clients, c.entityKey)
		}
	}
	h.mu.Unlock()
	close(c.send)
}

func (h *CommentsHub) Broadcast(entityType string, entityID uint, msg CommentMessage) {
	key := h.entityKey(entityType, entityID)
	raw, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.mu.RLock()
	clients := h.clients[key]
	if clients == nil {
		h.mu.RUnlock()
		return
	}
	snapshot := make([]*client, 0, len(clients))
	for c := range clients {
		snapshot = append(snapshot, c)
	}
	h.mu.RUnlock()

	for _, c := range snapshot {
		select {
		case c.send <- raw:
		default:
			// буфер полон — закрываем соединение
			h.mu.Lock()
			delete(h.clients[key], c)
			if len(h.clients[key]) == 0 {
				delete(h.clients, key)
			}
			h.mu.Unlock()
			close(c.send)
		}
	}
}

func (c *client) readPump(h *CommentsHub) {
	defer func() {
		h.Unregister(c)
		c.conn.Close()
	}()
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		// клиент может присылать ping — пока просто игнорируем
	}
}

func (c *client) writePump() {
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
	c.conn.Close()
}
