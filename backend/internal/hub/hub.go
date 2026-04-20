package hub

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
)

type Hub struct {
	mu         sync.RWMutex
	clients    map[*Client]bool
	broadcast  chan models.Message
	register   chan *Client
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan models.Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// Register user in DB
			var user models.User
			res := db.DB.FirstOrCreate(&user, models.User{Username: client.Username})
			if res.Error == nil {
				user.IsOnline = true
				db.DB.Save(&user)
			}

			h.mu.Lock()
			h.clients[client] = true
			count := len(h.clients)
			h.mu.Unlock()

			log.Printf("[Hub] Client joined: %s (total: %d)", client.Username, count)

			joinMsg := models.Message{
				Type:    "join",
				Sender:  "system",
				Channel: "",
				Text:    client.Username + " joined FlowCrystal",
				Time:    time.Now().Format("15:04:05"),
			}
			db.DB.Create(&joinMsg)
			h.broadcast <- joinMsg

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			count := len(h.clients)
			h.mu.Unlock()

			// Update DB status
			var user models.User
			if err := db.DB.Where("username = ?", client.Username).First(&user).Error; err == nil {
				user.IsOnline = false
				db.DB.Save(&user)
			}

			log.Printf("[Hub] Client left: %s (total: %d)", client.Username, count)

			leaveMsg := models.Message{
				Type:    "leave",
				Sender:  "system",
				Channel: "",
				Text:    client.Username + " left FlowCrystal",
				Time:    time.Now().Format("15:04:05"),
			}
			db.DB.Create(&leaveMsg)
			h.broadcast <- leaveMsg

		case msg := <-h.broadcast:
			// Encode once to send to sockets
			data, _ := json.Marshal(msg)

			h.mu.RLock()
			for client := range h.clients {
				// SECURITY ROUTING (Iteration 2)
				// If it's a direct message (dm-username), ONLY send to sender and receiver
				if strings.HasPrefix(msg.Channel, "dm-") {
					targetUser := strings.TrimPrefix(msg.Channel, "dm-")
					if client.Username != msg.Sender && client.Username != targetUser {
						continue // skip this client, they are not part of the DM
					}
				}

				select {
				case client.Send <- data:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Register(c *Client) {
	h.register <- c
}

func (h *Hub) Unregister(c *Client) {
	h.unregister <- c
}

// Broadcast accepts a message struct instead of raw bytes
func (h *Hub) Broadcast(msg models.Message) {
	h.broadcast <- msg
}

func (h *Hub) OnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]string, 0, len(h.clients))
	for c := range h.clients {
		users = append(users, c.Username)
	}
	return users
}
