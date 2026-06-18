const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ffmpegPath = require('ffmpeg-static')

const projectRoot = path.resolve(__dirname, '..')
const appDataRoot = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'FUSHI',
)

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])
const DEFAULT_CODE = 'FUSHI-KZT3KA'
const DEFAULT_MIN_BYTES = 16 * 1024 * 1024
const DEFAULT_MAX_DIMENSION = 4000
const DEFAULT_QUALITY = 92

function getArg(name) {
  const prefix = `--${name}=`
  const value = process.argv.find((argument) => argument.startsWith(prefix))

  return value ? value.slice(prefix.length).trim() : ''
}

function getNumberArg(name, fallback) {
  const value = Number(getArg(name))

  return Number.isFinite(value) && value > 0 ? value : fallback
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function getExtension(filePath) {
  return path.extname(filePath).replace(/^\./, '').toLowerCase()
}

function toRelativeAssetPath(root, filePath) {
  return path
    .relative(root, filePath)
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('/')
}

function walkFiles(root, visitor) {
  if (!fs.existsSync(root)) {
    return
  }

  fs.readdirSync(root, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(root, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === '_optimized') {
        return
      }

      walkFiles(entryPath, visitor)
      return
    }

    if (entry.isFile()) {
      visitor(entryPath)
    }
  })
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (_error) {
    return null
  }
}

function getSourceRoots(manifest) {
  const customRoots = getArg('roots')
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (customRoots.length > 0) {
    return customRoots.map((entry) => path.resolve(entry)).filter((entry) => fs.existsSync(entry))
  }

  const manifestRoots = Array.isArray(manifest?.roots?.libraryAssets)
    ? manifest.roots.libraryAssets
    : []

  return [
    ...manifestRoots,
    path.join(appDataRoot, 'library', 'assets'),
    path.join(projectRoot, 'public', 'assets'),
  ]
    .map((entry) => path.resolve(entry))
    .filter((entry, index, roots) => fs.existsSync(entry) && roots.indexOf(entry) === index)
}

function resolveManifestAssetPath(assetPath, sourceRoots) {
  for (const root of sourceRoots) {
    const candidatePath = path.resolve(root, assetPath)

    if (
      candidatePath.startsWith(path.resolve(root) + path.sep) &&
      fs.existsSync(candidatePath) &&
      fs.statSync(candidatePath).isFile()
    ) {
      return candidatePath
    }
  }

  return ''
}

function collectAssetsFromManifest(manifest, sourceRoots) {
  if (!Array.isArray(manifest?.assets)) {
    return []
  }

  return manifest.assets
    .map((asset) => {
      const relativePath = typeof asset.path === 'string' ? asset.path : ''
      const extension = getExtension(relativePath)
      const sourcePath = resolveManifestAssetPath(relativePath, sourceRoots)
      const size = sourcePath ? fs.statSync(sourcePath).size : Number(asset.size) || 0

      return {
        extension,
        relativePath,
        size,
        sourcePath,
      }
    })
    .filter((asset) => asset.sourcePath)
}

function collectAssetsFromRoots(sourceRoots) {
  const assetsByPath = new Map()

  sourceRoots.forEach((root) => {
    walkFiles(root, (filePath) => {
      const relativePath = toRelativeAssetPath(root, filePath)

      if (!relativePath || assetsByPath.has(relativePath)) {
        return
      }

      assetsByPath.set(relativePath, {
        extension: getExtension(filePath),
        relativePath,
        size: fs.statSync(filePath).size,
        sourcePath: filePath,
      })
    })
  })

  return [...assetsByPath.values()]
}

function getCandidates(assets, minBytes, limit) {
  const candidates = assets
    .filter((asset) => IMAGE_EXTENSIONS.has(asset.extension))
    .filter((asset) => !asset.relativePath.startsWith('_optimized/'))
    .filter((asset) => asset.size >= minBytes)
    .sort((a, b) => b.size - a.size)

  return limit > 0 ? candidates.slice(0, limit) : candidates
}

function getOutputPath(outputRoot, relativePath) {
  const parsedPath = path.parse(relativePath)
  const outputRelativePath = path.join(parsedPath.dir, `${parsedPath.name}.webp`)
  const outputPath = path.resolve(outputRoot, outputRelativePath)

  if (!outputPath.startsWith(path.resolve(outputRoot) + path.sep)) {
    throw new Error(`Saida fora da pasta _optimized bloqueada: ${relativePath}`)
  }

  return outputPath
}

function optimizeAsset(asset, outputPath, options) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  const scaleFilter =
    `scale='if(gt(iw,ih),min(iw,${options.maxDimension}),-2)':` +
    `'if(gte(ih,iw),min(ih,${options.maxDimension}),-2)'`
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    asset.sourcePath,
    '-vf',
    scaleFilter,
    '-frames:v',
    '1',
    '-c:v',
    'libwebp',
    '-quality',
    String(options.quality),
    '-compression_level',
    '5',
    outputPath,
  ]
  const result = spawnSync(ffmpegPath, args, {
    encoding: 'utf8',
    windowsHide: true,
  })

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'ffmpeg falhou').trim())
  }
}

