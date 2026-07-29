export type TabletopStatusKind = 'buff' | 'condition' | 'debuff'

export type TabletopStatusIcon =
  | 'aggro'
  | 'aura'
  | 'bleeding'
  | 'broken'
  | 'burning'
  | 'confused'
  | 'controlled'
  | 'custom'
  | 'exhausted'
  | 'fear'
  | 'frozen'
  | 'healing'
  | 'paralyzed'
  | 'poisoned'
  | 'protection'
  | 'science'
  | 'slow'
  | 'special'
  | 'speed'
  | 'stunned'
  | 'tired'
  | 'unconscious'
  | 'vaccine'
  | 'vulnerable'
  | 'weakened'

export type TabletopStatusId =
  | 'agro'
  | 'amedrontado'
  | 'aura'
  | 'cansado'
  | 'confuso'
  | 'congelado'
  | 'cura'
  | 'descontrolado'
  | 'desmaiado'
  | 'desnorteado'
  | 'enfraquecido'
  | 'envenenado'
  | 'especial-buff'
  | 'especial-debuff'
  | 'exausto'
  | 'lento'
  | 'paralisado'
  | 'protecao'
  | 'quebrado'
  | 'queimando'
  | 'rapidez'
  | 'sangrando'
  | 'vacina'
  | 'vulneravel'

export interface TabletopStatusDefinition {
  aliases: string[]
  cause: string
  color: string
  defaultDurationRounds?: number
  effect: string
  icon: TabletopStatusIcon
  id: TabletopStatusId
  kind: TabletopStatusKind
  label: string
  recovery: string
  rules: {
    armorClassBonus?: number
    continuousDamage?: string
    damageDicePenalty?: number
    dicePenalty?: number
    doublesIncomingDamage?: boolean
    fushiPerTurn?: number
    healingPerTurn?: string
    immuneToStatuses?: boolean
    maxStacks?: number
    movementMultiplier?: number
    physicalDicePenalty?: number
    preventsApproach?: boolean
    preventsDash?: boolean
    preventsMovement?: boolean
    preventsPrimaryAction?: boolean
    preventsTurn?: boolean
  }
  summary: string
}

