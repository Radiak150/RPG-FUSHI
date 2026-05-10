import type { DashboardData } from '../types'

export const dashboardData: DashboardData = {
  campaignName: 'Campanha FUSHI',
  currentSession: 'Sessao 01',
  campaignStatus: 'Leitura local',
  overview:
    'Painel local preparado para consultar campanha, fichas, faccoes, mundo e sistema a partir de contratos reais de dados.',
  manualAlerts: [
    {
      id: 'alert-01',
      title: 'Mapa ainda em modo demonstrativo',
      detail:
        'Os pontos de interesse desta V1 sao placeholders locais para validar navegacao e painel lateral.',
      tone: 'watch',
    },
    {
      id: 'alert-02',
      title: 'Faccoes ainda sem automacao',
      detail:
        'A listagem atual mostra apenas estados mockados e nao simula deslocamento autonomo.',
      tone: 'critical',
    },
    {
      id: 'alert-03',
      title: 'Fichas e rolagens prontas para teste',
      detail:
        'A nova camada de personagens e rolagens usa contratos locais e ainda nao escreve em arquivos centrais.',
      tone: 'steady',
    },
  ],
}
