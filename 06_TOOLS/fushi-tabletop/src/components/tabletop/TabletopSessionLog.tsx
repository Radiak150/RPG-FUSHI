import { useMemo, useState } from 'react'
import type { RollConfig } from '../../data/types'
import { createRollRecord, formatRollFormula } from '../../lib/rolls'
import type { TabletopLogEntry } from '../../lib/tabletopSession'

interface TabletopSessionLogProps {
  entries: TabletopLogEntry[]
  isGm: boolean
  onAddEntry: (entry: TabletopLogEntry) => void
  onClearEntries: () => void
}

const availableDiceTypes = [4, 6, 8, 10, 12, 20, 100]

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
    <article className="list-card" key={entry.id}>
      <div className="list-card__top">
        <h3>{entry.roll?.contexto ?? entry.author}</h3>
        <div className="tag-row">
          <span className="tag">{getEntryTypeLabel(entry)}</span>
          {entry.visibility === 'gm' ? <span className="tag">oculto</span> : null}
        </div>
      </div>
      <p className="support-copy">{entry.text}</p>
    </article>
  ))
}

export function TabletopSessionLog({
  entries,
  isGm,
  onAddEntry,
  onClearEntries,
}: TabletopSessionLogProps) {
  const [message, setMessage] = useState('')
  const [rollContext, setRollContext] = useState('Rolagem da mesa')
  const [quantidadeDados, setQuantidadeDados] = useState(1)
  const [tipoDado, setTipoDado] = useState(20)
  const [bonus, setBonus] = useState(0)

  const visibleEntries = useMemo(
    () => entries.filter((entry) => isGm || entry.visibility === 'public'),
    [entries, isGm],
  )
  const chatEntries = useMemo(
    () =>
      visibleEntries
        .filter((entry) => entry.type !== 'roll')
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
    quantidadeDados,
    tipoDado,
    bonus,
    modo: 'highest',
  } satisfies RollConfig

  function handleSendMessage(visibility: 'public' | 'gm') {
    const nextMessage = message.trim()

    if (!nextMessage) {
      return
    }

    onAddEntry({
      id: buildId('log'),
      type: 'message',
      visibility,
      author: visibility === 'gm' ? 'Mestre' : isGm ? 'Mestre' : 'Jogador',
      text: nextMessage,
      createdAt: new Date().toISOString(),
    })
    setMessage('')
  }

  function handleRoll(visibility: 'public' | 'gm') {
    const record = createRollRecord(currentRoll, rollContext.trim() || 'Rolagem da mesa')

    onAddEntry({
      id: buildId('roll'),
      type: 'roll',
      visibility,
      author: visibility === 'gm' ? 'Mestre' : isGm ? 'Mesa' : 'Jogador',
      text: record.resultadoTexto,
      createdAt: new Date().toISOString(),
      roll: record,
    })
  }

  return (
    <div className="tabletop-session-log">
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
            <button className="button" onClick={() => handleSendMessage('gm')} type="button">
              Nota oculta
            </button>
          ) : null}
          {isGm ? (
            <button className="button" onClick={onClearEntries} type="button">
              Limpar chat
            </button>
          ) : null}
        </div>
      </section>

      <section className="tabletop-session-log__roller">
        <div className="list-card__top">
          <h3>Rolagens</h3>
          <span className="tag">{isGm ? 'Mesa' : 'Player'}</span>
        </div>
        <div className="tabletop-session-log__roller-grid">
          <label className="field">
            <span>Contexto</span>
            <input
              className="field__input"
              onChange={(event) => setRollContext(event.target.value)}
              type="text"
              value={rollContext}
            />
          </label>
          <label className="field">
            <span>Dados</span>
            <input
              className="field__input"
              min={1}
              onChange={(event) =>
                setQuantidadeDados(Math.max(1, Number(event.target.value) || 1))
              }
              type="number"
              value={quantidadeDados}
            />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select
              className="field__input"
              onChange={(event) => setTipoDado(Number(event.target.value))}
              value={tipoDado}
            >
              {availableDiceTypes.map((diceType) => (
                <option key={diceType} value={diceType}>
                  d{diceType}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Bonus</span>
            <input
              className="field__input"
              onChange={(event) => setBonus(Number(event.target.value) || 0)}
              type="number"
              value={bonus}
            />
          </label>
        </div>

        <article className="list-card">
          <div className="list-card__top">
            <h3>Formula</h3>
            <span className="tag">{isGm ? 'Mesa' : 'Player'}</span>
          </div>
          <p className="support-copy">{formatRollFormula(currentRoll)}</p>
        </article>

        <div className="tabletop-session-log__actions">
          <button
            className="button button--primary"
            onClick={() => handleRoll('public')}
            type="button"
          >
            Rolar publico
          </button>
          {isGm ? (
            <button className="button" onClick={() => handleRoll('gm')} type="button">
              Rolar oculto
            </button>
          ) : null}
        </div>
      </section>

      <div className="tabletop-session-log__feeds">
        <section className="tabletop-session-log__feed-panel">
          <div className="tabletop-session-log__feed-heading">
            <h3>Conversa</h3>
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
            <h3>Rolagens</h3>
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
