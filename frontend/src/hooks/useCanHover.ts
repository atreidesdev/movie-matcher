import { useEffect, useState } from 'react'

/**
 * True when the primary input can hover (e.g. mouse). False for touch-only devices.
 * Use to avoid showing hover-only UI (e.g. native title tooltips) on mobile.
 */
export function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(hover: hover)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)')
    const update = () => setCanHover(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return canHover
}
