import { useEffect, useState, type CSSProperties } from 'react'
import { ITEM_RARITY_META } from '../../data/combatCatalog'
import {
  isTabletopEventActive,
  type TabletopEventRarity,
  type TabletopEventSystemState,
} from '../../lib/tabletopEvents'

const RARITY_CYCLE: TabletopEventRarity[] = [
  'comum',
  'raro',
  'epico',
  'lendario',
  'mitico',
]

const DISMISSED_DRAW_STORAGE_KEY = 'fushi-tabletop:event-presentation:dismissed-draw'

function readDismissedDrawId() {
  try {
    return window.sessionStorage.getItem(DISMISSED_DRAW_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function TabletopEventPresentation({ state }: { state: TabletopEventSystemState }) {
  const [now, setNow] = useState(0)
  const [dismissedDrawId, setDismissedDrawId] = useState(readDismissedDrawId)
  const draw = state.rarityDraw
  const clock = now
  const isCandidate =
    isTabletopEventActive(state, 'build-rarity-draw') &&
    draw.phase === 'rolling' &&
    Boolean(draw.rarity)
  const isVisible =
    isCandidate &&
    clock < (draw.presentationExpiresAt ?? 0) &&
    draw.drawId !== dismissedDrawId
  const isRevealed = isVisible && clock >= (draw.revealAt ?? 0)

  function dismissPresentation() {
    if (!isRevealed || !draw.drawId) return

    setDismissedDrawId(draw.drawId)

    try {
      window.sessionStorage.setItem(DISMISSED_DRAW_STORAGE_KEY, draw.drawId)
    } catch {
      // A apresentacao ainda fecha quando o armazenamento da janela esta indisponivel.
    }
  }

  function handlePresentationKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Escape') return

    event.preventDefault()
    dismissPresentation()
  }

  useEffect(() => {
    if (!isCandidate) return

    const updateClock = () => setNow(Date.now())
    const timeoutId = window.setTimeout(updateClock, 0)
    const intervalId = window.setInterval(updateClock, 90)
    const expiryTimeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId)
      setNow(Date.now())
    }, Math.max(0, (draw.presentationExpiresAt ?? Date.now()) - Date.now()))

    return () => {
      window.clearTimeout(timeoutId)
      window.clearTimeout(expiryTimeoutId)
      window.clearInterval(intervalId)
    }
  }, [draw.drawId, draw.presentationExpiresAt, isCandidate])

  if (!isVisible || !draw.rarity) return null

  const cycleIndex = Math.floor((clock - (draw.startedAt ?? clock)) / 120) % RARITY_CYCLE.length
  const visibleRarity = isRevealed ? draw.rarity : RARITY_CYCLE[Math.max(0, cycleIndex)]
  const rarityMeta = ITEM_RARITY_META[visibleRarity]

  return (
    <div
      className={`tabletop-event-presentation${isRevealed ? ' is-revealed' : ' is-rolling'}`}
      data-phase={isRevealed ? 'revealed' : 'rolling'}
      data-testid="build-rarity-presentation"
      onClick={dismissPresentation}
      onKeyDown={handlePresentationKeyDown}
      role="dialog"
      style={{ '--rarity-color': rarityMeta.color } as CSSProperties}
      tabIndex={isRevealed ? 0 : -1}
    >
      <div className="tabletop-event-presentation__frame">
        <span className="eyebrow">
          {isRevealed ? 'Raridade revelada' : 'Lendo ressonancia'}
        </span>
        <h2>{draw.itemName}</h2>
        <p>{draw.characterName}</p>
        <strong className="tabletop-event-presentation__rarity">{rarityMeta.label}</strong>
        <div className="tabletop-event-presentation__marks" aria-hidden="true">
          {RARITY_CYCLE.map((rarity) => (
            <i className={rarity === visibleRarity ? 'is-active' : ''} key={rarity} />
          ))}
        </div>
        {isRevealed ? (
          <span className="tabletop-event-presentation__dismiss">
            Clique em qualquer lugar para continuar
          </span>
        ) : null}
      </div>
    </div>
  )
}
