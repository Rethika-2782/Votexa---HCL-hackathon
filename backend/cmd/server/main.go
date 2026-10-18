package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"votexa-backend/internal/config"
	"votexa-backend/internal/database"
	"votexa-backend/internal/handlers"
	redisService "votexa-backend/internal/redis"
	"votexa-backend/internal/repositories"
	"votexa-backend/internal/routes"
	"votexa-backend/internal/services"
	wsHub "votexa-backend/internal/websocket"
)

func main() {
	cfg := config.LoadConfig()
	log.Printf("[Votexa] Booting server in %s mode on port %s...", cfg.AppEnv, cfg.Port)

	// Connect to MongoDB
	db, err := database.ConnectMongoDB(cfg.MongoDBURI, cfg.MongoDBDatabase)
	if err != nil {
		log.Fatalf("[MongoDB] Fatal connection error: %v", err)
	}

	// Connect to Redis
	redisClient, err := redisService.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Fatalf("[Redis] Fatal connection error: %v", err)
	}

	// Initialize WebSocket Hub
	hub := wsHub.NewHub(redisClient)
	go hub.Run()

	// Initialize Repositories and Services
	repo := repositories.NewRepository(db)
	authService := services.NewAuthService(repo, cfg)
	pollService := services.NewPollService(repo, redisClient, cfg)

	// Initialize Handlers and Routes
	handler := handlers.NewHandler(authService, pollService, repo, cfg)
	router := routes.SetupRouter(cfg, handler, authService, repo, hub)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	go func() {
		log.Printf("[Votexa API] Server listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Votexa API] Listen error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[Votexa API] Shutting down server gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[Votexa API] Server forced to shutdown: %v", err)
	}

	log.Println("[Votexa API] Server exited cleanly.")
}
