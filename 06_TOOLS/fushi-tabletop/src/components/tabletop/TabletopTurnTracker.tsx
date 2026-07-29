import { useState, type CSSProperties, type DragEvent } from 'react'
import type {
  CharacterFeatureActivationSource,
  CharacterFeatureDetail,
} from '../../data/types'
import type {
  TabletopTurnActionId,
  TabletopTurnActionRequest,
  TabletopTurnState,
} from '../../lib/tabletopSession'
import { COMBAT_MANEUVER_DEFINITIONS } from '../../lib/combatV2'

const TABLETOP_TURN_ACTIONS: Array<{
  id: TabletopTurnActionId
  label: string
}> = [
  { id: 'fala', label: 'Fala' },
  { id: 'padrao', label: 'Principal' },
  { id: 'bonus', label: 'Curta' },
  { id: 'movimento', label: 'Movimento' },
  { id: 'reacao', label: 'Reacao' },
]

export interface TabletopTurnParticipantView {
  characterId: string
  color: string
  id: string
  imageUrl?: string
  isActive: boolean
  isNext: boolean
  label: string
  movementLabel?: string
  name: string
  tokenId: string
}

export interface TabletopTurnCandidate {
  color: string
  id: string
  imageUrl?: string
  isHidden: boolean
  isSelected: boolean
  isStealthed: boolean
  label: string
  name: string
}

export interface TabletopTurnFeatureAction {
  disabled: boolean
  feature: CharacterFeatureDetail
  id: string
  label: string
  reason?: string
  source: CharacterFeatureActivationSource
  timing: TabletopTurnActionId
}

interface TabletopTurnOverlayProps {
  activeParticipant: TabletopTurnParticipantView | null
  canControlActiveParticipant: boolean
  featureActions: TabletopTurnFeatureAction[]
  isGm: boolean
  onActionToggle: (actionId: TabletopTurnActionId) => void
  onEndCombat: () => void
  onFeatureAction: (action: TabletopTurnFeatureAction) => void
  onResolveActionRequest: (request: TabletopTurnActionRequest, approve: boolean) => void
  onManeuverAction: (maneuverId: string, label: string, timing: TabletopTurnActionId) => void
  onNextTurn: () => void
  onOpenParticipant: (tokenId: string) => void
  onPreviousTurn: () => void
  participants: TabletopTurnParticipantView[]
  pendingActionRequests: TabletopTurnActionRequest[]
  turnState: TabletopTurnState
}

interface TabletopTurnSetupPanelProps {
  activeTokenId: string
  candidates: TabletopTurnCandidate[]
  onApply: () => void
  onMove: (tokenId: string, direction: -1 | 1) => void
  onReorder: (sourceTokenId: string, targetTokenId: string) => void
  onSetActive: (tokenId: string) => void
  onToggleCandidate: (tokenId: string) => void
  selectedTokenIds: string[]
}

