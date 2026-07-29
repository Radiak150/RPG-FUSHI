import { useMemo, useState, type CSSProperties } from 'react'
import { getInitialTrainingReward } from '../../data/training/initialTrainingRewards'
import {
  getTrainingParticipantSummary,
  getTrainingSetbackMilestone,
  getTrainingTeamSummary,
  isTrainingFinalReady,
  VILLAGE_TRAINING_ARC,
  type TabletopTrainingFinalOutcome,
  type TabletopTrainingOutcome,
  type TabletopTrainingState,
} from '../../lib/tabletopTraining'

interface TabletopTrainingArcProps {
  assignedRewardCharacterIds: string[]
  isGm: boolean
  onFinalOutcome: (
    participantId: string,
    stationId: string,
    outcome: TabletopTrainingFinalOutcome,
  ) => void
  onAssignRewardAbility: (participantId: string) => void
  onParticipantOutcome: (
    participantId: string,
    stationId: string,
    outcome: TabletopTrainingOutcome,
  ) => void
  onRestart: () => void
  onSelectStation: (participantId: string, stationId: string) => void
  onSetActive: (isActive: boolean) => void
  onUnlockFinal: () => void
  openRequestId?: number
  state: TabletopTrainingState
  viewerCharacterId?: string
}

function ProgressBar({ current, maximum, tone = 'default' }: {
  current: number
  maximum: number
  tone?: 'default' | 'danger' | 'gold'
}) {
  const percent = maximum > 0 ? Math.min(100, Math.max(0, (current / maximum) * 100)) : 0

  return (
    <span className={`tabletop-training-progress tabletop-training-progress--${tone}`}>
      <span style={{ width: `${percent}%` }} />
    </span>
  )
}

