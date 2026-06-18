const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ffmpegPath = require('ffmpeg-static')
const { chromium } = require('playwright')
const { createServer } = require('vite')

const projectRoot = path.resolve(__dirname, '..')
const sourceAssetRoot = path.join(projectRoot, 'public', 'assets')
const releaseAssetRoot = path.join(
  projectRoot,
  'release',
  'win-unpacked',
  'resources',
  'assets',
)
const reportPath = path.join(projectRoot, '.codex-dev', 'mun-interludes-audit.json')
const contactSheetRoot = path.join(
  projectRoot,
  '.codex-dev',
  'mun-interlude-thumbnails',
)

function getFushiDataRoot() {
  const overriddenAppDataRoot = process.env.FUSHI_APPDATA_ROOT?.trim()

  if (overriddenAppDataRoot) {
    return path.join(overriddenAppDataRoot, 'FUSHI')
  }

  return path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'FUSHI',
  )
}

function getPublicAssetPath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().replace(/\\/g, '/')
  const packagedMatch = /^(?:\.\/|\/)?assets\/(.+)$/.exec(normalizedValue)

  if (packagedMatch) {
    return packagedMatch[1]
  }

  try {
    const url = new URL(normalizedValue)

    if (url.protocol === 'fushi-library:' && url.hostname === 'assets') {
      return decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    }
  } catch {
    return ''
  }

  return ''
}

function resolveAssetFile(root, value) {
  const relativePath = getPublicAssetPath(value)

  if (!relativePath) {
    return ''
  }

  return path.join(root, ...relativePath.split('/').filter(Boolean))
}

function resolveExistingAssetFile(root, value, allowOptimizedFallback = true) {
  const assetPath = resolveAssetFile(root, value)

  if (!assetPath) {
    return ''
  }

  if (fs.existsSync(assetPath)) {
    return assetPath
  }

  const relativePath = getPublicAssetPath(value)

  if (
    !allowOptimizedFallback ||
    !relativePath ||
    !/\.(png|jpe?g)$/i.test(relativePath)
  ) {
    return ''
  }

  const optimizedPath = path.join(
    root,
    '_optimized',
    relativePath.replace(/\.(png|jpe?g)$/i, '.webp'),
  )

  return fs.existsSync(optimizedPath) ? optimizedPath : ''
}

function assetExists(root, value) {
  return !getPublicAssetPath(value) || Boolean(resolveExistingAssetFile(root, value))
}

function assetExistsInAnyRoot(roots, value) {
  const relativePath = getPublicAssetPath(value)

  if (!relativePath) {
    return true
  }

  return roots.some((root) => assetExists(root, value))
}

function probeImage(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      decodes: false,
      error: 'arquivo ausente',
      filePath,
    }
  }

  const result = childProcess.spawnSync(
    ffmpegPath,
    [
      '-hide_banner',
      '-i',
      filePath,
      '-vf',
      'showinfo,scale=32:32:force_original_aspect_ratio=decrease,pad=32:32:(ow-iw)/2:(oh-ih)/2:black,format=gray',
      '-frames:v',
      '1',
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    {
      encoding: null,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    },
  )
  const pixels = result.stdout ?? Buffer.alloc(0)
  const stderr = String(result.stderr ?? '')
  const dimensionsMatch = /s:(\d+)x(\d+)/.exec(stderr)

  if (result.status !== 0 || pixels.length !== 32 * 32) {
    return {
      decodes: false,
      error: stderr.trim().split(/\r?\n/).slice(-3).join(' ') || `ffmpeg status ${result.status}`,
      filePath,
      sampledBytes: pixels.length,
    }
  }

  const values = [...pixels]
  const mean = values.reduce((total, value) => total + value, 0) / values.length
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const standardDeviation = Math.sqrt(variance)
  const darkPixelRatio =
    values.filter((value) => value <= 12).length / values.length
  const visuallyEmpty =
    (maximum - minimum < 8 || standardDeviation < 2) &&
    (mean < 18 || mean > 237)
  const nearBlack = mean < 7 && maximum < 22

  return {
    decodes: true,
    darkPixelRatio: Number(darkPixelRatio.toFixed(4)),
    filePath,
    height: dimensionsMatch ? Number(dimensionsMatch[2]) : 0,
    maximum,
    mean: Number(mean.toFixed(2)),
    minimum,
    nearBlack,
    standardDeviation: Number(standardDeviation.toFixed(2)),
    visuallyEmpty,
    width: dimensionsMatch ? Number(dimensionsMatch[1]) : 0,
  }
}

