import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Доступность модалки: ловушка фокуса, закрытие по Escape, возврат фокуса при закрытии.
 * @param isOpen — открыта ли модалка
 * @param onClose — вызывается по Escape или при клике вне (если обрабатывается снаружи)
 * @param options.contentRef — ref на контейнер модалки (для поиска фокусируемых элементов)
 */
export function useModalA11y(
  isOpen: boolean,
  onClose: () => void,
  options?: { contentRef?: React.RefObject<HTMLElement | null> },
) {
  const previousActiveRef = useRef<HTMLElement | null>(null)

  const getFocusables = useCallback((root: HTMLElement): HTMLElement[] => {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
    )
  }, [])

  useEffect(() => {
    if (!isOpen) return

    previousActiveRef.current = document.activeElement as HTMLElement | null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onClose()
    }

    const content = options?.contentRef?.current ?? document.activeElement?.closest('[role="dialog"]')
    if (content && content instanceof HTMLElement) {
      const focusables = getFocusables(content)
      if (focusables.length > 0) {
        focusables[0].focus()
      }
      const handleKeyDownTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        const focusables = getFocusables(content)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
      content.addEventListener('keydown', handleKeyDownTab)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        content.removeEventListener('keydown', handleKeyDownTab)
        document.removeEventListener('keydown', handleKeyDown)
        if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
          previousActiveRef.current.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
        previousActiveRef.current.focus()
      }
    }
  }, [isOpen, onClose, getFocusables, options?.contentRef])
}
