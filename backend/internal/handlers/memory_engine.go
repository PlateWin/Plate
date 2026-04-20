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
	"sort"
	"strings"
	"unicode"

	"github.com/teamwork/plate-server/internal/db"
	"github.com/teamwork/plate-server/internal/models"
	"gorm.io/gorm"
)

// ExtractMemories distills long-term facts and style fingerprints from a crystal.
func ExtractMemories(authorID uint, sourceID uint, content string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[Memory] panic recovered in extraction: %v", r)
		}
	}()

	log.Printf("[Memory] starting extraction for user=%d crystal=%d", authorID, sourceID)

	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	model := os.Getenv("SILICONFLOW_MODEL")
	endpoint := os.Getenv("SILICONFLOW_ENDPOINT")
	if apiKey == "" || endpoint == "" {
		log.Println("[Memory] skipping extraction: AI configuration is incomplete")
		return
	}

	db.DB.Where("source_id = ? AND author_id = ?", sourceID, authorID).Delete(&models.Memory{})

	extractFacts(authorID, sourceID, content, apiKey, model, endpoint)
	extractStyle(authorID, sourceID, content, apiKey, model, endpoint)

	log.Printf("[Memory] extraction complete for user=%d crystal=%d", authorID, sourceID)
}

type MemoryMatch struct {
	models.Memory
	Score int `json:"score"`
}

