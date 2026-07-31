import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HistoryQuickReference } from '../components/product/HistoryQuickReference'
import {
  RulebookBlockView,
  RulebookRichText,
  RulebookSectionMenu,
  RulebookStatusBadge,
} from '../components/product/RulebookContent'
import {
  getHistoryBookForAudience,
  historySectionMatches,
  type RulebookAudience,
} from '../data/history'
import { useViewMode } from '../hooks/useViewMode'
import { resolveRuntimeAssetUrl } from '../lib/runtimeAssets'

function EmptyHistorySearch({ query }: { query: string }) {
  return (
    <div className="rulebook-empty-search">
      <strong>Nenhum registro encontrado.</strong>
      <span>Revise a busca “{query}” ou procure por uma sessão, pessoa ou local.</span>
    </div>
  )
}

export function HistoryPage() {
  const { viewMode } = useViewMode()
  const [searchParams, setSearchParams] = useSearchParams()
  const isGm = viewMode === 'gm'
  const requestedAudience =
    searchParams.get('audience') === 'master' ? 'master' : 'player'
  const requestedSectionId = searchParams.get('section') ?? ''
  const audience: RulebookAudience =
    isGm && requestedAudience === 'master' ? 'master' : 'player'
  const [query, setQuery] = useState('')
  const volume = getHistoryBookForAudience(audience)
  const selectedSectionId = volume.sections.some(
    (section) => section.id === requestedSectionId,
  )
    ? requestedSectionId
    : volume.sections[0]?.id ?? ''

  const visibleSections = useMemo(
    () =>
      volume.sections.filter((section) =>
        historySectionMatches(section, query),
      ),
    [query, volume.sections],
  )

  const selectedSection =
    visibleSections.find((section) => section.id === selectedSectionId) ??
    visibleSections[0]

  function selectAudience(nextAudience: RulebookAudience) {
    if (nextAudience === 'master' && !isGm) {
      return
    }

    const nextSectionId =
      getHistoryBookForAudience(nextAudience).sections[0]?.id ?? ''
    setQuery('')
    setSearchParams({
      audience: nextAudience,
      section: nextSectionId,
    })
  }

  function selectSection(sectionId: string) {
    setSearchParams({
      audience,
      section: sectionId,
    })
  }

  return (
    <main
      className={`rulebook-page history-page rulebook-page--${audience}`}
      data-testid="history-page"
    >
      <header className="rulebook-hero history-hero">
        <div className="rulebook-hero__sigil" aria-hidden="true">
          <img alt="" src={resolveRuntimeAssetUrl('/assets/ui/fushi-sigil.svg')} />
        </div>
        <div className="rulebook-hero__copy">
          <p className="eyebrow">FUSHI · Memória da campanha</p>
          <h1>{volume.title}</h1>
          <p>{volume.subtitle}</p>
          <div className="rulebook-hero__meta">
            <span>{volume.edition}</span>
            <span>{volume.sections.length} registros</span>
            <span>{audience === 'master' ? 'Confidencial' : 'Visto em mesa'}</span>
          </div>
        </div>

        {isGm ? (
          <div
            aria-label="Escolher versão da história"
            className="rulebook-volume-switch"
            role="group"
          >
            <button
              aria-pressed={audience === 'player'}
              className={
                audience === 'player' ? 'rulebook-volume-switch__active' : ''
              }
              data-testid="history-audience-player"
              onClick={() => selectAudience('player')}
              type="button"
            >
              Crônica pública
            </button>
            <button
              aria-pressed={audience === 'master'}
              className={
                audience === 'master' ? 'rulebook-volume-switch__active' : ''
              }
              data-testid="history-audience-master"
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
        <strong>
          {audience === 'master' ? 'Continuidade do Mestre' : 'Memória pública'}
        </strong>
        <span>{volume.confidentiality}</span>
      </div>

      <div className="rulebook-workspace">
        <aside className="rulebook-sidebar">
          <label className="rulebook-search">
            <span>Buscar na história</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: Riacho, Nilo, Sessão 3..."
              type="search"
              value={query}
            />
          </label>

          <div className="rulebook-status-legend" aria-label="Estado do registro">
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
            <EmptyHistorySearch query={query} />
          )}
        </aside>

        <article className="rulebook-reader history-reader">
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
                  <p>
                    <RulebookRichText text={selectedSection.summary} />
                  </p>
                </div>
              </header>

              {selectedSection.id === volume.sections[0]?.id ? (
                <HistoryQuickReference
                  audience={audience}
                  onSelectSection={selectSection}
                  showFullBookLink={false}
                />
              ) : null}

              <div className="rulebook-section-content">
                {selectedSection.blocks.map((block, blockIndex) => (
                  <RulebookBlockView
                    block={block}
                    key={`${selectedSection.id}-${blockIndex}-${block.title ?? block.kind}`}
                  />
                ))}
              </div>

              <footer className="rulebook-section-footer">
                <span>
                  {volume.title} · {selectedSection.number}
                </span>
                <span>{volume.edition}</span>
              </footer>
            </>
          ) : (
            <EmptyHistorySearch query={query} />
          )}
        </article>
      </div>
    </main>
  )
}
