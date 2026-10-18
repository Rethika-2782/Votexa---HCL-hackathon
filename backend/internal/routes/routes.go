package routes

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"votexa-backend/internal/config"
	"votexa-backend/internal/handlers"
	"votexa-backend/internal/middleware"
	"votexa-backend/internal/repositories"
	"votexa-backend/internal/services"
	wsHub "votexa-backend/internal/websocket"
)

func SetupRouter(
	cfg *config.Config,
	h *handlers.Handler,
	authService *services.AuthService,
	repo *repositories.Repository,
	hub *wsHub.Hub,
) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Safe CORS Configuration
	corsConfig := cors.Config{
		AllowOrigins:     []string{cfg.FrontendOrigin, "http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Voter-Fingerprint"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsConfig))

	// Health Check
	r.GET("/api/health", h.Health)

	// WebSocket endpoint for real-time live voting updates
	r.GET("/api/ws/polls/:code", wsHub.ServeWs(hub))

	api := r.Group("/api")
	{
		// Authentication Routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", h.Register)
			auth.POST("/login", h.Login)
			auth.GET("/me", middleware.AuthMiddleware(authService, repo), h.GetMe)
		}

		// Plans & Billing
		plans := api.Group("/plans")
		{
			plans.GET("", h.GetPlans)
			plans.POST("/upgrade", middleware.AuthMiddleware(authService, repo), h.UpgradePlan)
		}

		// Polls Group
		polls := api.Group("/polls")
		{
			// Public viewing & voting with optional authentication support
			polls.GET("/public/:code", middleware.OptionalAuthMiddleware(authService, repo), h.GetPublicPoll)
			polls.POST("/public/:code/vote", middleware.OptionalAuthMiddleware(authService, repo), h.CastVote)
			polls.GET("/public/:code/votes", h.GetPollVotes)

			// Authenticated Poll Management
			authPolls := polls.Group("")
			authPolls.Use(middleware.AuthMiddleware(authService, repo))
			{
				authPolls.POST("", h.CreatePoll)
				authPolls.GET("", h.GetUserPolls)
				authPolls.POST("/:code/close", h.ClosePoll)
				authPolls.DELETE("/:code", h.DeletePoll)
				authPolls.GET("/:code/export", h.ExportPollCSV)
			}
		}

		// Account Usage
		account := api.Group("/account")
		account.Use(middleware.AuthMiddleware(authService, repo))
		{
			account.GET("/usage", h.GetUsage)
		}
	}

	return r
}
