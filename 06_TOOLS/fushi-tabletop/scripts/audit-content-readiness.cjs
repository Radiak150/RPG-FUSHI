const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createServer } = require('vite')

const projectRoot = path.resolve(__dirname, '..')
const outputRoot = path.join(projectRoot, '.codex-dev')
const releaseAssetRoot = path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'assets')
const publicAssetRoot = path.join(projectRoot, 'public', 'assets')
const loreRoot = path.resolve(projectRoot, '..', '..', '01_LORE')
const loreNpcRoot = path.join(loreRoot, 'npcs', 'Fac\u00e7\u00f5es')
const lorePremiseRoot = path.join(loreRoot, 'premissa')
const campaignControlPath = path.join(projectRoot, 'docs', 'planejamento', 'campanha-controle.json')
const protagonistRealFolder = 'Protagonista (Real Corpo)'
const protagonistVillageFolder = '(D) Villa (Planicie) (Protagonistas)'
const appDataAssetRoot = path.join(
  process.env.FUSHI_APPDATA_ROOT || process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'FUSHI',
  'library',
  'assets',
)
const appDataRoot = process.env.FUSHI_APPDATA_ROOT
  ? path.join(process.env.FUSHI_APPDATA_ROOT, 'FUSHI')
  : path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'FUSHI')

const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])
const audioExtensions = new Set(['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.wav'])
const videoExtensions = new Set(['.mkv', '.mov', '.mp4', '.webm'])
const modelExtensions = new Set(['.fbx', '.glb', '.gltf', '.obj', '.stl'])

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (_error) {
    return fallback
  }
}

function readCampaignControl() {
  const control = readJson(campaignControlPath, {
    version: 'campanha-controle-ausente',
    lanes: [],
    appChecklist: [],
    contentChecklist: [],
    mechanicProtocol: [],
    audioVfxBacklog: [],
    rules: [],
  })

  return {
    ...control,
    sourcePath: campaignControlPath,
  }
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true })
}

function walkFiles(directory, visitor) {
  if (!fs.existsSync(directory)) {
    return
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      walkFiles(entryPath, visitor)
    } else if (entry.isFile()) {
      visitor(entryPath)
    }
  }
}

function getKind(filePath) {
  const extension = path.extname(filePath).toLowerCase()

  if (imageExtensions.has(extension)) return 'image'
  if (audioExtensions.has(extension)) return 'audio'
  if (videoExtensions.has(extension)) return 'video'
  if (modelExtensions.has(extension)) return 'model'

  return 'other'
}

function getAssetPath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().replace(/\\/g, '/')
  const assetPathMatch = /^(?:\.\/|\/)?assets\/(.+)$/.exec(normalizedValue)

  if (assetPathMatch) {
    return assetPathMatch[1]
  }

  try {
    const url = new URL(normalizedValue)

    if (url.protocol === 'fushi-library:' && url.hostname === 'assets') {
      return decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    }
  } catch (_error) {
    return ''
  }

  return ''
}

function getOptimizedAssetPath(assetPath) {
  if (!assetPath || assetPath.startsWith('_optimized/') || !/\.(png|jpe?g)$/i.test(assetPath)) {
    return ''
  }

  return `_optimized/${assetPath.replace(/\.(png|jpe?g)$/i, '.webp')}`
}

function fileExistsInRoot(root, assetPath) {
  if (!assetPath || !fs.existsSync(root)) {
    return false
  }

  return fs.existsSync(path.join(root, ...assetPath.split('/').filter(Boolean)))
}

function assetExistsInRoot(root, value, allowOptimized = true) {
  const assetPath = getAssetPath(value)

  if (!assetPath) {
    return true
  }

  if (fileExistsInRoot(root, assetPath)) {
    return true
  }

  return allowOptimized && fileExistsInRoot(root, getOptimizedAssetPath(assetPath))
}

function collectAssetSummary(root) {
  const byKind = new Map()
  const byTopFolder = new Map()
  let totalBytes = 0
  let files = 0

  walkFiles(root, (filePath) => {
    const stats = fs.statSync(filePath)
    const relativePath = path.relative(root, filePath).replace(/\\/g, '/')
    const kind = getKind(filePath)
    const topFolder = relativePath.split('/')[0] || '(root)'

    totalBytes += stats.size
    files += 1
    byKind.set(kind, (byKind.get(kind) || 0) + stats.size)
    byTopFolder.set(topFolder, (byTopFolder.get(topFolder) || 0) + stats.size)
  })

  return {
    byKind: Object.fromEntries([...byKind.entries()].sort((a, b) => b[1] - a[1])),
    byTopFolder: Object.fromEntries([...byTopFolder.entries()].sort((a, b) => b[1] - a[1])),
    files,
    totalBytes,
  }
}

function getLatestCampaignPackManifest() {
  const packRoot = path.join(projectRoot, 'release', 'campaign-packs')
  const manifests = []

  walkFiles(packRoot, (filePath) => {
    if (path.basename(filePath).toLowerCase() === 'manifest.json') {
      manifests.push(filePath)
    }
  })

  return manifests
    .map((filePath) => ({ filePath, mtime: fs.statSync(filePath).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0]?.filePath || ''
}

function analyzeCampaignPack(manifestPath) {
  const manifest = readJson(manifestPath, { assets: [] })
  const assets = Array.isArray(manifest.assets) ? manifest.assets : []
  const assetByPath = new Map(assets.map((asset) => [asset.path, asset]))
  const totalsByKind = new Map()
  const totalsByExtension = new Map()
  const heavyOriginals = []

  for (const asset of assets) {
    const extension = path.extname(asset.path || '').replace(/^\./, '').toLowerCase() || 'sem-ext'
    const kind = getKind(asset.path || '')

    totalsByKind.set(kind, (totalsByKind.get(kind) || 0) + (asset.size || 0))
    totalsByExtension.set(extension, (totalsByExtension.get(extension) || 0) + (asset.size || 0))

    const optimizedPath = getOptimizedAssetPath(asset.path || '')
    const optimizedAsset = optimizedPath ? assetByPath.get(optimizedPath) : null

    if (kind === 'image' && (asset.size || 0) > 16 * 1024 * 1024) {
      heavyOriginals.push({
        optimizedPath,
        path: asset.path,
        size: asset.size || 0,
        optimizedSize: optimizedAsset?.size || 0,
        coveredByOptimized: Boolean(optimizedAsset),
        estimatedSavings: optimizedAsset ? Math.max(0, (asset.size || 0) - (optimizedAsset.size || 0)) : 0,
      })
    }
  }

  return {
    assets: assets.length,
    code: manifest.code || '',
    heavyOriginals,
    manifestPath,
    totals: manifest.totals || {
      bytes: assets.reduce((sum, asset) => sum + (asset.size || 0), 0),
      files: assets.length,
    },
    totalsByExtension: Object.fromEntries([...totalsByExtension.entries()].sort((a, b) => b[1] - a[1])),
    totalsByKind: Object.fromEntries([...totalsByKind.entries()].sort((a, b) => b[1] - a[1])),
  }
}

function csvEscape(value) {
  const text = String(value ?? '')

  if (!/[",\r\n]/.test(text)) {
    return text
  }

  return `"${text.replace(/"/g, '""')}"`
}

function writeCsv(filePath, rows) {
  const headers = Object.keys(rows[0] || { vazio: '' })
  const csvRows = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ]

  fs.writeFileSync(filePath, `${csvRows.join('\n')}\n`, 'utf8')
}

function bytesToMiB(bytes) {
  return Number(((bytes || 0) / 1024 / 1024).toFixed(1))
}

function getCharactersFromWorkspace() {
  const workspacePath = path.join(appDataRoot, 'workspace.json')
  const workspace = readJson(workspacePath, null)
  const characters = Array.isArray(workspace?.characters)
    ? workspace.characters
    : Array.isArray(workspace?.characters?.items)
      ? workspace.characters.items
      : []

  return {
    characters,
    sourceLabel: characters.length ? 'workspace real' : 'workspace real ausente',
    sourcePath: workspacePath,
  }
}

function textLength(...values) {
  return values
    .map((value) => {
      if (typeof value === 'string') return value
      if (!value || typeof value !== 'object') return ''

      return Object.values(value)
        .filter((item) => typeof item === 'string')
        .join(' ')
    })
    .join(' ')
    .trim().length
}

function hasStructuredMechanic(abilities, detailedAbilities, attacks) {
  if (detailedAbilities.length > 0 || attacks.length > 0) {
    return true
  }

  return abilities.some((ability) =>
    /\+|-|\bd\d+\b|dt|custo|dano|rodada|turno|acao|ação|fushi|determinacao|determinação/i.test(
      String(ability),
    ),
  )
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function levenshteinDistance(left, right) {
  const a = normalizeText(left).replace(/\s+/g, '')
  const b = normalizeText(right).replace(/\s+/g, '')

  if (a === b) return 0
  if (!a) return b.length
  if (!b) return a.length

  const previous = Array.from({ length: b.length + 1 }, (_value, index) => index)
  const current = Array.from({ length: b.length + 1 }, () => 0)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1

      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      )
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j]
    }
  }

  return previous[b.length]
}

