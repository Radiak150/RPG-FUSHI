import type { FactionsData } from '../types'

export const factionsData: FactionsData = {
  items: [
    {
      id: 'faction-a',
      nome: 'Ordem do Vazio Sereno',
      status: 'Ativa',
      tone: 'steady',
      base: 'Montanhas do Vazio Sereno',
      localAtual: 'Montanhas do Vazio Sereno',
      resumo: 'Tradição de disciplina, domínio interno e equilíbrio do FUSHI.',
      membrosIds: ['fragmento-p01', 'fragmento-p02', 'npc-a1'],
      notas:
        'Monges, guardiões, errantes e prodígios que acreditam que força sem propósito vira ruína.',
    },
    {
      id: 'faction-b',
      nome: 'FUSHI Escuro',
      status: 'Oculta',
      tone: 'critical',
      base: 'Ruínas Antigas / zonas distorcidas',
      localAtual: 'Andarilhos e focos de corrupção',
      resumo: 'Forças ligadas à distorção, corrupção e abuso do FUSHI.',
      membrosIds: ['npc-b1'],
      notas:
        'Não funciona como uma facção comum: surge por influência, obsessão, domínio e contato com FUSHI escuro.',
    },
    {
      id: 'faction-c',
      nome: 'Ordem do Véu Cinza',
      status: 'Em vigilância',
      tone: 'watch',
      base: 'Vale Cinzento / rotas do Véu Cinza',
      localAtual: 'Acampamentos móveis e postos de observação',
      resumo: 'Investigação, contenção e operações estratégicas sobre fenômenos de FUSHI.',
      membrosIds: ['npc-c1'],
      notas:
        'Detetives, analistas, espiões e executores pragmáticos. Entender primeiro, agir antes que seja tarde.',
    },
    {
      id: 'faction-d',
      nome: 'Vila do Conhecimento Absorvido',
      status: 'Ativa',
      tone: 'steady',
      base: 'Vila do Conhecimento Absorvido',
      localAtual: 'Planície / Floresta Inicial',
      resumo: 'Hub social inicial, abrigo, treino e memória coletiva da ilha.',
      membrosIds: ['npc-d1', 'npc-d2'],
      notas:
        'É uma opção forte para os protagonistas, mas nunca trilho obrigatório. A vila existe mesmo se for ignorada.',
    },
    {
      id: 'faction-e',
      nome: 'Companhia da Maré Livre',
      status: 'Ativa',
      tone: 'steady',
      base: 'Navio da Companhia da Maré Livre',
      localAtual: 'Praia / Litoral / Oceano',
      resumo: 'Aventureiros do mar, rotas costeiras, náufragos, comércio e exploração marítima.',
      membrosIds: ['npc-e1'],
      notas:
        'Grupo ligado ao oceano e às rotas externas da ilha. Útil para rumores, travessias e conflitos costeiros.',
    },
    {
      id: 'faction-f',
      nome: 'Guardiões do Vulcão',
      status: 'Selada',
      tone: 'critical',
      base: 'Vulcão / núcleo do vulcão',
      localAtual: 'Vulcão / Terras Cinzentas',
      resumo: 'Sistema vivo de contenção que impede o despertar do Dragão FUSHI.',
      membrosIds: [],
      notas:
        'Seis guardiões protegem camadas do vulcão. Cada queda torna o vulcão mais instável e aproxima um evento cataclísmico.',
    },
  ],
}
