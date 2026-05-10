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
    description: 'Panorama da plataforma, do mundo e do estado atual do projeto.',
  },
  {
    id: 'fushi',
    label: 'FUSHI',
    description: 'Base de consulta para estados, termos e uso do sistema.',
  },
  {
    id: 'protagonistas',
    label: 'Protagonistas',
    description: 'Area preparada para a estrutura dos fragmentos e sua identidade.',
  },
  {
    id: 'regras-existencia',
    label: 'Regras da Existencia',
    description: 'Continuidade, morte, renascimento e posse em leitura navegavel.',
  },
  {
    id: 'faccoes',
    label: 'Faccoes',
    description: 'Base futura para grupos, dinamica e relacionamento no mundo.',
  },
  {
    id: 'sistema',
    label: 'Sistema',
    description: 'Resumo das mecanicas atuais, estados do FUSHI e termos importantes.',
  },
]
