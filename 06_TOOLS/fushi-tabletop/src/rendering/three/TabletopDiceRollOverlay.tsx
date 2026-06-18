import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { RollRecord } from '../../data/types'
import type { VisualQualityMode } from '../../lib/productPreferences'
import { getRollOutcome } from '../../lib/rolls'
import { DiceRoll3D } from './DiceRoll3D'
import { TabletopDiceImpactScene } from './TabletopDiceImpactScene'

interface TabletopDiceRollOverlayProps {
  entryId?: string
  onRollSettled?: (entryId: string) => void
  quality?: VisualQualityMode
  record: RollRecord | null
  suppressUltraImpactScene?: boolean
}

const PHYSICS_DICE_TYPES = new Set([4, 6, 8, 10, 12, 20, 100])
const MAX_PHYSICS_DICE = 6
const DICE_PHYSICS_ENABLED = true
const FALLBACK_SETTLE_MS = 2200
const PHYSICS_MIN_SETTLE_MS = 3600
const PHYSICS_BACKUP_SETTLE_MS = 6400
const IMPACT_BOLTS = Array.from({ length: 14 }, (_, index) => ({
  angle: -72 + ((index * 47) % 144),
  delay: index * 42,
  length: 18 + ((index * 19) % 28),
  x: 16 + ((index * 29) % 68),
  y: 14 + ((index * 37) % 70),
}))

function sanitizeColor(value?: string) {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) {
    return '#d8a34d'
  }

  return value
}

function getTextColor(background: string) {
  const colorValue = Number.parseInt(background.replace('#', ''), 16)
  const red = (colorValue >> 16) & 255
  const green = (colorValue >> 8) & 255
  const blue = colorValue & 255
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255

  return luminance > 0.62 ? '#19130b' : '#fff8dd'
}

function buildPhysicsNotation(record: RollRecord) {
  if (record.tipoDado === 2) {
    return `${record.quantidadeDados}d2@${record.resultados.join(',')}`
  }

  if (record.tipoDado === 100) {
    const tensValues: number[] = []
    const onesValues: number[] = []

    record.resultados.forEach((result) => {
      const normalizedResult = result >= 100 ? 100 : Math.max(1, result)
      const tens = Math.floor((normalizedResult % 100) / 10) * 10
      const ones = normalizedResult % 10

      tensValues.push(tens === 0 ? 100 : tens)
      onesValues.push(ones === 0 ? 10 : ones)
    })

    return `${record.resultados.length}d100@${tensValues.join(',')}+${record.resultados.length}d10@${onesValues.join(',')}`
  }

  return `${record.quantidadeDados}d${record.tipoDado}@${record.resultados.join(',')}`
}

function formatBonusMath(bonus: number) {
  if (bonus === 0) {
    return ''
  }

  return ` ${bonus > 0 ? '+' : '-'} ${Math.abs(bonus)}`
}

function formatResultMath(record: RollRecord) {
  if (record.modo === 'sum') {
    return `${record.resultados.join(' + ')}${formatBonusMath(record.bonus)} =`
  }

  if (record.modo === 'lowest') {
    return `menor ${record.resultadoBase}${formatBonusMath(record.bonus)} =`
  }

  return `maior ${record.resultadoBase}${formatBonusMath(record.bonus)} =`
}

function clearDiceBox(box?: import('@3d-dice/dice-box-threejs').default) {
  try {
    box?.clearDice?.()
  } catch {
    // dice-box can throw while tearing down its internal resize observer after
    // rapid route/quality/roll changes. The host cleanup below still removes
    // the canvas, so keep the table responsive.
  }
}

