import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type WheelEvent,
} from 'react'
import type {
  TabletopCamera3DState,
  TabletopCell,
  TabletopGridSpan,
  TabletopMap,
  TabletopBoardObject,
  TabletopObjectRenderMode,
  TabletopObjectVisibility,
  TabletopTokenSize,
  TabletopTokenVisibility,
} from '../../data/types'
import type { VisualQualityMode } from '../../lib/productPreferences'
import {
  resolveRuntimeAssetUrl,
  resolveRuntimeAssetVariantUrl,
  resolveRuntimeCssAssetUrl,
} from '../../lib/runtimeAssets'
import { resolveTabletopTokenSpan } from '../../lib/tabletop'
import {
  Tabletop3DStage,
  type Tabletop3DBoardImpact,
  type Tabletop3DEditorTool,
} from '../../rendering/three/Tabletop3DStage'
import { TabletopObject3D } from '../../rendering/three/TabletopObject3D'
import { TabletopObjectVfxLayer } from '../../rendering/pixi/TabletopObjectVfxLayer'
import {
  resolveBiomeCinematicAsset,
  resolveBiomeCinematicBackdrop,
} from '../../rendering/biomeCinematicAssets'

interface BoardTokenView {
  id: string
  label: string
  name: string
  color: string
  borderColor?: string
  portraitUrl?: string
  tokenImageUrl?: string
  cell: TabletopCell
  size: TabletopTokenSize
  customSize?: TabletopGridSpan
  visibility: TabletopTokenVisibility
  isSelected: boolean
  isPrimarySelected: boolean
  isControllable: boolean
  isMovable: boolean
  isStealthed?: boolean
}

interface BoardObjectView {
  id: string
  name: string
  label: string
  description?: string
  assetUrl?: string
  color?: string
  linkedItemId?: string
  modelUrl?: string
  modelNodeName?: string
  objectType: TabletopBoardObject['objectType']
  renderMode: TabletopObjectRenderMode
  cell: TabletopCell
  size: TabletopTokenSize
  customSize?: TabletopGridSpan
  placement3d?: TabletopBoardObject['placement3d']
  visibility: TabletopObjectVisibility
  isSelected: boolean
  isControllable: boolean
}

function TokenArtwork({ token }: { token: BoardTokenView }) {
  const imageUrls = [
    token.tokenImageUrl,
    token.portraitUrl,
  ]
    .filter((url): url is string => Boolean(url))
    .map((url) => resolveRuntimeAssetUrl(url))
    .filter((url, index, urls) => url && urls.indexOf(url) === index)
  const imageKey = imageUrls.join('|')
  const [imageState, setImageState] = useState({ index: 0, key: '' })
  const imageIndex = imageState.key === imageKey ? imageState.index : 0

  const currentImageUrl = imageUrls[imageIndex] ?? ''

  if (!currentImageUrl) {
    return (
      <div className="tabletop-token__art tabletop-token__art--fallback">
        <span className="tabletop-token__label">{token.label}</span>
      </div>
    )
  }

  return (
    <div className="tabletop-token__art">
      <img
        alt=""
        className="tabletop-token__image"
        onError={() => setImageState({ index: imageIndex + 1, key: imageKey })}
        src={currentImageUrl}
      />
      <span className="tabletop-token__badge">{token.label}</span>
    </div>
  )
}

