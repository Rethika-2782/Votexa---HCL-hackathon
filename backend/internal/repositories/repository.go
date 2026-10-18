package repositories

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"votexa-backend/internal/database"
	"votexa-backend/internal/models"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrDuplicateEmail  = errors.New("email is already registered")
	ErrPollNotFound    = errors.New("poll not found")
	ErrPollLimitReached = errors.New("POLL_LIMIT_REACHED")
	ErrAlreadyVoted    = errors.New("ALREADY_VOTED")
)

type Repository struct {
	db *database.MongoDB
}

func NewRepository(db *database.MongoDB) *Repository {
	return &Repository{db: db}
}

// User operations
func (r *Repository) CreateUser(ctx context.Context, user *models.User) error {
	user.Email = strings.ToLower(strings.TrimSpace(user.Email))
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.PollCreationCount = 0
	if user.Plan == "" {
		user.Plan = models.PlanFree
	}
	if user.Role == "" {
		user.Role = "user"
	}

	res, err := r.db.Database.Collection("users").InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrDuplicateEmail
		}
		return err
	}
	user.ID = res.InsertedID.(bson.ObjectID)
	return nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	normEmail := strings.ToLower(strings.TrimSpace(email))
	var user models.User
	err := r.db.Database.Collection("users").FindOne(ctx, bson.M{"email": normEmail}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, id bson.ObjectID) (*models.User, error) {
	var user models.User
	err := r.db.Database.Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *Repository) UpdateUserPlan(ctx context.Context, userID bson.ObjectID, newPlan models.UserPlan) error {
	filter := bson.M{"_id": userID}
	update := bson.M{
		"$set": bson.M{
			"plan":      newPlan,
			"updatedAt": time.Now(),
		},
	}
	_, err := r.db.Database.Collection("users").UpdateOne(ctx, filter, update)
	return err
}

// Atomic poll creation with concurrency-safe limit enforcement
func (r *Repository) CreatePollWithLimitCheck(ctx context.Context, poll *models.Poll, freeLimit int) error {
	usersCol := r.db.Database.Collection("users")

	// Atomic conditional increment: Only increment if plan is premium OR pollCreationCount < freeLimit
	filter := bson.M{
		"_id": poll.OwnerID,
		"$or": []bson.M{
			{"plan": models.PlanPremium},
			{"pollCreationCount": bson.M{"$lt": freeLimit}},
		},
	}
	update := bson.M{
		"$inc": bson.M{"pollCreationCount": 1},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	result, err := usersCol.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return ErrPollLimitReached
	}

	// Insert poll into MongoDB
	poll.CreatedAt = time.Now()
	poll.UpdatedAt = time.Now()
	poll.TotalVotes = 0
	if poll.Status == "" {
		poll.Status = models.PollStatusActive
	}

	res, err := r.db.Database.Collection("polls").InsertOne(ctx, poll)
	if err != nil {
		// Roll back the user pollCreationCount if poll insertion failed
		_, _ = usersCol.UpdateOne(context.Background(), bson.M{"_id": poll.OwnerID}, bson.M{"$inc": bson.M{"pollCreationCount": -1}})
		return err
	}

	poll.ID = res.InsertedID.(bson.ObjectID)
	return nil
}

func (r *Repository) GetPollByCode(ctx context.Context, code string) (*models.Poll, error) {
	var poll models.Poll
	err := r.db.Database.Collection("polls").FindOne(ctx, bson.M{"code": code}).Decode(&poll)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPollNotFound
		}
		return nil, err
	}
	return &poll, nil
}

