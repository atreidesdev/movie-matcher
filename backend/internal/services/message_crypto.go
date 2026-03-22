package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
)

const gcmNonceSize = 12

// MessageCrypto шифрует/расшифровывает тело сообщений AES-256-GCM.
type MessageCrypto struct {
	key []byte
}

// keyHex: 64 hex → 32 байта; иначе SHA-256(keyHex). Итог 32 байта (AES-256).
func NewMessageCrypto(keyHex string) (*MessageCrypto, error) {
	if keyHex == "" {
		return nil, errors.New("message encryption key is required")
	}
	var key []byte
	if len(keyHex) == 64 && isHex(keyHex) {
		key, _ = hex.DecodeString(keyHex)
	} else {
		h := sha256.Sum256([]byte(keyHex))
		key = h[:]
	}
	if len(key) != 32 {
		return nil, errors.New("message encryption key must be 32 bytes")
	}
	return &MessageCrypto{key: key}, nil
}

func isHex(s string) bool {
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

var DefaultMessageCrypto *MessageCrypto

func InitMessageCrypto(key, fallbackKey string) error {
	if key == "" {
		key = fallbackKey
	}
	if key == "" {
		return errors.New("message encryption key or fallback is required")
	}
	c, err := NewMessageCrypto(key)
	if err != nil {
		return err
	}
	DefaultMessageCrypto = c
	return nil
}

func (m *MessageCrypto) Encrypt(plaintext []byte) (ciphertext, nonce []byte, err error) {
	block, err := aes.NewCipher(m.key)
	if err != nil {
		return nil, nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, err
	}
	nonce = make([]byte, gcmNonceSize)
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, nil, err
	}
	ciphertext = gcm.Seal(nil, nonce, plaintext, nil)
	return ciphertext, nonce, nil
}

// Decrypt расшифровывает данные. nonce — 12 байт, ciphertext — результат Seal без nonce внутри.
func (m *MessageCrypto) Decrypt(ciphertext, nonce []byte) ([]byte, error) {
	if len(nonce) != gcmNonceSize {
		return nil, errors.New("invalid nonce size")
	}
	block, err := aes.NewCipher(m.key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return gcm.Open(nil, nonce, ciphertext, nil)
}
