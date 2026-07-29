import type { CharacterFeatureDetail } from '../types'

export interface InitialTrainingRewardDefinition {
  characterName: string
  feature: CharacterFeatureDetail
  playerId: string
  summary: string
}

export const INITIAL_TRAINING_REWARDS: InitialTrainingRewardDefinition[] = [
  {
    characterName: 'Kaíros',
    playerId: 'player1',
    summary: 'Atrasa inimigos em uma area de 5 m e abre o Desengajar.',
    feature: {
      id: 'training-kairos-barulho-torturante',
      nome: 'Sinos - Barulho Torturante',
      descricao:
        'O som dos sinos atravessa a identidade dos inimigos em ate 5 m. Com ativacao bem-sucedida, todos os inimigos escolhidos na area atrasam seu proximo turno em 1 posicao e a area fica Desengajada. O efeito dura ate o fim da rodada atual.',
      tipo: 'tecnica',
      automation: {
        activation: 'Acao Principal',
        combat: {
          acao: 'principal',
          alcance: { band: 'curto', maxSquares: 4 },
          efeitoRapido: 'Sucesso: inimigos escolhidos em 5 m atrasam 1 turno e a area gera Desengajar.',
          falha: 'O som nao fixa a identidade dos alvos; o FUSHI e gasto.',
          teste: {
            atributo: 'presenca',
            alvo: 'dt',
            detalhe: 'Uma unica ativacao testa toda a area; os alvos nao rolam separadamente.',
            dificuldade: 10,
            pericia: 'Vontade',
          },
        },
        costs: [{ amount: 4, resource: 'fushi' }],
        effects: [{
          durationRounds: 1,
          mode: 'add',
          stacks: 1,
          status: 'Desnorteado',
          statusId: 'desnorteado',
          target: 'target',
          type: 'status',
        }],
        duration: 'Ate o fim da rodada atual',
        gmText: 'DT 10. Em sucesso, escolha inimigos em ate 5 m: cada um atrasa 1 turno e a area permite Desengajar. Nao acumula atraso com outra ativacao na mesma rodada.',
        kind: 'tecnica',
        limit: 'O mesmo alvo so pode ser atrasado uma vez por rodada.',
        publicText: 'Kaíros faz os sinos atravessarem o campo como um barulho torturante.',
        range: 'Area de 5 m ao redor de Kaíros',
        roll: {
          bonus: 0,
          contexto: 'Sinos - Barulho Torturante · DT 10',
          modo: 'highest',
          quantidadeDados: 1,
          tipoDado: 20,
          visibility: 'public',
          visualColor: '#8e6cff',
        },
        tags: ['FUSHI', 'Area', 'Controle', 'Desengajar'],
        target: 'Inimigos escolhidos na area',
        presentation: {
          area: { color: '#8e6cff', radiusMeters: 5, shape: 'radius' },
          audioCueId: 'kairos-bells-torture',
          vfxPresetId: 'fushi-bells-shockwave',
        },
        visualColor: '#8e6cff',
      },
    },
  },
  {
    characterName: 'Davi',
    playerId: 'player2',
    summary: 'Le um ponto fraco e dobra o proximo dano de Davi.',
    feature: {
      id: 'training-davi-analise-cirurgica',
      nome: 'Ciências - Análise Cirúrgica',
      descricao:
        'Davi le a identidade de um alvo e isola um ponto fraco que apenas ele compreende. Em sucesso, o proximo dano causado por Davi contra esse alvo e dobrado. O beneficio termina ao causar dano ou no fim do proximo turno de Davi.',
      tipo: 'tecnica',
      automation: {
        activation: 'Acao Principal',
        combat: {
          acao: 'principal',
          alcance: { band: 'curto', maxSquares: 6 },
          efeitoRapido: 'Sucesso: dobre o proximo dano de Davi contra o alvo analisado.',
          falha: 'Davi nao fecha a leitura; o FUSHI e gasto e nenhum dano e dobrado.',
          teste: {
            atributo: 'intelecto',
            alvo: 'dt',
            detalhe: 'O ponto fraco vale apenas para Davi e para um unico dano.',
            dificuldade: 10,
            pericia: 'Ciencias',
          },
        },
        costs: [{ amount: 3, resource: 'fushi' }],
        duration: 'Ate causar dano ou ate o fim do proximo turno de Davi',
        gmText: 'DT 10. Marque um alvo. No sucesso, dobre uma vez o proximo dano de Davi contra ele; depois remova a marcacao.',
        kind: 'tecnica',
        limit: 'Um alvo analisado por vez; nao acumula consigo mesma.',
        publicText: 'Davi concentra a leitura da identidade em um unico ponto.',
        range: 'Media distancia · 9 m',
        roll: {
          bonus: 5,
          contexto: 'Ciências - Análise Cirúrgica · DT 10',
          modo: 'highest',
          quantidadeDados: 1,
          tipoDado: 20,
          visibility: 'public',
          visualColor: '#f2cc48',
        },
        tags: ['FUSHI', 'Analise', 'Ponto fraco', 'Dano'],
        target: 'Um alvo visivel',
        presentation: {
          area: { color: '#f2cc48', radiusMeters: 9, shape: 'radius' },
          vfxPresetId: 'fushi-surgical-mark',
        },
        visualColor: '#f2cc48',
      },
    },
  },
  {
    characterName: 'Connor',
    playerId: 'player4',
    summary: 'Percebe posicoes e conversas em todo o mapa atual.',
    feature: {
      id: 'training-connor-percepcao-sensorial',
      nome: 'Cego - Percepção Sensorial',
      descricao:
        'Connor expande os sentidos pela identidade do lugar. Em sucesso, percebe a posicao de todas as pessoas presentes no mapa atual e escuta claramente as conversas que acontecem nele durante 1 rodada. Barreiras narrativas especiais ainda podem ser declaradas pelo Mestre.',
      tipo: 'tecnica',
      automation: {
        activation: 'Acao Principal',
        combat: {
          acao: 'principal',
          alcance: { band: 'mapa' },
          efeitoRapido: 'Sucesso: revele a Connor posicoes e conversas do mapa atual por 1 rodada.',
          falha: 'A leitura fica ruidosa; o FUSHI e gasto e nenhuma informacao precisa e revelada.',
          teste: {
            atributo: 'presenca',
            alvo: 'dt',
            detalhe: 'Nao atravessa outro mapa nem uma barreira especial declarada pelo Mestre.',
            dificuldade: 10,
            pericia: 'Percepcao',
          },
        },
        costs: [{ amount: 3, resource: 'fushi' }],
        duration: '1 rodada',
        gmText: 'DT 10. Em sucesso, informe a Connor todas as posicoes e conversas do mapa atual, exceto barreiras especiais previamente declaradas.',
        kind: 'tecnica',
        publicText: 'Connor amplia a percepção até sentir o mapa como um único corpo.',
        range: 'Todo o mapa atual',
        roll: {
          bonus: 0,
          contexto: 'Cego - Percepção Sensorial · DT 10',
          modo: 'highest',
          quantidadeDados: 1,
          tipoDado: 20,
          visibility: 'public',
          visualColor: '#f4f1e8',
        },
        tags: ['FUSHI', 'Sensorial', 'Informacao', 'Mapa'],
        target: 'Connor e o mapa atual',
        presentation: {
          area: { color: '#f4f1e8', shape: 'map' },
          audioCueId: 'connor-sensory-pulse',
          vfxPresetId: 'fushi-sensory-map',
        },
        visualColor: '#f4f1e8',
      },
    },
  },
  {
    characterName: 'Kael',
    playerId: 'player3',
    summary: 'Analisa e rouba um objeto corpo a corpo sem ser percebido.',
    feature: {
      id: 'training-kael-pata-mansa',
      nome: 'Ladrão - Pata Mansa',
      descricao:
        'Kael le o inventario e a guarda de um alvo em corpo a corpo. Em sucesso, escolhe um objeto carregado ou empunhado e o rouba sem ser percebido. Em falha, ele descobre que nao consegue realizar aquele roubo e nao executa a tentativa.',
      tipo: 'tecnica',
      automation: {
        activation: 'Acao Principal',
        combat: {
          acao: 'principal',
          alcance: { band: 'corpo-a-corpo', maxSquares: 1 },
          efeitoRapido: 'Sucesso: revele os objetos e permita roubar 1 deles sem alerta.',
          falha: 'Kael apenas descobre que o roubo nao e viavel; o alvo nao percebe a leitura.',
          teste: {
            atributo: 'agilidade',
            alvo: 'dt',
            detalhe: 'A DT base e 10; o Mestre pode usar 12 para objeto protegido ou 14 para objeto excepcional.',
            dificuldade: 10,
            pericia: 'Furtividade',
          },
        },
        costs: [{ amount: 3, resource: 'fushi' }],
        duration: 'Instantanea',
        gmText: 'DT 10 normal, 12 protegido, 14 excepcional. Sucesso rouba 1 objeto sem alerta; falha apenas informa a inviabilidade e impede repetir no mesmo alvo nesta cena.',
        kind: 'tecnica',
        limit: 'Um objeto por ativacao; apos falhar, nao repete no mesmo alvo durante a cena.',
        publicText: 'Kael deixa a própria presença leve o bastante para tocar o que parecia inalcançável.',
        range: 'Corpo a corpo · adjacente',
        roll: {
          bonus: 0,
          contexto: 'Ladrão - Pata Mansa · DT 10+',
          modo: 'highest',
          quantidadeDados: 1,
          tipoDado: 20,
          visibility: 'public',
          visualColor: '#72b083',
        },
        tags: ['FUSHI', 'Furtividade', 'Roubo', 'Utilidade'],
        target: 'Um alvo adjacente',
        presentation: {
          area: { color: '#72b083', shape: 'adjacent' },
          vfxPresetId: 'fushi-silent-hand',
        },
        visualColor: '#72b083',
      },
    },
  },
  {
    characterName: 'Grim',
    playerId: 'player5',
    summary: 'Drena 1d6 de Vida e transfere o mesmo valor imediatamente.',
    feature: {
      id: 'training-grim-vida-sugada',
      nome: 'Curandeiro - Vida Sugada',
      descricao:
        'Grim arranca Vida de um alvo a media distancia e a repele imediatamente para outro alvo ao alcance, inclusive ele mesmo. Em acerto, causa 1d6 de dano de FUSHI e cura exatamente o dano de Vida realmente causado. A Vida nao pode ser guardada.',
      tipo: 'tecnica',
      automation: {
        activation: 'Acao Principal',
        combat: {
          acao: 'principal',
          alcance: { band: 'curto', maxSquares: 6 },
          dano: {
            critico: 'nenhum',
            formula: '1d6',
            gatilho: 'acerto',
            tipo: 'fushi',
          },
          efeitoRapido: 'Acerto: cause 1d6 e cure imediatamente outro alvo pelo dano realmente causado.',
          falha: 'Nenhuma Vida e drenada ou curada; o FUSHI e gasto.',
          teste: {
            atributo: 'intelecto',
            alvo: 'ca',
            detalhe: 'A cura nunca supera o dano de Vida realmente aplicado ao alvo.',
            pericia: 'Ocultismo',
          },
          resolucao: {
            healingAmount: 'effective-damage',
            healingTarget: 'selected',
            mode: 'drain-transfer',
          },
        },
        costs: [{ amount: 4, resource: 'fushi' }],
        duration: 'Instantanea',
        gmText: 'Teste INT + Ocultismo contra CA. No acerto, role 1d6 sem critico; aplique o dano e cure outro alvo ao alcance pelo dano de Vida efetivamente causado.',
        kind: 'tecnica',
        limit: 'A Vida deve ser transferida imediatamente e nao pode ser guardada.',
        publicText: 'Grim puxa Vida de um corpo e a conduz diretamente a outro.',
        range: 'Media distancia · 9 m para os dois alvos',
        roll: {
          bonus: 5,
          contexto: 'Curandeiro - Vida Sugada · contra CA',
          modo: 'highest',
          quantidadeDados: 1,
          tipoDado: 20,
          visibility: 'public',
          visualColor: '#aeb9b5',
        },
        tags: ['FUSHI', 'Dreno', 'Cura', 'Dano 1d6'],
        target: 'Um alvo drenado e um alvo curado',
        presentation: {
          area: { color: '#aeb9b5', radiusMeters: 9, shape: 'radius' },
          audioCueId: 'grim-life-siphon',
          vfxPresetId: 'fushi-life-siphon',
        },
        visualColor: '#aeb9b5',
      },
    },
  },
]

export function getInitialTrainingReward(playerId: string) {
  return INITIAL_TRAINING_REWARDS.find((reward) => reward.playerId === playerId) ?? null
}

export function getInitialTrainingRewardByFeatureId(featureId: string) {
  return (
    INITIAL_TRAINING_REWARDS.find(
      (reward) => reward.feature.id === featureId,
    ) ?? null
  )
}