function namesAreClose(left, right) {
  const a = normalizeText(left).replace(/\s+/g, '')
  const b = normalizeText(right).replace(/\s+/g, '')

  if (a.length < 5 || b.length < 5 || a[0] !== b[0]) {
    return false
  }

  return levenshteinDistance(a, b) <= 2
}

function getFolderDisplayName(directory) {
  return path.basename(directory).replace(/\s*\(.+?\)\s*/g, '').trim() || path.basename(directory)
}

function countMatches(text, regex) {
  return (String(text || '').match(regex) || []).length
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (_error) {
    return ''
  }
}

function extractParentheticalParts(value) {
  return [...String(value || '').matchAll(/\(([^)]+)\)/g)]
    .map((match) => match[1].trim())
    .filter(Boolean)
}

function uniqueNormalized(values) {
  return [...new Set(values.map(normalizeText).filter((value) => value.length >= 2))]
}

function parseProtagonistLink(relativePath, folderName) {
  const parts = relativePath.split('/')
  const factionFolder = parts[0] || ''
  const basename = path.basename(folderName || relativePath)
  const displayName = basename.replace(/\s*\(.+?\)\s*/g, '').trim() || basename
  const parenthetical = extractParentheticalParts(basename)
  const link = {
    appName: '',
    bodyName: displayName,
    playerName: '',
    role: '',
  }

  if (factionFolder === protagonistRealFolder) {
    link.role = basename.includes('Corpos Juntos')
      ? 'Organismo/corpo compartilhado'
      : 'Corpo real interpretado pelo player'
    link.appName = displayName
    link.playerName = parenthetical[0] || ''

    if (/fragmentado/i.test(normalizeText(basename))) {
      link.appName = 'Fragmentado'
      link.playerName = 'Jogadores'
    }

    if (/sem nome/i.test(normalizeText(displayName)) && link.playerName) {
      link.appName = link.playerName
    }
  } else if (factionFolder === protagonistVillageFolder && /protagonista/i.test(normalizeText(basename))) {
    link.role = 'Corpo/base emocional da Vila'
    const protagonistMatch = /Protagonista\s+([^;)]+)(?:;\s*([^)]+))?/i.exec(basename)
    link.appName = protagonistMatch?.[1]?.trim() || ''
    link.playerName = protagonistMatch?.[2]?.trim() || parenthetical.find((part) => !/protagonista/i.test(part)) || ''
  }

  return link
}

function getLoreCategory(relativePath, factionFolder) {
  if (relativePath.startsWith(`${protagonistRealFolder}/`)) {
    return 'Protagonista - corpo real'
  }

  if (relativePath.startsWith(`${protagonistVillageFolder}/`) && /protagonista/i.test(normalizeText(relativePath))) {
    return 'Protagonista - corpo da vila'
  }

  if (relativePath.startsWith(`${protagonistVillageFolder}/`)) {
    return 'NPC da vila'
  }

  if (factionFolder.includes('(F)')) {
    return 'Guardiao/Vulcao'
  }

  return 'NPC'
}

function scanPremiseLore() {
  const files = []

  walkFiles(lorePremiseRoot, (filePath) => {
    if (['.md', '.txt'].includes(path.extname(filePath).toLowerCase())) {
      const text = readTextFile(filePath)
      const normalizedText = normalizeText(`${filePath}\n${text}`)
      const tagKeys = ['fushi', 'protagonistas', 'existencia', 'morte', 'renascimento', 'corpo', 'fragmentos']
      files.push({
        nome: path.basename(filePath, path.extname(filePath)),
        relativePath: path.relative(loreRoot, filePath).replace(/\\/g, '/'),
        filePath,
        hasLoreText: text.trim().length > 0,
        textLength: text.trim().length,
        tags: tagKeys.filter((key) => normalizedText.includes(key)),
      })
    }
  })

  return files
}

