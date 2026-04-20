package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
	"gorm.io/gorm"
)

// GenerateSlug generates a random 8-character hex string for the crystal URL
func GenerateSlug() string {
	b := make([]byte, 4)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// GetCurrentUser safely extracts the user from gin context
func GetCurrentUser(c *gin.Context) (models.User, bool) {
	userObj, exists := c.Get("user")
	if !exists {
		return models.User{}, false
	}
	user, ok := userObj.(models.User)
	return user, ok
}

func CreateCrystal(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

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
		AuthorID:  currentUser.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := db.DB.Create(&crystal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create crystal"})
		return
	}

	go updateCrystalLinks(crystal.ID, crystal.Content)
	go ExtractMemories(currentUser.ID, crystal.ID, crystal.Content)

	c.JSON(http.StatusOK, crystal)
}

func ListCrystals(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	var crystals []models.Crystal
	if err := db.DB.Where("author_id = ?", currentUser.ID).Select("id, slug, title, updated_at").Order("updated_at desc").Find(&crystals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch crystals"})
		return
	}
	log.Printf("[DB] Crystal list fetched for user %d: %d items", currentUser.ID, len(crystals))
	c.JSON(http.StatusOK, crystals)
}

func GetCrystal(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	slug := c.Param("slug")
	var crystal models.Crystal
	if err := db.DB.Where("slug = ? AND author_id = ?", slug, currentUser.ID).First(&crystal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Crystal not found or access denied"})
		return
	}
	c.JSON(http.StatusOK, crystal)
}

func UpdateCrystal(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	slug := c.Param("slug")
	var crystal models.Crystal
	if err := db.DB.Where("slug = ? AND author_id = ?", slug, currentUser.ID).First(&crystal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Crystal not found or access denied"})
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

	go updateCrystalLinks(crystal.ID, crystal.Content)
	go ExtractMemories(currentUser.ID, crystal.ID, crystal.Content)

	c.JSON(http.StatusOK, crystal)
}

func DeleteCrystal(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	slug := c.Param("slug")
	var crystal models.Crystal
	if err := db.DB.Where("slug = ? AND author_id = ?", slug, currentUser.ID).First(&crystal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Crystal not found or access denied"})
		return
	}

	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("source_id = ? AND author_id = ?", crystal.ID, currentUser.ID).Delete(&models.Memory{}).Error; err != nil {
			return err
		}
		if err := tx.Where("source_id = ? OR target_id = ?", crystal.ID, crystal.ID).Delete(&models.CrystalLink{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&crystal).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete crystal"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deleted": true,
		"slug":    slug,
	})
}

func GetBacklinks(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	slug := c.Param("slug")
	var target models.Crystal
	if err := db.DB.Where("slug = ? AND author_id = ?", slug, currentUser.ID).First(&target).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target crystal not found"})
		return
	}

	var crystals []models.Crystal
	query := `
		SELECT c.id, c.slug, c.title, c.updated_at 
		FROM crystals c
		JOIN crystal_links cl ON c.id = cl.source_id
		WHERE cl.target_id = ? AND c.author_id = ?
	`
	if err := db.DB.Raw(query, target.ID, currentUser.ID).Scan(&crystals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch backlinks"})
		return
	}

	c.JSON(http.StatusOK, crystals)
}

func updateCrystalLinks(sourceID uint, content string) {
	re := regexp.MustCompile(`class="wiki-link"[^>]*data-id="([^"]+)"`)
	matches := re.FindAllStringSubmatch(content, -1)

	slugMap := make(map[string]bool)
	for _, match := range matches {
		if len(match) > 1 {
			slugMap[match[1]] = true
		}
	}

	db.DB.Where("source_id = ?", sourceID).Delete(&models.CrystalLink{})

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