func (r *Repository) GetPollsByOwner(ctx context.Context, ownerID bson.ObjectID) ([]models.Poll, error) {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := r.db.Database.Collection("polls").Find(ctx, bson.M{"ownerId": ownerID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err := cursor.All(ctx, &polls); err != nil {
		return nil, err
	}
	if polls == nil {
		polls = []models.Poll{}
	}
	return polls, nil
}

func (r *Repository) UpdatePollStatus(ctx context.Context, pollCode string, ownerID bson.ObjectID, status models.PollStatus) error {
	filter := bson.M{"code": pollCode, "ownerId": ownerID}
	update := bson.M{
		"$set": bson.M{
			"status":    status,
			"updatedAt": time.Now(),
		},
	}
	res, err := r.db.Database.Collection("polls").UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrPollNotFound
	}
	return nil
}

func (r *Repository) DeletePoll(ctx context.Context, pollCode string, ownerID bson.ObjectID) error {
	filter := bson.M{"code": pollCode, "ownerId": ownerID}
	res, err := r.db.Database.Collection("polls").DeleteOne(ctx, filter)
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrPollNotFound
	}
	return nil
}

// Atomic vote recording with unique index check + counter increments
func (r *Repository) CastVote(ctx context.Context, vote *models.Vote) (*models.Poll, error) {
	// First check if poll is active
	poll, err := r.GetPollByCode(ctx, vote.PollCode)
	if err != nil {
		return nil, err
	}

	if poll.Status != models.PollStatusActive {
		return nil, errors.New("POLL_CLOSED")
	}

	if poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		return nil, errors.New("POLL_EXPIRED")
	}

	vote.PollID = poll.ID
	vote.CreatedAt = time.Now()

	// Insert into votes collection - unique index enforces no duplicate votes
	_, err = r.db.Database.Collection("votes").InsertOne(ctx, vote)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrAlreadyVoted
		}
		return nil, err
	}

	// Update option voteCount and poll totalVotes atomically
	filter := bson.M{"_id": poll.ID, "options.id": vote.OptionID}
	update := bson.M{
		"$inc": bson.M{
			"totalVotes": 1,
			"options.$.voteCount": 1,
		},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedPoll models.Poll
	err = r.db.Database.Collection("polls").FindOneAndUpdate(ctx, filter, update, opts).Decode(&updatedPoll)
	if err != nil {
		return nil, err
	}

	return &updatedPoll, nil
}

func (r *Repository) HasUserVoted(ctx context.Context, pollID bson.ObjectID, userID *bson.ObjectID, fingerprint string) (bool, string, error) {
	var orFilters []bson.M
	if userID != nil {
		orFilters = append(orFilters, bson.M{"voterUserId": userID})
	}
	if fingerprint != "" {
		orFilters = append(orFilters, bson.M{"voterFingerprint": fingerprint})
	}

	if len(orFilters) == 0 {
		return false, "", nil
	}

	filter := bson.M{
		"pollId": pollID,
		"$or":    orFilters,
	}

	var vote models.Vote
	err := r.db.Database.Collection("votes").FindOne(ctx, filter).Decode(&vote)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, "", nil
		}
		return false, "", err
	}

	return true, vote.OptionID, nil
}

func (r *Repository) GetVotesByPollCode(ctx context.Context, pollCode string) ([]models.VoteActivityItem, error) {
	poll, err := r.GetPollByCode(ctx, pollCode)
	if err != nil {
		return nil, err
	}

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(100)
	cursor, err := r.db.Database.Collection("votes").Find(ctx, bson.M{"pollCode": pollCode}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var votes []models.Vote
	if err := cursor.All(ctx, &votes); err != nil {
		return nil, err
	}

	optMap := make(map[string]string)
	for _, o := range poll.Options {
		optMap[o.ID] = o.Text
	}

	items := make([]models.VoteActivityItem, 0, len(votes))
	for _, v := range votes {
		name := v.VoterName
		if name == "" {
			name = "Audience Member"
		}
		items = append(items, models.VoteActivityItem{
			ID:         v.ID.Hex(),
			VoterName:  name,
			OptionID:   v.OptionID,
			OptionText: optMap[v.OptionID],
			CreatedAt:  v.CreatedAt,
		})
	}
	return items, nil
}
