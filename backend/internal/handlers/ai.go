package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

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

func AICompleteHandler(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		log.Printf("[AI] Anonymous completion request")
	}

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

	systemPrompt := strings.Join([]string{
		"You are a writing continuation engine, not a chatbot.",
		"Continue the user's draft seamlessly in the same language, tone, and structure.",
		"Do not add acknowledgements, explanations, or meta commentary.",
		"Return only the continuation text.",
	}, " ")
	if ok {
		if memoryContext := BuildMemoryContext(currentUser.ID, req.Prompt, 5); memoryContext != "" {
			systemPrompt += "\n\nUse the following memory fragments only when they genuinely help the continuation.\n" + memoryContext
		}
	}

	payload := OpenAIRequest{
		Model: model,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: req.Prompt},
		},
		Stream: false,
	}

	sfResponse, statusCode, err := proxyAIRequest(endpoint, apiKey, payload)
	if err != nil {
		c.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sfResponse)
}

func AIActionHandler(c *gin.Context) {
	currentUser, ok := GetCurrentUser(c)
	if !ok {
		log.Printf("[AI] Anonymous action request")
	}

	var req AIActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action and content are required"})
		return
	}

	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	model := os.Getenv("SILICONFLOW_MODEL")
	endpoint := os.Getenv("SILICONFLOW_ENDPOINT")
	if apiKey == "" || endpoint == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI backend not configured"})
		return
	}

	systemPrompt := buildActionPrompt(req.Action)
	if ok {
		if memoryContext := BuildMemoryContext(currentUser.ID, req.Content, 5); memoryContext != "" {
			systemPrompt = strings.TrimSpace(systemPrompt + "\n\nUse the following memory fragments only when they improve factual continuity or style alignment.\n" + memoryContext)
		}
	}

	payload := OpenAIRequest{
		Model: model,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: req.Content},
		},
		Stream: false,
	}

	sfResponse, statusCode, err := proxyAIRequest(endpoint, apiKey, payload)
	if err != nil {
		c.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sfResponse)
}

func buildActionPrompt(action string) string {
	switch action {
	case "summary":
		return "Summarize the content in clear Markdown with a short heading and concise bullet points."
	case "improve":
		return "Improve clarity, grammar, and flow while preserving the original meaning."
	case "expand":
		return "Expand the content with useful detail, explanation, and transitions while keeping it coherent."
	case "brief":
		return "Turn the content into concise bullet points."
	case "translate_en":
		return "Translate the content into natural English."
	case "translate_zh":
		return "Translate the content into fluent Simplified Chinese."
	case "tone_creative":
		return "Rewrite the content in a more vivid, creative, and expressive style."
	case "tone_pro":
		return "Rewrite the content in a more formal, professional style."
	default:
		return "You are a professional writing assistant. Improve the user's text while preserving intent."
	}
}

func proxyAIRequest(endpoint, apiKey string, payload OpenAIRequest) (interface{}, int, error) {
	body, _ := json.Marshal(payload)
	client := &http.Client{Timeout: 30 * time.Second}

	proxyReq, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	proxyReq.Header.Set("Authorization", "Bearer "+apiKey)
	proxyReq.Header.Set("Content-Type", "application/json")
	proxyReq.Header.Set("Accept", "application/json")

	resp, err := client.Do(proxyReq)
	if err != nil {
		log.Printf("[AI] upstream request failed: %v", err)
		return nil, http.StatusInternalServerError, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.Printf("[AI] upstream error: status=%d body=%s", resp.StatusCode, string(respBody))
		return nil, resp.StatusCode, fmt.Errorf("AI_UPSTREAM_ERROR")
	}

	var sfResponse interface{}
	if err := json.Unmarshal(respBody, &sfResponse); err != nil {
		log.Printf("[AI] parse error: %v", err)
		return nil, http.StatusInternalServerError, err
	}

	return sfResponse, http.StatusOK, nil
}
