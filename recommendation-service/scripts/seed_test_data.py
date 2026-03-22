#!/usr/bin/env python3
"""
Сид тестовых данных для прогона рекомендаций и семантического поиска.
Требует: PostgreSQL с применёнными миграциями (запуск backend хотя бы раз).
Читает DATABASE_URL из .env в корне recommendation-service или из окружения.
"""
import os
import sys
from datetime import date
from pathlib import Path

# корень recommendation-service
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# загрузка .env до импорта app
def load_env():
    env_path = ROOT / ".env"
    if env_path.exists():
        from dotenv import load_dotenv
        load_dotenv(env_path)
    # можно переопределить из родительского .env
    parent_env = ROOT.parent / ".env"
    if parent_env.exists():
        from dotenv import load_dotenv
        load_dotenv(parent_env)

load_env()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/movie_matcher?sslmode=disable")

# Базовые фильмы для индекса и семантического поиска
MOVIES = [
    ("Inception", "A thief who steals corporate secrets through dream-sharing technology is offered a chance to have his criminal record erased. Sci-fi, thriller, mind-bending.", 8.8, date(2010, 7, 16)),
    ("The Dark Knight", "Batman must accept one of the greatest psychological and physical tests to fight injustice. Superhero, crime, drama.", 9.0, date(2008, 7, 18)),
    ("Interstellar", "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. Sci-fi, adventure, space.", 8.6, date(2014, 11, 7)),
    ("Pulp Fiction", "Various interconnected stories of crime and redemption in Los Angeles. Crime, drama, nonlinear.", 8.9, date(1994, 10, 14)),
    ("Shutter Island", "A marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane. Thriller, mystery, psychological.", 8.2, date(2010, 2, 19)),
    ("The Matrix", "A computer hacker learns about the true nature of reality. Sci-fi, action, cyberpunk.", 8.7, date(1999, 3, 31)),
]

# Тестовые аниме
ANIME = [
    ("Attack on Titan", "Humans live behind walls protecting them from giant humanoid Titans. Action, drama, dark fantasy, apocalyptic.", 8.9, date(2013, 4, 7)),
    ("Death Note", "A student finds a notebook that kills anyone whose name is written in it. Psychological thriller, supernatural.", 8.6, date(2006, 10, 4)),
    ("Steins;Gate", "A self-proclaimed mad scientist invents a way to send messages to the past. Sci-fi, thriller, time travel.", 9.0, date(2011, 4, 6)),
]

# Тестовые игры
GAMES = [
    ("The Witcher 3: Wild Hunt", "Open-world RPG about a monster hunter in a dark fantasy world. RPG, action, open world, fantasy.", 9.2, date(2015, 5, 19)),
    ("Elden Ring", "Action RPG in a vast world created by FromSoftware. RPG, souls-like, open world, fantasy.", 9.5, date(2022, 2, 25)),
    ("Half-Life 2", "Gordon Freeman fights against an alien regime. FPS, sci-fi, story-driven.", 9.6, date(2004, 11, 16)),
]


