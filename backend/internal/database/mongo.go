package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func ConnectMongoDB(uri, dbName string) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(clientOpts)
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	log.Printf("[MongoDB] Connected successfully to database '%s'", dbName)
	db := client.Database(dbName)

	mongoWrapper := &MongoDB{
		Client:   client,
		Database: db,
	}

	if err := mongoWrapper.EnsureIndexes(context.Background()); err != nil {
		log.Printf("[MongoDB] Warning: Error ensuring indexes: %v", err)
	}

	return mongoWrapper, nil
}

func (m *MongoDB) EnsureIndexes(ctx context.Context) error {
	usersCol := m.Database.Collection("users")
	_, err := usersCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("[MongoDB] Warning creating users email index: %v", err)
	}

	pollsCol := m.Database.Collection("polls")
	_, _ = pollsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "code", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	_, _ = pollsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "ownerId", Value: 1}, {Key: "createdAt", Value: -1}},
	})

	votesCol := m.Database.Collection("votes")
	_, _ = votesCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "pollId", Value: 1}, {Key: "voterUserId", Value: 1}},
		Options: options.Index().SetUnique(true).SetPartialFilterExpression(bson.D{
			{Key: "voterUserId", Value: bson.D{{Key: "$exists", Value: true}, {Key: "$ne", Value: nil}}},
		}),
	})
	_, _ = votesCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "pollId", Value: 1}, {Key: "voterFingerprint", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	log.Println("[MongoDB] Indexes ensured successfully")
	return nil
}
