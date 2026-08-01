import type {
  TabletopSceneCursorLight,
  TabletopSceneLight,
  TabletopSceneLighting,
} from '../data/types'

export const TABLETOP_SCENE_LIGHT_LIMIT = 24
export const TABLETOP_NIGHT_START_HOUR = 19
export const TABLETOP_DAY_START_HOUR = 6

const DEFAULT_LIGHT_COLOR = '#ffd58a'
const LEGACY_CURSOR_LIGHT_COLOR = '#d9ecff'
const LEGACY_WARM_CURSOR_LIGHT_COLOR = '#f3c071'
const DEFAULT_CURSOR_LIGHT_COLOR = '#eee1c7'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clampNumber(value: unknown, fallback: number, minimum: number, maximum: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback
}

function normalizeLight(value: unknown, index: number): TabletopSceneLight | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()) {
    return null
  }

  return {
    id: value.id.slice(0, 80),
    label:
      typeof value.label === 'string' && value.label.trim()
        ? value.label.trim().slice(0, 48)
        : `Luz ${index + 1}`,
    x: clampNumber(value.x, 0.5, 0, 1),
    y: clampNumber(value.y, 0.5, 0, 1),
    radius: clampNumber(value.radius, 0.16, 0.04, 0.5),
    intensity: clampNumber(value.intensity, 0.78, 0.2, 1),
    color: normalizeColor(value.color, DEFAULT_LIGHT_COLOR),
    enabled: value.enabled !== false,
  }
}

function normalizeCursorLight(value: unknown): TabletopSceneCursorLight {
  const input = isRecord(value) ? value : {}
  const normalizedColor = normalizeColor(input.color, DEFAULT_CURSOR_LIGHT_COLOR)

  return {
    enabled: input.enabled === true,
    x: clampNumber(input.x, 0.5, 0, 1),
    y: clampNumber(input.y, 0.5, 0, 1),
    radius: clampNumber(input.radius, 0.13, 0.05, 0.35),
    intensity: clampNumber(input.intensity, 0.72, 0.2, 1),
    color:
      normalizedColor === LEGACY_CURSOR_LIGHT_COLOR ||
      normalizedColor === LEGACY_WARM_CURSOR_LIGHT_COLOR
        ? DEFAULT_CURSOR_LIGHT_COLOR
        : normalizedColor,
  }
}

export function createDefaultTabletopSceneLighting(): TabletopSceneLighting {
  return {
    enabled: true,
    cursorLight: normalizeCursorLight(null),
    lights: [],
  }
}

export function normalizeTabletopSceneLighting(value: unknown): TabletopSceneLighting {
  if (!isRecord(value)) {
    return createDefaultTabletopSceneLighting()
  }

  const seenIds = new Set<string>()
  const lights = (Array.isArray(value.lights) ? value.lights : [])
    .map((light, index) => normalizeLight(light, index))
    .filter((light): light is TabletopSceneLight => {
      if (!light || seenIds.has(light.id)) {
        return false
      }

      seenIds.add(light.id)
      return true
    })
    .slice(0, TABLETOP_SCENE_LIGHT_LIMIT)

  return {
    enabled: value.enabled !== false,
    cursorLight: normalizeCursorLight(value.cursorLight),
    lights,
  }
}

export function createTabletopSceneLight(
  input: Partial<TabletopSceneLight> = {},
): TabletopSceneLight {
  const generatedId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `scene-light-${crypto.randomUUID()}`
      : `scene-light-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return normalizeLight(
    {
      color: DEFAULT_LIGHT_COLOR,
      enabled: true,
      id: generatedId,
      intensity: 0.78,
      label: 'Luz da cena',
      radius: 0.16,
      x: 0.5,
      y: 0.5,
      ...input,
    },
    0,
  ) as TabletopSceneLight
}

export function isTabletopNight(clock: { hora?: number } | null | undefined) {
  const hour =
    typeof clock?.hora === 'number' && Number.isFinite(clock.hora)
      ? ((clock.hora % 24) + 24) % 24
      : 12

  return hour >= TABLETOP_NIGHT_START_HOUR || hour < TABLETOP_DAY_START_HOUR
}