export function TabletopTrainingArc({
  assignedRewardCharacterIds,
  isGm,
  onFinalOutcome,
  onAssignRewardAbility,
  onParticipantOutcome,
  onRestart,
  onSelectStation,
  onSetActive,
  onUnlockFinal,
  openRequestId = 0,
  state,
  viewerCharacterId = '',
}: TabletopTrainingArcProps) {
  const viewerParticipant = state.participants.find(
    (participant) => participant.characterId === viewerCharacterId,
  )
  const [isExpanded, setIsExpanded] = useState(openRequestId > 0)
  const [selectedParticipantId, setSelectedParticipantId] = useState(
    viewerParticipant?.id ?? state.participants[0]?.id ?? '',
  )
  const [selectedStationId, setSelectedStationId] = useState(
    viewerParticipant?.activeStationId ??
      state.participants[0]?.activeStationId ??
      VILLAGE_TRAINING_ARC.stations[0]?.id ??
      '',
  )
  const [recoveredFushi, setRecoveredFushi] = useState('0')
  const [selectedEmotion, setSelectedEmotion] = useState<string>(
    VILLAGE_TRAINING_ARC.finalTrial.emotions[0]?.id ?? 'medo',
  )

  const selectedParticipant =
    state.participants.find((participant) => participant.id === selectedParticipantId) ??
    viewerParticipant ??
    state.participants[0] ??
    null
  const selectedStation =
    VILLAGE_TRAINING_ARC.stations.find((station) => station.id === selectedStationId) ??
    null
  const selectedProgress = selectedParticipant && selectedStation
    ? selectedParticipant.stations[selectedStation.id]
    : null
  const teamSummary = useMemo(() => getTrainingTeamSummary(state), [state])
  const finalReady = isTrainingFinalReady(state)
  const finalDefinition = VILLAGE_TRAINING_ARC.finalTrial
  const selectedSummary = selectedParticipant
    ? getTrainingParticipantSummary(selectedParticipant)
    : null
  const selectedSetbackMilestone = getTrainingSetbackMilestone(
    selectedSummary?.totalSetbacks ?? 0,
  )
  const finalProgressMaximum = state.participants.length * finalDefinition.goal
  const masteredParticipants = state.participants.filter(
    (participant) => participant.finalMastery.stage >= finalDefinition.goal,
  ).length
  const recommendedFinalGateReached =
    state.participants.length > 0 &&
    state.participants.every(
      (participant) =>
        getTrainingParticipantSummary(participant).completedStations >=
        VILLAGE_TRAINING_ARC.stations.length,
    )

  return (
    <div className="tabletop-training-layer" aria-live="polite" data-testid="training-arc-overlay">
      <section
        className={`tabletop-training-dock${isExpanded ? ' tabletop-training-dock--expanded' : ''}${
          state.isCompleted ? ' tabletop-training-dock--completed' : ''
        }`}
      >
        <header className="tabletop-training-header">
          <div>
            <span>{state.isCompleted ? 'Arco concluido' : 'Treinamento ativo'}</span>
            <strong>{VILLAGE_TRAINING_ARC.title}</strong>
            <small>{VILLAGE_TRAINING_ARC.subtitle}</small>
          </div>
          <div className="tabletop-training-header__status">
            <b>{teamSummary.completedAssignments}/{teamSummary.maxAssignments}</b>
            <span>desafios</span>
            <button
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((current) => !current)}
              title={isExpanded ? 'Recolher treinamento' : 'Abrir treinamento'}
              type="button"
            >
              {isExpanded ? 'x' : '>'}
            </button>
          </div>
          <ProgressBar
            current={teamSummary.totalMarks}
            maximum={teamSummary.maxMarks}
            tone="gold"
          />
        </header>

        <div className="tabletop-training-roster" aria-label="Progresso dos participantes">
          {state.participants.map((participant) => {
            const summary = getTrainingParticipantSummary(participant)
            const activeStation = VILLAGE_TRAINING_ARC.stations.find(
              (station) => station.id === participant.activeStationId,
            )
            const isViewer = participant.characterId === viewerCharacterId
            const isSelected = participant.id === selectedParticipant?.id

            return (
              <button
                className={`tabletop-training-participant${
                  isSelected ? ' tabletop-training-participant--selected' : ''
                }${isViewer ? ' tabletop-training-participant--viewer' : ''}`}
                data-testid={`training-participant-${participant.id}`}
                key={participant.id}
                onClick={() => {
                  setSelectedParticipantId(participant.id)
                  setSelectedStationId(participant.activeStationId)
                  setIsExpanded(true)
                }}
                style={{ '--training-color': participant.color } as CSSProperties}
                type="button"
              >
                <i>{participant.label || participant.name.slice(0, 2).toUpperCase()}</i>
                <span>
                  <strong>{participant.name}</strong>
                  <small>{activeStation?.shortName ?? 'Sem estacao'}</small>
                </span>
                <b>{summary.totalMarks}/{VILLAGE_TRAINING_ARC.stations.length * VILLAGE_TRAINING_ARC.stationGoal}</b>
                <ProgressBar
                  current={summary.totalMarks}
                  maximum={VILLAGE_TRAINING_ARC.stations.length * VILLAGE_TRAINING_ARC.stationGoal}
                />
              </button>
            )
          })}
        </div>

        {isExpanded ? (
          <div className="tabletop-training-body">
            <nav className="tabletop-training-stations" aria-label="Estacoes de treinamento">
              {VILLAGE_TRAINING_ARC.stations.map((station) => {
                const completedByTeam = state.participants.filter(
                  (participant) => participant.stations[station.id]?.status === 'completed',
                ).length

                return (
                  <button
                    className={station.id === selectedStation?.id ? 'is-active' : ''}
                    key={station.id}
                    onClick={() => setSelectedStationId(station.id)}
                    type="button"
                  >
                    <span>{station.code}</span>
                    <strong>{station.shortName}</strong>
                    <small>{completedByTeam}/{state.participants.length}</small>
                  </button>
                )
              })}
              <button
                className={state.finalTrial.isActive || state.finalTrial.isCompleted ? 'is-active is-final' : 'is-final'}
                disabled={!state.finalTrial.isUnlocked}
                onClick={() => setSelectedStationId(finalDefinition.id)}
                type="button"
              >
                <span>F</span>
                <strong>Segundo Sino</strong>
                <small>{state.finalTrial.isUnlocked ? 'aberto' : 'bloqueado'}</small>
              </button>
            </nav>

            <div className="tabletop-training-content">
              {selectedStationId === finalDefinition.id && state.finalTrial.isUnlocked ? (
                <section className="tabletop-training-final">
                  <div className="tabletop-training-content__title">
                    <div>
                      <span>Prova final</span>
                      <h3>{finalDefinition.name}</h3>
                      <p>{finalDefinition.subtitle}</p>
                    </div>
                    <b>{state.finalTrial.progress}/{finalProgressMaximum}</b>
                  </div>
                  <p className="tabletop-training-objective">{finalDefinition.objective}</p>
                  <div className="tabletop-training-final__meters">
                    <div>
                      <span>Maestria do grupo</span>
                      <strong>{state.finalTrial.progress}/{finalProgressMaximum}</strong>
                      <ProgressBar current={state.finalTrial.progress} maximum={finalProgressMaximum} tone="gold" />
                    </div>
                    <div>
                      <span>Falhas de contencao</span>
                      <strong>{state.finalTrial.pressure}</strong>
                      <ProgressBar current={state.finalTrial.pressure} maximum={Math.max(5, state.participants.length * 3)} tone="danger" />
                    </div>
                  </div>
                  <ul className="tabletop-training-rules">
                    {finalDefinition.publicRules.map((rule) => <li key={rule}>{rule}</li>)}
                  </ul>
                  <div className="tabletop-training-final__criteria">
                    <span className={masteredParticipants >= state.participants.length ? 'is-ok' : ''}>
                      {masteredParticipants}/{state.participants.length} com maestria
                    </span>
                    <span className={assignedRewardCharacterIds.length >= state.participants.length ? 'is-ok' : ''}>
                      {assignedRewardCharacterIds.length}/{state.participants.length} habilidades atribuidas
                    </span>
                  </div>

                  <div className="tabletop-training-final__mastery-grid">
                    {state.participants.map((participant) => (
                      <button
                        className={participant.id === selectedParticipant?.id ? 'is-active' : ''}
                        key={participant.id}
                        onClick={() => setSelectedParticipantId(participant.id)}
                        type="button"
                      >
                        <strong>{participant.name}</strong>
                        <span>{participant.finalMastery.stage}/3 etapas</span>
                        <ProgressBar current={participant.finalMastery.stage} maximum={3} tone="gold" />
                        <small>
                          {participant.finalMastery.emotion
                            ? participant.finalMastery.emotion.toUpperCase()
                            : `${participant.finalMastery.fushiLost} FUSHI perdido`}
                        </small>
                      </button>
                    ))}
                  </div>

                  {isGm ? (
                    <div className="tabletop-training-reward__abilities" data-testid="training-reward-abilities">
                      <header>
                        <span>Habilidades antes da Prova Final</span>
                        <small>Narre o despertar e atribua antes de iniciar a prova individual.</small>
                      </header>
                      {state.participants.map((participant) => {
                        const reward = getInitialTrainingReward(participant.playerId)
                        if (!reward) return null
                        const assigned = assignedRewardCharacterIds.includes(participant.characterId)
                        return (
                          <article key={participant.id}>
                            <div>
                              <strong>{participant.name}</strong>
                              <span>{reward.feature.nome}</span>
                              <small>{reward.summary}</small>
                            </div>
                            <button
                              className={assigned ? 'is-assigned' : ''}
                              data-testid={`assign-training-reward-${participant.id}`}
                              disabled={assigned}
                              onClick={() => onAssignRewardAbility(participant.id)}
                              type="button"
                            >
                              {assigned ? 'Habilidade atribuida' : 'Atribuir habilidade'}
                            </button>
                          </article>
                        )
                      })}
                    </div>
                  ) : null}

                  {state.isCompleted ? (
                    <div className="tabletop-training-reward">
                      <span>{finalDefinition.rewardTitle}</span>
                      <strong>{finalDefinition.successText}</strong>
                      <p>{finalDefinition.rewardText}</p>
                    </div>
                  ) : null}
                  {isGm ? (
                    <div className="tabletop-training-gm">
                      <span>Somente Mestre</span>
                      <p>{finalDefinition.masterCue}</p>
                      <label>
                        Protagonista
                        <select
                          onChange={(event) => {
                            setSelectedParticipantId(event.target.value)
                            setRecoveredFushi('0')
                          }}
                          value={selectedParticipant?.id ?? ''}
                        >
                          {state.participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>{participant.name}</option>
                          ))}
                        </select>
                      </label>
                      {selectedParticipant?.finalMastery.stage === 0 ? (
                        <div className="tabletop-training-gm__actions">
                          <button
                            className="is-danger"
                            onClick={() => onFinalOutcome(selectedParticipant.id, '', 'body-failure')}
                            type="button"
                          >
                            Falha: -2 FUSHI
                          </button>
                          <button
                            className="is-success"
                            onClick={() => onFinalOutcome(selectedParticipant.id, '', 'body-success')}
                            type="button"
                          >
                            Conter corpo
                          </button>
                        </div>
                      ) : null}
                      {selectedParticipant?.finalMastery.stage === 1 ? (
                        <div className="tabletop-training-gm__focus">
                          <label>
                            FUSHI recuperado (1d{Math.max(1, selectedParticipant.finalMastery.fushiLost)})
                            <input
                              max={selectedParticipant.finalMastery.fushiLost}
                              min="0"
                              onChange={(event) => setRecoveredFushi(event.target.value)}
                              type="number"
                              value={recoveredFushi}
                            />
                          </label>
                          <button
                            onClick={() => onFinalOutcome(selectedParticipant.id, recoveredFushi, 'stabilize')}
                            type="button"
                          >
                            Registrar estabilizacao
                          </button>
                        </div>
                      ) : null}
                      {selectedParticipant?.finalMastery.stage === 2 ? (
                        <div className="tabletop-training-gm__focus">
                          <label>
                            Emocao do Fluxo
                            <select
                              onChange={(event) => setSelectedEmotion(event.target.value)}
                              value={selectedEmotion}
                            >
                              {finalDefinition.emotions.map((emotion) => (
                                <option key={emotion.id} value={emotion.id}>
                                  {emotion.label} - {emotion.effect}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            className="is-success"
                            onClick={() => onFinalOutcome(selectedParticipant.id, selectedEmotion, 'emotion')}
                            type="button"
                          >
                            Desbloquear maestria
                          </button>
                        </div>
                      ) : null}
                      <div className="tabletop-training-gm__actions">
                        <button
                          className="is-success"
                          disabled={!finalReady || assignedRewardCharacterIds.length < state.participants.length}
                          onClick={() => onFinalOutcome(selectedParticipant?.id ?? '', '', 'complete')}
                          title={finalReady ? 'Concluir arco' : 'Complete as tres etapas dos cinco protagonistas'}
                          type="button"
                        >
                          Concluir Treino Inicial
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : selectedStation ? (
                <section>
                  <div className="tabletop-training-content__title">
                    <div>
                      <span>{selectedStation.lesson}</span>
                      <h3>{selectedStation.name}</h3>
                      <p>{selectedStation.objective}</p>
                    </div>
                    <b>{selectedProgress?.progress ?? 0}/{VILLAGE_TRAINING_ARC.stationGoal}</b>
                  </div>
                  <ul className="tabletop-training-rules">
                    {selectedStation.publicSteps.map((step) => <li key={step}>{step}</li>)}
                  </ul>
                  {selectedParticipant ? (
                    <div className="tabletop-training-personal-progress">
                      <span>{selectedParticipant.name}</span>
                      <ProgressBar
                        current={selectedProgress?.progress ?? 0}
                        maximum={VILLAGE_TRAINING_ARC.stationGoal}
                      />
                      <strong>{selectedSummary?.totalSetbacks ?? 0} Contratempo(s) totais</strong>
                      <small>
                        {selectedSetbackMilestone.label}: {selectedSetbackMilestone.effect}
                      </small>
                    </div>
                  ) : null}
                  {isGm ? (
                    <div className="tabletop-training-gm">
                      <span>Somente Mestre</span>
                      <p>{selectedStation.masterCue}</p>
                      <div className="tabletop-training-approaches">
                        {selectedStation.approaches.map((approach) => (
                          <article key={approach.id}>
                            <div>
                              <strong>{approach.label}</strong>
                              <b>DT {approach.dt}</b>
                            </div>
                            <p>{approach.test}</p>
                            <small>{approach.success} | Falha: {approach.failure}</small>
                          </article>
                        ))}
                      </div>
                      <div className="tabletop-training-gm__focus">
                        <label>
                          Participante
                          <select
                            onChange={(event) => setSelectedParticipantId(event.target.value)}
                            value={selectedParticipant?.id ?? ''}
                          >
                            {state.participants.map((participant) => (
                              <option key={participant.id} value={participant.id}>{participant.name}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          onClick={() => onSelectStation(selectedParticipant?.id ?? '', selectedStation.id)}
                          type="button"
                        >
                          Definir como foco
                        </button>
                      </div>
                      <div className="tabletop-training-gm__actions">
                        <button onClick={() => onParticipantOutcome(selectedParticipant?.id ?? '', selectedStation.id, 'progress')} type="button">
                          +1 Marca
                        </button>
                        <button onClick={() => onParticipantOutcome(selectedParticipant?.id ?? '', selectedStation.id, 'bold')} type="button">
                          +2 Ousadia
                        </button>
                        <button className="is-danger" onClick={() => onParticipantOutcome(selectedParticipant?.id ?? '', selectedStation.id, 'setback')} type="button">
                          Contratempo
                        </button>
                        <button className="is-success" onClick={() => onParticipantOutcome(selectedParticipant?.id ?? '', selectedStation.id, 'complete')} type="button">
                          Concluir
                        </button>
                        <button onClick={() => onParticipantOutcome(selectedParticipant?.id ?? '', selectedStation.id, 'reset')} type="button">
                          Reiniciar estacao
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <footer className="tabletop-training-footer">
                {!state.finalTrial.isUnlocked ? (
                  <div>
                    <span>Prova final</span>
                    <strong>{teamSummary.completedAssignments}/{teamSummary.maxAssignments} desafios concluidos | {teamSummary.totalSetbacks} Contratempos no grupo</strong>
                  </div>
                ) : (
                  <div>
                    <span>Segundo Sino</span>
                    <strong>{state.finalTrial.isCompleted ? 'Grupo aprovado' : 'Prova liberada'}</strong>
                  </div>
                )}
                {isGm ? (
                  <div>
                    {!state.finalTrial.isUnlocked ? (
                      <button
                        className={recommendedFinalGateReached ? 'is-success' : ''}
                        onClick={onUnlockFinal}
                        title={recommendedFinalGateReached ? 'Criterio recomendado atingido' : 'O Mestre pode liberar antes se a cena pedir'}
                        type="button"
                      >
                        Liberar prova final
                      </button>
                    ) : null}
                    <button
                      className="is-danger"
                      data-testid="deactivate-training-from-overlay"
                      onClick={() => onSetActive(false)}
                      type="button"
                    >
                      Desativar evento
                    </button>
                    <button onClick={onRestart} type="button">Novo ciclo</button>
                  </div>
                ) : null}
              </footer>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
