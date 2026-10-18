package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type UserPlan string

const (
	PlanFree    UserPlan = "free"
	PlanPremium UserPlan = "premium"
)

type User struct {
	ID                bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name              string        `bson:"name" json:"name"`
	Email             string        `bson:"email" json:"email"`
	PasswordHash      string        `bson:"passwordHash" json:"-"`
	Plan              UserPlan      `bson:"plan" json:"plan"`
	PollCreationCount int           `bson:"pollCreationCount" json:"pollCreationCount"`
	Role              string        `bson:"role" json:"role"` // "user" or "admin"
	CreatedAt         time.Time     `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time     `bson:"updatedAt" json:"updatedAt"`
}

type PollOption struct {
	ID        string `bson:"id" json:"id"`
	Text      string `bson:"text" json:"text"`
	VoteCount int64  `bson:"voteCount" json:"voteCount"`
}

type PollStatus string

const (
	PollStatusActive PollStatus = "active"
	PollStatusClosed PollStatus = "closed"
)

type PollSettings struct {
	AnonymousVoting    bool   `bson:"anonymousVoting" json:"anonymousVoting"`
	RequireAuth        bool   `bson:"requireAuth" json:"requireAuth"`
	AllowMultipleVotes bool   `bson:"allowMultipleVotes" json:"allowMultipleVotes"`
	ShowResultsLive    bool   `bson:"showResultsLive" json:"showResultsLive"`
	Theme              string `bson:"theme" json:"theme"` // default, emerald, violet, amber, midnight
}

type Poll struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Code        string        `bson:"code" json:"code"` // Short shareable code e.g. "vx-a8f9c1"
	OwnerID     bson.ObjectID `bson:"ownerId" json:"ownerId"`
	OwnerName   string        `bson:"ownerName" json:"ownerName"`
	Question    string        `bson:"question" json:"question"`
	Description string        `bson:"description" json:"description"`
	Options     []PollOption  `bson:"options" json:"options"`
	TotalVotes  int64         `bson:"totalVotes" json:"totalVotes"`
	Status      PollStatus    `bson:"status" json:"status"`
	Settings    PollSettings  `bson:"settings" json:"settings"`
	ExpiresAt   *time.Time    `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"`
	CreatedAt   time.Time     `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time     `bson:"updatedAt" json:"updatedAt"`
}

type Vote struct {
	ID               bson.ObjectID  `bson:"_id,omitempty" json:"id"`
	PollID           bson.ObjectID  `bson:"pollId" json:"pollId"`
	PollCode         string         `bson:"pollCode" json:"pollCode"`
	OptionID         string         `bson:"optionId" json:"optionId"`
	VoterUserID      *bson.ObjectID `bson:"voterUserId,omitempty" json:"voterUserId,omitempty"`
	VoterName        string         `bson:"voterName,omitempty" json:"voterName,omitempty"`
	VoterFingerprint string         `bson:"voterFingerprint" json:"voterFingerprint"` // Salted hash of IP + User-Agent or client token
	VoterIP          string         `bson:"voterIp" json:"-"`
	CreatedAt        time.Time      `bson:"createdAt" json:"createdAt"`
}

type VoteActivityItem struct {
	ID         string    `json:"id"`
	VoterName  string    `json:"voterName"`
	OptionID   string    `json:"optionId"`
	OptionText string    `json:"optionText"`
	CreatedAt  time.Time `json:"createdAt"`
}

type PollResultsResponse struct {
	PollID       string       `json:"pollId"`
	Code         string       `json:"code"`
	Question     string       `json:"question"`
	Description  string       `json:"description"`
	Status       PollStatus   `json:"status"`
	TotalVotes   int64        `json:"totalVotes"`
	Options      []PollOption `json:"options"`
	UpdatedAt    time.Time    `json:"updatedAt"`
	UserVoted    bool         `json:"userVoted"`
	VotedOptionID string      `json:"votedOptionId,omitempty"`
}

type PlanUsageInfo struct {
	Plan              UserPlan `json:"plan"`
	PollCreationCount int      `json:"pollCreationCount"`
	MaxPolls          int      `json:"maxPolls"`
	RemainingPolls    int      `json:"remainingPolls"`
	IsUnlimited       bool     `json:"isUnlimited"`
	CanCreatePoll     bool     `json:"canCreatePoll"`
}
