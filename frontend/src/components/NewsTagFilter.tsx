import { IconArrowDown, IconCross } from '@/components/icons'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Выпадающий мультиселект тегов с поиском: в блоке — чипы выбранных, по клику — поле поиска и список тегов (как на странице списка). */
export default function NewsTagFilter({
  options,
  selectedTags,
  onChange,
  placeholderKey = 'news.filterAll',
  searchPlaceholderKey = 'media.searchFilter',
  className = '',
}: {
  options: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
  placeholderKey?: string
  searchPlaceholderKey?: string
  className?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filterLower = filter.trim().toLowerCase()
  const filteredOptions = filterLower ? options.filter((tag) => tag.toLowerCase().includes(filterLower)) : options

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [open])

  const toggle = (tag: string) => {
    const next = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    onChange(next)
  }

  const removeTag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    onChange(selectedTags.filter((t) => t !== tag))
  }

  return (
    <div ref={ref} className={className}>
      <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-sm min-w-[160px] sm:min-w-[200px]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm min-h-[2.25rem] text-[var(--theme-text)]"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {selectedTags.length === 0 && <span className="text-[var(--theme-text-muted)]">{t(placeholderKey)}</span>}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[var(--theme-primary)] text-white"
              >
                <span className="truncate max-w-[100px] sm:max-w-[120px]">{tag}</span>
                <button
                  type="button"
                  onClick={(e) => removeTag(e, tag)}
                  className="shrink-0 p-0.5 rounded hover:bg-white/20 text-white focus:outline-none"
                  aria-label={t('common.remove')}
                >
                  <IconCross className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <IconArrowDown
            className={`w-4 h-4 shrink-0 text-[var(--theme-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="border-t border-[var(--theme-border)] py-1 max-h-52 flex flex-col">
            <input
              type="search"
              autoComplete="off"
              placeholder={t(searchPlaceholderKey)}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mx-2 mb-1 px-2 py-1.5 text-sm border border-[var(--theme-border)] rounded-md bg-[var(--theme-bg)] text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
            />
            <div className="overflow-y-auto px-1" role="listbox">
              {filteredOptions.length === 0 ? (
                <p className="text-xs text-[var(--theme-text-muted)] py-2 px-2">{t('common.noResults')}</p>
              ) : (
                filteredOptions.map((tag) => {
                  const checked = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(tag)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md text-[var(--theme-text)] ${checked ? 'bg-[var(--theme-primary)]/30' : 'hover:bg-[var(--theme-surface)]'}`}
                    >
                      <span className="flex-1 truncate capitalize">{tag}</span>
                      {checked && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--theme-primary)]">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
