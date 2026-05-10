import { Panel } from '../components/ui/Panel'
import { StatusPill } from '../components/ui/StatusPill'
import { useMasterData } from '../hooks/useMasterData'
import { getCharactersByIds, getFactionsByIds, getPointsByIds } from '../lib/selectors'

export function CampaignPage() {
  const { data } = useMasterData()

  if (!data) {
    return null
  }

  const highlightedFactions = getFactionsByIds(data, data.campaign.destaqueFaccoesIds)
  const highlightedCharacters = getCharactersByIds(
    data,
    data.campaign.destaquePersonagensIds,
  )
  const highlightedPoints = getPointsByIds(data, data.campaign.destaquePontosIds)

  return (
    <div className="page-stack">
      <div className="split-grid">
        <Panel
          eyebrow="Estado atual"
          title={data.campaign.estadoAtual}
          subtitle={data.campaign.focoAtual}
        >
          <dl className="detail-grid">
            <div>
              <dt>Campanha</dt>
              <dd>{data.dashboard.campaignName}</dd>
            </div>
            <div>
              <dt>Sessao atual</dt>
              <dd>{data.campaign.sessaoAtual}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{data.dashboard.campaignStatus}</dd>
            </div>
            <div>
              <dt>Modo</dt>
              <dd>Somente leitura local</dd>
            </div>
          </dl>
        </Panel>

        <Panel
          eyebrow="Observacoes do mestre"
          title="Notas em aberto"
          subtitle="Lista simples para acompanhamento rapido da sessao."
        >
          <div className="list-stack">
            {data.campaign.observacoesMestre.map((note) => (
              <article key={note} className="list-card">
                <p className="support-copy">{note}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Eventos recentes"
        title="Linha de campanha"
        subtitle="Timeline local com eventos mockados da V1."
      >
        <div className="timeline">
          {data.campaign.eventosRecentes.map((event) => (
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

      <div className="split-grid">
        <Panel
          eyebrow="Em foco"
          title="Faccoes e personagens"
          subtitle="Links atuais do estado da campanha com os contratos de faccao e ficha."
        >
          <div className="cards-grid">
            {highlightedFactions.map((faction) => (
              <article key={faction.id} className="list-card">
                <div className="list-card__top">
                  <h3>{faction.nome}</h3>
                  <StatusPill label={faction.status} tone={faction.tone} />
                </div>
                <p className="support-copy">{faction.resumo}</p>
              </article>
            ))}

            {highlightedCharacters.map((character) => (
              <article key={character.id} className="list-card">
                <div className="list-card__top">
                  <h3>{character.nome}</h3>
                  <StatusPill
                    label={character.status[0] ?? character.tipo}
                    tone={character.tone}
                  />
                </div>
                <p className="support-copy">{character.localAtual}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Pontos ativos"
          title="Mapa em leitura"
          subtitle="Pontos destacados no estado atual da campanha."
        >
          <div className="list-stack">
            {highlightedPoints.map((point) => (
              <article key={point.id} className="list-card">
                <div className="list-card__top">
                  <h3>{point.nome}</h3>
                  <StatusPill label={point.status} tone={point.tone} />
                </div>
                <p className="support-copy">{point.resumo}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Observacoes tecnicas"
        title="Recados da V1"
        subtitle="Pontos prontos para evolucao nas proximas iteracoes."
      >
        <div className="cards-grid">
          {data.campaign.observacoesTecnicas.map((item) => (
            <article key={item} className="list-card">
              <p className="support-copy">{item}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
