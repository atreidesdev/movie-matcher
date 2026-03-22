"""
Режим без БД: загрузка тестовых данных из fixtures/mock_media.json,
построение эмбеддингов и заполнение vector_store. Для get_similar сохраняем
(media_type, media_id) -> embedding в DEMO_EMBEDDING_MAP.
"""
import json
import logging
from pathlib import Path
from typing import Dict, Tuple, Any, List

from app.config import get_settings
from app.services.embedding_service import get_embedding_service
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)

# Ключ: (media_type, media_id), значение: embedding (для get_similar в demo-режиме)
DEMO_EMBEDDING_MAP: Dict[Tuple[str, int], Any] = {}

# Сырые объекты из mock_media.json (+ сгенерированные) для demo-рекомендаций
DEMO_ITEMS: List[dict] = []

# Элементы списков пользователей из mock_list_items.json (user_id, media_type, media_id, status, rating)
DEMO_LIST_ITEMS: List[dict] = []


def _fixture_path() -> Path:
    return Path(__file__).resolve().parent.parent / "fixtures" / "mock_media.json"


def _list_items_path() -> Path:
    return Path(__file__).resolve().parent.parent / "fixtures" / "mock_list_items.json"


def load_and_index() -> None:
    """Загрузить mock_media.json, построить эмбеддинги, заполнить vector_store. Очищает индекс перед заполнением."""
    path = _fixture_path()
    if not path.exists():
        logger.warning("Fixture %s not found, demo index will be empty", path)
        return

    with open(path, "r", encoding="utf-8") as f:
        items: List[dict] = json.load(f)

    if not items:
        return

    # Сохраняем элементы (с обогащёнными полями) для demo-режима
    global DEMO_ITEMS
    DEMO_ITEMS = []

    embedding_service = get_embedding_service()
    vector_store = get_vector_store()
    vector_store.clear()
    DEMO_EMBEDDING_MAP.clear()

    batch: List[dict] = []
    for row in items:
        title = row.get("title", "")
        description = row.get("description") or ""
        genres = row.get("genres") or []
        themes = row.get("themes") or []
        year = row.get("year")
        rating = row.get("rating")
        media_type = row.get("media_type", "movie")
        media_id = int(row.get("id", 0))

        # Дополнительные поля (каст и персонал) — читаем из JSON или подставляем дефолтные.
        actors = row.get("actors") or []
        characters = row.get("characters") or []
        directors = row.get("directors") or []
        studios = row.get("studios") or []
        authors = row.get("authors") or []
        developers = row.get("developers") or []
        publishers = row.get("publishers") or []

        if media_type == "movie":
            if not directors:
                directors = [f"{title} Director"]
            if not actors:
                actors = [f"{title} Lead Actor"]
            if not characters:
                characters = [f"{title} Protagonist"]
            if not studios:
                studios = ["Demo Studio"]
        elif media_type in ("animeSeries", "anime", "anime_movie", "animeMovie"):
            if not authors:
                authors = [f"{title} Author"]
            if not studios:
                studios = ["Demo Anime Studio"]
        elif media_type == "game":
            if not developers:
                developers = [f"{title} Dev Studio"]
            if not publishers:
                publishers = ["Demo Publisher"]

        embedding = embedding_service.create_media_embedding(
            title=title,
            description=description if description else None,
            genres=genres if genres else None,
            themes=themes if themes else None,
            year=year,
            rating=rating,
            characters=characters or None,
            directors=directors or None,
            actors=actors or None,
            studios=studios or None,
            authors=authors or None,
            developers=developers or None,
            publishers=publishers or None,
        )
        DEMO_EMBEDDING_MAP[(media_type, media_id)] = embedding

        DEMO_ITEMS.append({
            "media_type": media_type,
            "id": media_id,
            "title": title,
            "description": description,
            "genres": genres,
            "themes": themes,
            "year": year,
            "rating": rating,
            "actors": actors,
            "characters": characters,
            "directors": directors,
            "studios": studios,
            "authors": authors,
            "developers": developers,
            "publishers": publishers,
        })
        batch.append({
            "media_id": media_id,
            "media_type": media_type,
            "title": title,
            "embedding": embedding,
            "metadata": {
                "poster": None,
                "description": (description or "")[:200],
            },
        })

    if batch:
        vector_store.add_embeddings_batch(batch)
        vector_store.save()
    logger.info("Demo mode: indexed %d items from %s", len(batch), path.name)

    # Загрузка лист-айтемов для персональных рекомендаций
    list_path = _list_items_path()
    global DEMO_LIST_ITEMS
    DEMO_LIST_ITEMS = []
    if list_path.exists():
        try:
            with open(list_path, "r", encoding="utf-8") as f:
                DEMO_LIST_ITEMS = json.load(f)
            logger.info("Demo mode: loaded %d list items from %s", len(DEMO_LIST_ITEMS), list_path.name)
        except Exception as e:
            logger.warning("Failed to load list items from %s: %s", list_path, e)


def is_demo_mode() -> bool:
    return get_settings().use_mock_data


def get_demo_items() -> List[dict]:
    """Вернуть сырые элементы (mock_media.json + сгенерированные) для demo-рекомендаций."""
    return DEMO_ITEMS


def get_demo_list_items() -> List[dict]:
    """Вернуть элементы списков пользователей из mock_list_items.json (user_id, media_type, media_id, status, rating)."""
    return DEMO_LIST_ITEMS


def get_demo_profiles() -> dict:
    """Собрать из DEMO_LIST_ITEMS профили: { user_id: { media_type: [media_id, ...] } } для персональных рекомендаций."""
    profiles: Dict[int, Dict[str, List[int]]] = {}
    for row in DEMO_LIST_ITEMS:
        uid = int(row.get("user_id", 0))
        mt = row.get("media_type") or "movie"
        mid = int(row.get("media_id", 0))
        if uid and mid:
            if uid not in profiles:
                profiles[uid] = {}
            if mt not in profiles[uid]:
                profiles[uid][mt] = []
            if mid not in profiles[uid][mt]:
                profiles[uid][mt].append(mid)
    return profiles
