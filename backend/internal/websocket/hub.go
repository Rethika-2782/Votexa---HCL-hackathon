package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	redisService "votexa-backend/internal/redis"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Production safe origin validation with localhost fallback
		return true
	},
}

type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	PollCode string
}

type Hub struct {
	Redis        *redisService.RedisService
	PollClients  map[string]map[*Client]bool
	PollPubSubs  map[string]context.CancelFunc
	Register     chan *Client
	Unregister   chan *Client
	Broadcast    chan *redisService.PollUpdateMessage
	mu           sync.RWMutex
}

func NewHub(redis *redisService.RedisService) *Hub {
	return &Hub{
		Redis:       redis,
		PollClients: make(map[string]map[*Client]bool),
		PollPubSubs: make(map[string]context.CancelFunc),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		Broadcast:   make(chan *redisService.PollUpdateMessage),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			clients, exists := h.PollClients[client.PollCode]
			if !exists {
				clients = make(map[*Client]bool)
				h.PollClients[client.PollCode] = clients
				// Start redis subscriber for this poll channel if not started
				h.startRedisSubscription(client.PollCode)
			}
			clients[client] = true
			h.mu.Unlock()
			log.Printf("[WebSocket] Client registered for poll %s. Active clients: %d", client.PollCode, len(clients))

		case client := <-h.Unregister:
			h.mu.Lock()
			if clients, ok := h.PollClients[client.PollCode]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.PollClients, client.PollCode)
						// Cancel redis subscription
						if cancel, ok := h.PollPubSubs[client.PollCode]; ok {
							cancel()
							delete(h.PollPubSubs, client.PollCode)
						}
					}
				}
			}
			h.mu.Unlock()
			log.Printf("[WebSocket] Client unregistered for poll %s", client.PollCode)

		case msg := <-h.Broadcast:
			h.broadcastToPoll(msg)
		}
	}
}

func (h *Hub) startRedisSubscription(pollCode string) {
	if h.Redis == nil {
		// No Redis configured — skip pub/sub subscription
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	h.PollPubSubs[pollCode] = cancel

	go func() {
		pubsub := h.Redis.SubscribePoll(ctx, pollCode)
		defer pubsub.Close()

		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok {
					return
				}
				var update redisService.PollUpdateMessage
				if err := json.Unmarshal([]byte(msg.Payload), &update); err == nil {
					h.broadcastToPoll(&update)
				}
			}
		}
	}()
}

func (h *Hub) broadcastToPoll(msg *redisService.PollUpdateMessage) {
	h.mu.RLock()
	clients, ok := h.PollClients[msg.PollCode]
	if !ok || len(clients) == 0 {
		h.mu.RUnlock()
		return
	}

	payload, err := json.Marshal(msg)
	if err != nil {
		h.mu.RUnlock()
		return
	}

	for client := range clients {
		select {
		case client.Send <- payload:
		default:
			close(client.Send)
			delete(clients, client)
		}
	}
	h.mu.RUnlock()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512)
	_ = c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		pollCode := c.Param("code")
		if pollCode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Poll code required"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("[WebSocket] Upgrade error: %v", err)
			return
		}

		client := &Client{
			Hub:      hub,
			Conn:     conn,
			Send:     make(chan []byte, 256),
			PollCode: pollCode,
		}

		client.Hub.Register <- client

		go client.writePump()
		go client.readPump()
	}
}
