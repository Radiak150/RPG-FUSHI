const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const appDataRoot = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'FUSHI',
)

const defaultRoots = [
  path.join(projectRoot, 'public', 'assets'),
  path.join(appDataRoot, 'library', 'assets'),
]

const EXTENSION_GROUPS = {
  audio: new Set(['aac', 'flac', 'm4a', 'mp3', 'ogg', 'wav']),
  image: new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']),
  model: new Set(['fbx', 'glb', 'gltf', 'obj', 'stl']),
  video: new Set(['mkv', 'mov', 'mp4', 'webm']),
}

const SOFT_BUDGETS = {
  audio: 20 * 1024 * 1024,
  image: 16 * 1024 * 1024,
  model: 60 * 1024 * 1024,
  other: 24 * 1024 * 1024,
  video: 120 * 1024 * 1024,
}

function getArg(name) {
  const prefix = `--${name}=`
  const value = process.argv.find((argument) => argument.startsWith(prefix))

  return value ? value.slice(prefix.length).trim() : ''
}

function getNumberArg(name, fallback) {
  const value = Number(getArg(name))

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
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
  return path.extname(filePath).replace(/^\./, '').toLowerCase() || 'sem-ext'
}

function getKind(extension) {
  if (EXTENSION_GROUPS.image.has(extension)) return 'image'
  if (EXTENSION_GROUPS.video.has(extension)) return 'video'
  if (EXTENSION_GROUPS.audio.has(extension)) return 'audio'
  if (EXTENSION_GROUPS.model.has(extension)) return 'model'

  return 'other'
}

function isIntentionalDirectoryMarker(assetPath) {
  const filename = path.posix.basename(assetPath).toLowerCase()

  return filename === '.gitkeep' || filename === '.keep'
}

function getOptimizedVariantPath(assetPath) {
  if (!/\.(png|jpe?g)$/i.test(assetPath) || assetPath.startsWith('_optimized/')) {
    return ''
  }

  return `_optimized/${assetPath.replace(/\.(png|jpe?g)$/i, '.webp')}`
}

function hasRuntimeModelQualityGuard() {
  const stagePath = path.join(projectRoot, 'src', 'rendering', 'three', 'Tabletop3DStage.tsx')

  try {
    const source = fs.readFileSync(stagePath, 'utf8')

    return source.includes("quality !== 'ultra'") && source.includes('makeGltfObject')
  } catch (_error) {
    return false
  }
}

function walkFiles(root, visitor) {
  if (!fs.existsSync(root)) {
    return
  }

  fs.readdirSync(root, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(root, entry.name)

    if (entry.isDirectory()) {
      walkFiles(entryPath, visitor)
      return
    }

    if (entry.isFile()) {
      visitor(entryPath)
    }
  })
}

function toRelativePath(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/')
}

function collectRootAssets(roots) {
  const assets = []

  roots.forEach((root) => {
    const resolvedRoot = path.resolve(root)

    walkFiles(resolvedRoot, (filePath) => {
      const stats = fs.statSync(filePath)
      const extension = getExtension(filePath)
      const kind = getKind(extension)

      assets.push({
        extension,
        kind,
        path: toRelativePath(resolvedRoot, filePath),
        root: resolvedRoot,
        size: stats.size,
      })
    })
  })

  return assets
}

function readManifestAssets(manifestPath) {
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    return []
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const assets = Array.isArray(manifest.assets) ? manifest.assets : []

  return assets.map((asset) => {
    const assetPath = typeof asset.path === 'string' ? asset.path : ''
    const extension = getExtension(assetPath)

    return {
      extension,
      kind: getKind(extension),
      path: assetPath,
      root: `manifest:${path.basename(manifestPath)}`,
      size: typeof asset.size === 'number' ? asset.size : 0,
    }
  })
}

