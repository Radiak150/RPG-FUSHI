import fs from 'node:fs'
import path from 'node:path'

const filePath = path.join(process.cwd(), 'docs', 'planejamento', 'campanha-controle.json')
const control = JSON.parse(fs.readFileSync(filePath, 'utf8'))

function findBy(list, predicate, label) {
  const item = list.find(predicate)

  if (!item) {
    throw new Error(`Entrada ausente: ${label}`)
  }

  return item
}

const combatRule =
  'Combat V2 e a fonte ativa para CA, Bloqueio, Esquiva, critico, manobras, escala de mobs e simulacao; FUSHI_COMBAT_V2.md prevalece sobre regra V1 conflitante.'

if (!control.rules.includes(combatRule)) {
  control.rules.push(combatRule)
}

const books = findBy(
  control.appChecklist,
  (entry) => entry.area === 'Livros' && entry.item === 'Livro do Jogador e Livro do Mestre',
  'appChecklist/Livros',
)
books.evidence =
  'Combat V2: 15 capitulos publicos, 18 capitulos do Mestre, PDF Jogador 23 paginas, PDF Mestre 363 paginas; auditoria visual, sigilo e bordas aprovada.'
books.next =
  'Atualizar src/data/rulebook a cada decisao aprovada; rodar books:build, books:audit e smoke:rulebooks:release.'

const existingCombat = control.appChecklist.find(
  (entry) => entry.area === 'Combate' && entry.item === 'Combat V2 - defesa, critico e turnos',
)
const combatChecklist = existingCombat ?? {
  area: 'Combate',
  item: 'Combat V2 - defesa, critico e turnos',
}
combatChecklist.status = 'FOCO'
combatChecklist.acceptance =
  'CA e passiva; Bloqueio usa Fortitude (0/5/10/15); Esquiva fixa usa CA atual + AGI + Reflexos como Reacao; critico dobra apenas dados; turnos mostram Principal, Curta, Movimento, Reacao e manobras.'
combatChecklist.evidence =
  'Alpha.88: 56 fichas Combat V2; fluxo visual ficha -> Dados de Combate -> dado -> Resolver -> confirmacao; recibo privado, impacto, marca e queda protegidos por smokes runtime, UI e multiplayer.'
combatChecklist.next =
  'Playtest fisico curto Mestre/Jogador para confirmar leitura e ritmo; manter Veyra e demais lacunas de conteudo como alerta ate revisao canonica do Mestre.'
if (!existingCombat) control.appChecklist.push(combatChecklist)

const mobs = findBy(
  control.contentChecklist,
  (entry) => entry.area === 'Mobs' && entry.item === 'Mobs canonicos aprovados',
  'contentChecklist/Mobs',
)
mobs.next =
  'Lobo Cinzento (8 Vida) e Lobo Marcado por FUSHI (14 Vida) ja usam Combat V2; testar a Clareira com grupo real antes de criar outro mob.'

const playerBookBoard = findBy(
  control.alpha84NearSessionBoard,
  (entry) => entry.id === 'livro_jogador_combate',
  'alpha84NearSessionBoard/livro_jogador_combate',
)
playerBookBoard.status = 'OK'
playerBookBoard.whatGoodLooksLike =
  'Livro publica turno, ataque, dano, Critico V2, Bloqueio por Fortitude, Esquiva fixa, Contra-ataque, manobras e exemplos de build sem revelar lore secreta.'
playerBookBoard.nextQuestion =
  'No proximo combate, qual regra ainda exigiu explicacao oral apesar do Livro e da Mesa?'
playerBookBoard.suggestedFirstMove =
  'Registrar somente duvidas reais de sessao e atualizar uma regra estruturada por vez.'

const balanceBoard = findBy(
  control.alpha84NearSessionBoard,
  (entry) => entry.id === 'combate_balanceamento',
  'alpha84NearSessionBoard/combate_balanceamento',
)
balanceBoard.status = 'FOCO'
balanceBoard.whyNow =
  'Combat V2 eliminou Bloqueio por metade da CA e Esquiva com dados; agora a prioridade e medir encontros reais e preencher ataques/fases que ainda faltam.'
balanceBoard.whatGoodLooksLike =
  'Mesa resolve ataque, Reacao, dano e manobra sem interpretacao solta; Laboratorio mede taxa de vitoria, rodadas, dano, bloqueio, esquiva e critico.'
balanceBoard.nextQuestion =
  'Qual encontro real sera o primeiro playtest: Clareira dos Lobos, treino da Vila ou uma cena de NPC avancado?'
balanceBoard.suggestedFirstMove =
  'Usar o template com tokens ou a cena ativa, rodar 500 simulacoes e depois fazer uma luta curta Mestre/Jogador.'

if (!control.mechanicProtocol.some((entry) => entry.kind === 'Item de build')) {
  control.mechanicProtocol.push({
    kind: 'Item de build',
    sheetArea: 'Inventario / integracao',
    required: 'raridade, ganho, perda, limite, risco, origem MUN, log e estado permanente',
    visualNeed: 'preview claro de tradeoff; VFX/audio apenas se a regra pedir',
    releaseGate: 'Simuladores offline + smoke:multiplayer + release empacotado',
  })
}

const combatRuntimeProtocol = control.mechanicProtocol.find(
  (entry) => entry.kind === 'Acao de combate transacional',
)
const combatRuntimeEntry = combatRuntimeProtocol ?? {
  kind: 'Acao de combate transacional',
  sheetArea: 'Combate / Habilidades / Rituais',
}
combatRuntimeEntry.required =
  'automation.combat com acao, teste, dano, alcance, resolucao, falha e reacao quando aplicaveis'
combatRuntimeEntry.visualNeed =
  'ficha prepara; Dados de Combate escolhe alvo; Resolver abre depois do dado; impacto e recibo sanitizados'
combatRuntimeEntry.releaseGate =
  'smoke:combat-runtime + smoke:combat-flow:ui + smoke:multiplayer + smoke:release'
if (!combatRuntimeProtocol) control.mechanicProtocol.push(combatRuntimeEntry)

control.updatedAt = '2026-07-25'
fs.writeFileSync(filePath, `${JSON.stringify(control, null, 2)}\n`)

console.log(JSON.stringify({ filePath, status: 'Combat V2 readiness updated' }, null, 2))
