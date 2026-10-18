package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port                string
	AppEnv              string
	FrontendOrigin      string
	MongoDBURI          string
	MongoDBDatabase     string
	RedisURL            string
	JWTSecret           string
	JWTExpirationHours  int
	FreePollLimit       int
	PremiumPollLimit    int
	PremiumUnlimited    bool
	PublicAppURL        string
	AdminSecretKey      string
}

func LoadConfig() *Config {
	port := getEnv("PORT", "8080")
	appEnv := getEnv("APP_ENV", "development")
	frontendOrigin := getEnv("FRONTEND_ORIGIN", "http://localhost:5173")
	mongoURI := getEnv("MONGODB_URI", "mongodb://localhost:27017")
	mongoDB := getEnv("MONGODB_DATABASE", "votexa")
	redisURL := getEnv("REDIS_URL", "redis://localhost:6379/0")
	jwtSecret := getEnv("JWT_SECRET", "votexa-super-secret-jwt-key-2026-production-grade")
	publicAppURL := getEnv("PUBLIC_APP_URL", "http://localhost:5173")
	adminSecretKey := getEnv("ADMIN_SECRET_KEY", "votexa-admin-secret-provision-2026")

	jwtExpHours, _ := strconv.Atoi(getEnv("JWT_EXPIRATION", "72"))
	if jwtExpHours <= 0 {
		jwtExpHours = 72
	}

	freeLimit, _ := strconv.Atoi(getEnv("FREE_POLL_LIMIT", "10"))
	if freeLimit <= 0 {
		freeLimit = 10
	}

	premiumLimit, _ := strconv.Atoi(getEnv("PREMIUM_POLL_LIMIT", "1000"))
	premiumUnlimited := getEnv("PREMIUM_UNLIMITED_POLLS", "true") == "true"

	return &Config{
		Port:               port,
		AppEnv:             appEnv,
		FrontendOrigin:     frontendOrigin,
		MongoDBURI:         mongoURI,
		MongoDBDatabase:    mongoDB,
		RedisURL:           redisURL,
		JWTSecret:          jwtSecret,
		JWTExpirationHours: jwtExpHours,
		FreePollLimit:      freeLimit,
		PremiumPollLimit:   premiumLimit,
		PremiumUnlimited:   premiumUnlimited,
		PublicAppURL:       publicAppURL,
		AdminSecretKey:     adminSecretKey,
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
