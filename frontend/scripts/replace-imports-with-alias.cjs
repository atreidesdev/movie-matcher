const path = require('path')
const fs = require('fs')

const srcDir = path.join(__dirname, '..', 'src')

function getAllTsFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') getAllTsFiles(full, list)
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      list.push(full)
    }
  }
  return list
}

function toAliasPath(fileDir, importPath) {
  const normalized = importPath.replace(/\\/g, '/')
  if (!normalized.startsWith('.') || normalized.startsWith('./vite-plugin') || normalized.startsWith('../vite-plugin')) {
    return null
  }
  const resolved = path.resolve(fileDir, importPath)
  if (!resolved.startsWith(srcDir)) return null
  const fromSrc = path.relative(srcDir, resolved).replace(/\\/g, '/')
  return '@/'.concat(fromSrc.replace(/\.(tsx?|jsx?)$/, ''))
}

function replaceImports(content, filePath) {
  const fileDir = path.dirname(filePath)
  let out = content.replace(
    /from\s+['"](\.\.[\/\\].*?|\.\/.*?)['"]/g,
    (match, importPath) => {
      const newPath = toAliasPath(fileDir, importPath)
      return newPath != null ? `from '${newPath}'` : match
    }
  )
  out = out.replace(
    /import\s*\(\s*['"](\.\.[\/\\].*?|\.\/.*?)['"]\s*\)/g,
    (match, importPath) => {
      const newPath = toAliasPath(fileDir, importPath)
      return newPath != null ? `import('${newPath}')` : match
    }
  )
  return out
}

const files = getAllTsFiles(srcDir)
let count = 0
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const next = replaceImports(content, file)
  if (next !== content) {
    fs.writeFileSync(file, next)
    count++
  }
}
console.log('Updated', count, 'files')
