const fs = require('node:fs')
const path = require('node:path')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
  writeWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')
const { getCombatV2Block, getCombatV2Dodge } = require('./lib/combat-v2.cjs')

const projectRoot = process.cwd()
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(projectRoot)
const outputDirectory = path.join(projectRoot, 'docs', 'fushi-system')
const reportPath = path.join(outputDirectory, 'COMBAT_V2_MIGRATION_REPORT.md')
const planPath = path.join(outputDirectory, 'COMBAT_V2_MIGRATION_PLAN.json')
const BLOCK_CAP = 15

function hasArg(name) {
  return process.argv.includes(`--${name}`)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getCharacters(workspace) {
  return Array.isArray(workspace.characters)
    ? workspace.characters
    : Array.isArray(workspace.characters?.items)
      ? workspace.characters.items
      : []
}

function setCharacters(workspace, characters) {
  return Array.isArray(workspace.characters)
    ? { ...workspace, characters }
    : { ...workspace, characters: { ...workspace.characters, items: characters } }
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function buildCombatData(attack) {
  return {
    ...(attack.automation ?? {}),
    activation: attack.automation?.activation || 'Ação Principal',
    kind: 'ataque',
    combat: {
      ...(attack.automation?.combat ?? {}),
      acao: attack.automation?.combat?.acao || 'principal',
      dano: {
        critico: attack.automation?.combat?.dano?.critico || 'dados',
        formula: attack.automation?.combat?.dano?.formula || attack.dano || '1d2',
        gatilho: attack.automation?.combat?.dano?.gatilho || 'acerto',
        tipo: attack.automation?.combat?.dano?.tipo || 'fisico',
      },
      efeitoRapido:
        attack.automation?.combat?.efeitoRapido || attack.resumo || 'Causa dano físico em acerto.',
      teste: attack.automation?.combat?.teste || {
        atributo: attack.atributoBase,
        alvo: 'ca',
        detalhe: `+${Math.max(0, Math.round(Number(attack.bonusPericia ?? 0) || 0))}`,
      },
    },
  }
}

function mergeFeature(character, ritualName, detachedName, changes) {
  const ritual = (character.rituais ?? []).find((feature) => normalize(feature.nome) === normalize(ritualName))
  const detached = (character.habilidadesDetalhadas ?? []).find(
    (feature) => normalize(feature.nome) === normalize(detachedName),
  )

  if (!ritual || !detached) return character

  const detachedHeading = detached.nome.trim()
  const mergedDescription = [ritual.descricao?.trim(), detachedHeading, detached.descricao?.trim()]
    .filter(Boolean)
    .join('\n\n')
  const mergedTags = Array.from(
    new Set([...(ritual.automation?.tags ?? []), ...(detached.automation?.tags ?? [])]),
  )
  const nextRituals = (character.rituais ?? []).map((feature) =>
    feature.id === ritual.id
      ? {
          ...feature,
          descricao: mergedDescription,
          automation: {
            ...(feature.automation ?? {}),
            tags: mergedTags,
            combat: {
              ...(feature.automation?.combat ?? {}),
              acao: 'principal',
              efeitoRapido:
                feature.automation?.combat?.efeitoRapido || detachedHeading,
              risco:
                feature.automation?.combat?.risco ||
                'Após o uso, aplicar o custo e a consequência narrada na ficha.',
            },
          },
        }
      : feature,
  )

  changes.push(`${character.nome}: integrou ${detachedName} no Ritual ${ritualName}`)
  return {
    ...character,
    rituais: nextRituals,
    habilidadesDetalhadas: (character.habilidadesDetalhadas ?? []).filter(
      (feature) => feature.id !== detached.id,
    ),
  }
}

function addLiryssaAttack(character, changes) {
  if (normalize(character.nome) !== 'liryssa') return character

  const attacks = [...(character.ataques ?? [])]
  const hasSignalPistol = attacks.some((attack) => normalize(attack.nome).includes('pistola de sinalizacao'))
  const skills = [...(character.pericias ?? [])]

  if (!skills.some((skill) => normalize(skill.nome) === 'pontaria')) {
    skills.push({
      atributoBase: 'agilidade',
      bonusPericia: 5,
      id: 'skill-liryssa-pontaria-v2',
      nome: 'Pontaria',
      resumo: 'Uso de pistola de sinalização em emergência, marcação e cobertura.',
    })
    changes.push('Liryssa: adicionou Pontaria +5 para o ataque de emergência')
  }

  if (!hasSignalPistol) {
    attacks.push({
      alcance: '12 m',
      atributoBase: 'agilidade',
      automation: {
        activation: 'Ação Principal',
        combat: {
          acao: 'principal',
          dano: { critico: 'dados', formula: '1d8', gatilho: 'acerto', tipo: 'fisico' },
          efeitoRapido: 'Em acerto, causa dano e pode marcar um ponto ou alvo até o próximo turno.',
          teste: { atributo: 'agilidade', alvo: 'ca', pericia: 'Pontaria' },
        },
        kind: 'ataque',
        range: '12 m',
        target: 'Um alvo ou ponto visível',
        visualColor: '#d8a34d',
      },
      bonusPericia: 5,
      dano: '1d8',
      id: 'attack-liryssa-pistola-sinalizacao-v2',
      nome: 'Pistola de Sinalização Adaptada',
      resumo: 'Ataque de emergência e marcação tática; Liryssa não é uma atiradora principal.',
    })
    changes.push('Liryssa: cadastrou Pistola de Sinalização Adaptada como ataque 1d8')
  }

  return { ...character, ataques: attacks, pericias: skills }
}

function tuneWolf(character, changes) {
  const normalizedName = normalize(character.nome)

  if (normalizedName === 'lobo cinzento') {
    const hasAlignedAttack = (character.ataques ?? []).some(
      (attack) => normalize(attack.nome) === 'mordida' && attack.dano === '1d6',
    )
    const attacks = (character.ataques ?? []).map((attack) =>
      normalize(attack.nome) === 'mordida' ? { ...attack, dano: '1d6' } : attack,
    )
    const isAligned =
      character.combatProfile?.papelBuild === 'minion' &&
      character.recursos?.vidaAtual === 8 &&
      character.recursos?.vidaMaxima === 8 &&
      character.bloqueio === 0 &&
      character.esquiva === getCombatV2Dodge(character) &&
      hasAlignedAttack

    if (isAligned) {
      return character
    }

    const next = {
      ...character,
      ataques: attacks,
      bloqueio: 0,
      combatProfile: { versao: 2, papelBuild: 'minion', podeEsquivar: true },
      combatRole: 'Minion de alcateia',
      esquiva: 0,
      recursos: { ...character.recursos, vidaAtual: 8, vidaMaxima: 8 },
      status: ['Minion', 'Animal', 'Wave tutorial'],
    }
    next.esquiva = getCombatV2Dodge(next) ?? 0
    changes.push('Lobo Cinzento: alinhado a 8 Vida, Mordida 1d6 e papel Minion')
    return next
  }

  if (normalizedName === 'lobo marcado por fushi') {
    const hasAlignedAttack = (character.ataques ?? []).some(
      (attack) =>
        normalize(attack.nome) === 'mordida instavel' && attack.dano === '1d6 + 1',
    )
    const attacks = (character.ataques ?? []).map((attack) =>
      normalize(attack.nome) === 'mordida instavel'
        ? { ...attack, dano: '1d6 + 1' }
        : attack,
    )
    const isAligned =
      character.combatProfile?.papelBuild === 'elite-minion' &&
      character.recursos?.vidaAtual === 14 &&
      character.recursos?.vidaMaxima === 14 &&
      character.bloqueio === 0 &&
      character.esquiva === getCombatV2Dodge(character) &&
      hasAlignedAttack

    if (isAligned) {
      return character
    }

    const next = {
      ...character,
      ataques: attacks,
      bloqueio: 0,
      combatProfile: { versao: 2, papelBuild: 'elite-minion', podeEsquivar: true },
      combatRole: 'Elite de alcateia FUSHI',
      esquiva: 0,
      recursos: { ...character.recursos, vidaAtual: 14, vidaMaxima: 14 },
      status: ['Elite Básico', 'Animal', 'FUSHI instável'],
    }
    next.esquiva = getCombatV2Dodge(next) ?? 0
    changes.push('Lobo Marcado por FUSHI: alinhado a 14 Vida, Mordida 1d6 + 1 e papel elite-minion')
    return next
  }

  return character
}

function migrateCharacter(input, options = {}) {
  const changes = []
  let character = clone(input)
  const originalBlock = Number(character.bloqueio ?? 0) || 0
  const originalDodge = Number(character.esquiva ?? 0) || 0
  const originalProfileVersion = Number(character.combatProfile?.versao ?? 0) || 0
  const profile = {
    ...(character.combatProfile ?? {}),
    bloqueioCap: Math.min(BLOCK_CAP, Math.max(0, Number(character.combatProfile?.bloqueioCap ?? BLOCK_CAP) || BLOCK_CAP)),
    podeEsquivar: character.combatProfile?.podeEsquivar !== false,
    versao: 2,
  }
  character.combatProfile = profile
  character.bloqueio = getCombatV2Block(character)
  character.esquiva = getCombatV2Dodge(character) ?? 0

  if (character.bloqueio !== originalBlock) {
    changes.push(`${character.nome}: Bloqueio ${originalBlock} -> ${character.bloqueio} por Fortitude`)
  }

  if (originalDodge !== character.esquiva) {
    changes.push(`${character.nome}: Esquiva ${originalDodge} -> ${character.esquiva}; usa CA + AGI + Reflexos`)
  }

  if (originalProfileVersion !== 2) {
    changes.push(`${character.nome}: Perfil de combate atualizado para V2`)
  }

  if (options.defensesOnly) {
    return { changes, character }
  }

  character.ataques = (character.ataques ?? []).map((attack) => ({
    ...attack,
    automation: buildCombatData(attack),
  }))

  character = tuneWolf(character, changes)
  character = addLiryssaAttack(character, changes)

  if (normalize(character.nome) === 'veyra') {
    character = mergeFeature(
      character,
      '⚫ HABILIDADE LENDÁRIA TUDO OU NADA',
      'RESULTADO',
      changes,
    )
  }

  if (normalize(character.nome) === 'liryssa') {
    character = mergeFeature(
      character,
      '⚫ HABILIDADE LENDÁRIA CAPÍTULO FINAL? NEM PENSAR',
      'COMANDO DA CAPITÃ',
      changes,
    )
  }

  return { changes, character }
}

function renderReport(input) {
  const changed = input.plan.filter((entry) => entry.changes.length > 0)
  const lines = [
    '# Combat V2 Migration Report',
    '',
    `Gerado em: ${new Date().toISOString()}`,
    `Modo: ${input.write ? 'APLICADO' : 'DRY-RUN'}`,
    `Fonte: ${input.sourcePath}`,
    input.backupPath ? `Backup: ${input.backupPath}` : 'Backup: nao criado em dry-run',
    '',
    '## Regras aplicadas',
    '',
    '- Bloqueio passa a usar Fortitude, com teto normal 15.',
    '- Esquiva e fixa em CA + AGI + Reflexos; gasta Reacao e nao usa dados.',
    '- Ataques passam a carregar dados estruturados de combate sem perder texto legado.',
    '- Ajustes de Veyra, Liryssa e lobos sao pontuais e rastreaveis.',
    '',
    `## Resumo`,
    '',
    `- Fichas analisadas: ${input.plan.length}`,
    `- Fichas com alteracao: ${changed.length}`,
    '',
  ]

  changed.forEach((entry) => {
    lines.push(`### ${entry.name}`)
    lines.push('')
    entry.changes.forEach((change) => lines.push(`- ${change}`))
    lines.push('')
  })

  return `${lines.join('\n')}\n`
}

function main() {
  const write = hasArg('write')
  const defensesOnly = hasArg('defenses-only')
  const snapshot = readWorkspaceState({ autosavePath, projectRoot, workspacePath })

  if (!snapshot.workspace) {
    throw new Error(`Workspace invalido ou ausente: ${snapshot.sourcePath}`)
  }

  const plan = []
  const nextCharacters = getCharacters(snapshot.workspace).map((character) => {
    const result = migrateCharacter(character, { defensesOnly })
    plan.push({ changes: result.changes, id: character.id, name: character.nome, type: character.tipo })
    return result.character
  })
  const nextWorkspace = setCharacters(snapshot.workspace, nextCharacters)
  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(planPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), plan }, null, 2)}\n`)

  let backupPath = null
  if (write) {
    const output = writeWorkspaceState({
      backupLabel: 'workspace.backup-before-combat-v2',
      workspace: nextWorkspace,
      workspacePath,
    })
    backupPath = output.backupPath
  }

  fs.writeFileSync(
    reportPath,
    renderReport({ backupPath, plan, sourcePath: snapshot.sourcePath, write }),
  )
  console.log(JSON.stringify({ backupPath, changed: plan.filter((entry) => entry.changes.length).length, defensesOnly, planPath, reportPath, write }, null, 2))
}

main()
