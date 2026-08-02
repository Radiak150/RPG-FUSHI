import { useMemo, useState, type CSSProperties } from 'react'
import {
  CalendarDays,
  Globe2,
  Layers3,
  Presentation,
  Settings2,
  type LucideIcon,
} from 'lucide-react'
import {
  BUILD_ARCHETYPES,
  BUILD_ITEMS,
  ITEM_RARITY_META,
  type FushiBuildArchetype,
} from '../../data/combatCatalog'
import {
  CHARACTER_GRANT_CATALOG,
  CHARACTER_GRANT_CATEGORY_META,
  type CharacterGrantCategory,
} from '../../data/grants/characterGrantCatalog'
import type { CharacterSheet } from '../../data/types'
import {
  TABLETOP_EVENT_DEFINITIONS,
  isTabletopEventActive,
  type TabletopEventId,
  type TabletopEventSystemState,
} from '../../lib/tabletopEvents'
import {
  getTrainingTeamSummary,
  VILLAGE_TRAINING_ARC,
  type TabletopTrainingState,
} from '../../lib/tabletopTraining'
import { TabletopVisualLibrary } from './TabletopVisualLibrary'
import { TabletopVisualThumbnailPicker } from './TabletopVisualThumbnailPicker'

type EventCategoryFilter = 'all' | 'world' | 'presentation' | 'management'

const EVENT_CATEGORY_META: Record<
  EventCategoryFilter,
  { icon: LucideIcon; label: string }
> = {
  all: { icon: Layers3, label: 'Todos os eventos' },
  world: { icon: Globe2, label: 'Mundo' },
  presentation: { icon: Presentation, label: 'Apresentação' },
  management: { icon: Settings2, label: 'Gestão' },
}

interface TabletopEventManagerProps {
  campaignId?: string
  characters: CharacterSheet[]
  eventState: TabletopEventSystemState
  onActivate: (eventId: TabletopEventId) => void
  onAssignCharacterGrant: (input: { characterId: string; grantId: string }) => void
  onClearRarityDraw: () => void
  onClearRarityHistory: () => void
  onDeactivate: (eventId: TabletopEventId) => void
  onOpenTraining: () => void
  onRestartTraining: () => void
  onStartRarityDraw: (input: {
    characterId: string
    characterName: string
    itemId: string
    itemName: string
  }) => void
  onSetVisualThumbnail: (key: string, value: string) => void
  trainingState: TabletopTrainingState | null
  visualThumbnails: Record<string, string>
}

