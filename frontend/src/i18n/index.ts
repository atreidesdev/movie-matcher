import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

type LocaleModule = { default: unknown }
type TranslationNode = Record<string, unknown>

const localeFiles = import.meta.glob<LocaleModule>('@/i18n/locales/*/**/*.json', { eager: true })

const isObject = (v: unknown): v is TranslationNode => v != null && typeof v === 'object' && !Array.isArray(v)

const deepMerge = (target: TranslationNode, source: TranslationNode): TranslationNode => {
  for (const [key, value] of Object.entries(source)) {
    const prev = target[key]
    if (isObject(prev) && isObject(value)) {
      target[key] = deepMerge(prev, value)
    } else {
      target[key] = value
    }
  }
  return target
}

const buildResources = (): { ru: { translation: TranslationNode }; en: { translation: TranslationNode } } => {
  const resources = {
    ru: { translation: {} as TranslationNode },
    en: { translation: {} as TranslationNode },
  }

  for (const [filePath, mod] of Object.entries(localeFiles)) {
    const match = filePath.match(/\/locales\/(ru|en)\/(.+)\.json$/)
    if (!match) continue
    const lang = match[1] as 'ru' | 'en'
    const namespace = match[2].split('/')[0]
    const content = mod.default
    if (!isObject(content)) continue

    const nsTarget = (resources[lang].translation[namespace] ?? {}) as TranslationNode
    resources[lang].translation[namespace] = deepMerge(nsTarget, content)
  }

  return resources
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: buildResources(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
