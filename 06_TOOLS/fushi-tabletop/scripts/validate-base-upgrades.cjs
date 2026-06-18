const fs = require('fs')
const path = require('path')
const vm = require('vm')

const rootDir = path.resolve(__dirname, '..')
const worldMundiStatePath = path.join(rootDir, 'src', 'lib', 'worldMundiState.ts')
const upgradeWebDir = path.join(rootDir, 'public', 'assets', 'ui', 'base', 'upgrade-webs')
const baseMapsDir = path.join(rootDir, 'public', 'assets', 'maps', 'base-upgrades')
const releaseBaseMapsDir = path.join(rootDir, 'release', 'win-unpacked', 'resources', 'assets', 'maps', 'base-upgrades')
const releaseOptimizedBaseMapsDir = path.join(rootDir, 'release', 'win-unpacked', 'resources', 'assets', '_optimized', 'maps', 'base-upgrades')

const expectedBaseIds = [
  'base_planicie_nascente',
  'base_praia_ancora',
  'base_montanha_refugio',
  'base_floresta_seiva',
  'base_vulcao_obsidiana',
  'base_gelo_abrigo',
  'base_ruinas_memorial',
  'base_veu_esconderijo',
]

const expectedUpgradeIds = [
  'reforma_inicial',
  'dormitorio_compartilhado',
  'agua_e_cozinha',
  'deposito_de_recursos',
  'oficina_improvisada',
  'defesas_externas',
  'enfermaria',
  'sala_de_musica',
  'biblioteca_de_memoria',
  'nucleo_fushi_controlado',
  'sala_mundi',
]

const basePhaseArrivalSuffixes = [
  '_fase2_meio_construida_arrival.png',
  '_fase3_completa_arrival.png',
]

const basePhaseArrivalThumbSuffixes = [
  '_fase2_meio_construida_arrival_thumb_640.jpg',
  '_fase3_completa_arrival_thumb_640.jpg',
]

const validIconKeys = new Set([
  'bed',
  'book',
  'box',
  'core',
  'cross',
  'home',
  'map',
  'music',
  'shield',
  'tool',
  'water',
])

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker)

  if (markerIndex < 0) {
    throw new Error(`Nao encontrei ${marker}`)
  }

  const assignmentIndex = source.indexOf('=', markerIndex)

  if (assignmentIndex < 0) {
    throw new Error(`Nao encontrei atribuicao de ${marker}`)
  }

  const start = source.indexOf('{', assignmentIndex)

  if (start < 0) {
    throw new Error(`Nao encontrei objeto de ${marker}`)
  }

  let depth = 0
  let quote = ''
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = ''
      }
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return source.slice(start, index + 1)
      }
    }
  }

  throw new Error(`Objeto de ${marker} nao fechou`)
}

function evaluateObjectLiteral(literal, label) {
  try {
    return vm.runInNewContext(`(${literal})`, {}, { timeout: 1000 })
  } catch (error) {
    throw new Error(`Falha ao avaliar ${label}: ${error.message}`)
  }
}

function getPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath)

  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${filePath} nao e PNG valido`)
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

function countFiles(dir, predicate) {
  if (!fs.existsSync(dir)) {
    return 0
  }

  return fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return total + countFiles(entryPath, predicate)
    }

    return total + (predicate(entryPath) ? 1 : 0)
  }, 0)
}

function assert(condition, message, failures) {
  if (!condition) {
    failures.push(message)
  }
}

function validateLayout() {
  const failures = []
  const source = readText(worldMundiStatePath)
  const defaultLayout = evaluateObjectLiteral(
    extractObjectLiteral(source, 'const baseUpgradeWebLayoutById'),
    'baseUpgradeWebLayoutById',
  )
  const pedestalLayout = evaluateObjectLiteral(
    extractObjectLiteral(source, 'const baseUpgradePedestalLayoutByBaseId'),
    'baseUpgradePedestalLayoutByBaseId',
  )

  for (const upgradeId of expectedUpgradeIds) {
    const layout = defaultLayout[upgradeId]

    assert(Boolean(layout), `Layout padrao ausente: ${upgradeId}`, failures)
    assert(validIconKeys.has(layout?.iconKey), `iconKey invalido em ${upgradeId}`, failures)
    assert(Array.isArray(layout?.dependsOnIds), `dependsOnIds invalido em ${upgradeId}`, failures)

    assert(
      (layout?.dependsOnIds ?? []).length === 0,
      `${upgradeId} deve ficar livre para ativacao radial, sem cadeia de dependencia`,
      failures,
    )
  }

  for (const baseId of expectedBaseIds) {
    const overrides = pedestalLayout[baseId]

    assert(Boolean(overrides), `Layout por bioma ausente: ${baseId}`, failures)

    const seen = []

    for (const upgradeId of expectedUpgradeIds) {
      const layout = {
        ...defaultLayout[upgradeId],
        ...(overrides?.[upgradeId] ?? {}),
      }

      assert(Boolean(overrides?.[upgradeId]), `${baseId} sem coordenada calibrada para ${upgradeId}`, failures)
      assert(
        Number.isFinite(layout.x) && layout.x >= 8 && layout.x <= 92,
        `${baseId}/${upgradeId} x fora da area segura: ${layout.x}`,
        failures,
      )
      assert(
        Number.isFinite(layout.y) && layout.y >= 10 && layout.y <= 88,
        `${baseId}/${upgradeId} y fora da area segura: ${layout.y}`,
        failures,
      )

      for (const previous of seen) {
        const distance = Math.hypot(layout.x - previous.x, layout.y - previous.y)

        assert(
          distance >= 5.5,
          `${baseId} sobreposicao: ${previous.id} e ${upgradeId} (${distance.toFixed(1)}%)`,
          failures,
        )
      }

      seen.push({ id: upgradeId, x: layout.x, y: layout.y })
    }

    assert(seen.length === 11, `${baseId} deveria ter 11 upgrades, encontrou ${seen.length}`, failures)
  }

  return failures
}

function validateAssets() {
  const failures = []

  for (const baseId of expectedBaseIds) {
    const webFile = path.join(upgradeWebDir, `${baseId}_upgrade_web.png`)

    assert(fs.existsSync(webFile), `PNG da teia ausente: ${webFile}`, failures)

    if (fs.existsSync(webFile)) {
      const dimensions = getPngDimensions(webFile)
      assert(dimensions.width === 2400, `${baseId} teia precisa ter 2400px de largura`, failures)
      assert(dimensions.height === 1350, `${baseId} teia precisa ter 1350px de altura`, failures)
    }
  }

  assert(
    countFiles(baseMapsDir, (filePath) => filePath.endsWith('_topdown.png')) === 24,
    'public/assets/maps/base-upgrades precisa ter 24 topdowns',
    failures,
  )
  assert(
    countFiles(baseMapsDir, (filePath) => filePath.endsWith('_topdown_thumb_640.jpg')) === 24,
    'public/assets/maps/base-upgrades precisa ter 24 thumbs',
    failures,
  )
  assert(
    countFiles(baseMapsDir, (filePath) => filePath.endsWith('_arrival_empty.png')) === 8,
    'public/assets/maps/base-upgrades precisa ter 8 imagens de chegada vazia',
    failures,
  )
  assert(
    countFiles(baseMapsDir, (filePath) => filePath.endsWith('_arrival_empty_thumb_640.jpg')) === 8,
    'public/assets/maps/base-upgrades precisa ter 8 thumbs de chegada vazia',
    failures,
  )
  assert(
    countFiles(baseMapsDir, (filePath) =>
      basePhaseArrivalSuffixes.some((suffix) => filePath.endsWith(suffix)),
    ) === 16,
    'public/assets/maps/base-upgrades precisa ter 16 interludios de fase 2/3',
    failures,
  )
  assert(
    countFiles(baseMapsDir, (filePath) =>
      basePhaseArrivalThumbSuffixes.some((suffix) => filePath.endsWith(suffix)),
    ) === 16,
    'public/assets/maps/base-upgrades precisa ter 16 thumbs de interludios de fase 2/3',
    failures,
  )
  assert(
    fs.existsSync(path.join(baseMapsDir, 'base-upgrades-manifest.json')),
    'Manifest publico das bases ausente',
    failures,
  )

  if (fs.existsSync(path.join(baseMapsDir, 'base-upgrades-manifest.json'))) {
    const manifest = JSON.parse(readText(path.join(baseMapsDir, 'base-upgrades-manifest.json')))
    const arrivalEntries = Array.isArray(manifest)
      ? manifest.filter((entry) => entry?.phase === 'arrival_empty')
      : []
    const phaseArrivalEntries = Array.isArray(manifest)
      ? manifest.filter((entry) => entry?.kind === 'arrival_phase')
      : []

    assert(arrivalEntries.length === 8, 'Manifest publico precisa registrar 8 chegadas vazias', failures)
    assert(phaseArrivalEntries.length === 16, 'Manifest publico precisa registrar 16 chegadas de fase 2/3', failures)
  }

  if (fs.existsSync(releaseBaseMapsDir)) {
    const releaseOriginalTopdownCount = countFiles(releaseBaseMapsDir, (filePath) =>
      filePath.endsWith('_topdown.png'),
    )
    const releaseOptimizedTopdownCount = countFiles(releaseOptimizedBaseMapsDir, (filePath) =>
      filePath.endsWith('_topdown.webp'),
    )

    assert(
      releaseOriginalTopdownCount === 24 || releaseOptimizedTopdownCount === 24,
      `release/win-unpacked precisa ter 24 topdowns de Base originais ou 24 derivados WebP, encontrou ${releaseOriginalTopdownCount} PNG e ${releaseOptimizedTopdownCount} WebP`,
      failures,
    )
    assert(
      countFiles(releaseBaseMapsDir, (filePath) => filePath.endsWith('_topdown_thumb_640.jpg')) === 24,
      'release/win-unpacked precisa ter 24 thumbs de Base',
      failures,
    )
    assert(
      countFiles(releaseBaseMapsDir, (filePath) => filePath.endsWith('_arrival_empty.png')) === 8,
      'release/win-unpacked precisa ter 8 imagens de chegada vazia',
      failures,
    )
    assert(
      countFiles(releaseBaseMapsDir, (filePath) => filePath.endsWith('_arrival_empty_thumb_640.jpg')) === 8,
      'release/win-unpacked precisa ter 8 thumbs de chegada vazia',
      failures,
    )
    assert(
      countFiles(releaseBaseMapsDir, (filePath) =>
        basePhaseArrivalSuffixes.some((suffix) => filePath.endsWith(suffix)),
      ) === 16,
      'release/win-unpacked precisa ter 16 interludios de fase 2/3',
      failures,
    )
    assert(
      countFiles(releaseBaseMapsDir, (filePath) =>
        basePhaseArrivalThumbSuffixes.some((suffix) => filePath.endsWith(suffix)),
      ) === 16,
      'release/win-unpacked precisa ter 16 thumbs de interludios de fase 2/3',
      failures,
    )
    assert(
      fs.existsSync(path.join(releaseBaseMapsDir, 'base-upgrades-manifest.json')),
      'Manifest de Base ausente no release/win-unpacked',
      failures,
    )
  }

  return failures
}

const failures = [...validateLayout(), ...validateAssets()]

if (failures.length) {
  console.error(`Diagnostico BASE falhou com ${failures.length} erro(s):`)

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log(
  'Diagnostico BASE OK: 8 bases, 88 upgrades radiais livres, 24 topdowns, 8 chegadas vazias e 16 chegadas de fase validas.',
)
