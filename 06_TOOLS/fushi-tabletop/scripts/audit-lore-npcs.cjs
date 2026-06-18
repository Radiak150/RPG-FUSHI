const fs = require('node:fs')
const path = require('node:path')
const {
  normalizeText,
  parseLoreNpcDirectory,
} = require('./lib/lore-npc-parser.cjs')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
  resolveRepoRoot,
} = require('./lib/fushi-workspace-io.cjs')

const projectRoot = process.cwd()
const repoRoot = resolveRepoRoot(projectRoot)
const loreRoot = process.env.FUSHI_NPC_LORE_DIR ||
  path.join(repoRoot, '01_LORE', 'npcs')
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(projectRoot)
const outputDirectory = process.env.FUSHI_NPC_AUDIT_OUT ||
  path.join(projectRoot, 'docs', 'fushi-system')
const reportPath = path.join(outputDirectory, 'NPC_LORE_AUDIT.md')
const candidatesPath = path.join(outputDirectory, 'NPC_LORE_IMPORT_CANDIDATES.json')

const BALANCE_RULES = {
  Basico: { minimumCa: 16 },
  Avancado: { minimumCa: 20 },
  Ascensao: { minimumCa: 25 },
  Cataclisma: { minimumCa: 30 },
}

function readWorkspaceSnapshot() {
  const snapshot = readWorkspaceState({
    autosavePath,
    projectRoot,
    workspacePath,
  })
  const workspace = snapshot.workspace

  return {
    ...snapshot,
    characters: Array.isArray(workspace?.characters) ? workspace.characters : [],
  }
}

function buildNameIndex(characters) {
  const index = new Map()

  for (const character of characters) {
    if (!character || typeof character.nome !== 'string') continue

    const normalizedName = normalizeText(character.nome)

    if (!normalizedName) continue
    if (!index.has(normalizedName)) {
      index.set(normalizedName, [])
    }
    index.get(normalizedName).push(character)
  }

  return index
}

function getFirstName(value) {
  return normalizeText(value).split(' ')[0] ?? ''
}

function scoreCharacterMatch(record, character) {
  const recordName = normalizeText(record.name)
  const characterName = normalizeText(character?.nome)

  if (!recordName || !characterName) return 0
  if (recordName === characterName) return 100

  const sameFaction = character.faccao === record.factionId ? 10 : 0
  const recordFirst = getFirstName(record.name)
  const characterFirst = getFirstName(character.nome)

  if (recordFirst && recordFirst === characterFirst) {
    return 80 + sameFaction
  }

  if (sameFaction && (characterName.startsWith(`${recordFirst} `) || characterName === recordFirst)) {
    return 65 + sameFaction
  }

  if (sameFaction && (recordName.includes(characterName) || characterName.includes(recordName))) {
    return 45
  }

  return 0
}