export const TABLETOP_STATUS_CATALOG: TabletopStatusDefinition[] = [
  {
    aliases: ['sangramento', 'sangrando leve'],
    cause: 'Ferimento grave, corte profundo ou regra que abra sangramento.',
    color: '#7f1d2d',
    effect: 'Perde 1 Vida no inicio de cada turno. O dano nao aumenta sozinho.',
    icon: 'bleeding',
    id: 'sangrando',
    kind: 'debuff',
    label: 'Sangrando',
    recovery: 'Medicina leve, estancar o sangramento ou efeito que feche a ferida.',
    rules: { continuousDamage: '1' },
    summary: 'Dano continuo de ferimento aberto.',
  },
  {
    aliases: ['cansaco'],
    cause: 'Fome, falta de sono ou tarefa fisica prolongada.',
    color: '#163b66',
    effect: 'Recebe -1 dado em todas as jogadas.',
    icon: 'tired',
    id: 'cansado',
    kind: 'debuff',
    label: 'Cansado',
    recovery: 'Descanso ou cuidados medicos apropriados.',
    rules: { dicePenalty: 1 },
    summary: 'O corpo responde pior a qualquer teste.',
  },
  {
    aliases: ['fraturado', 'osso quebrado'],
    cause: 'Fratura, esmagamento ou pressao extrema sobre o corpo.',
    color: '#c8ced4',
    effect:
      'No inicio do turno, VIG + Fortitude DT 15. Sucesso: -1 dado em acoes fisicas e metade do Deslocamento. Falha: perde a Acao Principal e o Movimento.',
    icon: 'broken',
    id: 'quebrado',
    kind: 'debuff',
    label: 'Quebrado',
    recovery: 'Cuidados medicos maximos, imobilizacao e descanso longo seguro.',
    rules: {
      movementMultiplier: 0.5,
      physicalDicePenalty: 1,
      preventsMovement: false,
      preventsPrimaryAction: false,
    },
    summary: 'Fratura grave exige Fortitude para continuar agindo.',
  },
  {
    aliases: ['sem fushi', 'fushi zero'],
    cause: 'Chegar a 0 de FUSHI.',
    color: '#83c5e6',
    effect: 'Nao pode agir nem se mover; ainda pode perceber, pensar e falar brevemente.',
    icon: 'exhausted',
    id: 'exausto',
    kind: 'condition',
    label: 'Exausto',
    recovery: 'Recuperar ao menos 1 FUSHI, normalmente com descanso curto.',
    rules: { preventsMovement: true, preventsPrimaryAction: true },
    summary: 'A energia FUSHI acabou e o corpo deixa de responder.',
  },
  {
    aliases: ['inconsciente', 'caido a zero'],
    cause: 'Chegar a 0 de Vida ou sofrer um efeito que apague a consciencia.',
    color: '#535862',
    effect:
      'Nao fala, move, reage ou mantem concentracao. Tres falhas causam morte; tres sucessos recuperam 1 Vida, mas o personagem continua desmaiado.',
    icon: 'unconscious',
    id: 'desmaiado',
    kind: 'condition',
    label: 'Desmaiado',
    recovery: 'Chegar a 2 de Vida e receber cuidados maiores ou descanso longo.',
    rules: { preventsMovement: true, preventsPrimaryAction: true, preventsTurn: true },
    summary: 'O personagem perde o controle do corpo e entra em teste contra a morte.',
  },
  {
    aliases: ['sem determinacao', 'determinacao zero'],
    cause: 'Chegar a 0 de Determinacao.',
    color: '#e87aa8',
    effect: 'O Mestre assume o personagem e conduz suas acoes enquanto durar o estado.',
    icon: 'controlled',
    id: 'descontrolado',
    kind: 'condition',
    label: 'Descontrolado',
    recovery:
      'Recuperar Determinacao por cuidados de sanidade e contato com algo que acalme o personagem.',
    rules: {},
    summary: 'A vontade cede e o personagem perde o controle de si.',
  },
  {
    aliases: ['atordoado', 'stun'],
    cause: 'Concussao, impacto sensorial ou efeito que atrase a consciencia.',
    color: '#d8c8a7',
    defaultDurationRounds: 1,
    effect: 'Perde o proximo turno. Novas perdas exigem reaplicar o estado.',
    icon: 'stunned',
    id: 'desnorteado',
    kind: 'debuff',
    label: 'Desnorteado',
    recovery: 'Encerra depois do turno perdido ou por efeito que remova atordoamento.',
    rules: { preventsTurn: true },
    summary: 'O personagem perde uma rodada por desorientacao.',
  },
  {
    aliases: ['fraco'],
    cause: 'Fraqueza fisica, ferimento debilitante ou efeito de habilidade.',
    color: '#d26a1b',
    effect: 'Remove 1 dado da rolagem de dano.',
    icon: 'weakened',
    id: 'enfraquecido',
    kind: 'debuff',
    label: 'Enfraquecido',
    recovery: 'Cuidados medicos leves ou fim indicado pela fonte.',
    rules: { damageDicePenalty: 1 },
    summary: 'Ataques perdem um dado de dano.',
  },
  {
    aliases: ['vulnerabilidade'],
    cause: 'Guarda aberta, ponto fraco exposto ou efeito que amplifique dano recebido.',
    color: '#f5dc73',
    effect: 'Dobra o dano final recebido depois dos demais bonus e reducoes.',
    icon: 'vulnerable',
    id: 'vulneravel',
    kind: 'debuff',
    label: 'Vulneravel',
    recovery: 'Fim da duracao da fonte, protecao adequada ou efeito que remova a abertura.',
    rules: { doublesIncomingDamage: true },
    summary: 'Todo dano final recebido e dobrado.',
  },
  {
    aliases: ['lentidao'],
    cause: 'Terreno, frio, peso ou efeito que limite o corpo.',
    color: '#b89de8',
    effect: 'Metade do Deslocamento, arredondada para baixo, e nao pode usar Disparada.',
    icon: 'slow',
    id: 'lento',
    kind: 'debuff',
    label: 'Lento',
    recovery: 'Sair da causa ou encerrar a duracao indicada pela fonte.',
    rules: { movementMultiplier: 0.5, preventsDash: true },
    summary: 'Movimento reduzido e sem Disparada.',
  },
  {
    aliases: ['assustado', 'medo'],
    cause: 'Presenca, trauma ou efeito que imponha medo.',
    color: '#50308a',
    effect:
      'Nao pode atacar nem se aproximar voluntariamente da fonte. PRE + Vontade DT 15 ao fim do turno para encerrar, salvo DT propria da fonte.',
    icon: 'fear',
    id: 'amedrontado',
    kind: 'debuff',
    label: 'Amedrontado',
    recovery: 'Passar no teste contra a fonte, afastar a fonte ou receber efeito que remova medo.',
    rules: { preventsApproach: true },
    summary: 'A fonte do medo limita ataque e aproximacao.',
  },
  {
    aliases: ['paralizado', 'paralisia'],
    cause: 'Veneno, gelo completo, choque ou poder de imobilizacao.',
    color: '#ffd400',
    effect: 'Perde a Acao Principal e o Movimento.',
    icon: 'paralyzed',
    id: 'paralisado',
    kind: 'debuff',
    label: 'Paralisado',
    recovery: 'Fim da duracao ou tratamento indicado pela fonte.',
    rules: { preventsMovement: true, preventsPrimaryAction: true },
    summary: 'O corpo nao executa a acao principal nem o movimento.',
  },
  {
    aliases: ['veneno', 'intoxicado'],
    cause: 'Veneno, toxina ou efeito contaminante.',
    color: '#a425d4',
    effect: 'Sofre 1d4 de dano no inicio de cada turno.',
    icon: 'poisoned',
    id: 'envenenado',
    kind: 'debuff',
    label: 'Envenenado',
    recovery: 'Tratamento, vacina, antidoto ou regra especifica da toxina.',
    rules: { continuousDamage: '1d4' },
    summary: 'Toxina causa dano continuo ate ser tratada.',
  },
  {
    aliases: ['queimado', 'em chamas'],
    cause: 'Fogo, calor extremo ou acumulacao de aquecimento.',
    color: '#f49a53',
    effect:
      'Sofre 1d4 de dano no inicio do turno. Com 3 Acumulos, o dano passa a 2d4 enquanto o aquecimento completo durar.',
    icon: 'burning',
    id: 'queimando',
    kind: 'debuff',
    label: 'Queimando',
    recovery: 'Apagar as chamas e resfriar o corpo.',
    rules: { continuousDamage: '1d4', maxStacks: 3 },
    summary: 'Calor causa dano continuo e pode intensificar com Acumulos.',
  },
  {
    aliases: ['congelamento', 'congelando'],
    cause: 'Frio extremo, gelo ou acumulacao de congelamento.',
    color: '#8ee8ff',
    effect:
      'Sofre 1d4 de dano no inicio do turno. Ao chegar a 3 Acumulos, tambem fica Paralisado ate perder ao menos 1 Acumulo.',
    icon: 'frozen',
    id: 'congelado',
    kind: 'debuff',
    label: 'Congelado',
    recovery: 'Aquecer o corpo e remover os Acumulos de frio.',
    rules: { continuousDamage: '1d4', maxStacks: 3 },
    summary: 'Frio causa dano continuo e pode paralisar.',
  },
  {
    aliases: ['desorientado'],
    cause: 'Efeito que altere sentidos, direcao ou leitura do ambiente.',
    color: '#245b3b',
    effect:
      'Ao mover, role 1d4: 1 frente, 2 tras, 3 direita, 4 esquerda. Para executar outra intencao, cara realiza e coroa falha.',
    icon: 'confused',
    id: 'confuso',
    kind: 'debuff',
    label: 'Confuso',
    recovery: 'Fim da duracao da fonte ou efeito que restaure os sentidos.',
    rules: {},
    summary: 'Direcao e intencao deixam de ser confiaveis.',
  },
  {
    aliases: ['efeito especial', 'marca fushi'],
    cause: 'Poder especial de FUSHI.',
    color: '#f3f5f7',
    effect: 'Pode combinar mais de um debuff conforme a habilidade que o criou.',
    icon: 'special',
    id: 'especial-debuff',
    kind: 'debuff',
    label: 'Especial',
    recovery: 'Definida explicitamente pela habilidade ou pelo Mestre.',
    rules: {},
    summary: 'Estado composto criado por uma regra especifica de FUSHI.',
  },
  {
    aliases: ['provocar', 'provocacao'],
    cause: 'Acao Completa de provocacao contra alvos visiveis.',
    color: '#ef7373',
    defaultDurationRounds: 1,
    effect:
      'PRE + Intimidacao contra a CA atual de cada alvo. Sucesso: o proximo ataque legal prioriza o usuario e ele perde metade da Determinacao atual do alvo, arredondada para cima. Falha: nao aplica Agro e perde a Determinacao atual inteira do alvo.',
    icon: 'aggro',
    id: 'agro',
    kind: 'debuff',
    label: 'Agro',
    recovery: 'Encerra depois do proximo ataque legal do alvo ou quando a fonte deixa de ser alvo valido.',
    rules: {},
    summary: 'O proximo ataque legal do alvo deve priorizar a fonte.',
  },
  {
    aliases: ['campo fushi'],
    cause: 'Habilidade, campo ou local com fluxo natural elevado de FUSHI.',
    color: '#42d8dc',
    defaultDurationRounds: 3,
    effect: 'Recupera 1 FUSHI no inicio de cada turno, salvo valor proprio da fonte.',
    icon: 'aura',
    id: 'aura',
    kind: 'buff',
    label: 'Aura',
    recovery: 'Encerra ao sair do campo ou ao acabar a duracao.',
    rules: { fushiPerTurn: 1 },
    summary: 'Fluxo gradual de FUSHI por alguns turnos.',
  },
  {
    aliases: ['protegido', 'barreira'],
    cause: 'Feitico, campo, item ou intencao defensiva.',
    color: '#59616d',
    defaultDurationRounds: 2,
    effect: 'Recebe +2 CA, salvo valor proprio da fonte.',
    icon: 'protection',
    id: 'protecao',
    kind: 'buff',
    label: 'Protecao',
    recovery: 'Encerra com a duracao, quebra da fonte ou dissipacao.',
    rules: { armorClassBonus: 2 },
    summary: 'Aumenta temporariamente a CA.',
  },
  {
    aliases: ['acelerado', 'velocidade'],
    cause: 'Habilidade, item ou campo que acelere o corpo.',
    color: '#d5d9df',
    defaultDurationRounds: 1,
    effect: 'Dobra o Deslocamento padrao.',
    icon: 'speed',
    id: 'rapidez',
    kind: 'buff',
    label: 'Rapidez',
    recovery: 'Encerra no fim da duracao indicada pela fonte.',
    rules: { movementMultiplier: 2 },
    summary: 'Movimento padrao dobrado.',
  },
  {
    aliases: ['imunidade', 'imune'],
    cause: 'Vacina, antidoto avancado ou efeito protetor equivalente.',
    color: '#84db9b',
    effect:
      'Anula os demais buffs e debuffs enquanto durar e impede receber novos estados.',
    icon: 'vaccine',
    id: 'vacina',
    kind: 'buff',
    label: 'Vacina',
    recovery: 'Encerra no fim da duracao definida pela fonte.',
    rules: { immuneToStatuses: true },
    summary: 'Imunidade temporaria a qualquer outro estado.',
  },
  {
    aliases: ['regeneracao', 'cura continua'],
    cause: 'Habilidade, item ou efeito sustentado de cura.',
    color: '#47c66b',
    defaultDurationRounds: 3,
    effect: 'Recupera 1d4 Vida no inicio de cada turno, salvo valor proprio da fonte.',
    icon: 'healing',
    id: 'cura',
    kind: 'buff',
    label: 'Cura',
    recovery: 'Encerra com a duracao, quebra da fonte ou Vida maxima.',
    rules: { healingPerTurn: '1d4' },
    summary: 'Recuperacao continua de Vida sustentada pela fonte.',
  },
  {
    aliases: ['efeito especial', 'bencao fushi'],
    cause: 'Poder especial de FUSHI.',
    color: '#f3f5f7',
    effect: 'Pode combinar mais de um buff conforme a habilidade que o criou.',
    icon: 'special',
    id: 'especial-buff',
    kind: 'buff',
    label: 'Especial',
    recovery: 'Definida explicitamente pela habilidade ou pelo Mestre.',
    rules: {},
    summary: 'Estado composto criado por uma regra especifica de FUSHI.',
  },
]

const STATUS_BY_ID = new Map(
  TABLETOP_STATUS_CATALOG.map((status) => [status.id, status]),
)

const STATUS_BY_NAME = new Map(
  TABLETOP_STATUS_CATALOG.flatMap((status) =>
    [status.label, status.id, ...status.aliases].map((value) => [
      normalizeStatusLookup(value),
      status,
    ]),
  ),
)

function normalizeStatusLookup(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function getTabletopStatusDefinition(
  statusId?: string | null,
): TabletopStatusDefinition | null {
  if (!statusId) {
    return null
  }

  return STATUS_BY_ID.get(statusId as TabletopStatusId) ?? null
}

export function findTabletopStatusDefinition(
  value?: string | null,
): TabletopStatusDefinition | null {
  if (!value) {
    return null
  }

  return (
    getTabletopStatusDefinition(value) ??
    STATUS_BY_NAME.get(normalizeStatusLookup(value)) ??
    null
  )
}