function MapArtwork({
  map,
  visualQuality,
}: {
  map: TabletopMap
  visualQuality: VisualQualityMode
}) {
  const imageUrls = [
    resolveRuntimeAssetVariantUrl(map.image, {
      kind: 'tabletop-map',
      visualQuality,
    }),
    resolveRuntimeAssetUrl(map.image),
    resolveRuntimeAssetVariantUrl(map.imageUrl, {
      kind: 'tabletop-map',
      visualQuality,
    }),
    resolveRuntimeAssetUrl(map.imageUrl),
    resolveRuntimeAssetUrl(map.previewImage),
    resolveRuntimeAssetUrl(map.thumbnailUrl),
  ].filter((url, index, urls): url is string => Boolean(url) && urls.indexOf(url) === index)
  const imageKey = `${map.id}:${imageUrls.join('|')}`
  const [imageState, setImageState] = useState({
    index: 0,
    key: '',
    loaded: false,
  })
  const activeState =
    imageState.key === imageKey
      ? imageState
      : {
          index: 0,
          key: imageKey,
          loaded: false,
        }
  const currentImageUrl = imageUrls[activeState.index] ?? ''
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoState, setVideoState] = useState<{
    key: string
    status: 'loading' | 'ready' | 'failed'
  }>({
    key: '',
    status: 'loading',
  })
  const animatedSurface = map.animatedSurface
  const minimumQuality = animatedSurface?.minQuality ?? 'balanced'
  const canRenderAnimatedSurface =
    animatedSurface?.enabled !== false &&
    Boolean(animatedSurface?.source) &&
    visualQuality !== 'low' &&
    (minimumQuality !== 'ultra' || visualQuality === 'ultra')
  const animatedSource = canRenderAnimatedSurface
    ? resolveRuntimeAssetUrl(animatedSurface?.source)
    : ''
  const animatedPoster = resolveRuntimeAssetUrl(
    animatedSurface?.poster ?? currentImageUrl,
  )
  const animatedKey = `${map.id}:${animatedSource}`
  const videoStatus =
    videoState.key === animatedKey ? videoState.status : 'loading'

  useEffect(() => {
    const video = videoRef.current

    if (!video || !animatedSource) {
      return
    }

    const activeVideo = video

    function syncPlayback() {
      if (document.hidden) {
        activeVideo.pause()
        return
      }

      void activeVideo.play().catch(() =>
        setVideoState({
          key: animatedKey,
          status: 'failed',
        }),
      )
    }

    document.addEventListener('visibilitychange', syncPlayback)
    syncPlayback()

    return () => {
      document.removeEventListener('visibilitychange', syncPlayback)
      activeVideo.pause()
      activeVideo.removeAttribute('src')
      activeVideo.load()
    }
  }, [animatedKey, animatedSource])

  if (!currentImageUrl) {
    return (
      <div
        className="tabletop-board__image-fallback"
        data-map-image-status="unavailable"
      >
        <strong>{map.name}</strong>
        <span>Imagem do mapa indisponivel.</span>
      </div>
    )
  }

  return (
    <>
      {!activeState.loaded ? (
        <div
          className="tabletop-board__image-fallback"
          data-map-image-status="loading"
        >
          <strong>{map.name}</strong>
          <span>Preparando imagem do mapa...</span>
        </div>
      ) : null}
      <img
        alt={map.name}
        className="tabletop-board__image"
        data-map-image-index={activeState.index}
        data-map-image-status={activeState.loaded ? 'ready' : 'loading'}
        draggable={false}
        onError={() =>
          setImageState({
            index: activeState.index + 1,
            key: imageKey,
            loaded: false,
          })
        }
        onLoad={(event) => {
          if (event.currentTarget.naturalWidth <= 0) {
            setImageState({
              index: activeState.index + 1,
              key: imageKey,
              loaded: false,
            })
            return
          }

          setImageState({
            index: activeState.index,
            key: imageKey,
            loaded: true,
          })
        }}
        src={currentImageUrl}
      />
      {animatedSource && videoStatus !== 'failed' ? (
        <video
          aria-hidden="true"
          autoPlay
          className={`tabletop-board__video${
            videoStatus === 'ready' ? ' tabletop-board__video--ready' : ''
          }`}
          data-map-video-status={videoStatus}
          key={animatedKey}
          loop={animatedSurface?.loop !== false}
          muted
          onCanPlay={(event) => {
            event.currentTarget.playbackRate = animatedSurface?.playbackRate ?? 1
            setVideoState({
              key: animatedKey,
              status: 'ready',
            })
          }}
          onError={() =>
            setVideoState({
              key: animatedKey,
              status: 'failed',
            })
          }
          playsInline
          poster={animatedPoster}
          preload="metadata"
          ref={videoRef}
          src={animatedSource}
        />
      ) : null}
    </>
  )
}