function summarize(assets) {
  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0)
  const byKind = new Map()
  const byExtension = new Map()
  const byPath = new Map()
  const assetPathSet = new Set(assets.map((asset) => asset.path))
  const oversized = []
  const zeroByte = []

  assets.forEach((asset) => {
    const kindSummary = byKind.get(asset.kind) ?? { bytes: 0, files: 0 }
    kindSummary.bytes += asset.size
    kindSummary.files += 1
    byKind.set(asset.kind, kindSummary)

    const extensionSummary = byExtension.get(asset.extension) ?? { bytes: 0, files: 0 }
    extensionSummary.bytes += asset.size
    extensionSummary.files += 1
    byExtension.set(asset.extension, extensionSummary)

    if (asset.size === 0 && !isIntentionalDirectoryMarker(asset.path)) {
      zeroByte.push(asset)
    }

    if (asset.size > (SOFT_BUDGETS[asset.kind] ?? SOFT_BUDGETS.other)) {
      oversized.push(asset)
    }

    const pathEntries = byPath.get(asset.path) ?? []
    pathEntries.push(asset)
    byPath.set(asset.path, pathEntries)
  })

  const duplicatePaths = [...byPath.values()]
    .filter((pathAssets) => pathAssets.length > 1)
    .sort((a, b) => b.length - a.length || b[0].size - a[0].size)
  const oversizedImages = oversized.filter(
    (asset) => asset.kind === 'image' && !asset.path.startsWith('_optimized/'),
  )
  const optimizedCovered = oversizedImages.filter((asset) =>
    assetPathSet.has(getOptimizedVariantPath(asset.path)),
  )
  const optimizedMissing = oversizedImages.filter(
    (asset) => !assetPathSet.has(getOptimizedVariantPath(asset.path)),
  )

  return {
    byExtension,
    byKind,
    duplicatePaths,
    largest: [...assets].sort((a, b) => b.size - a.size),
    optimizedCovered,
    optimizedMissing,
    oversized: oversized.sort((a, b) => b.size - a.size),
    totalBytes,
    zeroByte,
  }
}

function printTable(title, rows, formatter) {
  console.log(`\n${title}`)

  if (rows.length === 0) {
    console.log('  nenhum')
    return
  }

  rows.forEach((row, index) => {
    console.log(formatter(row, index))
  })
}

