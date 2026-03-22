import { useEffect, useState, useRef } from 'react'
import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion'

export interface AnimatedNumberProps {
  /** Текущее значение (при смене — плавный переход) */
  value: number
  /** Форматирование: 'integer' (по умолчанию) или 'decimal' */
  format?: 'integer' | 'decimal'
  /** Количество знаков после запятой для format="decimal" */
  decimals?: number
  /** Дополнительные классы для span */
  className?: string
}

const spring = { type: 'spring' as const, stiffness: 60, damping: 20 }

/**
 * Анимированный счётчик: при изменении value число плавно «доезжает» до нового значения.
 * Используется для статистики профиля, счётчиков в списках, пагинации и т.п.
 */
export function AnimatedNumber({ value, format = 'integer', decimals = 1, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState(0)
  const prevValueRef = useRef<number | null>(null)

  useMotionValueEvent(motionValue, 'change', (v) => {
    setDisplay(format === 'integer' ? Math.round(v) : Number(v.toFixed(decimals)))
  })

  useEffect(() => {
    const prev = prevValueRef.current
    prevValueRef.current = value
    if (prev === value) return
    const from = prev === null ? 0 : prev
    motionValue.set(from)
    animate(motionValue, value, spring)
  }, [value, motionValue])

  const digitCount = Math.max(String(Math.round(value)).length, 1)
  return (
    <span className={className} style={{ minWidth: `${digitCount}ch` }} aria-hidden={false}>
      <span className="tabular-nums inline-block text-left">
        {format === 'integer' ? Math.round(display) : display}
      </span>
    </span>
  )
}
