const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const appDataRoot = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'FUSHI',
)
const defaultAssetRoots = [
  path.join(appDataRoot, 'library', 'assets'),
  path.join(projectRoot, 'public', 'assets'),
]

function getArg(name) {
  const prefix = `--${name}=`
  const value = process.argv.find((argument) => argument.startsWith(prefix))

  return value ? value.slice(prefix.length).trim() : ''
}

function normalizeCode(value) {
  const code = String(value || '').trim().toUpperCase()

  if (!/^FUSHI-[A-Z0-9]{4,32}$/.test(code)) {
    throw new Error('Informe um codigo como --code=FUSHI-KZT3KA.')
  }

  return code
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (_error) {
    return null
  }
}

function getActiveCampaign() {
  const workspace = readJson(path.join(appDataRoot, 'workspace.json'))
  const campaigns = Array.isArray(workspace?.campaigns?.items)
    ? workspace.campaigns.items
    : []

  return (
    campaigns.find((campaign) => campaign.id === workspace?.campaigns?.activeCampaignId) ||
    campaigns[0] ||
    null
  )
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
      walkFiles(entryPath, visitor)
      return
    }

    if (entry.isFile()) {
      visitor(entryPath)
    }
  })
}

function hashFile(filePath) {
  const hash = crypto.createHash('sha256')
  const buffer = Buffer.allocUnsafe(1024 * 1024)
  const fd = fs.openSync(filePath, 'r')

  try {
    let bytesRead = 0

    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null)

      if (bytesRead > 0) {
        hash.update(buffer.subarray(0, bytesRead))
      }
    } while (bytesRead > 0)
  } finally {
    fs.closeSync(fd)
  }

  return hash.digest('hex')
}

function collectAssets(assetRoots) {
  const assetsByPath = new Map()

  assetRoots.forEach((root) => {
    const resolvedRoot = path.resolve(root)

    walkFiles(resolvedRoot, (filePath) => {
      const relativePath = toRelativeAssetPath(resolvedRoot, filePath)

      if (!relativePath || assetsByPath.has(relativePath)) {
        return
      }

      const stats = fs.statSync(filePath)
      assetsByPath.set(relativePath, {
        path: relativePath,
        sha256: hashFile(filePath),
        size: stats.size,
        scope: 'library',
        updatedAt: stats.mtime.toISOString(),
        url: `files/${relativePath
          .split('/')
          .filter(Boolean)
          .map((part) => encodeURIComponent(part))
          .join('/')}`,
      })
    })
  })

  return Array.from(assetsByPath.values()).sort((a, b) => a.path.localeCompare(b.path))
}

function collectCampaignAssets(campaignId) {
  if (!campaignId) {
    return []
  }

  const campaignAssetsRoot = path.join(appDataRoot, 'campaigns', campaignId, 'assets')
  const assets = []

  walkFiles(campaignAssetsRoot, (filePath) => {
    const relativePath = toRelativeAssetPath(campaignAssetsRoot, filePath)
    const [category, ...filenameParts] = relativePath.split('/').filter(Boolean)
    const filename = filenameParts.join('/')

    if (!category || !filename) {
      return
    }

    const stats = fs.statSync(filePath)
    const packagePath = `campaign/${campaignId}/${relativePath}`
    assets.push({
      campaignId,
      category,
      filename,
      path: packagePath,
      scope: 'campaign',
      sha256: hashFile(filePath),
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
      url: `campaign-files/${encodeURIComponent(campaignId)}/${relativePath
        .split('/')
        .filter(Boolean)
        .map((part) => encodeURIComponent(part))
        .join('/')}`,
    })
  })

  return assets.sort((a, b) => a.path.localeCompare(b.path))
}

function main() {
  const activeCampaign = getActiveCampaign()
  const code = normalizeCode(getArg('code') || activeCampaign?.codigo)
  const customRoots = getArg('assets')
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean)
  const assetRoots = (customRoots.length ? customRoots : defaultAssetRoots)
    .map((entry) => path.resolve(entry))
    .filter((entry) => fs.existsSync(entry))
  const libraryAssets = collectAssets(assetRoots)
  const campaignAssets = collectCampaignAssets(activeCampaign?.id || '')
  const assets = [...libraryAssets, ...campaignAssets]
  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0)
  const outputDir = path.join(projectRoot, 'release', 'campaign-packs', code)
  const manifest = {
    assets,
    campaignId: activeCampaign?.id || null,
    campaignName: activeCampaign?.nome || null,
    code,
    createdAt: new Date().toISOString(),
    notes:
      'Pacote de cache da campanha FUSHI. O estado vivo da mesa continua sincronizado pelo multiplayer.',
    roots: {
      campaignAssets:
        activeCampaign?.id
          ? path.join(appDataRoot, 'campaigns', activeCampaign.id, 'assets')
          : null,
      libraryAssets: assetRoots,
    },
    totals: {
      bytes: totalBytes,
      campaignFiles: campaignAssets.length,
      files: assets.length,
      libraryFiles: libraryAssets.length,
    },
    version: new Date().toISOString(),
  }

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

  console.log(`Pacote ${code} gerado.`)
  console.log(`Assets: ${assets.length}`)
  console.log(`Total: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`Manifesto: ${path.join(outputDir, 'manifest.json')}`)
}

main()