function scanLoreFolders() {
  const allFiles = []

  walkFiles(loreNpcRoot, (filePath) => {
    allFiles.push(filePath)
  })

  const directories = new Map()
  for (const filePath of allFiles) {
    const directory = path.dirname(filePath)
    const bucket = directories.get(directory) || []
    bucket.push(filePath)
    directories.set(directory, bucket)
  }

  return [...directories.entries()]
    .filter(([directory, files]) => {
      if (directory === loreNpcRoot) return false

      const hasText = files.some((filePath) => path.extname(filePath).toLowerCase() === '.txt')
      const base = path.basename(directory)

      return hasText && !/^fac/i.test(normalizeText(base))
    })
    .map(([directory, directFiles]) => {
      const relative = path.relative(loreNpcRoot, directory).replace(/\\/g, '/')
      const factionFolder = relative.split('/')[0] || ''
      const nestedPrefix = `${directory}${path.sep}`
      const nestedFiles = allFiles.filter((filePath) => filePath === directory || filePath.startsWith(nestedPrefix))
      const textFiles = nestedFiles.filter((filePath) => path.extname(filePath).toLowerCase() === '.txt')
      const imageFiles = nestedFiles.filter((filePath) => imageExtensions.has(path.extname(filePath).toLowerCase()))
      const videoFiles = nestedFiles.filter((filePath) => videoExtensions.has(path.extname(filePath).toLowerCase()))
      const eventFiles = textFiles.filter((filePath) => /evento|catacl|despertar/i.test(normalizeText(path.basename(filePath))))
      const text = textFiles
        .map((filePath) => {
          try {
            return fs.readFileSync(filePath, 'utf8')
          } catch (_error) {
            return ''
          }
        })
        .join('\n')
      const rawText = `${relative}\n${text}`.toLowerCase()
      const normalizedText = normalizeText(`${relative}\n${text}`)
      const domainSignals = countMatches(normalizedText, /\b(expansao|dominio|domain)\b/g)
      const cataclysmSignals = countMatches(normalizedText, /\b(cataclisma|cataclismico|nivel de poder cataclisma|evento cataclisma)\b/g)
      const phaseSignals = countMatches(normalizedText, /\b(fase|bloco|forma humana|forma final|manifestacao|manifestacoes|versao|versoes|estado do mapa)\b/g)
      const mapSignals = countMatches(rawText, /\bmaps\/|map_|mun_|manifest_|estado do mapa|ponto\s+\d+|mapa/g)
      const reconstructedFromApp = /\b(reconstrucao|reconstruida|reconstruido|workspace json|fonte desta reconstrucao)\b/.test(normalizedText)
      const folderName = getFolderDisplayName(directory)
      const protagonistLink = parseProtagonistLink(relative, path.basename(directory))
      const aliases = uniqueNormalized([
        folderName,
        path.basename(directory),
        protagonistLink.appName,
        protagonistLink.bodyName,
        protagonistLink.playerName,
        relative,
      ])

      return {
        nomeLore: folderName,
        nomeNormalizado: normalizeText(folderName),
        categoriaLore: getLoreCategory(relative, factionFolder),
        factionFolder,
        relativePath: relative,
        directory,
        aliases,
        protagonistLink,
        textFiles: textFiles.length,
        imageFiles: imageFiles.length,
        videoFiles: videoFiles.length,
        eventFiles: eventFiles.length,
        domainSignals,
        cataclysmSignals,
        phaseSignals,
        mapSignals,
        reconstructedFromApp,
        hasLoreText: text.trim().length > 0,
        hasHistorySection: /\bhistoria\b/.test(normalizedText),
        hasAdvancedSignals: videoFiles.length > 0 || domainSignals > 0 || eventFiles.length > 0 || phaseSignals >= 3,
        hasBossSignals:
          cataclysmSignals > 0 ||
          eventFiles.length > 0 ||
          /\b(boss|chefao|guardiao \d|guardiao do vulcao|entidade cataclismica)\b/i.test(normalizedText),
      }
    })
}

function getCharacterAliases(character) {
  return uniqueNormalized([
    character.nome,
    character.id,
    character.jogador,
    character.classe,
    character.origem,
    ...(Array.isArray(character.status) ? character.status : []),
  ])
}

function loreRecordMatchesAliases(record, aliases) {
  const recordAliases = uniqueNormalized([
    record.nomeLore,
    record.nomeNormalizado,
    record.relativePath,
    ...(record.aliases || []),
  ])

  return aliases.some((alias) =>
    recordAliases.some((recordAlias) => recordAlias === alias || recordAlias.includes(alias) || alias.includes(recordAlias)),
  )
}

function getProtagonistLinks(character, loreFolders, premiseLore) {
  const aliases = uniqueNormalized([character.nome, character.jogador])
  const realBodies = loreFolders.filter(
    (record) => record.categoriaLore === 'Protagonista - corpo real' && loreRecordMatchesAliases(record, aliases),
  )
  const villageBodies = loreFolders.filter(
    (record) => record.categoriaLore === 'Protagonista - corpo da vila' && loreRecordMatchesAliases(record, aliases),
  )
  const premiseRecords = premiseLore.filter((record) =>
    ['fushi', 'protagonistas', 'regras-da-existencia'].includes(normalizeText(record.nome).replace(/\s+/g, '-')),
  )

  return {
    realBody: realBodies[0] || null,
    villageBody: villageBodies[0] || null,
    premiseRecords,
  }
}

function findLoreRecord(character, loreFolders) {
  const name = normalizeText(character.nome || character.id)

  if (!name) return null

  const factionLetter = getFactionLetter(character.faccao)
  const candidates = loreFolders
    .filter((record) => {
      const loreName = record.nomeNormalizado
      return loreName === name || loreName.includes(name) || name.includes(loreName) || namesAreClose(name, loreName)
    })
    .map((record) => {
      const loreName = record.nomeNormalizado
      const sameFaction = Boolean(character.tipo !== 'player' && factionLetter && record.factionFolder.includes(factionLetter))
      let score = 0

      if (loreName === name) score += 100
      if (loreName.startsWith(name)) score += 50
      if (loreName.includes(name)) score += 25
      if (namesAreClose(name, loreName)) score += 70
      if (character.tipo === 'player' && record.categoriaLore === 'Protagonista - corpo real') score += 120
      if (character.tipo === 'player' && record.categoriaLore === 'Protagonista - corpo da vila') score += 90
      if (sameFaction) score += 120
      if (character.tipo !== 'player' && factionLetter && !sameFaction) score -= 60
      if (character.tipo !== 'player' && record.relativePath.includes('Protagonista')) score -= 15

      return { record, score }
    })
    .sort((a, b) => b.score - a.score)

  return candidates[0]?.record || null
}

function getLoreMatchKind(character, loreRecord) {
  if (!loreRecord) return 'sem vinculo'

  const name = normalizeText(character.nome || character.id)
  const loreName = loreRecord.nomeNormalizado

  if (loreName === name) return 'igual'
  if (character.tipo === 'player' && loreRecord.categoriaLore.startsWith('Protagonista')) return 'protagonista/corpo'
  if (namesAreClose(name, loreName)) return 'alias nome'
  if (loreName.includes(name) || name.includes(loreName)) return 'nome parcial'

  return 'vinculo indireto'
}

function getProductionClass(character, loreRecord) {
  const text = normalizeText([
    character.nome,
    character.tipo,
    character.localAtual,
    character.notas,
    loreRecord?.relativePath,
    loreRecord?.categoriaLore,
  ].join(' '))

  if (loreRecord?.cataclysmSignals > 0 || loreRecord?.eventFiles > 0 || text.includes('cataclisma')) {
    return character.tipo === 'player' ? 'FICHA AVANCADA' : 'BOSS CATACLISMA'
  }

  if (character.tipo === 'player') {
    return loreRecord?.hasAdvancedSignals ? 'FICHA AVANCADA' : 'FICHA BASICA'
  }

  if (loreRecord?.hasBossSignals || character.faccao === 'faction-f') {
    return 'FICHA AVANCADA / BOSS'
  }

  if (loreRecord?.hasAdvancedSignals) {
    return 'FICHA AVANCADA'
  }

  return 'FICHA BASICA'
}

function getCampaignGroup(row) {
  if (String(row.status).includes('placeholder')) return 'Placeholder/Teste'
  if (row.tipo === 'player') return 'Protagonista'
  if (row.tipo === 'mob') return 'Mob'
  if (String(row.classeFicha).includes('BOSS')) return 'Boss'
  if (row.loreCategoria === 'NPC da vila') return 'NPC da Vila'
  return 'NPC'
}

