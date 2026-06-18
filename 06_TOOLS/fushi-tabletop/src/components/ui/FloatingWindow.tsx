import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

interface FloatingWindowProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  initialPosition?: {
    x: number
    y: number
  }
  initialSize?: {
    width: number
    height: number
  }
  restoreSignal?: number | string
  minimizeSignal?: number | string
  defaultExpanded?: boolean
  className?: string
}

interface DragState {
  pointerId: number
  offsetX: number
  offsetY: number
}

interface ResizeState {
  pointerId: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  edge: 'right' | 'bottom' | 'corner'
}

const WINDOW_MIN_WIDTH = 320
const WINDOW_MIN_HEIGHT = 240
const WINDOW_MARGIN = 16
const WINDOW_MINIMIZED_HEIGHT = 58

function clampWindowSize(size: { width: number; height: number }) {
  return {
    width: Math.max(
      WINDOW_MIN_WIDTH,
      Math.min(window.innerWidth - WINDOW_MARGIN * 2, size.width),
    ),
    height: Math.max(
      WINDOW_MIN_HEIGHT,
      Math.min(window.innerHeight - WINDOW_MARGIN * 2, size.height),
    ),
  }
}

function clampWindowPosition(value: number, viewportSize: number, windowSize: number) {
  const maxPosition = Math.max(
    WINDOW_MARGIN,
    viewportSize - windowSize - WINDOW_MARGIN,
  )

  return Math.min(Math.max(WINDOW_MARGIN, value), maxPosition)
}

function areWindowSizesEqual(
  left: { width: number; height: number },
  right: { width: number; height: number },
) {
  return left.width === right.width && left.height === right.height
}

function areWindowPositionsEqual(
  left: { x: number; y: number },
  right: { x: number; y: number },
) {
  return left.x === right.x && left.y === right.y
}

function clampFloatingWindowPosition(
  position: { x: number; y: number },
  rect: Pick<DOMRect, 'height' | 'width'>,
) {
  return {
    x: clampWindowPosition(position.x, window.innerWidth, rect.width),
    y: clampWindowPosition(position.y, window.innerHeight, rect.height),
  }
}

