import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface CardTooltipProps {
  /** Содержимое тултипа: строка или разметка (например, бейджи как на карточке) */
  content: React.ReactNode
  children: React.ReactNode
  /** Дополнительный класс для обёртки триггера */
  className?: string
}

/**
 * Тултип в стиле карточки: закругление, фон, тень. Показывается при наведении на children.
 */
export default function CardTooltip({ content, children, className = '' }: CardTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({
      left: rect.left + rect.width / 2,
      top: rect.top,
      width: Math.min(Math.max(rect.width, 120), 320),
    })
  }

  useEffect(() => {
    if (!visible) return
    updatePosition()
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [visible])

  const tooltipEl =
    visible &&
    content != null &&
    createPortal(
      <div
        className="fixed z-[100] px-3 py-2 bg-theme-surface rounded-xl shadow-md border border-theme pointer-events-none"
        style={{
          left: coords.left,
          top: coords.top,
          transform: 'translate(-50%, calc(-100% - 6px))',
          maxWidth: coords.width,
        }}
      >
        {typeof content === 'string' ? (
          <span className="text-sm text-theme whitespace-normal">{content}</span>
        ) : (
          content
        )}
      </div>,
      document.body
    )

  return (
    <>
      <div
        ref={ref}
        className={className}
        onMouseEnter={() => {
          updatePosition()
          setVisible(true)
        }}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {tooltipEl}
    </>
  )
}
