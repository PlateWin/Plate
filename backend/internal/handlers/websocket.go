package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/teamwork/plate-server/internal/hub"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// reference to the global hub, set from main
var AppHub *hub.Hub

// WSHandler upgrades HTTP to WebSocket and registers the client with the Hub
func WSHandler(c *gin.Context) {
	username := c.Query("username")
	if username == "" {
		username = "Anonymous"
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WS] Upgrade failed: %v", err)
		return
	}

	client := &hub.Client{
		Hub:      AppHub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Username: username,
	}

	AppHub.Register(client)

	go client.WritePump()
	go client.ReadPump()
}

// OnlineHandler returns the list of currently online users
func OnlineHandler(c *gin.Context) {
	users := AppHub.OnlineUsers()
	c.JSON(http.StatusOK, gin.H{
		"online": users,
		"count":  len(users),
	})
}

// ChannelsHandler returns available channels (static for Phase 1)
func ChannelsHandler(c *gin.Context) {
	channels := []map[string]string{
		{"id": "general", "name": "general", "desc": "General discussion"},
		{"id": "dev-core", "name": "dev-core", "desc": "Core development"},
		{"id": "design", "name": "design", "desc": "Design & UX"},
		{"id": "ai-brain", "name": "ai-brain", "desc": "AI & knowledge"},
	}
	c.JSON(http.StatusOK, gin.H{"channels": channels})
}
