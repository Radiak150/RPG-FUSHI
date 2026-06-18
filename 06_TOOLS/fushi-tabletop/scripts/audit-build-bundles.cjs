const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const assetsDir = path.join(distDir, 'assets')
const kib = 1024
const budgets = {
  applicationChunk: 500 * kib,
  anyChunk: 750 * kib,
  css: 250 * kib,
  tablePage: 400 * kib,
  totalDist: 12 * 1024 * kib,
}
const knownVendorChunkPatterns = [
  /^dice-box-threejs\./,
  /^three\.module-/,
]
const forbiddenCopiedPublicDirectories = [
  '_optimized',
  'audio',
  'biomes',
  'dice-box',
  'factions',
  'fx',
  'maps',
  'mundi',
  'objects',
  'transitions',
  'ui',
]

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath]
  })
}

function formatBytes(bytes) {
  return `${(bytes / kib).toFixed(1)} KiB`
}

function isKnownVendorChunk(filename) {
  return knownVendorChunkPatterns.some((pattern) => pattern.test(filename))
}

function main() {
  const failures = []

  if (!fs.existsSync(assetsDir)) {
    throw new Error(`Build ausente: ${assetsDir}`)
  }

  const files = walkFiles(distDir)
  const javascriptFiles = files.filter((filePath) => filePath.endsWith('.js'))
  const cssFiles = files.filter((filePath) => filePath.endsWith('.css'))
  const totalDistBytes = files.reduce(
    (total, filePath) => total + fs.statSync(filePath).size,
    0,
  )

  for (const filePath of javascriptFiles) {
    const filename = path.basename(filePath)
    const size = fs.statSync(filePath).size

    if (size > budgets.anyChunk) {
      failures.push(
        `${filename} excedeu o limite absoluto: ${formatBytes(size)} > ${formatBytes(budgets.anyChunk)}`,
      )
    }

    if (!isKnownVendorChunk(filename) && size > budgets.applicationChunk) {
      failures.push(
        `${filename} excedeu o limite de chunk da aplicacao: ${formatBytes(size)} > ${formatBytes(budgets.applicationChunk)}`,
      )
    }

    if (/^TablePage-/.test(filename) && size > budgets.tablePage) {
      failures.push(
        `${filename} excedeu o limite da mesa: ${formatBytes(size)} > ${formatBytes(budgets.tablePage)}`,
      )
    }
  }

  for (const filePath of cssFiles) {
    const size = fs.statSync(filePath).size

    if (size > budgets.css) {
      failures.push(
        `${path.basename(filePath)} excedeu o limite CSS: ${formatBytes(size)} > ${formatBytes(budgets.css)}`,
      )
    }
  }

  for (const directoryName of forbiddenCopiedPublicDirectories) {
    const copiedDirectory = path.join(assetsDir, directoryName)

    if (fs.existsSync(copiedDirectory)) {
      failures.push(
        `Build copiou public/assets/${directoryName} para dist; assets runtime devem vir da biblioteca ou de extraResources.`,
      )
    }
  }

  if (totalDistBytes > budgets.totalDist) {
    failures.push(
      `dist excedeu o limite total: ${formatBytes(totalDistBytes)} > ${formatBytes(budgets.totalDist)}`,
    )
  }

  const largestChunks = javascriptFiles
    .map((filePath) => ({
      filename: path.basename(filePath),
      size: fs.statSync(filePath).size,
    }))
    .sort((left, right) => right.size - left.size)
    .slice(0, 8)

  console.log(
    `bundle:audit: ${javascriptFiles.length} JS, ${cssFiles.length} CSS, dist ${formatBytes(totalDistBytes)}.`,
  )
  largestChunks.forEach((chunk) => {
    console.log(`- ${chunk.filename}: ${formatBytes(chunk.size)}`)
  })

  if (failures.length > 0) {
    console.error(`bundle:audit falhou com ${failures.length} problema(s):`)
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log('BUNDLE AUDIT OK: mesa abaixo de 400 KiB e nenhum asset publico duplicado em dist.')
}

main()
