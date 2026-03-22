# Movie Matcher

### Компоненты

- **Frontend (React + TypeScript)**: SPA с Vite, React Router, Zustand для state management
- **Backend (Go + Gin)**: REST API с JWT-аутентификацией, GORM ORM
- **Recommendation Service (Python + FastAPI)**: Векторный поиск с sentence-transformers и FAISS
- **Database (PostgreSQL)**: Хранение всех данных приложения

## Технологии

### Backend
- Go 1.21+
- Gin Web Framework
- GORM (ORM)
- JWT для аутентификации
- PostgreSQL 

### Frontend
- React 19
- TypeScript
- Vite
- React Router 7 
- Zustand
- Tailwind CSS
- Axios

### Recommendation Service
- Python 3.11+
- FastAPI
- sentence-transformers (all-MiniLM-L6-v2)
- FAISS

## Запуск

### Рекомендуемый способ (локальная разработка)

1. Скопируйте `.env.example` в `.env` и при необходимости отредактируйте:
   ```bash
   cp .env.example .env
   ```

Требуется: Docker, Go, Python 3.11+, Node.js.

### Docker (все сервисы в контейнерах)

```bash
docker-compose up -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Recommendation API: http://localhost:8000

### Локальная разработка (вручную)

1. **БД:** `docker-compose -f docker-compose.dev.yml up -d`
2. **Backend:** `cd backend && go run cmd/api/main.go`
3. **Recommendation Service:** `cd recommendation-service && pip install -r requirements.txt && python -m app.main`
4. **Frontend:** `cd frontend && npm install && npm run dev`
