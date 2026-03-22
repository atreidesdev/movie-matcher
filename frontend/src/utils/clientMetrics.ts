/**
 * Метрики на клиенте: длительность и количество запросов к API для оценки нагрузки.
 * В dev доступны через window.__clientMetrics (getSnapshot).
 */

const MAX_SAMPLES = 100
const SAMPLES: Array<{ path: string; method: string; durationMs: number; status: number; ts: number }> = []

/** Нормализация path: убираем числовые id из URL, чтобы группировать по шаблону */
function normalizePath(url: string): string {
  try {
    const path = url.replace(/^https?:\/\/[^/]+/, '') || '/'
    return path.replace(/\/\d+(\/|$)/g, '/:id$1').replace(/\/$/, '') || '/'
  } catch {
    return '/'
  }
}

export function recordRequest(args: { url: string; method: string; durationMs: number; status: number }): void {
  const path = normalizePath(args.url)
  const entry = {
    path,
    method: args.method,
    durationMs: args.durationMs,
    status: args.status,
    ts: Date.now(),
  }
  SAMPLES.push(entry)
  if (SAMPLES.length > MAX_SAMPLES) SAMPLES.shift()
}

export interface ClientMetricsSnapshot {
  /** Последние запросы (path, method, durationMs, status) */
  recent: Array<{ path: string; method: string; durationMs: number; status: number }>
  /** По каждому path: число запросов, суммарное время, ошибки (status >= 400) */
  byPath: Record<string, { count: number; totalMs: number; errors: number }>
  /** Общее число запросов в окне */
  totalRequests: number
  /** Средняя длительность (мс) по всем запросам в окне */
  avgDurationMs: number
}

export function getSnapshot(): ClientMetricsSnapshot {
  if (SAMPLES.length === 0 && typeof console !== 'undefined' && import.meta.env?.DEV) {
    console.info(
      '[clientMetrics] Пока нет записей. Сделайте запросы через приложение (откройте страницу тайтла, /users, поиск и т.д.), затем снова вызовите __clientMetrics.getSnapshot()'
    )
  }
  const byPath: Record<string, { count: number; totalMs: number; errors: number }> = {}
  let totalMs = 0
  for (const s of SAMPLES) {
    const key = `${s.method} ${s.path}`
    if (!byPath[key]) byPath[key] = { count: 0, totalMs: 0, errors: 0 }
    byPath[key].count += 1
    byPath[key].totalMs += s.durationMs
    if (s.status >= 400) byPath[key].errors += 1
    totalMs += s.durationMs
  }
  return {
    recent: SAMPLES.slice(-20).map(({ path, method, durationMs, status }) => ({ path, method, durationMs, status })),
    byPath,
    totalRequests: SAMPLES.length,
    avgDurationMs: SAMPLES.length ? Math.round(totalMs / SAMPLES.length) : 0,
  }
}

/** В dev вешаем на window для отладки */
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  ;(window as unknown as { __clientMetrics?: { getSnapshot: typeof getSnapshot } }).__clientMetrics = {
    getSnapshot,
  }
}
