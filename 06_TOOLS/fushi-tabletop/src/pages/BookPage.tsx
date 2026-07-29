import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RulebookCompendium } from '../components/product/RulebookCompendium'
import {
  RulebookBlockView,
  RulebookQuickReference,
  RulebookRichText,
  RulebookSectionMenu,
  RulebookStatusBadge,
} from '../components/product/RulebookContent'
import { TabletopStatusIcon } from '../components/tabletop/TabletopStatusIcon'
import {
  TABLETOP_STATUS_CATALOG,
  type TabletopStatusKind,
} from '../data/statusCatalog'
import {
  getRulebookForAudience,
  rulebookBibliography,
  rulebookSectionMatches,
  type RulebookAudience,
} from '../data/rulebook'
import { useMasterData } from '../hooks/useMasterData'
import { useViewMode } from '../hooks/useViewMode'
import { resolveRuntimeAssetUrl } from '../lib/runtimeAssets'

const STATUS_KIND_LABELS: Record<TabletopStatusKind, string> = {
  buff: 'Buff',
  condition: 'Condicao',
  debuff: 'Debuff',
}

function RulebookStatusCatalog({
  requestedStatusId,
}: {
  requestedStatusId?: string
}) {
  useEffect(() => {
    if (!requestedStatusId) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById(`rulebook-status-${requestedStatusId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [requestedStatusId])

  return (
    <section className="rulebook-status-catalog">
      <header>
        <p className="eyebrow">Referencia canonica</p>
        <h3>Estados de combate e cena</h3>
        <p>
          Efeito, causa e recuperacao usam a mesma regra da ficha e do painel do
          Mestre.
        </p>
      </header>
      <div className="rulebook-status-catalog__grid">
        {TABLETOP_STATUS_CATALOG.map((status) => (
          <article
            className={
              'rulebook-status-card' +
              (requestedStatusId === status.id
                ? ' rulebook-status-card--requested'
                : '')
            }
            id={`rulebook-status-${status.id}`}
            key={status.id}
            style={{ '--status-color': status.color } as CSSProperties}
          >
            <div className="rulebook-status-card__icon">
              <TabletopStatusIcon
                icon={status.icon}
                label={status.label}
                size={25}
              />
            </div>
            <div className="rulebook-status-card__copy">
              <span className="eyebrow">{STATUS_KIND_LABELS[status.kind]}</span>
              <h4>{status.label}</h4>
              <p>{status.summary}</p>
            </div>
            <dl>
              <div>
                <dt>Efeito</dt>
                <dd><RulebookRichText text={status.effect} /></dd>
              </div>
              <div>
                <dt>Causa</dt>
                <dd>{status.cause}</dd>
              </div>
              <div>
                <dt>Como encerrar</dt>
                <dd>{status.recovery}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function BibliographyView() {
  return (
    <section className="rulebook-bibliography">
      <div className="rulebook-bibliography__intro">
        <p className="eyebrow">Fontes da edição</p>
        <h3>Bibliografia consolidada</h3>
        <p>
          As referências internas sustentam as regras e a campanha. As referências
          externas servem apenas como comparação editorial; nenhum texto foi
          reproduzido.
        </p>
      </div>
      <div className="rulebook-bibliography__list">
        {rulebookBibliography.map((entry) => (
          <article key={entry.title}>
            <span>{entry.type === 'canon' ? 'Cânone' : entry.type === 'campaign' ? 'Campanha' : 'Design'}</span>
            <h4>{entry.title}</h4>
            <p>{entry.note}</p>
            {entry.path ? <code>{entry.path}</code> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="rulebook-empty-search">
      <strong>Nenhum capítulo encontrado.</strong>
      <span>Revise a busca “{query}” ou procure por uma regra mais ampla.</span>
    </div>
  )
}

export function BookPage() {
  const { data } = useMasterData()
  const { viewMode } = useViewMode()
  const [searchParams, setSearchParams] = useSearchParams()
  const isGm = viewMode === 'gm'
  const requestedAudience =
    searchParams.get('audience') === 'master' ? 'master' : 'player'
  const requestedSectionId = searchParams.get('section') ?? ''
  const requestedStatusId = searchParams.get('status') ?? ''
  const audience: RulebookAudience =
    isGm && requestedAudience === 'master' ? 'master' : 'player'
  const [query, setQuery] = useState('')
  const volume = getRulebookForAudience(audience)
  const [selectedSectionId, setSelectedSectionId] = useState(
    volume.sections.some((section) => section.id === requestedSectionId)
      ? requestedSectionId
      : volume.sections[0]?.id ?? '',
  )

  const visibleSections = useMemo(
    () => volume.sections.filter((section) => rulebookSectionMatches(section, query)),
    [query, volume.sections],
  )

  if (!data) {
    return null
  }

  const selectedSection =
    visibleSections.find((section) => section.id === selectedSectionId) ??
    visibleSections[0]

  function selectAudience(nextAudience: RulebookAudience) {
    if (nextAudience === 'master' && !isGm) {
      return
    }

    setQuery('')
    const nextSectionId =
      getRulebookForAudience(nextAudience).sections[0]?.id ?? ''
    setSelectedSectionId(nextSectionId)
    setSearchParams({
      audience: nextAudience,
      section: nextSectionId,
    })
  }

  function selectQuickSection(sectionId: string) {
    setQuery('')
    setSelectedSectionId(sectionId)
    setSearchParams({
      audience,
      section: sectionId,
    })
  }

  function selectSection(sectionId: string) {
    setSelectedSectionId(sectionId)
    setSearchParams({
      audience,
      section: sectionId,
    })
  }

  return (
    <main className={'rulebook-page rulebook-page--' + audience}>
      <header className="rulebook-hero">
        <div className="rulebook-hero__sigil" aria-hidden="true">
          <img alt="" src={resolveRuntimeAssetUrl('/assets/ui/fushi-sigil.svg')} />
        </div>
        <div className="rulebook-hero__copy">
          <p className="eyebrow">FUSHI · Regras oficiais</p>
          <h1>{volume.title}</h1>
          <p>{volume.subtitle}</p>
          <div className="rulebook-hero__meta">
            <span>{volume.edition}</span>
            <span>{volume.sections.length} capítulos</span>
            <span>{audience === 'master' ? 'Confidencial' : 'Público da mesa'}</span>
          </div>
        </div>
        {isGm ? (
          <div
            aria-label="Escolher volume"
            className="rulebook-volume-switch"
            role="group"
          >
            <button
              aria-pressed={audience === 'player'}
              className={audience === 'player' ? 'rulebook-volume-switch__active' : ''}
              onClick={() => selectAudience('player')}
              type="button"
            >
              Livro do Jogador
            </button>
            <button
              aria-pressed={audience === 'master'}
              className={audience === 'master' ? 'rulebook-volume-switch__active' : ''}
              onClick={() => selectAudience('master')}
              type="button"
            >
              Livro do Mestre
            </button>
          </div>
        ) : null}
      </header>

      <div
        className={
          'rulebook-confidentiality' +
          (audience === 'master' ? ' rulebook-confidentiality--master' : '')
        }
      >
        <strong>{audience === 'master' ? 'Acesso do Mestre' : 'Leitura do Jogador'}</strong>
        <span>{volume.confidentiality}</span>
      </div>

      <div className="rulebook-workspace">
        <aside className="rulebook-sidebar">
          <label className="rulebook-search">
            <span>Buscar no livro</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: bloquear, agarrar, morte..."
              type="search"
              value={query}
            />
          </label>

          <div className="rulebook-status-legend" aria-label="Estado das regras">
            <RulebookStatusBadge status="canon" />
            <RulebookStatusBadge status="playtest" />
            <RulebookStatusBadge status="development" />
          </div>

          {visibleSections.length > 0 ? (
            <RulebookSectionMenu
              activeSectionId={selectedSection?.id ?? ''}
              onSelect={selectSection}
              sections={visibleSections}
            />
          ) : (
            <EmptySearch query={query} />
          )}
        </aside>

        <article className="rulebook-reader">
          {selectedSection ? (
            <>
              <header className="rulebook-section-header">
                <div className="rulebook-section-header__number">
                  {selectedSection.number}
                </div>
                <div>
                  <div className="rulebook-section-header__status">
                    <RulebookStatusBadge status={selectedSection.status} />
                    {selectedSection.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2>{selectedSection.label}</h2>
                  <p><RulebookRichText text={selectedSection.summary} /></p>
                </div>
              </header>

              {(selectedSection.id === 'comecar' ||
                selectedSection.id === 'escudo') ? (
                <RulebookQuickReference
                  audience={audience}
                  onSelectSection={selectQuickSection}
                  showFullBookLink={false}
                />
              ) : null}

              <div className="rulebook-section-content">
                {selectedSection.blocks.map((block, blockIndex) => (
                  <RulebookBlockView
                    block={block}
                    key={
                      selectedSection.id +
                      '-' +
                      blockIndex +
                      '-' +
                      (block.title ?? block.kind)
                    }
                  />
                ))}
              </div>

              {(selectedSection.id === 'recursos' ||
                selectedSection.id === 'condicoes') ? (
                <RulebookStatusCatalog
                  requestedStatusId={requestedStatusId || undefined}
                />
              ) : null}

              {audience === 'master' && selectedSection.id === 'compendio' ? (
                <RulebookCompendium characters={data.characters.items} />
              ) : null}

              {audience === 'master' && selectedSection.id === 'bibliografia' ? (
                <BibliographyView />
              ) : null}

              <footer className="rulebook-section-footer">
                <span>
                  {volume.title} · {selectedSection.number}
                </span>
                <span>{volume.edition}</span>
              </footer>
            </>
          ) : (
            <EmptySearch query={query} />
          )}
        </article>
      </div>
    </main>
  )
}
