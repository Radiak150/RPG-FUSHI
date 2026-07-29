import trainingArcSource from '../data/training/village-training-arc.json'

export type TabletopTrainingOutcome =
  | 'progress'
  | 'bold'
  | 'setback'
  | 'complete'
  | 'reset'

export type TabletopTrainingFinalOutcome =
  | 'body-success'
  | 'body-failure'
  | 'stabilize'
  | 'emotion'
  | 'complete'
export type TabletopTrainingEmotion = 'medo' | 'felicidade' | 'tristeza' | 'nojo' | 'raiva'

export interface TabletopTrainingApproachDefinition {
  id: string
  label: string
  test: string
  dt: number
  progress: number
  risk: string
  success: string
  failure: string
}

export interface TabletopTrainingStationDefinition {
  id: string
  code: string
  name: string
  shortName: string
  lesson: string
  objective: string
  publicSteps: string[]
  failure: string
  masterCue: string
  approaches: TabletopTrainingApproachDefinition[]
}

export interface TabletopTrainingArcDefinition {
  id: string
  version: number
  locationId: string
  mapId: string
  title: string
  subtitle: string
  mentorPublicName: string
  stationGoal: number
  boldRule: string
  intro: string[]
  setbackMilestones: Array<{
    min: number
    max?: number
    label: string
    effect: string
  }>
  stations: TabletopTrainingStationDefinition[]
  finalTrial: {
    id: string
    name: string
    subtitle: string
    objective: string
    goal: number
    maxPressure: number
    minContributors: number
    minStations: number
    publicRules: string[]
    emotions: Array<{
      id: TabletopTrainingEmotion
      label: string
      effect: string
    }>
    masterCue: string
    successText: string
    rewardTitle: string
    rewardText: string
  }
}

export interface TabletopTrainingStationProgress {
  boldSuccesses: number
  completedAt?: number
  progress: number
  setbacks: number
  status: 'pending' | 'active' | 'completed'
}

export interface TabletopTrainingParticipant {
  activeStationId: string
  characterId: string
  color: string
  id: string
  label: string
  name: string
  playerId: string
  finalMastery: {
    emotion?: TabletopTrainingEmotion
    fushiLost: number
    fushiRecovered: number
    stage: number
  }
  stations: Record<string, TabletopTrainingStationProgress>
  tokenId: string
}

export interface TabletopTrainingFinalState {
  contributorIds: string[]
  isActive: boolean
  isCompleted: boolean
  isUnlocked: boolean
  pressure: number
  progress: number
  stationIds: string[]
}

export interface TabletopTrainingState {
  arcId: string
  completedAt?: number
  finalTrial: TabletopTrainingFinalState
  isActive: boolean
  isCompleted: boolean
  locationId: string
  mapId: string
  participants: TabletopTrainingParticipant[]
  startedAt: number
  updatedAt: number
  version: 2
}

export interface TabletopTrainingParticipantInput {
  characterId: string
  color: string
  id: string
  label: string
  name: string
  playerId: string
  tokenId: string
}

export const VILLAGE_TRAINING_ARC = trainingArcSource as TabletopTrainingArcDefinition

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clampInteger(value: unknown, minimum: number, maximum: number) {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : minimum

  return Math.max(minimum, Math.min(maximum, numeric))
}

function createStationProgress(): TabletopTrainingStationProgress {
  return {
    boldSuccesses: 0,
    progress: 0,
    setbacks: 0,
    status: 'pending',
  }
}

function createFinalMastery() {
  return {
    fushiLost: 0,
    fushiRecovered: 0,
    stage: 0,
  } satisfies TabletopTrainingParticipant['finalMastery']
}

function createStationProgressMap() {
  return Object.fromEntries(
    VILLAGE_TRAINING_ARC.stations.map((station) => [station.id, createStationProgress()]),
  )
}

function normalizeStationProgress(value: unknown): TabletopTrainingStationProgress {
  const source = isRecord(value) ? value : {}
  const progress = clampInteger(source.progress, 0, VILLAGE_TRAINING_ARC.stationGoal)
  const completedAt =
    typeof source.completedAt === 'number' && Number.isFinite(source.completedAt)
      ? source.completedAt
      : undefined

  return {
    boldSuccesses: clampInteger(source.boldSuccesses, 0, 99),
    completedAt,
    progress,
    setbacks: clampInteger(source.setbacks, 0, 99),
    status:
      progress >= VILLAGE_TRAINING_ARC.stationGoal
        ? 'completed'
        : progress > 0 || source.status === 'active'
          ? 'active'
          : 'pending',
  }
}

