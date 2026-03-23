/**
 * Преобразование названия в URL-slug для красивых ссылок: /movies/1-Inception, /movies/1-Nachalo
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  А: 'A',
  Б: 'B',
  В: 'V',
  Г: 'G',
  Д: 'D',
  Е: 'E',
  Ё: 'E',
  Ж: 'Zh',
  З: 'Z',
  И: 'I',
  Й: 'Y',
  К: 'K',
  Л: 'L',
  М: 'M',
  Н: 'N',
  О: 'O',
  П: 'P',
  Р: 'R',
  С: 'S',
  Т: 'T',
  У: 'U',
  Ф: 'F',
  Х: 'H',
  Ц: 'Ts',
  Ч: 'Ch',
  Ш: 'Sh',
  Щ: 'Sch',
  Ъ: '',
  Ы: 'Y',
  Ь: '',
  Э: 'E',
  Ю: 'Yu',
  Я: 'Ya',
}

/** Преобразует строку в URL-безопасный slug (латиница, цифры, дефис). */
export function titleToSlug(title: string | null | undefined): string {
  if (!title || typeof title !== 'string') return ''
  const s = title.trim()
  const out: string[] = []
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (CYRILLIC_TO_LATIN[c] !== undefined) {
      out.push(CYRILLIC_TO_LATIN[c])
    } else if (/[a-zA-Z0-9]/.test(c)) {
      out.push(c.toLowerCase())
    } else if (c === ' ' || c === '_' || c === '-') {
      if (out.length > 0 && out[out.length - 1] !== '-') out.push('-')
    }
  }
  return out.join('').replace(/-+/g, '-').replace(/^-|-$/g, '') || ''
}

/**
 * Из параметра маршрута "1" или "1-Inception" извлекает числовой id.
 * parseInt("1-Inception", 10) === 1, поэтому можно не менять код чтения,
 * но явная функция удобна для документирования.
 */
export function parseMediaIdFromParam(idOrSlug: string | undefined): number {
  if (idOrSlug == null || idOrSlug === '') return 0
  const num = Number.parseInt(idOrSlug, 10)
  return Number.isNaN(num) ? 0 : num
}
