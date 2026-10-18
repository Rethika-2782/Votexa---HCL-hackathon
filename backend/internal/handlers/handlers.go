package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"


	"votexa-backend/internal/config"
	"votexa-backend/internal/models"
	"votexa-backend/internal/repositories"
	"votexa-backend/internal/services"
)

type Handler struct {
	authService *services.AuthService
	pollService *services.PollService
	repo        *repositories.Repository
	config      *config.Config
}

func NewHandler(authService *services.AuthService, pollService *services.PollService, repo *repositories.Repository, cfg *config.Config) *Handler {
	return &Handler{
		authService: authService,
		pollService: pollService,
		repo:        repo,
		config:      cfg,
	}
}

// Health Check
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "Votexa Real-Time Polling Engine",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC(),
	})
}

// Auth Handlers
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields. Password must be at least 8 characters."})
		return
	}

	user, token, err := h.authService.Register(c.Request.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		if strings.Contains(err.Error(), "already registered") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email is already registered"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Account created successfully",
		"token":   token,
		"user": gin.H{
			"id":                user.ID.Hex(),
			"name":              user.Name,
			"email":             user.Email,
			"plan":              user.Plan,
			"pollCreationCount": user.PollCreationCount,
		},
	})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide a valid email and password"})
		return
	}

	user, token, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user": gin.H{
			"id":                user.ID.Hex(),
			"name":              user.Name,
			"email":             user.Email,
			"plan":              user.Plan,
			"pollCreationCount": user.PollCreationCount,
		},
	})
}

func (h *Handler) GetMe(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	u := user.(*models.User)
	usage := h.pollService.GetUserUsage(c.Request.Context(), u)

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":                u.ID.Hex(),
			"name":              u.Name,
			"email":             u.Email,
			"plan":              u.Plan,
			"role":              u.Role,
			"pollCreationCount": u.PollCreationCount,
			"createdAt":         u.CreatedAt,
		},
		"usage": usage,
	})
}

// Plan & Usage Handlers
func (h *Handler) GetUsage(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	usage := h.pollService.GetUserUsage(c.Request.Context(), user)
	c.JSON(http.StatusOK, usage)
}

func (h *Handler) GetPlans(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"plans": []gin.H{
			{
				"id":          "free",
				"name":        "Free Starter",
				"price":       0,
				"interval":    "forever",
				"pollLimit":   h.config.FreePollLimit,
				"description": "Perfect for testing and small interactive sessions.",
				"features": []string{
					"Up to 10 shareable poll links",
					"Real-time live voting with WebSockets",
					"Interactive bar and distribution charts",
					"QR Code generation for easy mobile access",
					"Standard security and duplicate protection",
				},
				"isCurrent": false,
			},
			{
				"id":          "premium",
				"name":        "Pro Audience Intelligence",
				"price":       19,
				"interval":    "month (demo/sandbox tier)",
				"pollLimit":   h.config.PremiumPollLimit,
				"isUnlimited": h.config.PremiumUnlimited,
				"description": "For educators, keynote speakers, communities, and growing teams.",
				"features": []string{
					"Unlimited active polls and links",
					"Advanced audience analytics & export to CSV",
					"Custom branded poll themes & styling",
					"Priority real-time Redis distribution",
					"Audience engagement insight breakdown",
				},
				"popular":   true,
				"isCurrent": false,
			},
		},
	})
}

// Sandbox / Admin Plan Upgrade handler
type UpgradePlanRequest struct {
	Plan           string `json:"plan" binding:"required"`
	AdminSecretKey string `json:"adminSecretKey"`
}

func (h *Handler) UpgradePlan(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	var req UpgradePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan request"})
		return
	}

	targetPlan := models.UserPlan(req.Plan)
	if targetPlan != models.PlanFree && targetPlan != models.PlanPremium {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported plan type"})
		return
	}

	// Security requirement: Ensure upgrading to premium cannot be trivially bypassed
	// In development/sandbox mode or with administrative key:
	if targetPlan == models.PlanPremium {
		if req.AdminSecretKey != h.config.AdminSecretKey && h.config.AppEnv != "development" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid administrator or sandbox authorization key"})
			return
		}
	}

	if err := h.authService.UpgradeUserPlan(c.Request.Context(), user.ID, targetPlan); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update account plan"})
		return
	}

	user.Plan = targetPlan
	usage := h.pollService.GetUserUsage(c.Request.Context(), user)

	c.JSON(http.StatusOK, gin.H{
		"message": "Account plan updated successfully",
		"plan":    targetPlan,
		"usage":   usage,
	})
}

// Poll Creation & Management
type CreatePollRequest struct {
	Question    string              `json:"question" binding:"required"`
	Description string              `json:"description"`
	Options     []string            `json:"options" binding:"required"`
	Settings    models.PollSettings `json:"settings"`
}

func (h *Handler) CreatePoll(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	var req CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Question and at least 2 options are required"})
		return
	}

	poll, err := h.pollService.CreatePoll(c.Request.Context(), user, req.Question, req.Description, req.Options, req.Settings)
	if err != nil {
		if err == repositories.ErrPollLimitReached {
			usage := h.pollService.GetUserUsage(c.Request.Context(), user)
			c.JSON(http.StatusForbidden, gin.H{
				"error":          "POLL_LIMIT_REACHED",
				"message":        "You have reached the maximum limit of 10 polls for the Free tier. Upgrade to Premium for unlimited polling.",
				"currentUsage":   user.PollCreationCount,
				"limit":          h.config.FreePollLimit,
				"currentPlan":    user.Plan,
				"upgradeAction":  "/pricing",
				"usage":          usage,
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Poll created successfully",
		"poll":     poll,
		"shareUrl": fmt.Sprintf("%s/poll/%s", h.config.PublicAppURL, poll.Code),
	})
}

func (h *Handler) GetUserPolls(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	polls, err := h.pollService.GetUserPolls(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"polls": polls,
		"count": len(polls),
	})
}

