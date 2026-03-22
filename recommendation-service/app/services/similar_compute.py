"""
Тип 1: предвычисление похожего для страницы деталей.
По описанию/темам/жанрам (source=content) и по совпадению выборов пользователей (source=users).
Запись в таблицу content_similar (entity_type, entity_id, similar_entity_type, similar_entity_id, source, score).
Эти же данные используются для типа 2 (рекомендации юзера) — агрегация похожих к лайкнутым тайтлам.
"""

import logging
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from collections import defaultdict
import numpy as np
from app.config import get_settings
from app.services.embedding_service import get_embedding_service, build_media_embedding_text

logger = logging.getLogger(__name__)

settings = get_settings()

# Типы медиа и соответствующие таблицы БД (GORM snake_case)
MEDIA_TYPES = [
    "movie", "tv_series", "anime_series", "cartoon_series", "cartoon_movie",
    "anime_movie", "manga", "game", "book", "light_novel"
]

# Таблицы списков/избранного для user-based similar (без tv_series_lists и т.д. — приводим к одному стилю)
LIST_FAV_TABLES = [
    ("movie", "movie_lists", "movie_id"),
    ("movie", "movie_favorites", "movie_id"),
    ("tv_series", "tv_series_lists", "tv_series_id"),
    ("tv_series", "tv_series_favorites", "tv_series_id"),
    ("anime_series", "anime_series_lists", "anime_series_id"),
    ("anime_series", "anime_series_favorites", "anime_series_id"),
    ("cartoon_series", "cartoon_series_lists", "cartoon_series_id"),
    ("cartoon_series", "cartoon_series_favorites", "cartoon_series_id"),
    ("cartoon_movie", "cartoon_movie_lists", "cartoon_movie_id"),
    ("cartoon_movie", "cartoon_movie_favorites", "cartoon_movie_id"),
    ("anime_movie", "anime_movie_lists", "anime_movie_id"),
    ("anime_movie", "anime_movie_favorites", "anime_movie_id"),
    ("manga", "manga_lists", "manga_id"),
    ("manga", "manga_favorites", "manga_id"),
    ("game", "game_lists", "game_id"),
    ("game", "game_favorites", "game_id"),
    ("book", "book_lists", "book_id"),
    ("book", "book_favorites", "book_id"),
    ("light_novel", "light_novel_lists", "light_novel_id"),
    ("light_novel", "light_novel_favorites", "light_novel_id"),
]

# Таблицы медиа: (table, join_genres, fk_col, join_themes, fk_col)
MEDIA_TABLE_META = {
    "movie": ("movies", "movie_genres", "movie_id", "movie_themes", "movie_id"),
    "tv_series": ("tv_series", "tvseries_genres", "tv_series_id", "tvseries_themes", "tv_series_id"),
    "anime_series": ("anime_series", "animeseries_genres", "anime_series_id", "animeseries_themes", "anime_series_id"),
    "cartoon_series": ("cartoon_series", "cartoonseries_genres", "cartoon_series_id", "cartoonseries_themes", "cartoon_series_id"),
    "cartoon_movie": ("cartoon_movies", "cartoonmovie_genres", "cartoon_movie_id", "cartoonmovie_themes", "cartoon_movie_id"),
    "anime_movie": ("anime_movies", "animemovie_genres", "anime_movie_id", "animemovie_themes", "anime_movie_id"),
    "manga": ("mangas", "manga_genres", "manga_id", "manga_themes", "manga_id"),
    "game": ("games", "game_genres", "game_id", "game_themes", "game_id"),
    "book": ("books", "book_genres", "book_id", "book_themes", "book_id"),
    "light_novel": ("light_novels", "lightnovel_genres", "light_novel_id", "lightnovel_themes", "light_novel_id"),
}

# Каст: (join_table, entity_fk_col). Режиссёры/актёры/персонажи из casts + persons + characters
MEDIA_CAST_JOIN = {
    "movie": ("movie_cast", "movie_id"),
    "tv_series": ("tvseries_cast", "tv_series_id"),
    "anime_series": ("animeseries_cast", "anime_series_id"),
    "cartoon_series": ("cartoonseries_cast", "cartoon_series_id"),
    "cartoon_movie": ("cartoonmovie_cast", "cartoon_movie_id"),
    "anime_movie": ("animemovie_cast", "anime_movie_id"),
}
# Студии: (join_table, entity_fk_col)
MEDIA_STUDIO_JOIN = {
    "movie": ("movie_studios", "movie_id"),
    "tv_series": ("tvseries_studios", "tv_series_id"),
    "anime_series": ("animeseries_studios", "anime_series_id"),
    "cartoon_series": ("cartoonseries_studios", "cartoon_series_id"),
    "cartoon_movie": ("cartoonmovie_studios", "cartoon_movie_id"),
    "anime_movie": ("animemovie_studios", "anime_movie_id"),
}
# Авторы: (join_table, entity_fk_col)
MEDIA_AUTHORS_JOIN = {
    "manga": ("manga_authors", "manga_id"),
    "book": ("book_authors", "book_id"),
    "light_novel": ("lightnovel_authors", "light_novel_id"),
}
# Иллюстраторы (доп. к авторам)
MEDIA_ILLUSTRATORS_JOIN = {"light_novel": ("lightnovel_illustrators", "light_novel_id")}
# Разработчики и издатели игр
MEDIA_DEV_PUB = {"game": ("game_developers", "game_id", "game_publishers", "game_id")}


