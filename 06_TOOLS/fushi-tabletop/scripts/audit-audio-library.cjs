const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const publicAudioRoot = path.join(root, 'public', 'assets', 'audio')
const sourceRoot = path.join(root, 'src')
const manifestPath = path.join(
  root,
  'MSC_AUDIO_LIBRARY',
  '99_LICENCAS_E_CREDITOS',
  'manifest_audio.csv',
)
const ffmpegPath = require('ffmpeg-static')
const deep = process.argv.includes('--deep')
const audioExtensions = new Set(['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.wav'])

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath]
  })
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function formatBytes(value) {
  return `${(value / 1024 / 1024).toFixed(2)} MB`
}

const errors = []
const warnings = []
const publicFiles = walkFiles(publicAudioRoot).filter((filePath) =>
  audioExtensions.has(path.extname(filePath).toLowerCase()),
)
const hashes = new Map()

publicFiles.forEach((filePath) => {
  const stats = fs.statSync(filePath)

  if (stats.size <= 0) {
    errors.push(`Arquivo vazio: ${path.relative(root, filePath)}`)
    return
  }

  const hash = hashFile(filePath)
  const duplicates = hashes.get(hash) ?? []
  duplicates.push(filePath)
  hashes.set(hash, duplicates)

  if (stats.size > 20 * 1024 * 1024) {
    warnings.push(`Audio grande no nucleo: ${path.relative(root, filePath)} (${formatBytes(stats.size)})`)
  }
})

hashes.forEach((files) => {
  if (files.length > 1) {
    warnings.push(
      `Conteudo duplicado: ${files.map((filePath) => path.relative(root, filePath)).join(', ')}`,
    )
  }
})

const sourceReferences = walkFiles(sourceRoot)
  .filter((filePath) => /\.(ts|tsx)$/.test(filePath))
  .flatMap((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8')
    return [...content.matchAll(/['"`](\/assets\/audio\/[^'"`\s?#]+)[?#[^'"`\s]*['"`]/g)].map(
      (match) => ({
        filePath,
        publicPath: match[1],
      }),
    )
  })

sourceReferences.forEach(({ filePath, publicPath }) => {
  const diskPath = path.join(root, 'public', ...publicPath.split('/').filter(Boolean))

  if (!fs.existsSync(diskPath)) {
    errors.push(
      `Referencia ausente em ${path.relative(root, filePath)}: ${publicPath}`,
    )
  }
})

if (fs.existsSync(manifestPath)) {
  const manifestLines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/).slice(1)

  manifestLines.forEach((line, index) => {
    if (!line.trim()) {
      return
    }

    const match = /^"([^"]*)","([^"]*)"/.exec(line)

    if (!match) {
      errors.push(`Linha CSV invalida no manifesto: ${index + 2}`)
      return
    }

    const relativePath = match[2].replace(/\//g, path.sep)
    const diskPath = path.join(root, 'MSC_AUDIO_LIBRARY', relativePath)

    if (!fs.existsSync(diskPath)) {
      errors.push(`Manifesto aponta para arquivo ausente: ${match[2]}`)
    }
  })
} else {
  errors.push('Manifesto de audio ausente.')
}

if (deep && ffmpegPath) {
  publicFiles.forEach((filePath) => {
    const result = spawnSync(
      ffmpegPath,
      ['-v', 'error', '-i', filePath, '-f', 'null', '-'],
      {
        encoding: 'utf8',
        timeout: 60000,
        windowsHide: true,
      },
    )

    if (result.status !== 0) {
      errors.push(
        `Falha ao decodificar ${path.relative(root, filePath)}: ${(result.stderr || '').trim()}`,
      )
    }
  })
}

const totalBytes = publicFiles.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0)
console.log(`Audio auditado: ${publicFiles.length} arquivo(s), ${formatBytes(totalBytes)}.`)
console.log(`Referencias no codigo: ${sourceReferences.length}.`)
console.log(`Decodificacao profunda: ${deep ? 'sim' : 'nao'}.`)

warnings.forEach((warning) => console.warn(`AVISO: ${warning}`))
errors.forEach((error) => console.error(`ERRO: ${error}`))

if (errors.length > 0) {
  process.exitCode = 1
} else {
  console.log(`AUDITORIA DE AUDIO OK (${warnings.length} aviso(s)).`)
}
