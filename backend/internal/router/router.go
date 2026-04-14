package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/teamwork/plate-server/internal/handlers"
)

func InitRouter() *gin.Engine {
	r := gin.Default()

	// CORS — allow Electron dev server origin
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowWebSockets:  true,
	}))

	v1 := r.Group("/api/v1")
	{
		v1.GET("/ping", handlers.PingCheck)
		v1.GET("/online", handlers.OnlineHandler)
		v1.GET("/channels", handlers.ChannelsHandler)
		v1.GET("/messages", handlers.HistoryHandler)
		v1.POST("/ai/complete", handlers.AICompleteHandler)

		// Crystal (Knowledge) Routes
		v1.POST("/crystals", handlers.CreateCrystal)
		v1.GET("/crystals", handlers.ListCrystals)
		v1.GET("/crystals/:slug", handlers.GetCrystal)
		v1.PUT("/crystals/:slug", handlers.UpdateCrystal)
		v1.GET("/crystals/:slug/backlinks", handlers.GetBacklinks)
	}

	r.GET("/ws", handlers.WSHandler)

	return r
}
