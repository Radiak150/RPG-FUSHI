import type { Tone } from '../types'

export interface CampaignShelfEntry {
  id: string
  nome: string
  resumo: string
  papel: 'gm' | 'player' | 'shared'
  status: string
  tone: Tone
}

export interface BookSectionEntry {
  id: string
  label: string
  description: string
}

export const campaignShelfEntries: CampaignShelfEntry[] = [
  {
    id: 'campaign-active',
    nome: 'Campanha ativa',
    resumo: 'Espaco local ligado ao estado atual da mesa e da campanha em leitura.',
    papel: 'shared',
    status: 'Disponivel agora',
    tone: 'steady',
  },
  {
    id: 'campaign-gm-slot',
    nome: 'Nova campanha local',
    resumo: 'Fluxo visual preparado para abrir uma campanha futura como mestre.',
    papel: 'gm',
    status: 'Placeholder',
    tone: 'watch',
  },
  {
    id: 'campaign-player-slot',
    nome: 'Entrar por codigo',
    resumo: 'Fluxo visual local reservado para entrada de jogador por link ou codigo.',
    papel: 'player',
    status: 'Placeholder',
    tone: 'steady',
  },
]

export const bookSectionEntries: BookSectionEntry[] = [
  {
    id: 'visao-geral',
    label: 'Visao Geral',
    description: 'Panorama da campanha, estado da mesa e leitura rapida do projeto.',
  },
  {
    id: 'sessao-1',
    label: 'Sessao 1',
    description: 'Roteiro sem railroad, checklist tecnico e limites de escopo.',
  },
  {
    id: 'combate',
    label: 'Combate',
    description: 'Fluxo de testes, ataques, reacoes, ficha universal e dificuldade.',
  },
  {
    id: 'xp',
    label: 'XP e Atos',
    description: 'Faixas de nivel, marcadores de identidade e quando marcar cada caixa.',
  },
  {
    id: 'waves',
    label: 'Waves',
    description: 'Wave Lobos - Planicie, recompensas reais e regra anti-morte tutorial.',
  },
  {
    id: 'itens',
    label: 'Itens',
    description: 'Itemizacao com efeito mecanico, custo e build em vez de drop vazio.',
  },
  {
    id: 'fushi',
    label: 'FUSHI',
    description: 'Estados, termos e riscos publicos do sistema de energia.',
  },
  {
    id: 'segredos-fushi',
    label: 'Segredos FUSHI',
    description: 'Conteudo de mestre para Esporos, Poder Unido e desbloqueios futuros.',
  },
  {
    id: 'mun-base',
    label: 'MUN e Base',
    description: 'Tempo de viagem, bases por bioma e upgrades planejados.',
  },
  {
    id: 'faccoes-lore',
    label: 'Lore e Faccoes',
    description: 'Fragmentos, faccoes e lembretes de mundo para consulta narrativa.',
  },
  {
    id: 'bibliografia',
    label: 'Bibliografia',
    description: 'Fontes internas consolidadas e nota de manutencao do livro.',
  },
]
