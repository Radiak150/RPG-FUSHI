import { useState } from 'react'
import type { RollConfig, RollMode, RollRecord } from '../../data/types'
import { createRollRecord, formatRollFormula } from '../../lib/rolls'
import { Panel } from '../ui/Panel'
import { DiceIcon } from '../ui/DiceIcon'

interface DiceRollerPanelProps {
  title?: string
  subtitle?: string
  contextLabel: string
  defaultConfig?: RollConfig
}

const availableDiceTypes = [2, 4, 6, 8, 10, 12, 16, 20, 30, 100]

const defaultRollConfig: RollConfig = {
  quantidadeDados: 1,
  tipoDado: 20,
  bonus: 0,
}

export function DiceRollerPanel({
  title = 'Rolagem',
  subtitle = 'Base flexivel com quantidade de dados, tipo, bonus e registro textual.',
  contextLabel,
  defaultConfig = defaultRollConfig,
}: DiceRollerPanelProps) {
  const [quantidadeDados, setQuantidadeDados] = useState(defaultConfig.quantidadeDados)
  const [tipoDado, setTipoDado] = useState(defaultConfig.tipoDado)
  const [bonus, setBonus] = useState(defaultConfig.bonus ?? 0)
  const [modo, setModo] = useState<RollMode>(defaultConfig.modo ?? 'highest')
  const [records, setRecords] = useState<RollRecord[]>([])
  const currentConfig = {
    quantidadeDados,
    tipoDado,
    bonus,
    modo,
  } satisfies RollConfig

  function handleRoll() {
    const nextRecord = createRollRecord(
      currentConfig,
      contextLabel,
    )

    setRecords((currentRecords) => [nextRecord, ...currentRecords].slice(0, 6))
  }

  return (
    <Panel eyebrow="Rolagem" title={title} subtitle={subtitle}>
      <div className="roll-panel__controls">
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

        <label className="field roll-panel__die-picker">
          <span>Dado</span>
          <span className="roll-panel__die-face">
            <DiceIcon label={tipoDado === 2 ? 'moeda' : `d${tipoDado}`} size="sm" type={tipoDado} />
          </span>
          <select
            className="field__input"
            onChange={(event) => setTipoDado(Number(event.target.value))}
            value={tipoDado}
          >
            {availableDiceTypes.map((diceType) => (
              <option key={diceType} value={diceType}>
                {diceType === 2 ? '1d2 moeda' : `d${diceType}`}
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

        <label className="field">
          <span>Modo</span>
          <select
            className="field__input"
            onChange={(event) => setModo(event.target.value as RollMode)}
            value={modo}
          >
            <option value="highest">= Maior dado + bonus</option>
            <option value="lowest">- Menor dado + bonus</option>
            <option value="sum">+ Soma dos dados + bonus</option>
          </select>
        </label>

        <button className="button button--primary" onClick={handleRoll} type="button">
          Rolar
        </button>
      </div>

      <article className="list-card">
        <div className="list-card__top">
          <h3>Formula atual</h3>
          <span className="tag">
            {modo === 'highest'
              ? '= Maior + bonus'
              : modo === 'lowest'
                ? '- Menor + bonus'
                : '+ Soma + bonus'}
          </span>
        </div>
        <p className="support-copy">{formatRollFormula(currentConfig)}</p>
      </article>

      <div className="list-stack">
        {records.length > 0 ? (
          records.map((record) => (
            <article key={record.id} className="list-card">
              <div className="list-card__top">
                <div className="tabletop-session-log__entry-title">
                  <DiceIcon label={String(record.total)} size="sm" type={record.tipoDado} />
                  <h3>{record.contexto}</h3>
                </div>
                <strong>{record.total}</strong>
              </div>
              <p className="support-copy">{record.resultadoTexto}</p>
            </article>
          ))
        ) : (
          <article className="list-card">
            <p className="support-copy">
              Nenhuma rolagem registrada ainda. O resultado textual aparecera aqui.
            </p>
          </article>
        )}
      </div>
    </Panel>
  )
}
