package services

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strconv"
)

type EmailService struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
}

func NewEmailService(host, port, user, password, from string) *EmailService {
	p := 587
	if port != "" {
		if n, err := strconv.Atoi(port); err == nil {
			p = n
		}
	}
	return &EmailService{
		Host:     host,
		Port:     p,
		User:     user,
		Password: password,
		From:     from,
	}
}

func (s *EmailService) SendPasswordReset(toEmail, resetLink string) error {
	if s.Host == "" || s.User == "" {
		return fmt.Errorf("SMTP not configured")
	}

	subject := "Сброс пароля — Movie Matcher"
	body := fmt.Sprintf("Здравствуйте!\n\nВы запросили сброс пароля. Перейдите по ссылке для установки нового пароля:\n\n%s\n\nСсылка действительна 1 час. Если вы не запрашивали сброс, проигнорируйте это письмо.\n\n— Movie Matcher", resetLink)

	msg := "From: " + s.From + "\r\n" +
		"To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n" +
		"\r\n" + body

	addr := fmt.Sprintf("%s:%d", s.Host, s.Port)
	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)
	tlsConfig := &tls.Config{ServerName: s.Host}

	var conn net.Conn
	var err error
	if s.Port == 465 {
		conn, err = tls.Dial("tcp", addr, tlsConfig)
	} else {
		conn, err = net.Dial("tcp", addr)
	}
	if err != nil {
		return fmt.Errorf("smtp connect: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.Host)
	if err != nil {
		return fmt.Errorf("smtp new client: %w", err)
	}
	defer client.Close()

	if s.Port != 465 {
		if err = client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("smtp starttls: %w", err)
		}
	}

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err = client.Mail(s.From); err != nil {
		return fmt.Errorf("smtp mail: %w", err)
	}
	if err = client.Rcpt(toEmail); err != nil {
		return fmt.Errorf("smtp rcpt: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err = w.Write([]byte(msg)); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	if err = w.Close(); err != nil {
		return fmt.Errorf("smtp close: %w", err)
	}

	return client.Quit()
}
