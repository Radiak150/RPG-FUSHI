import {
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type {
  TabletopSceneLight,
  TabletopSceneLighting,
} from '../../data/types'

interface TabletopLightingLayerProps {
  isNight: boolean
  lighting: TabletopSceneLighting
  isGm: boolean
  isEditing: boolean
  selectedLightId: string
  onSelectLight: (lightId: string) => void
  onMoveLight: (lightId: string, input: { x: number; y: number }) => void
  onResizeLight: (lightId: string, radius: number) => void
}

interface LightDragState {
  lightId: string
  pointerId: number
  mode: 'move' | 'resize'
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value))
}

function resolveLayerPoint(
  element: HTMLElement | null,
  clientX: number,
  clientY: number,
) {
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()

  if (!rect.width || !rect.height) {
    return null
  }

  return {
    x: clampUnit((clientX - rect.left) / rect.width),
    y: clampUnit((clientY - rect.top) / rect.height),
  }
}

function resolveLightStyle(light: TabletopSceneLight) {
  const diameter = `${Math.max(8, light.radius * 200)}%`

  return {
    left: `${light.x * 100}%`,
    top: `${light.y * 100}%`,
    width: diameter,
    height: diameter,
    '--tabletop-light-color': light.color,
    '--tabletop-light-intensity': light.intensity,
  } as React.CSSProperties
}

export function TabletopLightingLayer({
  isNight,
  lighting,
  isGm,
  isEditing,
  selectedLightId,
  onSelectLight,
  onMoveLight,
  onResizeLight,
}: TabletopLightingLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<LightDragState | null>(null)
  const rawId = useId()
  const idSuffix = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const maskId = `tabletop-scene-light-mask-${idSuffix}`
  const holeGradientId = `tabletop-scene-light-hole-${idSuffix}`
  const activeLights = lighting.enabled
    ? lighting.lights.filter((light) => light.enabled)
    : []
  const cursorLight =
    lighting.enabled && lighting.cursorLight.enabled ? lighting.cursorLight : null
  const hasLightSource = activeLights.length > 0 || Boolean(cursorLight)

  function beginDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    lightId: string,
    mode: LightDragState['mode'],
  ) {
    if (!isGm || !isEditing) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      lightId,
      mode,
      pointerId: event.pointerId,
    }
    onSelectLight(lightId)
  }

  function moveDraggedLight(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const point = resolveLayerPoint(layerRef.current, event.clientX, event.clientY)

    if (!point) {
      return
    }

    if (drag.mode === 'move') {
      onMoveLight(drag.lightId, point)
      return
    }

    const selectedLight = lighting.lights.find((light) => light.id === drag.lightId)

    if (!selectedLight) {
      return
    }

    const rect = layerRef.current?.getBoundingClientRect()

    if (!rect || !rect.width || !rect.height) {
      return
    }

    const dx = (event.clientX - rect.left) / rect.width - selectedLight.x
    const dy = (event.clientY - rect.top) / rect.height - selectedLight.y
    const radius = Math.min(0.5, Math.max(0.04, Math.sqrt(dx * dx + dy * dy)))
    onResizeLight(drag.lightId, radius)
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={`tabletop-lighting-layer${
        isNight ? ' tabletop-lighting-layer--night' : ''
      }`}
      data-cursor-enabled={cursorLight ? 'true' : 'false'}
      data-light-count={activeLights.length}
      data-lighting-enabled={lighting.enabled ? 'true' : 'false'}
      data-night={isNight ? 'true' : 'false'}
      ref={layerRef}
    >
      {isNight ? (
        <svg
          aria-hidden="true"
          className="tabletop-lighting-layer__mask"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <radialGradient id={holeGradientId}>
              <stop offset="0%" stopColor="black" />
              <stop offset="58%" stopColor="black" />
              <stop offset="100%" stopColor="white" />
            </radialGradient>
            <mask id={maskId} maskContentUnits="userSpaceOnUse">
              <rect fill="white" height="100" width="100" x="0" y="0" />
              {hasLightSource
                ? activeLights.map((light) => (
                    <circle
                      cx={light.x * 100}
                      cy={light.y * 100}
                      fill={`url(#${holeGradientId})`}
                      key={light.id}
                      opacity={light.intensity}
                      r={light.radius * 100}
                    />
                  ))
                : null}
              {cursorLight ? (
                <circle
                  cx={cursorLight.x * 100}
                  cy={cursorLight.y * 100}
                  fill={`url(#${holeGradientId})`}
                  opacity={cursorLight.intensity}
                  r={cursorLight.radius * 100}
                />
              ) : null}
            </mask>
          </defs>
          <rect
            className="tabletop-lighting-layer__darkness"
            height="100"
            mask={`url(#${maskId})`}
            width="100"
            x="0"
            y="0"
          />
        </svg>
      ) : null}

      {isNight ? (
        <span
          aria-hidden="true"
          className="tabletop-lighting-layer__moon-wash"
          data-moon-ambience="true"
        />
      ) : null}

      {isNight
        ? activeLights.map((light) => (
            <span
              aria-hidden="true"
              className="tabletop-lighting-layer__glow"
              key={`glow-${light.id}`}
              style={resolveLightStyle(light)}
            />
          ))
        : null}
      {isNight && cursorLight ? (
        <span
          aria-hidden="true"
          className="tabletop-lighting-layer__glow tabletop-lighting-layer__glow--cursor"
          style={{
            left: `${cursorLight.x * 100}%`,
            top: `${cursorLight.y * 100}%`,
            width: `${Math.max(10, cursorLight.radius * 200)}%`,
            height: `${Math.max(10, cursorLight.radius * 200)}%`,
            '--tabletop-light-color': cursorLight.color,
            '--tabletop-light-intensity': cursorLight.intensity,
          } as React.CSSProperties}
        />
      ) : null}

      {isGm && isEditing
        ? lighting.lights.map((light) => (
            <span
              className={`tabletop-lighting-layer__handle${
                selectedLightId === light.id
                  ? ' tabletop-lighting-layer__handle--selected'
                  : ''
              }`}
              key={`handle-${light.id}`}
              style={{
                left: `${light.x * 100}%`,
                top: `${light.y * 100}%`,
              }}
            >
              <button
                aria-label={`Mover ${light.label}`}
                className="tabletop-lighting-layer__handle-button"
                onPointerDown={(event) => beginDrag(event, light.id, 'move')}
                onPointerMove={moveDraggedLight}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectLight(light.id)
                }}
                title={`${light.label}: mover`}
                type="button"
              />
              <button
                aria-label={`Redimensionar ${light.label}`}
                className="tabletop-lighting-layer__resize-button"
                onPointerDown={(event) => beginDrag(event, light.id, 'resize')}
                onPointerMove={moveDraggedLight}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectLight(light.id)
                }}
                title={`${light.label}: redimensionar`}
                type="button"
              />
            </span>
          ))
        : null}
    </div>
  )
}
