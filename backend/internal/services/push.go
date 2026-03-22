package services

import (
	"encoding/json"
	"log/slog"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/movie-matcher/backend/internal/config"
	"github.com/movie-matcher/backend/internal/models"
	"gorm.io/gorm"
)

// SendPushForUser отправляет браузерное push-уведомление всем подпискам пользователя. Если VAPID не настроен — не делает ничего.
func SendPushForUser(db *gorm.DB, userID uint, title, body string) {
	if config.Current == nil || config.Current.VAPIDPublicKey == "" || config.Current.VAPIDPrivateKey == "" {
		return
	}
	var subs []models.PushSubscription
	if err := db.Where("user_id = ?", userID).Find(&subs).Error; err != nil || len(subs) == 0 {
		return
	}
	payload, _ := json.Marshal(map[string]string{"title": title, "body": body})
	for _, s := range subs {
		sub := &webpush.Subscription{
			Endpoint: s.Endpoint,
			Keys: webpush.Keys{
				P256dh: s.P256dhKey,
				Auth:   s.AuthKey,
			},
		}
		resp, err := webpush.SendNotification(payload, sub, &webpush.Options{
			Subscriber:      "movie-matcher",
			VAPIDPublicKey:  config.Current.VAPIDPublicKey,
			VAPIDPrivateKey: config.Current.VAPIDPrivateKey,
			TTL:             30,
		})
		if err != nil {
			slog.Default().Warn("push send failed", "userID", userID, "endpoint", s.Endpoint[:min(50, len(s.Endpoint))], "error", err)
			continue
		}
		resp.Body.Close()
		if resp.StatusCode >= 400 {
			// Подписка недействительна (410 Gone и т.д.) — можно удалить
			if resp.StatusCode == 410 || resp.StatusCode == 404 {
				_ = db.Delete(&s).Error
			}
		}
	}
}
