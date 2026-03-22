#!/usr/bin/env bash
# Тестовый прогон: сид данных, индексация, проверка рекомендаций и семантического поиска.
# Требования: PostgreSQL запущен, миграции применены, Python venv с зависимостями.
# Использование: из корня recommendation-service: ./scripts/run_test_run.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:8000}"
cd "$(dirname "$0")/.."

echo "=== 1. Сид тестовых данных (фильмы, аниме, игры) ==="
python scripts/seed_test_data.py

echo ""
echo "=== 2. Запустите сервис в другом терминале: python -m app.main ==="
echo "   Затем нажмите Enter здесь для продолжения проверки..."
read -r

echo ""
echo "=== 3. Health ==="
curl -s "$BASE_URL/health" | python -m json.tool

echo ""
echo "=== 4. Индексация (movie, animeSeries, game) ==="
curl -s -X POST "$BASE_URL/index/movie"
curl -s -X POST "$BASE_URL/index/animeSeries"
curl -s -X POST "$BASE_URL/index/game"

echo ""
echo "=== 5. Health после индексации ==="
curl -s "$BASE_URL/health" | python -m json.tool

echo ""
echo "=== 6. Семантический поиск: q=sci-fi thriller ==="
curl -s "$BASE_URL/search/semantic?q=sci-fi+thriller&limit=5" | python -m json.tool

echo ""
echo "=== 7. Рекомендации для user_id=1 (movie) ==="
curl -s "$BASE_URL/recommendations/1?media_type=movie&limit=5" | python -m json.tool

echo ""
echo "=== 8. Похожее к фильму (movie id=1) ==="
curl -s "$BASE_URL/similar/movie/1?limit=3" | python -m json.tool

echo ""
echo "=== Готово ==="
