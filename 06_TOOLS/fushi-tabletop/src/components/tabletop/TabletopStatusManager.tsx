import { useMemo, useState, type CSSProperties } from 'react'
import { ListChecks, PlusCircle, ShieldAlert } from 'lucide-react'
import {
  TABLETOP_STATUS_CATALOG,
  getTabletopStatusDefinition,
  type TabletopStatusId,
} from '../../data/statusCatalog'
import type { TabletopCombatMark } from '../../lib/tabletopSession'
import { TabletopStatusIcon } from './TabletopStatusIcon'
import { TabletopVisualLibrary } from './TabletopVisualLibrary'

export interface TabletopStatusParticipant {
  characterId?: string
  id: string
  label: string
  name: string
}

interface TabletopStatusManagerProps {
  marks: TabletopCombatMark[]
  onApply: (input: {
    cancelableBySource: boolean
    durationRounds?: number
    notes?: string
    sourceTokenId: string
    stacks: number
    statusId: TabletopStatusId
    targetTokenId: string
  }) => void
  onRemove: (markId: string) => void
  participants: TabletopStatusParticipant[]
}

export function TabletopStatusManager({
  marks,
  onApply,
  onRemove,
  participants,
}: TabletopStatusManagerProps) {
  const [view, setView] = useState<'apply' | 'active'>('apply')
  const [statusId, setStatusId] = useState<TabletopStatusId>('sangrando')
  const [targetTokenId, setTargetTokenId] = useState('')
  const [sourceTokenId, setSourceTokenId] = useState('')
  const [durationRounds, setDurationRounds] = useState('')
  const [stacks, setStacks] = useState(1)
  const [notes, setNotes] = useState('')
  const selectedStatus =
    getTabletopStatusDefinition(statusId) ?? TABLETOP_STATUS_CATALOG[0]
  const effectiveTargetId =
    participants.some((participant) => participant.id === targetTokenId)
      ? targetTokenId
      : ''
  const effectiveSourceId =
    participants.some((participant) => participant.id === sourceTokenId)
      ? sourceTokenId
      : ''
  const participantById = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  )
  const activeMarks = marks
    .filter((mark) => Boolean(getTabletopStatusDefinition(mark.statusId)))
    .sort((first, second) => second.createdAt - first.createdAt)

  return (
    <TabletopVisualLibrary
      className="status-manager-browser"
      code="BUF"
      contentHeader={
        <div>
          <p className="eyebrow">{view === 'apply' ? 'Novo estado' : 'Mesa'}</p>
          <h2>{view === 'apply' ? 'Aplicar buff ou debuff' : 'Efeitos ativos'}</h2>
          <small>
            {view === 'apply'
              ? 'Escolha conscientemente alvo e origem antes de aplicar.'
              : `${activeMarks.length} efeito(s) acompanhados nesta cena.`}
          </small>
        </div>
      }
      icon={ShieldAlert}
      sidebar={
        <nav className="tabletop-visual-library__nav" aria-label="Vistas de buffs e debuffs">
          <button
            className={view === 'apply' ? 'is-active' : ''}
            onClick={() => setView('apply')}
            type="button"
          >
            <PlusCircle aria-hidden="true" size={17} />
            <span>Aplicar estado</span>
            <small>{TABLETOP_STATUS_CATALOG.length}</small>
          </button>
          <button
            className={view === 'active' ? 'is-active' : ''}
            onClick={() => setView('active')}
            type="button"
          >
            <ListChecks aria-hidden="true" size={17} />
            <span>Ativos na mesa</span>
            <small>{activeMarks.length}</small>
          </button>
        </nav>
      }
      testId="status-manager-browser"
      title="Buffs e debuffs"
    >
      {view === 'apply' ? (
      <section className="status-manager__composer">
        <label className="field">
          <span>Estado</span>
          <select
            className="field__input"
            onChange={(event) => setStatusId(event.target.value as TabletopStatusId)}
            value={statusId}
          >
            {(['debuff', 'condition', 'buff'] as const).map((kind) => (
              <optgroup
                key={kind}
                label={
                  kind === 'buff'
                    ? 'Buffs'
                    : kind === 'condition'
                      ? 'Condições'
                      : 'Debuffs'
                }
              >
                {TABLETOP_STATUS_CATALOG.filter((status) => status.kind === kind).map(
                  (status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Alvo</span>
          <select
            className="field__input"
            disabled={participants.length === 0}
            onChange={(event) => setTargetTokenId(event.target.value)}
            value={effectiveTargetId}
          >
            <option value="">Escolha um alvo</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name} [{participant.label}]
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Origem</span>
          <select
            className="field__input"
            disabled={participants.length === 0}
            onChange={(event) => setSourceTokenId(event.target.value)}
            value={effectiveSourceId}
          >
            <option value="">Mestre / ambiente</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name} [{participant.label}]
              </option>
            ))}
          </select>
        </label>

        <div className="status-manager__numeric-fields">
          <label className="field">
            <span>Acúmulos</span>
            <input
              className="field__input"
              max={selectedStatus.rules.maxStacks ?? 99}
              min={1}
              onChange={(event) =>
                setStacks(Math.max(1, Number(event.target.value) || 1))
              }
              type="number"
              value={stacks}
            />
          </label>
          <label className="field">
            <span>Rodadas</span>
            <input
              className="field__input"
              min={1}
              onChange={(event) => setDurationRounds(event.target.value)}
              placeholder={
                selectedStatus.defaultDurationRounds
                  ? String(selectedStatus.defaultDurationRounds)
                  : 'Mestre'
              }
              type="number"
              value={durationRounds}
            />
          </label>
        </div>

        <label className="field">
          <span>Nota da aplicação</span>
          <textarea
            className="field__input"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Fonte, DT própria ou detalhe desta ocorrência."
            rows={2}
            value={notes}
          />
        </label>

        <article
          className="status-manager__preview"
          style={{ '--status-color': selectedStatus.color } as CSSProperties}
        >
          <TabletopStatusIcon
            icon={selectedStatus.icon}
            label={selectedStatus.label}
            size={24}
          />
          <div>
            <strong>{selectedStatus.label}</strong>
            <p>{selectedStatus.effect}</p>
          </div>
        </article>

        <button
          className="button button--primary"
          disabled={!effectiveTargetId}
          onClick={() =>
            onApply({
              cancelableBySource:
                selectedStatus.id === 'especial-buff' ||
                selectedStatus.id === 'especial-debuff',
              durationRounds: durationRounds
                ? Math.max(1, Number(durationRounds) || 1)
                : selectedStatus.defaultDurationRounds,
              notes: notes.trim() || undefined,
              sourceTokenId: effectiveSourceId,
              stacks,
              statusId: selectedStatus.id,
              targetTokenId: effectiveTargetId,
            })
          }
          type="button"
        >
          Aplicar estado
        </button>
      </section>
      ) : (
      <section className="status-manager__active">
        <header>
          <span className="eyebrow">Mesa</span>
          <h3>Quem está sob efeito</h3>
        </header>
        {activeMarks.length > 0 ? (
          activeMarks.map((mark) => {
            const definition = getTabletopStatusDefinition(mark.statusId)
            const source = participantById.get(mark.sourceTokenId)
            const target = participantById.get(mark.targetTokenId)

            if (!definition) {
              return null
            }

            return (
              <article
                className="status-manager__active-item"
                key={mark.id}
                style={{ '--status-color': definition.color } as CSSProperties}
              >
                <TabletopStatusIcon icon={definition.icon} size={22} />
                <div>
                  <span className="eyebrow">{definition.kind}</span>
                  <strong>
                    {definition.label} · {target?.name ?? 'Alvo'}
                  </strong>
                  <p>
                    Origem: {source?.name ?? 'Mestre'}
                    {mark.stacks ? ` · ${mark.stacks} acúmulo(s)` : ''}
                    {mark.durationRounds ? ` · ${mark.durationRounds} rodada(s)` : ''}
                  </p>
                  {mark.notes ? <small>{mark.notes}</small> : null}
                </div>
                <button
                  className="button button--danger"
                  onClick={() => onRemove(mark.id)}
                  type="button"
                >
                  Remover
                </button>
              </article>
            )
          })
        ) : (
          <p className="support-copy">Nenhum estado canônico ativo nesta cena.</p>
        )}
      </section>
      )}
    </TabletopVisualLibrary>
  )
}