function summarizeThumbnailAudit(entries) {
  return {
    total: entries.length,
    declared: entries.filter((entry) => entry.thumbnailAsset).length,
    sourcePresent: entries.filter((entry) => entry.source?.decodes).length,
    contentLibraryPresent: entries.filter(
      (entry) => entry.contentLibrary?.decodes,
    ).length,
    runtimePresent: entries.filter((entry) => entry.runtime?.decodes).length,
    visuallyEmpty: entries.filter(
      (entry) =>
        entry.source?.visuallyEmpty ||
        entry.source?.nearBlack ||
        entry.runtime?.visuallyEmpty ||
        entry.runtime?.nearBlack,
    ).length,
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getImageMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase()

  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  return 'image/jpeg'
}

function getImageDataUrl(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return `data:image/svg+xml;base64,${Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="100%" height="100%" fill="#160b0b"/><text x="50%" y="50%" fill="#ffb4a8" text-anchor="middle" font-family="Arial" font-size="28">THUMB AUSENTE</text></svg>',
    ).toString('base64')}`
  }

  return `data:${getImageMimeType(filePath)};base64,${fs
    .readFileSync(filePath)
    .toString('base64')}`
}

async function renderThumbnailContactSheets(entries) {
  const generatedAt = new Date().toISOString().replace(/[:.]/g, '-')
  const outputDirectory = path.join(contactSheetRoot, generatedAt)
  const pageSize = 30
  const browser = await chromium.launch({ headless: true })
  const outputPaths = []

  fs.mkdirSync(outputDirectory, { recursive: true })

  try {
    for (let offset = 0; offset < entries.length; offset += pageSize) {
      const group = entries.slice(offset, offset + pageSize)
      const pageNumber = Math.floor(offset / pageSize) + 1
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1000 },
      })
      const cards = group
        .map((entry, index) => {
          const probe = entry.runtime
          const imageUrl = getImageDataUrl(
            entry.runtimeThumbnailPath || entry.sourceThumbnailPath,
          )
          const absoluteIndex = offset + index + 1

          return `
            <article class="card">
              <img src="${imageUrl}" alt="${escapeHtml(entry.mapName)}">
              <div class="copy">
                <strong>${absoluteIndex}. ${escapeHtml(entry.mapName)}</strong>
                <code>${escapeHtml(entry.mapId)}</code>
                <small>${probe?.width ?? 0}x${probe?.height ?? 0} | media ${probe?.mean ?? 'n/a'} | desvio ${probe?.standardDeviation ?? 'n/a'}</small>
              </div>
            </article>
          `
        })
        .join('')
      const html = `
        <!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <style>
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 24px;
                color: #f5f2e9;
                background: #070a0d;
                font-family: Arial, sans-serif;
              }
              h1 { margin: 0 0 18px; font-size: 24px; letter-spacing: 0; }
              .grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 14px;
              }
              .card {
                overflow: hidden;
                border: 1px solid #344047;
                border-radius: 6px;
                background: #11171b;
              }
              img {
                display: block;
                width: 100%;
                aspect-ratio: 16 / 10;
                object-fit: cover;
                background: #000;
              }
              .copy { display: grid; gap: 7px; padding: 12px; }
              strong { font-size: 15px; line-height: 1.25; letter-spacing: 0; }
              code {
                overflow-wrap: anywhere;
                color: #b9c7ce;
                font-size: 11px;
              }
              small { color: #d5bd82; font-size: 11px; }
            </style>
          </head>
          <body>
            <h1>Interludios MUN - thumbs ${offset + 1} a ${offset + group.length}</h1>
            <main class="grid">${cards}</main>
          </body>
        </html>
      `
      const outputPath = path.join(
        outputDirectory,
        `mun-thumbnails-${String(pageNumber).padStart(2, '0')}.png`,
      )

      await page.setContent(html, { waitUntil: 'load' })
      await page.waitForFunction(() =>
        Array.from(document.images).every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      )
      await page.screenshot({ fullPage: true, path: outputPath })
      await page.close()
      outputPaths.push(outputPath)
    }
  } finally {
    await browser.close()
  }

  return outputPaths
}

