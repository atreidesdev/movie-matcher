import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Optional, Union
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._model is None:
            logger.info(f"Loading embedding model: {settings.embedding_model}")
            self._model = SentenceTransformer(settings.embedding_model)
            logger.info("Embedding model loaded successfully")

    def encode(self, text: str) -> np.ndarray:
        """Encode a single text into a vector embedding."""
        return self._model.encode(text, normalize_embeddings=True)

    def encode_batch(self, texts: List[str]) -> np.ndarray:
        """Encode multiple texts into vector embeddings."""
        return self._model.encode(texts, normalize_embeddings=True)

    def create_media_embedding(
        self,
        title: str,
        description: Optional[str] = None,
        genres: Optional[List[str]] = None,
        themes: Optional[List[str]] = None,
        *,
        characters: Optional[List[str]] = None,
        actors: Optional[List[str]] = None,
        directors: Optional[List[str]] = None,
        year: Optional[Union[int, str]] = None,
        rating: Optional[Union[float, str]] = None,
        studios: Optional[List[str]] = None,
        developers: Optional[List[str]] = None,
        publishers: Optional[List[str]] = None,
        authors: Optional[List[str]] = None,
    ) -> np.ndarray:
        """Create an embedding for a media item: title, description, genres, themes, cast, year, rating, studios, etc."""
        parts = [title]

        if description:
            parts.append(description[:500])

        if genres:
            parts.append(f"Genres: {', '.join(genres[:15])}")

        if themes:
            parts.append(f"Themes: {', '.join(themes[:15])}")

        if characters:
            parts.append(f"Characters: {', '.join(characters[:20])}")

        if directors:
            parts.append(f"Directors: {', '.join(directors[:10])}")

        if actors:
            parts.append(f"Cast: {', '.join(actors[:20])}")

        if year is not None:
            parts.append(f"Year: {year}")

        if rating is not None:
            parts.append(f"Rating: {rating}")

        if studios:
            parts.append(f"Studios: {', '.join(studios[:10])}")

        if developers:
            parts.append(f"Developers: {', '.join(developers[:10])}")

        if publishers:
            parts.append(f"Publishers: {', '.join(publishers[:10])}")

        if authors:
            parts.append(f"Authors: {', '.join(authors[:15])}")

        combined_text = build_media_embedding_text(
            title=title, description=description, genres=genres, themes=themes,
            characters=characters, actors=actors, directors=directors,
            year=year, rating=rating, studios=studios,
            developers=developers, publishers=publishers, authors=authors,
        )
        return self.encode(combined_text)

    def create_user_preference_embedding(
        self,
        favorite_genres: List[str],
        favorite_themes: Optional[List[str]] = None,
        high_rated_descriptions: Optional[List[str]] = None
    ) -> np.ndarray:
        """Create an embedding representing user preferences."""
        parts = []

        if favorite_genres:
            parts.append(f"Preferred genres: {', '.join(favorite_genres)}")

        if favorite_themes:
            parts.append(f"Preferred themes: {', '.join(favorite_themes)}")

        if high_rated_descriptions:
            for desc in high_rated_descriptions[:5]:
                parts.append(desc[:200])

        if not parts:
            return np.zeros(settings.vector_dim)

        combined_text = " | ".join(parts)
        return self.encode(combined_text)


def build_media_embedding_text(
    title: str,
    description: Optional[str] = None,
    genres: Optional[List[str]] = None,
    themes: Optional[List[str]] = None,
    *,
    characters: Optional[List[str]] = None,
    actors: Optional[List[str]] = None,
    directors: Optional[List[str]] = None,
    year: Optional[Union[int, str]] = None,
    rating: Optional[Union[float, str]] = None,
    studios: Optional[List[str]] = None,
    developers: Optional[List[str]] = None,
    publishers: Optional[List[str]] = None,
    authors: Optional[List[str]] = None,
) -> str:
    """Build the text string used for media embedding (shared with batch encoding)."""
    parts = [title]
    if description:
        parts.append(description[:500])
    if genres:
        parts.append(f"Genres: {', '.join(genres[:15])}")
    if themes:
        parts.append(f"Themes: {', '.join(themes[:15])}")
    if characters:
        parts.append(f"Characters: {', '.join(characters[:20])}")
    if directors:
        parts.append(f"Directors: {', '.join(directors[:10])}")
    if actors:
        parts.append(f"Cast: {', '.join(actors[:20])}")
    if year is not None:
        parts.append(f"Year: {year}")
    if rating is not None:
        parts.append(f"Rating: {rating}")
    if studios:
        parts.append(f"Studios: {', '.join(studios[:10])}")
    if developers:
        parts.append(f"Developers: {', '.join(developers[:10])}")
    if publishers:
        parts.append(f"Publishers: {', '.join(publishers[:10])}")
    if authors:
        parts.append(f"Authors: {', '.join(authors[:15])}")
    return " | ".join(parts)


def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()
