const fs = require('node:fs')
const path = require('node:path')
const {
  evaluateBuildItem,
  evaluateBuildSet,
  readBuildCatalog,
} = require('./lib/fushi-build-system.cjs')
const {
  getCombatV2Block,
  getCombatV2Dodge,
  getCombatV2Profile,
} = require('./lib/combat-v2.cjs')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
  writeWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const projectRoot = process.cwd()
const outputDirectory = path.join(projectRoot, 'docs', 'fushi-system')
const assignmentPath = path.join(outputDirectory, 'NPC_BUILD_ASSIGNMENTS.json')
const reportPath = path.join(outputDirectory, 'NPC_BUILD_BALANCE_REPORT.md')
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(projectRoot)

const ARCHETYPE_LABELS = {
  assassino: 'Assassino',
  atirador: 'Atirador',
  lutador: 'Lutador',
  ocultista: 'Ocultista',
  suporte: 'Suporte',
  tank: 'Tank',
}

const NPC_ASSIGNMENTS = {
  Aeron: ['assassino', 'alta', 'Furtividade, Enganacao e Golpe Preciso sustentam execucao por abertura.'],
  Aeronyx: ['lutador', 'alta', 'Investidas, mergulho e pressao fisica sustentam combate consistente.'],
  Arven: ['suporte', 'alta', 'Comando Tatico e Determinacao Coletiva ampliam o grupo.'],
  Astrael: ['ocultista', 'alta', 'Ocultismo, coordenadas e efeitos dimensionais dependem de FUSHI.'],
  Aureon: ['tank', 'alta', 'Fortitude, Corpo Absoluto e controle de raizes seguram pressao.'],
  Bront: ['lutador', 'media', 'Martelo e resistencia pratica formam um generalista fisico.'],
  Dalvo: ['suporte', 'alta', 'Medicina, tratamento e retirada sustentam aliados.'],
  Eiran: ['lutador', 'alta', 'Luta, faixas e fluxo corporal entregam consistencia sem pico especializado.'],
  Elara: ['suporte', 'alta', 'Lideranca, civis e controle de panico priorizam o grupo.'],
  Elias: ['atirador', 'media', 'Reagentes e contencao operam por posicao e alcance, nao por linha de frente.'],
  Elion: ['ocultista', 'alta', 'Intelecto, Ocultismo e analise de logica usam controle e leitura.'],
  Euryaleth: ['tank', 'alta', 'Regeneracao, petrificacao e fases defensivas compram tempo.'],
  Gorin: ['tank', 'alta', 'Fortitude, Corpo Inabalavel e massa pesada absorvem pressao.'],
  Jaxir: ['assassino', 'alta', 'Laminas ocultas, fio e ritmo exploram abertura e explosao.'],
  Kael: ['lutador', 'alta', 'Fluxo elemental e mobilidade formam um generalista de combate.'],
  Kairo: ['atirador', 'media', 'Leitura Total e Execucao Precisa priorizam alvo e distancia taticos.'],
  Kazuo: ['suporte', 'alta', 'Desvio, Palavra de Centro e protecao de aliados sao sustentacao.'],
  Liryssa: ['atirador', 'alta', 'Pistola, pilotagem e leitura de rota controlam linha e distancia.'],
  Lux: ['ocultista', 'alta', 'Ocultismo, Vazio e Dominio convertem FUSHI em controle e dano.'],
  Lyssara: ['ocultista', 'alta', 'Dreno, dominio e vinculo emocional usam poder e controle.'],
  'Maira Velan': ['suporte', 'alta', 'Canticos, abrigo e suporte emocional sustentam o grupo.'],
  Maelra: ['suporte', 'alta', 'Medicina, Costura Vital e Mare Viva sao cura e manutencao.'],
  Morghast: ['tank', 'alta', 'Corpo Incontavel, reducao e fases defensivas seguram o encontro.'],
  Musashi: ['assassino', 'alta', 'Iniciativa, duelo e cortes precisos convertem abertura em dano.'],
  Nayr: ['assassino', 'alta', 'Crime, reflexos e Corte de Esquina priorizam ataque oportunista.'],
  Nilo: ['atirador', 'media', 'Movimento, resgate e leitura espacial controlam alcance e posicao.'],
  Nyx: ['atirador', 'alta', 'Invocacao digital e HUD Tatico atuam por alcance e prioridade de alvo.'],
  Orian: ['atirador', 'alta', 'Arco Curto, Pontaria e Disparo de Cobertura definem o papel.'],
  Renji: ['lutador', 'alta', 'Luta, Guarda de Rua e interrupcao entregam presenca fisica constante.'],
  Ryoku: ['ocultista', 'alta', 'Dominio, consumo de essencia e medo sao poder de alto impacto.'],
  Seraph: ['ocultista', 'alta', 'Comando, gravidade e Eclipse dependem de poder e controle.'],
  'Sélian Velan': ['suporte', 'alta', 'Escuta, silencio e coro alteram a qualidade das acoes do grupo.'],
  'Thal’Zhyr': ['tank', 'alta', 'Vigor extremo, regeneracao e pressao oceanica sustentam fases longas.'],
  Varden: ['lutador', 'media', 'Corte clinico e autoexperimento criam consistencia corpo a corpo.'],
  Varek: ['assassino', 'alta', 'Agilidade, Furtividade e Execucao Rapida definem explosao.'],
  Velkar: ['ocultista', 'alta', 'Ocultismo e distorcao de corpo/identidade dependem de FUSHI.'],
  Veyra: ['assassino', 'alta', 'Aposta, Sorte Suicida e Tudo ou Nada formam explosao de risco.'],
  Vhazaryon: ['lutador', 'media', 'Garras, cauda, chama e multiplas fases exigem base fisica generalista.'],
  Vorashk: ['tank', 'alta', 'Fortitude, escamas evolutivas e adaptacao defensiva absorvem pressao.'],
  Yanzik: ['tank', 'alta', 'Fortitude, persistencia e armadura Berserk sustentam dano recebido.'],
  Yor: ['assassino', 'alta', 'Agilidade, Furtividade e execucao silenciosa exploram alvo exposto.'],
}

