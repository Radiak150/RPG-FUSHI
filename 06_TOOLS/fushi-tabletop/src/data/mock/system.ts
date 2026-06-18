import type { SystemData } from '../types'

export const systemData: SystemData = {
  rules: [
    {
      id: 'rule-identity',
      title: 'Fragmentos e identidade',
      summary:
        'Cada jogador controla um fragmento de um unico organismo coletivo, sem original ou nucleo superior.',
      bullets: [
        'Os fragmentos podem pensar, decidir e discordar entre si.',
        'Todos compartilham um subconsciente ligado a evolucao do organismo.',
        'Cada fragmento desenvolve identidade propria com base na experiencia.',
      ],
    },
    {
      id: 'rule-death',
      title: 'Morte e continuidade',
      summary:
        'Quando um corpo morre, ele nao pode ser reutilizado, mas as consciencias continuam existindo.',
      bullets: [
        'O renascimento acontece imediatamente e na mesma cena.',
        'A consciencia nunca fica sem corpo.',
        'O protagonista entende que morreu, mas nao tem certeza do retorno.',
      ],
    },
    {
      id: 'rule-possession',
      title: 'Posse e limitacoes',
      summary:
        'O corpo determina atributos, limita habilidades e influencia o que pode ser executado na pratica.',
      bullets: [
        'O novo corpo e influenciado por FUSHI, capacidade fisica e capacidade intelectual.',
        'O processo de posse pode gerar sucesso total, disputa ou rejeicao.',
        'Conhecimento preservado nao garante execucao sem um corpo adequado.',
      ],
    },
    {
      id: 'rule-fushi',
      title: 'Uso de FUSHI',
      summary:
        'FUSHI existe em tudo e seu uso depende de identidade, abertura dos esporos e desgaste do corpo.',
      bullets: [
        'O uso pode ser instintivo, treinado, emocional ou consciente.',
        'FUSHI nao cria do zero; ele transforma o que ja existe.',
        'Toda acao com FUSHI tem custo e consequencia.',
      ],
    },
  ],
  powerScale: [
    {
      id: 'tier-0',
      tier: 'Tier 0',
      title: 'Corpo recem-nascido / fraco',
      summary:
        'Inicio da campanha. Sem dominio consciente do corpo, de FUSHI ou do proprio limite.',
      examples: [
        'Protagonistas ao despertar na Caverna do Despertar',
        'Criaturas tutorial levemente abaixo ou iguais ao grupo',
      ],
    },
    {
      id: 'tier-1',
      tier: 'Tier 1',
      title: 'Humano comum treinado',
      summary:
        'Base de gente preparada, mas ainda fora do uso tecnico consistente de FUSHI.',
      examples: ['Guardas locais', 'Sobreviventes experientes'],
    },
    {
      id: 'tier-2',
      tier: 'Tier 2',
      title: 'Usuario iniciante de FUSHI',
      summary: 'Primeiro uso consciente de energia e tecnicas simples.',
      examples: ['Despertos recentes', 'Cultistas menores'],
    },
    {
      id: 'tier-3',
      tier: 'Tier 3',
      title: 'Usuario competente',
      summary: 'Ja combina corpo, tecnica e leitura tatica com consistencia.',
      examples: ['Combatentes experientes', 'Adeptos consolidados'],
    },
    {
      id: 'tier-4',
      tier: 'Tier 4',
      title: 'Usuario forte',
      summary: 'Ameaca real para grupos comuns e referencia local de poder.',
      examples: ['Veteranos de elite', 'Predadores especiais'],
    },
    {
      id: 'tier-5',
      tier: 'Tier 5',
      title: 'Elite / chefe importante',
      summary: 'Alvo de sessao inteira, com pressao mecanica e narrativa relevante.',
      examples: ['Chefes regionais', 'Autoridades anormais'],
    },
    {
      id: 'tier-6+',
      tier: 'Tier 6+',
      title: 'Boss / evento especial',
      summary:
        'Escala acima do comum, normalmente exigindo condicao especial, evento ou fase propria.',
      examples: ['Boss de arco', 'Evento de catastrofe'],
    },
  ],
  difficultyScale: [
    {
      id: 'difficulty-facil',
      label: 'Facil',
      summary: 'Inimigo abaixo do tier do grupo. Bom para apresentar regra ou recurso.',
    },
    {
      id: 'difficulty-medio',
      label: 'Medio',
      summary: 'Inimigo igual ao tier do grupo. Pressiona sem travar a sessao.',
    },
    {
      id: 'difficulty-dificil',
      label: 'Dificil',
      summary: 'Inimigo 1 tier acima. Cobra posicionamento e reacao corretos.',
    },
    {
      id: 'difficulty-boss',
      label: 'Boss',
      summary:
        'Inimigo 2+ tiers acima ou com mecanica especial. Exige condicao, plano ou evento.',
    },
  ],
  universalSheetNotes: [
    'Players e NPCs usam a mesma ficha base. O que muda e permissao, controle e contexto narrativo.',
    'Atributos: Forca, Agilidade, Intelecto, Presenca e Vigor.',
    'Recursos: Vida, FUSHI e Determinacao.',
    'Ataques usam atributo + pericia; o atributo define quantos d20 sao rolados e a regra padrao pega o maior.',
    'Defesa e valor fixo. Dano depende da arma, criatura ou habilidade.',
    'Na sessao 01 o FUSHI ainda nao entra como acao consciente; movimento, testes, ataque, dano e controle compartilhado sao o foco.',
    'Vida e FUSHI podem existir como pools do corpo compartilhado, enquanto Determinacao segue individual por consciencia.',
  ],
  combatGuidelines: [
    {
      id: 'combat-testes',
      title: 'Testes e ataque base',
      summary:
        'O atributo define a quantidade de d20; a pericia adiciona bonus fixo ao resultado final.',
      bullets: [
        'Ataque padrao usa atributo relevante + bonus da pericia.',
        'Sem FUSHI consciente no inicio: combate tutorial resolve com corpo, instinto e risco.',
        'Esquiva usa CA base + Agilidade + Reflexos; bloqueio reduz metade da CA base do dano.',
        'Contra-ataque usa CA base: se o ataque inimigo nao alcancar essa CA, o defensor contra-ataca.',
        'Cada consciencia escolhe apenas uma reacao no turno: Bloqueio, Esquiva ou Contra-ataque.',
      ],
    },
    {
      id: 'combat-multiataque',
      title: 'Coreografia de luta',
      summary:
        'O jogador troca chance de acerto por dano: cada dado de acerto sacrificado adiciona 1 dado de dano.',
      bullets: [
        'Forca 3 sem coreografia: 3d20 maior e dano base.',
        'Sacrificar 1 dado: 2d20 maior e +1 dado de dano.',
        'Sacrificar todos os dados ou mais: 2d20 menor e continua somando dados de dano.',
      ],
    },
    {
      id: 'combat-recursos',
      title: 'Determinacao e instinto',
      summary:
        'Antes do dominio tecnico, explosoes instintivas drenam Determinacao e podem tirar o controle da consciencia.',
      bullets: [
        'Determinacao zero significa perda de controle e possibilidade de controle pelo mestre.',
        'Instinto Selvagem entra como habilidade inicial instintiva e perigosa.',
        'Determinacao tambem pode ser custo de habilidade; rerrolagem so existe quando item/habilidade/cena permitir.',
        'FUSHI compartilhado fica reservado para desbloqueio posterior e para dano imbuido aprovado pelo mestre.',
      ],
    },
  ],
  tutorialEncounters: [
    {
      id: 'tutorial-lobo-planicie',
      name: 'Lobo da Planicie',
      tier: 0,
      role: 'Inimigo tutorial medio/facil',
      threat: 'Baixa',
      summary:
        'Criatura de pressao inicial usada para ensinar movimentacao, ataque, defesa e dano.',
      attributes: {
        forca: 1,
        agilidade: 2,
        intelecto: 0,
        presenca: 1,
        vigor: 1,
      },
      resources: {
        vida: 'Baixa',
        fushi: '0 ou passivo',
        determinacao: 'Baixa',
        defesa: 'Baixa/media',
      },
      attacks: ['Mordida simples', 'Investida curta'],
      scaling: [
        '1 lobo: tutorial isolado para leitura base.',
        '2 lobos: tutorial medio padrao.',
        '3 lobos: usar apenas se o grupo estiver indo bem.',
      ],
    },
  ],
  futurePermissionNotes: [
    'Todo personagem e uma ficha universal. A distincao entre player e NPC fica nas permissoes e nao na estrutura.',
    'Um NPC pode ser entregue a um player sem migracao de tipo de ficha.',
    'O mestre pode atribuir, revogar ou compartilhar controle de token/personagem futuramente.',
    'O modelo TokenControl ja fica preparado com controlledByPlayerIds, primaryControllerId e sharedControl.',
    'Essa base suporta possessao, vinculo, troca de corpo e personagens temporarios sem bloquear multiplayer futuro.',
  ],
  itemLibrary: [
    {
      id: 'item-pedra-afiada',
      name: 'Pedra Afiada',
      summary: 'Placeholder simples para item bruto, arma improvisada ou componente local.',
      category: 'Improviso',
      futureHooks: ['colocar no mapa', 'pegar manualmente', 'mover para inventario'],
    },
    {
      id: 'item-galho-resistente',
      name: 'Galho Resistente',
      summary: 'Placeholder simples para ferramenta, alavanca curta ou bastao improvisado.',
      category: 'Sobrevivencia',
      futureHooks: ['colocar no mapa', 'pegar manualmente', 'mover para inventario'],
    },
    {
      id: 'item-fruta-estranha',
      name: 'Fruta Estranha',
      summary: 'Placeholder de consumivel ou gatilho narrativo sem logica automatica.',
      category: 'Consumivel',
      futureHooks: ['colocar no mapa', 'pegar manualmente', 'mover para inventario'],
    },
    {
      id: 'item-fragmento-desconhecido',
      name: 'Fragmento Desconhecido',
      summary: 'Placeholder de material anomalo para pistas, crafting futuro ou leitura de FUSHI.',
      category: 'Anomalo',
      futureHooks: ['colocar no mapa', 'pegar manualmente', 'mover para inventario'],
    },
    {
      id: 'item-bandagem-emergencia',
      name: 'Bandagem de Emergencia',
      summary: '1 uso. Acao em cena: cura 1 HP do corpo ou levanta um corpo em 0 HP para 1 HP. Nao acumula.',
      category: 'Cura',
      futureHooks: ['wave 1 lobos planicie', 'tutorial', 'anti-morte'],
    },
    {
      id: 'item-faca-simples-1d6',
      name: 'Faca Simples 1d6',
      summary: 'Arma leve corpo a corpo, dano 1d6 corte. Sem bonus de acerto e sem propriedade especial.',
      category: 'Arma',
      futureHooks: ['wave 5 lobos planicie', 'build assassino', 'inventario'],
    },
    {
      id: 'item-dente-primeiro-lobo',
      name: 'Dente do Primeiro Lobo',
      summary: 'Item marco. Pode marcar Item marco no XP de 1 jogador e vira componente de build furtiva/ritual animal.',
      category: 'Item marco',
      futureHooks: ['wave 5 lobos planicie', 'xp item marco', 'build furtiva'],
    },
    {
      id: 'item-nucleo-instavel-lobo',
      name: 'Nucleo Instavel de Lobo',
      summary: 'Recompensa da wave 10. Escolha: +1 FUSHI maximo para 1 personagem apos descanso/reflexao, ou Foco FUSHI basico de 1 uso para rerrolar 1 teste de FUSHI/instinto aprovado.',
      category: 'FUSHI',
      futureHooks: ['wave 10 lobos planicie', 'fushi maximo', 'foco fushi'],
    },
  ],
  states: [
    {
      id: 'state-pure',
      name: 'FUSHI puro',
      summary: 'Uso em equilibrio, com controle consciente.',
      markers: ['equilibrio', 'controle', 'estabilidade'],
      risks: ['desgaste fisico', 'desgaste mental'],
      tone: 'steady',
    },
    {
      id: 'state-unbalanced',
      name: 'FUSHI desequilibrado',
      summary: 'Uso sem dominio total, com instabilidade mais aparente.',
      markers: ['instabilidade', 'controle parcial', 'tensao'],
      risks: ['perda de controle', 'exaustao'],
      tone: 'watch',
    },
    {
      id: 'state-dark',
      name: 'FUSHI escuro',
      summary: 'Uso extremo com distorcao e risco direto ao usuario.',
      markers: ['extremo', 'distorcao', 'pressao'],
      risks: ['risco ao usuario', 'perda de controle', 'exaustao severa'],
      tone: 'critical',
    },
  ],
  terms: [
    {
      id: 'term-fushi',
      term: 'FUSHI',
      summary:
        'Energia fundamental presente em todas as coisas, ligada a estrutura da existencia.',
    },
    {
      id: 'term-spores',
      term: 'Esporos',
      summary:
        'Aberturas necessarias para perceber e manipular FUSHI de forma ativa.',
    },
    {
      id: 'term-rebirth',
      term: 'Renascimento',
      summary:
        'Transferencia imediata da consciencia para outro corpo ja existente.',
    },
    {
      id: 'term-silence',
      term: 'Ritual de silencio',
      summary:
        'Procedimento capaz de remover vozes acumuladas, com consequencias nao detalhadas.',
    },
    {
      id: 'term-transposition',
      term: 'Transposicao de consciencia',
      summary:
        'Forma rara e custosa de devolver uma consciencia ao controle de um corpo.',
    },
    {
      id: 'term-dt',
      term: 'DT',
      summary:
        'Dificuldade do teste. Pela escala atual: 20 e dificil Basico, 25 dificil Avancado, 30 dificil Ascensao e 32+ Cataclisma.',
    },
  ],
}