export function TabletopTurnOverlay({
  activeParticipant,
  canControlActiveParticipant,
  featureActions,
  isGm,
  onActionToggle,
  onEndCombat,
  onFeatureAction,
  onResolveActionRequest,
  onManeuverAction,
  onNextTurn,
  onOpenParticipant,
  onPreviousTurn,
  pendingActionRequests,
  participants,
  turnState,
}: TabletopTurnOverlayProps) {
  const activeActions = activeParticipant
    ? turnState.usedActions[activeParticipant.id] ?? {}
    : {}
  const nextParticipant = participants.find((participant) => participant.isNext) ?? null

  return (
    <div className="tabletop-turn-layer" aria-live="polite">
      <div className="tabletop-turn-order" aria-label="Ordem de turnos">
        {participants.map((participant) => (
          <button
            className={`tabletop-turn-order__item${
              participant.isActive ? ' tabletop-turn-order__item--active' : ''
            }${participant.isNext ? ' tabletop-turn-order__item--next' : ''}`}
            key={participant.id}
            onClick={() => (isGm ? onOpenParticipant(participant.tokenId) : undefined)}
            style={{ '--turn-color': participant.color } as CSSProperties}
            title={participant.name}
            type="button"
          >
            {participant.imageUrl ? (
              <img alt="" src={participant.imageUrl} />
            ) : (
              <span>{participant.label}</span>
            )}
          </button>
        ))}
      </div>

      <div className="tabletop-turn-actions">
        <div className="tabletop-turn-actions__label">
          <span>Turno</span>
          <strong>{activeParticipant?.name ?? 'Reservado do mestre'}</strong>
          {activeParticipant?.movementLabel ? (
            <small>Movimento {activeParticipant.movementLabel}</small>
          ) : null}
        </div>
        {activeParticipant ? (
          <div className="tabletop-turn-actions__center">
            <div className="tabletop-turn-actions__buttons">
              {TABLETOP_TURN_ACTIONS.map((action) => {
                const used = activeActions[action.id] === true

                return (
                  <button
                    className={`tabletop-turn-action${used ? ' tabletop-turn-action--used' : ''}`}
                    disabled={!isGm}
                    key={action.id}
                    onClick={() => onActionToggle(action.id)}
                    type="button"
                  >
                    {action.label}
                  </button>
                )
              })}
            </div>
            {featureActions.length > 0 ? (
              <details className="tabletop-turn-feature-actions">
                <summary>
                  {isGm ? 'Acoes do participante' : 'Acoes da sua ficha'}
                  <span>{featureActions.length}</span>
                </summary>
                <div className="tabletop-turn-feature-actions__grid">
                  {featureActions.map((action) => {
                    const used = activeActions[action.timing] === true

                    return (
                      <button
                        className="tabletop-turn-feature-action"
                        disabled={!isGm && !canControlActiveParticipant}
                        key={action.id}
                        onClick={() => onFeatureAction(action)}
                        title={
                          action.reason ||
                          (used
                            ? 'Acao ja usada. Clique para consultar na ficha.'
                            : 'Abrir esta acao na ficha')
                        }
                        type="button"
                      >
                        <strong>{action.label}</strong>
                        <span>
                          {used
                            ? 'usada'
                            : action.disabled
                              ? action.reason ?? 'indisponivel'
                              : action.timing}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </details>
            ) : null}
            <details className="tabletop-turn-maneuvers">
              <summary>Manobras taticas</summary>
              <div className="tabletop-turn-maneuvers__grid">
                {COMBAT_MANEUVER_DEFINITIONS.map((maneuver) => (
                  <article className="tabletop-turn-maneuver" key={maneuver.id}>
                    <div>
                      <strong>{maneuver.label}</strong>
                      <span>{maneuver.timing === 'principal' ? 'Principal' : 'Curta'}</span>
                    </div>
                    <p>{maneuver.test}</p>
                    <small>{maneuver.result}</small>
                    <button
                      className="button button--compact"
                      disabled={
                        activeActions[
                          maneuver.timing === 'principal' ? 'padrao' : 'bonus'
                        ] === true ||
                        (!isGm && !canControlActiveParticipant)
                      }
                      onClick={() =>
                        onManeuverAction(
                          maneuver.id,
                          maneuver.label,
                          maneuver.timing === 'principal' ? 'padrao' : 'bonus',
                        )
                      }
                      type="button"
                    >
                      {isGm ? 'Usar manobra' : 'Pedir ao Mestre'}
                    </button>
                  </article>
                ))}
              </div>
            </details>
            {isGm && pendingActionRequests.length > 0 ? (
              <div className="tabletop-turn-requests" aria-live="polite">
                <p className="eyebrow">Pedidos dos jogadores</p>
                {pendingActionRequests.map((request) => (
                  <article className="tabletop-turn-request" key={request.id}>
                    <div>
                      <strong>{request.label}</strong>
                      <span>{request.playerId} · {request.timing}</span>
                    </div>
                    <div className="button-row">
                      <button
                        className="button button--primary button--compact"
                        onClick={() => onResolveActionRequest(request, true)}
                        type="button"
                      >
                        Aprovar
                      </button>
                      <button
                        className="button button--compact"
                        onClick={() => onResolveActionRequest(request, false)}
                        type="button"
                      >
                        Recusar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p>Participante oculto em acao.</p>
        )}
        <div className="tabletop-turn-actions__next">
          <button
            className="tabletop-turn-previous"
            disabled={!isGm}
            onClick={onPreviousTurn}
            title="Voltar turno"
            type="button"
          >
            &lt;
          </button>
          <button
            className="tabletop-turn-end"
            disabled={!isGm}
            onClick={onEndCombat}
            title="Encerrar combate"
            type="button"
          >
            x
          </button>
          <button
            className="tabletop-turn-next"
            disabled={!isGm}
            onClick={onNextTurn}
            type="button"
          >
            <span>Prox turno</span>
            <strong>{nextParticipant?.label ?? '--'}</strong>
          </button>
        </div>
      </div>
    </div>
  )
}

export function TabletopTurnSetupPanel({
  activeTokenId,
  candidates,
  onApply,
  onMove,
  onReorder,
  onSetActive,
  onToggleCandidate,
  selectedTokenIds,
}: TabletopTurnSetupPanelProps) {
  const [draggingTokenId, setDraggingTokenId] = useState('')
  const selectedCandidates = selectedTokenIds
    .map((tokenId) => candidates.find((candidate) => candidate.id === tokenId) ?? null)
    .filter((candidate): candidate is TabletopTurnCandidate => Boolean(candidate))

  function handleSequenceDragStart(event: DragEvent<HTMLDivElement>, tokenId: string) {
    setDraggingTokenId(tokenId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', tokenId)
  }

  function handleSequenceDrop(event: DragEvent<HTMLDivElement>, targetTokenId: string) {
    event.preventDefault()
    const sourceTokenId = event.dataTransfer.getData('text/plain') || draggingTokenId

    setDraggingTokenId('')

    if (!sourceTokenId || sourceTokenId === targetTokenId) {
      return
    }

    onReorder(sourceTokenId, targetTokenId)
  }

  return (
    <div className="tabletop-turn-setup">
      <article className="list-card">
        <div className="list-card__top">
          <div>
            <p className="eyebrow">Turnos</p>
            <h3>Participantes e ordem</h3>
          </div>
          <span className="tag">{selectedTokenIds.length} no turno</span>
        </div>
        <p className="support-copy">
          O mestre controla o combate. Jogadores apenas veem a ordem e as acoes em tempo real.
        </p>
        <div className="tabletop-turn-candidates">
          {candidates.map((candidate) => (
            <button
              className={`tabletop-turn-candidate${
                candidate.isSelected ? ' tabletop-turn-candidate--selected' : ''
              }`}
              key={candidate.id}
              onClick={() => onToggleCandidate(candidate.id)}
              type="button"
            >
              {candidate.imageUrl ? <img alt="" src={candidate.imageUrl} /> : <span>{candidate.label}</span>}
              <strong>{candidate.name}</strong>
              {candidate.isHidden ? <em>Oculto</em> : null}
              {candidate.isStealthed ? <em>Furtivo</em> : null}
            </button>
          ))}
        </div>
      </article>

      <article className="list-card">
        <div className="list-card__top">
          <div>
            <p className="eyebrow">Ordem</p>
            <h3>Sequencia do combate</h3>
          </div>
          <button className="button button--primary" onClick={onApply} type="button">
            Aplicar
          </button>
        </div>
        <div className="tabletop-turn-sequence">
          {selectedCandidates.length > 0 ? (
            selectedCandidates.map((candidate, index) => (
              <div
                className={`tabletop-turn-sequence__row${
                  activeTokenId === candidate.id ? ' tabletop-turn-sequence__row--active' : ''
                }${
                  draggingTokenId === candidate.id ? ' tabletop-turn-sequence__row--dragging' : ''
                }`}
                draggable
                key={candidate.id}
                onDragEnd={() => setDraggingTokenId('')}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDragStart={(event) => handleSequenceDragStart(event, candidate.id)}
                onDrop={(event) => handleSequenceDrop(event, candidate.id)}
                title="Arraste para reordenar"
              >
                <span>{index + 1}</span>
                {candidate.imageUrl ? <img alt="" src={candidate.imageUrl} /> : <i>{candidate.label}</i>}
                <strong>{candidate.name}</strong>
                <button onClick={() => onMove(candidate.id, -1)} type="button">
                  ^
                </button>
                <button onClick={() => onMove(candidate.id, 1)} type="button">
                  v
                </button>
                <button onClick={() => onSetActive(candidate.id)} type="button">
                  Vez
                </button>
              </div>
            ))
          ) : (
            <p className="support-copy">Selecione tokens para iniciar o controle de turnos.</p>
          )}
        </div>
      </article>
    </div>
  )
}
