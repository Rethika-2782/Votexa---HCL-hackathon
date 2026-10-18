package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"

	"votexa-backend/internal/config"
	"votexa-backend/internal/models"
	redisService "votexa-backend/internal/redis"
	"votexa-backend/internal/repositories"
)

type AuthService struct {
	repo   *repositories.Repository
	config *config.Config
}

func NewAuthService(repo *repositories.Repository, cfg *config.Config) *AuthService {
	return &AuthService{repo: repo, config: cfg}
}

type JWTClaims struct {
	UserID string          `json:"userId"`
	Email  string          `json:"email"`
	Plan   models.UserPlan `json:"plan"`
	Role   string          `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) Register(ctx context.Context, name, email, password string) (*models.User, string, error) {
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))

	if len(name) < 2 {
		return nil, "", errors.New("name must be at least 2 characters")
	}
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return nil, "", errors.New("invalid email address format")
	}
	if len(password) < 8 {
		return nil, "", errors.New("password must be at least 8 characters")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	user := &models.User{
		Name:         name,
		Email:        email,
		PasswordHash: string(hash),
		Plan:         models.PlanFree,
		Role:         "user",
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, "", err
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*models.User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid email or password")
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	expTime := time.Now().Add(time.Duration(s.config.JWTExpirationHours) * time.Hour)
	claims := &JWTClaims{
		UserID: user.ID.Hex(),
		Email:  user.Email,
		Plan:   user.Plan,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "votexa",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

func (s *AuthService) ParseToken(tokenStr string) (*JWTClaims, error) {
	claims := &JWTClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.config.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired authentication token")
	}

	return claims, nil
}

type PollService struct {
	repo   *repositories.Repository
	redis  *redisService.RedisService
	config *config.Config
}

func NewPollService(repo *repositories.Repository, redis *redisService.RedisService, cfg *config.Config) *PollService {
	return &PollService{repo: repo, redis: redis, config: cfg}
}

func generatePollCode() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return "vx-" + hex.EncodeToString(b)
}

func (s *PollService) CreatePoll(ctx context.Context, owner *models.User, question, description string, optionTexts []string, settings models.PollSettings) (*models.Poll, error) {
	question = strings.TrimSpace(question)
	if len(question) < 4 {
		return nil, errors.New("question must be at least 4 characters")
	}

	var options []models.PollOption
	seen := make(map[string]bool)
	for i, text := range optionTexts {
		trimmed := strings.TrimSpace(text)
		if trimmed == "" {
			continue
		}
		lower := strings.ToLower(trimmed)
		if seen[lower] {
			return nil, fmt.Errorf("duplicate option text '%s' is not allowed", trimmed)
		}
		seen[lower] = true
		options = append(options, models.PollOption{
			ID:        fmt.Sprintf("opt-%d", i+1),
			Text:      trimmed,
			VoteCount: 0,
		})
	}

	if len(options) < 2 {
		return nil, errors.New("a poll requires at least 2 distinct answer options")
	}

	poll := &models.Poll{
		Code:        generatePollCode(),
		OwnerID:     owner.ID,
		OwnerName:   owner.Name,
		Question:    question,
		Description: strings.TrimSpace(description),
		Options:     options,
		Settings:    settings,
		Status:      models.PollStatusActive,
	}

	err := s.repo.CreatePollWithLimitCheck(ctx, poll, s.config.FreePollLimit)
	if err != nil {
		return nil, err
	}

	return poll, nil
}

func (s *PollService) GetUserPolls(ctx context.Context, ownerID bson.ObjectID) ([]models.Poll, error) {
	return s.repo.GetPollsByOwner(ctx, ownerID)
}

func (s *PollService) GetPollByCode(ctx context.Context, code string) (*models.Poll, error) {
	return s.repo.GetPollByCode(ctx, code)
}

func (s *PollService) ClosePoll(ctx context.Context, code string, ownerID bson.ObjectID) (*models.Poll, error) {
	err := s.repo.UpdatePollStatus(ctx, code, ownerID, models.PollStatusClosed)
	if err != nil {
		return nil, err
	}

	poll, err := s.repo.GetPollByCode(ctx, code)
	if err == nil {
		optionVotes := make(map[string]int64)
		for _, opt := range poll.Options {
			optionVotes[opt.ID] = opt.VoteCount
		}
		_ = s.redis.PublishPollUpdate(ctx, &redisService.PollUpdateMessage{
			Type:        "POLL_CLOSED",
			PollCode:    poll.Code,
			PollID:      poll.ID.Hex(),
			TotalVotes:  poll.TotalVotes,
			OptionVotes: optionVotes,
			Timestamp:   time.Now(),
		})
	}

	return poll, err
}

func (s *PollService) DeletePoll(ctx context.Context, code string, ownerID bson.ObjectID) error {
	return s.repo.DeletePoll(ctx, code, ownerID)
}

func (s *PollService) CastVote(ctx context.Context, pollCode, optionID string, voterUser *models.User, ip, userAgent, clientFingerprint, voterName string) (*models.Poll, error) {
	rawFP := fmt.Sprintf("%s|%s|%s", ip, userAgent, clientFingerprint)
	h := sha256.Sum256([]byte(rawFP))
	fingerprint := hex.EncodeToString(h[:])

	var voterUserID *bson.ObjectID
	if voterUser != nil {
		voterUserID = &voterUser.ID
		if voterName == "" {
			voterName = voterUser.Name
		}
	}
	if strings.TrimSpace(voterName) == "" {
		voterName = "Audience Member"
	}

	vote := &models.Vote{
		PollCode:         pollCode,
		OptionID:         optionID,
		VoterUserID:      voterUserID,
		VoterName:        strings.TrimSpace(voterName),
		VoterFingerprint: fingerprint,
		VoterIP:          ip,
	}

	updatedPoll, err := s.repo.CastVote(ctx, vote)
	if err != nil {
		return nil, err
	}

	// Publish update to Redis Pub/Sub
	optionVotes := make(map[string]int64)
	optionText := ""
	for _, opt := range updatedPoll.Options {
		optionVotes[opt.ID] = opt.VoteCount
		if opt.ID == optionID {
			optionText = opt.Text
		}
	}

	updateMsg := &redisService.PollUpdateMessage{
		Type:        "NEW_VOTE",
		PollCode:    updatedPoll.Code,
		PollID:      updatedPoll.ID.Hex(),
		TotalVotes:  updatedPoll.TotalVotes,
		OptionID:    optionID,
		OptionVotes: optionVotes,
		VoterName:   vote.VoterName,
		OptionText:  optionText,
		Timestamp:   time.Now(),
	}

	if err := s.redis.PublishPollUpdate(ctx, updateMsg); err != nil {
		// Log error but don't fail vote since MongoDB write succeeded
		fmt.Printf("[Redis] Warning: Failed to publish poll update: %v\n", err)
	}

	return updatedPoll, nil
}

func (s *PollService) GetPollVotes(ctx context.Context, code string) ([]models.VoteActivityItem, error) {
	return s.repo.GetVotesByPollCode(ctx, code)
}

func (s *PollService) CheckUserVoted(ctx context.Context, pollID bson.ObjectID, voterUser *models.User, ip, userAgent, clientFingerprint string) (bool, string, error) {
	rawFP := fmt.Sprintf("%s|%s|%s", ip, userAgent, clientFingerprint)
	h := sha256.Sum256([]byte(rawFP))
	fingerprint := hex.EncodeToString(h[:])

	var voterUserID *bson.ObjectID
	if voterUser != nil {
		voterUserID = &voterUser.ID
	}

	return s.repo.HasUserVoted(ctx, pollID, voterUserID, fingerprint)
}

func (s *PollService) GetUserUsage(ctx context.Context, user *models.User) *models.PlanUsageInfo {
	maxPolls := s.config.FreePollLimit
	isUnlimited := false
	if user.Plan == models.PlanPremium {
		maxPolls = s.config.PremiumPollLimit
		isUnlimited = s.config.PremiumUnlimited
	}

	remaining := maxPolls - user.PollCreationCount
	if isUnlimited {
		remaining = 999999
	} else if remaining < 0 {
		remaining = 0
	}

	canCreate := isUnlimited || (user.PollCreationCount < maxPolls)

	return &models.PlanUsageInfo{
		Plan:              user.Plan,
		PollCreationCount: user.PollCreationCount,
		MaxPolls:          maxPolls,
		RemainingPolls:    remaining,
		IsUnlimited:       isUnlimited,
		CanCreatePoll:     canCreate,
	}
}

func (s *AuthService) UpgradeUserPlan(ctx context.Context, userID bson.ObjectID, plan models.UserPlan) error {
	return s.repo.UpdateUserPlan(ctx, userID, plan)
}
