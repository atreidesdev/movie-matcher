#!/usr/bin/env python3
"""
Небольшой скрипт для ручной проверки recommendation-service.

Требуется:
  - запущенный recommendation-service (по умолчанию http://localhost:8000)
  - при необходимости — проиндексированные данные (POST /index/movie и т.п.)

Примеры:
  python scripts/test_requests.py --user 1
  python scripts/test_requests.py --user 1 --media-type movie --limit 10
  python scripts/test_requests.py --similar-type movie --similar-id 1
  python scripts/test_requests.py --search \"space travel\" --media-type movie
"""

import argparse
import os
import sys
from typing import Optional

import requests


def base_url() -> str:
  return os.getenv("RECOMMENDATION_BASE_URL", "http://localhost:8000").rstrip("/")


def call_health() -> None:
  url = f"{base_url()}/health"
  print(f"GET {url}")
  r = requests.get(url, timeout=10)
  print(r.status_code, r.json())


def call_recommendations(user_id: int, media_type: str, limit: int) -> None:
  url = f"{base_url()}/recommendations/{user_id}"
  params = {"media_type": media_type, "limit": limit}
  print(f"GET {url}", "params=", params)
  r = requests.get(url, params=params, timeout=20)
  print("Status:", r.status_code)
  try:
    data = r.json()
  except Exception:
    print(r.text)
    return
  print("User:", data.get("user_id"), "media_type:", data.get("media_type"))
  print("Recommendations:")
  for idx, rec in enumerate(data.get("recommendations", []), start=1):
    print(f"  {idx:2d}. id={rec.get('media_id')} score={rec.get('score')} title={rec.get('title')}")


def call_similar(media_type: str, media_id: int, limit: int) -> None:
  url = f"{base_url()}/similar/{media_type}/{media_id}"
  params = {"limit": limit}
  print(f"GET {url}", "params=", params)
  r = requests.get(url, params=params, timeout=20)
  print("Status:", r.status_code)
  try:
    data = r.json()
  except Exception:
    print(r.text)
    return
  print("Similar for:", data.get("media_type"), data.get("media_id"))
  for idx, rec in enumerate(data.get("similar", []), start=1):
    print(f"  {idx:2d}. id={rec.get('media_id')} score={rec.get('score')} title={rec.get('title')}")


def call_search(query: str, media_type: Optional[str], limit: int) -> None:
  url = f"{base_url()}/search/semantic"
  params = {"q": query, "limit": limit}
  if media_type:
    params["media_type"] = media_type
  print(f"GET {url}", "params=", params)
  r = requests.get(url, params=params, timeout=20)
  print("Status:", r.status_code)
  try:
    data = r.json()
  except Exception:
    print(r.text)
    return
  print("Query:", data.get("query"), "media_type:", data.get("media_type"))
  for idx, item in enumerate(data.get("results", []), start=1):
    print(f"  {idx:2d}. id={item.get('media_id')} score={item.get('score')} title={item.get('title')}")


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Test requests to recommendation-service")
  parser.add_argument("--user", type=int, help="user_id для персональных рекомендаций")
  parser.add_argument("--media-type", default="movie", help="media_type (movie, anime, game, ...)")
  parser.add_argument("--limit", type=int, default=10, help="лимит для рекомендаций/похожего/поиска")
  parser.add_argument("--similar-type", help="media_type для похожего")
  parser.add_argument("--similar-id", type=int, help="media_id для похожего")
  parser.add_argument("--search", dest="search_query", help="строка для семантического поиска")
  parser.add_argument("--health", action="store_true", help="вызвать /health")

  args = parser.parse_args(argv)

  # Если ничего не передали — запускаем набор дефолтных запросов по очереди.
  if not any([args.health, args.user is not None, args.similar_type, args.search_query]):
    print("==> /health")
    call_health()
    print("\n==> /recommendations/1 (movie)")
    call_recommendations(user_id=1, media_type="movie", limit=args.limit)
    print("\n==> /similar/movie/1")
    call_similar(media_type="movie", media_id=1, limit=args.limit)
    print("\n==> /search/semantic?q=space travel&media_type=movie")
    call_search(query="space travel", media_type="movie", limit=args.limit)
    return

  if args.health:
    call_health()

  if args.user is not None:
    call_recommendations(args.user, args.media_type, args.limit)

  if args.similar_type and args.similar_id is not None:
    call_similar(args.similar_type, args.similar_id, args.limit)

  if args.search_query:
    call_search(args.search_query, args.media_type, args.limit)


if __name__ == "__main__":
  main()

