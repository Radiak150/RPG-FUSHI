import { useState } from 'react'
import { BookSectionNav } from '../components/product/BookSectionNav'
import { StatusPill } from '../components/ui/StatusPill'
import { Panel } from '../components/ui/Panel'
import { bookSectionEntries } from '../data/mock/product'
import { useMasterData } from '../hooks/useMasterData'
import { useProductPreferences } from '../hooks/useProductPreferences'
import { getCharactersByIds } from '../lib/selectors'

export function BookPage() {
  const { data } = useMasterData()
  const { showModuleDescriptions } = useProductPreferences()
  const [selectedSectionId, setSelectedSectionId] = useState('visao-geral')

  if (!data) {
    return null
  }

  const selectedSection =
    bookSectionEntries.find((section) => section.id === selectedSectionId) ??
    bookSectionEntries[0]
  const protagonistSamples = getCharactersByIds(
    data,
    data.campaign.destaquePersonagensIds,
  ).filter((character) => character.tipo === 'player')

  return (
    <div className="page-stack">
      <div className="book-layout">
        <Panel
          eyebrow="Livro"
          title="Secoes principais"
          subtitle="Base navegavel para regras, lore, sistema e documentacao futura."
        >
          <BookSectionNav
            activeSectionId={selectedSection.id}
            items={bookSectionEntries}
            onSelect={setSelectedSectionId}
            showDescriptions={showModuleDescriptions}
          />
        </Panel>

        <Panel
          eyebrow="Livro"
          title={selectedSection.label}
          subtitle={selectedSection.description}
        >
          {selectedSection.id === 'visao-geral' ? (
            <div className="page-stack">
              <p className="support-copy">{data.dashboard.overview}</p>
              <div className="cards-grid">
                <article className="list-card">
                  <h3>Campanha ativa</h3>
                  <p className="support-copy">{data.dashboard.campaignName}</p>
                </article>
                <article className="list-card">
                  <h3>Sessao atual</h3>
                  <p className="support-copy">{data.dashboard.currentSession}</p>
                </article>
                <article className="list-card">
                  <h3>Fonte de dados</h3>
                  <p className="support-copy">{data.meta.sourceLabel}</p>
                </article>
              </div>
            </div>
          ) : null}

          {selectedSection.id === 'fushi' ? (
            <div className="list-stack">
              {data.system.states.map((state) => (
                <article className="list-card" key={state.id}>
                  <div className="list-card__top">
                    <h3>{state.name}</h3>
                    <StatusPill label={state.name} tone={state.tone} />
                  </div>
                  <p className="support-copy">{state.summary}</p>
                  <div className="tag-row">
                    {state.markers.map((marker) => (
                      <span className="tag" key={marker}>
                        {marker}
                      </span>
                    ))}
                  </div>
                  <p className="support-copy">
                    Riscos: {state.risks.join(', ')}.
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          {selectedSection.id === 'protagonistas' ? (
            <div className="page-stack">
              <article className="list-card">
                <h3>{data.system.rules[0]?.title ?? 'Protagonistas'}</h3>
                <p className="support-copy">
                  {data.system.rules[0]?.summary ??
                    'Estrutura local preparada para consolidar a base dos protagonistas.'}
                </p>
                <ul className="bullet-list">
                  {(data.system.rules[0]?.bullets ?? []).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
              <div className="cards-grid">
                {protagonistSamples.map((character) => (
                  <article className="list-card" key={character.id}>
                    <h3>{character.nome}</h3>
                    <p className="support-copy">
                      Exemplo local de ficha player atualmente ligada a campanha.
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {selectedSection.id === 'regras-existencia' ? (
            <div className="list-stack">
              {data.system.rules
                .filter((rule) =>
                  ['rule-death', 'rule-possession'].includes(rule.id),
                )
                .map((rule) => (
                  <article className="list-card" key={rule.id}>
                    <h3>{rule.title}</h3>
                    <p className="support-copy">{rule.summary}</p>
                    <ul className="bullet-list">
                      {rule.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
            </div>
          ) : null}

          {selectedSection.id === 'faccoes' ? (
            <div className="cards-grid cards-grid--large">
              {data.factions.items.map((faction) => (
                <article className="list-card" key={faction.id}>
                  <div className="list-card__top">
                    <h3>{faction.nome}</h3>
                    <StatusPill label={faction.status} tone={faction.tone} />
                  </div>
                  <p className="support-copy">{faction.resumo}</p>
                  <div className="tag-row">
                    <span className="tag">{faction.base}</span>
                    <span className="tag">{faction.localAtual}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {selectedSection.id === 'sistema' ? (
            <div className="page-stack">
              <div className="cards-grid cards-grid--large">
                {data.system.rules.map((rule) => (
                  <article className="list-card" key={rule.id}>
                    <h3>{rule.title}</h3>
                    <p className="support-copy">{rule.summary}</p>
                    <ul className="bullet-list">
                      {rule.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              <div className="list-stack">
                {data.system.terms.map((term) => (
                  <article className="list-card" key={term.id}>
                    <h3>{term.term}</h3>
                    <p className="support-copy">{term.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  )
}
