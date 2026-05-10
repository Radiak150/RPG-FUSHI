import type { CampaignData } from '../types'

export const campaignData: CampaignData = {
  estadoAtual: 'Preparacao ativa',
  sessaoAtual: 'Sessao 01',
  focoAtual: 'Organizar leitura do mundo, pontos, faccoes e fichas locais.',
  eventosRecentes: [
    {
      id: 'event-01',
      titulo: 'Evento local 01',
      tipo: 'Observacao',
      janela: 'Agora',
      impacto: 'Baixo',
      tone: 'steady',
      resumo: 'Evento mockado para preencher o historico recente do mestre.',
    },
    {
      id: 'event-02',
      titulo: 'Evento local 02',
      tipo: 'Pressao',
      janela: 'Curto prazo',
      impacto: 'Moderado',
      tone: 'watch',
      resumo: 'Linha intermediaria para acompanhar tensao em aberto.',
    },
    {
      id: 'event-03',
      titulo: 'Evento local 03',
      tipo: 'Alerta',
      janela: 'Imediato',
      impacto: 'Alto',
      tone: 'critical',
      resumo: 'Entrada de risco visual sem automacao real nesta fase.',
    },
    {
      id: 'event-04',
      titulo: 'Evento local 04',
      tipo: 'Deslocamento',
      janela: 'Em espera',
      impacto: 'Baixo',
      tone: 'steady',
      resumo: 'Usado para demonstrar variacao de estado na timeline.',
    },
  ],
  observacoesMestre: [
    'Confirmar o ritmo inicial da exploracao moderada.',
    'Testar a leitura das fichas e da rolagem simples em mesa.',
    'Revisar quando a campanha vai deixar o modo totalmente local.',
  ],
  observacoesTecnicas: [
    'Sem escrita em arquivos do projeto na V1.',
    'Dados preparados para futura troca por 03_DATA.',
    'Interface atual privilegia leitura rapida, ficha e painel lateral.',
  ],
  destaqueFaccoesIds: ['faction-a', 'faction-c', 'faction-d'],
  destaquePersonagensIds: ['fragmento-p01', 'fragmento-p02', 'npc-d1'],
  destaquePontosIds: ['point-02', 'point-03', 'point-05'],
}
