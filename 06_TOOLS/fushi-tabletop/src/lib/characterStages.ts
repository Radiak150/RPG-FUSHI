import type {
  CharacterSheet,
  CharacterStageDefinition,
  CharacterStageSnapshot,
  CharacterStageState,
} from '../data/types'

export const DEFAULT_CHARACTER_STAGE_ID = 'stage-default'
export const DEFAULT_CHARACTER_STAGE_LABEL = 'Padrao'

const GLOBAL_CHARACTER_STAGE_FIELDS = [
  'id',
  'jogador',
  'tipo',
  'faccao',
  'localAtual',
  'isSharedBodyHost',
  'sharedBody',
  'permissions',
] as const satisfies ReadonlyArray<keyof CharacterSheet>

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }

  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function buildStageId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `stage-${crypto.randomUUID()}`
  }

  return `stage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeStageLabel(value: string | undefined, fallback: string) {
  return value?.trim() || fallback
}

function snapshotCharacter(character: CharacterSheet): CharacterStageSnapshot {
  const snapshot = cloneValue(character) as CharacterSheet
  delete snapshot.stageState
  return snapshot
}

function buildDefaultStage(
  character: CharacterSheet,
  now: number,
): CharacterStageDefinition {
  return {
    id: DEFAULT_CHARACTER_STAGE_ID,
    label: DEFAULT_CHARACTER_STAGE_LABEL,
    createdAt: now,
    updatedAt: now,
    snapshot: snapshotCharacter(character),
  }
}

function normalizeStageCatalog(
  character: CharacterSheet,
  state: CharacterStageState | undefined,
  now: number,
) {
  const catalog = (state?.catalog ?? [])
    .filter(
      (stage): stage is CharacterStageDefinition =>
        Boolean(stage?.id && stage?.snapshot),
    )
    .map((stage, index) => ({
      ...cloneValue(stage),
      label: normalizeStageLabel(stage.label, `Fase ${index + 1}`),
      createdAt: Number.isFinite(stage.createdAt) ? stage.createdAt : now,
      updatedAt: Number.isFinite(stage.updatedAt) ? stage.updatedAt : now,
      snapshot: snapshotCharacter(stage.snapshot as CharacterSheet),
    }))

  if (!catalog.some((stage) => stage.id === DEFAULT_CHARACTER_STAGE_ID)) {
    catalog.unshift(buildDefaultStage(character, now))
  }

  return catalog
}

function buildStageState(
  character: CharacterSheet,
  now = Date.now(),
): Required<CharacterStageState> {
  const catalog = normalizeStageCatalog(character, character.stageState, now)
  const requestedActiveId =
    character.stageState?.activeStageId || DEFAULT_CHARACTER_STAGE_ID
  const activeStage =
    catalog.find((stage) => stage.id === requestedActiveId) ?? catalog[0]

  return {
    activeStageId: activeStage.id,
    activeStageLabel: activeStage.label,
    revision: Math.max(
      0,
      Math.floor(character.stageState?.revision ?? 0),
    ),
    catalog,
  }
}

function preserveGlobalStageFields(
  current: CharacterSheet,
  target: CharacterStageSnapshot,
) {
  const nextCharacter = cloneValue(target) as CharacterSheet

  GLOBAL_CHARACTER_STAGE_FIELDS.forEach((field) => {
    const value = current[field]

    if (value === undefined) {
      delete (nextCharacter as unknown as Record<string, unknown>)[field]
      return
    }

    Object.assign(nextCharacter, { [field]: cloneValue(value) })
  })

  return nextCharacter
}

function captureActiveStage(
  character: CharacterSheet,
  state: Required<CharacterStageState>,
  now = Date.now(),
) {
  return state.catalog.map((stage) =>
    stage.id === state.activeStageId
      ? {
          ...stage,
          label: state.activeStageLabel,
          updatedAt: now,
          snapshot: snapshotCharacter(character),
        }
      : stage,
  )
}

export function cloneCharacterStageState(
  state: CharacterStageState | undefined,
): CharacterStageState | undefined {
  return state ? cloneValue(state) : undefined
}

export function getCharacterStageState(character: CharacterSheet) {
  return buildStageState(character)
}

export function syncActiveCharacterStageSnapshot(
  character: CharacterSheet,
): CharacterSheet {
  if (!character.stageState) {
    return character
  }

  const state = buildStageState(character)
  const catalog = captureActiveStage(character, state)

  return {
    ...character,
    stageState: {
      ...state,
      catalog,
    },
  }
}

export function createCharacterStage(
  character: CharacterSheet,
  requestedLabel?: string,
): CharacterSheet {
  const now = Date.now()
  const state = buildStageState(character, now)
  const catalog = captureActiveStage(character, state, now)
  const stageNumber = catalog.length + 1
  const label = normalizeStageLabel(requestedLabel, `Fase ${stageNumber}`)
  const nextStage: CharacterStageDefinition = {
    id: buildStageId(),
    label,
    createdAt: now,
    updatedAt: now,
    snapshot: snapshotCharacter(character),
  }

  return {
    ...character,
    stageState: {
      activeStageId: nextStage.id,
      activeStageLabel: nextStage.label,
      revision: state.revision + 1,
      catalog: [...catalog, nextStage],
    },
  }
}

export function switchCharacterStage(
  character: CharacterSheet,
  targetStageId: string,
): CharacterSheet {
  const now = Date.now()
  const state = buildStageState(character, now)

  if (targetStageId === state.activeStageId) {
    return syncActiveCharacterStageSnapshot(character)
  }

  const catalog = captureActiveStage(character, state, now)
  const targetStage = catalog.find((stage) => stage.id === targetStageId)

  if (!targetStage) {
    return character
  }

  const nextCharacter = preserveGlobalStageFields(
    character,
    targetStage.snapshot,
  )

  return {
    ...nextCharacter,
    stageState: {
      activeStageId: targetStage.id,
      activeStageLabel: targetStage.label,
      revision: state.revision + 1,
      catalog,
    },
  }
}

export function renameCharacterStage(
  character: CharacterSheet,
  stageId: string,
  requestedLabel: string,
): CharacterSheet {
  const state = buildStageState(character)
  const currentStage = state.catalog.find((stage) => stage.id === stageId)

  if (!currentStage) {
    return character
  }

  const label = normalizeStageLabel(requestedLabel, currentStage.label)
  const catalog = state.catalog.map((stage) =>
    stage.id === stageId
      ? {
          ...stage,
          label,
          updatedAt: Date.now(),
        }
      : stage,
  )

  return {
    ...character,
    stageState: {
      ...state,
      activeStageLabel:
        state.activeStageId === stageId ? label : state.activeStageLabel,
      catalog,
    },
  }
}

export function deleteCharacterStage(
  character: CharacterSheet,
  stageId: string,
): CharacterSheet {
  const state = buildStageState(character)

  if (
    stageId === DEFAULT_CHARACTER_STAGE_ID ||
    stageId === state.activeStageId
  ) {
    return character
  }

  return {
    ...character,
    stageState: {
      ...state,
      catalog: state.catalog.filter((stage) => stage.id !== stageId),
    },
  }
}

export function getPublicCharacterStageState(
  character: CharacterSheet,
): CharacterStageState | undefined {
  if (!character.stageState) {
    return undefined
  }

  const state = buildStageState(character)

  return {
    activeStageId: state.activeStageId,
    activeStageLabel: state.activeStageLabel,
    revision: state.revision,
  }
}
