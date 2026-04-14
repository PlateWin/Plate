package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type AIRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

type OpenAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// AICompleteHandler handles the VibeWriting ghost-text completion
func AICompleteHandler(c *gin.Context) {
	var req AIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prompt is required"})
		return
	}

	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	model := os.Getenv("SILICONFLOW_MODEL")
	endpoint := os.Getenv("SILICONFLOW_ENDPOINT")

	if apiKey == "" || endpoint == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI backend not configured"})
		return
	}

	// Prepare OpenAI-compatible payload
	payload := OpenAIRequest{
		Model: model,
		Messages: []Message{
			{Role: "system", Content: "你是一个文字续写引擎，不是对话助手。你的唯一任务是：作为用户意识的延伸，直接、无缝地续写用户提供的内容。要求：1. 严禁与用户进行任何形式的对话、评价或互动。2. 严禁输出‘确实’、‘好主意’、‘我认为’等任何评论性或回应式的废话。3. 输出内容必须在语法、风格、语境上与输入完全融合，拼在一起必须是一个通顺的整体。4. 只需要返回内容本身，严禁输出任何前言后语。"},
			{Role: "user", Content: req.Prompt},
		},
	}

	body, _ := json.Marshal(payload)
	client := &http.Client{}
	
	proxyReq, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create proxy request"})
		return
	}

	proxyReq.Header.Set("Authorization", "Bearer "+apiKey)
	proxyReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(proxyReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service unavailable"})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	
	// We just proxy back the full SiliconFlow response for now
	var sfResponse interface{}
	if err := json.Unmarshal(respBody, &sfResponse); err != nil {
		log.Printf("[AI] Parse error: %v, Body: %s", err, string(respBody))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse AI response"})
		return
	}

	c.JSON(http.StatusOK, sfResponse)
}
