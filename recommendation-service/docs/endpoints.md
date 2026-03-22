# Как работают запросы recommendation-service

Краткое описание каждого типа запросов, которые вызывает `scripts/test_requests.py`.

---

## 1. `GET /health`

**Назначение:** проверка состояния сервиса и индекса.

**Что делает:**
- Не обращается к БД и не строит эмбеддинги.
- Берёт у `VectorStore` размер индекса (`get_size()`).
- Возвращает:
  - `status` — всегда `"healthy"`;
  - `embedding_model` — модель для эмбеддингов (например, `all-MiniLM-L6-v2`);
  - `index_size` — число векторов в FAISS-индексе (в demo после старта = 45, т.к. все тайтлы из `mock_media.json` проиндексированы при `startup`).

**Пример ответа:**  
`200 {'status': 'healthy', 'embedding_model': 'all-MiniLM-L6-v2', 'index_size': 45}`

---

## 2. `GET /recommendations/{user_id}`

**Параметры:** `media_type` (по умолчанию `movie`), `limit` (по умолчанию 10).

**Назначение:** персональные рекомендации для пользователя по типу контента (фильмы, аниме, игры и т.д.).

**Как работает (demo, USE_MOCK_DATA=true):**
1. Берётся профиль пользователя из `mock_list_items.json` через `demo_loader.get_demo_profiles()`: для `user_id` — список `media_id`, которые уже в списке (просмотрено/в планах и т.д.) по каждому `media_type`.
2. Эти id считаются «уже известными» и в рекомендации не попадают.
3. Из `demo_loader.get_demo_items()` отбираются кандидаты того же `media_type`, которых нет в профиле.
4. Для каждого кандидата считается скор: **рейтинг тайтла + 0.4 × (число совпадающих жанров с «понравившимися»)**. Жанры «понравившихся» собираются по тем id, что есть в профиле пользователя для этого типа.
5. Кандидаты сортируются по скору по убыванию, берётся топ `limit`.
6. Ответ: список `RecommendationResponse` с `recommendations` (media_id, title, score, poster, description), `user_id`, `media_type`.

**Почему в выводе такие скоры:**  
У user_id=1 в списке фильмы 1, 2, 3, 7, 8 (Inception, Dark Knight, Interstellar, Forrest Gump, Shawshank). У них жанры Drama, Sci-Fi, Thriller и т.д. Остальные фильмы ранжируются по рейтингу и совпадению жанров (например, The Godfather и Pulp Fiction получают высокий скор за Drama/Crime и общий рейтинг).

---

## 3. `GET /similar/{media_type}/{media_id}`

**Параметры:** `limit` (по умолчанию 10).

**Назначение:** «похожее» для страницы деталей — тайтлы, семантически близкие к заданному.

**Как работает:**
1. Для объекта `(media_type, media_id)` получается **эмбеддинг**:
   - **Demo:** из `DEMO_EMBEDDING_MAP` (эмбеддинги всех тайтлов из `mock_media.json` строятся при старте из title, description, genres, themes, cast, directors, studios и т.д.).
   - **С БД:** из БД подтягиваются метаданные тайтла, по ним вызывается `create_media_embedding(...)`.
2. По этому вектору выполняется поиск в **FAISS** (`vector_store.search`): ищутся ближайшие векторы в том же `media_type`, при этом сам объект исключается (`exclude_ids=[media_id]`).
3. Метрика — косинусное сходство (FAISS IndexFlatIP по нормализованным векторам = косинус). Чем больше score, тем ближе по смыслу.
4. Возвращаются топ `limit` записей с полями media_id, title, score, poster, description.

**Пример:** для фильма 1 (Inception) ближе всего по эмбеддингу оказываются The Matrix, Shutter Island, Pulp Fiction — общий «настроенческий» и жанровый контекст.

---

## 4. `GET /search/semantic`

**Параметры:** `q` (обязательный — поисковая строка), `media_type` (опционально), `limit` (по умолчанию 20).

**Назначение:** семантический поиск по смыслу запроса (не по точному совпадению слов).

**Как работает:**
1. Строка запроса `q` кодируется в вектор через **тот же эмбеддинг-сервис** (`embedding_service.encode(query)`), что и тексты тайтлов.
2. По этому вектору выполняется поиск в **FAISS** (`vector_store.search`): ищутся ближайшие векторы; при указании `media_type` возвращаются только объекты этого типа.
3. Результаты сортируются по степени сходства (score), отдаётся топ `limit`.
4. Ответ: `SemanticSearchResponse` с полем `results` — список объектов с media_id, media_type, title, score, poster, description.

**Пример:** запрос `"space travel"` даёт высокий score для Interstellar (космос, путешествия), остальные фильмы — по мере касания темы (Matrix, Whiplash и т.д. ниже).

**Примечание:** в текущей схеме `SemanticSearchResponse` содержит только `results`; в ответе API нет полей `query` и `media_type`, поэтому в скрипте при выводе они отображаются как `None`. Логика поиска при этом использует переданные `q` и `media_type` корректно.

---

## Общее

- **Индекс (FAISS):** при старте в demo-режиме из `mock_media.json` строятся эмбеддинги для всех 45 тайтлов и кладутся в общий индекс; тип медиа хранится в метаданных и используется для фильтрации по `media_type` в поиске и similar.
- **Эмбеддинги:** одна модель (например, `all-MiniLM-L6-v2`); для тайтлов учитываются title, description, genres, themes, directors, actors, characters, studios, authors, developers, publishers, year, rating.
- **Лист-айтемы в demo:** задаются в `mock_list_items.json` (user_id, media_type, media_id, status, rating) и используются только для расчёта персональных рекомендаций (`/recommendations/{user_id}`), а не для similar или semantic search.
