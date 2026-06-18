import type { AppViewMode } from '../data/types'

export interface NavigationItem {
  to: string
  label: string
  description: string
  allowedViews: AppViewMode[]
}

interface RouteMeta {
  title: string
  description: string
  eyebrow: string
  allowedViews: AppViewMode[]
}

export const navigationItems: NavigationItem[] = [
  {
    to: '/jogar',
    label: 'Jogar',
    description: 'Fluxo principal para chegar a campanha, personagens e mesa.',
    allowedViews: ['gm', 'player'],
  },
  {
    to: '/personagens',
    label: 'Personagens',
    description: 'Fichas, elenco e selecao do personagem ativo.',
    allowedViews: ['gm', 'player'],
  },
  {
    to: '/campanhas',
    label: 'Campanhas',
    description: 'Criacao local, entrada por codigo e acesso a mesa.',
    allowedViews: ['gm', 'player'],
  },
  {
    to: '/multiplayer',
    label: 'Multiplayer',
    description: 'Hospedar ou entrar em sessao local via IP, LAN ou tunnel externo.',
    allowedViews: ['gm', 'player'],
  },
  {
    to: '/livro',
    label: 'Livro',
    description: 'Base navegavel de regras, FUSHI e documentacao.',
    allowedViews: ['gm'],
  },
  {
    to: '/configuracoes',
    label: 'Configuracoes',
    description: 'Tema, graficos e preferencias locais desta instalacao.',
    allowedViews: ['gm', 'player'],
  },
]

const routeMeta: Record<string, RouteMeta> = {
  '/': {
    title: 'FUSHI Tabletop',
    description: 'Entrada principal para jogar, abrir campanhas e consultar personagens.',
    eyebrow: 'Plataforma',
    allowedViews: ['gm', 'player'],
  },
  '/jogar': {
    title: 'Jogar',
    description: 'Escolha o caminho de entrada antes de ir para a mesa.',
    eyebrow: 'Modulo',
    allowedViews: ['gm', 'player'],
  },
  '/jogar/mesa': {
    title: 'Jogar',
    description:
      'Mesa principal preparada para evoluir para uma experiencia mais cinematografica.',
    eyebrow: 'Modulo',
    allowedViews: ['gm', 'player'],
  },
  '/personagens': {
    title: 'Personagens',
    description: 'Lista de fichas organizada para selecao, leitura e futura edicao.',
    eyebrow: 'Modulo',
    allowedViews: ['gm', 'player'],
  },
  '/campanhas': {
    title: 'Campanhas',
    description: 'Entrar ou criar campanha de forma local, limpa e direta.',
    eyebrow: 'Modulo',
    allowedViews: ['gm', 'player'],
  },
  '/multiplayer': {
    title: 'Multiplayer V1',
    description:
      'Hospedagem local por WebSocket/HTTP para testes com LAN ou tunnel externo.',
    eyebrow: 'Sessao',
    allowedViews: ['gm', 'player'],
  },
  '/livro': {
    title: 'Livro',
    description:
      'Estrutura navegavel para regras, sistema, FUSHI, protagonistas e base documental.',
    eyebrow: 'Modulo',
    allowedViews: ['gm'],
  },
  '/configuracoes': {
    title: 'Configuracoes',
    description:
      'Ajustes locais de tema, graficos e preferencias da experiencia.',
    eyebrow: 'Modulo',
    allowedViews: ['gm', 'player'],
  },
}

export function getRouteMeta(pathname: string) {
  return routeMeta[pathname] ?? routeMeta['/']
}

export function isRouteAllowed(pathname: string, viewMode: AppViewMode) {
  return getRouteMeta(pathname).allowedViews.includes(viewMode)
}
