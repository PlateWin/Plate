package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
)

// ExtractMemories is the background engine that distills knowledge and style
func ExtractMemories(authorID uint, sourceID uint, content string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[Memory] PANIC recovered in Extraction: %v", r)
		}
	}()
	log.Printf("[Memory] Starting extraction for User %d, Crystal ID: %d", authorID, sourceID)

	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	model := os.Getenv("SILICONFLOW_MODEL")
	endpoint := os.Getenv("SILICONFLOW_ENDPOINT")

	if apiKey == "" || endpoint == "" {
		log.Println("[Memory] Skipping: AI configuration is incomplete")
		return
	}

	// 1. Clear old memories for this source to stay updated
	db.DB.Where("source_id = ?", sourceID).Delete(&models.Memory{})

	// 2. Fact Extraction
	extractFacts(authorID, sourceID, content, apiKey, model, endpoint)

	// 3. Style Extraction
	extractStyle(authorID, sourceID, content, apiKey, model, endpoint)

	log.Printf("[Memory] Extraction complete for User %d, Crystal ID: %d", authorID, sourceID)
}

func extractFacts(authorID uint, sourceID uint, content string, apiKey, model, endpoint string) {
	textContent := stripHTML(content)
	log.Printf("[Memory] Knowledge Extraction started for context length: %d", len(textContent))

	factPrompt := `你是一个冷酷的档案员。
任务：从文本中提取核心事实、姓名、项目、数据、硬性结论。
严禁：严禁评价、总结、描述文本的写作风格、语气或结构。
要求：每个对象必须是关于“具体人、事、物”的断言。
格式：返回纯 JSON 列表 [{"entity": "主体", "fact": "事实断言", "original_text": "原文摘录"}]`

	factsJSON, err := callAIJSON(factPrompt, textContent, apiKey, model, endpoint)
	if err != nil {
		return
	}

	log.Printf("[Memory] RAW Fact: %s", factsJSON)

	cleaned := cleanJSON(factsJSON)
	var items []map[string]interface{}
	
	if err := json.Unmarshal([]byte(cleaned), &items); err != nil {
		log.Printf("[Memory] JSON parse failed, falling back to source record")
		db.DB.Create(&models.Memory{
			Category:     "fact",
			Content:      "知识提取(源数据)",
			Entity:       "System",
			OriginalText: textContent,
			SourceID:     sourceID,
			AuthorID:     authorID,
			Importance:   1,
		})
		return
	}

	for _, item := range items {
		// Tolerant field mapping
		var e, f, p string
		for k, v := range item {
			kl := strings.ToLower(k)
			val, _ := v.(string)
			if strings.Contains(kl, "ent") { e = val }
			if strings.Contains(kl, "fact") || strings.Contains(kl, "cont") { f = val }
			if strings.Contains(kl, "orig") { p = val }
		}
		
		if p == "" { p = textContent }
		// Final check to avoid meta-descriptions in content
		if f != "" && !isMetaDescription(f) {
			db.DB.Create(&models.Memory{
				Category:     "fact",
				Content:      f,
				Entity:       e,
				OriginalText: p,
				SourceID:     sourceID,
				AuthorID:     authorID,
				Importance:   3,
			})
			log.Printf("[Memory] Stored Fact for %s", e)
		}
	}
}

func isMetaDescription(s string) bool {
	blackList := []string{"描述", "总结", "详实", "严谨", "风格", "排版", "文章", "逻辑性"}
	for _, word := range blackList {
		if strings.Contains(s, word) {
			return true
		}
	}
	return false
}

func extractStyle(authorID uint, sourceID uint, content string, apiKey, model, endpoint string) {
	textContent := stripHTML(content)
	stylePrompt := `总结文本最显著的一项语言风格（语气、常用词）。禁止描述结构。
格式：[{"content": "简洁冷静"}]`

	styleJSON, err := callAIJSON(stylePrompt, textContent, apiKey, model, endpoint)
	if err != nil {
		return
	}

	cleaned := cleanJSON(styleJSON)
	var items []map[string]interface{}
	if err := json.Unmarshal([]byte(cleaned), &items); err != nil {
		// Style fallback
		db.DB.Create(&models.Memory{
			Category:     "style",
			Content:      "自适应笔迹风格",
			OriginalText: textContent,
			SourceID:     sourceID,
			AuthorID:     authorID,
			Importance:   2,
		})
		return
	}

	for _, item := range items {
		content, _ := item["content"].(string)
		if content != "" {
			db.DB.Create(&models.Memory{
				Category:     "style",
				Content:      content,
				OriginalText: textContent,
				SourceID:     sourceID,
				AuthorID:     authorID,
				Importance:   2,
			})
		}
	}
}

func stripHTML(s string) string {
	var builder strings.Builder
	inTag := false
	for _, r := range s {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
			inTag = false
			continue
		}
		if !inTag {
			builder.WriteRune(r)
		}
	}
	return strings.TrimSpace(builder.String())
}

func callAIJSON(system, user, apiKey, model, endpoint string) (string, error) {
	payload := OpenAIRequest{
		Model: model,
		Messages: []Message{
			{Role: "system", Content: system},
			{Role: "user", Content: user},
		},
		Stream: false,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var sfResponse struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(respBody, &sfResponse); err != nil {
		return "", err
	}

	if sfResponse.Error.Message != "" {
		return "", fmt.Errorf("AI Error: %s", sfResponse.Error.Message)
	}

	if len(sfResponse.Choices) > 0 {
		return sfResponse.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("empty response")
}

func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	// Find JSON block [ ... ]
	re := regexp.MustCompile(`(?s)\[.*\]`)
	match := re.FindString(s)
	if match != "" {
		return match
	}
	return s
}
