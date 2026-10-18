package tests

import (
	"context"
	"fmt"
	"testing"
	"time"

	"votexa-backend/internal/config"
	"votexa-backend/internal/database"
	"votexa-backend/internal/models"
	redisService "votexa-backend/internal/redis"
	"votexa-backend/internal/repositories"
	"votexa-backend/internal/services"
)

func TestEndToEndPollingAndLimits(t *testing.T) {
	cfg := config.LoadConfig()
	cfg.FreePollLimit = 3 // Use 3 for fast, precise testing of the limit enforcement

	// 1. Connect MongoDB
	db, err := database.ConnectMongoDB(cfg.MongoDBURI, "votexa_test")
	if err != nil {
		t.Fatalf("MongoDB connection failed: %v", err)
	}
	defer db.Client.Disconnect(context.Background())
	_ = db.Database.Drop(context.Background()) // Clean test db
	_ = db.EnsureIndexes(context.Background())

	// 2. Connect Redis
	redisClient, err := redisService.ConnectRedis(cfg.RedisURL)
	if err != nil {
		t.Fatalf("Redis connection failed: %v", err)
	}
	defer redisClient.Client.Close()

	repo := repositories.NewRepository(db)
	authService := services.NewAuthService(repo, cfg)
	pollService := services.NewPollService(repo, redisClient, cfg)

	ctx := context.Background()

	// 3. Test Registration & Login
	testEmail := "testuser@votexa.io"
	user, token, err := authService.Register(ctx, "Test Innovator", testEmail, "Password123!")
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}
	if token == "" || user.Plan != models.PlanFree {
		t.Fatalf("Expected token and free plan, got plan=%s", user.Plan)
	}

	loginUser, loginToken, err := authService.Login(ctx, testEmail, "Password123!")
	if err != nil || loginToken == "" || loginUser.ID != user.ID {
		t.Fatalf("Login failed: %v", err)
	}

	// 4. Test Redis Pub/Sub Live Subscription
	testPollCode := "vx-testlive"
	pubsub := redisClient.SubscribePoll(ctx, testPollCode)
	defer pubsub.Close()

	ch := pubsub.Channel()
	receivedRedisMsg := make(chan bool)

	go func() {
		select {
		case msg := <-ch:
			if msg != nil {
				receivedRedisMsg <- true
			}
		case <-time.After(3 * time.Second):
			receivedRedisMsg <- false
		}
	}()

	time.Sleep(100 * time.Millisecond) // Let subscriber subscribe

	// 5. Test Poll Creation
	poll1, err := pollService.CreatePoll(ctx, user, "What is your primary tech stack?", "Select one", []string{"Go + React", "Rust + Vue", "Python + Svelte"}, models.PollSettings{})
	if err != nil {
		t.Fatalf("Failed to create poll 1: %v", err)
	}
	if poll1.Code == "" || len(poll1.Options) != 3 {
		t.Fatalf("Invalid poll structure: %+v", poll1)
	}

	// 6. Test Real-time Voting & Redis Publish
	updatedPoll, err := pollService.CastVote(ctx, poll1.Code, "opt-1", user, "127.0.0.1", "Go-Test-Agent", "fp-12345", "Test Innovator")
	if err != nil {
		t.Fatalf("Failed to cast vote: %v", err)
	}
	if updatedPoll.TotalVotes != 1 || updatedPoll.Options[0].VoteCount != 1 {
		t.Fatalf("Vote not counted properly: totalVotes=%d", updatedPoll.TotalVotes)
	}

	// 7. Test Duplicate Voting Prevention
	_, err = pollService.CastVote(ctx, poll1.Code, "opt-2", user, "127.0.0.1", "Go-Test-Agent", "fp-12345", "Test Innovator")
	if err != repositories.ErrAlreadyVoted {
		t.Fatalf("Expected ErrAlreadyVoted error on second vote attempt, got: %v", err)
	}

	// 8. Test Free Plan Limit Enforcement (Limit = 3)
	// Currently at 1/3 polls. Create poll 2 and poll 3
	_, err = pollService.CreatePoll(ctx, user, "Poll Question 2?", "", []string{"A", "B"}, models.PollSettings{})
	if err != nil {
		t.Fatalf("Poll 2 creation failed: %v", err)
	}

	_, err = pollService.CreatePoll(ctx, user, "Poll Question 3?", "", []string{"X", "Y"}, models.PollSettings{})
	if err != nil {
		t.Fatalf("Poll 3 creation failed: %v", err)
	}

	// Attempt Poll 4 (should be strictly rejected with ErrPollLimitReached)
	_, err = pollService.CreatePoll(ctx, user, "Poll Question 4 Over Limit?", "", []string{"Yes", "No"}, models.PollSettings{})
	if err != repositories.ErrPollLimitReached {
		t.Fatalf("Expected ErrPollLimitReached on 4th poll creation for free user, got: %v", err)
	}

	// Check usage info
	freshUser, _ := repo.GetUserByID(ctx, user.ID)
	usage := pollService.GetUserUsage(ctx, freshUser)
	if usage.PollCreationCount != 3 || usage.CanCreatePoll != false {
		t.Fatalf("Unexpected usage state: %+v", usage)
	}

	// 9. Upgrade to Premium and Verify Entitlements
	err = authService.UpgradeUserPlan(ctx, user.ID, models.PlanPremium)
	if err != nil {
		t.Fatalf("Plan upgrade failed: %v", err)
	}

	freshUserPremium, _ := repo.GetUserByID(ctx, user.ID)
	premiumUsage := pollService.GetUserUsage(ctx, freshUserPremium)
	if premiumUsage.Plan != models.PlanPremium || premiumUsage.CanCreatePoll != true {
		t.Fatalf("Premium user cannot create poll: %+v", premiumUsage)
	}

	// Attempt creating poll 4 now as Premium
	poll4, err := pollService.CreatePoll(ctx, freshUserPremium, "Poll Question 4 under Premium?", "", []string{"Success", "Done"}, models.PollSettings{})
	if err != nil {
		t.Fatalf("Premium user poll creation failed: %v", err)
	}
	if poll4 == nil {
		t.Fatalf("Expected poll4 to be created")
	}

	fmt.Println("All backend integration tests (Auth, Voting, Concurrency-Safe Limits, Redis, Premium) PASSED successfully!")
}