interface TabletopBoardProps {
  map: TabletopMap
  cellSize: number
  tokens: BoardTokenView[]
  objects?: BoardObjectView[]
  pings: Array<{
    id: string
    cell: TabletopCell
    label: string
  }>
  isGridVisible: boolean
  zoom: number
  boardImpact?: Tabletop3DBoardImpact | null
  fullscreen?: boolean
  camera3dState?: TabletopCamera3DState
  editor3dTool?: Tabletop3DEditorTool
  isCameraLocked?: boolean
  is3dCameraEditorEnabled?: boolean
  is3dFreeCameraVisible?: boolean
  isObjectPlacementActive?: boolean
  overlay?: ReactNode
  isMeasureModeEnabled?: boolean
  measurementColor?: string
  measurementLabel?: string
  sharedMeasurement?: SharedMeasurementView | null
  visualQuality?: VisualQualityMode
  viewportRef: RefObject<HTMLDivElement | null>
  onClearSelection: () => void
  onCellAction: (cell: TabletopCell) => void
  onMeasurementChange?: (measurement: { start: TabletopCell; end: TabletopCell } | null) => void
  onTokenDrop: (input: { tokenId: string; cell: TabletopCell }) => void
  onTokenSelect: (tokenId: string, options: { additive: boolean }) => void
  onTokenClick?: (tokenId: string) => void
  onTokenOpen: (tokenId: string) => void
  on3dCameraChange?: (cameraState: TabletopCamera3DState) => void
  on3dEditorToolChange?: (tool: Tabletop3DEditorTool) => void
  on3dObjectPlacementChange?: (
    objectId: string,
    placement3d: NonNullable<TabletopBoardObject['placement3d']>,
  ) => void
  on3dObjectCreateAtPlacement?: (input: {
    cell: TabletopCell
    placement3d: NonNullable<TabletopBoardObject['placement3d']>
  }) => void
  onObjectDrop?: (input: {
    cell: TabletopCell
    objectId: string
    placement3d?: NonNullable<TabletopBoardObject['placement3d']>
  }) => void
  onObjectDuplicate?: (objectId: string) => void
  onObjectConfirm?: () => void
  onObjectRemove?: (objectId: string) => void
  onObjectSelect?: (objectId: string) => void
  onObjectUndo?: () => void
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

interface ObjectDragState {
  objectId: string
  pointerId: number
  startClientX: number
  startClientY: number
  hasMoved: boolean
}

interface MeasurementState {
  pointerId: number
  start: TabletopCell
  end: TabletopCell
}

type MeasurementSyncPayload = {
  start: TabletopCell
  end: TabletopCell
} | null

interface SharedMeasurementView {
  start: TabletopCell
  end: TabletopCell
  color?: string
  label?: string
}

const HOLD_PING_DELAY = 420
const TOKEN_DRAG_THRESHOLD = 8
const MEASUREMENT_SYNC_INTERVAL_MS = 90

function isSameCell(first: TabletopCell, second: TabletopCell) {
  return first.column === second.column && first.row === second.row
}

export function TabletopBoard({
  map,
  cellSize,
  tokens,
  objects = [],
  pings,
  isGridVisible,
  zoom,
  boardImpact = null,
  fullscreen,
  camera3dState,
  editor3dTool,
  isCameraLocked = false,
  is3dCameraEditorEnabled = false,
  is3dFreeCameraVisible = false,
  isObjectPlacementActive = false,
  overlay,
  isMeasureModeEnabled = false,
  measurementColor = '#d8a34d',
  measurementLabel,
  sharedMeasurement = null,
  visualQuality = 'balanced',
  viewportRef,
  onClearSelection,
  onCellAction,
  onMeasurementChange,
  onTokenDrop,
  onTokenSelect,
  onTokenClick,
  onTokenOpen,
  on3dCameraChange,
  on3dEditorToolChange,
  on3dObjectCreateAtPlacement,
  on3dObjectPlacementChange,
  onObjectDrop,
  onObjectDuplicate,
  onObjectConfirm,
  onObjectRemove,
  onObjectSelect,
  onObjectUndo,
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
  const objectDragRef = useRef<ObjectDragState | null>(null)
  const measurementRef = useRef<MeasurementState | null>(null)
  const onMeasurementChangeRef = useRef(onMeasurementChange)
  const measurementSyncTimeoutRef = useRef<number | null>(null)
  const pendingMeasurementSyncRef = useRef<MeasurementSyncPayload | null>(null)
  const lastMeasurementSyncAtRef = useRef(0)
  const suppressTokenClickRef = useRef('')
  const suppressObjectClickRef = useRef('')
  const suppressNextBoardClickRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)
  const [draggingTokenId, setDraggingTokenId] = useState('')
  const [draggingObjectId, setDraggingObjectId] = useState('')
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

  const resolveObjectPlacementFromClientPoint = useCallback(
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

      const normalizedX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const normalizedY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))

