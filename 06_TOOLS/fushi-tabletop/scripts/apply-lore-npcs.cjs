const fs = require('node:fs')
const path = require('node:path')
const {
  normalizeText,
  parseLoreNpcDirectory,
  slugify,
} = require('./lib/lore-npc-parser.cjs')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
  resolveRepoRoot,
  writeWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const projectRoot = process.cwd()
const repoRoot = resolveRepoRoot(projectRoot)
const loreRoot = process.env.FUSHI_NPC_LORE_DIR ||
  path.join(repoRoot, '01_LORE', 'npcs')
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(projectRoot)
const outputDirectory = process.env.FUSHI_NPC_AUDIT_OUT ||
  path.join(projectRoot, 'docs', 'fushi-system')
const planPath = path.join(outputDirectory, 'NPC_LORE_APPLY_PLAN.json')
const reportPath = path.join(outputDirectory, 'NPC_LORE_APPLY_REPORT.md')

const skillCatalog = [
  ['skill-acrobacia', 'Acrobacia+', 'agilidade'],
  ['skill-adestramento', 'Adestramento*', 'presenca'],
  ['skill-artes', 'Artes*', 'presenca'],
  ['skill-atletismo', 'Atletismo', 'forca'],
  ['skill-atualidades', 'Atualidades', 'intelecto'],
  ['skill-ciencias', 'Ciencias*', 'intelecto'],
  ['skill-crime', 'Crime*+', 'agilidade'],
  ['skill-diplomacia', 'Diplomacia', 'presenca'],
  ['skill-enganacao', 'Enganacao', 'presenca'],
  ['skill-fortitude', 'Fortitude', 'vigor'],
  ['skill-furtividade', 'Furtividade+', 'agilidade'],
  ['skill-iniciativa', 'Iniciativa', 'agilidade'],
  ['skill-intimidacao', 'Intimidacao', 'presenca'],
  ['skill-intuicao', 'Intuicao', 'presenca'],
  ['skill-investigacao', 'Investigacao', 'intelecto'],
  ['skill-luta', 'Luta', 'forca'],
  ['skill-medicina', 'Medicina', 'intelecto'],
  ['skill-ocultismo', 'Ocultismo*', 'intelecto'],
  ['skill-percepcao', 'Percepcao', 'presenca'],
  ['skill-pilotagem', 'Pilotagem*', 'agilidade'],
  ['skill-pontaria', 'Pontaria', 'agilidade'],
  ['skill-profissao', 'Profissao*', 'intelecto'],
  ['skill-reflexos', 'Reflexos', 'agilidade'],
  ['skill-religiao', 'Religiao*', 'presenca'],
  ['skill-sobrevivencia', 'Sobrevivencia', 'intelecto'],
  ['skill-tatica', 'Tatica*', 'intelecto'],
  ['skill-tecnologia', 'Tecnologia*', 'intelecto'],
  ['skill-vontade', 'Vontade', 'presenca'],
].map(([id, nome, atributoBase]) => ({ atributoBase, id, nome }))

function hasArg(name) {
  return process.argv.includes(`--${name}`)
}

function getArg(name) {
  const prefix = `--${name}=`
  const value = process.argv.find((argument) => argument.startsWith(prefix))

  return value ? value.slice(prefix.length).trim() : ''
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function relativeFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/')
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

  if (recordFirst && recordFirst === characterFirst) return 80 + sameFaction
  if (sameFaction && (characterName.startsWith(`${recordFirst} `) || characterName === recordFirst)) {
    return 65 + sameFaction
  }
  if (sameFaction && (recordName.includes(characterName) || characterName.includes(recordName))) {
    return 45
  }

  return 0
}