def run(engine):
    with engine.connect() as conn:
        # Жанры (если ещё нет)
        if conn.execute(text("SELECT COUNT(*) FROM genres")).scalar() == 0:
            for name in ["Sci-Fi", "Thriller", "Drama", "Action", "Fantasy", "Crime", "Adventure", "Mystery", "Horror", "Animation"]:
                conn.execute(text("INSERT INTO genres (name, created_at, updated_at) VALUES (:name, NOW(), NOW())"), {"name": name})
        conn.commit()

        # Темы (если ещё нет)
        if conn.execute(text("SELECT COUNT(*) FROM themes")).scalar() == 0:
            for name in ["Time travel", "Apocalypse", "Superhero", "Noir"]:
                conn.execute(text("INSERT INTO themes (name, created_at, updated_at) VALUES (:name, NOW(), NOW())"), {"name": name})
        conn.commit()

        # ID жанра и темы для связки (берём первые)
        genre_id = conn.execute(text("SELECT id FROM genres ORDER BY id LIMIT 1")).scalar()
        theme_id = conn.execute(text("SELECT id FROM themes ORDER BY id LIMIT 1")).scalar()
        if not genre_id or not theme_id:
            print("Добавьте вручную жанры и темы или выполните миграции бэкенда.")
            return

        # Фильмы (идемпотентно: только если ещё нет)
        for title, description, rating, release_date in MOVIES:
            exists = conn.execute(text("SELECT 1 FROM movies WHERE title = :t"), {"t": title}).first()
            if not exists:
                conn.execute(
                    text("""
                        INSERT INTO movies (title, description, release_date, rating, created_at, updated_at)
                        VALUES (:title, :description, :release_date, :rating, NOW(), NOW())
                    """),
                    {"title": title, "description": description, "release_date": release_date, "rating": float(rating)}
                )
        conn.commit()

        # Дополнительные фильмы для более плотного индекса (до ~50 записей в movies)
        movie_count = conn.execute(text("SELECT COUNT(*) FROM movies")).scalar() or 0
        if movie_count < 50:
            base_date = date(2000, 1, 1)
            for i in range(movie_count + 1, 51):
                title = f"Demo Movie {i}"
                exists = conn.execute(text("SELECT 1 FROM movies WHERE title = :t"), {"t": title}).first()
                if exists:
                    continue
                year_offset = (i % 20)
                release_date = date(base_date.year + year_offset, (i % 12) + 1, (i % 27) + 1)
                rating = 6.0 + (i % 40) * 0.1  # 6.0–9.9
                conn.execute(
                    text("""
                        INSERT INTO movies (title, description, release_date, rating, created_at, updated_at)
                        VALUES (:title, :description, :release_date, :rating, NOW(), NOW())
                    """),
                    {
                        "title": title,
                        "description": "Demo movie for recommendation testing. Mixed genres, used for vector search and personal recommendations.",
                        "release_date": release_date,
                        "rating": float(rating),
                    },
                )
            conn.commit()

        # Связи movie_genres, movie_themes для всех фильмов
        for title, _, _, _ in MOVIES:
            r = conn.execute(text("SELECT id FROM movies WHERE title = :t"), {"t": title}).first()
            if r:
                mid = r[0]
                conn.execute(text("INSERT INTO movie_genres (movie_id, genre_id) VALUES (:mid, :gid) ON CONFLICT DO NOTHING"), {"mid": mid, "gid": genre_id})
                conn.execute(text("INSERT INTO movie_themes (movie_id, theme_id) VALUES (:mid, :tid) ON CONFLICT DO NOTHING"), {"mid": mid, "tid": theme_id})
        conn.commit()

        # Аниме (таблица anime_series)
        for title, description, rating, release_date in ANIME:
            exists = conn.execute(text("SELECT 1 FROM anime_series WHERE title = :t"), {"t": title}).first()
            if not exists:
                conn.execute(
                    text("""
                        INSERT INTO anime_series (title, description, release_date, rating, created_at, updated_at)
                        VALUES (:title, :description, :release_date, :rating, NOW(), NOW())
                    """),
                    {"title": title, "description": description, "release_date": release_date, "rating": float(rating)}
                )
        conn.commit()
        for title, _, _, _ in ANIME:
            r = conn.execute(text("SELECT id FROM anime_series WHERE title = :t"), {"t": title}).first()
            if r:
                aid = r[0]
                conn.execute(text("INSERT INTO animeseries_genres (anime_series_id, genre_id) VALUES (:aid, :gid) ON CONFLICT DO NOTHING"), {"aid": aid, "gid": genre_id})
                conn.execute(text("INSERT INTO animeseries_themes (anime_series_id, theme_id) VALUES (:aid, :tid) ON CONFLICT DO NOTHING"), {"aid": aid, "tid": theme_id})
        conn.commit()

        # Игры
        for title, description, rating, release_date in GAMES:
            exists = conn.execute(text("SELECT 1 FROM games WHERE title = :t"), {"t": title}).first()
            if not exists:
                conn.execute(
                    text("""
                        INSERT INTO games (title, description, release_date, rating, created_at, updated_at)
                        VALUES (:title, :description, :release_date, :rating, NOW(), NOW())
                    """),
                    {"title": title, "description": description, "release_date": release_date, "rating": float(rating)}
                )
        conn.commit()
        for title, _, _, _ in GAMES:
            r = conn.execute(text("SELECT id FROM games WHERE title = :t"), {"t": title}).first()
            if r:
                gid_entity = r[0]
                conn.execute(text("INSERT INTO game_genres (game_id, genre_id) VALUES (:gid, :genre_id) ON CONFLICT DO NOTHING"), {"gid": gid_entity, "genre_id": genre_id})
                conn.execute(text("INSERT INTO game_themes (game_id, theme_id) VALUES (:gid, :tid) ON CONFLICT DO NOTHING"), {"gid": gid_entity, "tid": theme_id})
        conn.commit()

        # Списки и отзывы для user_id=1 (если пользователь уже есть — например создан бэкендом)
        user_exists = conn.execute(text("SELECT 1 FROM users WHERE id = 1")).first()
        if user_exists:
            movie_ids = [row[0] for row in conn.execute(text("SELECT id FROM movies ORDER BY id LIMIT 40")).fetchall()]
            anime_ids = [row[0] for row in conn.execute(text("SELECT id FROM anime_series ORDER BY id LIMIT 10")).fetchall()]
            game_ids = [row[0] for row in conn.execute(text("SELECT id FROM games ORDER BY id LIMIT 10")).fetchall()]
            statuses = ["planned", "watching", "completed", "onHold", "dropped", "rewatching"]

            # Фильмы: разнообразные статусы и оценки
            for idx, mid in enumerate(movie_ids):
                status = statuses[idx % len(statuses)]
                rating = 6 + (idx % 5)  # 6–10
                conn.execute(
                    text("""
                        INSERT INTO movie_lists (user_id, movie_id, status, created_at, updated_at)
                        VALUES (1, :mid, :status, NOW(), NOW())
                        ON CONFLICT DO NOTHING
                    """),
                    {"mid": mid, "status": status},
                )
                conn.execute(
                    text("""
                        INSERT INTO movie_reviews (user_id, movie_id, overall_rating, created_at, updated_at)
                        VALUES (1, :mid, :rating, NOW(), NOW())
                        ON CONFLICT DO NOTHING
                    """),
                    {"mid": mid, "rating": int(rating)},
                )

            # Аниме: списки и оценки
            for idx, aid in enumerate(anime_ids):
                status = statuses[(idx + 1) % len(statuses)]
                rating = 7 + (idx % 4)  # 7–10
                conn.execute(
                    text("""
                        INSERT INTO anime_series_lists (user_id, anime_series_id, status, created_at, updated_at)
                        VALUES (1, :aid, :status, NOW(), NOW())
                        ON CONFLICT DO NOTHING
                    """),
                    {"aid": aid, "status": status},
                )
                conn.execute(
                    text("""
                        INSERT INTO anime_series_reviews (user_id, anime_series_id, overall_rating, created_at, updated_at)
                        VALUES (1, :aid, :rating, NOW(), NOW())
                        ON CONFLICT DO NOTHING
                    """),
                    {"aid": aid, "rating": int(rating)},
                )

            # Игры: списки и оценки
            for idx, gid in enumerate(game_ids):
                status = statuses[(idx + 2) % len(statuses)]
                rating = 7 + (idx % 4)
                conn.execute(
                    text("""
                        INSERT INTO game_lists (user_id, game_id, status, created_at, updated_at)
                        VALUES (1, :gid, :status, NOW(), NOW())
                        ON CONFLICT DO NOTHING
                    """),
                    {"gid": gid, "status": status},
                )
                conn.execute(
                    text("""
                        INSERT INTO game_reviews (user_id, game_id, overall_rating, created_at, updated_at)
                        VALUES (1, :gid, :rating, NOW(), NOW())
                        ON CONFLICT DO NOTHING
                    """),
                    {"gid": gid, "rating": int(rating)},
                )
        conn.commit()

    print("Seed выполнен: фильмы (до 50), аниме, игры, жанры/темы, списки и отзывы для user_id=1.")


if __name__ == "__main__":
    try:
        engine = create_engine(DATABASE_URL)
        run(engine)
    except Exception as e:
        print(f"Ошибка: {e}")
        sys.exit(1)