function normalizeParticipant(value: unknown): TabletopTrainingParticipant | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()) {
    return null
  }

  const inputStations = isRecord(value.stations) ? value.stations : {}
  const stations = Object.fromEntries(
    VILLAGE_TRAINING_ARC.stations.map((station) => [
      station.id,
      normalizeStationProgress(inputStations[station.id]),
    ]),
  )
  const activeStationId = VILLAGE_TRAINING_ARC.stations.some(
    (station) => station.id === value.activeStationId,
  )
    ? String(value.activeStationId)
    : VILLAGE_TRAINING_ARC.stations[0]?.id ?? ''
  const finalMasterySource = isRecord(value.finalMastery) ? value.finalMastery : {}
  const emotion = VILLAGE_TRAINING_ARC.finalTrial.emotions.some(
    (candidate) => candidate.id === finalMasterySource.emotion,
  )
    ? finalMasterySource.emotion as TabletopTrainingEmotion
    : undefined

  return {
    activeStationId,
    characterId: typeof value.characterId === 'string' ? value.characterId : '',
    color: typeof value.color === 'string' && value.color ? value.color : '#92c0b6',
    id: value.id,
    label: typeof value.label === 'string' ? value.label : '',
    name: typeof value.name === 'string' && value.name.trim() ? value.name : value.id,
    playerId: typeof value.playerId === 'string' ? value.playerId : '',
    finalMastery: {
      emotion,
      fushiLost: clampInteger(finalMasterySource.fushiLost, 0, 99),
      fushiRecovered: clampInteger(finalMasterySource.fushiRecovered, 0, 99),
      stage: clampInteger(finalMasterySource.stage, 0, VILLAGE_TRAINING_ARC.finalTrial.goal),
    },
    stations,
    tokenId: typeof value.tokenId === 'string' ? value.tokenId : '',
  }
}

export function createTabletopTrainingState(
  participants: TabletopTrainingParticipantInput[],
): TabletopTrainingState {
  const now = Date.now()
  const uniqueParticipants = participants.filter(
    (participant, index, items) =>
      items.findIndex((candidate) => candidate.id === participant.id) === index,
  )

  return {
    arcId: VILLAGE_TRAINING_ARC.id,
    finalTrial: {
      contributorIds: [],
      isActive: false,
      isCompleted: false,
      isUnlocked: false,
      pressure: 0,
      progress: 0,
      stationIds: [],
    },
    isActive: true,
    isCompleted: false,
    locationId: VILLAGE_TRAINING_ARC.locationId,
    mapId: VILLAGE_TRAINING_ARC.mapId,
    participants: uniqueParticipants.map((participant) => ({
      ...participant,
      activeStationId: VILLAGE_TRAINING_ARC.stations[0]?.id ?? '',
      finalMastery: createFinalMastery(),
      stations: createStationProgressMap(),
    })),
    startedAt: now,
    updatedAt: now,
    version: 2,
  }
}

export function normalizeTabletopTrainingState(value: unknown): TabletopTrainingState | null {
  if (!isRecord(value) || value.arcId !== VILLAGE_TRAINING_ARC.id) {
    return null
  }

  const participants = Array.isArray(value.participants)
    ? value.participants
        .map((participant) => normalizeParticipant(participant))
        .filter((participant): participant is TabletopTrainingParticipant => Boolean(participant))
    : []
  const finalSource = isRecord(value.finalTrial) ? value.finalTrial : {}
  const contributorIds = Array.isArray(finalSource.contributorIds)
    ? finalSource.contributorIds.filter(
        (id): id is string => typeof id === 'string' && participants.some((participant) => participant.id === id),
      )
    : []
  const stationIds = Array.isArray(finalSource.stationIds)
    ? finalSource.stationIds.filter(
        (id): id is string =>
          typeof id === 'string' && VILLAGE_TRAINING_ARC.stations.some((station) => station.id === id),
      )
    : []
  const isCompleted = value.isCompleted === true || finalSource.isCompleted === true

  return {
    arcId: VILLAGE_TRAINING_ARC.id,
    completedAt:
      typeof value.completedAt === 'number' && Number.isFinite(value.completedAt)
        ? value.completedAt
        : undefined,
    finalTrial: {
      contributorIds: Array.from(new Set(contributorIds)),
      isActive: finalSource.isActive === true && !isCompleted,
      isCompleted,
      isUnlocked: finalSource.isUnlocked === true || isCompleted,
      pressure: clampInteger(finalSource.pressure, 0, 99),
      progress: participants.reduce(
        (total, participant) => total + participant.finalMastery.stage,
        0,
      ) || clampInteger(
        finalSource.progress,
        0,
        participants.length * VILLAGE_TRAINING_ARC.finalTrial.goal,
      ),
      stationIds: Array.from(new Set(stationIds)),
    },
    isActive: value.isActive !== false,
    isCompleted,
    locationId: VILLAGE_TRAINING_ARC.locationId,
    mapId: VILLAGE_TRAINING_ARC.mapId,
    participants,
    startedAt:
      typeof value.startedAt === 'number' && Number.isFinite(value.startedAt)
        ? value.startedAt
        : Date.now(),
    updatedAt:
      typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
        ? value.updatedAt
        : Date.now(),
    version: 2,
  }
}

