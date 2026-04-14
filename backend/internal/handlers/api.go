package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
)

// HistoryHandler returns historical messages for a given channel
func HistoryHandler(c *gin.Context) {
	channel := c.Query("channel")
	if channel == "" {
		channel = "general"
	}

	// For Phase 1 we just return the last 100 messages of the channel
	var messages []models.Message
	err := db.DB.Where("channel = ?", channel).
		Order("created_at asc").
		Limit(100).
		Find(&messages).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"channel":  channel,
		"messages": messages,
	})
}
