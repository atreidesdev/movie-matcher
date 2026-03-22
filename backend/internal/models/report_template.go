package models

import "time"

// ReportResponseTemplate — шаблон ответа модератора при решении жалобы (для быстрой подстановки в заметку).
type ReportResponseTemplate struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Title     string    `gorm:"size:255;not null" json:"title"`   // короткое название шаблона
	Body      string    `gorm:"type:text;not null" json:"body"`   // текст заметки
	OrderNum  int       `gorm:"default:0" json:"orderNum"`        // порядок отображения
}

func (ReportResponseTemplate) TableName() string {
	return "report_response_templates"
}