function writeOptimizationManifest(outputRoot, entries, options) {
  const manifestPath = path.join(outputRoot, 'fushi-optimized-assets.json')
  const manifest = {
    createdAt: new Date().toISOString(),
    entries,
    maxDimension: options.maxDimension,
    quality: options.quality,
    notes:
      'Derivados opcionais para carregamento da mesa. Os assets canonicos continuam preservados fora de _optimized.',
  }

  fs.mkdirSync(outputRoot, { recursive: true })
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
}

function main() {
  const code = getArg('code') || DEFAULT_CODE
  const manifestPath = getArg('manifest')
    ? path.resolve(getArg('manifest'))
    : path.join(projectRoot, 'release', 'campaign-packs', code, 'manifest.json')
  const manifest = readJson(manifestPath)
  const sourceRoots = getSourceRoots(manifest)
  const outputRoot = path.resolve(
    getArg('output') || path.join(projectRoot, 'public', 'assets', '_optimized'),
  )
  const minBytes = getNumberArg('min-mb', DEFAULT_MIN_BYTES / 1024 / 1024) * 1024 * 1024
  const limit = Math.max(0, Math.floor(getNumberArg('limit', 20)))
  const maxDimension = Math.max(640, Math.floor(getNumberArg('max-dimension', DEFAULT_MAX_DIMENSION)))
  const quality = Math.max(70, Math.min(100, Math.floor(getNumberArg('quality', DEFAULT_QUALITY))))
  const shouldWrite = hasFlag('write')
  const force = hasFlag('force')
  const manifestAssets = collectAssetsFromManifest(manifest, sourceRoots)
  const assets = manifestAssets.length > 0 ? manifestAssets : collectAssetsFromRoots(sourceRoots)
  const candidates = getCandidates(assets, minBytes, limit)
  const entries = []
  let originalBytes = 0
  let outputBytes = 0
  let converted = 0
  let skipped = 0

  console.log('Otimizacao de assets FUSHI')
  console.log(`Modo: ${shouldWrite ? 'gerar derivados' : 'plano somente; use --write para gerar'}`)
  console.log(`Fonte: ${manifestAssets.length > 0 ? manifestPath : sourceRoots.join(path.delimiter)}`)
  console.log(`Saida: ${outputRoot}`)
  console.log(`Candidatos: ${candidates.length}`)
  console.log(`Qualidade WebP: ${quality}; max dimension: ${maxDimension}`)

  candidates.forEach((asset, index) => {
    const outputPath = getOutputPath(outputRoot, asset.relativePath)
    const alreadyExists = fs.existsSync(outputPath)
    originalBytes += asset.size

    if (!shouldWrite) {
      console.log(
        `${String(index + 1).padStart(2)}. plano ${formatBytes(asset.size).padStart(10)} -> ${path.relative(projectRoot, outputPath)}`,
      )
      return
    }

    if (alreadyExists && !force) {
      const existingSize = fs.statSync(outputPath).size
      outputBytes += existingSize
      skipped += 1
      entries.push({
        originalPath: asset.relativePath,
        originalSize: asset.size,
        optimizedPath: `_optimized/${asset.relativePath.replace(/\.(png|jpe?g)$/i, '.webp')}`,
        optimizedSize: existingSize,
        status: 'exists',
      })
      console.log(
        `${String(index + 1).padStart(2)}. existe ${formatBytes(asset.size).padStart(10)} -> ${formatBytes(existingSize).padStart(9)}  ${asset.relativePath}`,
      )
      return
    }

    optimizeAsset(asset, outputPath, { maxDimension, quality })

    const optimizedSize = fs.statSync(outputPath).size
    outputBytes += optimizedSize
    converted += 1
    entries.push({
      originalPath: asset.relativePath,
      originalSize: asset.size,
      optimizedPath: `_optimized/${asset.relativePath.replace(/\.(png|jpe?g)$/i, '.webp')}`,
      optimizedSize,
      status: 'converted',
    })
    console.log(
      `${String(index + 1).padStart(2)}. ok     ${formatBytes(asset.size).padStart(10)} -> ${formatBytes(optimizedSize).padStart(9)}  ${asset.relativePath}`,
    )
  })

  if (shouldWrite) {
    writeOptimizationManifest(outputRoot, entries, { maxDimension, quality })
  }

  console.log('\nResumo')
  console.log(`  Originais analisados: ${formatBytes(originalBytes)}`)
  console.log(`  Derivados: ${formatBytes(outputBytes)}`)
  console.log(`  Convertidos: ${converted}`)
  console.log(`  Ja existiam: ${skipped}`)

  if (outputBytes > 0) {
    console.log(`  Reducao estimada de I/O: ${formatBytes(Math.max(0, originalBytes - outputBytes))}`)
  }
}

main()
