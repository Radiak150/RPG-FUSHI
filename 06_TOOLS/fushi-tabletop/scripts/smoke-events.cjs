const fs = require('node:fs')
const path = require('node:path')
const {
  sanitizeEventStateForPlayer,
} = require('../electron/multiplayer-server.cjs')

const root = path.resolve(__dirname, '..')

function fail(message) {
  throw new Error(`[events] ${message}`)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function main() {
  const now = Date.now()
  const privateState = {
    events: {
      'initial-training': {
        activatedAt: now - 2000,
        isActive: true,
        restoreMapId: 'mapa-privado-do-mestre',
        updatedAt: now,
      },
      'build-rarity-draw': {
        activatedAt: now - 1000,
        isActive: true,
        updatedAt: now,
      },
      'skill-assignment': {
        activatedAt: now - 500,
        isActive: true,
        updatedAt: now,
      },
    },
    rarityDraw: {
      characterId: 'hero-1',
      characterName: 'Heroi 1',
      drawId: 'draw-smoke',
      itemId: 'item-smoke',
      itemName: 'Item Smoke',
      lastRoll: 10,
      phase: 'rolling',
      rarity: 'mitico',
      revealAt: now + 2800,
      startedAt: now,
      presentationExpiresAt: now + 18_000,
    },
    rarityHistory: [
      {
        characterId: 'hero-0',
        characterName: 'Heroi anterior',
        drawId: 'draw-history',
        itemId: 'item-history',
        itemName: 'Item anterior',
        rarity: 'raro',
        roll: 4,
        rolledAt: now - 10_000,
      },
    ],
    updatedAt: now,
    version: 1,
  }
  const publicState = sanitizeEventStateForPlayer(privateState, { isActive: true })
  const publicText = JSON.stringify(publicState)

  assert(publicState.events['initial-training'].isActive, 'treino ativo nao chegou ao jogador')
  assert(publicState.events['build-rarity-draw'].isActive, 'sorteio ativo nao chegou ao jogador')
  assert(publicState.events['skill-assignment'].isActive, 'estado publico da atribuicao nao chegou ao jogador')
  assert(publicState.rarityDraw.rarity === 'mitico', 'raridade publica foi perdida')
  assert(publicState.rarityDraw.drawId === 'draw-smoke', 'id da apresentacao foi perdido')
  assert(
    publicState.rarityDraw.presentationExpiresAt === now + 18_000,
    'expiracao da apresentacao nao chegou ao jogador',
  )
  assert(
    Array.isArray(publicState.rarityHistory) && publicState.rarityHistory.length === 0,
    'backlog do sorteio vazou para o jogador',
  )
  assert(!publicText.includes('lastRoll'), 'resultado numerico privado vazou ao jogador')
  assert(!publicText.includes('restoreMapId'), 'mapa de retorno do Mestre vazou ao jogador')
  assert(!publicText.includes('mapa-privado-do-mestre'), 'valor privado vazou ao jogador')

  const legacyState = sanitizeEventStateForPlayer(null, { isActive: true })
  assert(
    legacyState.events['initial-training'].isActive,
    'migracao de treino legado ativo nao preservou o evento',
  )
  assert(
    !legacyState.events['build-rarity-draw'].isActive,
    'evento visual nasceu ativo sem autorizacao do Mestre',
  )
  assert(
    !legacyState.events['skill-assignment'].isActive,
    'evento de gestao nasceu ativo sem autorizacao do Mestre',
  )

  const events = read('src/lib/tabletopEvents.ts')
  const session = read('src/lib/tabletopSession.ts')
  const page = read('src/pages/TablePage.tsx')
  const manager = read('src/components/tabletop/TabletopEventManager.tsx')
  const presentation = read('src/components/tabletop/TabletopEventPresentation.tsx')
  const server = read('electron/multiplayer-server.cjs')
  const multiplayerProvider = read('src/app/MultiplayerProvider.tsx')
  const multiplayerPage = read('src/pages/MultiplayerPage.tsx')
  const hud = read('src/components/tabletop/TabletopHud.tsx')
  const grantCatalog = read('src/data/grants/characterGrantCatalog.ts')

  assert(events.includes("| 'skill-assignment'"), 'catalogo EVE nao inclui Atribuir Skills')
  assert(events.includes('setTabletopEventActive'), 'ciclo de ativacao/desativacao ausente')
  assert(events.includes('startTabletopRarityDraw'), 'sorteio de raridade ausente')
  assert(session.includes('version: 17'), 'sessao nao foi promovida para a versao atual do EVE')
  assert(session.includes('eventState: TabletopEventSystemState'), 'estado canonico do EVE ausente')
  assert(page.includes("id: 'events'"), 'atalho EVE nao entrou no HUD do Mestre')
  assert(page.includes('<TabletopEventPresentation'), 'superficie publica do evento nao foi montada')
  assert(page.includes('handleDeactivateTabletopEvent'), 'desativacao central nao foi ligada a Mesa')
  assert(manager.includes('data-testid="deactivate-initial-training"'), 'treino nao pode ser desativado no EVE')
  assert(manager.includes('data-testid="deactivate-build-rarity-draw"'), 'sorteio nao pode ser desativado no EVE')
  assert(manager.includes('Backlog do evento'), 'EVE nao exibe o backlog do sorteio ao Mestre')
  assert(manager.includes('Apenas o Mestre ve o d10 bruto'), 'EVE nao declara o d10 como dado privado do Mestre')
  assert(manager.includes('data-testid="clear-rarity-history"'), 'EVE nao oferece limpeza do backlog ao Mestre')
  assert(manager.includes('data-testid="activate-skill-assignment"'), 'Atribuir Skills nao pode ser ativado no EVE')
  assert(manager.includes('data-testid="deactivate-skill-assignment"'), 'Atribuir Skills nao pode ser desativado no EVE')
  assert(manager.includes('data-testid={`skill-grant-tab-${category}`}'), 'gerador das abas de Skills ausente no EVE')
  assert(grantCatalog.includes("habilidade: { label: 'Habilidades'"), 'aba Habilidades ausente no catalogo')
  assert(manager.includes('onAssignCharacterGrant'), 'comando de atribuicao nao chegou ao gerenciador EVE')
  assert(grantCatalog.includes('INITIAL_TRAINING_REWARDS.map'), 'catalogo duplicou as habilidades do treino')
  assert(grantCatalog.includes("ritual: { label: 'Rituais', statusLabel: 'EM CONSTRUCAO' }"), 'Rituais nao estao marcados como construcao')
  assert(grantCatalog.includes("outro: { label: 'Outros', statusLabel: 'EM CONSTRUCAO' }"), 'Outros nao estao marcados como construcao')
  assert(events.includes('rarityHistory'), 'estado canonico nao guarda historico do sorteio')
  assert(events.includes('clearTabletopRarityHistory'), 'limpeza do backlog nao existe no estado canonico')
  assert(events.includes('presentationExpiresAt'), 'sorteio nao tem expiracao da apresentacao')
  assert(presentation.includes('data-testid="build-rarity-presentation"'), 'apresentacao sincronizada ausente')
  assert(presentation.includes('Clique em qualquer lugar para continuar'), 'apresentacao revelada nao pode ser descartada')
  assert(presentation.includes('sessionStorage.setItem'), 'descarte local do sorteio nao persiste na janela')
  assert(presentation.includes('clock < (draw.presentationExpiresAt ?? 0)'), 'apresentacao antiga pode ressuscitar na Mesa')
  assert(server.includes('sanitizeEventStateForPlayer'), 'sanitizador multiplayer do EVE ausente')
  assert(server.includes('eventState: sanitizeEventStateForPlayer'), 'estado publico do EVE nao entra na sessao')
  assert(server.includes("auth:resume-accepted"), 'servidor nao preserva aceite na mesma instancia')
  assert(server.includes('admissionGrants'), 'aceite continua preso apenas ao socket descartavel')
  assert(server.includes('findAcceptedClient(playerId, clientInstanceId)'), 'HTTP nao valida a instancia aceita')
  assert(multiplayerProvider.includes('remoteAdmissionAcceptedRef'), 'fila remota nao espera readmissao real')
  assert(multiplayerProvider.includes('buildPlayerCharacterPatch'), 'ficha remota ainda envia sobrescrita integral')
  assert(multiplayerPage.includes('data-testid="active-player-session"'), 'jogador aceito nao recebeu retorno direto a Mesa')
  assert(!page.includes('window.location.reload()'), 'sair da Mesa ainda mata a sessao multiplayer com reload')
  assert(hud.includes('hud-bui-builds.svg') && hud.includes('hud-eve-events.svg'), 'BUI/EVE continuam sem icones no HUD')
  assert(page.includes('handleAssignCharacterGrant'), 'atribuicao generica nao chegou a Mesa')
  assert(page.includes('commitCanonicalCharacterUpdate(nextCharacter)'), 'atribuicao nao usa a ficha canonica')

  console.log('[events] PASS')
  console.log('  catalogo: Treino Inicial + Sorteio Raridade Build + Atribuir Skills')
  console.log('  ciclo: eventos simultaneos, ativacao e desativacao independentes')
  console.log('  privacidade: lastRoll, backlog e restoreMapId removidos do payload do jogador')
  console.log('  ciclo de vida: apresentacao expira; historico fica somente no EVE do Mestre')
  console.log('  efeito: sorteio visual separado do vinculo canonico no BUI')
  console.log('  retorno: socket novo da mesma instancia preserva aceite; app novo volta a pending')
  console.log('  ficha: patch Jogador > Mestre protege skills/builds concedidas pelo Mestre')
  console.log('  skills: Habilidades prontas; Rituais e Outros em construcao')
}

main()
