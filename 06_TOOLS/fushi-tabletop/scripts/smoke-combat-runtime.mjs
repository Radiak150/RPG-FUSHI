import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function fail(message) {
  throw new Error(`[combat-runtime] ${message}`)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function getCharacters(workspace) {
  if (Array.isArray(workspace?.characters)) return workspace.characters
  if (Array.isArray(workspace?.characters?.items)) return workspace.characters.items
  return []
}

async function main() {
  const vite = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    root,
    server: { middlewareMode: true },
  })

  try {
    const combatRolls = await vite.ssrLoadModule('/src/lib/combatRolls.ts')
    const characterActions = await vite.ssrLoadModule('/src/lib/characterActions.ts')
    const characterSheet = await vite.ssrLoadModule('/src/lib/characterSheet.ts')
    const publicState = await vite.ssrLoadModule('/src/lib/session/publicState.ts')
    const snapshot = readWorkspaceState({
      autosavePath: process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(root),
      projectRoot: root,
      workspacePath: process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath(),
    })
    const characters = getCharacters(snapshot.workspace)
    const davi = characters.find((character) => normalize(character.nome) === 'davi')
    const grim = characters.find((character) => normalize(character.nome) === 'grim')

    assert(davi, `ficha real de Davi ausente em ${snapshot.sourcePath}`)
    assert(grim, `ficha real de Grim ausente em ${snapshot.sourcePath}`)

    const surgicalPenalty = combatRolls.resolveCombatDamageSequence({
      buildModifier: -5,
      multiplier: 2,
      rolledDamage: 4,
    })
    const surgicalFloor = combatRolls.resolveCombatDamageSequence({
      buildModifier: -5,
      multiplier: 2,
      rolledDamage: 1,
    })
    const surgicalBonus = combatRolls.resolveCombatDamageSequence({
      buildModifier: 5,
      multiplier: 2,
      rolledDamage: 4,
    })

    assert(
      surgicalPenalty.finalDamage === 3,
      `Analise com penalidade deveria resolver 4 x 2 - 5 = 3, recebeu ${surgicalPenalty.finalDamage}`,
    )
    assert(
      surgicalFloor.finalDamage === 0,
      `Dano negativo deveria parar em 0, recebeu ${surgicalFloor.finalDamage}`,
    )
    assert(
      surgicalBonus.finalDamage === 18,
      `Bonus positivo deveria resolver (4 + 5) x 2 = 18, recebeu ${surgicalBonus.finalDamage}`,
    )

    const normalizedGrim = characterSheet.normalizeCharacterSheet(grim)
    const lifeSiphon = normalizedGrim.habilidadesDetalhadas?.find(
      (feature) => feature.id === 'training-grim-vida-sugada',
    )
    assert(
      lifeSiphon?.automation?.combat?.resolucao?.mode === 'drain-transfer',
      'Vida Sugada antiga nao recuperou a resolucao canonica de dreno e cura',
    )
    assert(
      lifeSiphon?.automation?.combat?.alcance?.maxSquares === 6,
      'Vida Sugada antiga nao recuperou o alcance canonico de 6 quadrados',
    )

    const dagger = combatRolls
      .getCharacterCombatActions(davi)
      .find((option) => normalize(option.feature.nome).includes('adaga'))

    assert(dagger, 'Adaga de Davi nao entrou no catalogo de combate')

    const checkOptions = characterActions.getCharacterActionCheckOptions(dagger.feature)
    const melee = checkOptions.find((option) => option.id === 'melee')
    const ranged = checkOptions.find((option) => option.id === 'ranged')

    assert(
      melee?.atributo === 'forca' && normalize(melee?.pericia) === 'luta',
      'Adaga perdeu a opcao FOR + Luta',
    )
    assert(
      ranged?.atributo === 'agilidade' && normalize(ranged?.pericia) === 'pontaria',
      'Adaga perdeu a opcao AGI + Pontaria',
    )

    const sourceCell = { column: 10, row: 10 }
    const adjacentCell = { column: 11, row: 10 }
    const rangedCell = { column: 14, row: 10 }
    const outOfRangeCell = { column: 23, row: 10 }
    const adjacentRanged = combatRolls.calculateCombatAction({
      character: davi,
      checkOptionId: ranged.id,
      feature: dagger.feature,
      source: dagger.source,
      sourceCell,
      targetCell: adjacentCell,
    })
    const normalRanged = combatRolls.calculateCombatAction({
      character: davi,
      checkOptionId: ranged.id,
      feature: dagger.feature,
      source: dagger.source,
      sourceCell,
      targetCell: rangedCell,
    })
    const outOfRange = combatRolls.calculateCombatAction({
      character: davi,
      checkOptionId: ranged.id,
      feature: dagger.feature,
      source: dagger.source,
      sourceCell,
      targetCell: outOfRangeCell,
    })

    assert(
      adjacentRanged.contexts.includes('adjacent') &&
        !adjacentRanged.contexts.includes('ranged'),
      'Pontaria colada acumulou bonus de distancia em vez da penalidade adjacente',
    )
    assert(
      normalRanged.contexts.includes('ranged') &&
        !normalRanged.contexts.includes('adjacent'),
      'Pontaria a 4 quadrados nao recebeu o contexto de distancia',
    )
    assert(
      adjacentRanged.distanceSquares === 1 &&
        normalRanged.distanceSquares === 4,
      'Distancia congelada divergiu da grade',
    )
    assert(
      outOfRange.isInRange === false,
      'Adaga alcancou 13 quadrados sem modificador de alcance',
    )

    const meleeRoll = characterActions.getCharacterActionRollConfig(
      dagger.feature,
      davi,
      melee.id,
    )
    const rangedRoll = characterActions.getCharacterActionRollConfig(
      dagger.feature,
      davi,
      ranged.id,
    )
    const adjacentPenalty = combatRolls.getCombatRollDicePenalty({
      checkOption: ranged,
      distanceSquares: adjacentRanged.distanceSquares,
      feature: dagger.feature,
    })
    const penalizedRangedRoll = combatRolls.applyCombatDicePoolModifier(
      rangedRoll,
      adjacentPenalty,
    )

    assert(
      meleeRoll.modo === 'lowest' && meleeRoll.quantidadeDados === 2,
      'FOR 0 de Davi nao resultou em 2d20 mantendo o menor',
    )
    assert(
      rangedRoll.modo === 'highest' && rangedRoll.quantidadeDados === 2,
      'AGI 2 de Davi nao resultou em 2d20 mantendo o maior',
    )
    assert(
      penalizedRangedRoll.modo === 'highest' &&
        penalizedRangedRoll.quantidadeDados === 1,
      'Pontaria adjacente nao retirou exatamente 1d20',
    )

    const healFeature = {
      automation: {
        combat: {
          alcance: { band: 'curto', maxSquares: 6 },
          dano: { formula: '1d8', gatilho: 'acerto', tipo: 'fushi' },
          resolucao: {
            healingFormula: '1d8',
            healingTarget: 'selected',
            mode: 'heal',
          },
          teste: {
            alvo: 'dt',
            atributo: 'intelecto',
            dificuldade: 10,
            pericia: 'Medicina',
          },
        },
        kind: 'tecnica',
      },
      descricao: 'Cura estruturada de teste.',
      id: 'smoke-heal',
      nome: 'Cura smoke',
      tipo: 'tecnica',
    }
    const healCalculation = combatRolls.calculateCombatAction({
      character: davi,
      feature: healFeature,
      source: 'habilidade',
      sourceCell,
      targetCell: adjacentCell,
    })

    assert(healCalculation.damageFormula === '1d8', 'Cura perdeu sua formula')
    assert(
      healCalculation.buildDamageBonus === 0,
      'Cura pura recebeu bonus ou penalidade de dano da build',
    )

    const campaignSession = {
      currentSceneId: 'scene',
      initialSceneId: 'scene',
      logEntries: [
        {
          author: 'Davi',
          combat: {
            attackerCharacterId: 'davi',
            attackerTokenId: 'davi-token',
            kind: 'attack',
            opposedSkill: 'Segredo do alvo',
          },
          createdAt: new Date().toISOString(),
          id: 'roll-private-contract',
          text: 'Davi atacou.',
          type: 'roll',
          visibility: 'public',
        },
      ],
      publicCombatImpacts: [
        {
          createdAt: Date.now(),
          expiresAt: Date.now() + 5_000,
          id: 'ability-success',
          tokenId: 'davi-token',
          type: 'ability-success',
        },
        {
          createdAt: Date.now(),
          expiresAt: Date.now() + 5_000,
          id: 'ability-failure',
          tokenId: 'davi-token',
          type: 'ability-failure',
        },
      ],
      publicCombatMarks: [],
      publicCombatReceipt: {
        attackerName: 'Davi',
        createdAt: Date.now(),
        damageApplied: 3,
        healingApplied: 0,
        id: 'receipt',
        outcome: 'hit',
        resourceChangesByPlayerId: {
          player1: [{ after: 2, before: 5, label: 'FUSHI' }],
          player2: [{ after: 7, before: 10, label: 'Vida' }],
        },
        sceneId: 'scene',
        summary: 'Davi causou 3 de dano em Connor.',
        targetName: 'Connor',
        visibleToPlayerIds: ['player1', 'player2'],
      },
      playerDeathStates: {},
      scenes: [
        {
          id: 'scene',
          objects: [],
          tokens: [
            {
              characterId: 'davi',
              controladoPorJogadorId: 'player1',
              id: 'davi-token',
              visibility: 'public',
            },
            {
              characterId: 'connor',
              controladoPorJogadorId: 'player2',
              id: 'connor-token',
              visibility: 'public',
            },
          ],
        },
      ],
    }
    const publicForPlayer1 = publicState.sanitizeStateForPlayer(
      { campaignId: 'campaign', campaignSession },
      'player1',
    )
    const playerSession = publicForPlayer1.tabletopSession
    const playerReceipt = playerSession.publicCombatReceipt

    assert(
      playerSession.logEntries[0]?.combat === undefined,
      'Log publico vazou metadados internos do combate',
    )
    assert(
      playerSession.publicCombatImpacts.some(
        (impact) => impact.type === 'ability-success',
      ) &&
        playerSession.publicCombatImpacts.some(
          (impact) => impact.type === 'ability-failure',
        ),
      'VFX publico de habilidade nao atravessou o estado sanitizado do jogador',
    )
    assert(
      Object.keys(playerReceipt.resourceChangesByPlayerId).join(',') === 'player1',
      'Recibo de J1 vazou recursos de outro jogador',
    )
    assert(
      playerReceipt.resourceChangesByPlayerId.player2 === undefined,
      'J1 recebeu alteracao privada de J2',
    )

    console.log('[combat-runtime] PASS')
    console.log(`  workspace: ${snapshot.sourcePath}`)
    console.log('  dano: 4 x 2 - 5 = 3; piso 0; bonus positivo antes do dobro')
    console.log('  Vida Sugada: ficha antiga hidratada com dreno, cura e alcance')
    console.log('  adaga: Luta/Pontaria, distancia congelada e alcance')
    console.log('  cura: sem bonus de dano')
    console.log('  multiplayer: recibo e log sanitizados por jogador')
  } finally {
    await vite.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