      return {
        cell: {
          column: Math.min(
            map.gridColumns - 1,
            Math.max(0, Math.floor(normalizedX * map.gridColumns)),
          ),
          row: Math.min(
            map.gridRows - 1,
            Math.max(0, Math.floor(normalizedY * map.gridRows)),
          ),
        },
        placement3d: {
          x: normalizedX,
          y: normalizedY,
        },
      }
    },
    [map.gridColumns, map.gridRows],
  )

  function clearHoldPing() {
    if (holdPingRef.current) {
      window.clearTimeout(holdPingRef.current.timerId)
      holdPingRef.current = null
    }
  }

  useEffect(() => {
    onMeasurementChangeRef.current = onMeasurementChange
  }, [onMeasurementChange])

  const emitMeasurementChange = useCallback(
    (nextMeasurement: MeasurementSyncPayload, options: { immediate?: boolean } = {}) => {
      const clearScheduledSync = () => {
        if (measurementSyncTimeoutRef.current !== null) {
          window.clearTimeout(measurementSyncTimeoutRef.current)
          measurementSyncTimeoutRef.current = null
        }
        pendingMeasurementSyncRef.current = null
      }

      if (options.immediate || nextMeasurement === null) {
        clearScheduledSync()
        lastMeasurementSyncAtRef.current = performance.now()
        onMeasurementChangeRef.current?.(nextMeasurement)
        return
      }

      const now = performance.now()
      const elapsed = now - lastMeasurementSyncAtRef.current

      if (elapsed >= MEASUREMENT_SYNC_INTERVAL_MS) {
        clearScheduledSync()
        lastMeasurementSyncAtRef.current = now
        onMeasurementChangeRef.current?.(nextMeasurement)
        return
      }

      pendingMeasurementSyncRef.current = nextMeasurement

      if (measurementSyncTimeoutRef.current !== null) {
        return
      }

      measurementSyncTimeoutRef.current = window.setTimeout(() => {
        measurementSyncTimeoutRef.current = null
        const pendingMeasurement = pendingMeasurementSyncRef.current
        pendingMeasurementSyncRef.current = null
        lastMeasurementSyncAtRef.current = performance.now()
        onMeasurementChangeRef.current?.(pendingMeasurement)
      }, Math.max(0, MEASUREMENT_SYNC_INTERVAL_MS - elapsed))
    },
    [],
  )

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
    emitMeasurementChange(
      {
        start: nextMeasurement.start,
        end: nextMeasurement.end,
      },
      { immediate: true },
    )
  }

  useEffect(() => {
    if (isMeasureModeEnabled) {
      return
    }

    measurementRef.current = null
    emitMeasurementChange(null, { immediate: true })

    const timeoutId = window.setTimeout(() => {
      setMeasurement(null)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [emitMeasurementChange, isMeasureModeEnabled])

  useEffect(
    () => () => {
      if (measurementSyncTimeoutRef.current !== null) {
        window.clearTimeout(measurementSyncTimeoutRef.current)
        measurementSyncTimeoutRef.current = null
      }
      pendingMeasurementSyncRef.current = null
    },
    [],
  )

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport || !is3dFreeCameraVisible) {
      return
    }

    const lockedScroll = {
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    }
    const restoreLockedScroll = () => {
      viewport.scrollLeft = lockedScroll.left
      viewport.scrollTop = lockedScroll.top
    }

    restoreLockedScroll()
    viewport.addEventListener('scroll', restoreLockedScroll)

    return () => {
      viewport.removeEventListener('scroll', restoreLockedScroll)
    }
  }, [is3dFreeCameraVisible, viewportRef])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const measurementState = measurementRef.current
      const tokenDrag = tokenDragRef.current
      const objectDrag = objectDragRef.current
      const panState = panStateRef.current
      const viewport = viewportRef.current

      if (measurementState && measurementState.pointerId === event.pointerId) {
        const nextCell = resolveCellFromClientPoint(event.clientX, event.clientY)

        if (nextCell) {
          if (isSameCell(measurementState.end, nextCell)) {
            return
          }

          const nextMeasurement = {
            ...measurementState,
            end: nextCell,
          }

          measurementRef.current = nextMeasurement
          setMeasurement(nextMeasurement)
          emitMeasurementChange({
            start: nextMeasurement.start,
            end: nextMeasurement.end,
          })
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

      if (objectDrag && objectDrag.pointerId === event.pointerId) {
        const traveledDistance = Math.hypot(
          event.clientX - objectDrag.startClientX,
          event.clientY - objectDrag.startClientY,
        )

        if (!objectDrag.hasMoved && traveledDistance >= TOKEN_DRAG_THRESHOLD) {
          objectDragRef.current = {
            ...objectDrag,
            hasMoved: true,
          }
          suppressNextBoardClickRef.current = true
          setDraggingObjectId(objectDrag.objectId)
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
          const nextMeasurement = {
            ...measurementState,
            end: nextCell,
          }

          setMeasurement(nextMeasurement)
          emitMeasurementChange(
            {
              start: nextMeasurement.start,
              end: nextMeasurement.end,
            },
            { immediate: true },
          )
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

      if (objectDragRef.current?.pointerId === event.pointerId) {
        const objectDrag = objectDragRef.current
        objectDragRef.current = null

        if (objectDrag.hasMoved) {
          const nextPlacement = resolveObjectPlacementFromClientPoint(
            event.clientX,
            event.clientY,
          )

          suppressObjectClickRef.current = `drag:${objectDrag.objectId}`

          if (nextPlacement) {
            const sourceObject =
              objects.find((object) => object.id === objectDrag.objectId) ?? null
            const existingPlacement: Partial<
              NonNullable<TabletopBoardObject['placement3d']>
            > = sourceObject?.placement3d ?? {}

            onObjectDrop?.({
              objectId: objectDrag.objectId,
              cell: nextPlacement.cell,
              placement3d:
                sourceObject?.renderMode === 'three'
                  ? {
                      ...existingPlacement,
                      ...nextPlacement.placement3d,
                      z: existingPlacement.z ?? 0,
                      rotationX: existingPlacement.rotationX ?? 0,
                      rotationY: existingPlacement.rotationY ?? 0,
                      rotationZ: existingPlacement.rotationZ ?? 0,
                      scale: existingPlacement.scale ?? 1,
                    }
                  : undefined,
            })
          }
        }

        setDraggingObjectId((currentObjectId) =>
          currentObjectId === objectDrag.objectId ? '' : currentObjectId,
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
  }, [
    emitMeasurementChange,
    objects,
    onObjectDrop,
    onTokenDrop,
    resolveCellFromClientPoint,
    resolveObjectPlacementFromClientPoint,
    viewportRef,
  ])

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

  function buildMeasurementDisplay(input: {
    color?: string
    end: TabletopCell
    label?: string
    start: TabletopCell
  }) {
    const startX = ((input.start.column + 0.5) / map.gridColumns) * 100
    const startY = ((input.start.row + 0.5) / map.gridRows) * 100
    const endX = ((input.end.column + 0.5) / map.gridColumns) * 100
    const endY = ((input.end.row + 0.5) / map.gridRows) * 100
    const gridDistance = Math.hypot(
      input.end.column - input.start.column,
      input.end.row - input.start.row,
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
      color: input.color ?? measurementColor,
      ownerLabel: input.label,
      squaresText: `${gridDistance.toFixed(gridDistance % 1 === 0 ? 0 : 1)} q`,
      startX,
      startY,
    }
  }

  const measurementDisplay = measurement
    ? buildMeasurementDisplay({
        ...measurement,
        color: measurementColor,
        label: measurementLabel,
      })
    : sharedMeasurement
      ? buildMeasurementDisplay(sharedMeasurement)
      : null
  const biomeCinematicAsset = resolveBiomeCinematicAsset(map.biomeId)
  const biomeBackdrop = resolveBiomeCinematicBackdrop(biomeCinematicAsset, visualQuality)
  const biomeBackdropUrl =
    visualQuality === 'low'
      ? 'none'
      : `url("${resolveRuntimeCssAssetUrl(biomeBackdrop)}")`
  const boardStyle = {
    '--tabletop-biome-accent': biomeCinematicAsset.accentColor,
    '--tabletop-biome-backdrop': biomeBackdropUrl,
    '--tabletop-biome-glow': biomeCinematicAsset.glowColor,
    '--tabletop-biome-void': biomeCinematicAsset.voidColor,
  } as CSSProperties
  const threeStage = (
    <Tabletop3DStage
      boardImpact={boardImpact}
      cameraState={camera3dState}
      editorEnabled={is3dCameraEditorEnabled}
      editorTool={editor3dTool}
      freeCameraVisible={is3dFreeCameraVisible}
      isGridVisible={isGridVisible}
      map={map}
      objectPlacementActive={isObjectPlacementActive}
      objects={objects}
      onCameraChange={on3dCameraChange}
      onEditorToolChange={on3dEditorToolChange}
      onObjectCreateAtPlacement={on3dObjectCreateAtPlacement}
      onObjectDuplicate={onObjectDuplicate}
      onObjectConfirm={onObjectConfirm}
      onObjectPlacementChange={on3dObjectPlacementChange}
      onObjectRemove={onObjectRemove}
      onObjectSelect={onObjectSelect}
      onObjectUndo={onObjectUndo}
      onTokenSelect={(tokenId) => onTokenSelect(tokenId, { additive: false })}
      quality={visualQuality}
      tokens={tokens}
    />
  )

  return (
    <div
      className={`tabletop-board${fullscreen ? ' tabletop-board--fullscreen' : ''}${
        is3dFreeCameraVisible ? ' tabletop-board--3d-free-camera' : ''
      }`}
      data-biome={map.biomeId ?? 'neutral'}
      data-visual-quality={visualQuality}
      style={boardStyle}
    >
      {is3dFreeCameraVisible ? (
        <div className="tabletop-board__free-3d-layer">
          {threeStage}
        </div>
      ) : null}
      <div
        className={`tabletop-board__viewport${
          isPanning ? ' tabletop-board__viewport--panning' : ''
        }${isCameraLocked ? ' tabletop-board__viewport--locked' : ''}`}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={is3dFreeCameraVisible ? undefined : handleViewportPointerDown}
        onScroll={
          is3dFreeCameraVisible
            ? undefined
            : (event) =>
                onViewportCameraChange?.({
                  scrollLeft: event.currentTarget.scrollLeft,
                  scrollTop: event.currentTarget.scrollTop,
                })
        }
        onWheel={
          is3dFreeCameraVisible
            ? (event) => {
                event.preventDefault()
                event.stopPropagation()
              }
            : handleViewportWheel
        }
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
            <MapArtwork map={map} visualQuality={visualQuality} />

            {isGridVisible ? (
              <div
                className="tabletop-board__grid"
                style={{
                  backgroundSize: `${100 / map.gridColumns}% 100%, 100% ${100 / map.gridRows}%`,
                }}
              />
            ) : null}

            {is3dFreeCameraVisible ? null : threeStage}

            {overlay}

            {is3dFreeCameraVisible ? null : (
              <TabletopObjectVfxLayer
                map={map}
                objects={objects}
                quality={visualQuality}
              />
            )}

            {measurementDisplay ? (
              <div
                className="tabletop-measurement"
                aria-hidden="true"
                style={
                  {
                    '--measurement-color': measurementDisplay.color,
                  } as CSSProperties
                }
              >
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
                  <span>
                    {measurementDisplay.ownerLabel
                      ? `${measurementDisplay.ownerLabel} | ${measurementDisplay.squaresText}`
                      : measurementDisplay.squaresText}
                  </span>
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

            {objects.map((object) => {
              const objectSpan = resolveTabletopTokenSpan(object)
              const isVfxObject = object.linkedItemId?.startsWith('vfx-') ?? false
              const isStageBackedObject =
                object.renderMode === 'three' &&
                (Boolean(object.modelUrl) || isVfxObject)

              return (
                <button
                  aria-label={`Selecionar objeto ${object.name}`}
                  className={`tabletop-object${
                    object.isSelected ? ' tabletop-object--selected' : ''
                  }${object.visibility === 'gm' ? ' tabletop-object--gm-only' : ''}${
                    object.isControllable ? '' : ' tabletop-object--locked'
                  }${draggingObjectId === object.id ? ' tabletop-object--dragging' : ''
                  }${isStageBackedObject ? ' tabletop-object--stage-backed' : ''} tabletop-object--${object.renderMode} tabletop-object--${object.objectType}`}
                  data-object-variant={object.linkedItemId ?? object.objectType}
                  key={object.id}
                  onPointerDown={(event) => {
                    if (
                      event.button !== 0 ||
                      !object.isControllable ||
                      isMeasureModeEnabled ||
                      is3dFreeCameraVisible
                    ) {
                      return
                    }

                    event.preventDefault()
                    event.stopPropagation()
                    onObjectSelect?.(object.id)
                    suppressNextBoardClickRef.current = true
                    objectDragRef.current = {
                      pointerId: event.pointerId,
                      objectId: object.id,
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      hasMoved: false,
                    }
                  }}
                  onClick={(event) => {
                    event.stopPropagation()

                    if (suppressObjectClickRef.current === `drag:${object.id}`) {
                      suppressObjectClickRef.current = ''
                      return
                    }

                    onObjectSelect?.(object.id)
                  }}
                  onDoubleClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    suppressNextBoardClickRef.current = true
                  }}
                  style={{
                    left: `${(object.cell.column / map.gridColumns) * 100}%`,
                    top: `${(object.cell.row / map.gridRows) * 100}%`,
                    width: `${cellWidth * objectSpan.columns}px`,
                    height: `${cellHeight * objectSpan.rows}px`,
                    ['--object-color' as string]: object.color ?? '#e9c97e',
                    ['--object-width' as string]: `${objectSpan.columns}`,
                    ['--object-height' as string]: `${objectSpan.rows}`,
                  }}
                  title={
                    object.visibility === 'gm'
                      ? `${object.name} - visivel so para o mestre`
                      : object.name
                  }
                  type="button"
                >
                  {isStageBackedObject ? (
                    <span
                      aria-hidden={isVfxObject}
                      className="tabletop-object__glyph tabletop-object__glyph--stage-backed"
                    >
                      {isVfxObject ? '' : object.label}
                    </span>
                  ) : object.renderMode === 'three' ? (
                    <>
                      <TabletopObject3D
                        assetUrl={object.assetUrl}
                        color={object.color}
                        modelUrl={object.modelUrl}
                        objectType={object.objectType}
                        quality={visualQuality}
                        variant={object.linkedItemId}
                      />
                      {object.assetUrl ? (
                        <img
                          alt=""
                          className="tabletop-object__image tabletop-object__image--fallback"
                          src={resolveRuntimeAssetUrl(object.assetUrl)}
                        />
                      ) : (
                        <span className="tabletop-object__glyph tabletop-object__glyph--fallback">
                          {object.label}
                        </span>
                      )}
                    </>
                  ) : object.assetUrl ? (
                    <img
                      alt=""
                      className="tabletop-object__image"
                      src={resolveRuntimeAssetUrl(object.assetUrl)}
                    />
                  ) : (
                    <span className="tabletop-object__glyph">{object.label}</span>
                  )}
                  {isVfxObject ? null : (
                    <span className="tabletop-object__badge">{object.label}</span>
                  )}
                </button>
              )
            })}

            {tokens.map((token) => {
              const tokenSpan = resolveTabletopTokenSpan(token)

              return (
                <button
                  aria-label={`Selecionar ${token.name}`}
                  className={`tabletop-token${
                    token.isSelected ? ' tabletop-token--selected' : ''
                  }${token.isPrimarySelected ? ' tabletop-token--primary' : ''}${
                    token.isControllable ? '' : ' tabletop-token--locked'
                  }${token.isMovable ? '' : ' tabletop-token--immovable'
                  }${token.visibility === 'gm' ? ' tabletop-token--gm-only' : ''}${
                    token.visibility === 'public' ? ' tabletop-token--public' : ''
                  }${token.isStealthed ? ' tabletop-token--stealthed' : ''
                  }${draggingTokenId === token.id ? ' tabletop-token--dragging' : ''}${
                    tokenSpan.preset === 'custom' ? ' tabletop-token--custom' : ''
                  }`}
                  data-state-label={token.isStealthed ? 'furtivo' : undefined}
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

                    if (!token.isMovable) {
                      return
                    }

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
                    ['--token-border-color' as string]: token.borderColor ?? token.color,
                    ['--token-size' as string]: `${tokenSpan.columns}`,
                    ['--token-width' as string]: `${tokenSpan.columns}`,
                    ['--token-height' as string]: `${tokenSpan.rows}`,
                  }}
                  title={
                    [
                      token.name,
                      token.visibility === 'gm' ? 'visivel so para o mestre' : '',
                      token.isStealthed ? 'furtivo' : '',
                    ]
                      .filter(Boolean)
                      .join(' - ')
                  }
                  type="button"
                >
                  <TokenArtwork token={token} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
