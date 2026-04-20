package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
)

type MemoryRecallRequest struct {
	Content string `json:"content" binding:"required"`
	Limit   int    `json:"limit"`
}

type MemoryUpdateRequest struct {
	Importance int `json:"importance" binding:"required"`
}

type MemoryListItem struct {
	models.Memory
	SourceSlug  string `json:"sourceSlug"`
	SourceTitle string `json:"sourceTitle"`
}

type memoryListQueryRow struct {
	models.Memory
	SourceSlug  *string `json:"sourceSlug"`
	SourceTitle *string `json:"sourceTitle"`
}

func RecallMemoriesHandler(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	var req MemoryRecallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content is required"})
		return
	}

	matches, err := RecallMemories(currentUser.ID, req.Content, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to recall memories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": matches,
		"count": len(matches),
	})
}

func ListMemoriesHandler(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	search := strings.TrimSpace(c.Query("q"))
	category := strings.TrimSpace(c.Query("category"))
	limit := 100
	if rawLimit := strings.TrimSpace(c.Query("limit")); rawLimit != "" {
		if parsed, err := strconv.Atoi(rawLimit); err == nil && parsed > 0 && parsed <= 300 {
			limit = parsed
		}
	}

	query := db.DB.Table("memories AS m").
		Select("m.*, c.slug AS source_slug, c.title AS source_title").
		Joins("LEFT JOIN crystals c ON c.id = m.source_id").
		Where("m.author_id = ?", currentUser.ID)

	if category != "" && category != "all" {
		query = query.Where("m.category = ?", category)
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("(m.content LIKE ? OR m.entity LIKE ? OR c.title LIKE ?)", like, like, like)
	}

	var rows []memoryListQueryRow
	if err := query.Order("m.importance desc, m.updated_at desc").Limit(limit).Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch memories"})
		return
	}

	items := make([]MemoryListItem, 0, len(rows))
	for _, row := range rows {
		item := MemoryListItem{Memory: row.Memory}
		if row.SourceSlug != nil {
			item.SourceSlug = *row.SourceSlug
		}
		if row.SourceTitle != nil {
			item.SourceTitle = *row.SourceTitle
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"count": len(items),
	})
}

func UpdateMemoryHandler(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	memoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil || memoryID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid memory id"})
		return
	}

	var memory models.Memory
	if err := db.DB.Where("id = ? AND author_id = ?", memoryID, currentUser.ID).First(&memory).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Memory not found"})
		return
	}

	var req MemoryUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "importance is required"})
		return
	}

	if req.Importance < 1 {
		req.Importance = 1
	}
	if req.Importance > 5 {
		req.Importance = 5
	}

	memory.Importance = req.Importance
	if err := db.DB.Save(&memory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update memory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"item": memory,
	})
}

func DeleteMemoryHandler(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	memoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil || memoryID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid memory id"})
		return
	}

	result := db.DB.Where("id = ? AND author_id = ?", memoryID, currentUser.ID).Delete(&models.Memory{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete memory"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Memory not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deleted": true,
		"id":      memoryID,
	})
}
