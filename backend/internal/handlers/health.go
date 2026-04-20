package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// PingCheck handles the /ping health test route
func PingCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "UP",
		"message": "FlowCrystal Core Service is running smoothly",
	})
}
