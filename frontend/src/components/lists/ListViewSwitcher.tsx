import { useTranslation } from 'react-i18next'
import { LayoutList, List, LayoutGrid } from 'lucide-react'

export type ListViewMode = 'detailed' | 'compact' | 'cards'

interface ListViewSwitcherProps {
  value: ListViewMode
  onChange: (mode: ListViewMode) => void
}

export default function ListViewSwitcher({ value, onChange }: ListViewSwitcherProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)]">
      <button
        type="button"
        onClick={() => onChange('detailed')}
        title={t('lists.viewDetailed')}
        className={`p-2 rounded-md transition-colors ${
          value === 'detailed'
            ? 'bg-[var(--theme-primary)] text-white'
            : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-bg)]'
        }`}
        aria-pressed={value === 'detailed'}
      >
        <LayoutList className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('compact')}
        title={t('lists.viewCompact')}
        className={`p-2 rounded-md transition-colors ${
          value === 'compact'
            ? 'bg-[var(--theme-primary)] text-white'
            : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-bg)]'
        }`}
        aria-pressed={value === 'compact'}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('cards')}
        title={t('lists.viewCards')}
        className={`p-2 rounded-md transition-colors ${
          value === 'cards'
            ? 'bg-[var(--theme-primary)] text-white'
            : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-bg)]'
        }`}
        aria-pressed={value === 'cards'}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  )
}
