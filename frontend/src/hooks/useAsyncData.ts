import { useCallback, useEffect, useState } from 'react'

export interface UseAsyncDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Загружает данные один раз при монтировании (и при смене deps).
 * Возвращает { data, loading, error, refetch }.
 */
export function useAsyncData<T>(fetchFn: () => Promise<T>, deps: React.DependencyList = []): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchFn()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false))
  }, deps)

  useEffect(() => {
    load()
  }, deps)

  return { data, loading, error, refetch: load }
}
