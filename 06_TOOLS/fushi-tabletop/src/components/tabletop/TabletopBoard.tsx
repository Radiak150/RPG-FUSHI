import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type WheelEvent,
} from 'react'
import type {
  TabletopCell,
  TabletopGridSpan,
  TabletopMap,
  TabletopTokenSize,
  TabletopTokenVisibility,
} from '../../data/types'
import { resolveTabletopTokenSpan } from '../../lib/tabletop'

interface BoardTokenView {
  id: string
  label: string
  name: string
  color: string
  portraitUrl?: string
  tokenImageUrl?: string
  topdownImageUrl?: string
  cell: TabletopCell
  size: TabletopTokenSize
  customSize?: TabletopGridSpan
  visibility: TabletopTokenVisibility
  isSelected: boolean
  isPrimarySelected: boolean
  isControllable: boolean
}

interface TabletopBoardProps {
  map: TabletopMap
  cellSize: number
  tokens: BoardTokenView[]
  pings: Array<{
    id: string
    cell: TabletopCell
    label: string
  }>
  isGridVisible: boolean
  zoom: number
  fullscreen?: boolean
  isCameraLocked?: boolean
  overlay?: ReactNode
  isMeasureModeEnabled?: boolean
  viewportRef: RefObject<HTMLDivElement | null>
  onClearSelection: () => void
  onCellAction: (cell: TabletopCell) => void
  onTokenDrop: (input: { tokenId: string; cell: TabletopCell }) => void
  onTokenSelect: (tokenId: string, options: { additive: boolean }) => void
  onTokenClick?: (tokenId: string) => void
  onTokenOpen: (tokenId: string) => void
  onPing: (cell: TabletopCell) => void
  onViewportCameraChange?: (input: { scrollLeft: number; scrollTop: number }) => void
  onWheelZoom: (input: { deltaY: number; offsetX: number; offsetY: number }) => void
}

interface PanState {
  pointerId: number
  startClientX: number
  startClientY: number
  startScrollLeft: number
  startScrollTop: number
}

interface HoldPingState {
  pointerId: number
  timerId: number
}

interface TokenDragState {
  pointerId: number
  tokenId: string
  startClientX: number
  startClientY: number
  hasMoved: boolean
}

interface MeasurementState {
  pointerId: number
  start: TabletopCell
  end: TabletopCell
}

const HOLD_PING_DELAY = 420
const TOKEN_DRAG_THRESHOLD = 8