export function TabletopEventManager({
  campaignId,
  characters,
  eventState,
  onActivate,
  onAssignCharacterGrant,
  onClearRarityDraw,
  onClearRarityHistory,
  onDeactivate,
  onOpenTraining,
  onRestartTraining,
  onStartRarityDraw,
  onSetVisualThumbnail,
  trainingState,
  visualThumbnails,
}: TabletopEventManagerProps) {
  const [selectedEventId, setSelectedEventId] =
    useState<TabletopEventId>('initial-training')
  const [eventCategory, setEventCategory] =
    useState<EventCategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [archetypeId, setArchetypeId] = useState<FushiBuildArchetype>('tank')
  const [characterId, setCharacterId] = useState(() => characters[0]?.id ?? '')
  const [itemId, setItemId] = useState(
    () => BUILD_ITEMS.find((item) => item.archetype === 'tank')?.id ?? '',
  )
  const playerCharacters = characters.filter(
    (character) => character.tipo === 'player' && character.isSharedBodyHost !== true,
  )
  const [grantCategory, setGrantCategory] =
    useState<CharacterGrantCategory>('habilidade')
  const [grantCharacterId, setGrantCharacterId] = useState(
    () => playerCharacters[0]?.id ?? '',
  )
  const selectedEvent = TABLETOP_EVENT_DEFINITIONS.find(
    (event) => event.id === selectedEventId,
  ) ?? TABLETOP_EVENT_DEFINITIONS[0]
  const selectedRuntime = eventState.events[selectedEvent.id]
  const SelectedEventIcon = EVENT_CATEGORY_META[selectedEvent.category].icon
  const activeEvents = TABLETOP_EVENT_DEFINITIONS.filter((event) =>
    isTabletopEventActive(eventState, event.id),
  )
  const selectedCharacter = characters.find((character) => character.id === characterId)
  const visibleItems = BUILD_ITEMS.filter((item) => item.archetype === archetypeId)
  const selectedItem = visibleItems.find((item) => item.id === itemId) ?? visibleItems[0]
  const selectedGrantCharacter =
    playerCharacters.find((character) => character.id === grantCharacterId) ??
    playerCharacters[0]
  const visibleGrants = CHARACTER_GRANT_CATALOG.filter(
    (grant) => grant.category === grantCategory,
  )
  const trainingSummary = useMemo(
    () => trainingState ? getTrainingTeamSummary(trainingState) : null,
    [trainingState],
  )
  const rarityHistory = [...eventState.rarityHistory].reverse()
  const visibleEventDefinitions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR')
    return TABLETOP_EVENT_DEFINITIONS.filter((event) => {
      if (eventCategory !== 'all' && event.category !== eventCategory) return false
      if (!normalizedSearch) return true
      return `${event.label} ${event.summary} ${event.description}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearch)
    })
  }, [eventCategory, searchQuery])

  function chooseArchetype(nextArchetype: FushiBuildArchetype) {
    setArchetypeId(nextArchetype)
    setItemId(BUILD_ITEMS.find((item) => item.archetype === nextArchetype)?.id ?? '')
  }

  function characterHasGrant(grantId: string) {
    if (!selectedGrantCharacter) return false

    return Boolean(
      selectedGrantCharacter.habilidadesDetalhadas?.some((feature) => feature.id === grantId) ||
      selectedGrantCharacter.rituais?.some((feature) => feature.id === grantId),
    )
  }

  function getEventCategoryLabel(category: 'world' | 'presentation' | 'management') {
    if (category === 'world') return 'MUNDO'
    if (category === 'management') return 'GESTAO'
    return 'VISUAL'
  }

  function getEventCategoryTitle(category: 'world' | 'presentation' | 'management') {
    if (category === 'world') return 'Evento de mundo'
    if (category === 'management') return 'Evento de gestao'
    return 'Evento visual'
  }

  const sidebar = (
    <>
      {activeEvents.length > 0 ? (
        <div className="tabletop-visual-library__sidebar-section">
          <p className="eyebrow">Ativos agora</p>
          <div className="tabletop-event-manager__active-list">
            {activeEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                type="button"
              >
                <i />
                <span>{event.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="tabletop-visual-library__sidebar-section">
          <p className="eyebrow">Estado da mesa</p>
          <p className="support-copy">Nenhum evento ativo.</p>
        </div>
      )}

      <nav aria-label="Categorias de eventos" className="tabletop-visual-library__nav">
        {(Object.keys(EVENT_CATEGORY_META) as EventCategoryFilter[]).map(
          (category) => {
            const meta = EVENT_CATEGORY_META[category]
            const Icon = meta.icon
            const count =
              category === 'all'
                ? TABLETOP_EVENT_DEFINITIONS.length
                : TABLETOP_EVENT_DEFINITIONS.filter(
                    (event) => event.category === category,
                  ).length
            return (
              <button
                aria-current={eventCategory === category ? 'page' : undefined}
                className={eventCategory === category ? 'is-active' : ''}
                key={category}
                onClick={() => setEventCategory(category)}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />
                <span>{meta.label}</span>
                <small>{count}</small>
              </button>
            )
          },
        )}
      </nav>

      <div className="tabletop-visual-library__sidebar-section">
        <p className="eyebrow">Catálogo</p>
        <div className="tabletop-event-manager__event-list">
          {visibleEventDefinitions.map((event) => {
            const isActive = isTabletopEventActive(eventState, event.id)
            return (
              <button
                aria-current={event.id === selectedEventId ? 'page' : undefined}
                className={event.id === selectedEventId ? 'is-active' : ''}
                data-testid={`event-card-${event.id}`}
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                type="button"
              >
                <span>{event.label}</span>
                <small className={isActive ? 'is-active' : ''}>
                  {isActive ? 'Ativo' : getEventCategoryLabel(event.category)}
                </small>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  return (
    <TabletopVisualLibrary
      actions={
        <span className="tag" data-testid="active-event-count">
          {activeEvents.length} ativo(s)
        </span>
      }
      className="tabletop-event-manager tabletop-event-manager--visual"
      code="EVE"
      contentHeader={
        <div className="tabletop-event-manager__visual-heading">
          <div>
            <p className="eyebrow">{getEventCategoryTitle(selectedEvent.category)}</p>
            <h3>{selectedEvent.label}</h3>
            <p className="support-copy">{selectedEvent.description}</p>
          </div>
          <span className={selectedRuntime.isActive ? 'tag is-success' : 'tag'}>
            {selectedRuntime.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      }
      icon={CalendarDays}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Buscar evento"
      searchValue={searchQuery}
      sidebar={sidebar}
      testId="event-manager"
      title="Eventos da mesa"
    >
      <div className="tabletop-event-manager__legacy">
      <header className="tabletop-event-manager__header">
        <div>
          <p className="eyebrow">EVE · Mestre</p>
          <h3>Eventos da mesa</h3>
          <p className="support-copy">
            Ative apenas as camadas que a cena precisa. Desativar remove regras e apresentacoes temporarias sem apagar o progresso arquivado.
          </p>
        </div>
        <span className="tag" data-testid="active-event-count-legacy">
          {activeEvents.length} ativo(s)
        </span>
      </header>

      {activeEvents.length > 0 ? (
        <div className="tabletop-event-manager__active" aria-label="Eventos ativos">
          {activeEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              type="button"
            >
              <i />
              {event.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="tabletop-event-manager__empty">Mesa no estado-base. Nenhum evento ativo.</p>
      )}

      <div className="tabletop-event-manager__workspace">
        <nav aria-label="Catalogo de eventos" className="tabletop-event-manager__catalog">
          {TABLETOP_EVENT_DEFINITIONS.map((event) => {
            const isActive = isTabletopEventActive(eventState, event.id)

            return (
              <button
                aria-current={event.id === selectedEventId ? 'true' : undefined}
                className={event.id === selectedEventId ? 'is-selected' : ''}
                data-testid={`event-card-legacy-${event.id}`}
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                type="button"
              >
                <span>{getEventCategoryLabel(event.category)}</span>
                <strong>{event.label}</strong>
                <small>{event.summary}</small>
                <b className={isActive ? 'is-active' : ''}>{isActive ? 'ATIVO' : 'INATIVO'}</b>
              </button>
            )
          })}
        </nav>

        <section className="tabletop-event-manager__detail">
          <TabletopVisualThumbnailPicker
            alt={selectedEvent.label}
            campaignId={campaignId}
            className="tabletop-visual-thumbnail--feature tabletop-event-manager__thumbnail"
            fallback={<SelectedEventIcon size={42} />}
            onChange={(value) =>
              onSetVisualThumbnail(`event:${selectedEvent.id}`, value)
            }
            value={visualThumbnails[`event:${selectedEvent.id}`]}
          />
          <header>
            <div>
              <p className="eyebrow">{getEventCategoryTitle(selectedEvent.category)}</p>
              <h3>{selectedEvent.label}</h3>
              <p>{selectedEvent.description}</p>
            </div>
            <span className={selectedRuntime.isActive ? 'tag is-success' : 'tag'}>
              {selectedRuntime.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </header>

          <div className="tabletop-event-manager__contract">
            <span>Superficie publica</span>
            <strong>{selectedEvent.playerSurface}</strong>
            <small>Eventos ativos coexistem; desativar este evento nao encerra os demais.</small>
          </div>

          {selectedEvent.id === 'initial-training' ? (
            <div className="tabletop-event-manager__controls" data-testid="training-event-controls">
              <div className="tabletop-event-manager__metrics">
                <div>
                  <span>Participantes</span>
                  <strong>{trainingState?.participants.length ?? 0}</strong>
                </div>
                <div>
                  <span>Estacoes concluidas</span>
                  <strong>{trainingSummary?.completedStationIds.length ?? 0}/{VILLAGE_TRAINING_ARC.stations.length}</strong>
                </div>
                <div>
                  <span>Selos</span>
                  <strong>{trainingSummary?.seals ?? 0}</strong>
                </div>
              </div>
              <div className="tabletop-event-manager__actions">
                {selectedRuntime.isActive ? (
                  <>
                    <button className="button button--primary" onClick={onOpenTraining} type="button">
                      Abrir controle
                    </button>
                    <button className="button" onClick={onRestartTraining} type="button">
                      Reiniciar progresso
                    </button>
                    <button
                      className="button button--danger"
                      data-testid="deactivate-initial-training"
                      onClick={() => onDeactivate('initial-training')}
                      type="button"
                    >
                      Desativar evento
                    </button>
                  </>
                ) : (
                  <button
                    className="button button--primary"
                    data-testid="activate-initial-training"
                    onClick={() => onActivate('initial-training')}
                    type="button"
                  >
                    Ativar evento
                  </button>
                )}
              </div>
            </div>
          ) : selectedEvent.id === 'skill-assignment' ? (
            <div
              className="tabletop-event-manager__controls"
              data-testid="skill-assignment-controls"
            >
              {selectedRuntime.isActive ? (
                <>
                  <div className="tabletop-skill-grant__toolbar">
                    <label>
                      Jogador que vai receber
                      <select
                        data-testid="skill-grant-character"
                        onChange={(event) => setGrantCharacterId(event.target.value)}
                        value={selectedGrantCharacter?.id ?? ''}
                      >
                        {playerCharacters.map((character) => (
                          <option key={character.id} value={character.id}>{character.nome}</option>
                        ))}
                      </select>
                    </label>
                    <div className="tabletop-skill-grant__tabs" role="tablist">
                      {(Object.keys(CHARACTER_GRANT_CATEGORY_META) as CharacterGrantCategory[]).map(
                        (category) => {
                          const meta = CHARACTER_GRANT_CATEGORY_META[category]
                          return (
                            <button
                              aria-selected={grantCategory === category}
                              className={grantCategory === category ? 'is-active' : ''}
                              data-testid={`skill-grant-tab-${category}`}
                              key={category}
                              onClick={() => setGrantCategory(category)}
                              role="tab"
                              type="button"
                            >
                              <span>{meta.label}</span>
                              <small>{meta.statusLabel}</small>
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>

                  <div className="tabletop-skill-grant__catalog" data-testid="skill-grant-catalog">
                    {visibleGrants.length > 0 ? (
                      visibleGrants.map((grant) => {
                        const assigned = characterHasGrant(grant.id)
                        const automation = grant.feature?.automation
                        const costs = automation?.costs
                          ?.map((cost) => `${cost.amount} ${cost.resource.toUpperCase()}`)
                          .join(' + ')

                        return (
                          <article className="tabletop-skill-grant__card" key={grant.id}>
                            <header>
                              <div>
                                <span>{grant.source}</span>
                                <strong>{grant.title}</strong>
                              </div>
                              <b>{grant.status === 'ready' ? 'PRONTO' : 'EM CONSTRUCAO'}</b>
                            </header>
                            <p>{grant.feature?.descricao ?? grant.summary}</p>
                            <div className="tabletop-skill-grant__facts">
                              <span>{automation?.activation ?? 'Ativacao definida pelo Mestre'}</span>
                              <span>{costs || 'Sem custo cadastrado'}</span>
                              <span>{automation?.range ?? 'Alcance narrativo'}</span>
                            </div>
                            <footer>
                              <small>
                                Origem sugerida: {grant.recommendedCharacterName ?? 'Livre'}
                              </small>
                              <button
                                className={assigned ? 'button is-assigned' : 'button button--primary'}
                                data-testid={`assign-character-grant-${grant.id}`}
                                disabled={
                                  !selectedGrantCharacter ||
                                  grant.status !== 'ready' ||
                                  !grant.feature ||
                                  assigned
                                }
                                onClick={() => {
                                  if (!selectedGrantCharacter) return
                                  onAssignCharacterGrant({
                                    characterId: selectedGrantCharacter.id,
                                    grantId: grant.id,
                                  })
                                }}
                                type="button"
                              >
                                {assigned
                                  ? 'Ja esta na ficha'
                                  : `Atribuir a ${selectedGrantCharacter?.nome ?? 'jogador'}`}
                              </button>
                            </footer>
                          </article>
                        )
                      })
                    ) : (
                      <div className="tabletop-skill-grant__construction">
                        <span>EM CONSTRUCAO</span>
                        <strong>{CHARACTER_GRANT_CATEGORY_META[grantCategory].label}</strong>
                        <p>
                          Nenhum conteudo canonico aprovado nesta categoria. O catalogo esta
                          pronto para receber novas entradas sem alterar a ficha manualmente.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="tabletop-event-manager__actions">
                    <button
                      className="button button--danger"
                      data-testid="deactivate-skill-assignment"
                      onClick={() => onDeactivate('skill-assignment')}
                      type="button"
                    >
                      Desativar evento
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="button button--primary"
                  data-testid="activate-skill-assignment"
                  onClick={() => onActivate('skill-assignment')}
                  type="button"
                >
                  Ativar evento
                </button>
              )}
            </div>
          ) : (
            <div className="tabletop-event-manager__controls" data-testid="rarity-event-controls">
              {selectedRuntime.isActive ? (
                <>
                  <div className="tabletop-event-manager__form">
                    <label>
                      Personagem
                      <select onChange={(event) => setCharacterId(event.target.value)} value={selectedCharacter?.id ?? ''}>
                        {characters.map((character) => (
                          <option key={character.id} value={character.id}>{character.nome}</option>
                        ))}
                      </select>
                    </label>
                    <div>
                      <span>Arquetipo</span>
                      <div className="tabletop-event-manager__segments">
                        {BUILD_ARCHETYPES.map((archetype) => (
                          <button
                            className={archetype.id === archetypeId ? 'is-active' : ''}
                            key={archetype.id}
                            onClick={() => chooseArchetype(archetype.id)}
                            style={{ '--event-accent': archetype.color } as CSSProperties}
                            type="button"
                          >
                            {archetype.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label>
                      Item encontrado
                      <select onChange={(event) => setItemId(event.target.value)} value={selectedItem?.id ?? ''}>
                        {visibleItems.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <section className="tabletop-event-manager__history" data-testid="rarity-draw-history">
                    <header>
                      <div>
                        <span>Backlog do evento</span>
                        <strong>{rarityHistory.length} sorteio(s)</strong>
                      </div>
                      <div className="tabletop-event-manager__history-tools">
                        <small>Apenas o Mestre ve o d10 bruto.</small>
                        <button
                          className="button button--danger"
                          data-testid="clear-rarity-history"
                          disabled={rarityHistory.length === 0}
                          onClick={() => {
                            if (window.confirm('Limpar somente o backlog de sorteios deste EVE?')) {
                              onClearRarityHistory()
                            }
                          }}
                          type="button"
                        >
                          Limpar backlog
                        </button>
                      </div>
                    </header>
                    {rarityHistory.length > 0 ? (
                      <div className="tabletop-event-manager__history-list">
                        {rarityHistory.map((entry) => {
                          const rarityMeta = ITEM_RARITY_META[entry.rarity]
                          return (
                            <article
                              key={entry.drawId}
                              style={{ '--rarity-color': rarityMeta.color } as CSSProperties}
                            >
                              <div>
                                <strong>{entry.itemName}</strong>
                                <span>{entry.characterName}</span>
                              </div>
                              <b style={{ '--rarity-color': rarityMeta.color } as CSSProperties}>
                                {rarityMeta.label} · d10: {entry.roll}
                              </b>
                              <time dateTime={new Date(entry.rolledAt).toISOString()}>
                                {new Date(entry.rolledAt).toLocaleString('pt-BR')}
                              </time>
                            </article>
                          )
                        })}
                      </div>
                    ) : (
                      <p>Nenhum sorteio registrado.</p>
                    )}
                  </section>

                  <div className="tabletop-event-manager__actions">
                    <button
                      className="button button--primary"
                      data-testid="start-rarity-draw"
                      disabled={!selectedCharacter || !selectedItem}
                      onClick={() => {
                        if (!selectedCharacter || !selectedItem) return
                        onStartRarityDraw({
                          characterId: selectedCharacter.id,
                          characterName: selectedCharacter.nome,
                          itemId: selectedItem.id,
                          itemName: selectedItem.name,
                        })
                      }}
                      type="button"
                    >
                      Sortear e transmitir
                    </button>
                    {eventState.rarityDraw.phase === 'rolling' ? (
                      <button className="button" onClick={onClearRarityDraw} type="button">
                        Encerrar apresentacao atual
                      </button>
                    ) : null}
                    <button
                      className="button button--danger"
                      data-testid="deactivate-build-rarity-draw"
                      onClick={() => onDeactivate('build-rarity-draw')}
                      type="button"
                    >
                      Desativar evento
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="button button--primary"
                  data-testid="activate-build-rarity-draw"
                  onClick={() => onActivate('build-rarity-draw')}
                  type="button"
                >
                  Ativar evento
                </button>
              )}
            </div>
          )}
        </section>
      </div>
      </div>
    </TabletopVisualLibrary>
  )
}
