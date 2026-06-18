import { useMemo, useState } from 'react'
import type { RollConfig, RollMode } from '../../data/types'
import { createRollRecord, formatRollFormula } from '../../lib/rolls'
import type { TabletopLogEntry } from '../../lib/tabletopSession'
import { DiceIcon } from '../ui/DiceIcon'

interface TabletopSessionLogProps {
  authorLabel: string
  entries: TabletopLogEntry[]
  isGm: boolean
  rollDraft: TabletopRollDraft
  onAddEntry: (entry: TabletopLogEntry) => boolean | void
  onClearChatEntries: () => void
  onClearRollEntries: () => void
  onRollDraftChange: (draft: TabletopRollDraft) => void
  onRollSubmit?: () => void
  isRollLocked?: boolean
  rollLockLabel?: string
  rollQueueLabels?: string[]
}

export interface TabletopRollDraft {
  bonus: number
  diceColor: string
  modo: RollMode
  quantidadeDados: number
  tipoDado: number
}

const availableDiceTypes = [2, 4, 6, 8, 10, 12, 16, 20, 30, 100]
const diceColors = ['#d8a34d', '#df6d35', '#2f9c9a', '#654dd8', '#1b1f26', '#d9d3c5']

function buildId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function getEntryTypeLabel(entry: TabletopLogEntry) {
  if (entry.type === 'roll') return 'roll'
  if (entry.type === 'ping') return 'ping'
  if (entry.type === 'system') return 'sistema'
  return 'chat'
}

function renderFeedEntries(entries: TabletopLogEntry[], emptyText: string) {
  if (entries.length === 0) {
    return (
      <article className="list-card">
        <p className="support-copy">{emptyText}</p>
      </article>
    )
  }

  return entries.map((entry) => (
    <article
      className={`list-card tabletop-session-log__entry tabletop-session-log__entry--${entry.type}`}
      key={entry.id}
    >
      <div className="list-card__top">
        <div className="tabletop-session-log__entry-title">
          {entry.roll ? (
            <DiceIcon
              color={entry.roll.visualColor}
              label={String(entry.roll.total)}
              size="sm"
              type={entry.roll.tipoDado}
            />
          ) : null}
          <h3>{entry.roll?.contexto ?? entry.author}</h3>
        </div>
        <div className="tag-row">
          <span className="tag">{entry.author}</span>
          <span className="tag">{getEntryTypeLabel(entry)}</span>
          {entry.visibility === 'gm' ? <span className="tag">oculto</span> : null}
        </div>
      </div>
      <p className="support-copy">{entry.text}</p>
    </article>
  ))
}

