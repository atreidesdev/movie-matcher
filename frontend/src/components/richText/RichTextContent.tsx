import { looksLikeRichHtml, sanitizeRichHtml } from '@/utils/richText'
import { useEffect, useMemo, useRef } from 'react'
import './rich-text.css'

interface RichTextContentProps {
  html: string
  className?: string
}

/**
 * Безопасный вывод HTML (комментарии / рецензии). Спойлер: клик по размытию переключает видимость.
 */
export function RichTextContent({ html, className }: RichTextContentProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const plain = !looksLikeRichHtml(html)

  const sanitized = useMemo(() => {
    if (plain || typeof window === 'undefined') return ''
    return sanitizeRichHtml(html)
  }, [html, plain])

  useEffect(() => {
    const root = rootRef.current
    if (!root || plain) return

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-rich-spoiler]')
      if (!el || !root.contains(el)) return
      e.preventDefault()
      el.classList.toggle('rich-spoiler--revealed')
    }

    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [plain])

  if (plain) {
    return (
      <div className={`rich-text-content ${className ?? ''}`}>
        <p className="whitespace-pre-wrap break-words m-0">{html}</p>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={`rich-text-content ${className ?? ''}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: контент проходит DOMPurify (sanitizeRichHtml)
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