func normalizeMemoryValue(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func clampImportance(value int) int {
	if value < 1 {
		return 1
	}
	if value > 5 {
		return 5
	}
	return value
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func storeOrMergeMemory(authorID uint, sourceID uint, category, content, entity, originalText string, baseImportance int) {
	content = normalizeMemoryValue(content)
	entity = normalizeMemoryValue(entity)
	originalText = strings.TrimSpace(originalText)
	if content == "" {
		return
	}

	var existing models.Memory
	err := db.DB.Where(
		"author_id = ? AND category = ? AND content = ? AND COALESCE(entity, '') = ?",
		authorID,
		category,
		content,
		entity,
	).First(&existing).Error

	if err == nil {
		existing.Importance = clampImportance(maxInt(existing.Importance, baseImportance) + 1)
		if originalText != "" {
			existing.OriginalText = originalText
		}
		if sourceID != 0 {
			existing.SourceID = sourceID
		}
		if saveErr := db.DB.Save(&existing).Error; saveErr != nil {
			log.Printf("[Memory] failed to merge memory: %v", saveErr)
		}
		return
	}

	if err != nil && err != gorm.ErrRecordNotFound {
		log.Printf("[Memory] failed to look up duplicate memory: %v", err)
		return
	}

	if createErr := db.DB.Create(&models.Memory{
		Category:     category,
		Content:      content,
		Entity:       entity,
		OriginalText: originalText,
		SourceID:     sourceID,
		AuthorID:     authorID,
		Importance:   clampImportance(baseImportance),
	}).Error; createErr != nil {
		log.Printf("[Memory] failed to store memory: %v", createErr)
	}
}

func reinforceMemoryMatches(matches []MemoryMatch) {
	for index, match := range matches {
		if index >= 3 {
			break
		}
		nextImportance := clampImportance(match.Importance + 1)
		if nextImportance == match.Importance {
			continue
		}
		if err := db.DB.Model(&models.Memory{}).Where("id = ?", match.ID).Update("importance", nextImportance).Error; err != nil {
			log.Printf("[Memory] failed to reinforce memory %d: %v", match.ID, err)
		}
	}
}

func extractFacts(authorID uint, sourceID uint, content string, apiKey, model, endpoint string) {
	textContent := stripHTML(content)
	log.Printf("[Memory] fact extraction started for context length=%d", len(textContent))

	factPrompt := `You are a memory extraction engine. Extract only concrete facts, named entities, project details, decisions, and constraints from the text. Do not summarize writing style. Return strict JSON array format: [{"entity":"subject","fact":"atomic fact","original_text":"source snippet"}]`

	factsJSON, err := callAIJSON(factPrompt, textContent, apiKey, model, endpoint)
	if err != nil {
		return
	}

	cleaned := cleanJSON(factsJSON)
	var items []map[string]interface{}
	if err := json.Unmarshal([]byte(cleaned), &items); err != nil {
		log.Printf("[Memory] fact JSON parse failed, falling back to source record")
		storeOrMergeMemory(authorID, sourceID, "fact", "Knowledge extraction fallback", "System", textContent, 1)
		return
	}

	for _, item := range items {
		var entity, fact, originalText string
		for key, value := range item {
			lowerKey := strings.ToLower(key)
			textValue, _ := value.(string)
			switch {
			case strings.Contains(lowerKey, "ent"):
				entity = textValue
			case strings.Contains(lowerKey, "fact") || strings.Contains(lowerKey, "cont"):
				fact = textValue
			case strings.Contains(lowerKey, "orig"):
				originalText = textValue
			}
		}

		if originalText == "" {
			originalText = textContent
		}
		if fact != "" && !isMetaDescription(fact) {
			storeOrMergeMemory(authorID, sourceID, "fact", fact, entity, originalText, 3)
			log.Printf("[Memory] stored fact for entity=%s", entity)
		}
	}
}

func isMetaDescription(s string) bool {
	blackList := []string{"描述", "总结", "详实", "风格", "排版", "文章", "结构", "tone", "style"}
	for _, word := range blackList {
		if strings.Contains(strings.ToLower(s), strings.ToLower(word)) {
			return true
		}
	}
	return false
}

func extractStyle(authorID uint, sourceID uint, content string, apiKey, model, endpoint string) {
	textContent := stripHTML(content)
	stylePrompt := `Identify the most useful writing-style fingerprints in this text, such as tone, favored wording, and professional phrasing habits. Return strict JSON array format: [{"content":"style memory"}]`

	styleJSON, err := callAIJSON(stylePrompt, textContent, apiKey, model, endpoint)
	if err != nil {
		return
	}

	cleaned := cleanJSON(styleJSON)
	var items []map[string]interface{}
	if err := json.Unmarshal([]byte(cleaned), &items); err != nil {
		var single map[string]interface{}
		if singleErr := json.Unmarshal([]byte(cleaned), &single); singleErr == nil {
			items = []map[string]interface{}{single}
		} else {
			storeOrMergeMemory(authorID, sourceID, "style", "Adaptive house style", "", textContent, 2)
			return
		}
	}

	for _, item := range items {
		contentValue, _ := item["content"].(string)
		if contentValue != "" {
			storeOrMergeMemory(authorID, sourceID, "style", contentValue, "", textContent, 2)
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

func RecallMemories(authorID uint, context string, limit int) ([]MemoryMatch, error) {
	if authorID == 0 || strings.TrimSpace(context) == "" {
		return []MemoryMatch{}, nil
	}
	if limit <= 0 {
		limit = 5
	}

	var memories []models.Memory
	if err := db.DB.Where("author_id = ?", authorID).Order("importance desc, updated_at desc").Find(&memories).Error; err != nil {
		return nil, err
	}

	contextLower := strings.ToLower(stripHTML(context))
	tokens := buildRecallTokens(contextLower)
	matches := make([]MemoryMatch, 0, len(memories))

	for _, memory := range memories {
		score := scoreMemory(memory, contextLower, tokens)
		if score == 0 {
			continue
		}
		matches = append(matches, MemoryMatch{
			Memory: memory,
			Score:  score,
		})
	}

	sort.Slice(matches, func(i, j int) bool {
		if matches[i].Score == matches[j].Score {
			if matches[i].Importance == matches[j].Importance {
				return matches[i].UpdatedAt.After(matches[j].UpdatedAt)
			}
			return matches[i].Importance > matches[j].Importance
		}
		return matches[i].Score > matches[j].Score
	})

	if len(matches) > limit {
		matches = matches[:limit]
	}

	reinforceMemoryMatches(matches)
	return matches, nil
}

func BuildMemoryContext(authorID uint, context string, limit int) string {
	matches, err := RecallMemories(authorID, context, limit)
	if err != nil || len(matches) == 0 {
		return ""
	}

	lines := make([]string, 0, len(matches))
	for _, match := range matches {
		entity := strings.TrimSpace(match.Entity)
		if entity == "" {
			entity = "General"
		}
		lines = append(lines, fmt.Sprintf("- [%s|%s|importance=%d] %s", match.Category, entity, match.Importance, match.Content))
	}

	return "Relevant memory fragments:\n" + strings.Join(lines, "\n")
}

func cleanJSON(s string) string {
	s = strings.TrimSpace(s)

	arrayRE := regexp.MustCompile(`(?s)\[.*\]`)
	if match := arrayRE.FindString(s); match != "" {
		return match
	}

	objectRE := regexp.MustCompile(`(?s)\{.*\}`)
	if match := objectRE.FindString(s); match != "" {
		return match
	}

	return s
}

func buildRecallTokens(text string) []string {
	splitter := func(r rune) bool {
		return unicode.IsSpace(r) || unicode.IsPunct(r)
	}

	raw := strings.FieldsFunc(text, splitter)
	seen := make(map[string]struct{}, len(raw))
	tokens := make([]string, 0, len(raw))
	for _, token := range raw {
		token = strings.TrimSpace(token)
		if len([]rune(token)) < 2 {
			continue
		}
		if _, ok := seen[token]; ok {
			continue
		}
		seen[token] = struct{}{}
		tokens = append(tokens, token)
	}
	return tokens
}

func scoreMemory(memory models.Memory, context string, tokens []string) int {
	haystacks := []string{
		strings.ToLower(memory.Content),
		strings.ToLower(memory.Entity),
		strings.ToLower(memory.OriginalText),
	}

	score := memory.Importance * 10
	for _, haystack := range haystacks {
		if haystack == "" {
			continue
		}
		if context != "" && len(context) >= 4 && strings.Contains(haystack, context) {
			score += 40
		}
		for _, token := range tokens {
			if strings.Contains(haystack, token) {
				score += 8
			}
		}
	}
	return score
}