def get_session():
    engine = create_engine(settings.database_url)
    return sessionmaker(bind=engine)()


def _fetch_media_with_meta(session, media_type: str, entity_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    """Возвращает список dict для каждого медиа: id, title, description, genre_names, theme_names, characters, directors, actors, year, rating, studios, authors, developers, publishers.
    Если entity_ids задан, возвращаются только эти записи."""
    if media_type not in MEDIA_TABLE_META:
        return []
    table, g_join, g_fk, t_join, t_fk = MEDIA_TABLE_META[media_type]
    if entity_ids is not None and not entity_ids:
        return []
    where_clause = " WHERE m.id = ANY(:eids)" if entity_ids is not None else ""
    params = {"eids": entity_ids} if entity_ids is not None else {}
    q = text(f"""
        SELECT m.id, m.title, m.description,
               EXTRACT(YEAR FROM m.release_date)::int AS year,
               m.rating, m.poster
        FROM {table} m
        {where_clause}
        ORDER BY m.id
    """)
    rows = session.execute(q, params).fetchall()
    if not rows:
        return []

    eids = [r[0] for r in rows]
    id_to_row = {r[0]: r for r in rows}

    # Жанры: id -> name, затем по сущности список имён
    g_rows = session.execute(text(f"SELECT {g_fk}, genre_id FROM {g_join} WHERE {g_fk} = ANY(:eids)"), {"eids": eids}).fetchall()
    genre_ids = list({x[1] for x in g_rows})
    genre_names = {}
    if genre_ids:
        for row in session.execute(text("SELECT id, name FROM genres WHERE id = ANY(:ids)"), {"ids": genre_ids}).fetchall():
            genre_names[row[0]] = row[1]
    eid_genres: Dict[int, List[str]] = defaultdict(list)
    for eid, gid in g_rows:
        if gid in genre_names:
            eid_genres[eid].append(genre_names[gid])

    # Темы: id -> name
    t_rows = session.execute(text(f"SELECT {t_fk}, theme_id FROM {t_join} WHERE {t_fk} = ANY(:eids)"), {"eids": eids}).fetchall()
    theme_ids = list({x[1] for x in t_rows})
    theme_names = {}
    if theme_ids:
        for row in session.execute(text("SELECT id, name FROM themes WHERE id = ANY(:ids)"), {"ids": theme_ids}).fetchall():
            theme_names[row[0]] = row[1]
    eid_themes: Dict[int, List[str]] = defaultdict(list)
    for eid, tid in t_rows:
        if tid in theme_names:
            eid_themes[eid].append(theme_names[tid])

    # Каст: персонажи, режиссёры, актёры
    eid_characters: Dict[int, List[str]] = defaultdict(list)
    eid_directors: Dict[int, List[str]] = defaultdict(list)
    eid_actors: Dict[int, List[str]] = defaultdict(list)
    if media_type in MEDIA_CAST_JOIN:
        cast_join, cast_fk = MEDIA_CAST_JOIN[media_type]
        cast_q = text(f"""
            SELECT mc.{cast_fk}, ch.name AS char_name,
                   TRIM(p.first_name || ' ' || p.last_name) AS person_name,
                   (p.profession::jsonb @> '["director"]') AS is_director,
                   (p.profession::jsonb @> '["actor"]' OR p.profession::jsonb @> '["actress"]') AS is_actor
            FROM {cast_join} mc
            JOIN casts c ON c.id = mc.cast_id
            LEFT JOIN characters ch ON ch.id = c.character_id
            LEFT JOIN persons p ON p.id = c.person_id
            WHERE mc.{cast_fk} = ANY(:eids)
        """)
        try:
            for row in session.execute(cast_q, {"eids": eids}).fetchall():
                eid, char_name, person_name, is_director, is_actor = row[0], row[1], row[2], row[3], row[4]
                if char_name:
                    eid_characters[eid].append(char_name)
                if person_name:
                    if is_director:
                        eid_directors[eid].append(person_name)
                    if is_actor:
                        eid_actors[eid].append(person_name)
        except Exception as e:
            logger.warning(f"Cast query for {media_type}: {e}")

    # Студии
    eid_studios: Dict[int, List[str]] = defaultdict(list)
    if media_type in MEDIA_STUDIO_JOIN:
        st_join, st_fk = MEDIA_STUDIO_JOIN[media_type]
        try:
            st_q = text(f"SELECT ms.{st_fk}, s.name FROM {st_join} ms JOIN studios s ON s.id = ms.studio_id WHERE ms.{st_fk} = ANY(:eids)")
            for row in session.execute(st_q, {"eids": eids}).fetchall():
                eid_studios[row[0]].append(row[1])
        except Exception as e:
            logger.warning(f"Studios query for {media_type}: {e}")

    # Авторы (manga, book, light_novel)
    eid_authors: Dict[int, List[str]] = defaultdict(list)
    if media_type in MEDIA_AUTHORS_JOIN:
        au_join, au_fk = MEDIA_AUTHORS_JOIN[media_type]
        try:
            au_q = text(f"SELECT ja.{au_fk}, TRIM(p.first_name || ' ' || p.last_name) FROM {au_join} ja JOIN persons p ON p.id = ja.person_id WHERE ja.{au_fk} = ANY(:eids)")
            for row in session.execute(au_q, {"eids": eids}).fetchall():
                eid_authors[row[0]].append(row[1])
        except Exception as e:
            logger.warning(f"Authors query for {media_type}: {e}")
    if media_type in MEDIA_ILLUSTRATORS_JOIN:
        ill_join, ill_fk = MEDIA_ILLUSTRATORS_JOIN[media_type]
        try:
            ill_q = text(f"SELECT ji.{ill_fk}, TRIM(p.first_name || ' ' || p.last_name) FROM {ill_join} ji JOIN persons p ON p.id = ji.person_id WHERE ji.{ill_fk} = ANY(:eids)")
            for row in session.execute(ill_q, {"eids": eids}).fetchall():
                eid_authors[row[0]].append(row[1] + " (illustrator)")
        except Exception as e:
            logger.warning(f"Illustrators query for {media_type}: {e}")

    # Разработчики и издатели (игры)
    eid_developers: Dict[int, List[str]] = defaultdict(list)
    eid_publishers: Dict[int, List[str]] = defaultdict(list)
    if media_type in MEDIA_DEV_PUB:
        dev_join, dev_fk, pub_join, pub_fk = MEDIA_DEV_PUB[media_type]
        try:
            for row in session.execute(text(f"SELECT gd.{dev_fk}, d.name FROM {dev_join} gd JOIN developers d ON d.id = gd.developer_id WHERE gd.{dev_fk} = ANY(:eids)"), {"eids": eids}).fetchall():
                eid_developers[row[0]].append(row[1])
            for row in session.execute(text(f"SELECT gp.{pub_fk}, p.name FROM {pub_join} gp JOIN publishers p ON p.id = gp.publisher_id WHERE gp.{pub_fk} = ANY(:eids)"), {"eids": eids}).fetchall():
                eid_publishers[row[0]].append(row[1])
        except Exception as e:
            logger.warning(f"Developers/publishers for {media_type}: {e}")

    out = []
    for eid in eids:
        r = id_to_row[eid]
        year_val = r[3] if len(r) > 3 and r[3] is not None else None
        rating_val = float(r[4]) if len(r) > 4 and r[4] is not None else None
        poster_val = r[5] if len(r) > 5 else None
        out.append({
            "id": eid,
            "title": r[1] or "",
            "description": r[2],
            "genre_names": list(dict.fromkeys(eid_genres[eid])),
            "theme_names": list(dict.fromkeys(eid_themes[eid])),
            "characters": list(dict.fromkeys(eid_characters[eid])),
            "directors": list(dict.fromkeys(eid_directors[eid])),
            "actors": list(dict.fromkeys(eid_actors[eid])),
            "year": year_val,
            "rating": rating_val,
            "studios": list(dict.fromkeys(eid_studios[eid])),
            "authors": list(dict.fromkeys(eid_authors[eid])),
            "developers": list(dict.fromkeys(eid_developers[eid])),
            "publishers": list(dict.fromkeys(eid_publishers[eid])),
            "poster": poster_val,
        })
    return out


def compute_and_store_similar_by_content(media_type: Optional[str] = None, same_limit: int = 15, cross_limit: int = 10):
    """По описанию/темам/жанрам: эмбеддинги, поиск ближайших same-type и cross-type, запись в content_similar."""
    session = get_session()
    emb = get_embedding_service()
    types_to_run = [media_type] if media_type else MEDIA_TYPES
    try:
        all_embeddings = {}
        all_texts = {}
        for mt in types_to_run:
            rows = _fetch_media_with_meta(session, mt)
            if not rows:
                continue
            for row in rows:
                text_val = build_media_embedding_text(
                    title=row["title"],
                    description=row["description"],
                    genres=row["genre_names"] or None,
                    themes=row["theme_names"] or None,
                    characters=row["characters"] or None,
                    directors=row["directors"] or None,
                    actors=row["actors"] or None,
                    year=row["year"],
                    rating=row["rating"],
                    studios=row["studios"] or None,
                    authors=row["authors"] or None,
                    developers=row["developers"] or None,
                    publishers=row["publishers"] or None,
                )
                all_texts[(mt, row["id"])] = text_val
            texts = [all_texts[(mt, row["id"])] for row in rows]
            vecs = emb.encode_batch(texts)
            for i, row in enumerate(rows):
                all_embeddings[(mt, row["id"])] = vecs[i]

        # Для каждого элемента: ближайшие same-type и cross-type по косинусу (уже нормализованы)
        to_insert = []
        for (et, eid), vec in all_embeddings.items():
            vec = vec.reshape(1, -1).astype("float32")
            candidates = []
            for (st, sid), v in all_embeddings.items():
                if (et, eid) == (st, sid):
                    continue
                score = float(np.dot(vec, v.reshape(-1, 1))[0, 0])
                candidates.append((st, sid, score))
            candidates.sort(key=lambda x: -x[2])

            same = [(st, sid, sc) for st, sid, sc in candidates if st == et][:same_limit]
            cross = [(st, sid, sc) for st, sid, sc in candidates if st != et][:cross_limit]
            for st, sid, sc in same:
                to_insert.append((et, eid, st, sid, "content", sc))
            for st, sid, sc in cross:
                to_insert.append((et, eid, st, sid, "content", sc))

        _delete_and_insert(session, to_insert, source="content", media_type=media_type)
        session.commit()
        logger.info(f"Stored {len(to_insert)} content-similar rows")
    finally:
        session.close()


def _delete_and_insert(session, rows: List[Tuple], source: str, media_type: Optional[str] = None):
    """Удалить старые записи по source (и опционально entity_type), вставить новые."""
    if media_type:
        session.execute(text("DELETE FROM content_similar WHERE source = :s AND entity_type = :t"), {"s": source, "t": media_type})
    else:
        session.execute(text("DELETE FROM content_similar WHERE source = :s"), {"s": source})
    for et, eid, set_, sid, src, score in rows:
        session.execute(text("""
            INSERT INTO content_similar (entity_type, entity_id, similar_entity_type, similar_entity_id, source, score, created_at)
            VALUES (:et, :eid, :set, :sid, :src, :score, NOW())
            ON CONFLICT DO NOTHING
        """), {"et": et, "eid": eid, "set": set_, "sid": sid, "src": src, "score": round(score, 6)})


def compute_and_store_similar_by_users(media_type: Optional[str] = None, same_limit: int = 15, cross_limit: int = 10):
    """По совпадению выборов пользователей: co-occurrence в списках/избранном, запись в content_similar."""
    session = get_session()
    try:
        user_items = defaultdict(set)
        for et, table, col in LIST_FAV_TABLES:
            if media_type and et != media_type:
                continue
            try:
                q = text(f"SELECT user_id, {col} FROM {table}")
                for row in session.execute(q).fetchall():
                    user_items[row[0]].add((et, row[1]))
            except Exception as e:
                logger.warning(f"Table {table} skip: {e}")

        item_pairs = defaultdict(lambda: defaultdict(float))
        for uid, items in user_items.items():
            items = list(items)
            for i in range(len(items)):
                for j in range(i + 1, len(items)):
                    a, b = items[i], items[j]
                    if a > b:
                        a, b = b, a
                    item_pairs[a][b] += 1.0
                    item_pairs[b][a] += 1.0

        to_insert = []
        for (et, eid), others in item_pairs.items():
            sorted_others = sorted(others.items(), key=lambda x: -x[1])
            same = [(st, sid, sc) for (st, sid), sc in sorted_others if st == et][:same_limit]
            cross = [(st, sid, sc) for (st, sid), sc in sorted_others if st != et][:cross_limit]
            max_s = max([sc for _, _, sc in same]) if same else 1.0
            max_c = max([sc for _, _, sc in cross]) if cross else 1.0
            for st, sid, sc in same:
                to_insert.append((et, eid, st, sid, "users", sc / max_s if max_s else 0))
            for st, sid, sc in cross:
                to_insert.append((et, eid, st, sid, "users", sc / max_c if max_c else 0))

        _delete_and_insert(session, to_insert, source="users", media_type=media_type)
        session.commit()
        logger.info(f"Stored {len(to_insert)} user-similar rows")
    finally:
        session.close()


def compute_all_similar(media_type: Optional[str] = None):
    """Запуск обоих расчётов и запись в БД."""
    compute_and_store_similar_by_content(media_type=media_type)
    compute_and_store_similar_by_users(media_type=media_type)