const NPC_BIOMES = {
  Aeron: 'veu',
  Aeronyx: 'vulcao',
  Arven: 'veu',
  Astrael: 'vulcao',
  Aureon: 'montanha',
  Bront: 'praia',
  Dalvo: 'planicie',
  Eiran: 'montanha',
  Elara: 'planicie',
  Elias: 'planicie',
  Elion: 'veu',
  Euryaleth: 'vulcao',
  Gorin: 'montanha',
  Jaxir: 'ruinas',
  Kael: 'montanha',
  Kairo: 'veu',
  Kazuo: 'planicie',
  Liryssa: 'praia',
  Lux: 'montanha',
  Lyssara: 'ruinas',
  'Maira Velan': 'planicie',
  Maelra: 'praia',
  Morghast: 'vulcao',
  Musashi: 'montanha',
  Nayr: 'planicie',
  Nilo: 'planicie',
  Nyx: 'praia',
  Orian: 'planicie',
  Renji: 'planicie',
  Ryoku: 'ruinas',
  Seraph: 'ruinas',
  'Sélian Velan': 'praia',
  'Thal’Zhyr': 'vulcao',
  Varden: 'praia',
  Varek: 'veu',
  Velkar: 'ruinas',
  Veyra: 'praia',
  Vhazaryon: 'vulcao',
  Vorashk: 'vulcao',
  Yanzik: 'ruinas',
  Yor: 'praia',
}

const ATTACK_ATTRIBUTE_OVERRIDES = {
  Veyra: {
    'Lâmina de Mesa': 'agilidade',
  },
}

const POWER_LEVEL_OVERRIDES = {
  Astrael: 'Cataclisma',
  'Thal’Zhyr': 'Cataclisma',
}

