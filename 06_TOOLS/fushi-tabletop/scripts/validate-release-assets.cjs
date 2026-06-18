const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const asar = require('@electron/asar')
const ffmpegPath = require('ffmpeg-static')

const rootDir = path.resolve(__dirname, '..')
const releaseDir = path.resolve(
  process.env.FUSHI_RELEASE_DIR ||
    path.join(rootDir, 'release', 'win-unpacked'),
)
const assetRoot = path.join(releaseDir, 'resources', 'assets')
const releaseAssetBudgetBytes = 700 * 1024 * 1024
const audioExtensions = new Set(['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.wav'])

const requiredFiles = [
  'maps/planicie/caverna-inicial/caverna_despertar.png',
  'maps/base-upgrades/base-upgrades-manifest.json',
  '_optimized/ui/base/upgrade-webs/base_floresta_seiva_upgrade_web.webp',
  'biomes/8-biomas/neutral/topdown_generic_neutral.svg',
  'biomes/8-biomas-ultra/neutral/cinematic_neutral_ultra.jpg',
  'objects/3d/inbox-1k/stone_pack.glb',
  'objects/3d/inbox-1k/the_sword_in_the_stone.glb',
  'dice-box/textures/bronze01.webp',
  'fx/video/thunder_red_looping_2.mp4',
  'audio/session-01/forest_ambience_cc0.mp3',
  'audio/msc/boss/music__boss__whispers_abyss__high__alkakrab__001.ogg',
  'audio/sfx/ui/bong_001.ogg',
  'audio/sfx/impacts/impactPunch_heavy_001.ogg',
  'audio/sfx/rpg/bookOpen.ogg',
  'audio/ambience/weather/rain_window_gentle_01.ogg',
  'audio/ambience/weather/rain_thunder_inside_ccby3.ogg',
  'ui/icons/hud-log-d20.svg',
  'factions/faction-a.svg',
]

const optionalObjectGlbsOmittedFromCore = [
  'objects/3d/inbox-1k/ship_pinnace.glb',
  'objects/3d/inbox-1k/corrupted_dark_forest_ent.glb',
  'objects/3d/inbox-1k/procedural_city_3.glb',
]

function assert(condition, message, failures) {
  if (!condition) {
    failures.push(message)
  }
}

function countManifestEntries(manifest, predicate) {
  if (!Array.isArray(manifest)) {
    return 0
  }

  return manifest.filter(predicate).length
}

function assetPathFromUrl(assetUrl) {
  if (typeof assetUrl !== 'string' || !assetUrl.startsWith('/assets/')) {
    return null
  }

  return path.join(assetRoot, ...assetUrl.replace('/assets/', '').split('/'))
}

function optimizedAssetPathFromUrl(assetUrl) {
  if (typeof assetUrl !== 'string' || !assetUrl.startsWith('/assets/')) {
    return null
  }

  if (!/\.(png|jpe?g)$/i.test(assetUrl)) {
    return null
  }

  const optimizedUrl = assetUrl
    .replace('/assets/', '/assets/_optimized/')
    .replace(/\.(png|jpe?g)$/i, '.webp')

  return assetPathFromUrl(optimizedUrl)
}

function walkFiles(dir, visitor) {
  if (!fs.existsSync(dir)) {
    return
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walkFiles(entryPath, visitor)
    } else if (entry.isFile()) {
      visitor(entryPath)
    }
  }
}

function countFiles(dir, predicate) {
  let total = 0

  walkFiles(dir, (filePath) => {
    if (predicate(filePath)) {
      total += 1
    }
  })

  return total
}

