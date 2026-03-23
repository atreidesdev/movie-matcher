import { IconArrowDown } from '@/components/icons'
import { useEffect, useRef, useState } from 'react'

export interface CustomSelectOption {
  value: string
  label: React.ReactNode
}

export interface CustomSelectProps {
  options: CustomSelectOption[]
  value: string
  onChange: (value: string) => void
  /** Подпись над полем */
  label?: string
  /** Текст, если ничего не выбрано (для пустого value) */
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  /** aria-label для кнопки */
  ariaLabel?: string
}

/** Выпадающий список в стиле выбора статуса в модалке редактирования записи. */
export default function CustomSelect({
  options,
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  className = '',
  id,
  ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : (placeholder ?? '')

  return (
    <div ref={ref} className={`relative ${className}`} id={id}>
      {label && (
        <label className="block text-xs font-medium text-[var(--theme-text)] mb-0.5" htmlFor={id}>
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? label ?? undefined}
        className="input w-full py-1.5 text-sm text-left flex items-center justify-between gap-2 text-lavender-500 disabled:opacity-50"
      >
        <span className="truncate">{displayLabel}</span>
        <IconArrowDown
          className={`w-4 h-4 shrink-0 text-lavender-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-48 overflow-y-auto rounded-lg border dropdown-list-panel shadow-lg py-1"
        >
          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`cursor-pointer px-4 py-2 text-sm ${isSelected ? 'custom-select-option-selected bg-lavender-500 text-theme' : 'text-theme hover:bg-lavender-500/40'}`}
              >
                {opt.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
