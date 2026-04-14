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

type AIActionRequest struct {
	Action  string `json:"action" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type OpenAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
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
			{Role: "system", Content: "你是一个文字续写引擎，不是对话助手。你的唯一任务是：作为用户意识的延伸，直接、无缝地续写用户提供的内容。要求：1. 严禁与用户进行任何形式 engagement。2. 严禁输出‘确实’、‘好主意’、‘我认为’等任何评论性或回应式的废话。3. 输出内容必须在语法、风格、语境上与输入完全融合，拼在一起必须是一个通顺的整体。4. 只需要返回内容本身，严禁输出任何前言后语。"},
			{Role: "user", Content: req.Prompt},
		},
		Stream: false,
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

// AIActionHandler handles specialized Notion-style commands
func AIActionHandler(c *gin.Context) {
	var req AIActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action and content are required"})
		return
	}

	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	model := os.Getenv("SILICONFLOW_MODEL")
	endpoint := os.Getenv("SILICONFLOW_ENDPOINT")

	systemPrompt := "你是一个专业的高级写作助手。"
	switch req.Action {
	case "summary":
		systemPrompt = "请对以下内容进行精准摘要。要求：1. 使用 Markdown 格式。2. 包含一个加粗的标题“内容摘要”。3. 使用列表或小节形式呈现核心观点，确保版式美观、逻辑清晰。"
	case "improve":
		systemPrompt = "请优化以下文字，修复语法错误，提升措辞深度，保持原意，使其更具文学性或专业性。"
	case "expand":
		systemPrompt = "请扩展以下内容，增加细节描写、逻辑推导或背景补充，使其更加丰富饱满。"
	case "brief":
		systemPrompt = "请将以下内容提炼为清晰的 Bullet Points（要点列表）。"
	case "translate_en":
		systemPrompt = "请将以下内容翻译为地道的英文。"
	case "translate_zh":
		systemPrompt = "请将以下内容翻译为流畅的中文。"
	case "tone_creative":
		systemPrompt = "请改写以下内容，使其语言更加生动、富有感染力和想象力。"
	case "tone_pro":
		systemPrompt = "请改写以下内容，使其语气更加正式、严谨、专业，适合商务或学术场景。"
	}

	payload := OpenAIRequest{
		Model: model,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: req.Content},
		},
		Stream: false,
	}

	body, _ := json.Marshal(payload)
	client := &http.Client{
		Timeout: 30 * 1000 * 1000 * 1000,
	}
	
	proxyReq, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))
	proxyReq.Header.Set("Authorization", "Bearer "+apiKey)
	proxyReq.Header.Set("Content-Type", "application/json")
	proxyReq.Header.Set("Accept", "application/json")

	resp, err := client.Do(proxyReq)
	if err != nil {
		log.Printf("[AI] Action request failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service connection error"})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.Printf("[AI] Action service upstream error: Status %d, Body: %s", resp.StatusCode, string(respBody))
		c.JSON(resp.StatusCode, gin.H{
			"error":   "AI_UPSTREAM_ERROR",
			"status":  resp.StatusCode,
			"details": string(respBody),
		})
		return
	}

	var sfResponse interface{}
	if err := json.Unmarshal(respBody, &sfResponse); err != nil {
		log.Printf("[AI] Action parse error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse AI response"})
		return
	}
	c.JSON(http.StatusOK, sfResponse)
}
