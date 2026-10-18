package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type RedisService struct {
	Client *goredis.Client
}

type PollUpdateMessage struct {
	Type        string           `json:"type"` // "POLL_UPDATED", "NEW_VOTE", "POLL_CLOSED"
	PollCode    string           `json:"pollCode"`
	PollID      string           `json:"pollId"`
	TotalVotes  int64            `json:"totalVotes"`
	OptionID    string           `json:"optionId,omitempty"`
	OptionVotes map[string]int64 `json:"optionVotes"`
	VoterName   string           `json:"voterName,omitempty"`
	OptionText  string           `json:"optionText,omitempty"`
	Timestamp   time.Time        `json:"timestamp"`
}

func ConnectRedis(redisURL string) (*RedisService, error) {
	opts, err := goredis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis url: %w", err)
	}

	client := goredis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping redis: %w", err)
	}

	log.Println("[Redis] Connected successfully to Redis server")
	return &RedisService{Client: client}, nil
}

func (r *RedisService) PublishPollUpdate(ctx context.Context, msg *PollUpdateMessage) error {
	channel := fmt.Sprintf("poll:%s", msg.PollCode)
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	return r.Client.Publish(ctx, channel, data).Err()
}

func (r *RedisService) SubscribePoll(ctx context.Context, pollCode string) *goredis.PubSub {
	channel := fmt.Sprintf("poll:%s", pollCode)
	return r.Client.Subscribe(ctx, channel)
}
