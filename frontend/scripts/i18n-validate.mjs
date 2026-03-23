import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('d:/backup/movie-matcher/frontend')
const SRC_DIR = path.join(ROOT, 'src')
const LOCALES_DIR = path.join(SRC_DIR, 'i18n', 'locales')
const LANGS = ['ru', 'en']
const PLURAL_SUFFIXES = new Set(['zero', 'one', 'two', 'few', 'many', 'other'])

const args = new Set(process.argv.slice(2))
const failOnUnused = args.has('--fail-on-unused')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

function flattenObject(obj, prefix = '') {
  const out = []
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return out
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flattenObject(value, next))
    } else {
      out.push(next)
    }
  }
  return out
}

function namespaceKeys(lang) {
  const dir = path.join(LOCALES_DIR, lang)
  const files = listFilesRecursive(dir)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))

  const keys = new Set()
  const valueMap = new Map()

  for (const file of files) {
    const relative = path.relative(dir, file).replace(/\\/g, '/')
    const ns = relative.split('/')[0].replace(/\.json$/, '')
    const json = readJson(file)
    const flattened = flattenObject(json)
    for (const k of flattened) {
      const full = `${ns}.${k}`
      keys.add(full)
      const value = k.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), json)
      if (typeof value === 'string') {
        if (!valueMap.has(value)) valueMap.set(value, [])
        valueMap.get(value).push(full)
      }
    }
  }

  return { keys, valueMap }
}

function listFilesRecursive(dir) {
  const out = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...listFilesRecursive(full))
    else out.push(full)
  }
  return out
}

function collectUsedKeys() {
  const files = listFilesRecursive(SRC_DIR).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
  const used = new Set()
  const dynamicPrefixes = new Set()
  const add = (k) => {
    if (!k || k.includes('${') || k.endsWith('.')) return
    used.add(k)
  }

  const keyRegexes = [
    /\bt\s*\(\s*['"]([^'"`]+)['"]/g, // t('key')
    /\bi18n\.t\s*\(\s*['"]([^'"`]+)['"]/g, // i18n.t('key')
    /i18nKey\s*=\s*['"]([^'"`]+)['"]/g, // <Trans i18nKey="key" />
  ]

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    for (const re of keyRegexes) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(content)) != null) add(m[1])
    }

    // t(`media.status.${value}`)
    const templatePrefixRegex = /\bt\s*\(\s*`([a-zA-Z0-9_.-]+\.)\$\{/g
    templatePrefixRegex.lastIndex = 0
    let tm
    while ((tm = templatePrefixRegex.exec(content)) != null) dynamicPrefixes.add(tm[1])

    // t('person.' + key)
    const concatPrefixRegex = /\bt\s*\(\s*['"]([a-zA-Z0-9_.-]+\.)['"]\s*\+/g
    concatPrefixRegex.lastIndex = 0
    while ((tm = concatPrefixRegex.exec(content)) != null) dynamicPrefixes.add(tm[1])
  }

  return { used, dynamicPrefixes }
}

function withPluralCompanions(keys) {
  const expanded = new Set(keys)
  for (const key of keys) {
    for (const suffix of PLURAL_SUFFIXES) expanded.add(`${key}_${suffix}`)
    const pluralMatch = key.match(/^(.*)_([a-z]+)$/)
    if (pluralMatch && PLURAL_SUFFIXES.has(pluralMatch[2])) expanded.add(pluralMatch[1])
  }
  return expanded
}

function sorted(arr) {
  return [...arr].sort((a, b) => a.localeCompare(b))
}

const ru = namespaceKeys('ru')
const en = namespaceKeys('en')
const { used: usedRaw, dynamicPrefixes } = collectUsedKeys()
const used = withPluralCompanions(usedRaw)

const missingInEn = sorted([...ru.keys].filter((k) => !en.keys.has(k)))
const missingInRu = sorted([...en.keys].filter((k) => !ru.keys.has(k)))
const unknownInCode = sorted([...usedRaw].filter((k) => !ru.keys.has(k) && !en.keys.has(k)))
const unusedInRu = sorted(
  [...ru.keys].filter((k) => !used.has(k) && ![...dynamicPrefixes].some((prefix) => k.startsWith(prefix)))
)

const duplicateValuesRu = [...ru.valueMap.entries()]
  .filter(([, paths]) => paths.length >= 3)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15)

let hasError = false

if (missingInEn.length > 0) {
  hasError = true
  console.error(`\nMissing keys in en (${missingInEn.length}):`)
  for (const k of missingInEn.slice(0, 200)) console.error(`  - ${k}`)
}

if (missingInRu.length > 0) {
  hasError = true
  console.error(`\nMissing keys in ru (${missingInRu.length}):`)
  for (const k of missingInRu.slice(0, 200)) console.error(`  - ${k}`)
}

if (unknownInCode.length > 0) {
  hasError = true
  console.error(`\nUnknown i18n keys used in code (${unknownInCode.length}):`)
  for (const k of unknownInCode.slice(0, 200)) console.error(`  - ${k}`)
}

if (unusedInRu.length > 0) {
  const title = `\nPotential dead keys (${unusedInRu.length})`
  if (failOnUnused) {
    hasError = true
    console.error(`${title}:`)
  } else {
    console.warn(`${title} (warning):`)
  }
  for (const k of unusedInRu.slice(0, 200)) console.warn(`  - ${k}`)
}

if (duplicateValuesRu.length > 0) {
  console.log('\nTop repeated RU values (candidate to move into common):')
  for (const [value, paths] of duplicateValuesRu) {
    console.log(`  "${value}" -> ${paths.length} keys`)
    for (const p of paths.slice(0, 5)) console.log(`    - ${p}`)
    if (paths.length > 5) console.log(`    ... +${paths.length - 5} more`)
  }
}

if (!hasError) {
  console.log('\ni18n validation passed')
}

process.exit(hasError ? 1 : 0)