export function FloatingWindow({
  title,
  subtitle,
  onClose,
  children,
  footer,
  initialPosition,
  initialSize,
  minimizeSignal,
  restoreSignal,
  defaultExpanded,
  className,
}: FloatingWindowProps) {
  const windowRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)
  const lastMinimizeSignalRef = useRef(minimizeSignal)
  const [position, setPosition] = useState(() => ({
    x: initialPosition?.x ?? 96,
    y: initialPosition?.y ?? 96,
  }))
  const [size, setSize] = useState(() =>
    clampWindowSize({
      width: initialSize?.width ?? 420,
      height: initialSize?.height ?? 540,
    }),
  )
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(Boolean(defaultExpanded))
  const [isCompact, setIsCompact] = useState(false)

  const classes = useMemo(
    () =>
      `floating-window${isExpanded ? ' floating-window--expanded' : ''}${
        isMinimized ? ' floating-window--minimized' : ''
      }${isCompact ? ' floating-window--compact' : ''}${
        className ? ` ${className}` : ''
      }`,
    [className, isCompact, isExpanded, isMinimized],
  )

  useEffect(() => {
    if (restoreSignal === undefined) {
      return
    }

    dragStateRef.current = null
    resizeStateRef.current = null

    const timeoutId = window.setTimeout(() => {
      setIsMinimized(false)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [restoreSignal])

  useEffect(() => {
    if (minimizeSignal === undefined) {
      lastMinimizeSignalRef.current = minimizeSignal
      return
    }

    if (lastMinimizeSignalRef.current === minimizeSignal) {
      return
    }

    lastMinimizeSignalRef.current = minimizeSignal
    dragStateRef.current = null
    resizeStateRef.current = null
    setIsMinimized(true)
  }, [minimizeSignal])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current
      const resizeState = resizeStateRef.current
      const element = windowRef.current

      if (resizeState && resizeState.pointerId === event.pointerId) {
        const nextSize = clampWindowSize({
          width: resizeState.startWidth + (event.clientX - resizeState.startX),
          height: resizeState.startHeight + (event.clientY - resizeState.startY),
        })

        setSize((currentSize) => {
          const nextWindowSize = {
            width:
              resizeState.edge === 'right' || resizeState.edge === 'corner'
                ? nextSize.width
                : currentSize.width,
            height:
              resizeState.edge === 'bottom' || resizeState.edge === 'corner'
                ? nextSize.height
                : currentSize.height,
          }

          return areWindowSizesEqual(currentSize, nextWindowSize) ? currentSize : nextWindowSize
        })
        return
      }

      if (!dragState || !element || dragState.pointerId !== event.pointerId) {
        return
      }

      const rect = element.getBoundingClientRect()
      const nextX = clampWindowPosition(
        event.clientX - dragState.offsetX,
        window.innerWidth,
        rect.width,
      )
      const nextY = clampWindowPosition(
        event.clientY - dragState.offsetY,
        window.innerHeight,
        rect.height,
      )

      const nextPosition = {
        x: nextX,
        y: nextY,
      }

      setPosition((currentPosition) =>
        areWindowPositionsEqual(currentPosition, nextPosition)
          ? currentPosition
          : nextPosition,
      )
    }

    function handlePointerUp(event: PointerEvent) {
      if (dragStateRef.current?.pointerId === event.pointerId) {
        dragStateRef.current = null
      }

      if (resizeStateRef.current?.pointerId === event.pointerId) {
        resizeStateRef.current = null
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  useEffect(() => {
    function handleResize() {
      const element = windowRef.current

      if (!element) {
        return
      }

      setSize((currentSize) => {
        const nextSize = clampWindowSize(currentSize)

        return areWindowSizesEqual(currentSize, nextSize) ? currentSize : nextSize
      })

      const rect = element.getBoundingClientRect()

      setPosition((currentPosition) => {
        const nextPosition = clampFloatingWindowPosition(currentPosition, rect)

        return areWindowPositionsEqual(currentPosition, nextPosition)
          ? currentPosition
          : nextPosition
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  function toggleMinimized() {
    dragStateRef.current = null
    resizeStateRef.current = null
    setIsMinimized((currentState) => !currentState)
  }

  function handleHeaderPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const element = windowRef.current

    if (!element) {
      return
    }

    const rect = element.getBoundingClientRect()

    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
  }

  function handleResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    edge: ResizeState['edge'],
  ) {
    event.stopPropagation()

    const element = windowRef.current

    if (!element || isExpanded) {
      return
    }

    const rect = element.getBoundingClientRect()

    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      edge,
    }
  }

  return (
    <div
      className={classes}
      ref={windowRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isExpanded
          ? 'min(1180px, calc(100vw - 32px))'
          : `min(${size.width}px, calc(100vw - 32px))`,
        height: isMinimized
          ? `${WINDOW_MINIMIZED_HEIGHT}px`
          : isExpanded
            ? 'min(860px, calc(100vh - 32px))'
            : `min(${size.height}px, calc(100vh - 32px))`,
      }}
    >
      <div
        className="floating-window__header"
        onDoubleClick={toggleMinimized}
        onPointerDown={handleHeaderPointerDown}
        role="presentation"
      >
        <div className="floating-window__title">
          <p className="eyebrow">Janela</p>
          <h3>{title}</h3>
          {subtitle ? <p className="support-copy">{subtitle}</p> : null}
        </div>

        <div
          className="floating-window__actions"
          onDoubleClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          role="presentation"
        >
          <button
            aria-label={isCompact ? 'Restaurar opacidade' : 'Modo compacto'}
            className="tabletop-icon-button"
            onClick={() => setIsCompact((currentState) => !currentState)}
            type="button"
          >
            ~
          </button>
          <button
            aria-label={isMinimized ? 'Expandir janela' : 'Minimizar janela'}
            className="tabletop-icon-button"
            onClick={toggleMinimized}
            type="button"
          >
            {isMinimized ? '+' : '-'}
          </button>
          <button
            aria-label={isExpanded ? 'Reduzir janela' : 'Expandir janela'}
            className="tabletop-icon-button"
            onClick={() => setIsExpanded((currentState) => !currentState)}
            type="button"
          >
            {isExpanded ? '<' : '>'}
          </button>
          <button
            aria-label="Fechar janela"
            className="tabletop-icon-button"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
      </div>

      {!isMinimized ? (
        <div className="floating-window__content">
          {children}
        </div>
      ) : null}
      {footer && !isMinimized ? (
        <div className="floating-window__footer">
          {footer}
        </div>
      ) : null}

      {!isExpanded && !isMinimized ? (
        <>
          <button
            aria-label="Redimensionar lateral"
            className="floating-window__resize-handle floating-window__resize-handle--right"
            onPointerDown={(event) => handleResizePointerDown(event, 'right')}
            type="button"
          />
          <button
            aria-label="Redimensionar altura"
            className="floating-window__resize-handle floating-window__resize-handle--bottom"
            onPointerDown={(event) => handleResizePointerDown(event, 'bottom')}
            type="button"
          />
          <button
            aria-label="Redimensionar janela"
            className="floating-window__resize-handle floating-window__resize-handle--corner"
            onPointerDown={(event) => handleResizePointerDown(event, 'corner')}
            type="button"
          />
        </>
      ) : null}
    </div>
  )
}