function main() {
  const manifestArg = getArg('manifest')
  const code = getArg('code') || 'FUSHI-KZT3KA'
  const strict = hasFlag('strict')
  const top = getNumberArg('top', 24)
  const defaultManifest = path.join(
    projectRoot,
    'release',
    'campaign-packs',
    code,
    'manifest.json',
  )
  const manifestPath = manifestArg ? path.resolve(manifestArg) : defaultManifest
  const rootsArg = getArg('roots')
  const roots = rootsArg
    ? rootsArg.split(path.delimiter).map((entry) => entry.trim()).filter(Boolean)
    : defaultRoots
  const rootAssets = collectRootAssets(roots)
  const manifestAssets = readManifestAssets(manifestPath)
  const sourceLabel = manifestAssets.length > 0 ? `manifest ${manifestPath}` : 'asset roots'
  const assets = manifestAssets.length > 0 ? manifestAssets : rootAssets
  const summary = summarize(assets)
  const runtimeModelQualityGuard = hasRuntimeModelQualityGuard()
  const runtimeGuardedModels = runtimeModelQualityGuard
    ? summary.oversized.filter((asset) => asset.kind === 'model')
    : []
  const optimizedCoveredPaths = new Set(summary.optimizedCovered.map((asset) => asset.path))
  const runtimeGuardedModelPaths = new Set(runtimeGuardedModels.map((asset) => asset.path))
  const uncoveredOversized = summary.oversized.filter(
    (asset) =>
      !optimizedCoveredPaths.has(asset.path) && !runtimeGuardedModelPaths.has(asset.path),
  )

  console.log('Auditoria de assets FUSHI')
  console.log('Modo: leitura somente; nenhum arquivo sera alterado.')
  console.log(`Fonte: ${sourceLabel}`)
  console.log(`Arquivos: ${assets.length}`)
  console.log(`Total: ${formatBytes(summary.totalBytes)}`)

  printTable(
    'Por categoria',
    [...summary.byKind.entries()].sort((a, b) => b[1].bytes - a[1].bytes),
    ([kind, value]) => `  ${kind.padEnd(6)} ${String(value.files).padStart(5)} arquivos  ${formatBytes(value.bytes).padStart(10)}`,
  )

  printTable(
    'Por extensao',
    [...summary.byExtension.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 16),
    ([extension, value]) => `  ${extension.padEnd(8)} ${String(value.files).padStart(5)} arquivos  ${formatBytes(value.bytes).padStart(10)}`,
  )

  printTable(
    'Maiores arquivos',
    summary.largest.slice(0, top),
    (asset, index) =>
      `  ${String(index + 1).padStart(2)}. ${formatBytes(asset.size).padStart(10)}  ${asset.kind.padEnd(6)}  ${asset.path}`,
  )

  printTable(
    'Acima do orcamento suave',
    summary.oversized.slice(0, top),
    (asset) =>
      `  ${formatBytes(asset.size).padStart(10)}  limite ${formatBytes(SOFT_BUDGETS[asset.kind] ?? SOFT_BUDGETS.other).padStart(9)}  ${asset.kind.padEnd(6)}  ${asset.path}`,
  )

  printTable(
    'Caminhos duplicados entre raizes',
    summary.duplicatePaths.slice(0, top),
    (pathAssets) =>
      `  ${pathAssets[0].path} (${pathAssets.length} ocorrencias: ${pathAssets
        .map((asset) => path.basename(asset.root))
        .join(', ')})`,
  )

  printTable(
    'Originais pesados cobertos por _optimized',
    summary.optimizedCovered.slice(0, top),
    (asset) =>
      `  ${formatBytes(asset.size).padStart(10)}  -> ${getOptimizedVariantPath(asset.path)}`,
  )

  printTable(
    'Originais pesados sem derivado',
    summary.optimizedMissing.slice(0, top),
    (asset) => `  ${formatBytes(asset.size).padStart(10)}  ${asset.path}`,
  )

  printTable(
    'Modelos pesados protegidos fora do ultra',
    runtimeGuardedModels.slice(0, top),
    (asset) =>
      `  ${formatBytes(asset.size).padStart(10)}  ${asset.path}  -> proxy 3D em low/balanced`,
  )

  if (summary.zeroByte.length > 0) {
    printTable(
      'Arquivos vazios',
      summary.zeroByte.slice(0, top),
      (asset) => `  ${asset.path}`,
    )
  }

  console.log('\nLeitura pratica')
  console.log(
    summary.optimizedMissing.length > 0
      ? `  ${summary.optimizedMissing.length} imagem(ns) pesada(s) ainda sem derivado _optimized.`
      : '  Todas as imagens pesadas auditadas tem derivado _optimized.',
  )
  console.log(
    summary.optimizedCovered.length > 0
      ? `  ${summary.optimizedCovered.length} imagem(ns) pesada(s) ja ficam cobertas pelo carregamento leve.`
      : '  Nenhuma imagem pesada coberta por derivado ainda.',
  )
  console.log(
    summary.oversized.length > summary.optimizedCovered.length
      ? `  ${summary.oversized.length - summary.optimizedCovered.length} alerta(s) pesado(s) continuam fora da cobertura de imagem.`
      : '  Nenhum alerta pesado restante fora da cobertura de imagem.',
  )
  console.log(
    runtimeGuardedModels.length > 0
      ? `  ${runtimeGuardedModels.length} modelo(s) pesado(s) ficam protegidos no runtime fora do modo ultra.`
      : '  Nenhum modelo pesado protegido por qualidade foi detectado.',
  )
  console.log(
    uncoveredOversized.length > 0
      ? `  ${uncoveredOversized.length} alerta(s) pesado(s) ainda exigem decisao futura de conteudo/pacote.`
      : '  Nenhum alerta pesado restante sem cobertura runtime ou _optimized.',
  )
  console.log(
    summary.zeroByte.length > 0
      ? `  ${summary.zeroByte.length} arquivo(s) vazio(s) precisam ser removidos ou substituidos.`
      : '  Nenhum arquivo vazio encontrado.',
  )
  console.log(
    summary.duplicatePaths.length > 0
      ? `  ${summary.duplicatePaths.length} caminho(s) duplicado(s) podem causar pacote maior que o necessario.`
      : '  Nenhum caminho duplicado encontrado nas fontes auditadas.',
  )

  if (strict && (summary.oversized.length > 0 || summary.zeroByte.length > 0)) {
    process.exitCode = 1
  }
}

main()