function findCharacterMatch(record, characters) {
  const scored = characters
    .map((character) => ({
      character,
      score: scoreCharacterMatch(record, character),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  return scored[0]?.score >= 65 ? scored[0] : null
}

function buildSkillMap(skills) {
  return new Map((skills ?? []).map((skill) => [normalizeText(skill.nome), skill]))
}

function ensureGeneralSkills(currentSkills, loreSkills) {
  const currentByName = buildSkillMap(currentSkills)
  const loreByName = buildSkillMap(loreSkills)
  const catalogSkills = skillCatalog.map((catalogSkill) => {
    const current = currentByName.get(normalizeText(catalogSkill.nome))
    const lore = loreByName.get(normalizeText(catalogSkill.nome))

    return {
      id: catalogSkill.id,
      nome: catalogSkill.nome,
      atributoBase: catalogSkill.atributoBase,
      bonusPericia: lore?.bonusPericia ?? current?.bonusPericia ?? 0,
      resumo: lore?.resumo ?? current?.resumo ?? '',
    }
  })
  const catalogNames = new Set(catalogSkills.map((skill) => normalizeText(skill.nome)))
  const extraLoreSkills = (loreSkills ?? [])
    .filter((skill) => !catalogNames.has(normalizeText(skill.nome)))
    .map((skill, index) => ({
      id: `skill-lore-extra-${index + 1}-${slugify(skill.nome)}`,
      nome: skill.nome,
      atributoBase: skill.atributoBase,
      bonusPericia: skill.bonusPericia,
      resumo: skill.resumo ?? '',
    }))

  return [...catalogSkills, ...extraLoreSkills]
}

function clampResource(current, previousMax, nextMax) {
  const safeNextMax = Math.max(0, Number(nextMax) || 0)
  const safeCurrent = Math.max(0, Number(current) || 0)
  const safePreviousMax = Math.max(0, Number(previousMax) || 0)
  const wasFull = safePreviousMax === 0 || safeCurrent >= safePreviousMax

  return wasFull ? safeNextMax : Math.min(safeNextMax, safeCurrent)
}

function mergeResources(currentResources, loreResources) {
  const current = currentResources ?? {}
  const lore = loreResources ?? {}

  return {
    vidaAtual: clampResource(current.vidaAtual, current.vidaMaxima, lore.vidaMaxima),
    vidaMaxima: lore.vidaMaxima ?? current.vidaMaxima ?? 0,
    fushiAtual: clampResource(current.fushiAtual, current.fushiMaximo, lore.fushiMaximo),
    fushiMaximo: lore.fushiMaximo ?? current.fushiMaximo ?? 0,
    determinacaoAtual: clampResource(
      current.determinacaoAtual,
      current.determinacaoMaxima,
      lore.determinacaoMaxima,
    ),
    determinacaoMaxima: lore.determinacaoMaxima ?? current.determinacaoMaxima ?? 0,
  }
}

function preserveFeatureIds(nextFeatures, currentFeatures) {
  const currentByName = new Map(
    (currentFeatures ?? []).map((feature) => [normalizeText(feature.nome), feature]),
  )

  return (nextFeatures ?? []).map((feature, index) => {
    const current = currentByName.get(normalizeText(feature.nome))

    return {
      ...cloneValue(feature),
      id: current?.id ?? feature.id ?? `feature-${index + 1}-${slugify(feature.nome)}`,
    }
  })
}

function preserveInventoryImages(nextItems, currentItems) {
  const currentByName = new Map(
    (currentItems ?? []).map((item) => [normalizeText(item.nome), item]),
  )

  return (nextItems ?? []).map((item, index) => {
    const current = currentByName.get(normalizeText(item.nome))

    return {
      ...cloneValue(item),
      id: current?.id ?? item.id ?? `item-${index + 1}-${slugify(item.nome)}`,
      imagemUrl: current?.imagemUrl ?? item.imagemUrl,
    }
  })
}

function buildRollBase(attributes) {
  const highest = Math.max(1, ...Object.values(attributes ?? {}).map((value) => Number(value) || 0))

  return {
    bonus: 0,
    modo: 'highest',
    quantidadeDados: highest,
    tipoDado: 20,
  }
}

function inferPowerLevel(character) {
  const vida = character.recursos?.vidaMaxima ?? 0
  const fushi = character.recursos?.fushiMaximo ?? 0
  const ca = character.defesa ?? 0

  if (vida >= 450 || fushi >= 150 || ca >= 30) return 'Cataclisma'
  if (vida >= 250 || fushi >= 100 || ca >= 25) return 'Ascensao'
  if (vida >= 100 || fushi >= 60 || ca >= 20) return 'Avancado'
  return 'Basico'
}

function getExpectedLevelForPower(powerLevel) {
  if (powerLevel === 'Cataclisma') return 30
  if (powerLevel === 'Ascensao') return 20
  if (powerLevel === 'Avancado') return 17
  return 1
}

function buildBalanceNotes(character) {
  const powerLevel = inferPowerLevel(character)
  const notes = []

  if (powerLevel === 'Basico' && character.defesa < 16) {
    notes.push('Basico com CA abaixo de 16; conferir se e civil/fraco intencional.')
  }
  if (powerLevel === 'Avancado' && character.defesa < 20) {
    notes.push('Avancado com CA abaixo de 20; pode estar fragil para a escala nova.')
  }
  if (powerLevel === 'Ascensao' && character.defesa < 25) {
    notes.push('Ascensao com CA abaixo de 25; conferir fase/item defensivo.')
  }
  if (powerLevel === 'Cataclisma' && character.defesa < 30) {
    notes.push('Cataclisma com CA abaixo de 30; conferir regra de fase.')
  }

  return {
    notes,
    powerLevel,
  }
}

function buildMissingCharacter(record) {
  const draft = record.appDraft
  const nextCharacter = {
    id: `npc-lore-${slugify(record.name)}`,
    nome: record.name,
    avatarUrl: undefined,
    tokenImageUrl: undefined,
    tokenSize: 1,
    jogador: 'NPC',
    classe: '',
    origem: '',
    tier: 0,
    combatRole: '',
    tipo: 'npc',
    faccao: record.factionId,
    localAtual: 'Sem local definido',
    notas: `Importado da lore: ${relativeFromRepo(record.filePath)}`,
    defesa: draft.defesa,
    nivel: getExpectedLevelForPower(inferPowerLevel(draft)),
    deslocamento: draft.deslocamento ?? '9 m',
    bloqueio: draft.bloqueio ?? Math.floor((draft.defesa ?? 10) / 2),
    esquiva: draft.esquiva ?? draft.defesa,
    protecao: draft.protecao,
    resistencia: undefined,
    proficiencias: [],
    habilidades: draft.habilidades,
    habilidadesDetalhadas: draft.habilidadesDetalhadas,
    rituais: draft.rituais ?? [],
    inventario: draft.inventario,
    inventarioDetalhado: draft.inventarioDetalhado,
    descricao: {
      historia: '',
      objetivo: '',
      aparencia: '',
      personalidade: '',
    },
    permissions: {
      canBeAssignedToPlayer: true,
      gmCanRevokeControl: true,
      tokenControl: {
        controlledByPlayerIds: [],
        sharedControl: false,
      },
      notes: '',
    },
    status: ['Ativo'],
    pericias: ensureGeneralSkills([], record.skills),
    ataques: [],
    atributos: draft.atributos,
    recursos: draft.recursos,
    rolagemBase: buildRollBase(draft.atributos),
    tone: 'steady',
  }

  return nextCharacter
}

function mergeLoreIntoCharacter(currentCharacter, record) {
  const current = cloneValue(currentCharacter)
  const draft = record.appDraft
  const sourceInventory =
    draft.inventarioDetalhado && draft.inventarioDetalhado.length > 0
      ? draft.inventarioDetalhado
      : current.inventarioDetalhado ?? []
  const sourceRituals =
    draft.rituais && draft.rituais.length > 0
      ? draft.rituais
      : current.rituais ?? []
  const nextInventory = preserveInventoryImages(
    sourceInventory,
    current.inventarioDetalhado,
  )
  const nextFeatures = preserveFeatureIds(
    draft.habilidadesDetalhadas,
    current.habilidadesDetalhadas,
  )
  const nextRituals = preserveFeatureIds(sourceRituals, current.rituais)

  return {
    ...current,
    nome: record.name,
    faccao: record.factionId,
    defesa: draft.defesa,
    deslocamento: draft.deslocamento ?? current.deslocamento,
    bloqueio: draft.bloqueio ?? current.bloqueio ?? Math.floor((draft.defesa ?? current.defesa ?? 10) / 2),
    esquiva: draft.esquiva ?? current.esquiva,
    protecao: draft.protecao ?? current.protecao,
    habilidades: nextFeatures.map((feature) => feature.nome),
    habilidadesDetalhadas: nextFeatures,
    rituais: nextRituals,
    inventario: nextInventory.map((item) => item.nome),
    inventarioDetalhado: nextInventory,
    pericias: ensureGeneralSkills(current.pericias, record.skills),
    atributos: draft.atributos,
    recursos: mergeResources(current.recursos, draft.recursos),
    rolagemBase: buildRollBase(draft.atributos),
  }
}

function summarizeCharacterDiff(before, after) {
  if (!before) {
    return ['criado no workspace']
  }

  const changes = []
  const keys = ['nome', 'faccao', 'defesa', 'bloqueio', 'esquiva', 'deslocamento', 'protecao']

  keys.forEach((key) => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes.push(`${key}: ${before[key] ?? 'vazio'} -> ${after[key] ?? 'vazio'}`)
    }
  })

  const resourceBefore = before.recursos ?? {}
  const resourceAfter = after.recursos ?? {}
  ;[
    ['vidaMaxima', 'Vida max'],
    ['fushiMaximo', 'FUSHI max'],
    ['determinacaoMaxima', 'Determinacao max'],
  ].forEach(([key, label]) => {
    if (resourceBefore[key] !== resourceAfter[key]) {
      changes.push(`${label}: ${resourceBefore[key] ?? 'vazio'} -> ${resourceAfter[key] ?? 'vazio'}`)
    }
  })

  const beforeFeatureCount = (before.habilidadesDetalhadas ?? []).length
  const afterFeatureCount = (after.habilidadesDetalhadas ?? []).length
  const beforeRitualCount = (before.rituais ?? []).length
  const afterRitualCount = (after.rituais ?? []).length
  const beforeInventoryCount = (before.inventarioDetalhado ?? []).length
  const afterInventoryCount = (after.inventarioDetalhado ?? []).length

  if (beforeFeatureCount !== afterFeatureCount) changes.push(`habilidades: ${beforeFeatureCount} -> ${afterFeatureCount}`)
  if (beforeRitualCount !== afterRitualCount) changes.push(`rituais: ${beforeRitualCount} -> ${afterRitualCount}`)
  if (beforeInventoryCount !== afterInventoryCount) changes.push(`inventario: ${beforeInventoryCount} -> ${afterInventoryCount}`)

  const executable = [
    ...(after.habilidadesDetalhadas ?? []),
    ...(after.rituais ?? []),
  ].filter((feature) => {
    const automation = feature.automation

    return Boolean(automation?.roll || (automation?.costs ?? []).length > 0)
  }).length

  changes.push(`acoes automatizadas: ${executable}`)

  return changes
}

function renderReport(plan, input) {
  const lines = [
    '# FUSHI NPC Lore Apply Report',
    '',
    `Gerado em: ${new Date().toISOString()}`,
    `Modo: ${input.write ? 'APLICADO' : 'DRY-RUN'}`,
    `Lore fonte: ${loreRoot}`,
    `Workspace fonte: ${input.workspaceSource}`,
    input.backupPath ? `Backup: ${input.backupPath}` : 'Backup: nao criado em dry-run',
    '',
    '## Resumo',
    '',
    `- NPCs analisados: ${plan.length}`,
    `- Atualizados: ${plan.filter((item) => item.action === 'update').length}`,
    `- Criados: ${plan.filter((item) => item.action === 'create').length}`,
    `- Ignorados: ${plan.filter((item) => item.action === 'skip').length}`,
    '',
    '## Regras Aplicadas',
    '',
    '- Lore em `01_LORE/npcs` e a fonte para atributos, pericias, recursos, defesa, bloqueio, esquiva, inventario, habilidades e rituais.',
    '- IDs, imagens, permissoes, vinculos, descricao e ataques existentes sao preservados.',
    '- Recursos atuais so resetam para o novo maximo se a ficha estava cheia; se estava ferida/gastou recurso, o valor atual e preservado e travado no novo maximo.',
    '- Balanceamento automatico fica restrito a sincronizar a ficha com a lore e marcar escala de Nivel de Poder; mudanca numerica criativa fica no relatorio, nao na ficha.',
    '',
    '## Personagens',
    '',
  ]

  plan.forEach((item) => {
    lines.push(`### ${item.name}`)
    lines.push('')
    lines.push(`- Acao: ${item.action}`)
    lines.push(`- App: ${item.appCharacterId ?? 'novo'} / ${item.appCharacterName ?? 'novo'}`)
    lines.push(`- Fonte: \`${item.sourcePath}\``)
    lines.push(`- Nivel de Poder: ${item.balance.powerLevel}`)
    item.changes.forEach((change) => {
      lines.push(`- ${change}`)
    })
    item.balance.notes.forEach((note) => {
      lines.push(`- Balanceamento: ${note}`)
    })
    lines.push('')
  })

  return `${lines.join('\n')}\n`
}

function main() {
  if (!fs.existsSync(loreRoot)) {
    throw new Error(`Pasta de lore nao encontrada: ${loreRoot}`)
  }

  const write = hasArg('write')
  const onlyRaw = getArg('only')
  const onlyNames = new Set(
    onlyRaw
      .split(',')
      .map((name) => normalizeText(name))
      .filter(Boolean),
  )
  const snapshot = readWorkspaceState({
    autosavePath,
    projectRoot,
    workspacePath,
  })

  if (!snapshot.workspace || !Array.isArray(snapshot.workspace.characters)) {
    throw new Error(`Workspace invalido ou vazio: ${snapshot.sourcePath}`)
  }

  const records = parseLoreNpcDirectory(loreRoot)
  const originalCharacters = snapshot.workspace.characters
  const charactersById = new Map(originalCharacters.map((character) => [character.id, character]))
  const nextCharacters = originalCharacters.map(cloneValue)
  const plan = []

  records.forEach((record) => {
    if (onlyNames.size > 0 && !onlyNames.has(normalizeText(record.name))) {
      return
    }

    const match = findCharacterMatch(record, nextCharacters)
    const sourcePath = relativeFromRepo(record.filePath)

    if (!match) {
      const nextCharacter = buildMissingCharacter(record)
      const balance = buildBalanceNotes(nextCharacter)
      nextCharacters.push(nextCharacter)
      plan.push({
        action: 'create',
        appCharacterId: null,
        appCharacterName: null,
        balance,
        changes: summarizeCharacterDiff(null, nextCharacter),
        name: record.name,
        sourcePath,
      })
      return
    }

    const before = charactersById.get(match.character.id) ?? match.character
    const after = mergeLoreIntoCharacter(match.character, record)
    const targetIndex = nextCharacters.findIndex((character) => character.id === match.character.id)

    if (targetIndex >= 0) {
      nextCharacters[targetIndex] = after
    }

    plan.push({
      action: 'update',
      appCharacterId: after.id,
      appCharacterName: before.nome,
      balance: buildBalanceNotes(after),
      changes: summarizeCharacterDiff(before, after),
      name: record.name,
      sourcePath,
    })
  })

  const nextWorkspace = {
    ...snapshot.workspace,
    characters: nextCharacters,
  }

  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8')

  let backupPath = null

  if (write) {
    const result = writeWorkspaceState({
      backupLabel: 'workspace.backup-before-lore-npc-apply',
      workspace: nextWorkspace,
      workspacePath: snapshot.sourceType === 'workspace' ? snapshot.sourcePath : workspacePath,
    })
    backupPath = result.backupPath
  }

  fs.writeFileSync(
    reportPath,
    renderReport(plan, {
      backupPath,
      workspaceSource: `${snapshot.sourcePath} (${snapshot.sourceType})`,
      write,
    }),
    'utf8',
  )

  console.log(
    `NPC lore apply ${write ? 'APLICADO' : 'DRY-RUN'}: ${plan.length} fichas, ` +
      `${plan.filter((item) => item.action === 'update').length} atualizadas, ` +
      `${plan.filter((item) => item.action === 'create').length} criadas.`,
  )
  if (backupPath) console.log(`Backup: ${backupPath}`)
  console.log(`Plano: ${planPath}`)
  console.log(`Relatorio: ${reportPath}`)
}

main()