function getCampaignFunction(row) {
  const group = getCampaignGroup(row)

  if (group === 'Protagonista') {
    return 'Consciência/player; precisa corpo real, corpo da Vila/premissa e ficha jogavel sincronizada.'
  }

  if (group === 'Mob') {
    return 'Criatura simples/encontro; só pode virar OK quando existir na campanha real ou for aprovado como mob canonico.'
  }

  if (group === 'Boss') {
    return 'Entidade especial; precisa ficha avancada, fases, mapas, aparencia, VFX/3D, audio e controle de estado.'
  }

  if (group === 'NPC da Vila') {
    return 'NPC social/narrativo da Vila; precisa imagens de lore, cenas/interludios e papel claro na sessao.'
  }

  if (group === 'Placeholder/Teste') {
    return 'Nao usar como verdade de campanha; remover, arquivar ou substituir por personagem real.'
  }

  return 'NPC de faccao/bioma; precisa lore vinculada, funcao narrativa e encaixe de mesa.'
}

function buildCampaignCharacterRows(characterRows) {
  return characterRows.map((row) => ({
    status: row.status,
    grupo: getCampaignGroup(row),
    personagem: row.personagem,
    tipo: row.tipo,
    faccao: row.faccaoNome || row.faccao,
    local: row.local,
    funcao: getCampaignFunction(row),
    classeFicha: row.classeFicha,
    lore: row.loreArquivo,
    app: row.loreApp,
    producao: row.foco,
    lorePath: row.lorePath,
  }))
}

function buildProtagonistBodyRows(characters, characterRows, loreFolders, premiseLore) {
  const rowById = new Map(characterRows.map((row) => [row.id, row]))

  return characters
    .filter((character) => character.tipo === 'player')
    .map((character) => {
      const mechanicRow = rowById.get(character.id) || {}
      const links = getProtagonistLinks(character, loreFolders, premiseLore)
      const hasPlaceholderName = /placeholder|teste|exemplo/i.test(String(character.nome || character.id || character.jogador || ''))
      const isFragmentado = normalizeText(character.nome).includes('fragmentado')
      const premiseSummary = hasPlaceholderName ? '' : links.premiseRecords.map((record) => record.relativePath).join(' | ')
      const realBody = links.realBody
      const villageBody = links.villageBody
      const status = hasPlaceholderName
        ? 'CRITICO - placeholder'
        : !realBody && !villageBody
          ? 'FOCO - vincular corpo'
          : !isFragmentado && (!realBody || !villageBody)
            ? 'FOCO - completar vinculo'
            : 'OK base protagonista'
      const focus = hasPlaceholderName
        ? 'Remover/substituir personagem de teste antes de usar como planejamento real.'
        : !realBody && !villageBody
          ? 'Criar ou apontar pasta real em Protagonista (Real Corpo) e/ou Vila (Planicie) (Protagonistas).'
          : !isFragmentado && !villageBody
            ? 'Vincular corpo/base emocional da Vila correspondente ao player.'
            : !realBody
              ? 'Vincular corpo real/interpretação do player.'
              : 'Manter vínculo app + corpo real + premissa; completar ficha no app quando a lore virar mecanica.'

      return {
        status,
        personagemApp: character.nome || character.id,
        jogador: character.jogador || '',
        funcao: isFragmentado ? 'Organismo/corpo compartilhado inicial' : 'Consciência/player individual',
        corpoReal: realBody?.nomeLore || '',
        corpoVila: villageBody?.nomeLore || '',
        premissa: premiseSummary,
        imagens: (realBody?.imageFiles || 0) + (villageBody?.imageFiles || 0),
        videos: (realBody?.videoFiles || 0) + (villageBody?.videoFiles || 0),
        historiaApp: mechanicRow.historiaApp || '',
        loreArquivo: mechanicRow.loreArquivo || '',
        foco: focus,
        realPath: realBody?.relativePath || '',
        villagePath: villageBody?.relativePath || '',
        id: character.id,
      }
    })
}

function getFactionName(factionId, factionNameById) {
  return factionNameById.get(factionId) || factionId || ''
}

function getFactionLetter(factionId) {
  return {
    'faction-a': '(A)',
    'faction-b': '(B)',
    'faction-c': '(C)',
    'faction-d': '(D)',
    'faction-e': '(E)',
    'faction-f': '(F)',
  }[factionId] || ''
}

function summarizeFactions(factions, characterRows, loreFolders) {
  return (factions || []).map((faction) => {
    const factionRows = characterRows.filter((row) => row.faccao === faction.id)
    const factionLetter = getFactionLetter(faction.id)
    const loreRows = factionLetter
      ? loreFolders.filter((record) => record.factionFolder.includes(factionLetter))
      : []
    const cataclysmCount = factionRows.filter((row) => row.classeFicha === 'BOSS CATACLISMA').length
    const advancedCount = factionRows.filter((row) => String(row.classeFicha).includes('AVANCADA')).length
    const criticalCount = factionRows.filter((row) => String(row.status).startsWith('CRITICO')).length
    const focusCount = factionRows.filter((row) => String(row.status).startsWith('FOCO')).length
    const status = criticalCount > 0
      ? 'CRITICO'
      : cataclysmCount > 0 || advancedCount > 0 || focusCount > 0
        ? 'FOCO'
        : 'OK base'

    return {
      status,
      faccao: faction.nome || faction.id,
      id: faction.id,
      base: faction.base || '',
      localAtual: faction.localAtual || '',
      personagensApp: factionRows.length,
      protagonistas: factionRows.filter((row) => row.categoria === 'Protagonista').length,
      npcs: factionRows.filter((row) => String(row.categoria).includes('NPC')).length,
      mobs: factionRows.filter((row) => row.categoria === 'Mob').length,
      bosses: factionRows.filter((row) => String(row.classeFicha).includes('BOSS')).length,
      cataclisma: cataclysmCount,
      fichaAvancada: advancedCount,
      lorePastas: loreRows.length,
      foco:
        cataclysmCount > 0
          ? 'Planejar bosses/fases antes de adicionar conteudo novo.'
          : focusCount > 0
            ? 'Completar vinculo lore/app e requisitos de ficha.'
            : 'Manter como base rastreada.',
      resumo: faction.resumo || '',
    }
  })
}

function summarizeWorldBiomes(mundi, maps) {
  const locations = mundi.locations || []
  const submaps = mundi.submaps || []
  const mapById = new Map((maps || []).map((map) => [map.id, map]))

  return (mundi.biomes || []).map((biome) => {
    const biomeLocations = locations.filter((location) => location.biomaId === biome.id)
    const biomeLocationIds = new Set(biomeLocations.map((location) => location.id))
    const biomeSubmaps = submaps.filter((submap) => biomeLocationIds.has(submap.parentLocationId))
    const mapIds = new Set([
      ...biomeLocations.map((location) => location.mapId).filter(Boolean),
      ...biomeSubmaps.map((submap) => submap.mapId).filter(Boolean),
    ])
    const mapCount = [...mapIds].filter((mapId) => mapById.has(mapId)).length
    const cataclysmPoints = biomeLocations.filter((location) => {
      const narrativeTags = (location.tags || []).filter((tag) => !String(tag).startsWith('geografia_mun_'))
      const text = normalizeText([
        location.nome,
        location.riscoBase,
        location.riscoAtual,
        location.estadoVisual,
        location.descricaoCataclismico,
        location.descricaoDistorcido,
        narrativeTags.join(' '),
      ].join(' '))

      return /\b(cataclisma|cataclismico|dragao fushi|nucleo paradoxal)\b/.test(text)
    }).length
    const withoutMap = biomeLocations.filter((location) => !location.mapId && location.hasMap).length
    const status = withoutMap > 0
      ? 'CRITICO - mapa pendente'
      : cataclysmPoints > 0
        ? 'FOCO - cataclisma'
        : mapCount > 0
          ? 'OK base'
          : 'FOCO - mapear'

    return {
      status,
      bioma: biome.nome || biome.id,
      id: biome.id,
      risco: biome.riscoInicial || '',
      estabilidade: biome.estabilidadeInicial ?? '',
      locais: biomeLocations.length,
      submapas: biomeSubmaps.length,
      mapas: mapCount,
      cataclisma: cataclysmPoints,
      faccoesProvaveis: (biome.faccoesProvaveis || []).join(', '),
      recursos: (biome.recursos || []).join(', '),
      foco:
        cataclysmPoints > 0
          ? 'Separar eventos/fases/VFX e mapas de boss deste bioma.'
          : withoutMap > 0
            ? 'Resolver locais marcados com mapa sem mapId.'
            : 'Manter MUN/app como fonte para novos mapas e interludios.',
      resumo: biome.resumo || '',
      notas: biome.notes || '',
    }
  })
}