function getDirectorySize(dir) {
  let total = 0

  walkFiles(dir, (filePath) => {
    total += fs.statSync(filePath).size
  })

  return total
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

function validateBaseManifest(failures) {
  const manifestPath = path.join(assetRoot, 'maps', 'base-upgrades', 'base-upgrades-manifest.json')
  const releaseBaseMapsDir = path.join(assetRoot, 'maps', 'base-upgrades')
  const releaseOptimizedBaseMapsDir = path.join(assetRoot, '_optimized', 'maps', 'base-upgrades')

  if (!fs.existsSync(manifestPath)) {
    failures.push(`Manifest de Base ausente no release: ${manifestPath}`)
    return
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const topdownEntries = countManifestEntries(
    manifest,
    (entry) => typeof entry?.image === 'string' && entry.image.endsWith('_topdown.png'),
  )
  const arrivalEntries = countManifestEntries(manifest, (entry) => entry?.phase === 'arrival_empty')
  const phaseArrivalEntries = countManifestEntries(manifest, (entry) => entry?.kind === 'arrival_phase')
  const missingReferencedFiles = []
  const optimizedTopdownEntries = countManifestEntries(
    manifest,
    (entry) => fs.existsSync(optimizedAssetPathFromUrl(entry?.image) ?? ''),
  )
  const originalTopdownFiles = countFiles(releaseBaseMapsDir, (filePath) =>
    filePath.endsWith('_topdown.png'),
  )
  const optimizedTopdownFiles = countFiles(releaseOptimizedBaseMapsDir, (filePath) =>
    filePath.endsWith('_topdown.webp'),
  )

  for (const entry of Array.isArray(manifest) ? manifest : []) {
    for (const key of ['image', 'thumb']) {
      const filePath = assetPathFromUrl(entry?.[key])
      const optimizedPath = key === 'image' ? optimizedAssetPathFromUrl(entry?.[key]) : null

      if (
        filePath &&
        !fs.existsSync(filePath) &&
        (!optimizedPath || !fs.existsSync(optimizedPath))
      ) {
        missingReferencedFiles.push(entry[key])
      }
    }
  }

  assert(topdownEntries === 24, `Manifest de Base precisa listar 24 topdowns, encontrou ${topdownEntries}`, failures)
  assert(arrivalEntries === 8, `Manifest de Base precisa listar 8 chegadas vazias, encontrou ${arrivalEntries}`, failures)
  assert(
    phaseArrivalEntries === 16,
    `Manifest de Base precisa listar 16 chegadas de fase 2/3, encontrou ${phaseArrivalEntries}`,
    failures,
  )
  assert(
    optimizedTopdownEntries >= 24 && optimizedTopdownFiles === 24,
    `Release precisa conter 24 derivados WebP otimizados dos topdowns de Base, encontrou ${optimizedTopdownFiles} arquivo(s) e ${optimizedTopdownEntries} entrada(s) com fallback`,
    failures,
  )
  assert(
    originalTopdownFiles === 0,
    `Release core nao deve empacotar PNGs topdown originais de Base; encontrou ${originalTopdownFiles}`,
    failures,
  )
  assert(
    missingReferencedFiles.length === 0,
    `Manifest de Base aponta arquivos ausentes: ${missingReferencedFiles.slice(0, 8).join(', ')}`,
    failures,
  )
}

function validatePackagedAudio(failures) {
  const audioRoot = path.join(assetRoot, 'audio')
  const packagedAudioFiles = []

  walkFiles(audioRoot, (filePath) => {
    if (audioExtensions.has(path.extname(filePath).toLowerCase())) {
      packagedAudioFiles.push(filePath)
    }
  })

  assert(
    packagedAudioFiles.length === 48,
    `Release precisa conter 48 audios core, encontrou ${packagedAudioFiles.length}`,
    failures,
  )

  for (const filePath of packagedAudioFiles) {
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
      failures.push(
        `Audio empacotado invalido: ${path.relative(assetRoot, filePath)} ${(result.stderr || '').trim()}`,
      )
    }
  }

  const asarPath = path.join(releaseDir, 'resources', 'app.asar')

  if (fs.existsSync(asarPath)) {
    const duplicatedAudioEntries = asar
      .listPackage(asarPath)
      .filter((entry) => entry.includes('/dist/assets/audio/'))

    assert(
      duplicatedAudioEntries.length === 0,
      `Audio duplicado dentro do app.asar: ${duplicatedAudioEntries.length} entrada(s)`,
      failures,
    )
  }
}

function validateAsarHasNoPublicAssetCopies(failures) {
  const asarPath = path.join(releaseDir, 'resources', 'app.asar')

  if (!fs.existsSync(asarPath)) {
    return
  }

  const copiedPublicAssetEntries = asar
    .listPackage(asarPath)
    .filter((entry) => /[\\/]dist[\\/]assets[\\/](?:_optimized|audio|biomes|dice-box|factions|fx|maps|mundi|objects|transitions|ui)[\\/]/i.test(entry))

  assert(
    copiedPublicAssetEntries.length === 0,
    `Assets publicos duplicados dentro do app.asar: ${copiedPublicAssetEntries.length} entrada(s)`,
    failures,
  )
}

function main() {
  const failures = []
  let releaseAssetBytes = 0

  assert(fs.existsSync(path.join(releaseDir, 'RPG FUSHI.exe')), `Release exe ausente: ${releaseDir}`, failures)
  assert(fs.existsSync(path.join(releaseDir, 'resources', 'app.asar')), 'app.asar ausente no release empacotado', failures)
  assert(fs.existsSync(assetRoot), `Pasta de assets ausente no release: ${assetRoot}`, failures)

  for (const relativePath of requiredFiles) {
    assert(
      fs.existsSync(path.join(assetRoot, ...relativePath.split('/'))),
      `Asset runtime obrigatorio ausente: ${relativePath}`,
      failures,
    )
  }

  for (const relativePath of optionalObjectGlbsOmittedFromCore) {
    assert(
      !fs.existsSync(path.join(assetRoot, ...relativePath.split('/'))),
      `GLB opcional nao deve entrar no release core: ${relativePath}`,
      failures,
    )
  }

  if (fs.existsSync(assetRoot)) {
    releaseAssetBytes = getDirectorySize(assetRoot)

    assert(
      releaseAssetBytes <= releaseAssetBudgetBytes,
      `Assets do release passaram do orcamento core: ${formatBytes(releaseAssetBytes)} > ${formatBytes(releaseAssetBudgetBytes)}`,
      failures,
    )
    validateBaseManifest(failures)
    validatePackagedAudio(failures)
    validateAsarHasNoPublicAssetCopies(failures)
  }

  if (failures.length) {
    console.error(`release:assets falhou com ${failures.length} problema(s):`)

    for (const failure of failures) {
      console.error(`- ${failure}`)
    }

    process.exit(1)
  }

  console.log(
    `release:assets ok: ${formatBytes(releaseAssetBytes)} em assets core, 48 audios decodificados, sem copias publicas no ASAR e manifest de Base consistente.`,
  )
}

main()
