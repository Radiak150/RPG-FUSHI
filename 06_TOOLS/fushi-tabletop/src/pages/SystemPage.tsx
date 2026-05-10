import { Panel } from '../components/ui/Panel'
import { StatusPill } from '../components/ui/StatusPill'
import { useMasterData } from '../hooks/useMasterData'

export function SystemPage() {
  const { data } = useMasterData()

  if (!data) {
    return null
  }

  return (
    <div className="page-stack">
      <Panel
        eyebrow="Consulta rapida"
        title="Regras consolidadas"
        subtitle="Resumo curto para uso do mestre durante a mesa."
      >
        <div className="cards-grid cards-grid--large">
          {data.system.rules.map((rule) => (
            <article key={rule.id} className="list-card">
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
      </Panel>

      <div className="split-grid">
        <Panel
          eyebrow="Escala de poder"
          title="Tier inicial"
          subtitle="A sessao 01 comeca em Tier 0 e escala por leitura de mesa."
        >
          <div className="list-stack">
            {data.system.powerScale.map((tier) => (
              <article key={tier.id} className="list-card">
                <div className="list-card__top">
                  <h3>
                    {tier.tier} · {tier.title}
                  </h3>
                  <span className="tag">{tier.tier}</span>
                </div>
                <p className="support-copy">{tier.summary}</p>
                <div className="tag-row">
                  {tier.examples.map((example) => (
                    <span key={example} className="tag">
                      {example}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Dificuldade"
          title="Leitura de encontro"
          subtitle="Escala base usada para balancear a primeira sessao."
        >
          <div className="list-stack">
            {data.system.difficultyScale.map((difficulty) => (
              <article key={difficulty.id} className="list-card">
                <h3>{difficulty.label}</h3>
                <p className="support-copy">{difficulty.summary}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="split-grid">
        <Panel
          eyebrow="Ficha universal"
          title="Base de personagem"
          subtitle="Player e NPC compartilham o mesmo contrato de ficha."
        >
          <div className="list-stack">
            {data.system.universalSheetNotes.map((note) => (
              <article key={note} className="list-card">
                <p className="support-copy">{note}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Combate base"
          title="Regras iniciais"
          subtitle="O suficiente para fechar o tutorial sem construir o sistema completo ainda."
        >
          <div className="list-stack">
            {data.system.combatGuidelines.map((rule) => (
              <article key={rule.id} className="list-card">
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
        </Panel>
      </div>

      <div className="split-grid">
        <Panel
          eyebrow="Tutorial"
          title="Lobo da Planicie"
          subtitle="Inimigo inicial ajustado para ensinar sem matar facil."
        >
          <div className="list-stack">
            {data.system.tutorialEncounters.map((encounter) => (
              <article key={encounter.id} className="list-card">
                <div className="list-card__top">
                  <h3>{encounter.name}</h3>
                  <StatusPill label={`Tier ${encounter.tier}`} tone="watch" />
                </div>
                <p className="support-copy">{encounter.summary}</p>
                <p className="support-copy">
                  FOR {encounter.attributes.forca} · AGI {encounter.attributes.agilidade} · INT{' '}
                  {encounter.attributes.intelecto} · PRE {encounter.attributes.presenca} · VIG{' '}
                  {encounter.attributes.vigor}
                </p>
                <p className="support-copy">
                  Vida {encounter.resources.vida} · FUSHI {encounter.resources.fushi} ·
                  Determinacao {encounter.resources.determinacao} · Defesa {encounter.resources.defesa}
                </p>
                <div className="tag-row">
                  {encounter.attacks.map((attack) => (
                    <span key={attack} className="tag">
                      {attack}
                    </span>
                  ))}
                </div>
                <ul className="bullet-list">
                  {encounter.scaling.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Estados do FUSHI"
          title="Leitura de uso"
          subtitle="Os tres estados aparecem como formas de uso, nao como energias separadas."
        >
          <div className="list-stack">
            {data.system.states.map((state) => (
              <article key={state.id} className="list-card">
                <div className="list-card__top">
                  <h3>{state.name}</h3>
                  <StatusPill label={state.name} tone={state.tone} />
                </div>
                <p className="support-copy">{state.summary}</p>
                <div className="tag-row">
                  {state.markers.map((marker) => (
                    <span key={marker} className="tag">
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
        </Panel>

        <Panel
          eyebrow="Termos importantes"
          title="Glossario rapido"
          subtitle="Termos centrais ja presentes na base documental do projeto."
        >
          <div className="list-stack">
            {data.system.terms.map((term) => (
              <article key={term.id} className="list-card">
                <h3>{term.term}</h3>
                <p className="support-copy">{term.summary}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="split-grid">
        <Panel
          eyebrow="Permissoes futuras"
          title="Controle compartilhado"
          subtitle="Arquitetura preparada sem precisar de multiplayer real agora."
        >
          <div className="list-stack">
            {data.system.futurePermissionNotes.map((note) => (
              <article key={note} className="list-card">
                <p className="support-copy">{note}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Fluxo da sessao 01"
          title="Ordem recomendada"
          subtitle="Biblioteca organizada para o mestre seguir a sessao em sequencia."
        >
          <div className="list-stack">
            {data.tabletop.sessions.map((sessionPlan) =>
              sessionPlan.scenes
                .slice()
                .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
                .map((step) => (
                  <article key={step.id} className="list-card">
                    <div className="list-card__top">
                      <h3>
                        {(step.order ?? 0).toString().padStart(2, '0')} · {step.name}
                      </h3>
                      <span className="tag">{step.mode}</span>
                    </div>
                    {step.notes ? <p className="support-copy">{step.notes}</p> : null}
                  </article>
                )),
            )}
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Biblioteca de itens"
        title="Placeholders iniciais"
        subtitle="Estrutura base para itens de mapa e inventario futuro sem automatizar sistema agora."
      >
        <div className="cards-grid cards-grid--large">
          {data.system.itemLibrary.map((item) => (
            <article key={item.id} className="list-card">
              <div className="list-card__top">
                <h3>{item.name}</h3>
                <span className="tag">{item.category}</span>
              </div>
              <p className="support-copy">{item.summary}</p>
              <div className="tag-row">
                {item.futureHooks.map((hook) => (
                  <span key={hook} className="tag">
                    {hook}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