export function TabletopSessionLog({
  authorLabel,
  entries,
  isGm,
  rollDraft,
  onAddEntry,
  onClearChatEntries,
  onClearRollEntries,
  onRollDraftChange,
  onRollSubmit,
  isRollLocked = false,
  rollLockLabel = '',
  rollQueueLabels = [],
}: TabletopSessionLogProps) {
  const [message, setMessage] = useState('')
  const visibleEntries = useMemo(
    () => entries.filter((entry) => isGm || entry.visibility === 'public'),
    [entries, isGm],
  )
  const chatEntries = useMemo(
    () =>
      visibleEntries
        .filter((entry) => entry.type === 'message')
        .slice(-24)
        .reverse(),
    [visibleEntries],
  )
  const rollEntries = useMemo(
    () =>
      visibleEntries
        .filter((entry) => entry.type === 'roll')
        .slice(-24)
        .reverse(),
    [visibleEntries],
  )

  const currentRoll = {
    quantidadeDados: rollDraft.quantidadeDados,
    tipoDado: rollDraft.tipoDado,
    bonus: rollDraft.bonus,
    modo: rollDraft.modo,
  } satisfies RollConfig

  function updateRollDraft(partialDraft: Partial<TabletopRollDraft>) {
    onRollDraftChange({
      ...rollDraft,
      ...partialDraft,
    })
  }

  function handleSendMessage(visibility: 'public' | 'gm') {
    const nextMessage = message.trim()

    if (!nextMessage) {
      return
    }

    onAddEntry({
      id: buildId('log'),
      type: 'message',
      visibility,
      author: authorLabel,
      text: nextMessage,
      createdAt: new Date().toISOString(),
    })
    setMessage('')
  }

  function handleRoll(visibility: 'public' | 'gm') {
    const record = createRollRecord(currentRoll, `Rolagem d${rollDraft.tipoDado}`, {
      visualColor: rollDraft.diceColor,
    })

    const accepted = onAddEntry({
      id: buildId('roll'),
      type: 'roll',
      visibility,
      author: authorLabel,
      text: record.resultadoTexto,
      createdAt: new Date().toISOString(),
      roll: record,
    })

    if (accepted !== false) {
      onRollSubmit?.()
    }
  }

  return (
    <div className="tabletop-session-log">
      <section className="tabletop-session-log__roller">
        <div className="list-card__top">
          <h3>Rolagens</h3>
          <span className="tag">{authorLabel}</span>
        </div>
        <div className="tabletop-session-log__dice-builder">
          <label className="tabletop-session-log__die-picker">
            <span className="tabletop-session-log__die-face">
              <DiceIcon
                color={rollDraft.diceColor}
                label={rollDraft.tipoDado === 2 ? '1d2' : `d${rollDraft.tipoDado}`}
                type={rollDraft.tipoDado}
              />
            </span>
            <select
              aria-label="Tipo de dado"
              onChange={(event) => updateRollDraft({ tipoDado: Number(event.target.value) })}
              value={rollDraft.tipoDado}
            >
              {availableDiceTypes.map((diceType) => (
                <option key={diceType} value={diceType}>
                  {diceType === 2 ? '1d2 moeda' : `d${diceType}`}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dados</span>
            <input
              className="field__input"
              min={1}
              onChange={(event) =>
                updateRollDraft({
                  quantidadeDados: Math.max(1, Number(event.target.value) || 1),
                })
              }
              type="number"
              value={rollDraft.quantidadeDados}
            />
          </label>
          <label className="field">
            <span>Bonus</span>
            <input
              className="field__input"
              onChange={(event) => updateRollDraft({ bonus: Number(event.target.value) || 0 })}
              type="number"
              value={rollDraft.bonus}
            />
          </label>
        </div>
        <div className="tabletop-session-log__dice-colors" aria-label="Cor do dado">
          {diceColors.map((color) => (
            <button
              aria-label={`Cor ${color}`}
              className={`tabletop-session-log__dice-color${
                rollDraft.diceColor === color ? ' tabletop-session-log__dice-color--active' : ''
              }`}
              key={color}
              onClick={() => updateRollDraft({ diceColor: color })}
              style={{ background: color }}
              type="button"
            />
          ))}
        </div>
        <article className="list-card">
          <div className="list-card__top">
            <h3>Formula</h3>
            <span className="tag">{authorLabel}</span>
          </div>
          <p className="support-copy">{formatRollFormula(currentRoll)}</p>
        </article>

        <div className="tabletop-session-log__roll-command-row">
          <div className="tabletop-session-log__mode-toggle" aria-label="Modo da formula">
            <button
              aria-label="Usar maior dado mais bonus"
              aria-pressed={rollDraft.modo === 'highest'}
              className={rollDraft.modo === 'highest' ? 'is-active' : ''}
              onClick={() => updateRollDraft({ modo: 'highest' })}
              title="= Maior dado + bonus"
              type="button"
            >
              =
            </button>
            <button
              aria-label="Usar menor dado mais bonus"
              aria-pressed={rollDraft.modo === 'lowest'}
              className={rollDraft.modo === 'lowest' ? 'is-active' : ''}
              onClick={() => updateRollDraft({ modo: 'lowest' })}
              title="- Menor dado + bonus"
              type="button"
            >
              -
            </button>
            <button
              aria-label="Somar todos os dados mais bonus"
              aria-pressed={rollDraft.modo === 'sum'}
              className={rollDraft.modo === 'sum' ? 'is-active' : ''}
              onClick={() => updateRollDraft({ modo: 'sum' })}
              title="+ Soma dos dados + bonus"
              type="button"
            >
              +
            </button>
          </div>

          <div className="tabletop-session-log__actions tabletop-session-log__roll-buttons">
            <button
              className="button button--primary"
              onClick={() => handleRoll('public')}
              type="button"
            >
              {isRollLocked ? 'Entrar na fila' : 'Rolar publico'}
            </button>
            {isGm ? (
              <button className="button" onClick={() => handleRoll('gm')} type="button">
                {isRollLocked ? 'Fila oculta' : 'Rolar oculto'}
              </button>
            ) : null}
          </div>
        </div>
        {isRollLocked ? (
          <div className="tabletop-session-log__roll-lock" role="status">
            <span>Aguarde</span>
            <strong>{rollLockLabel || 'Rolagem em andamento'}</strong>
            {rollQueueLabels.length > 0 ? (
              <em>Fila: {rollQueueLabels.join(', ')}</em>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="tabletop-session-log__composer">
        <div className="list-card__top">
          <h3>Conversa</h3>
          <span className="tag">chat</span>
        </div>
        <label className="field">
          <span>Mensagem</span>
          <textarea
            className="field__input field__input--textarea tabletop-session-log__message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Registrar fala, acao ou nota da sessao."
            value={message}
          />
        </label>

        <div className="tabletop-session-log__actions">
          <button
            className="button button--primary"
            onClick={() => handleSendMessage('public')}
            type="button"
          >
            Enviar
          </button>
          {isGm ? (
            <button className="button" onClick={onClearRollEntries} type="button">
              Limpar roll
            </button>
          ) : null}
          {isGm ? (
            <button className="button" onClick={onClearChatEntries} type="button">
              Limpar chat
            </button>
          ) : null}
        </div>
      </section>

      <div className="tabletop-session-log__feeds">
        <section className="tabletop-session-log__feed-panel">
          <div className="tabletop-session-log__feed-heading">
            <h3>Historico da conversa</h3>
            <span className="tag">{chatEntries.length}</span>
          </div>
          <div className="tabletop-session-log__feed">
            {renderFeedEntries(
              chatEntries,
              'Nenhuma mensagem registrada ainda. O chat da sessao aparecera aqui.',
            )}
          </div>
        </section>

        <section className="tabletop-session-log__feed-panel">
          <div className="tabletop-session-log__feed-heading">
            <h3>Historico de rolagens</h3>
            <span className="tag">{rollEntries.length}</span>
          </div>
          <div className="tabletop-session-log__feed">
            {renderFeedEntries(
              rollEntries,
              'Nenhuma rolagem registrada ainda. O historico de dados aparecera aqui.',
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