func (h *Handler) GetPublicPoll(c *gin.Context) {
	code := c.Param("code")
	poll, err := h.pollService.GetPollByCode(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	var voterUser *models.User
	if u, exists := c.Get("user"); exists {
		voterUser = u.(*models.User)
	}

	ip := c.ClientIP()
	userAgent := c.Request.UserAgent()
	clientFP := c.GetHeader("X-Voter-Fingerprint")

	hasVoted, votedOptionID, _ := h.pollService.CheckUserVoted(c.Request.Context(), poll.ID, voterUser, ip, userAgent, clientFP)

	c.JSON(http.StatusOK, gin.H{
		"poll": gin.H{
			"id":          poll.ID.Hex(),
			"code":        poll.Code,
			"question":    poll.Question,
			"description": poll.Description,
			"ownerName":   poll.OwnerName,
			"options":     poll.Options,
			"totalVotes":  poll.TotalVotes,
			"status":      poll.Status,
			"settings":    poll.Settings,
			"createdAt":   poll.CreatedAt,
		},
		"hasVoted":      hasVoted,
		"votedOptionId": votedOptionID,
		"shareUrl":      fmt.Sprintf("%s/poll/%s", h.config.PublicAppURL, poll.Code),
	})
}

func (h *Handler) ClosePoll(c *gin.Context) {
	code := c.Param("code")
	user := c.MustGet("user").(*models.User)

	poll, err := h.pollService.ClosePoll(c.Request.Context(), code, user.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to close poll: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Poll closed successfully",
		"poll":    poll,
	})
}

func (h *Handler) DeletePoll(c *gin.Context) {
	code := c.Param("code")
	user := c.MustGet("user").(*models.User)

	err := h.pollService.DeletePoll(c.Request.Context(), code, user.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to delete poll: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Poll deleted successfully"})
}

// Voting Endpoint
type VoteRequest struct {
	OptionID          string `json:"optionId" binding:"required"`
	ClientFingerprint string `json:"clientFingerprint"`
	VoterName         string `json:"voterName"`
}

func (h *Handler) CastVote(c *gin.Context) {
	code := c.Param("code")
	var req VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Option ID is required"})
		return
	}

	var voterUser *models.User
	if u, exists := c.Get("user"); exists {
		voterUser = u.(*models.User)
	}

	ip := c.ClientIP()
	userAgent := c.Request.UserAgent()
	fp := req.ClientFingerprint
	if fp == "" {
		fp = c.GetHeader("X-Voter-Fingerprint")
	}

	updatedPoll, err := h.pollService.CastVote(c.Request.Context(), code, req.OptionID, voterUser, ip, userAgent, fp, req.VoterName)
	if err != nil {
		if err == repositories.ErrAlreadyVoted {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "ALREADY_VOTED",
				"message": "You have already cast your vote in this poll.",
			})
			return
		}
		if err.Error() == "POLL_CLOSED" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "POLL_CLOSED",
				"message": "This poll is closed and no longer accepting votes.",
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Your vote has been recorded successfully",
		"pollCode":      updatedPoll.Code,
		"totalVotes":    updatedPoll.TotalVotes,
		"options":       updatedPoll.Options,
		"votedOptionId": req.OptionID,
	})
}

func (h *Handler) GetPollVotes(c *gin.Context) {
	code := c.Param("code")
	votes, err := h.pollService.GetPollVotes(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to load voter activity: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pollCode": code,
		"votes":    votes,
		"count":    len(votes),
	})
}

// CSV Export for Premium Users
func (h *Handler) ExportPollCSV(c *gin.Context) {
	code := c.Param("code")
	user := c.MustGet("user").(*models.User)

	if user.Plan != models.PlanPremium {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "PREMIUM_REQUIRED",
			"message": "CSV export is an exclusive Votexa Premium analytics feature.",
		})
		return
	}

	poll, err := h.pollService.GetPollByCode(c.Request.Context(), code)
	if err != nil || poll.OwnerID != user.ID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found or unauthorized"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=votexa_poll_%s.csv", poll.Code))
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	_ = writer.Write([]string{"Poll Code", "Question", "Option ID", "Option Text", "Vote Count", "Vote Percentage"})

	for _, opt := range poll.Options {
		pct := 0.0
		if poll.TotalVotes > 0 {
			pct = (float64(opt.VoteCount) / float64(poll.TotalVotes)) * 100.0
		}
		// Prevent CSV injection by escaping starting special chars
		cleanQuestion := sanitizeCSV(poll.Question)
		cleanOption := sanitizeCSV(opt.Text)

		_ = writer.Write([]string{
			poll.Code,
			cleanQuestion,
			opt.ID,
			cleanOption,
			fmt.Sprintf("%d", opt.VoteCount),
			fmt.Sprintf("%.1f%%", pct),
		})
	}
	writer.Flush()
}

func sanitizeCSV(s string) string {
	if len(s) > 0 && (s[0] == '=' || s[0] == '+' || s[0] == '-' || s[0] == '@') {
		return "'" + s
	}
	return s
}
