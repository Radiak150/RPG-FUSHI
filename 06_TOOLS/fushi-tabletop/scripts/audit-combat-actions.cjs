const fs = require('node:fs')
const path = require('node:path')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const root = path.resolve(__dirname, '..')
const outputDirectory = path.join(root, 'docs', 'fushi-system')
const outputJson = path.join(outputDirectory, 'NPC_COMBAT_ACTION_AUDIT.json')
const outputMarkdown = path.join(outputDirectory, 'NPC_COMBAT_ACTION_AUDIT.md')

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function getCharacters(workspace) {
  if (Array.isArray(workspace?.characters)) return workspace.characters
  return Array.isArray(workspace?.characters?.items) ? workspace.characters.items : []
}

function getFeatures(character) {
  return [
    ...(character.ataques ?? []).map((feature) => ({ ...feature, kind: 'ataque' })),
    ...(character.habilidadesDetalhadas ?? []).map((feature) => ({
      ...feature,
      kind: 'habilidade',
    })),
    ...(character.rituais ?? []).map((feature) => ({ ...feature, kind: 'ritual' })),
  ]
}

function getDescriptionSection(description, labels) {
  const accepted = new Set(labels.map(normalize))
  const known = new Set(
    [
      'acao',
      'ativacao',
      'alvo',
      'alcance',
      'custo',
      'dano',
      'duracao',
      'efeito',
      'falha',
      'fracasso',
      'limite',
      'reacao',
      'resultado',
      'risco',
      'sucesso',
      'teste',
      'tipo',
    ].map(normalize),
  )
  const lines = String(description ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
  const collected = []
  let reading = false

  for (const line of lines) {
    if (!line) continue

    const headingMatch = /^([^:]{2,24})\s*:\s*(.*)$/.exec(line)
    const heading = headingMatch ? normalize(headingMatch[1]) : ''

    if (heading && known.has(heading)) {
      reading = accepted.has(heading)
      if (reading && headingMatch[2]?.trim()) collected.push(headingMatch[2].trim())
      continue
    }

    if (reading) collected.push(line.replace(/^[→•-]\s*/, ''))
  }

  return collected.join(' · ').trim()
}

function getFeatureSnapshot(character, feature) {
  const automation = feature.automation ?? null
  const combat = automation?.combat ?? null
  const descriptor = [
    automation?.activation,
    ...(automation?.tags ?? []),
    feature.descricao,
    feature.resumo,
  ]
    .filter(Boolean)
    .join(' ')
  const testSection = getDescriptionSection(descriptor, ['teste'])
  const testInLegacyText =
    /\b(?:forca|agilidade|intelecto|presenca|vigor)\s*\+\s*[\wÀ-ÿ ]+\s+vs\b/i.test(
      descriptor,
    ) ||
    /\bdt\s*\d+/i.test(descriptor) ||
    /\b(?:d20|dados?|rolagem)\b/i.test(automation?.activation ?? '')
  const effect = combat?.efeitoRapido || getDescriptionSection(descriptor, ['efeito', 'sucesso', 'resultado'])
  const failure = combat?.falha || getDescriptionSection(descriptor, ['falha', 'fracasso'])
  const reaction = combat?.reacao || getDescriptionSection(descriptor, ['reacao'])
  const damage =
    combat?.dano?.formula ||
    getDescriptionSection(descriptor, ['dano']) ||
    (/\b(?:dano|causa|cura)\b/i.test(descriptor) ? 'mencionado no texto' : '')
  const isPassive = automation?.kind === 'passiva' || feature.tipo === 'passiva'
  const isAttack = feature.kind === 'ataque' || feature.tipo === 'ataque'
  const gaps = []

  if (!automation) {
    gaps.push('sem automacao executavel')
  } else if (!isPassive) {
    if (!combat?.teste && !testSection && !testInLegacyText) {
      gaps.push('teste nao estruturado')
    }
    if (!effect) gaps.push('efeito nao identificado')
    if (!failure) gaps.push('falha nao cadastrada')
  }

  if (isAttack) {
    if (!damage) gaps.push('dano nao identificado')
    if (!reaction) gaps.push('reacao nao cadastrada')
  }

  return {
    character: character.nome,
    featureId: feature.id,
    kind: feature.kind,
    name: feature.nome,
    automationKind: automation?.kind ?? null,
    structuredCombat: Boolean(combat),
    structuredTest: Boolean(combat?.teste),
    structuredDamage: Boolean(combat?.dano?.formula),
    hasEffect: Boolean(effect),
    hasFailure: Boolean(failure),
    hasReaction: Boolean(reaction),
    isAttack,
    isPassive,
    gaps,
  }
}

function buildReport() {
  const snapshot = readWorkspaceState({
    autosavePath: process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(root),
    projectRoot: root,
    workspacePath: process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath(),
  })
  const characters = getCharacters(snapshot.workspace)
  const features = characters.flatMap((character) =>
    getFeatures(character).map((feature) => getFeatureSnapshot(character, feature)),
  )
  const actionable = features.filter((feature) => !feature.isPassive)
  const attacks = features.filter((feature) => feature.isAttack)
  const report = {
    generatedAt: new Date().toISOString(),
    sourcePath: snapshot.sourcePath,
    characters: characters.length,
    features: features.length,
    actionable: actionable.length,
    attacks: attacks.length,
    structuredCombat: features.filter((feature) => feature.structuredCombat).length,
    structuredTests: features.filter((feature) => feature.structuredTest).length,
    structuredDamage: features.filter((feature) => feature.structuredDamage).length,
    gaps: features.filter((feature) => feature.gaps.length > 0),
    gapCounts: {},
    items: features,
  }

  for (const feature of report.gaps) {
    for (const gap of feature.gaps) {
      report.gapCounts[gap] = (report.gapCounts[gap] ?? 0) + 1
    }
  }

  return report
}

function buildMarkdown(report) {
  const gapLines = report.gaps
    .slice()
    .sort((left, right) => left.character.localeCompare(right.character, 'pt-BR'))
    .map(
      (feature) =>
        `- **${feature.character} · ${feature.name}** (${feature.kind}): ${feature.gaps.join(', ')}.`,
    )
    .join('\n')

  return `# Auditoria real de ações de combate dos NPCs

Gerado em ${report.generatedAt}.

Fonte real lida: \`${report.sourcePath}\`.

## Leitura

Este relatório não altera lore nem transforma pendência em OK. Ele separa ações com automação estruturada de ações que ainda dependem de descrição/etiquetas legadas. Uma ação sem dano não é automaticamente um erro; ataques sem dano, falha ou reação explícitos são pendências de combate.

## Resumo

| Medida | Total |
| --- | ---: |
| Fichas | ${report.characters} |
| Ações | ${report.features} |
| Ações não passivas | ${report.actionable} |
| Ataques | ${report.attacks} |
| Com Combat estruturado | ${report.structuredCombat} |
| Com teste estruturado | ${report.structuredTests} |
| Com dano estruturado | ${report.structuredDamage} |
| Ações com alguma pendência | ${report.gaps.length} |

## Pendências encontradas

${gapLines || 'Nenhuma pendência encontrada.'}

## Contagem por tipo

${Object.entries(report.gapCounts)
  .map(([gap, count]) => `- ${gap}: ${count}`)
  .join('\n') || '- nenhuma'}

O próximo passo correto para cada pendência é revisar a regra com o Mestre e então cadastrar o campo operacional correspondente; este arquivo não aplica decisões automaticamente.
`
}

const report = buildReport()
fs.mkdirSync(outputDirectory, { recursive: true })
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(outputMarkdown, buildMarkdown(report))

console.log(`[combat-audit] ${report.characters} fichas, ${report.features} ações, ${report.gaps.length} pendências reais`)
console.log(`[combat-audit] relatório: ${path.relative(root, outputMarkdown)}`)
console.log(`[combat-audit] fonte: ${report.sourcePath}`)