function findCharacterMatch(record, nameIndex, characters) {
  const normalizedName = normalizeText(record.name)
  const directMatches = nameIndex.get(normalizedName) ?? []

  if (directMatches.length > 0) {
    return directMatches[0]
  }

  const scored = characters
    .map((character) => ({
      character,
      score: scoreCharacterMatch(record, character),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  if (scored[0]?.score >= 65) return scored[0].character

  return null
}

function compareNumber(label, expected, actual, issues) {
  if (expected === null || expected === undefined) return

  if (actual !== expected) {
    issues.push(`${label}: lore=${expected}, app=${actual ?? 'vazio'}`)
  }
}

function inferRecordPowerLevel(record) {
  const vida = Number(record.status?.recursos?.vidaMaxima ?? 0) || 0
  const fushi = Number(record.status?.recursos?.fushiMaximo ?? 0) || 0
  const determinacao = Number(record.status?.recursos?.determinacaoMaxima ?? 0) || 0
  const defesa = Number(record.status?.defesa ?? 0) || 0

  if (vida >= 450 || fushi >= 150 || determinacao >= 100 || defesa >= 30) return 'Cataclisma'
  if (vida >= 250 || fushi >= 100 || determinacao >= 40 || defesa >= 25) return 'Ascensao'
  if (vida >= 100 || fushi >= 60 || determinacao >= 25 || defesa >= 20) return 'Avancado'

  return 'Basico'
}

function getRecordSkillBonus(record, skillName) {
  const normalizedName = normalizeText(skillName)
  const skill = (record.skills ?? []).find((item) => normalizeText(item.nome) === normalizedName)

  return Number(skill?.bonusPericia ?? 0) || 0
}

function buildBalancedExpectedStatus(record) {
  const powerLevel = inferRecordPowerLevel(record)
  const rule = BALANCE_RULES[powerLevel]
  const status = record.status ?? {}
  const expected = {
    bloqueio: status.bloqueio,
    defesa: status.defesa,
    esquiva: status.esquiva,
  }

  if (typeof expected.defesa === 'number') {
    expected.defesa = Math.max(expected.defesa, rule.minimumCa)
    expected.bloqueio = Math.floor(expected.defesa / 2)
    expected.esquiva =
      expected.defesa +
      (Number(record.attributes?.agilidade ?? 0) || 0) +
      getRecordSkillBonus(record, 'Reflexos')
  }

  return expected
}

function compareAttributes(record, character, issues) {
  const actual = character.atributos ?? {}

  compareNumber('FORCA', record.attributes.forca, actual.forca, issues)
  compareNumber('AGILIDADE', record.attributes.agilidade, actual.agilidade, issues)
  compareNumber('INTELECTO', record.attributes.intelecto, actual.intelecto, issues)
  compareNumber('PRESENCA', record.attributes.presenca, actual.presenca, issues)
  compareNumber('VIGOR', record.attributes.vigor, actual.vigor, issues)
}

function compareResources(record, character, issues) {
  const actual = character.recursos ?? {}
  const balancedStatus = buildBalancedExpectedStatus(record)

  compareNumber('Vida maxima', record.status.recursos.vidaMaxima, actual.vidaMaxima, issues)
  compareNumber('FUSHI maximo', record.status.recursos.fushiMaximo, actual.fushiMaximo, issues)
  compareNumber(
    'Determinacao maxima',
    record.status.recursos.determinacaoMaxima,
    actual.determinacaoMaxima,
    issues,
  )
  compareNumber('CA', balancedStatus.defesa, character.defesa, issues)
  compareNumber('Bloqueio', balancedStatus.bloqueio, character.bloqueio, issues)
  compareNumber('Esquiva', balancedStatus.esquiva, character.esquiva, issues)
}

function compareNamedCollection(label, expectedItems, actualItems, issues) {
  const actualNames = new Set(
    (actualItems ?? [])
      .map((item) => normalizeText(typeof item === 'string' ? item : item?.nome))
      .filter(Boolean),
  )
  const missing = expectedItems
    .map((item) => item.nome)
    .filter((name) => !actualNames.has(normalizeText(name)))

  if (missing.length > 0) {
    issues.push(`${label} faltando: ${missing.slice(0, 6).join(', ')}`)
  }
}

function compareSkills(record, character, issues) {
  const actualByName = new Map(
    (character.pericias ?? []).map((skill) => [normalizeText(skill.nome), skill]),
  )
  const missing = []
  const mismatched = []

  for (const expected of record.skills) {
    const actual = actualByName.get(normalizeText(expected.nome))

    if (!actual) {
      missing.push(expected.nome)
      continue
    }

    if (actual.bonusPericia !== expected.bonusPericia) {
      mismatched.push(`${expected.nome} lore=${expected.bonusPericia}, app=${actual.bonusPericia}`)
    }
  }

  if (missing.length > 0) {
    issues.push(`Pericias faltando: ${missing.slice(0, 8).join(', ')}`)
  }

  if (mismatched.length > 0) {
    issues.push(`Pericias divergentes: ${mismatched.slice(0, 6).join('; ')}`)
  }
}

function auditRecord(record, character) {
  const issues = []

  if (!character) {
    return {
      matched: false,
      issues: ['Nao encontrado no workspace/autosave atual'],
      severity: 'missing',
    }
  }

  compareAttributes(record, character, issues)
  compareResources(record, character, issues)
  compareSkills(record, character, issues)
  compareNamedCollection(
    'Habilidades',
    record.features,
    [
      ...(character.habilidadesDetalhadas ?? []),
      ...(character.rituais ?? []),
      ...(character.habilidades ?? []),
    ],
    issues,
  )
  compareNamedCollection(
    'Inventario',
    record.inventory,
    [
      ...(character.inventarioDetalhado ?? []),
      ...(character.inventario ?? []),
    ],
    issues,
  )

  return {
    matched: true,
    issues,
    severity: issues.length > 0 ? 'divergent' : 'ok',
  }
}

function relativeFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/')
}

function renderReport(records, auditedRecords, workspaceSnapshot) {
  const missing = auditedRecords.filter((item) => item.audit.severity === 'missing')
  const divergent = auditedRecords.filter((item) => item.audit.severity === 'divergent')
  const ok = auditedRecords.filter((item) => item.audit.severity === 'ok')
  const generatedAt = new Date().toISOString()
  const workspaceMeta = workspaceSnapshot.stat
    ? `${workspaceSnapshot.sourcePath} (${workspaceSnapshot.stat.mtime.toISOString()}, ${workspaceSnapshot.sourceType})`
    : `${workspaceSnapshot.sourcePath} (nao encontrado)`
  const lines = [
    '# FUSHI NPC Lore Audit',
    '',
    `Gerado em: ${generatedAt}`,
    `Lore fonte: ${loreRoot}`,
    `Workspace comparado: ${workspaceMeta}`,
    '',
    '## Resumo',
    '',
    `- Arquivos de ficha analisados: ${records.length}`,
    `- Encontrados no workspace/autosave: ${records.length - missing.length}`,
    `- OK: ${ok.length}`,
    `- Divergentes: ${divergent.length}`,
    `- Ausentes no app: ${missing.length}`,
    '',
    '## Regra de uso',
    '',
    '- Este relatorio nao altera lore e nao aplica importacao automatica.',
    '- O JSON de candidatos preserva nomes, descricoes, atributos, status, inventario e habilidades extraidos dos TXT.',
    '- A comparacao de CA/Bloqueio/Esquiva usa a camada aprovada de balanceamento matematico por Nivel de Poder.',
    '',
  ]

  if (divergent.length > 0) {
    lines.push('## Divergencias Criticas', '')
    divergent.forEach((item) => {
      lines.push(`### ${item.record.name}`)
      lines.push('')
      lines.push(`Arquivo: \`${relativeFromRepo(item.record.filePath)}\``)
      lines.push(`App: \`${item.character?.id ?? 'sem-id'} / ${item.character?.nome ?? 'sem-nome'}\``)
      lines.push('')
      item.audit.issues.forEach((issue) => {
        lines.push(`- ${issue}`)
      })
      lines.push('')
    })
  }

  if (missing.length > 0) {
    lines.push('## Ausentes No Workspace', '')
    missing.forEach((item) => {
      lines.push(`- ${item.record.name} -> \`${relativeFromRepo(item.record.filePath)}\``)
    })
    lines.push('')
  }

  lines.push('## Candidatos Por Faccao', '')
  const byFaction = new Map()
  auditedRecords.forEach((item) => {
    if (!byFaction.has(item.record.factionId)) {
      byFaction.set(item.record.factionId, [])
    }
    byFaction.get(item.record.factionId).push(item)
  })
  Array.from(byFaction.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([factionId, items]) => {
      lines.push(`### ${factionId}`)
      items
        .sort((left, right) => left.record.name.localeCompare(right.record.name))
        .forEach((item) => {
          lines.push(
            `- ${item.record.name}: ${item.audit.severity} (${item.record.skills.length} pericias, ${item.record.features.length} habilidades, ${item.record.inventory.length} itens)`,
          )
        })
      lines.push('')
    })

  return `${lines.join('\n')}\n`
}

function main() {
  if (!fs.existsSync(loreRoot)) {
    throw new Error(`Pasta de lore nao encontrada: ${loreRoot}`)
  }

  const records = parseLoreNpcDirectory(loreRoot)
  const workspaceSnapshot = readWorkspaceSnapshot()
  const workspaceCharacters = workspaceSnapshot.characters
  const nameIndex = buildNameIndex(workspaceCharacters)
  const auditedRecords = records.map((record) => {
    const character = findCharacterMatch(record, nameIndex, workspaceCharacters)

    return {
      audit: auditRecord(record, character),
      character,
      record,
    }
  })
  const candidates = auditedRecords.map((item) => ({
    audit: item.audit,
    appCharacterId: item.character?.id ?? null,
    appCharacterName: item.character?.nome ?? null,
    draft: item.record.appDraft,
    factionId: item.record.factionId,
    name: item.record.name,
    sourcePath: relativeFromRepo(item.record.filePath),
  }))

  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(reportPath, renderReport(records, auditedRecords, workspaceSnapshot), 'utf8')
  fs.writeFileSync(candidatesPath, `${JSON.stringify(candidates, null, 2)}\n`, 'utf8')

  const missingCount = auditedRecords.filter((item) => item.audit.severity === 'missing').length
  const divergentCount = auditedRecords.filter((item) => item.audit.severity === 'divergent').length

  console.log(
    `NPC lore audit OK: ${records.length} fichas, ${divergentCount} divergentes, ${missingCount} ausentes.`,
  )
  console.log(`Relatorio: ${reportPath}`)
  console.log(`Candidatos: ${candidatesPath}`)
}

main()
