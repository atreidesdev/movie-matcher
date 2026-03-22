/** Общие пропсы для SVG-иконок из assets. Цвет по умолчанию — currentColor (задаётся через className, напр. text-thistle-400). */
export interface IconProps {
  size?: number
  className?: string
  /** Явный цвет (fill/stroke). Если не задан, используется currentColor. */
  color?: string
}

export const DEFAULT_ICON_SIZE = 20
