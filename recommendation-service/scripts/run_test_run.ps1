# Тестовый прогон: сид данных, индексация, проверка рекомендаций и семантического поиска.
# Требования: PostgreSQL запущен, миграции применены (запустите backend хотя бы раз), Python venv с зависимостями.
# Использование: из корня recommendation-service выполнить: .\scripts\run_test_run.ps1

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8000"

Write-Host "=== 1. Сид тестовых данных (фильмы, аниме, игры) ===" -ForegroundColor Cyan
Set-Location $PSScriptRoot\..
python scripts/seed_test_data.py
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== 2. Запустите сервис в другом терминале: python -m app.main ===" -ForegroundColor Yellow
Write-Host "   Затем нажмите Enter здесь для продолжения проверки..." -ForegroundColor Gray
Read-Host

Write-Host "`n=== 3. Health ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/health" -Method Get | ConvertTo-Json

Write-Host "`n=== 4. Индексация (movie, animeSeries, game) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/index/movie" -Method Post
Invoke-RestMethod -Uri "$baseUrl/index/animeSeries" -Method Post
Invoke-RestMethod -Uri "$baseUrl/index/game" -Method Post

Write-Host "`n=== 5. Health после индексации ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/health" -Method Get | ConvertTo-Json

Write-Host "`n=== 6. Семантический поиск: q=sci-fi thriller ===" -ForegroundColor Cyan
$search = Invoke-RestMethod -Uri "$baseUrl/search/semantic?q=sci-fi+thriller&limit=5" -Method Get
$search.results | ForEach-Object { Write-Host "  $($_.mediaType) #$($_.mediaId): $($_.title) ($([math]::Round($_.score * 100))%)" }

Write-Host "`n=== 7. Рекомендации для user_id=1 (movie) ===" -ForegroundColor Cyan
$rec = Invoke-RestMethod -Uri "$baseUrl/recommendations/1?media_type=movie&limit=5" -Method Get
$rec.recommendations | ForEach-Object { Write-Host "  $($_.title) ($([math]::Round($_.score * 100))%)" }

Write-Host "`n=== 8. Похожее к фильму (movie id=1) ===" -ForegroundColor Cyan
$sim = Invoke-RestMethod -Uri "$baseUrl/similar/movie/1?limit=3" -Method Get
$sim.similar | ForEach-Object { Write-Host "  $($_.title) ($([math]::Round($_.score * 100))%)" }

Write-Host "`n=== Готово ===" -ForegroundColor Green
