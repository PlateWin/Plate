package models

import "time"

// User represents a system user
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;size:100;not null" json:"username"`
	IsOnline  bool      `json:"isOnline"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Channel represents a chat room or direct message channel
type Channel struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"uniqueIndex;size:100;not null" json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

// Message is the standard JSON wire format AND database schema
type Message struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Type      string    `gorm:"size:20;not null" json:"type"` // "chat" | "join" | "leave" | "system"
	Sender    string    `gorm:"size:100;not null" json:"sender"`
	Channel   string    `gorm:"size:100;not null" json:"channel"`
	Text      string    `gorm:"type:text;not null" json:"text"`
	Time      string    `gorm:"size:50" json:"time"`
	CreatedAt time.Time `json:"createdAt"`
}

// Crystal represents a knowledge document
type Crystal struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Slug      string    `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Content   string    `gorm:"type:longtext" json:"content"`
	AuthorID  uint      `json:"authorId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CrystalLink handles bidirectional link indexing
type CrystalLink struct {
	ID       uint `gorm:"primaryKey" json:"id"`
	SourceID uint `gorm:"index" json:"sourceId"`
	TargetID uint `gorm:"index" json:"targetId"`
}

// Memory represents a personalized piece of knowledge or style pattern
type Memory struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Category   string    `gorm:"size:20;index;not null" json:"category"` // "fact" | "style"
	Content      string    `gorm:"type:text;not null" json:"content"`
	OriginalText string    `gorm:"type:text" json:"originalText"`          // The raw snippet
	Entity       string    `gorm:"size:100;index" json:"entity"`           // e.g., "Project Astra"
	SourceID     uint      `gorm:"index" json:"sourceId"`                  // Foreign Key to Crystal
	Importance   int       `gorm:"default:3" json:"importance"`            // 1-5
	AuthorID     uint      `gorm:"index" json:"authorId"`                  // Owner ID
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
