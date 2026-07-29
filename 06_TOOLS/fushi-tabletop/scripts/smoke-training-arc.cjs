const fs = require('node:fs')
const path = require('node:path')
const {
  sanitizeTrainingStateForPlayer,
} = require('../electron/multiplayer-server.cjs')

const root = path.resolve(__dirname, '..')

function fail(message) {
  throw new Error(`[training-arc] ${message}`)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function buildPublicToken(index) {
  return {
    characterId: `hero-${index}`,
    controladoPorJogadorId: `player${index}`,
    id: `token-${index}`,
    label: `Heroi ${index}`,
    stealth: index === 3 ? { enabled: true, ownerPlayerId: 'player3' } : undefined,
    visibility: index === 2 ? 'gm' : 'public',
  }
}

function buildParticipant(index, stationIds) {
  return {
    activeStationId: stationIds[0],
    characterId: `hero-${index}`,
    color: '#92c0b6',
    gmNotes: `segredo-${index}`,
    id: `player${index}`,
    label: `J${index}`,
    name: `Heroi ${index}`,
    playerId: `player${index}`,
    stations: Object.fromEntries(
      stationIds.map((stationId, stationIndex) => [
        stationId,
        {
          boldSuccesses: stationIndex === 0 ? 1 : 0,
          dt: 12,
          progress: stationIndex === 0 ? 2 : 0,
          setbacks: 0,
          status: stationIndex === 0 ? 'active' : 'pending',
        },
      ]),
    ),
    tokenId: `token-${index}`,
  }
}

function main() {
  const catalog = readJson('src/data/training/village-training-arc.json')
  const expectedStationIds = [
    'escalada',
    'bonecos',
    'obstaculos',
    'pontaria',
    'ringue',
    'lama',
  ]
  const stationIds = catalog.stations.map((station) => station.id)
  const approaches = catalog.stations.flatMap((station) => station.approaches)

  assert(catalog.id === 'vila-circuito-centro-v1', 'id canonico do arco mudou')
  assert(catalog.locationId === 'campo_treino_vila', 'local do MUN incorreto')
  assert(
    catalog.mapId === 'planicie_campo_treino_vila_topdown',
    'mapa do Campo de Treinamento incorreto',
  )
  assert(JSON.stringify(stationIds) === JSON.stringify(expectedStationIds), 'as seis estacoes mudaram')
  assert(catalog.stationGoal === 3, 'meta por estacao precisa continuar em 3 Marcas')
  assert(approaches.length >= 18, 'faltam abordagens mecanicas nas estacoes')
  assert(
    approaches.every(
      (approach) => Number.isInteger(approach.dt) && approach.dt === 10,
    ),
    'Treinamentos atuais precisam usar DT 10',
  )
  assert(catalog.version === 2, 'catalogo novo nao foi promovido para versao 2')
  assert(catalog.finalTrial.goal === 3, 'Prova Final precisa de 3 etapas por protagonista')
  assert(catalog.finalTrial.minContributors === 5, 'prova final precisa dos cinco protagonistas')
  assert(catalog.finalTrial.emotions.length === 5, 'faltam as cinco emocoes do Fluxo')
  assert(catalog.setbackMilestones.length === 3, 'faltam os tres marcos de Contratempo')
  assert(catalog.setbackMilestones[1].min === 2 && catalog.setbackMilestones[1].max === 5, 'faixa 2-5 de Contratempo incorreta')
  assert(catalog.setbackMilestones[2].min === 6, 'marco de 6+ Contratempos incorreto')
  assert(catalog.stations.find((station) => station.id === 'bonecos')?.publicSteps.some((step) => step.includes('Alta vence Avanco')), 'matriz das Guardas ausente')
  assert(catalog.stations.find((station) => station.id === 'lama')?.publicSteps.some((step) => step.includes('5 pontos de lama funda')), 'cinco pontos da Lama ausentes')

  const tokens = Array.from({ length: 5 }, (_, index) => buildPublicToken(index + 1))
  const trainingState = {
    arcId: catalog.id,
    finalTrial: {
      contributorIds: ['player1'],
      isActive: true,
      isCompleted: false,
      isUnlocked: true,
      pressure: 1,
      progress: 3,
      stationIds: ['escalada'],
    },
    gmNotes: 'segredo raiz',
    isActive: true,
    isCompleted: false,
    locationId: catalog.locationId,
    mapId: catalog.mapId,
    participants: tokens.map((_, index) => buildParticipant(index + 1, stationIds)),
    startedAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  }
  const publicState = sanitizeTrainingStateForPlayer(
    trainingState,
    { scenes: [{ id: 'training-scene', tokens }] },
    'player1',
  )
  const publicText = JSON.stringify(publicState)

  assert(
    publicState?.participants?.length === 5,
    'roster publico nao preservou os cinco jogadores durante ocultacao/furtividade',
  )
  assert(
    publicState.participants[0]?.stations?.escalada?.progress === 2,
    'progresso publico nao atravessou o sanitizador',
  )
  assert(!publicText.includes('gmNotes'), 'notas do Mestre vazaram no estado publico')
  assert(!publicText.includes('"dt"'), 'DT vazou no estado publico')
  assert(!publicText.includes('segredo'), 'texto secreto vazou no estado publico')

  const tablePage = read('src/pages/TablePage.tsx')
  const mundiPanel = read('src/components/tabletop/TabletopWorldMundiPanel.tsx')
  const overlay = read('src/components/tabletop/TabletopTrainingArc.tsx')
  const rewards = read('src/data/training/initialTrainingRewards.ts')
  const grantCatalog = read('src/data/grants/characterGrantCatalog.ts')

  assert(tablePage.includes('handleActivateVillageTraining'), 'Mesa nao liga o gatilho do MUN')
  assert(tablePage.includes('<TabletopTrainingArc'), 'overlay nao foi montado na Mesa')
  assert(mundiPanel.includes('data-testid="activate-village-training"'), 'botao do MUN ausente')
  assert(mundiPanel.includes('Ativar treinamento'), 'rotulo de ativacao ausente')
  assert(overlay.includes('data-testid="training-arc-overlay"'), 'marcador do painel ausente')
  assert(overlay.includes('{isGm ? ('), 'controles do Mestre perderam a barreira de papel')
  assert(overlay.includes('Somente Mestre'), 'area privada do Mestre nao esta identificada')
  assert(rewards.includes('training-kairos-barulho-torturante'), 'recompensa canonica de Kairos ausente')
  assert(rewards.includes('training-davi-analise-cirurgica'), 'recompensa canonica de Davi ausente')
  assert(rewards.includes('training-connor-percepcao-sensorial'), 'recompensa canonica de Connor ausente')
  assert(rewards.includes('training-kael-pata-mansa'), 'recompensa canonica de Kael ausente')
  assert(rewards.includes('training-grim-vida-sugada'), 'recompensa canonica de Grim ausente')
  assert(overlay.includes('data-testid="training-reward-abilities"'), 'recompensas nao aparecem no fim do treino')
  assert(overlay.includes('Atribuir habilidade'), 'Mestre nao recebeu o comando de atribuir habilidade')
  assert(overlay.includes('Contratempo(s) totais'), 'painel ainda mostra Contratempo fragmentado por estacao')
  assert(overlay.includes('Falha: -2 FUSHI'), 'falha de contencao da Prova Final ausente')
  assert(overlay.includes('Desbloquear maestria'), 'Euforia do Fluxo nao conclui a maestria')
  assert(tablePage.includes('handleAssignTrainingRewardAbility'), 'atribuicao da habilidade nao chegou a Mesa')
  assert(tablePage.includes('handleAssignCharacterGrant'), 'atribuicao central do EVE nao chegou a Mesa')
  assert(tablePage.includes('commitCanonicalCharacterUpdate(nextCharacter)'), 'habilidade nao e anexada a ficha canonica')
  assert(tablePage.includes('currentFeatures.some'), 'atribuicao nao e idempotente')
  assert(tablePage.includes('grantId: reward.feature.id'), 'recompensa final nao reutiliza o catalogo central')
  assert(grantCatalog.includes('INITIAL_TRAINING_REWARDS.map'), 'EVE duplicou ou desviou das recompensas canonicas')
  assert(grantCatalog.includes("category: 'habilidade'"), 'recompensas nao entraram na aba Habilidades')

  console.log('[training-arc] PASS')
  console.log(`  estacoes: ${catalog.stations.length}`)
  console.log(`  abordagens: ${approaches.length}`)
  console.log('  DT: 10 em todos os treinamentos')
  console.log('  multiplayer: progresso publico sem DT/notas do Mestre')
  console.log('  recompensa: cinco habilidades canonicas no treino e no EVE, com atribuicao idempotente')
  console.log('  Contratempos: total por protagonista com marcos 1, 2-5 e 6+')
  console.log('  Prova Final: Sensacao do Corpo, Estabilizacao e Euforia do Fluxo')
  console.log('  fluxo: MUN -> Mesa -> painel Mestre/Jogador')
}

main()