export function TabletopDiceRollOverlay({
  entryId,
  onRollSettled,
  quality = 'balanced',
  record,
  suppressUltraImpactScene = false,
}: TabletopDiceRollOverlayProps) {
  const hostId = `fushi-dice-box-${useId().replace(/:/g, '')}`
  const hostRef = useRef<HTMLDivElement | null>(null)
  const diceBoxRef = useRef<{
    box: import('@3d-dice/dice-box-threejs').default
    color: string
  } | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const settleTimeoutRef = useRef<number | null>(null)
  const onRollSettledRef = useRef(onRollSettled)
  const rollSeqRef = useRef(0)
  const [activeRecord, setActiveRecord] = useState<RollRecord | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isSettled, setIsSettled] = useState(false)
  const [mode, setMode] = useState<'physics' | 'fallback'>('physics')

  const diceColor = sanitizeColor(activeRecord?.visualColor)
  const activeOutcome = activeRecord ? getRollOutcome(activeRecord) : 'normal'
  const visibleOutcome = isSettled ? activeOutcome : 'normal'
  const impactOutcome = visibleOutcome === 'normal' ? null : visibleOutcome
  const physicsNotation =
    activeRecord && PHYSICS_DICE_TYPES.has(activeRecord.tipoDado)
      ? buildPhysicsNotation(activeRecord)
      : ''
  const fallbackLabel = activeRecord
    ? isSettled
      ? String(activeRecord.total)
      : activeRecord.tipoDado === 2
        ? '1d2'
        : `d${activeRecord.tipoDado}`
    : ''
  const supportsPhysics = record
    ? DICE_PHYSICS_ENABLED &&
      PHYSICS_DICE_TYPES.has(record.tipoDado) &&
      record.quantidadeDados <= MAX_PHYSICS_DICE
    : false
  const isUltraImpact =
    quality === 'ultra' &&
    isSettled &&
    impactOutcome !== null &&
    !suppressUltraImpactScene

  const colorTheme = useMemo(() => {
    const color = sanitizeColor(record?.visualColor)

    return {
      name: `fushi-${color.replace('#', '')}`,
      foreground: getTextColor(color),
      background: color,
      outline: '#1c1208',
      edge: '#fff0ad',
      texture: 'none',
      material: 'glass',
    }
  }, [record?.visualColor])

  useEffect(() => {
    onRollSettledRef.current = onRollSettled
  }, [onRollSettled])

  useEffect(() => {
    const host = hostRef.current

    return () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }

      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current)
      }

      clearDiceBox(diceBoxRef.current?.box)
      diceBoxRef.current = null
      host?.replaceChildren()
    }
  }, [])

  useEffect(() => {
    if (!entryId || !record) {
      return
    }

    const rollRecord = record
    const rollEntryId = entryId
    const rollSeq = rollSeqRef.current + 1
    rollSeqRef.current = rollSeq
    const color = sanitizeColor(rollRecord.visualColor)
    const nextMode = supportsPhysics ? 'physics' : 'fallback'
    const rollStartedAt = performance.now()
    let settled = false

    function finishRoll() {
      if (settled || rollSeqRef.current !== rollSeq) {
        return
      }

      settled = true
      setIsSettled(true)
      onRollSettledRef.current?.(rollEntryId)

      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }

      hideTimeoutRef.current = window.setTimeout(() => {
        if (rollSeqRef.current === rollSeq) {
          setIsRolling(false)
          setIsSettled(false)
          clearDiceBox(diceBoxRef.current?.box)
        }
      }, 3600)
    }

    function scheduleFinishAfterMinimum(minimumMs: number) {
      const elapsedMs = performance.now() - rollStartedAt
      const remainingMs = Math.max(0, minimumMs - elapsedMs)

      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current)
      }

      settleTimeoutRef.current = window.setTimeout(finishRoll, remainingMs)
    }

    window.setTimeout(() => {
      if (rollSeqRef.current === rollSeq) {
        setActiveRecord(rollRecord)
        setIsRolling(true)
        setIsSettled(false)
        setMode(nextMode)
      }
    }, 0)

    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current)
    }

    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current)
    }

    settleTimeoutRef.current = window.setTimeout(
      finishRoll,
      supportsPhysics ? PHYSICS_BACKUP_SETTLE_MS : FALLBACK_SETTLE_MS,
    )

    if (!supportsPhysics) {
      return
    }

    let cancelled = false

    async function rollDice() {
      const host = hostRef.current

      if (!host) {
        setMode('fallback')
        scheduleFinishAfterMinimum(FALLBACK_SETTLE_MS)
        return
      }

      try {
        const { default: DiceBox } = await import('@3d-dice/dice-box-threejs')

        if (cancelled || rollSeqRef.current !== rollSeq) {
          return
        }

        if (!diceBoxRef.current || diceBoxRef.current.color !== color) {
          clearDiceBox(diceBoxRef.current?.box)
          host.replaceChildren()

          const box = new DiceBox(`#${hostId}`, {
            assetPath: '/assets/dice-box/',
            color_spotlight: 0xffedc2,
            gravity_multiplier: 430,
            iterationLimit: 1200,
            light_intensity: 0.92,
            shadows: true,
            sounds: false,
            strength: 1.28,
            theme_customColorset: colorTheme,
            theme_material: 'glass',
            theme_surface: 'green-felt',
          })

          await box.initialize()
          diceBoxRef.current = { box, color }
        }

        if (cancelled || rollSeqRef.current !== rollSeq) {
          return
        }

        await diceBoxRef.current.box.roll(buildPhysicsNotation(rollRecord))
        scheduleFinishAfterMinimum(PHYSICS_MIN_SETTLE_MS)
      } catch (error) {
        console.error('Falha ao rolar dado 3D fisico', error)
        if (!cancelled && rollSeqRef.current === rollSeq) {
          setMode('fallback')
          scheduleFinishAfterMinimum(FALLBACK_SETTLE_MS)
        }
      }
    }

    void rollDice()

    return () => {
      cancelled = true
    }
  }, [colorTheme, entryId, hostId, record, supportsPhysics])

  return (
    <div
      aria-hidden="true"
      className={`tabletop-dice-box-overlay${
        isRolling ? ' tabletop-dice-box-overlay--active' : ''
      }${isSettled ? ' tabletop-dice-box-overlay--settled' : ''}${
        isUltraImpact ? ' tabletop-dice-box-overlay--ultra-impact' : ''
      } tabletop-dice-box-overlay--${mode} tabletop-dice-box-overlay--${visibleOutcome}`}
      data-roll-outcome={visibleOutcome}
      data-roll-physics-notation={physicsNotation}
      data-roll-total={activeRecord?.total ?? ''}
    >
      <div className="tabletop-dice-box-overlay__scene" id={hostId} ref={hostRef} />
      {isUltraImpact && impactOutcome ? (
        <TabletopDiceImpactScene
          active={isUltraImpact}
          outcome={impactOutcome}
          triggerId={entryId}
        />
      ) : null}
      {activeRecord && mode === 'fallback' ? (
        <div className="tabletop-dice-box-overlay__fallback" key={entryId}>
          <DiceRoll3D color={diceColor} label={fallbackLabel} size="lg" type={activeRecord.tipoDado} />
        </div>
      ) : null}
      {isSettled && impactOutcome ? (
        <>
          <div className="tabletop-dice-box-overlay__impact-field">
            <span className="tabletop-dice-box-overlay__shockwave" />
            <span className="tabletop-dice-box-overlay__crater" />
            {IMPACT_BOLTS.map((bolt, index) => (
              <span
                className="tabletop-dice-box-overlay__bolt"
                key={`${impactOutcome}-${index}`}
                style={{
                  ['--bolt-angle' as string]: `${bolt.angle}deg`,
                  ['--bolt-delay' as string]: `${bolt.delay}ms`,
                  ['--bolt-length' as string]: `${bolt.length}vw`,
                  ['--bolt-x' as string]: `${bolt.x}%`,
                  ['--bolt-y' as string]: `${bolt.y}%`,
                }}
              />
            ))}
          </div>
          <div className="tabletop-dice-box-overlay__impact">
            <span>
              {impactOutcome === 'critical' ? 'Falha critica' : 'Sucesso critico'}
            </span>
          </div>
        </>
      ) : null}
      {activeRecord && isSettled ? (
        <div className="tabletop-dice-box-overlay__result">
          <span className="tabletop-dice-box-overlay__notation">
            {activeRecord.quantidadeDados}d{activeRecord.tipoDado}
          </span>
          <span className="tabletop-dice-box-overlay__math">
            {formatResultMath(activeRecord)}
          </span>
          <strong>{activeRecord.total}</strong>
        </div>
      ) : null}
    </div>
  )
}
