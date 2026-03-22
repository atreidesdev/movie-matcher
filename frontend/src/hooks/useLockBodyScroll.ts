import { useEffect } from 'react'

/** Блокирует скролл body при open === true (для модалок и полноэкранных overlay). */
export function useLockBodyScroll(open: boolean): void {
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ''
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
}
