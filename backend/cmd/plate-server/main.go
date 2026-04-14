package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/handlers"
	"github.com/teamwork/plate-server/internal/hub"
	"github.com/teamwork/plate-server/internal/router"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("[Env] No .env file found, using system environment")
	}

	log.Println("═══════════════════════════════════════")
	log.Println("  PLATE CORE SERVER — Phase 1 MVP")
	log.Println("  Port: 8080 | Hub: Active")
	log.Println("═══════════════════════════════════════")

	// Connect to MySQL
	db.InitDB()

	// Start Hub (the beating heart)
	h := hub.NewHub()
	go h.Run()

	// Inject hub reference into handlers
	handlers.AppHub = h

	// Init router and serve
	r := router.InitRouter()
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
