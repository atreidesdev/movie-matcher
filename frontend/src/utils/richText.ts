import DOMPurify from 'dompurify'

/** Максимальная длина сохраняемой строки (HTML) для комментариев */
export const RICH_TEXT_MAX_COMMENT_HTML = 8000
/** Максимальная длина HTML текста рецензии */
export const RICH_TEXT_MAX_REVIEW_HTML = 32000

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'del',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'span',
    'a',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'data-rich-spoiler'],
  ALLOW_DATA_ATTR: false,
} as const

/** Пустой контент TipTap / HTML без видимого текста */
export function isRichTextEmpty(html: string): boolean {
  const t = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length === 0
}

export function sanitizeRichHtml(html: string): string {
  if (typeof window === 'undefined') return html
  return DOMPurify.sanitize(html, PURIFY_CONFIG as unknown as Parameters<typeof DOMPurify.sanitize>[1])
}

/** Для превью / лимитов: грубая оценка «объёма» без тегов */
export function richTextPlainLength(html: string): number {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

/** Старые комментарии без разметки — рендерим как plain */
export function looksLikeRichHtml(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  return /<[a-z][\s\S]*>/i.test(t)
}

/** Извлечь plain-текст из HTML для превью (без тегов) */
export function stripHtmlToPlain(html: string, maxLen?: number): string {
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  return maxLen != null && maxLen > 0 ? plain.slice(0, maxLen) : plain
}
