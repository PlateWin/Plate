package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
)

// AuthMiddleware extracts the user from X-User-Name header and fetches/creates the user record
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.GetHeader("X-User-Name")

		if username == "" {
			// Backwards compatibility or default user for development
			// For now, let's just use 'anonymous' if header is missing
			username = "anonymous"
		}

		var user models.User
		// Find or create the user record
		err := db.DB.Where("username = ?", username).FirstOrCreate(&user, models.User{Username: username}).Error
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to identify user"})
			return
		}

		// Store user object in context
		c.Set("user", user)
		c.Next()
	}
}
