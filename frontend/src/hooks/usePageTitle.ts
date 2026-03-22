import { useEffect } from 'react'

const DEFAULT_SUFFIX = 'Movie Matcher'

export function usePageTitle(title?: string | null) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (title && title.trim()) {
      document.title = `${title.trim()} — ${DEFAULT_SUFFIX}`
    } else {
      document.title = DEFAULT_SUFFIX
    }
  }, [title])
}
