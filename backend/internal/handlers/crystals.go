package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
	"regexp"
)

// GenerateSlug generates a random 8-character hex string for the crystal URL
func GenerateSlug() string {
	b := make([]byte, 4)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func CreateCrystal(c *gin.Context) {
	var input struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	crystal := models.Crystal{
		Slug:      GenerateSlug(),
		Title:     input.Title,
		Content:   input.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := db.DB.Create(&crystal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create crystal"})
		return
	}

	// Update link indices
	go updateCrystalLinks(crystal.ID, crystal.Content)

	c.JSON(http.StatusOK, crystal)
}

func ListCrystals(c *gin.Context) {
	var crystals []models.Crystal
	// Only fetch IDs, Slugs and Titles to keep the payload light
	if err := db.DB.Select("id, slug, title, updated_at").Order("updated_at desc").Find(&crystals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch crystals"})
		return
	}
	c.JSON(http.StatusOK, crystals)
}

func GetCrystal(c *gin.Context) {
	slug := c.Param("slug")
	var crystal models.Crystal
	if err := db.DB.Where("slug = ?", slug).First(&crystal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Crystal not found"})
		return
	}
	c.JSON(http.StatusOK, crystal)
}

func UpdateCrystal(c *gin.Context) {
	slug := c.Param("slug")
	var crystal models.Crystal
	if err := db.DB.Where("slug = ?", slug).First(&crystal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Crystal not found"})
		return
	}

	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	crystal.Title = input.Title
	crystal.Content = input.Content
	crystal.UpdatedAt = time.Now()

	if err := db.DB.Save(&crystal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save crystal"})
		return
	}

	// Update link indices
	go updateCrystalLinks(crystal.ID, crystal.Content)

	c.JSON(http.StatusOK, crystal)
}

func GetBacklinks(c *gin.Context) {
	slug := c.Param("slug")
	var target models.Crystal
	if err := db.DB.Where("slug = ?", slug).First(&target).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target crystal not found"})
		return
	}

	var crystals []models.Crystal
	// Query crystals that link to this one
	query := `
		SELECT c.id, c.slug, c.title, c.updated_at 
		FROM crystals c
		JOIN crystal_links cl ON c.id = cl.source_id
		WHERE cl.target_id = ?
	`
	if err := db.DB.Raw(query, target.ID).Scan(&crystals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch backlinks"})
		return
	}

	c.JSON(http.StatusOK, crystals)
}

// Internal helper to parse content and update links
func updateCrystalLinks(sourceID uint, content string) {
	// Pattern to find data-id="slug" in wiki-link spans
	re := regexp.MustCompile(`class="wiki-link"[^>]*data-id="([^"]+)"`)
	matches := re.FindAllStringSubmatch(content, -1)

	// Collect unique target slugs
	slugMap := make(map[string]bool)
	for _, match := range matches {
		if len(match) > 1 {
			slugMap[match[1]] = true
		}
	}

	// Clear existing links for this source
	db.DB.Where("source_id = ?", sourceID).Delete(&models.CrystalLink{})

	// Add new links
	for slug := range slugMap {
		var target models.Crystal
		if err := db.DB.Where("slug = ?", slug).First(&target).Error; err == nil {
			db.DB.Create(&models.CrystalLink{
				SourceID: sourceID,
				TargetID: target.ID,
			})
		}
	}
}
