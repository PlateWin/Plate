package db

import (
	"database/sql"
	"log"

	"github.com/teamwork/plate-server/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// DB is the global database instance
var DB *gorm.DB

func InitDB() {
	// First connect to root to create the database if it doesn't exist
	dsnBase := "root:wsxhr666@tcp(127.0.0.1:3306)/?charset=utf8mb4&parseTime=True&loc=Local"
	
	// We use the standard sql packet here to create DB securely without failing if not exists
	sqlDB, err := sql.Open("mysql", dsnBase)
	if err != nil {
		log.Fatalf("[DB] Failed to connect to MySQL: %v", err)
	}
	defer sqlDB.Close()

	_, err = sqlDB.Exec("CREATE DATABASE IF NOT EXISTS plate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
	if err != nil {
		log.Fatalf("[DB] Failed to create database: %v", err)
	}

	// Now connect to the newly created 'plate' database using GORM
	dsn := "root:wsxhr666@tcp(127.0.0.1:3306)/plate?charset=utf8mb4&parseTime=True&loc=Local"
	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true, // Speeds up phase 1 iteration
	})
	if err != nil {
		log.Fatalf("[DB] Failed to connect to Plate database: %v", err)
	}

	log.Println("[DB] Successfully connected to MySQL 'plate' database")

	// Auto-migrate our schemas
	err = database.AutoMigrate(
		&models.User{},
		&models.Channel{},
		&models.Message{},
		&models.Crystal{},
		&models.CrystalLink{},
		&models.Memory{},
	)
	if err != nil {
		log.Fatalf("[DB] Failed to migrate database schemas: %v", err)
	}

	DB = database
	ensureDefaultChannels()
}

// populate some default channels in DB
func ensureDefaultChannels() {
	defaults := []string{"general", "dev-core", "design", "ai-brain"}
	for _, ch := range defaults {
		var count int64
		DB.Model(&models.Channel{}).Where("name = ?", ch).Count(&count)
		if count == 0 {
			DB.Create(&models.Channel{Name: ch})
		}
	}
}
