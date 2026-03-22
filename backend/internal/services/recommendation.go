package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

type RecommendationResponse struct {
	Recommendations []RecommendedItem `json:"recommendations"`
	UserID          uint              `json:"user_id"`
	MediaType       string            `json:"media_type"`
}

type RecommendedItem struct {
	MediaID     uint    `json:"media_id"`
	Title       string  `json:"title"`
	Score       float64 `json:"score"`
	Poster      string  `json:"poster"`
	Description string  `json:"description"`
}

type SimilarResponse struct {
	Similar   []RecommendedItem `json:"similar"`
	MediaID   string            `json:"media_id"`
	MediaType string            `json:"media_type"`
}

type SemanticSearchResponse struct {
	Results []SemanticSearchItem `json:"results"`
}

type SemanticSearchItem struct {
	MediaID     uint    `json:"media_id"`
	MediaType   string  `json:"media_type"`
	Title       string  `json:"title"`
	Score       float64 `json:"score"`
	Poster      string  `json:"poster,omitempty"`
	Description string  `json:"description,omitempty"`
}

type SimilarUserItem struct {
	UserID uint    `json:"user_id"`
	Score  float64 `json:"score"`
}

type SimilarUsersResponse struct {
	UserID       uint               `json:"user_id"`
	SimilarUsers []SimilarUserItem  `json:"similar_users"`
}

func getRecommendationServiceURL() string {
	url := os.Getenv("RECOMMENDATION_SERVICE_URL")
	if url == "" {
		return "http://localhost:8000"
	}
	return url
}

func GetRecommendations(userID uint, mediaType string, limit string) (*RecommendationResponse, error) {
	url := fmt.Sprintf("%s/recommendations/%d?media_type=%s&limit=%s",
		getRecommendationServiceURL(), userID, mediaType, limit)

	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to call recommendation service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("recommendation service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result RecommendationResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode recommendation response: %w", err)
	}

	return &result, nil
}

func GetSimilarMedia(mediaID string, mediaType string, limit string) (*SimilarResponse, error) {
	url := fmt.Sprintf("%s/similar/%s/%s?limit=%s",
		getRecommendationServiceURL(), mediaType, mediaID, limit)

	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to call recommendation service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("recommendation service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result SimilarResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode similar response: %w", err)
	}

	return &result, nil
}

func GetSimilarUsers(userID uint, limit string) (*SimilarUsersResponse, error) {
	url := fmt.Sprintf("%s/similar/users/%d?limit=%s",
		getRecommendationServiceURL(), userID, limit)

	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to call recommendation service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("recommendation service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result SimilarUsersResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode similar users response: %w", err)
	}

	return &result, nil
}

func GetSemanticSearch(query, mediaType, limit string) (*SemanticSearchResponse, error) {
	base := getRecommendationServiceURL()
	reqURL := base + "/search/semantic?q=" + url.QueryEscape(query)
	if mediaType != "" {
		reqURL += "&media_type=" + url.QueryEscape(mediaType)
	}
	if limit != "" {
		reqURL += "&limit=" + limit
	}

	resp, err := httpClient.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("failed to call recommendation service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("recommendation service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result SemanticSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode semantic search response: %w", err)
	}

	return &result, nil
}