export function setTrainingParticipantStation(
  state: TabletopTrainingState,
  participantId: string,
  stationId: string,
) {
  if (!VILLAGE_TRAINING_ARC.stations.some((station) => station.id === stationId)) {
    return state
  }

  return {
    ...state,
    participants: state.participants.map((participant) =>
      participant.id === participantId
        ? {
            ...participant,
            activeStationId: stationId,
            stations: {
              ...participant.stations,
              [stationId]: {
                ...(participant.stations[stationId] ?? createStationProgress()),
                status:
                  participant.stations[stationId]?.status === 'completed'
                    ? 'completed'
                    : 'active',
              },
            },
          }
        : participant,
    ),
    updatedAt: Date.now(),
  } satisfies TabletopTrainingState
}

export function applyTrainingParticipantOutcome(
  state: TabletopTrainingState,
  participantId: string,
  stationId: string,
  outcome: TabletopTrainingOutcome,
) {
  const stationExists = VILLAGE_TRAINING_ARC.stations.some((station) => station.id === stationId)

  if (!stationExists) {
    return state
  }

  const now = Date.now()

  return {
    ...state,
    participants: state.participants.map((participant) => {
      if (participant.id !== participantId) {
        return participant
      }

      const current = participant.stations[stationId] ?? createStationProgress()
      const nextProgress =
        outcome === 'reset'
          ? 0
          : outcome === 'complete'
            ? VILLAGE_TRAINING_ARC.stationGoal
            : outcome === 'progress'
              ? Math.min(VILLAGE_TRAINING_ARC.stationGoal, current.progress + 1)
              : outcome === 'bold'
                ? Math.min(VILLAGE_TRAINING_ARC.stationGoal, current.progress + 2)
                : current.progress
      const completed = nextProgress >= VILLAGE_TRAINING_ARC.stationGoal

      return {
        ...participant,
        activeStationId: stationId,
        stations: {
          ...participant.stations,
          [stationId]: {
            boldSuccesses:
              outcome === 'reset'
                ? 0
                : current.boldSuccesses + (outcome === 'bold' ? 1 : 0),
            completedAt: completed ? current.completedAt ?? now : undefined,
            progress: nextProgress,
            setbacks:
              outcome === 'reset'
                ? 0
                : current.setbacks + (outcome === 'setback' ? 1 : 0),
            status: completed ? 'completed' : nextProgress > 0 ? 'active' : 'pending',
          },
        },
      }
    }),
    updatedAt: now,
  } satisfies TabletopTrainingState
}

export function getTrainingParticipantSummary(participant: TabletopTrainingParticipant) {
  const completed = Object.values(participant.stations).filter(
    (progress) => progress.status === 'completed',
  )
  const distinctions = completed.filter(
    (progress) => progress.boldSuccesses > 0 && progress.setbacks === 0,
  ).length
  const totalMarks = Object.values(participant.stations).reduce(
    (total, progress) => total + progress.progress,
    0,
  )
  const totalSetbacks = Object.values(participant.stations).reduce(
    (total, progress) => total + progress.setbacks,
    0,
  )

  return {
    completedStations: completed.length,
    distinctions,
    seals: completed.length + distinctions,
    totalMarks,
    totalSetbacks,
  }
}

export function getTrainingSetbackMilestone(totalSetbacks: number) {
  return VILLAGE_TRAINING_ARC.setbackMilestones.find(
    (milestone) =>
      totalSetbacks >= milestone.min &&
      (typeof milestone.max !== 'number' || totalSetbacks <= milestone.max),
  ) ?? VILLAGE_TRAINING_ARC.setbackMilestones[0]
}