function hasArg(name) {
  return process.argv.includes(`--${name}`)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCharacters(workspace) {
  if (Array.isArray(workspace.characters)) return workspace.characters
  if (Array.isArray(workspace.characters?.items)) return workspace.characters.items
  return []
}

function setCharacters(workspace, characters) {
  if (Array.isArray(workspace.characters)) return { ...workspace, characters }
  return { ...workspace, characters: { ...workspace.characters, items: characters } }
}

function inferPowerLevel(character) {
  if (POWER_LEVEL_OVERRIDES[character.nome]) return POWER_LEVEL_OVERRIDES[character.nome]
  const life = Number(character.recursos?.vidaMaxima ?? 0) || 0
  const fushi = Number(character.recursos?.fushiMaximo ?? 0) || 0
  const determination = Number(character.recursos?.determinacaoMaxima ?? 0) || 0

  if (life >= 450 || fushi >= 150 || determination >= 100) return 'Cataclisma'
  if (life >= 250 || fushi >= 100 || determination >= 40) return 'Ascensao'
  if (life >= 100 || fushi >= 60 || determination >= 25) return 'Avancado'
  return 'Basico'
}

function potencyForPowerLevel(powerLevel) {
  if (powerLevel === 'Cataclisma') return 9
  if (powerLevel === 'Ascensao') return 6
  if (powerLevel === 'Avancado') return 4
  return 2
}

function skillCapForPowerLevel(powerLevel) {
  return powerLevel === 'Basico' || powerLevel === 'Avancado' ? 10 : 15
}

function captureBaseline(character) {
  const existing = character.combatProfile?.build?.baseline
  if (existing) return clone(existing)

  return {
    actionRolls: Object.fromEntries(
      [...(character.habilidadesDetalhadas ?? []), ...(character.rituais ?? [])]
        .filter((feature) => feature.automation?.roll)
        .map((feature) => [
          feature.id,
          {
            bonus: Number(feature.automation.roll.bonus ?? 0) || 0,
            quantidadeDados: Number(feature.automation.roll.quantidadeDados ?? 1) || 1,
          },
        ]),
    ),
    attacks: Object.fromEntries(
      (character.ataques ?? []).map((attack) => [
        attack.id,
        {
          atributoBase: attack.atributoBase,
          bonusPericia: Number(attack.bonusPericia ?? 0) || 0,
        },
      ]),
    ),
    defesa: Number(character.defesa ?? 0) || 0,
    deslocamento: character.deslocamento,
    pericias: Object.fromEntries(
      (character.pericias ?? []).map((skill) => [skill.id, Number(skill.bonusPericia ?? 0) || 0]),
    ),
    recursos: clone(character.recursos),
  }
}

function restoreBaseline(character, baseline) {
  const restoreFeatures = (features = []) =>
    features.map((feature) => {
      const original = baseline.actionRolls?.[feature.id]
      if (!feature.automation?.roll || !original) return feature
      return {
        ...feature,
        automation: {
          ...feature.automation,
          roll: {
            ...feature.automation.roll,
            bonus: original.bonus ?? feature.automation.roll.bonus,
            quantidadeDados:
              original.quantidadeDados ?? feature.automation.roll.quantidadeDados,
          },
        },
      }
    })

  return {
    ...clone(character),
    ataques: (character.ataques ?? []).map((attack) => {
      const original = baseline.attacks?.[attack.id]
      return original
        ? {
            ...attack,
            atributoBase: original.atributoBase ?? attack.atributoBase,
            bonusPericia: original.bonusPericia ?? attack.bonusPericia,
          }
        : attack
    }),
    defesa: baseline.defesa,
    deslocamento: baseline.deslocamento,
    habilidadesDetalhadas: restoreFeatures(character.habilidadesDetalhadas),
    pericias: (character.pericias ?? []).map((skill) => ({
      ...skill,
      bonusPericia: Number(baseline.pericias?.[skill.id] ?? skill.bonusPericia ?? 0) || 0,
    })),
    recursos: clone(baseline.recursos),
    rituais: restoreFeatures(character.rituais),
  }
}

function getSkillBonus(character, name) {
  const target = normalize(name).replace(/[*+]/g, '')
  const skill = (character.pericias ?? []).find(
    (entry) => normalize(entry.nome).replace(/[*+]/g, '') === target,
  )
  return Math.max(0, Number(skill?.bonusPericia ?? 0) || 0)
}

function isRangedAttack(attack) {
  return /pontaria|distancia|arco|pistola|tiro|disparo|\b[2-9]\d*\s*m/i.test(
    normalize(
      `${attack.automation?.combat?.teste?.pericia ?? ''} ${attack.automation?.range ?? ''} ${attack.alcance ?? ''} ${attack.nome ?? ''}`,
    ),
  )
}

function synchronizeAttackMath(character) {
  const overrides = ATTACK_ATTRIBUTE_OVERRIDES[character.nome] ?? {}
  return (character.ataques ?? []).map((attack) => {
    const ranged = isRangedAttack(attack)
    const atributoBase = overrides[attack.nome] ?? (ranged ? 'agilidade' : attack.atributoBase)
    const skillName = ranged ? 'Pontaria' : 'Luta'
    const bonusPericia = getSkillBonus(character, skillName)

    return {
      ...attack,
      atributoBase,
      bonusPericia,
      automation: attack.automation?.combat
        ? {
            ...attack.automation,
            combat: {
              ...attack.automation.combat,
              teste: attack.automation.combat.teste
                ? {
                    ...attack.automation.combat.teste,
                    atributo: atributoBase,
                    detalhe: `+${bonusPericia}`,
                    pericia: skillName,
                  }
                : attack.automation.combat.teste,
            },
          }
        : attack.automation,
    }
  })
}

function synchronizeFeatureRollCaps(features, cap) {
  return (features ?? []).map((feature) => {
    if (feature.automation?.roll?.tipoDado !== 20) return feature
    const bonus = Math.min(cap, Math.max(0, Number(feature.automation.roll.bonus ?? 0) || 0))
    return {
      ...feature,
      automation: {
        ...feature.automation,
        roll: {
          ...feature.automation.roll,
          bonus,
        },
      },
    }
  })
}

function applyResourceDelta(resources, currentKey, maxKey, delta) {
  const spent = Math.max(0, Number(resources[maxKey] ?? 0) - Number(resources[currentKey] ?? 0))
  const maximum = Math.max(1, Number(resources[maxKey] ?? 0) + delta)
  return {
    ...resources,
    [currentKey]: Math.max(0, maximum - spent),
    [maxKey]: maximum,
  }
}

function applyMovementDelta(value, delta) {
  if (!delta || typeof value !== 'string') return value
  const match = /(-?\d+(?:[.,]\d+)?)/.exec(value)
  if (!match) return value
  const current = Number(match[1].replace(',', '.'))
  const next = Math.max(0, current + delta)
  return value.replace(match[1], Number.isInteger(next) ? String(next) : String(next).replace('.', ','))
}

function applyNpcBuild(character, catalog) {
  const assignment = NPC_ASSIGNMENTS[character.nome]
  const homeBiomeId = NPC_BIOMES[character.nome]
  if (!assignment || !homeBiomeId) throw new Error(`NPC sem classificacao explicita: ${character.nome}`)

  const [archetype, assignmentConfidence, assignmentReason] = assignment
  const baseline = captureBaseline(character)
  const restored = restoreBaseline(character, baseline)
  const powerLevel = inferPowerLevel(restored)
  const potency = potencyForPowerLevel(powerLevel)
  const catalogItems = catalog.items.filter((item) => item.archetype === archetype)
  if (catalogItems.length !== 8) throw new Error(`Conjunto incompleto para ${archetype}: ${catalogItems.length}`)
  const resolvedItems = catalogItems.map((item) => evaluateBuildItem(catalog, item, potency))
  const buildSet = evaluateBuildSet(catalog, resolvedItems, restored.atributos, archetype)
  const cap = skillCapForPowerLevel(powerLevel)
  const cappedSkills = restored.pericias.map((skill) => ({
    ...skill,
    bonusPericia: Math.min(cap, Math.max(0, Number(skill.bonusPericia ?? 0) || 0)),
  }))
  let resources = clone(restored.recursos)
  resources = applyResourceDelta(resources, 'vidaAtual', 'vidaMaxima', buildSet.totals.life)
  resources = applyResourceDelta(resources, 'fushiAtual', 'fushiMaximo', buildSet.totals.fushi)
  resources = applyResourceDelta(
    resources,
    'determinacaoAtual',
    'determinacaoMaxima',
    buildSet.totals.determination,
  )

  const next = {
    ...restored,
    ataques: synchronizeAttackMath({ ...restored, pericias: cappedSkills }),
    combatProfile: {
      ...getCombatV2Profile(restored),
      build: {
        archetype,
        assignmentConfidence,
        assignmentReason,
        baseline,
        items: resolvedItems,
        powerLevel,
        totals: buildSet.totals,
        version: 2,
      },
      papelBuild: ARCHETYPE_LABELS[archetype],
      powerLevel,
    },
    defesa: Math.max(1, restored.defesa + buildSet.totals.ca),
    deslocamento: applyMovementDelta(restored.deslocamento, buildSet.totals.movement),
    pericias: cappedSkills,
    recursos: resources,
    habilidadesDetalhadas: synchronizeFeatureRollCaps(restored.habilidadesDetalhadas, cap),
    rituais: synchronizeFeatureRollCaps(restored.rituais, cap),
  }

  next.bloqueio = getCombatV2Block(next)
  next.esquiva = getCombatV2Dodge(next) ?? 0

  return {
    character: next,
    record: {
      after: {
        block: next.bloqueio,
        ca: next.defesa,
        determination: next.recursos.determinacaoMaxima,
        dodge: next.esquiva,
        fushi: next.recursos.fushiMaximo,
        life: next.recursos.vidaMaxima,
        movement: next.deslocamento,
      },
      archetype,
      assignmentConfidence,
      assignmentReason,
      before: {
        block: character.bloqueio ?? 0,
        ca: character.defesa,
        determination: character.recursos.determinacaoMaxima,
        dodge: character.esquiva ?? 0,
        fushi: character.recursos.fushiMaximo,
        life: character.recursos.vidaMaxima,
        movement: character.deslocamento,
      },
      affinity: buildSet.affinity,
      homeBiomeId,
      characterId: character.id,
      items: resolvedItems,
      name: character.nome,
      powerLevel,
      totals: buildSet.totals,
      skillCap: cap,
      skillCapsApplied: restored.pericias
        .filter((skill) => Number(skill.bonusPericia ?? 0) > cap)
        .map((skill) => ({ from: skill.bonusPericia, name: skill.nome, to: cap })),
    },
  }
}

function validateCatalog(catalog) {
  if (catalog.items.length !== 48) throw new Error(`Catalogo precisa de 48 itens: ${catalog.items.length}`)
  const pairs = new Set(catalog.items.map((item) => `${item.biomeId}:${item.archetype}`))
  if (pairs.size !== 48) throw new Error(`Catalogo possui pares biome/arquetipo duplicados: ${pairs.size}`)

  for (const biome of catalog.biomes) {
    const count = catalog.items.filter((item) => item.biomeId === biome.id).length
    if (count !== 6) throw new Error(`${biome.label}: esperado 6 itens, encontrado ${count}`)
  }
  for (const archetype of catalog.archetypes) {
    const count = catalog.items.filter((item) => item.archetype === archetype.id).length
    if (count !== 8) throw new Error(`${archetype.label}: esperado 8 itens, encontrado ${count}`)
  }

  for (const item of catalog.items) {
    for (const rarity of catalog.rarities) {
      const resolved = evaluateBuildItem(catalog, item, rarity.representativeRoll)
      const grossBudget = Object.values(resolved.modifiers)
        .reduce((total, value) => total + Math.abs(Number(value) || 0), 0)
      const expected = catalog.rarityBudgets[rarity.id]
      if (grossBudget !== expected) {
        throw new Error(`${item.name}/${rarity.label}: orcamento ${grossBudget}, esperado ${expected}`)
      }
      if (!Object.values(resolved.modifiers).some((value) => value > 0)) {
        throw new Error(`${item.name}/${rarity.label}: sem ganho`)
      }
      if (!Object.values(resolved.modifiers).some((value) => value < 0)) {
        throw new Error(`${item.name}/${rarity.label}: sem custo`)
      }
    }
  }
}

function protectedCharacterContent(character) {
  return JSON.stringify({
    avatarUrl: character.avatarUrl,
    ataques: (character.ataques ?? []).map((attack) => ({
      alcance: attack.alcance,
      dano: attack.dano,
      nome: attack.nome,
      resumo: attack.resumo,
    })),
    descricao: character.descricao,
    habilidades: character.habilidades,
    habilidadesDetalhadas: (character.habilidadesDetalhadas ?? []).map((feature) => ({
      descricao: feature.descricao,
      nome: feature.nome,
    })),
    notas: character.notas,
    permissions: character.permissions,
    rituais: (character.rituais ?? []).map((feature) => ({
      descricao: feature.descricao,
      nome: feature.nome,
    })),
    tokenImageUrl: character.tokenImageUrl,
  })
}

function renderReport(records, sourcePath, write, backupPath) {
  const counts = Object.fromEntries(
    Object.keys(ARCHETYPE_LABELS).map((archetype) => [
      archetype,
      records.filter((record) => record.archetype === archetype).length,
    ]),
  )
  const lines = [
    '# NPC Builds - Catalogo e Aplicacao',
    '',
    `Gerado em: ${new Date().toISOString()}`,
    `Modo: ${write ? 'APLICADO NO WORKSPACE REAL' : 'DRY-RUN'}`,
    `Workspace: ${sourcePath}`,
    backupPath ? `Backup: ${backupPath}` : 'Backup: nao criado em dry-run',
    '',
    '## Travas preservadas',
    '',
    '- Nenhum texto de lore foi alterado.',
    '- Nenhum nome, efeito ou conceito de Habilidade/Ritual foi alterado.',
    '- Nenhum token, permissao ou dado multiplayer foi alterado.',
    '- A aplicacao muda somente numeros derivados, teto de Pericia, build e defesa fixa.',
    '',
    '## Distribuicao',
    '',
    `- Tank: ${counts.tank}`,
    `- Assassino: ${counts.assassino}`,
    `- Suporte: ${counts.suporte}`,
    `- Lutador: ${counts.lutador}`,
    `- Atirador: ${counts.atirador}`,
    `- Ocultista: ${counts.ocultista}`,
    '',
    '## Fichas',
    '',
    '| NPC | Nivel | Arquetipo | Conjunto | Raridade | CA | Bloqueio | Esquiva | Vida | FUSHI | Determinacao |',
    '| --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  records
    .slice()
    .sort((left, right) => left.archetype.localeCompare(right.archetype) || left.name.localeCompare(right.name, 'pt-BR'))
    .forEach((record) => {
      lines.push(
        `| ${record.name} | ${record.powerLevel} | ${ARCHETYPE_LABELS[record.archetype]} | ${record.items.length}/8 | ${record.items[0].rarityLabel} | ${record.after.ca} | ${record.after.block} | ${record.after.dodge} | ${record.after.life} | ${record.after.fushi} | ${record.after.determination} |`,
      )
    })

  lines.push('', '## Pericias ajustadas ao teto do Nivel', '')
  const capped = records.filter((record) => record.skillCapsApplied.length > 0)
  if (capped.length === 0) {
    lines.push('- Nenhuma Pericia excedia o teto.')
  } else {
    capped.forEach((record) => {
      lines.push(`- ${record.name} (${record.powerLevel}): ${record.skillCapsApplied.map((skill) => `${skill.name} ${skill.from} -> ${skill.to}`).join(', ')}`)
    })
  }

  lines.push('', '## Observacao de uso', '')
  lines.push('- A forma e o nome do objeto podem ser renomeados pelo Mestre sem mudar os afixos.')
  lines.push('- Os oito itens do arquetipo ficam no perfil de build; nao sao adicionados como objetos fisicos ao inventario.')
  lines.push('- A afinidade do arquetipo dominante e aplicada uma unica vez por personagem.')
  lines.push('- Itens Secretos continuam fora da distribuicao comum e exigem decisao narrativa do Mestre.')

  return `${lines.join('\n')}\n`
}

function main() {
  const write = hasArg('write')
  const catalog = readBuildCatalog(projectRoot)
  validateCatalog(catalog)

  const snapshot = readWorkspaceState({ autosavePath, projectRoot, workspacePath })
  if (!snapshot.workspace) throw new Error(`Workspace real ausente: ${snapshot.sourcePath}`)

  const originalCharacters = getCharacters(snapshot.workspace)
  const npcNames = originalCharacters.filter((character) => character.tipo === 'npc').map((character) => character.nome)
  const missingAssignments = npcNames.filter((name) => !NPC_ASSIGNMENTS[name] || !NPC_BIOMES[name])
  const staleAssignments = Object.keys(NPC_ASSIGNMENTS).filter((name) => !npcNames.includes(name))
  if (missingAssignments.length > 0) throw new Error(`NPCs sem build: ${missingAssignments.join(', ')}`)
  if (staleAssignments.length > 0) throw new Error(`Builds sem NPC real: ${staleAssignments.join(', ')}`)

  const records = []
  const nextCharacters = originalCharacters.map((character) => {
    if (character.tipo !== 'npc') return clone(character)
    const result = applyNpcBuild(character, catalog)
    records.push(result.record)
    return result.character
  })

  originalCharacters.forEach((character, index) => {
    if (protectedCharacterContent(character) !== protectedCharacterContent(nextCharacters[index])) {
      throw new Error(`Trava de conteudo violada em ${character.nome}`)
    }
  })

  const distribution = Object.values(
    records.reduce((counts, record) => {
      counts[record.archetype] = (counts[record.archetype] ?? 0) + 1
      return counts
    }, {}),
  ).sort((left, right) => left - right)
  if (records.length !== 41) throw new Error(`Esperado 41 NPCs canonicos, encontrado ${records.length}`)
  if (distribution[distribution.length - 1] - distribution[0] > 1) {
    throw new Error(`Distribuicao desigual: ${distribution.join('/')}`)
  }

  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(
    assignmentPath,
    `${JSON.stringify({
      catalogVersion: catalog.version,
      generatedAt: new Date().toISOString(),
      mode: write ? 'applied' : 'dry-run',
      records,
      sourcePath: snapshot.sourcePath,
    }, null, 2)}\n`,
    'utf8',
  )

  let backupPath = null
  if (write) {
    const output = writeWorkspaceState({
      backupLabel: 'workspace.backup-before-npc-builds-v2',
      workspace: setCharacters(snapshot.workspace, nextCharacters),
      workspacePath: snapshot.sourcePath,
    })
    backupPath = output.backupPath
  }

  fs.writeFileSync(
    reportPath,
    renderReport(records, snapshot.sourcePath, write, backupPath),
    'utf8',
  )

  console.log(`[npc-builds] ${write ? 'APLICADO' : 'DRY-RUN'}: ${records.length} NPCs`)
  console.log(`  catalogo: ${catalog.items.length} itens; 6/bioma; 8/arquetipo`)
  console.log(`  relatorio: ${reportPath}`)
  console.log(`  dados: ${assignmentPath}`)
  if (backupPath) console.log(`  backup: ${backupPath}`)
}

main()
