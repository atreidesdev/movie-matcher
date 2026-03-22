"""
Middleware для сбора метрик Prometheus: число запросов и длительность по endpoint.
"""
import re
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from prometheus_client import Counter, Histogram, REGISTRY

# Нормализуем путь: сегменты из цифр заменяем на :id, чтобы не раздувать метрики
def _normalize_path(path: str) -> str:
    if not path:
        return path
    return re.sub(r"/\d+", "/:id", path)


_requests_total = Counter(
    "recommendation_http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
    registry=REGISTRY,
)
_request_duration_seconds = Histogram(
    "recommendation_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
    registry=REGISTRY,
)


class PrometheusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        path = _normalize_path(request.url.path)
        method = request.method
        status = str(response.status_code)
        _requests_total.labels(method=method, path=path, status=status).inc()
        _request_duration_seconds.labels(method=method, path=path).observe(duration)
        return response
