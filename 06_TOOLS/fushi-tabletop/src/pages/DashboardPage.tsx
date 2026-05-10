import { MetricCard } from '../components/ui/MetricCard'
import { Panel } from '../components/ui/Panel'
import { StatusPill } from '../components/ui/StatusPill'
import { useMasterData } from '../hooks/useMasterData'
import { useViewMode } from '../hooks/useViewMode'
import { getFocusedPlayerCharacter, getFactionsByIds } from '../lib/selectors'

export function DashboardPage() {
  const { data } = useMasterData()
  const { viewMode, playerCharacterId } = useViewMode()

  if (!data) {
    return null
  }

  if (viewMode === 'player') {
    const playerCharacter = getFocusedPlayerCharacter(data, playerCharacterId)

    if (!playerCharacter) {
      return null
    }

    const playerMetrics = [
      {
        id: 'player-life',
        label: 'Vida',
        value: `${playerCharacter.recursos.vidaAtual}/${playerCharacter.recursos.vidaMaxima}`,
        note: 'Recurso principal do personagem.',
        tone: 'steady' as const,
        toneLabel: 'Vida',
      },
      {
        id: 'player-fushi',
        label: 'FUSHI',
        value: `${playerCharacter.recursos.fushiAtual}/${playerCharacter.recursos.fushiMaximo}`,
        note: 'Usado em tecnica, habilidade e manifestacao.',
        tone: 'watch' as const,
        toneLabel: 'FUSHI',
      },
      {
        id: 'player-det',
        label: 'Determinacao',
        value: `${playerCharacter.recursos.determinacaoAtual}/${playerCharacter.recursos.determinacaoMaxima}`,
        note: 'Se chegar a zero, perde o controle.',
        tone:
          playerCharacter.recursos.determinacaoAtual === 0
            ? ('critical' as const)
            : ('watch' as const),
        toneLabel: 'Pressao',
      },
      {
        id: 'player-def',
        label: 'Defesa',
        value: String(playerCharacter.defesa),
        note: 'Valor fixo no estilo classe de armadura.',
        tone: 'steady' as const,
        toneLabel: 'Fixo',
      },
    ]

    return (
      <div className="page-stack">
        <Panel
          eyebrow="Resumo do jogador"
          title={playerCharacter.nome}
          subtitle="Visao segura da propria ficha para consulta rapida em mesa."
        >
          <div className="metric-grid">
            {playerMetrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </Panel>

        <div className="split-grid">
          <Panel
            eyebrow="Status visiveis"
            title="Leitura do personagem"
            subtitle="Somente informacoes abertas ao jogador nesta etapa."
          >
            <div className="tag-row">
              {playerCharacter.status.map((status) => (
                <span key={status} className="tag">
                  {status}
                </span>
              ))}
            </div>
            <p className="support-copy">
              Habilidades: {playerCharacter.habilidades.join(', ')}.
            </p>
          </Panel>

          <Panel
            eyebrow="Regras-chave"
            title="Lembretes da mesa"
            subtitle="Resumo pratico para consulta durante a sessao."
          >
            <ul className="bullet-list">
              <li>O atributo define a quantidade de dados do teste base.</li>
              <li>Use o maior resultado do teste e some o bonus da pericia.</li>
              <li>Determinacao pode cair por pressao mental, narrativa ou uso.</li>
              <li>FUSHI pode voltar por descanso, item, tecnica, absorcao ambiental e momentos significativos.</li>
            </ul>
          </Panel>
        </div>
      </div>
    )
  }

  const highlightedFactions = getFactionsByIds(
    data,
    data.campaign.destaqueFaccoesIds,
  )
  const highlightedEvents = data.campaign.eventosRecentes.slice(0, 3)
  const metrics = [
    {
      id: 'metric-characters',
      label: 'Fichas carregadas',
      value: String(data.characters.items.length).padStart(2, '0'),
      note: 'Contrato oficial do MVP em modo local.',
      tone: 'steady' as const,
      toneLabel: 'Ativo',
    },
    {
      id: 'metric-factions',
      label: 'Faccoes monitoradas',
      value: String(data.factions.items.length).padStart(2, '0'),
      note: 'Ligadas a campanha por IDs de destaque.',
      tone: 'watch' as const,
      toneLabel: 'Mapa',
    },
    {
      id: 'metric-points',
      label: 'Pontos em leitura',
      value: String(data.world.pontos.length).padStart(2, '0'),
      note: 'Mapa estatico com painel lateral.',
      tone: 'steady' as const,
      toneLabel: 'Mundo',
    },
    {
      id: 'metric-events',
      label: 'Eventos recentes',
      value: String(data.campaign.eventosRecentes.length).padStart(2, '0'),
      note: 'Estado atual vindo do contrato de campanha.',
      tone: 'critical' as const,
      toneLabel: 'Fluxo',
    },
  ]

  return (
    <div className="page-stack">
      <Panel
        eyebrow="Visao geral"
        title={data.dashboard.campaignName}
        subtitle={data.dashboard.overview}
      >
        <div className="metric-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </Panel>

      <div className="split-grid">
        <Panel
          eyebrow="Resumo de faccoes"
          title="Movimento observado"
          subtitle="Leitura resumida das faccoes mockadas nesta V1."
        >
          <div className="list-stack">
            {highlightedFactions.map((faction) => (
              <article key={faction.id} className="list-card">
                <div className="list-card__top">
                  <h3>{faction.nome}</h3>
                  <StatusPill label={faction.status} tone={faction.tone} />
                </div>
                <p className="support-copy">
                  Base {faction.base} | Local atual {faction.localAtual}
                </p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Resumo de eventos"
          title="Timeline recente"
          subtitle="Eventos locais exibidos de forma compacta para o mestre."
        >
          <div className="timeline">
            {highlightedEvents.map((event) => (
              <article key={event.id} className="timeline__item">
                <div className="timeline__line" />
                <div className="timeline__content">
                  <div className="list-card__top">
                    <h3>{event.titulo}</h3>
                    <StatusPill label={event.impacto} tone={event.tone} />
                  </div>
                  <p className="support-copy">
                    {event.tipo} | {event.janela}
                  </p>
                  <p className="support-copy">{event.resumo}</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="split-grid">
        <Panel
          eyebrow="Alertas manuais"
          title="Pontos de atencao"
          subtitle="Lembretes locais para o mestre durante a preparacao da campanha."
        >
          <div className="cards-grid">
            {data.dashboard.manualAlerts.map((alert) => (
              <article key={alert.id} className="list-card">
                <div className="list-card__top">
                  <h3>{alert.title}</h3>
                  <StatusPill
                    label={
                      alert.tone === 'critical'
                        ? 'Alto'
                        : alert.tone === 'watch'
                          ? 'Medio'
                          : 'Baixo'
                    }
                    tone={alert.tone}
                  />
                </div>
                <p className="support-copy">{alert.detail}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Espaco futuro"
          title="Operacoes do mestre"
          subtitle="Area reservada para tokens, mapa e estado de campanha em iteracoes futuras."
        >
          <div className="cards-grid">
            <article className="list-card">
              <h3>Tokens e ocupacao</h3>
              <p className="support-copy">
                Preparado para leitura tatica e controle de presenca em mapa.
              </p>
            </article>
            <article className="list-card">
              <h3>Mapa e camadas</h3>
              <p className="support-copy">
                Espaco futuro para filtros, sobreposicoes e marcacao de estado.
              </p>
            </article>
            <article className="list-card">
              <h3>Estado da campanha</h3>
              <p className="support-copy">
                Base reservada para operacoes de acompanhamento mais fino do mestre.
              </p>
            </article>
          </div>
        </Panel>
      </div>
    </div>
  )
}
