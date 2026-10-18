package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"

	"votexa-backend/internal/repositories"
	"votexa-backend/internal/services"
)

func AuthMiddleware(authService *services.AuthService, repo *repositories.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization format must be Bearer <token>"})
			return
		}

		claims, err := authService.ParseToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		objID, err := bson.ObjectIDFromHex(claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			return
		}

		user, err := repo.GetUserByID(c.Request.Context(), objID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User account no longer exists"})
			return
		}

		c.Set("user", user)
		c.Set("userID", objID)
		c.Next()
	}
}

// OptionalAuth allows endpoints to check for an authenticated user without blocking unauthenticated requests
func OptionalAuthMiddleware(authService *services.AuthService, repo *repositories.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				if claims, err := authService.ParseToken(parts[1]); err == nil {
					if objID, err := bson.ObjectIDFromHex(claims.UserID); err == nil {
						if user, err := repo.GetUserByID(c.Request.Context(), objID); err == nil {
							c.Set("user", user)
							c.Set("userID", objID)
						}
					}
				}
			}
		}
		c.Next()
	}
}