function readLegacyLibraryReferences() {
  const campaignsRoot = path.join(getFushiDataRoot(), 'campaigns')

  if (!fs.existsSync(campaignsRoot)) {
    return []
  }

  return fs
    .readdirSync(campaignsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const libraryPath = path.join(campaignsRoot, entry.name, 'library.json')

      if (!fs.existsSync(libraryPath)) {
        return []
      }

      try {
        const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))

        return (Array.isArray(library.customTransitions)
          ? library.customTransitions
          : []
        )
          .filter(
            (transition) =>
              typeof transition?.assetUrl === 'string' &&
              transition.assetUrl.startsWith('./assets/'),
          )
          .map((transition) => ({
            campaignId: entry.name,
            transitionId: transition.id,
            assetUrl: transition.assetUrl,
          }))
      } catch {
        return [
          {
            campaignId: entry.name,
            transitionId: '',
            assetUrl: 'library.json invalido',
          },
        ]
      }
    })
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
    const maps = tabletopModule.tabletopData.assetLibrary.maps
    const mundi = mundiModule.EMPTY_WORLD_MUNDI_STATE
    const mapsById = new Map(maps.map((map) => [map.id, map]))
    const contentLibraryAssetRoot = path.join(
      getFushiDataRoot(),
      'library',
      'assets',
    )
    const runtimeAssetRoots = [
      contentLibraryAssetRoot,
      releaseAssetRoot,
    ].filter((root) => fs.existsSync(root))
    const references = [
      ...mundi.locations
        .filter((location) => location.mapId)
        .map((location) => ({
          id: location.id,
          kind: 'location',
          mapId: location.mapId,
          name: location.nome,
        })),
      ...mundi.submaps
        .filter((submap) => submap.mapId)
        .map((submap) => ({
          id: submap.id,
          kind: 'submap',
          mapId: submap.mapId,
          name: submap.nome,
          parentLocationId: submap.parentLocationId,
        })),
    ]
    const referencedMapIds = new Set(references.map((reference) => reference.mapId))
    const automaticMaps = maps.filter(
      (map) => map.munLocationId || referencedMapIds.has(map.id),
    )
    const issues = []
    const contentLibraryGaps = []

    references.forEach((reference) => {
      const map = mapsById.get(reference.mapId)

      if (!map) {
        issues.push({
          code: 'missing-map',
          reference,
        })
        return
      }

    })

    const thumbnailAudit = automaticMaps.map((map) => {
      const thumbnailAsset = map.thumbnailUrl || map.previewImage || ''
      const sourceThumbnailPath = resolveExistingAssetFile(
        sourceAssetRoot,
        thumbnailAsset,
        false,
      )
      const contentLibraryThumbnailPath = resolveExistingAssetFile(
        contentLibraryAssetRoot,
        thumbnailAsset,
        false,
      )
      const releaseThumbnailPath = resolveExistingAssetFile(
        releaseAssetRoot,
        thumbnailAsset,
        false,
      )
      const runtimeThumbnailPath =
        contentLibraryThumbnailPath || releaseThumbnailPath
      const source = probeImage(sourceThumbnailPath)
      const contentLibrary = fs.existsSync(contentLibraryAssetRoot)
        ? probeImage(contentLibraryThumbnailPath)
        : null
      const runtime = probeImage(runtimeThumbnailPath)

      if (!thumbnailAsset) {
        issues.push({
          code: 'missing-thumbnail-reference',
          mapId: map.id,
          name: map.name,
        })
      }

      if (!sourceThumbnailPath) {
        issues.push({
          code: 'missing-source-thumbnail',
          mapId: map.id,
          name: map.name,
          url: thumbnailAsset,
        })
      } else if (!source.decodes) {
        issues.push({
          code: 'source-thumbnail-decode-failed',
          mapId: map.id,
          name: map.name,
          probe: source,
          url: thumbnailAsset,
        })
      } else if (source.visuallyEmpty || source.nearBlack) {
        issues.push({
          code: 'source-thumbnail-visually-empty',
          mapId: map.id,
          name: map.name,
          probe: source,
          url: thumbnailAsset,
        })
      }

      if (
        fs.existsSync(contentLibraryAssetRoot) &&
        !contentLibraryThumbnailPath
      ) {
        contentLibraryGaps.push({
          code: 'thumbnail-provided-by-core-release',
          mapId: map.id,
          name: map.name,
          releaseThumbnailPath,
          url: thumbnailAsset,
        })
      } else if (
        contentLibrary &&
        (!contentLibrary.decodes ||
          contentLibrary.visuallyEmpty ||
          contentLibrary.nearBlack)
      ) {
        issues.push({
          code: 'invalid-content-library-thumbnail',
          mapId: map.id,
          name: map.name,
          probe: contentLibrary,
          url: thumbnailAsset,
        })
      }

      if (!runtimeThumbnailPath) {
        issues.push({
          code: 'missing-runtime-thumbnail',
          mapId: map.id,
          name: map.name,
          searchedRoots: runtimeAssetRoots,
          url: thumbnailAsset,
        })
      } else if (
        !runtime.decodes ||
        runtime.visuallyEmpty ||
        runtime.nearBlack
      ) {
        issues.push({
          code: 'invalid-runtime-thumbnail',
          mapId: map.id,
          name: map.name,
          probe: runtime,
          url: thumbnailAsset,
        })
      }

      if (!assetExists(sourceAssetRoot, map.image)) {
        issues.push({
          code: 'missing-source-map-asset',
          mapId: map.id,
          url: map.image,
        })
      }

      if (!assetExistsInAnyRoot(runtimeAssetRoots, map.image)) {
        issues.push({
          code: 'missing-runtime-map-asset',
          mapId: map.id,
          url: map.image,
          searchedRoots: runtimeAssetRoots,
        })
      }

      return {
        contentLibrary,
        contentLibraryThumbnailPath,
        mapId: map.id,
        mapName: map.name,
        releaseThumbnailPath,
        runtime,
        runtimeThumbnailPath,
        source,
        sourceThumbnailPath,
        thumbnailAsset,
      }
    })

    const m5Submap = mundi.submaps.find(
      (submap) => submap.id === 'm5_s1_riacho_nilo_liora',
    )

    if (m5Submap?.parentLocationId !== 'vila_conhecimento_absorvido') {
      issues.push({
        code: 'm5-parent-mismatch',
        actual: m5Submap?.parentLocationId ?? '',
        expected: 'vila_conhecimento_absorvido',
      })
    }

    const villageLocation = mundi.locations.find(
      (location) => location.id === 'vila_conhecimento_absorvido',
    )
    const riachoLocation = mundi.locations.find((location) => location.id === 'riacho_claro')

    if (!villageLocation?.activeSubmapIds?.includes('m5_s1_riacho_nilo_liora')) {
      issues.push({
        code: 'm5-not-active-under-village',
        locationId: villageLocation?.id ?? '',
      })
    }

    if (riachoLocation?.activeSubmapIds?.includes('m5_s1_riacho_nilo_liora')) {
      issues.push({
        code: 'm5-active-under-riacho',
        locationId: riachoLocation.id,
      })
    }

    const transitionIds = automaticMaps.map((map) => `interlude-map-${map.id}`)
    const uniqueTransitionIds = new Set(transitionIds)

    if (uniqueTransitionIds.size !== transitionIds.length) {
      issues.push({
        code: 'duplicate-automatic-transition-id',
      })
    }

    const contactSheets = await renderThumbnailContactSheets(thumbnailAudit)
    const report = {
      generatedAt: new Date().toISOString(),
      mapsInLibrary: maps.length,
      mundiReferences: references.length,
      uniqueReferencedMaps: referencedMapIds.size,
      automaticInterludes: automaticMaps.length,
      releaseAssetsChecked: fs.existsSync(releaseAssetRoot),
      contentLibraryAssetsChecked: fs.existsSync(contentLibraryAssetRoot),
      runtimeAssetRoots,
      legacyRelativeReferences: readLegacyLibraryReferences(),
      contentLibraryGaps,
      contactSheets,
      thumbnailAudit,
      thumbnailSummary: summarizeThumbnailAudit(thumbnailAudit),
      issues,
    }

    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

    console.log('Auditoria de interludios MUN')
    console.log(`  Referencias MUN: ${report.mundiReferences}`)
    console.log(`  Mapas unicos referenciados: ${report.uniqueReferencedMaps}`)
    console.log(`  Interludios automaticos: ${report.automaticInterludes}`)
    console.log(
      `  Referencias legadas ./assets reparadas em runtime: ${report.legacyRelativeReferences.length}`,
    )
    console.log(
      `  Biblioteca de campanha verificada: ${report.contentLibraryAssetsChecked ? 'sim' : 'nao'}`,
    )
    console.log(
      `  Thumbs declaradas/validas na fonte: ${report.thumbnailSummary.declared}/${report.thumbnailSummary.sourcePresent}`,
    )
    console.log(
      `  Thumbs validas no pacote real: ${report.thumbnailSummary.contentLibraryPresent}/${report.thumbnailSummary.total}`,
    )
    console.log(
      `  Thumbs fornecidas pelo core do app: ${report.contentLibraryGaps.length}`,
    )
    console.log(
      `  Thumbs pretas ou visualmente vazias: ${report.thumbnailSummary.visuallyEmpty}`,
    )
    console.log(`  Folhas de contato: ${report.contactSheets.length}`)
    console.log(
      `  Assets core do release verificados: ${report.releaseAssetsChecked ? 'sim' : 'nao'}`,
    )
    console.log(`  Problemas: ${issues.length}`)
    console.log(`  Relatorio: ${reportPath}`)

    if (issues.length > 0) {
      console.error(JSON.stringify(issues, null, 2))
      process.exitCode = 1
    }
  } finally {
    await vite.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
