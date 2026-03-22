# Тестовый прогон рекомендаций и семантического поиска

Два варианта: **без БД и без Docker** (только Python) или с полным стеком (PostgreSQL + backend).

---

## Вариант A: Запуск без Docker и бэкенда (только Python)

Подходит для быстрой проверки семантического поиска и рекомендаций. Данные берутся из `app/fixtures/mock_media.json`, индекс строится в памяти при старте.

1. Установите зависимости и запустите сервис с флагом мок-данных:
   ```bash
   cd recommendation-service
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   # source venv/bin/activate  # Linux/macOS
   pip install -r requirements.txt
   set USE_MOCK_DATA=true     # Windows
   # export USE_MOCK_DATA=true # Linux/macOS
   python -m app.main
   ```
   Или один раз положите в `recommendation-service/.env` строку:
   ```env
   USE_MOCK_DATA=true
   ```
   и запускайте `python -m app.main`.

2. После старта (и загрузки модели sentence-transformers при первом запросе) проверьте:
   ```bash
   curl "http://localhost:8000/health"
   curl "http://localhost:8000/search/semantic?q=sci-fi+thriller&limit=5"
   curl "http://localhost:8000/recommendations/1?media_type=movie&limit=5"
   curl "http://localhost:8000/similar/movie/1?limit=3"
   ```
   Индексация и `POST /similar/compute` в этом режиме не нужны и отключены.

---

## Вариант B: С БД (Docker + backend + сид)

Кратко: как поднять БД, загрузить мок-данные в PostgreSQL, запустить Python-сервис и проверить рекомендации и семантический поиск.

### Требования

- **PostgreSQL** — та же БД, что использует backend (например, `docker-compose -f docker-compose.dev.yml up -d` или `.\run-db.ps1`).
- **Миграции применены** — один раз запустите backend (`go run cmd/api/main.go` из `backend/`), чтобы создались таблицы.
- **Python 3.11+** и зависимости из `recommendation-service/requirements.txt`.

---

## Шаг 1. База и сид данных

1. Запустите PostgreSQL (если ещё не запущен):
   ```bash
   # из корня проекта
   .\run-db.ps1
   # или
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. Примените схему (один раз): запустите backend из `backend/` — он выполнит AutoMigrate при старте.

3. Заполните тестовыми данными (фильмы, аниме, игры с описаниями и жанрами):
   ```bash
   cd recommendation-service
   # лучше в venv
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   # source venv/bin/activate  # Linux/macOS
   pip install -r requirements.txt
   python scripts/seed_test_data.py
   ```
   Скрипт читает `DATABASE_URL` из `recommendation-service/.env` или из корневого `.env`. Добавляет фильмы (Inception, The Dark Knight, Interstellar, …), аниме (Attack on Titan, Death Note, Steins;Gate), игры (The Witcher 3, Elden Ring, Half-Life 2), жанры и темы. Если в БД уже есть пользователь с `id = 1`, для него создаётся запись в списке и отзыв по одному фильму (для проверки персональных рекомендаций).

---

## Шаг 2. Запуск recommendation-service

```bash
cd recommendation-service
.\venv\Scripts\activate
python -m app.main
```

Сервис будет доступен по адресу `http://localhost:8000`. При первом запросе к эмбеддингам подтянется модель sentence-transformers (если ещё не скачана).

---

## Шаг 3. Индексация медиа

Без индекса семантический поиск и «похожее» по тайтлу будут пустыми. Выполните (пока сервис запущен):

```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:8000/index/movie" -Method Post
Invoke-RestMethod -Uri "http://localhost:8000/index/animeSeries" -Method Post
Invoke-RestMethod -Uri "http://localhost:8000/index/game" -Method Post

# или curl
curl -X POST "http://localhost:8000/index/movie"
curl -X POST "http://localhost:8000/index/animeSeries"
curl -X POST "http://localhost:8000/index/game"
```

После этого в `/health` поле `index_size` станет больше 0.

---

## Шаг 4. Проверка через API

**Health:**
```bash
curl "http://localhost:8000/health"
```

**Семантический поиск** (по смыслу запроса):
```bash
curl "http://localhost:8000/search/semantic?q=sci-fi+thriller&limit=10"
curl "http://localhost:8000/search/semantic?q=time+travel&limit=5"
curl "http://localhost:8000/search/semantic?q=dark+fantasy+ RPG&media_type=game&limit=5"
```

**Рекомендации для пользователя** (user_id=1, тип movie):
```bash
curl "http://localhost:8000/recommendations/1?media_type=movie&limit=10"
```

**Похожее к тайтлу** (для фильма с id=1):
```bash
curl "http://localhost:8000/similar/movie/1?limit=5"
```

**Предвычисленные похожие** (запись в `content_similar`, опционально):
```bash
curl -X POST "http://localhost:8000/similar/compute?media_type=movie"
```

---

## Автоматический сценарий (Windows)

Скрипт `scripts/run_test_run.ps1` по шагам: сид данных → пауза (нужно вручную запустить сервис) → health → индексация movie/animeSeries/game → семантический поиск → рекомендации для user 1 → похожее к movie/1.

```powershell
cd recommendation-service
.\scripts\run_test_run.ps1
```

В начале скрипт предложит запустить сервис в другом терминале и нажать Enter для продолжения.

---

## Мок-данные (скрипт `scripts/seed_test_data.py`)

| Тип    | Примеры тайтлов |
|--------|------------------|
| Фильмы | Inception, The Dark Knight, Interstellar, Pulp Fiction, Shutter Island, The Matrix |
| Аниме  | Attack on Titan, Death Note, Steins;Gate |
| Игры   | The Witcher 3: Wild Hunt, Elden Ring, Half-Life 2 |

У каждого есть `title`, `description`, `release_date`, `rating`; к фильмам/аниме/играм привязываются жанры и темы из таблиц `genres` и `themes` (при первом запуске создаются минимальные наборы). Этого достаточно для индексации, семантического поиска по запросам вроде «sci-fi thriller», «time travel», «dark fantasy» и выдачи рекомендаций/похожего.
