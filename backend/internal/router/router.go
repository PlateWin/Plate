package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/teamwork/plate-server/internal/handlers"
	"github.com/teamwork/plate-server/internal/middleware"
)

func InitRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS — allow Electron dev server origin
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-User-Name", "Authorization"},
		AllowWebSockets:  true,
	}))

	v1 := r.Group("/api/v1")
	{
		v1.GET("/ping", handlers.PingCheck)
		v1.GET("/online", handlers.OnlineHandler)
		
		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/channels", handlers.ChannelsHandler)
			protected.GET("/messages", handlers.HistoryHandler)
			protected.POST("/ai/complete", handlers.AICompleteHandler)
			protected.POST("/ai/action", handlers.AIActionHandler)

			// Crystal (Knowledge) Routes
			protected.POST("/crystals", handlers.CreateCrystal)
			protected.GET("/crystals", handlers.ListCrystals)
			protected.GET("/crystals/:slug", handlers.GetCrystal)
			protected.PUT("/crystals/:slug", handlers.UpdateCrystal)
			protected.GET("/crystals/:slug/backlinks", handlers.GetBacklinks)
		}
	}

	r.GET("/ws", handlers.WSHandler)

	return r
}
