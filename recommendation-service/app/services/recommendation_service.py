import numpy as np
from typing import List, Optional, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

from app.config import get_settings
from app.models.schemas import (
    RecommendedItem,
    RecommendationResponse,
    SimilarResponse,
    SimilarUsersResponse,
    SimilarUserItem,
    SemanticSearchResponse,
    SemanticSearchItem,
)
from app.services.embedding_service import get_embedding_service
from app.services.vector_store import get_vector_store
from app.services.similar_compute import _fetch_media_with_meta

logger = logging.getLogger(__name__)

settings = get_settings()


class RecommendationService:
    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store()
        # Работаем только от БД. Fixtures/demo-режим удалён.
        self.engine = create_engine(settings.database_url)
        self.Session = sessionmaker(bind=self.engine)

    def get_user_preferences(self, user_id: int) -> dict:
        """Fetch user preferences from the database based on their activity."""
        session = self.Session()
        try:
            genres_query = text("""
                SELECT DISTINCT g.name, COUNT(*) as count
                FROM genres g
                JOIN movie_genres mg ON g.id = mg.genre_id
                JOIN movie_reviews mr ON mg.movie_id = mr.movie_id
                WHERE mr.user_id = :user_id AND mr.overall_rating >= 7
                GROUP BY g.name
                ORDER BY count DESC
                LIMIT 10
            """)

            result = session.execute(genres_query, {"user_id": user_id})
            favorite_genres = [row[0] for row in result]

            watched_query = text("""
                SELECT movie_id FROM movie_lists WHERE user_id = :user_id
                UNION
                SELECT movie_id FROM movie_reviews WHERE user_id = :user_id
            """)
            result = session.execute(watched_query, {"user_id": user_id})
            watched_ids = [row[0] for row in result]

            return {
                "favorite_genres": favorite_genres if favorite_genres else ["Action", "Drama", "Comedy"],
                "watched_ids": watched_ids
            }
        except Exception as e:
            logger.warning(f"Failed to fetch user preferences: {e}")
            return {
                "favorite_genres": ["Action", "Drama", "Comedy"],
                "watched_ids": []
            }
        finally:
            session.close()

    def get_recommendations(
        self,
        user_id: int,
        media_type: str = "movie",
        limit: int = 10
    ) -> RecommendationResponse:
        """Тип 2: рекомендации пользователя. Сначала предикт из content_similar по лайкнутым, затем векторный поиск по эмбеддингу предпочтений, при нехватке — fallback по рейтингу."""

        recs = self._get_personal_recommendations_from_similar(user_id=user_id, media_type=media_type, limit=limit)
        if recs:
            return RecommendationResponse(
                recommendations=recs,
                user_id=user_id,
                media_type=media_type
            )

        preferences = self.get_user_preferences(user_id)
        user_embedding = self.embedding_service.create_user_preference_embedding(
            favorite_genres=preferences["favorite_genres"]
        )
        results = self.vector_store.search(
            query_embedding=user_embedding,
            k=limit,
            media_type=media_type,
            exclude_ids=preferences["watched_ids"]
        )
        recommendations = []
        for item, score in results:
            recommendations.append(RecommendedItem(
                media_id=item["media_id"],
                title=item["title"],
                score=round(score, 4),
                poster=item["metadata"].get("poster"),
                description=item["metadata"].get("description")
            ))
        if len(recommendations) < limit:
            recommendations.extend(self._get_fallback_recommendations(
                media_type=media_type,
                exclude_ids=preferences["watched_ids"] + [r.media_id for r in recommendations],
                limit=limit - len(recommendations)
            ))
        return RecommendationResponse(
            recommendations=recommendations,
            user_id=user_id,
            media_type=media_type
        )

    def _get_personal_recommendations_from_similar(
        self,
        user_id: int,
        media_type: str,
        limit: int
    ) -> List[RecommendedItem]:
        """Recommendations from content_similar: get user's liked items, then similar items, aggregate and rank."""
        session = self.Session()
        try:
            liked = self._get_user_liked_entity_ids(session, user_id)
            if not liked:
                return []

            scores: dict = {}
            for (et, eid) in liked:
                q = text("""
                    SELECT similar_entity_type, similar_entity_id, score
                    FROM content_similar
                    WHERE entity_type = :et AND entity_id = :eid
                    ORDER BY score DESC
                    LIMIT 50
                """)
                rows = session.execute(q, {"et": et, "eid": eid}).fetchall()
                for st, sid, score in rows:
                    if (st, sid) in liked:
                        continue
                    key = (st, sid)
                    scores[key] = scores.get(key, 0) + score

            if not scores:
                return []

            sorted_items = sorted(scores.items(), key=lambda x: -x[1])[: limit * 2]
            norm = self._normalize_media_type(media_type)
            if norm:
                sorted_items = [(k, v) for k, v in sorted_items if k[0] == norm][:limit]
            else:
                sorted_items = sorted_items[:limit]

            out = []
            table_map = self._get_table_name
            for (st, sid), score in sorted_items:
                title, poster, desc = self._get_media_title_poster(session, st, sid)
                if title is None:
                    continue
                out.append(RecommendedItem(
                    media_id=sid,
                    title=title,
                    score=round(score, 4),
                    poster=poster,
                    description=desc
                ))
                if len(out) >= limit:
                    break
            return out
        except Exception as e:
            logger.warning(f"Personal recs from similar failed: {e}")
            return []
        finally:
            session.close()

    def _get_user_liked_entity_ids(self, session, user_id: int) -> List[Tuple[str, int]]:
        """(entity_type, entity_id) из списков и избранного пользователя."""
        out = set()
        tables = [
            ("movie", "movie_lists", "movie_id"), ("movie", "movie_favorites", "movie_id"),
            ("tv_series", "tv_series_lists", "tv_series_id"), ("tv_series", "tv_series_favorites", "tv_series_id"),
            ("anime_series", "anime_series_lists", "anime_series_id"), ("anime_series", "anime_series_favorites", "anime_series_id"),
            ("cartoon_series", "cartoon_series_lists", "cartoon_series_id"), ("cartoon_series", "cartoon_series_favorites", "cartoon_series_id"),
            ("cartoon_movie", "cartoon_movie_lists", "cartoon_movie_id"), ("cartoon_movie", "cartoon_movie_favorites", "cartoon_movie_id"),
            ("anime_movie", "anime_movie_lists", "anime_movie_id"), ("anime_movie", "anime_movie_favorites", "anime_movie_id"),
            ("manga", "manga_lists", "manga_id"), ("manga", "manga_favorites", "manga_id"),
            ("game", "game_lists", "game_id"), ("game", "game_favorites", "game_id"),
            ("book", "book_lists", "book_id"), ("book", "book_favorites", "book_id"),
            ("light_novel", "light_novel_lists", "light_novel_id"), ("light_novel", "light_novel_favorites", "light_novel_id"),
        ]
        for et, table, col in tables:
            try:
                r = session.execute(text(f"SELECT {col} FROM {table} WHERE user_id = :uid"), {"uid": user_id}).fetchall()
                for row in r:
                    out.add((et, row[0]))
            except Exception:
                pass
        return list(out)

    def _get_media_title_poster(self, session, entity_type: str, entity_id: int):
        """(title, poster, description) for an entity from DB."""
        table_name = self._get_table_name(entity_type) or self._table_for_entity_type(entity_type)
        if not table_name:
            return None, None, None
        try:
            q = text(f"SELECT title, poster, description FROM {table_name} WHERE id = :eid")
            row = session.execute(q, {"eid": entity_id}).fetchone()
            if row:
                return row[0], row[1], (row[2][:200] if row[2] else None)
        except Exception:
            pass
        return None, None, None

    def _table_for_entity_type(self, et: str):
        m = {
            "movie": "movies", "tv_series": "tv_series", "anime_series": "anime_series",
            "cartoon_series": "cartoon_series", "cartoon_movie": "cartoon_movies",
            "anime_movie": "anime_movies", "manga": "mangas", "game": "games",
            "book": "books", "light_novel": "light_novels"
        }
        return m.get(et)

    def _normalize_media_type(self, mt: str) -> Optional[str]:
        """API media_type (movie, tvSeries) -> DB entity_type (movie, tv_series)."""
        m = {"movie": "movie", "tvSeries": "tv_series", "animeSeries": "anime_series",
             "cartoonSeries": "cartoon_series", "cartoonMovie": "cartoon_movie",
             "animeMovie": "anime_movie", "manga": "manga", "game": "game",
             "book": "book", "lightNovel": "light_novel"}
        return m.get(mt) or mt

    # Demo-режим и mock-рекомендации отключены; сервис всегда работает по реальным данным БД и векторному хранилищу.

    def get_similar(
        self,
        media_id: str,
        media_type: str,
        limit: int = 10
    ) -> SimilarResponse:
        """Тип 1: похожее для страницы деталей. По эмбеддингу данного медиа ищет ближайшие в FAISS (онлайновый вариант; предвычисленные хранятся в content_similar и отдаются бэкендом через /similar/store/...)."""
        media_embedding = self._get_media_embedding(int(media_id), media_type)

        if media_embedding is None:
            return SimilarResponse(
                similar=[],
                media_id=media_id,
                media_type=media_type
            )

        results = self.vector_store.search(
            query_embedding=media_embedding,
            k=limit + 1,
            media_type=media_type,
            exclude_ids=[int(media_id)]
        )

        similar = []
        for item, score in results[:limit]:
            similar.append(RecommendedItem(
                media_id=item["media_id"],
                title=item["title"],
                score=round(score, 4),
                poster=item["metadata"].get("poster"),
                description=item["metadata"].get("description")
            ))

        return SimilarResponse(
            similar=similar,
            media_id=media_id,
            media_type=media_type
        )

    def get_similar_users(self, user_id: int, limit: int = 20) -> SimilarUsersResponse:
        """Похожие пользователи по пересечению списков и оценок (по вкусам)."""
        return self._get_db_similar_users(user_id=user_id, limit=limit)

    def _get_db_similar_users(self, user_id: int, limit: int) -> SimilarUsersResponse:
        """По БД: список entity (type, id) пользователя; для каждого ищем других юзеров в list/favorite; считаем пересечение."""
        session = self.Session()
        try:
            my_liked = set(self._get_user_liked_entity_ids(session, user_id))
            if not my_liked:
                return SimilarUsersResponse(user_id=user_id, similar_users=[])

            tables = [
                ("movie", "movie_lists", "movie_id"), ("movie", "movie_favorites", "movie_id"),
                ("tv_series", "tv_series_lists", "tv_series_id"), ("tv_series", "tv_series_favorites", "tv_series_id"),
                ("anime_series", "anime_series_lists", "anime_series_id"), ("anime_series", "anime_series_favorites", "anime_series_id"),
                ("cartoon_series", "cartoon_series_lists", "cartoon_series_id"), ("cartoon_series", "cartoon_series_favorites", "cartoon_series_id"),
                ("cartoon_movie", "cartoon_movie_lists", "cartoon_movie_id"), ("cartoon_movie", "cartoon_movie_favorites", "cartoon_movie_id"),
                ("anime_movie", "anime_movie_lists", "anime_movie_id"), ("anime_movie", "anime_movie_favorites", "anime_movie_id"),
                ("game", "game_lists", "game_id"), ("game", "game_favorites", "game_id"),
                ("manga", "manga_lists", "manga_id"), ("manga", "manga_favorites", "manga_id"),
                ("book", "book_lists", "book_id"), ("book", "book_favorites", "book_id"),
                ("light_novel", "light_novel_lists", "light_novel_id"), ("light_novel", "light_novel_favorites", "light_novel_id"),
            ]
            overlap_count: dict = {}
            for et, table, col in tables:
                try:
                    rows = session.execute(
                        text(f"""
                            SELECT t.user_id, t.{col}
                            FROM {table} t
                            JOIN users u ON u.id = t.user_id
                            WHERE t.user_id != :uid
                              AND u.last_seen_at IS NOT NULL
                              AND u.last_seen_at >= NOW() - INTERVAL '31 days'
                        """),
                        {"uid": user_id},
                    ).fetchall()
                    for row in rows:
                        other_uid, eid = row[0], row[1]
                        if (et, eid) in my_liked:
                            overlap_count[other_uid] = overlap_count.get(other_uid, 0) + 1
                except Exception:
                    pass

            my_size = len(my_liked)
            scored = []
            for other_uid, count in overlap_count.items():
                if count == 0:
                    continue
                # Примерно нормализуем (без размера другого юзера — экономим запросы)
                score = count / (my_size ** 0.5)
                scored.append(SimilarUserItem(user_id=int(other_uid), score=round(score, 4)))
            scored.sort(key=lambda x: -x.score)
            return SimilarUsersResponse(user_id=user_id, similar_users=scored[:limit])
        except Exception as e:
            logger.warning("get_similar_users failed: %s", e)
            return SimilarUsersResponse(user_id=user_id, similar_users=[])
        finally:
            session.close()

    def search_by_query(
        self,
        query: str,
        media_type: Optional[str] = None,
        limit: int = 20
    ) -> SemanticSearchResponse:
        """Semantic search: encode query text and find similar media by embedding."""
        if not query or not query.strip():
            return SemanticSearchResponse(results=[])

        query_embedding = self.embedding_service.encode(query.strip())
        results = self.vector_store.search(
            query_embedding=query_embedding,
            k=limit,
            media_type=media_type,
        )
        items = []
        for item, score in results:
            items.append(SemanticSearchItem(
                media_id=item["media_id"],
                media_type=item["media_type"],
                title=item["title"],
                score=round(score, 4),
                poster=item.get("metadata", {}).get("poster"),
                description=item.get("metadata", {}).get("description"),
            ))
        return SemanticSearchResponse(results=items)

    def _get_media_embedding(self, media_id: int, media_type: str) -> Optional[np.ndarray]:
        """Get or create embedding for a specific media item (with full meta: cast, year, rating, etc.)."""
        session = self.Session()
        try:
            entity_type = self._normalize_media_type(media_type) or media_type
            rows = _fetch_media_with_meta(session, entity_type, entity_ids=[media_id])
            if not rows:
                return None
            row = rows[0]
            return self.embedding_service.create_media_embedding(
                title=row["title"],
                description=row.get("description"),
                genres=row["genre_names"] or None,
                themes=row["theme_names"] or None,
                characters=row["characters"] or None,
                directors=row["directors"] or None,
                actors=row["actors"] or None,
                year=row.get("year"),
                rating=row.get("rating"),
                studios=row["studios"] or None,
                authors=row["authors"] or None,
                developers=row["developers"] or None,
                publishers=row["publishers"] or None,
            )
        except Exception as e:
            logger.error(f"Failed to get media embedding: {e}")
            return None
        finally:
            session.close()

    def _get_table_name(self, media_type: str) -> Optional[str]:
        """Map media type to database table name."""
        mapping = {
            "movie": "movies",
            "tvSeries": "tv_series",
            "animeSeries": "anime_series",
            "cartoonSeries": "cartoon_series",
            "cartoonMovie": "cartoon_movies",
            "animeMovie": "anime_movies",
            "game": "games",
            "manga": "mangas",
            "book": "books",
            "lightNovel": "light_novels",
        }
        return mapping.get(media_type)

    def _get_fallback_recommendations(
        self,
        media_type: str,
        exclude_ids: List[int],
        limit: int
    ) -> List[RecommendedItem]:
        """Get fallback recommendations when vector search doesn't return enough results."""
        if self._demo_mode:
            return []
        session = self.Session()
        try:
            table_name = self._get_table_name(media_type)
            if not table_name:
                return []

            exclude_clause = ""
            if exclude_ids:
                exclude_clause = f"AND id NOT IN ({','.join(map(str, exclude_ids))})"

            query = text(f"""
                SELECT id, title, poster, description, rating
                FROM {table_name}
                WHERE rating IS NOT NULL {exclude_clause}
                ORDER BY rating DESC
                LIMIT :limit
            """)

            result = session.execute(query, {"limit": limit})

            recommendations = []
            for row in result:
                recommendations.append(RecommendedItem(
                    media_id=row[0],
                    title=row[1],
                    score=float(row[4]) / 10 if row[4] else 0.5,
                    poster=row[2],
                    description=row[3]
                ))

            return recommendations
        except Exception as e:
            logger.error(f"Failed to get fallback recommendations: {e}")
            return []
        finally:
            session.close()

    def index_media(self, media_type: str, batch_size: int = 100):
        """Index all media of a specific type into the vector store (with full meta: cast, year, rating, etc.)."""
        if self._demo_mode:
            return
        session = self.Session()
        try:
            table_name = self._get_table_name(media_type)
            if not table_name:
                return
            entity_type = self._normalize_media_type(media_type) or media_type

            count_query = text(f"SELECT COUNT(*) FROM {table_name}")
            total = session.execute(count_query).scalar()

            logger.info(f"Indexing {total} {media_type} items...")

            offset = 0
            while offset < total:
                id_query = text(f"""
                    SELECT id FROM {table_name}
                    ORDER BY id
                    LIMIT :limit OFFSET :offset
                """)
                batch_ids = [row[0] for row in session.execute(id_query, {"limit": batch_size, "offset": offset}).fetchall()]
                if not batch_ids:
                    break

                rows = _fetch_media_with_meta(session, entity_type, entity_ids=batch_ids)
                items = []
                for row in rows:
                    embedding = self.embedding_service.create_media_embedding(
                        title=row["title"],
                        description=row.get("description"),
                        genres=row["genre_names"] or None,
                        themes=row["theme_names"] or None,
                        characters=row["characters"] or None,
                        directors=row["directors"] or None,
                        actors=row["actors"] or None,
                        year=row.get("year"),
                        rating=row.get("rating"),
                        studios=row["studios"] or None,
                        authors=row["authors"] or None,
                        developers=row["developers"] or None,
                        publishers=row["publishers"] or None,
                    )
                    items.append({
                        "media_id": row["id"],
                        "media_type": media_type,
                        "title": row["title"],
                        "embedding": embedding,
                        "metadata": {
                            "poster": row.get("poster"),
                            "description": (row.get("description") or "")[:200]
                        }
                    })
                if items:
                    self.vector_store.add_embeddings_batch(items)
                offset += batch_size
                logger.info(f"Indexed {min(offset, total)}/{total} {media_type} items")

            self.vector_store.save()
            logger.info(f"Finished indexing {media_type}")

        except Exception as e:
            logger.error(f"Failed to index media: {e}")
        finally:
            session.close()


_recommendation_service: Optional[RecommendationService] = None


def get_recommendation_service() -> RecommendationService:
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
    return _recommendation_service
