import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FileJson, Trash2 } from 'lucide-react'
import { IconPlus } from '@/components/icons'
import type { LocalizedString } from '@/types'

const DEFAULT_LOCALES = ['ru', 'en']

function parseJsonPaste(raw: string): LocalizedString | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const out: LocalizedString = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === 'string' && typeof v === 'string') out[k] = v
    }
    return Object.keys(out).length ? out : null
  } catch {
    return null
  }
}

export interface TranslationsEditorProps {
  value: LocalizedString
  onChange: (value: LocalizedString) => void
  defaultLocales?: readonly string[]
  placeholderByLocale?: (locale: string) => string
  className?: string
}

export default function TranslationsEditor({
  value,
  onChange,
  defaultLocales = DEFAULT_LOCALES,
  placeholderByLocale,
  className = '',
}: TranslationsEditorProps) {
  const { t } = useTranslation()
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const localesInValue = Object.keys(value)
  const allLocales = Array.from(new Set([...defaultLocales, ...localesInValue])).sort()

  const applyJson = useCallback(() => {
    const parsed = parseJsonPaste(jsonInput)
    if (parsed) {
      onChange({ ...value, ...parsed })
      setJsonInput('')
      setJsonError(null)
    } else {
      setJsonError(t('admin.translationsJsonInvalid'))
    }
  }, [jsonInput, value, onChange, t])

  const [newCode, setNewCode] = useState('')
  const [newValue, setNewValue] = useState('')

  const addLocaleFromInputs = useCallback(() => {
    const code = newCode
      .trim()
      .toLowerCase()
      .replace(/[^a-z-]/g, '')
    if (!code) return
    onChange({ ...value, [code]: newValue.trim() })
    setNewCode('')
    setNewValue('')
  }, [value, onChange, newCode, newValue])

  const removeLocale = useCallback(
    (locale: string) => {
      const next = { ...value }
      delete next[locale]
      onChange(next)
    },
    [value, onChange]
  )

  const setLocaleValue = useCallback(
    (locale: string, text: string) => {
      if (!text.trim()) {
        const next = { ...value }
        delete next[locale]
        onChange(next)
      } else {
        onChange({ ...value, [locale]: text })
      }
    },
    [value, onChange]
  )

  return (
    <div className={className}>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin.translationsPasteJson')}</label>
        <div className="flex gap-2">
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value)
              setJsonError(null)
            }}
            placeholder='{"ru": "Текст", "en": "Text"}'
            className="input flex-1 min-h-[60px] text-sm font-mono resize-y"
            rows={2}
          />
          <button
            type="button"
            onClick={applyJson}
            className="btn-secondary shrink-0 self-end flex items-center gap-1"
            title={t('admin.translationsApplyJson')}
          >
            <FileJson className="w-4 h-4" />
            {t('common.apply')}
          </button>
        </div>
        {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin.translationsByLanguage')}</label>
        <ul className="space-y-2 border border-gray-200 rounded-lg p-2 bg-gray-50/50">
          {allLocales.map((loc) => (
            <li key={loc} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-sm font-medium text-gray-600">{loc}</span>
              <input
                type="text"
                value={value[loc] ?? ''}
                onChange={(e) => setLocaleValue(loc, e.target.value)}
                placeholder={placeholderByLocale?.(loc) ?? `${t('admin.value')} (${loc})`}
                className="input flex-1 min-w-0 text-sm"
              />
              <button
                type="button"
                onClick={() => removeLocale(loc)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded shrink-0"
                aria-label={t('common.remove')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          <li className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-200">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder={t('admin.translationsLanguageCode')}
              className="input input--compact-x w-10 shrink-0 text-sm"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={t('admin.value')}
              className="input flex-1 min-w-0 text-sm"
            />
            <button
              type="button"
              onClick={addLocaleFromInputs}
              disabled={!newCode.trim()}
              className="p-1.5 text-gray-400 hover:text-lavender-600 rounded shrink-0 disabled:opacity-50 disabled:pointer-events-none"
              aria-label={t('admin.translationsAddLanguage')}
            >
              <IconPlus className="w-4 h-4" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