export function TabletopBoard({
  map,
  cellSize,
  tokens,
  pings,
  isGridVisible,
  zoom,
  fullscreen,
  isCameraLocked = false,
  overlay,
  isMeasureModeEnabled = false,
  viewportRef,
  onClearSelection,
  onCellAction,
  onTokenDrop,
  onTokenSelect,
  onTokenClick,
  onTokenOpen,
  onPing,
  onViewportCameraChange,
  onWheelZoom,
}: TabletopBoardProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const stageWidth = map.stageWidth || map.gridColumns * cellSize
  const stageHeight = map.stageHeight || map.gridRows * cellSize
  const wrapperWidth = stageWidth * zoom
  const wrapperHeight = stageHeight * zoom
  const cellWidth = stageWidth / map.gridColumns
  const cellHeight = stageHeight / map.gridRows
  const panStateRef = useRef<PanState | null>(null)
  const holdPingRef = useRef<HoldPingState | null>(null)
  const tokenDragRef = useRef<TokenDragState | null>(null)
  const measurementRef = useRef<MeasurementState | null>(null)
  const suppressTokenClickRef = useRef('')
  const suppressNextBoardClickRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)
  const [draggingTokenId, setDraggingTokenId] = useState('')
  const [measurement, setMeasurement] = useState<MeasurementState | null>(null)

  const resolveCellFromPoint = useCallback(
    (currentTarget: HTMLDivElement, clientX: number, clientY: number) => {
      const rect = currentTarget.getBoundingClientRect()
      const nextColumn = Math.min(
        map.gridColumns - 1,
        Math.max(
          0,
          Math.floor(((clientX - rect.left) / rect.width) * map.gridColumns),
        ),
      )
      const nextRow = Math.min(
        map.gridRows - 1,
        Math.max(
          0,
          Math.floor(((clientY - rect.top) / rect.height) * map.gridRows),
        ),
      )

      return {
        column: nextColumn,
        row: nextRow,
      }
    },
    [map.gridColumns, map.gridRows],
  )

  const resolveCellFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const stageElement = stageRef.current

      if (!stageElement) {
        return null
      }

      const rect = stageElement.getBoundingClientRect()

      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null
      }

      return resolveCellFromPoint(stageElement, clientX, clientY)
    },
    [resolveCellFromPoint],
  )

  function clearHoldPing() {
    if (holdPingRef.current) {
      window.clearTimeout(holdPingRef.current.timerId)
      holdPingRef.current = null
    }
  }

  function startMeasurement(pointerId: number, clientX: number, clientY: number) {
    const nextCell = resolveCellFromClientPoint(clientX, clientY)

    if (!nextCell) {
      return
    }

    const nextMeasurement = {
      pointerId,
      start: nextCell,
      end: nextCell,
    }

    clearHoldPing()
    suppressNextBoardClickRef.current = true
    measurementRef.current = nextMeasurement
    setMeasurement(nextMeasurement)
  }

  useEffect(() => {
    if (isMeasureModeEnabled) {
      return
    }

    measurementRef.current = null

    const timeoutId = window.setTimeout(() => {
      setMeasurement(null)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isMeasureModeEnabled])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const measurementState = measurementRef.current
      const tokenDrag = tokenDragRef.current
      const panState = panStateRef.current
      const viewport = viewportRef.current

      if (measurementState && measurementState.pointerId === event.pointerId) {
        const nextCell = resolveCellFromClientPoint(event.clientX, event.clientY)

        if (nextCell) {
          const nextMeasurement = {
            ...measurementState,
            end: nextCell,
          }

          measurementRef.current = nextMeasurement
          setMeasurement(nextMeasurement)
        }

        return
      }

      if (tokenDrag && tokenDrag.pointerId === event.pointerId) {
        const traveledDistance = Math.hypot(
          event.clientX - tokenDrag.startClientX,
          event.clientY - tokenDrag.startClientY,
        )

        if (!tokenDrag.hasMoved && traveledDistance >= TOKEN_DRAG_THRESHOLD) {
          tokenDragRef.current = {
            ...tokenDrag,
            hasMoved: true,
          }
          suppressNextBoardClickRef.current = true
          setDraggingTokenId(tokenDrag.tokenId)
        }

        return
      }

      if (!panState || !viewport || panState.pointerId !== event.pointerId) {
        return
      }

      viewport.scrollLeft =
        panState.startScrollLeft - (event.clientX - panState.startClientX)
      viewport.scrollTop =
        panState.startScrollTop - (event.clientY - panState.startClientY)
    }

    function handlePointerUp(event: PointerEvent) {
      if (measurementRef.current?.pointerId === event.pointerId) {
        const measurementState = measurementRef.current
        const nextCell = resolveCellFromClientPoint(event.clientX, event.clientY)

        measurementRef.current = null
        suppressNextBoardClickRef.current = true

        if (nextCell) {
          setMeasurement({
            ...measurementState,
            end: nextCell,
          })
        }
      }

      if (holdPingRef.current?.pointerId === event.pointerId) {
        window.clearTimeout(holdPingRef.current.timerId)
        holdPingRef.current = null
      }

      if (tokenDragRef.current?.pointerId === event.pointerId) {
        const tokenDrag = tokenDragRef.current
        tokenDragRef.current = null

        if (tokenDrag.hasMoved) {
          const nextCell = resolveCellFromClientPoint(event.clientX, event.clientY)

          suppressTokenClickRef.current = `drag:${tokenDrag.tokenId}`

          if (nextCell) {
            onTokenDrop({
              tokenId: tokenDrag.tokenId,
              cell: nextCell,
            })
          }
        }

        setDraggingTokenId((currentTokenId) =>
          currentTokenId === tokenDrag.tokenId ? '' : currentTokenId,
        )
      }

      if (panStateRef.current?.pointerId !== event.pointerId) {
        return
      }

      panStateRef.current = null
      setIsPanning(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)

      if (holdPingRef.current) {
        window.clearTimeout(holdPingRef.current.timerId)
        holdPingRef.current = null
      }
    }
  }, [onTokenDrop, resolveCellFromClientPoint, viewportRef])

  function handleBoardClick(event: MouseEvent<HTMLDivElement>) {
    if (isMeasureModeEnabled) {
      suppressNextBoardClickRef.current = false
      return
    }

    if (suppressNextBoardClickRef.current) {
      suppressNextBoardClickRef.current = false
      return
    }

    if (event.altKey) {
      onPing(resolveCellFromPoint(event.currentTarget, event.clientX, event.clientY))
      return
    }

    onCellAction(
      resolveCellFromPoint(event.currentTarget, event.clientX, event.clientY),
    )
  }

  function handleViewportPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current

    if (
      event.button === 0 &&
      event.target === event.currentTarget &&
      !isMeasureModeEnabled
    ) {
      onClearSelection()
    }

    if (!viewport || event.button !== 2 || isCameraLocked) {
      return
    }

    event.preventDefault()
    panStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    }
    setIsPanning(true)
  }

  function handleViewportWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()

    if (isCameraLocked) {
      return
    }

    const viewportRect = event.currentTarget.getBoundingClientRect()

    onWheelZoom({
      deltaY: event.deltaY,
      offsetX: event.clientX - viewportRect.left,
      offsetY: event.clientY - viewportRect.top,
    })
  }

  function handleBoardPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return
    }

    if (isMeasureModeEnabled) {
      event.preventDefault()
      startMeasurement(event.pointerId, event.clientX, event.clientY)
      return
    }

    if (event.altKey) {
      suppressNextBoardClickRef.current = true
      onPing(
        resolveCellFromPoint(event.currentTarget, event.clientX, event.clientY),
      )
      return
    }

    const nextCell = resolveCellFromPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )
    const timerId = window.setTimeout(() => {
      suppressNextBoardClickRef.current = true
      holdPingRef.current = null
      onPing(nextCell)
    }, HOLD_PING_DELAY)

    holdPingRef.current = {
      pointerId: event.pointerId,
      timerId,
    }
  }

  const measurementDisplay = measurement
    ? (() => {
        const startX = ((measurement.start.column + 0.5) / map.gridColumns) * 100
        const startY = ((measurement.start.row + 0.5) / map.gridRows) * 100
        const endX = ((measurement.end.column + 0.5) / map.gridColumns) * 100
        const endY = ((measurement.end.row + 0.5) / map.gridRows) * 100
        const gridDistance = Math.hypot(
          measurement.end.column - measurement.start.column,
          measurement.end.row - measurement.start.row,
        )
        const metersText = Number.isInteger(gridDistance)
          ? `${gridDistance} m`
          : `${gridDistance.toFixed(1)} m`
        const feetText = `${Math.round(gridDistance * 3.28084)} ft`

        return {
          endX,
          endY,
          label: `${metersText} / ${feetText}`,
          midX: (startX + endX) / 2,
          midY: (startY + endY) / 2,
          squaresText: `${gridDistance.toFixed(gridDistance % 1 === 0 ? 0 : 1)} q`,
          startX,
          startY,
        }
      })()
    : null

  return (
    <div className={`tabletop-board${fullscreen ? ' tabletop-board--fullscreen' : ''}`}>
      <div
        className={`tabletop-board__viewport${
          isPanning ? ' tabletop-board__viewport--panning' : ''
        }`}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={handleViewportPointerDown}
        onScroll={(event) =>
          onViewportCameraChange?.({
            scrollLeft: event.currentTarget.scrollLeft,
            scrollTop: event.currentTarget.scrollTop,
          })
        }
        onWheel={handleViewportWheel}
        ref={viewportRef}
      >
        <div
          className="tabletop-board__wrapper"
          style={{
            width: `${wrapperWidth}px`,
            height: `${wrapperHeight}px`,
          }}
        >
          <div
            className={`tabletop-board__stage${
              isMeasureModeEnabled ? ' tabletop-board__stage--measuring' : ''
            }`}
            onClick={handleBoardClick}
            onPointerDown={handleBoardPointerDown}
            ref={stageRef}
            style={{
              width: `${stageWidth}px`,
              height: `${stageHeight}px`,
              transform: `scale(${zoom})`,
            }}
          >
            <img
              alt={map.name}
              className="tabletop-board__image"
              draggable={false}
              src={map.image}
            />

            {isGridVisible ? (
              <div
                className="tabletop-board__grid"
                style={{
                  backgroundSize: `${100 / map.gridColumns}% 100%, 100% ${100 / map.gridRows}%`,
                }}
              />
            ) : null}

            {overlay}

            {measurementDisplay ? (
              <div className="tabletop-measurement" aria-hidden="true">
                <svg className="tabletop-measurement__svg" viewBox="0 0 100 100">
                  <line
                    className="tabletop-measurement__line"
                    x1={measurementDisplay.startX}
                    x2={measurementDisplay.endX}
                    y1={measurementDisplay.startY}
                    y2={measurementDisplay.endY}
                  />
                </svg>
                <div
                  className="tabletop-measurement__label"
                  style={{
                    left: `${measurementDisplay.midX}%`,
                    top: `${measurementDisplay.midY}%`,
                  }}
                >
                  <strong>{measurementDisplay.label}</strong>
                  <span>{measurementDisplay.squaresText}</span>
                </div>
              </div>
            ) : null}

            {pings.map((ping) => (
              <div
                className="tabletop-ping"
                key={ping.id}
                style={{
                  left: `${((ping.cell.column + 0.5) / map.gridColumns) * 100}%`,
                  top: `${((ping.cell.row + 0.5) / map.gridRows) * 100}%`,
                }}
              >
                <div className="tabletop-ping__pulse" />
                <div className="tabletop-ping__label">{ping.label}</div>
              </div>
            ))}

            {tokens.map((token) => {
              const tokenSpan = resolveTabletopTokenSpan(token)

              return (
                <button
                  aria-label={`Selecionar ${token.name}`}
                  className={`tabletop-token${
                    token.isSelected ? ' tabletop-token--selected' : ''
                  }${token.isPrimarySelected ? ' tabletop-token--primary' : ''}${
                    token.isControllable ? '' : ' tabletop-token--locked'
                  }${token.visibility === 'gm' ? ' tabletop-token--gm-only' : ''}${
                    token.visibility === 'public' ? ' tabletop-token--public' : ''
                  }${draggingTokenId === token.id ? ' tabletop-token--dragging' : ''}${
                    tokenSpan.preset === 'custom' ? ' tabletop-token--custom' : ''
                  }`}
                  key={token.id}
                  onPointerDown={(event) => {
                    if (event.button === 2) {
                      return
                    }

                    event.stopPropagation()

                    if (isMeasureModeEnabled) {
                      if (event.button === 0) {
                        event.preventDefault()
                        startMeasurement(event.pointerId, event.clientX, event.clientY)
                      }

                      return
                    }

                    if (event.button !== 0 || !token.isControllable) {
                      return
                    }

                    onTokenSelect(token.id, { additive: event.shiftKey })
                    suppressTokenClickRef.current = token.id

                    tokenDragRef.current = {
                      pointerId: event.pointerId,
                      tokenId: token.id,
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      hasMoved: false,
                    }
                  }}
                  onClick={(event) => {
                    event.stopPropagation()

                    if (suppressTokenClickRef.current === `drag:${token.id}`) {
                      suppressTokenClickRef.current = ''
                      return
                    }

                    if (suppressTokenClickRef.current === token.id) {
                      suppressTokenClickRef.current = ''
                      onTokenClick?.(token.id)
                      return
                    }

                    if (event.altKey) {
                      onPing(token.cell)
                      return
                    }

                    onTokenClick?.(token.id)
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    onTokenOpen(token.id)
                  }}
                  style={{
                    left: `${(token.cell.column / map.gridColumns) * 100}%`,
                    top: `${(token.cell.row / map.gridRows) * 100}%`,
                    width: `${cellWidth * tokenSpan.columns}px`,
                    height: `${cellHeight * tokenSpan.rows}px`,
                    ['--token-color' as string]: token.color,
                    ['--token-size' as string]: `${tokenSpan.columns}`,
                    ['--token-width' as string]: `${tokenSpan.columns}`,
                    ['--token-height' as string]: `${tokenSpan.rows}`,
                  }}
                  title={
                    token.visibility === 'gm'
                      ? `${token.name} - visivel so para o mestre`
                      : token.name
                  }
                  type="button"
                >
                  {token.topdownImageUrl || token.tokenImageUrl || token.portraitUrl ? (
                    <div className="tabletop-token__art">
                      <img
                        alt=""
                        className="tabletop-token__image"
                        src={
                          token.topdownImageUrl ??
                          token.tokenImageUrl ??
                          token.portraitUrl
                        }
                      />
                      <span className="tabletop-token__badge">{token.label}</span>
                    </div>
                  ) : (
                    <div className="tabletop-token__art tabletop-token__art--fallback">
                      <span className="tabletop-token__label">{token.label}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