function buildBossPlanningRows(characterRows) {
  return characterRows
    .filter((row) =>
      row.categoria !== 'Protagonista' &&
      (String(row.classeFicha).includes('BOSS') || row.eventosLore > 0),
    )
    .map((row) => ({
      status: row.classeFicha === 'BOSS CATACLISMA' ? 'FOCO - boss cataclisma' : row.status,
      boss: row.personagem,
      classeFicha: row.classeFicha,
      faccao: row.faccaoNome || row.faccao,
      local: row.local,
      historiaApp: row.historiaApp,
      loreArquivo: row.loreArquivo,
      eventosLore: row.eventosLore,
      fasesSinais: row.fasesSinais,
      mapasSugeridos: row.mapasSugeridos,
      imagensLore: row.imagensLore,
      videosLore: row.videosLore,
      dominio: row.dominio,
      controleNecessario:
        row.classeFicha === 'BOSS CATACLISMA'
          ? 'Ficha avancada com fases, mapas, aparencias, VFX/3D, interludios e estado de fase.'
          : 'Ficha avancada com mecanicas especiais, imagem/lore e interludio.',
      lorePath: row.lorePath,
    }))
}

async function main() {
  const vite = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  })

  try {
    const tabletopModule = await vite.ssrLoadModule('/src/data/mock/tabletop.ts')
    const mundiModule = await vite.ssrLoadModule('/src/lib/worldMundiState.ts')
    const audioModule = await vite.ssrLoadModule('/src/data/audioCatalog.ts')
    const factionsModule = await vite.ssrLoadModule('/src/data/mock/factions.ts')

    const tabletop = tabletopModule.tabletopData
    const mundi = mundiModule.EMPTY_WORLD_MUNDI_STATE
    const factions = factionsModule.factionsData?.items || []
    const factionNameById = new Map(factions.map((faction) => [faction.id, faction.nome]))
    const characterThemeSlots = audioModule.TABLETOP_CHARACTER_THEME_SLOTS || []
    const workspaceCharacters = getCharactersFromWorkspace()
    const characters = workspaceCharacters.characters
    const munAudit = readJson(path.join(outputRoot, 'mun-interludes-audit.json'), {})
    const baseManifest = readJson(
      path.join(publicAssetRoot, 'maps', 'base-upgrades', 'base-upgrades-manifest.json'),
      [],
    )
    const releaseSummary = collectAssetSummary(releaseAssetRoot)
    const publicSummary = collectAssetSummary(publicAssetRoot)
    const campaignPack = analyzeCampaignPack(getLatestCampaignPackManifest())
    const maps = tabletop.assetLibrary.maps || []
    const referencedMapIds = new Set([
      ...(mundi.locations || []).map((location) => location.mapId).filter(Boolean),
      ...(mundi.submaps || []).map((submap) => submap.mapId).filter(Boolean),
    ])
    const mapRows = maps.map((map) => {
      const imageAsset = getAssetPath(map.image)
      const thumbAsset = getAssetPath(map.previewImage || map.thumbnailUrl || '')
      const imageSourceOk = assetExistsInRoot(publicAssetRoot, map.image)
      const thumbSourceOk = thumbAsset ? assetExistsInRoot(publicAssetRoot, map.previewImage || map.thumbnailUrl) : false
      const imageReleaseOk = assetExistsInRoot(releaseAssetRoot, map.image)
      const thumbReleaseOk = thumbAsset ? assetExistsInRoot(releaseAssetRoot, map.previewImage || map.thumbnailUrl) : false
      const imageLibraryOk = assetExistsInRoot(appDataAssetRoot, map.image)
      const thumbLibraryOk = thumbAsset ? assetExistsInRoot(appDataAssetRoot, map.previewImage || map.thumbnailUrl) : false

      return {
        area: 'MUN/Mapas',
        id: map.id,
        nome: map.name,
        tipo: map.type || '',
        bioma: map.biomeId || '',
        pasta: map.folderId || '',
        localMun: map.munLocationId || '',
        referenciadoNoMun: referencedMapIds.has(map.id) ? 'sim' : 'nao',
        imagem: imageAsset,
        thumb: thumbAsset,
        sourceOk: imageSourceOk ? 'sim' : 'nao',
        thumbOk: thumbSourceOk ? 'sim' : 'nao',
        releaseOk: imageReleaseOk || thumbReleaseOk ? 'sim' : 'nao',
        libraryOk: imageLibraryOk || thumbLibraryOk ? 'sim' : 'nao',
        optimizedOk: getOptimizedAssetPath(imageAsset) && assetExistsInRoot(publicAssetRoot, getOptimizedAssetPath(imageAsset)) ? 'sim' : 'nao',
        status:
          imageSourceOk && thumbSourceOk
            ? 'OK tecnico'
            : 'REVISAR asset/thumbnail',
      }
    })
    const loreFolders = scanLoreFolders()
    const premiseLore = scanPremiseLore()
    const npcMechanicsRows = characters.map((character) => {
      const protagonistLinks = character.tipo === 'player'
        ? getProtagonistLinks(character, loreFolders, premiseLore)
        : { realBody: null, villageBody: null, premiseRecords: [] }
      const loreRecord = protagonistLinks.realBody || protagonistLinks.villageBody || findLoreRecord(character, loreFolders)
      const abilities = Array.isArray(character.habilidades) ? character.habilidades : []
      const detailedAbilities = Array.isArray(character.habilidadesDetalhadas)
        ? character.habilidadesDetalhadas
        : []
      const attacks = Array.isArray(character.ataques) ? character.ataques : []
      const skills = Array.isArray(character.pericias) ? character.pericias : []
      const hasPlaceholderAbility = abilities.some((ability) =>
        /placeholder|pendente|todo/i.test(String(ability)),
      )
      const hasPlaceholderName = /placeholder|teste|exemplo/i.test(String(character.nome || character.id || ''))
      const hasAppLore = textLength(character.notas, character.resumo, character.descricao) >= 80
      const hasAppHistory = textLength(character.descricao?.historia) >= 80
      const hasPremiseLore = !hasPlaceholderName && protagonistLinks.premiseRecords.some((record) => record.hasLoreText)
      const hasLoreFile = Boolean(loreRecord?.hasLoreText || hasPremiseLore)
      const loreMatchKind = getLoreMatchKind(character, loreRecord)
      const hasToken = Boolean(character.tokenImageUrl || character.avatarUrl)
      const mechanicOk = hasStructuredMechanic(abilities, detailedAbilities, attacks)
      const isRealWorkspaceSource = workspaceCharacters.sourceLabel === 'workspace real'
      const productionClass = getProductionClass(character, loreRecord)
      const category =
        character.tipo === 'player'
          ? 'Protagonista'
          : character.tipo === 'mob'
            ? 'Mob'
            : productionClass.includes('BOSS') || productionClass.includes('CATACLISMA')
              ? 'Boss / NPC'
              : loreRecord?.categoriaLore === 'NPC da vila'
                ? 'NPC da vila'
                : 'NPC'
      const status = !isRealWorkspaceSource
        ? 'CRITICO - fonte nao real'
        : hasPlaceholderAbility || hasPlaceholderName
          ? 'CRITICO - placeholder'
          : !hasLoreFile
            ? character.tipo === 'mob'
              ? 'FOCO - validar mob'
              : 'FOCO - vincular lore'
            : productionClass === 'BOSS CATACLISMA'
              ? 'FOCO - boss cataclisma'
              : character.tipo === 'player'
                ? 'FOCO - protagonista/corpo'
                : productionClass.includes('AVANCADA')
                ? 'FOCO - ficha avancada'
                : !mechanicOk
                  ? 'FOCO - mecanica solta'
                  : !hasAppLore || !hasToken
                    ? 'FOCO - completar ficha'
                    : 'OK ficha basica'
      const foco = !isRealWorkspaceSource
          ? 'Nao usar seed/mock como verdade da campanha'
        : hasPlaceholderAbility || hasPlaceholderName
          ? 'Remover/substituir placeholder por personagem real aprovado'
        : !hasLoreFile
          ? character.tipo === 'mob'
            ? 'Confirmar se criatura existe na campanha real; nao marcar como OK sem lore, ficha ou aprovacao.'
            : 'Vincular pasta/arquivo real em 01_LORE antes de planejar conteudo'
        : productionClass === 'BOSS CATACLISMA'
          ? 'Criar ficha avancada de boss: fases, mapas, aparencias, VFX/3D, interludios e controle de fase'
          : character.tipo === 'player'
            ? 'Conectar app + corpo real + corpo da Vila/premissa; depois transformar lore em mecanica, imagens, tema e interludios.'
          : productionClass.includes('AVANCADA')
            ? 'Detalhar dominio/VFX, imagens de lore, interludios, audio e regras especiais'
                : !mechanicOk
                  ? 'Definir gatilho, rolagem, custo, efeito, limite e log'
                  : !hasAppLore || !hasToken
                    ? 'Completar lore/token/encaixe'
                    : 'Ficha basica rastreada; planejar imagens de lore/interludios quando for produzir'

      return {
        personagem: character.nome || character.id,
        id: character.id,
        tipo: character.tipo || '',
        categoria: category,
        classeFicha: productionClass,
        faccao: character.faccao || '',
        faccaoNome: getFactionName(character.faccao, factionNameById),
        local: character.localAtual || '',
        jogador: character.jogador || '',
        habilidades: abilities.length,
        habilidadesDetalhadas: detailedAbilities.length,
        ataques: attacks.length,
        pericias: skills.length,
        loreApp: hasAppLore ? 'ok' : 'falta',
        historiaApp: hasAppHistory ? 'ok' : 'falta',
        loreArquivo: hasLoreFile ? 'ok' : 'falta',
        mecanica: mechanicOk ? 'ok' : 'falta estruturar',
        token: hasToken ? 'ok' : 'falta',
        dominio: loreRecord?.domainSignals > 0 ? 'requer VFX' : 'nao detectado',
        animacao: character.animationPresetId || character.animationId ? 'ok' : productionClass === 'FICHA BASICA' ? 'opcional' : 'necessaria',
        imagensLore: loreRecord?.imageFiles || 0,
        videosLore: loreRecord?.videoFiles || 0,
        eventosLore: loreRecord?.eventFiles || 0,
        fasesSinais: loreRecord?.phaseSignals || 0,
        mapasSugeridos: loreRecord?.mapSignals || 0,
        nomeLore: loreRecord?.nomeLore || '',
        loreMatch: loreMatchKind,
        loreReconstruida: loreRecord?.reconstructedFromApp ? 'sim' : 'nao',
        premissaLore: hasPremiseLore ? 'ok' : 'nao detectada',
        corpoReal: protagonistLinks.realBody?.nomeLore || '',
        corpoVila: protagonistLinks.villageBody?.nomeLore || '',
        corpoRealPath: protagonistLinks.realBody?.relativePath || '',
        corpoVilaPath: protagonistLinks.villageBody?.relativePath || '',
        loreCategoria: loreRecord?.categoriaLore || 'sem pasta',
        lorePath: loreRecord?.relativePath || '',
        encaixeMesa: character.localAtual || character.faccao ? 'ok base' : 'falta local/faccao',
        status,
        foco,
        fonte: workspaceCharacters.sourceLabel,
        fonteArquivo: workspaceCharacters.sourcePath,
      }
    })
    if (!npcMechanicsRows.length) {
      npcMechanicsRows.push({
        personagem: 'Workspace real nao encontrado',
        id: 'workspace-real-ausente',
        tipo: 'auditoria',
        faccao: '',
        local: '',
        habilidades: 0,
        habilidadesDetalhadas: 0,
        ataques: 0,
        pericias: 0,
        loreApp: 'falta',
        historiaApp: 'falta',
        loreArquivo: 'falta',
        mecanica: 'falta estruturar',
        token: 'falta',
        categoria: 'Auditoria',
        classeFicha: 'BLOQUEADO',
        faccaoNome: '',
        jogador: '',
        dominio: 'nao detectado',
        animacao: 'nao cadastrado',
        imagensLore: 0,
        videosLore: 0,
        eventosLore: 0,
        fasesSinais: 0,
        mapasSugeridos: 0,
        nomeLore: '',
        loreMatch: 'sem vinculo',
        loreReconstruida: 'nao',
        premissaLore: 'nao detectada',
        corpoReal: '',
        corpoVila: '',
        corpoRealPath: '',
        corpoVilaPath: '',
        loreCategoria: 'sem pasta',
        lorePath: '',
        encaixeMesa: 'falta local/faccao',
        status: 'CRITICO - fonte nao real',
        foco: 'Abrir o app real ou apontar FUSHI_APPDATA_ROOT correto antes de usar esta aba.',
        fonte: 'workspace real ausente',
        fonteArquivo: workspaceCharacters.sourcePath,
      })
    }
    const protagonistMechanicRows = npcMechanicsRows.filter((row) => row.categoria === 'Protagonista')
    const protagonistRows = buildProtagonistBodyRows(characters, npcMechanicsRows, loreFolders, premiseLore)
    const campaignCharacterRows = buildCampaignCharacterRows(npcMechanicsRows)
    const bossPlanningRows = buildBossPlanningRows(npcMechanicsRows)
    const factionRows = summarizeFactions(factions, npcMechanicsRows, loreFolders)
    const worldBiomeRows = summarizeWorldBiomes(mundi, maps)
    const campaignControl = readCampaignControl()
    const linkedLorePaths = new Set(npcMechanicsRows.map((row) => row.lorePath).filter(Boolean))
    const sourceDivergenceRows = [
      ...npcMechanicsRows.flatMap((row) => {
        const rows = []

        if (!row.lorePath && row.tipo !== 'mob') {
          rows.push({
            status: 'CRITICO',
            tipo: 'APP sem pasta lore',
            personagem: row.personagem,
            app: row.personagem,
            lore: '',
            faccao: row.faccaoNome || row.faccao,
            fonte: row.fonteArquivo,
            detalhe: 'Personagem existe no app, mas nenhuma pasta/arquivo de lore foi vinculado.',
            acao: 'Criar/vincular pasta em 01_LORE ou marcar conscientemente como somente-app.',
          })
        }

        if (row.lorePath && row.loreArquivo === 'falta') {
          rows.push({
            status: 'CRITICO',
            tipo: 'Arquivo lore vazio',
            personagem: row.personagem,
            app: row.personagem,
            lore: row.nomeLore || row.lorePath,
            faccao: row.faccaoNome || row.faccao,
            fonte: row.lorePath,
            detalhe: 'A pasta existe, mas os arquivos de texto lidos nao tem conteudo suficiente.',
            acao: 'Preencher a ficha/lore ou reconstruir a partir do app se for a unica fonte real.',
          })
        }

        if (row.lorePath && ['alias nome', 'nome parcial', 'vinculo indireto'].includes(row.loreMatch)) {
          rows.push({
            status: 'FOCO',
            tipo: 'Nome divergente',
            personagem: row.personagem,
            app: row.personagem,
            lore: row.nomeLore || row.lorePath,
            faccao: row.faccaoNome || row.faccao,
            fonte: row.lorePath,
            detalhe: `Vinculo aceito por ${row.loreMatch}; conferir se e apelido/erro de grafia intencional.`,
            acao: 'Padronizar nome no app ou registrar alias aprovado para nao confundir com outro NPC.',
          })
        }

        if (row.loreReconstruida === 'sim') {
          rows.push({
            status: 'FOCO',
            tipo: 'Lore reconstruida do app',
            personagem: row.personagem,
            app: row.personagem,
            lore: row.nomeLore || row.lorePath,
            faccao: row.faccaoNome || row.faccao,
            fonte: row.lorePath,
            detalhe: 'A ficha foi reconstruida a partir do workspace do app, nao de um arquivo original antigo.',
            acao: 'Revisar com o mestre quando houver tempo e decidir se vira fonte definitiva.',
          })
        }

        return rows
      }),
      ...loreFolders
        .filter((record) => record.relativePath.includes('/') && record.hasLoreText && !linkedLorePaths.has(record.relativePath))
        .map((record) => ({
          status: 'FOCO',
          tipo: 'Lore sem personagem app',
          personagem: record.nomeLore,
          app: '',
          lore: record.nomeLore,
          faccao: record.factionFolder,
          fonte: record.relativePath,
          detalhe: 'Existe lore real na pasta, mas nenhum personagem atual do app foi ligado a ela.',
          acao: 'Decidir se entra no app, se fica apenas como lore secreta ou se e conteudo futuro.',
        })),
    ]

    const actionRows = [
      {
        prioridade: 'P0',
        area: 'Baseline alpha.83',
        status: 'TRAVADO',
        evidencia: 'Backup empacotado criado em release-codex/baselines/alpha83-stable-20260616.',
        proximaAcao: 'Usar como comparativo se alpha.84 quebrar algo.',
      },
      {
        prioridade: 'P0',
        area: 'Mesa e multiplayer',
        status: 'ESTAVEL',
        evidencia: 'Usuario testou 2 jogadores; smokes cobrem dados, regua, tokens, ficha, interludio e release.',
        proximaAcao: 'Manter como portao: smoke:multiplayer + smoke:release:deep antes de promover build.',
      },
      {
        prioridade: 'P0',
        area: 'MUN interludios',
        status: munAudit?.issues?.length ? 'REVISAR' : 'OK TECNICO',
        evidencia: `${munAudit.automaticInterludes || 0} interludios automaticos; ${munAudit.thumbnailSummary?.sourcePresent || 0}/${munAudit.thumbnailSummary?.total || 0} thumbs validas; ${munAudit.thumbnailSummary?.visuallyEmpty || 0} vazias.`,
        proximaAcao: 'Usar folhas de contato para revisao visual artistica, nao tecnica.',
      },
      {
        prioridade: 'P1',
        area: 'Core vs campaign pack',
        status: 'DECISAO ALPHA.84',
        evidencia: `${munAudit.contentLibraryGaps?.length || 0} thumbs sao fornecidas pelo core do app em vez da biblioteca local.`,
        proximaAcao: 'Definir lista minima core e mover o restante para pack/update mantendo fushi-library://assets.',
      },
      {
        prioridade: 'P1',
        area: 'Peso do campaign pack',
        status: 'OTIMIZAR',
        evidencia: `${bytesToMiB(campaignPack.totals?.bytes)} MiB no pack; ${campaignPack.heavyOriginals.length} originais pesados cobertos por WebP.`,
        proximaAcao: 'Criar modo pack runtime com WebP/thumbs e deixar PNG original como source/ultra opcional.',
      },
      {
        prioridade: 'P1',
        area: 'Base',
        status: 'OK TECNICO',
        evidencia: `${Array.isArray(baseManifest) ? baseManifest.length : 0} entradas no manifest; release valida 24 topdowns WebP, 24 thumbs e chegadas.`,
        proximaAcao: 'Manter Base como core ate existir instalador de pack obrigatorio confiavel.',
      },
      {
        prioridade: 'P2',
        area: 'Personagens, NPCs e habilidades',
        status:
          npcMechanicsRows.filter((row) => row.status.startsWith('CRITICO')).length > 0
            ? 'CRITICO PARCIAL'
            : 'FOCO',
        evidencia: `${npcMechanicsRows.length} fichas do ${workspaceCharacters.sourceLabel}; ${protagonistRows.length} protagonistas; ${bossPlanningRows.length} bosses/fichas avancadas; ${npcMechanicsRows.filter((row) => row.status.startsWith('CRITICO')).length} criticas.`,
        proximaAcao: 'Usar Personagens_Campanha, Protagonistas, Bosses_Fases e NPC_Mecanicas como quadro de producao; nunca aceitar seed/mock como campanha real.',
      },
      {
        prioridade: 'P2',
        area: 'Bosses e Cataclisma',
        status: bossPlanningRows.some((row) => row.classeFicha === 'BOSS CATACLISMA')
          ? 'FOCO'
          : 'OK base',
        evidencia: `${bossPlanningRows.length} ficha(s) avancada(s)/boss; ${bossPlanningRows.filter((row) => row.classeFicha === 'BOSS CATACLISMA').length} cataclisma.`,
        proximaAcao: 'Detalhar fases, mapas, aparencias, VFX/3D e controle de estado antes de programar boss complexo.',
      },
      {
        prioridade: 'P2',
        area: 'Mundo e biomas',
        status: worldBiomeRows.some((row) => row.status.startsWith('CRITICO')) ? 'CRITICO PARCIAL' : 'FOCO',
        evidencia: `${worldBiomeRows.length} biomas; ${worldBiomeRows.reduce((sum, row) => sum + row.locais, 0)} locais; ${worldBiomeRows.reduce((sum, row) => sum + row.submapas, 0)} submapas do MUN.`,
        proximaAcao: 'Usar Mundo_Biomas para decidir mapas, interludios, faccoes, riscos e conteudo por bioma.',
      },
      {
        prioridade: 'P2',
        area: 'Audio',
        status: 'OK TECNICO / CONTEUDO PENDENTE',
        evidencia: `${tabletop.assetLibrary.musicTracks.length} musicas, ${tabletop.assetLibrary.ambienceTracks.length} ambiencias, ${characterThemeSlots.filter((slot) => !slot.trackId).length} slots de personagem sem tema.`,
        proximaAcao: 'Catalogar trilhas por personagem e cena depois do split de assets.',
      },
      {
        prioridade: 'P2',
        area: 'Topdowns animados e VFX',
        status: 'PLANEJADO',
        evidencia: `${maps.filter((map) => map.animatedSurface).length} mapa(s) com animatedSurface declarada hoje.`,
        proximaAcao: 'Criar pipeline video/webm por camada, com budget GTX 1050 Ti e fallback estatico.',
      },
      {
        prioridade: 'P3',
        area: 'Protocolo multiplayer',
        status: 'DIVIDA CONTROLADA',
        evidencia: 'stateVersion e remoteActionId estao endurecidos, mas WS/HTTP/polling ainda coexistem.',
        proximaAcao: 'Depois do alpha.84, planejar patch/eventSeq unificado e HUD de telemetria.',
      },
    ]
    const summary = {
      generatedAt: new Date().toISOString(),
      characterSource: {
        label: workspaceCharacters.sourceLabel,
        path: workspaceCharacters.sourcePath,
        total: characters.length,
      },
      tabletop: {
        ambienceTracks: tabletop.assetLibrary.ambienceTracks.length,
        biomes: tabletop.biomes.length,
        cameraPresets: tabletop.assetLibrary.cameraPresets.length,
        cinematics: tabletop.assetLibrary.cinematics.length,
        fxPresets: tabletop.assetLibrary.fxPresets.length,
        introCards: tabletop.assetLibrary.introCards.length,
        lightingPresets: tabletop.assetLibrary.lightingPresets.length,
        maps: maps.length,
        musicTracks: tabletop.assetLibrary.musicTracks.length,
        scenes: tabletop.scenes.length,
        sessions: tabletop.sessions.length,
        transitions: tabletop.assetLibrary.transitions.length,
        videoClips: tabletop.assetLibrary.videoClips.length,
        weatherPresets: tabletop.assetLibrary.weatherPresets.length,
      },
      mundi: {
        biomes: mundi.biomes?.length || 0,
        locations: mundi.locations?.length || 0,
        routes: mundi.routes?.length || 0,
        submaps: mundi.submaps?.length || 0,
      },
      munAudit: {
        automaticInterludes: munAudit.automaticInterludes || 0,
        contentLibraryGaps: munAudit.contentLibraryGaps?.length || 0,
        issues: munAudit.issues?.length || 0,
        thumbnailSummary: munAudit.thumbnailSummary || {},
      },
      base: {
        manifestEntries: Array.isArray(baseManifest) ? baseManifest.length : 0,
      },
      releaseSummary,
      publicSummary,
      campaignPack: {
        code: campaignPack.code,
        heavyOriginals: campaignPack.heavyOriginals.length,
        heavyOriginalsCovered: campaignPack.heavyOriginals.filter((asset) => asset.coveredByOptimized).length,
        manifestPath: campaignPack.manifestPath,
        totals: campaignPack.totals,
        totalsByExtension: campaignPack.totalsByExtension,
        totalsByKind: campaignPack.totalsByKind,
        potentialSavingsMiB: bytesToMiB(
          campaignPack.heavyOriginals.reduce((sum, asset) => sum + asset.estimatedSavings, 0),
        ),
      },
      characterThemeSlots: {
        total: characterThemeSlots.length,
        empty: characterThemeSlots.filter((slot) => !slot.trackId).length,
      },
      loreSource: {
        path: loreNpcRoot,
        folders: loreFolders.length,
        premisePath: lorePremiseRoot,
        premiseFiles: premiseLore.length,
        protagonistRealFolders: loreFolders.filter((record) => record.categoriaLore === 'Protagonista - corpo real').length,
        protagonistVillageFolders: loreFolders.filter((record) => record.categoriaLore === 'Protagonista - corpo da vila').length,
      },
      campaignControl,
      actions: actionRows,
      sourceDivergences: sourceDivergenceRows,
      npcMechanics: npcMechanicsRows,
      campaignCharacters: campaignCharacterRows,
      protagonists: protagonistRows,
      protagonistMechanics: protagonistMechanicRows,
      bossPlanning: bossPlanningRows,
      factions: factionRows,
      worldBiomes: worldBiomeRows,
      maps: mapRows,
      heavyOriginals: campaignPack.heavyOriginals
        .sort((a, b) => b.size - a.size)
        .slice(0, 80)
        .map((asset) => ({
          ...asset,
          optimizedSizeMiB: bytesToMiB(asset.optimizedSize),
          sizeMiB: bytesToMiB(asset.size),
          estimatedSavingsMiB: bytesToMiB(asset.estimatedSavings),
        })),
    }

    ensureDir(outputRoot)
    fs.writeFileSync(
      path.join(outputRoot, 'content-readiness-audit.json'),
      `${JSON.stringify(summary, null, 2)}\n`,
      'utf8',
    )
    writeCsv(path.join(outputRoot, 'content-readiness-actions.csv'), actionRows)
    writeCsv(path.join(outputRoot, 'content-map-status.csv'), mapRows)
    writeCsv(path.join(outputRoot, 'content-heavy-originals.csv'), summary.heavyOriginals)
    writeCsv(path.join(outputRoot, 'content-source-divergences.csv'), sourceDivergenceRows)

    console.log('Auditoria de conteudo/readiness')
    console.log(`  Mapas biblioteca: ${summary.tabletop.maps}`)
    console.log(`  MUN locais/submapas: ${summary.mundi.locations}/${summary.mundi.submaps}`)
    console.log(`  Interludios automaticos OK: ${summary.munAudit.automaticInterludes}`)
    console.log(`  Issues MUN tecnicas: ${summary.munAudit.issues}`)
    console.log(`  Gaps de empacotamento core/library: ${summary.munAudit.contentLibraryGaps}`)
    console.log(`  Pack campanha: ${bytesToMiB(summary.campaignPack.totals?.bytes)} MiB`)
    console.log(`  Originais pesados cobertos por WebP: ${summary.campaignPack.heavyOriginalsCovered}/${summary.campaignPack.heavyOriginals}`)
    console.log(`  Economia potencial estimada: ${summary.campaignPack.potentialSavingsMiB} MiB`)
    console.log(`  Controle campanha: ${(summary.campaignControl.lanes || []).length} frentes, ${(summary.campaignControl.appChecklist || []).length} checks app`)
    console.log(`  Divergencias fonte: ${summary.sourceDivergences.length}`)
    console.log(`  Relatorio: ${path.join(outputRoot, 'content-readiness-audit.json')}`)
  } finally {
    await vite.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