export function getTrainingTeamSummary(state: TabletopTrainingState) {
  const participantSummaries = state.participants.map(getTrainingParticipantSummary)
  const completedStationIds = VILLAGE_TRAINING_ARC.stations
    .filter((station) =>
      state.participants.some(
        (participant) => participant.stations[station.id]?.status === 'completed',
      ),
    )
    .map((station) => station.id)
  const readyParticipants = participantSummaries.filter(
    (summary) => summary.completedStations > 0,
  ).length

  return {
    completedStationIds,
    completedAssignments: participantSummaries.reduce(
      (total, summary) => total + summary.completedStations,
      0,
    ),
    maxAssignments: state.participants.length * VILLAGE_TRAINING_ARC.stations.length,
    maxMarks:
      state.participants.length *
      VILLAGE_TRAINING_ARC.stations.length *
      VILLAGE_TRAINING_ARC.stationGoal,
    readyParticipants,
    seals: participantSummaries.reduce((total, summary) => total + summary.seals, 0),
    totalMarks: participantSummaries.reduce((total, summary) => total + summary.totalMarks, 0),
    totalSetbacks: participantSummaries.reduce(
      (total, summary) => total + summary.totalSetbacks,
      0,
    ),
  }
}

export function unlockTrainingFinalTrial(state: TabletopTrainingState) {
  return {
    ...state,
    finalTrial: {
      ...state.finalTrial,
      isActive: true,
      isUnlocked: true,
    },
    updatedAt: Date.now(),
  } satisfies TabletopTrainingState
}

export function applyTrainingFinalOutcome(
  state: TabletopTrainingState,
  participantId: string,
  detail: string,
  outcome: TabletopTrainingFinalOutcome,
) {
  const finalDefinition = VILLAGE_TRAINING_ARC.finalTrial
  const participantExists = state.participants.some((participant) => participant.id === participantId)

  if (!state.finalTrial.isUnlocked || !participantExists) {
    return state
  }

  if (outcome === 'complete') {
    if (!isTrainingFinalReady(state)) return state
    const now = Date.now()

    return {
      ...state,
      completedAt: now,
      finalTrial: {
        ...state.finalTrial,
        isActive: false,
        isCompleted: true,
        progress: state.participants.length * finalDefinition.goal,
      },
      isCompleted: true,
      updatedAt: now,
    } satisfies TabletopTrainingState
  }

  const participants = state.participants.map((participant) => {
    if (participant.id !== participantId) return participant

    const mastery = participant.finalMastery ?? createFinalMastery()
    if (outcome === 'body-failure') {
      return {
        ...participant,
        finalMastery: { ...mastery, fushiLost: Math.min(99, mastery.fushiLost + 2) },
      }
    }
    if (outcome === 'body-success') {
      return { ...participant, finalMastery: { ...mastery, stage: Math.max(1, mastery.stage) } }
    }
    if (outcome === 'stabilize' && mastery.stage >= 1) {
      return {
        ...participant,
        finalMastery: {
          ...mastery,
          fushiRecovered: Math.min(mastery.fushiLost, Math.max(0, Number(detail) || 0)),
          stage: Math.max(2, mastery.stage),
        },
      }
    }
    if (outcome === 'emotion' && mastery.stage >= 2) {
      const emotion = finalDefinition.emotions.find((candidate) => candidate.id === detail)?.id
      if (!emotion) return participant
      return {
        ...participant,
        finalMastery: { ...mastery, emotion, stage: finalDefinition.goal },
      }
    }
    return participant
  })
  const progress = participants.reduce(
    (total, participant) => total + participant.finalMastery.stage,
    0,
  )

  return {
    ...state,
    participants,
    finalTrial: {
      ...state.finalTrial,
      contributorIds: Array.from(new Set([...state.finalTrial.contributorIds, participantId])),
      isActive: true,
      pressure:
        outcome === 'body-failure'
          ? Math.min(99, state.finalTrial.pressure + 1)
          : state.finalTrial.pressure,
      progress,
    },
    updatedAt: Date.now(),
  } satisfies TabletopTrainingState
}

export function isTrainingFinalReady(state: TabletopTrainingState) {
  return state.participants.length > 0 && state.participants.every(
    (participant) => participant.finalMastery.stage >= VILLAGE_TRAINING_ARC.finalTrial.goal,
  )
}

export function setTrainingArcActive(state: TabletopTrainingState, isActive: boolean) {
  return {
    ...state,
    isActive,
    updatedAt: Date.now(),
  } satisfies TabletopTrainingState
}
