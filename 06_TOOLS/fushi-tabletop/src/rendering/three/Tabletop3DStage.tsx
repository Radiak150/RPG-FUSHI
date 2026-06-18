import { useEffect, useRef } from 'react'
import type {
  TabletopBoardObject,
  TabletopCamera3DState,
  TabletopCell,
  TabletopGridSpan,
  TabletopMap,
  TabletopObject3DPlacement,
  TabletopObjectRenderMode,
  TabletopObjectVisibility,
  TabletopTokenSize,
  TabletopTokenVisibility,
} from '../../data/types'
import type { VisualQualityMode } from '../../lib/productPreferences'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import { resolveTabletopTokenSpan } from '../../lib/tabletop'
import {
  resolveBiomeCinematicAsset,
  resolveBiomeCinematicBackdrop,
} from '../biomeCinematicAssets'
import type { BiomeVisualId } from '../biomeVisualPresets'

export interface Tabletop3DTokenView {
  id: string
  label: string
  name: string
  color: string
  portraitUrl?: string
  tokenImageUrl?: string
  cell: TabletopCell
  size: TabletopTokenSize
  customSize?: TabletopGridSpan
  visibility: TabletopTokenVisibility
  isSelected: boolean
}

export interface Tabletop3DObjectView {
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
}

interface Tabletop3DStageProps {
  boardImpact?: Tabletop3DBoardImpact | null
  cameraState?: TabletopCamera3DState
  editorEnabled?: boolean
  editorTool?: Tabletop3DEditorTool
  freeCameraVisible?: boolean
  isGridVisible: boolean
  map: TabletopMap
  objectPlacementActive?: boolean
  objects?: Tabletop3DObjectView[]
  onCameraChange?: (cameraState: TabletopCamera3DState) => void
  onEditorToolChange?: (tool: Tabletop3DEditorTool) => void
  onObjectCreateAtPlacement?: (input: {
    cell: TabletopCell
    placement3d: NonNullable<TabletopBoardObject['placement3d']>
  }) => void
  onObjectDuplicate?: (objectId: string) => void
  onObjectPlacementChange?: (
    objectId: string,
    placement3d: NonNullable<TabletopBoardObject['placement3d']>,
  ) => void
  onObjectConfirm?: () => void
  onObjectRemove?: (objectId: string) => void
  onObjectSelect?: (objectId: string) => void
  onObjectUndo?: () => void
  onTokenSelect?: (tokenId: string) => void
  quality?: VisualQualityMode
  tokens?: Tabletop3DTokenView[]
}

export interface Tabletop3DBoardImpact {
  color?: string
  id: string
  outcome: 'critical' | 'triumph'
}

type ThreeModule = typeof import('three')
type AnimationClip = import('three').AnimationClip
type Object3D = import('three').Object3D
type Camera = import('three').Camera
type RuntimeWaterMesh = import('three').Mesh & {
  material: import('three').ShaderMaterial & {
    uniforms: Record<string, { value: unknown }>
  }
}
type TransformControlsInstance = InstanceType<
  typeof import('three/addons/controls/TransformControls.js').TransformControls
>
export type Tabletop3DEditorTool = 'translate' | 'rotate' | 'scale'

interface FreeCameraRuntimeState {
  distance: number
  pitch: number
  targetX: number
  targetY: number
  targetZ: number
  yaw: number
}

interface DragState {
  button: number
  movedObjectId?: string
  movedObjectNode?: Object3D
  movedPlacement?: NonNullable<TabletopBoardObject['placement3d']>
  mode: 'move-object' | 'orbit' | 'pan'
  pointerId: number
  startClientX: number
  startClientY: number
  startState: FreeCameraRuntimeState
}

const DEFAULT_FREE_CAMERA_STATE: FreeCameraRuntimeState = {
  distance: 9.2,
  pitch: 0.58,
  targetX: 0,
  targetY: 0,
  targetZ: 0.3,
  yaw: 0.72,
}

const FREE_CAMERA_DISTANCE_MIN = 3.2
const FREE_CAMERA_DISTANCE_MAX = 34
const FREE_CAMERA_WHEEL_FACTOR = 0.001
const FREE_CAMERA_STREAM_INTERVAL_MS = 80
const REMOTE_CAMERA_SMOOTHING_SPEED = 14
const PLACEMENT_SCALE_MIN = 0.01
const PLACEMENT_SCALE_MAX = 80
const PLACEMENT_HEIGHT_MIN = -18
const PLACEMENT_HEIGHT_MAX = 80
const KENNEY_PARTICLE_PATH = '/assets/fx/kenney/particles'
const KENNEY_SMOKE_PATH = '/assets/fx/kenney/smoke'

const modelAssetCache = new Map<string, Promise<LoadedModelAsset>>()
const vfxTextureCache = new Map<string, import('three').Texture>()

interface LoadedModelAsset {
  animations: AnimationClip[]
  scene: Object3D
}

type TabletopVfxKind =
  | 'fire'
  | 'fog'
  | 'lava'
  | 'leaves'
  | 'lightning'
  | 'rain'
  | 'water'
  | 'wind'

interface ThreeAmbientProfile {
  alpha: [number, number]
  count: {
    balanced: number
    ultra: number
  }
  drift: {
    x: number
    y: number
    z: number
  }
  height: [number, number]
  size: [number, number]
  textures: string[]
  tint: number
  additive?: boolean
}

const THREE_AMBIENT_PROFILES: Record<BiomeVisualId, ThreeAmbientProfile | null> = {
  neutral: null,
  planicie_floresta_inicial: {
    alpha: [0.08, 0.18],
    count: { balanced: 5, ultra: 13 },
    drift: { x: 0.006, y: 0.002, z: -0.002 },
    height: [0.2, 1.6],
    size: [0.18, 0.52],
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff06.png`,
      `${KENNEY_PARTICLE_PATH}/dirt_01.png`,
      `${KENNEY_PARTICLE_PATH}/magic_01.png`,
    ],
    tint: 0xe4ffd0,
  },
  praia_litoral_oceano: {
    alpha: [0.11, 0.24],
    count: { balanced: 8, ultra: 20 },
    drift: { x: -0.012, y: 0.002, z: 0.006 },
    height: [0.08, 0.82],
    size: [0.22, 0.78],
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff00.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff12.png`,
      `${KENNEY_PARTICLE_PATH}/twirl_01.png`,
      `${KENNEY_PARTICLE_PATH}/circle_03.png`,
    ],
    tint: 0xd9fbff,
  },
  montanhas_vazio_sereno: {
    alpha: [0.08, 0.18],
    count: { balanced: 5, ultra: 14 },
    drift: { x: 0.012, y: 0.004, z: -0.004 },
    height: [0.55, 2.8],
    size: [0.3, 1.0],
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff18.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff24.png`,
      `${KENNEY_PARTICLE_PATH}/smoke_07.png`,
    ],
    tint: 0xeaf7ff,
  },
  floresta_mistica: {
    additive: true,
    alpha: [0.1, 0.22],
    count: { balanced: 7, ultra: 18 },
    drift: { x: 0.004, y: 0.006, z: -0.006 },
    height: [0.22, 2.1],
    size: [0.14, 0.48],
    textures: [
      `${KENNEY_PARTICLE_PATH}/magic_03.png`,
      `${KENNEY_PARTICLE_PATH}/magic_05.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff06.png`,
    ],
    tint: 0xb7ff99,
  },
  vulcao_terras_cinzentas: {
    additive: true,
    alpha: [0.14, 0.36],
    count: { balanced: 12, ultra: 34 },
    drift: { x: 0.002, y: 0.018, z: -0.004 },
    height: [0.12, 2.7],
    size: [0.08, 0.34],
    textures: [
      `${KENNEY_PARTICLE_PATH}/spark_01.png`,
      `${KENNEY_PARTICLE_PATH}/spark_03.png`,
      `${KENNEY_PARTICLE_PATH}/flame_01.png`,
      `${KENNEY_SMOKE_PATH}/blackSmoke08.png`,
    ],
    tint: 0xffb15c,
  },
  regiao_congelada_neve: {
    alpha: [0.09, 0.2],
    count: { balanced: 8, ultra: 22 },
    drift: { x: 0.008, y: -0.004, z: 0.006 },
    height: [0.35, 3.0],
    size: [0.08, 0.28],
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff00.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff18.png`,
      `${KENNEY_PARTICLE_PATH}/light_02.png`,
    ],
    tint: 0xd8f8ff,
  },
  ruinas_antigas: {
    additive: true,
    alpha: [0.1, 0.23],
    count: { balanced: 7, ultra: 18 },
    drift: { x: -0.002, y: 0.005, z: -0.007 },
    height: [0.2, 2.2],
    size: [0.12, 0.44],
    textures: [
      `${KENNEY_PARTICLE_PATH}/magic_01.png`,
      `${KENNEY_PARTICLE_PATH}/magic_03.png`,
      `${KENNEY_PARTICLE_PATH}/twirl_03.png`,
      `${KENNEY_PARTICLE_PATH}/flare_01.png`,
    ],
    tint: 0xd9b5ff,
  },
  vale_cinzento_veu: {
    alpha: [0.08, 0.19],
    count: { balanced: 7, ultra: 18 },
    drift: { x: 0.006, y: 0.004, z: -0.006 },
    height: [0.16, 1.8],
    size: [0.24, 0.74],
    textures: [
      `${KENNEY_SMOKE_PATH}/blackSmoke00.png`,
      `${KENNEY_SMOKE_PATH}/blackSmoke16.png`,
      `${KENNEY_PARTICLE_PATH}/dirt_03.png`,
    ],
    tint: 0xcab6a5,
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function hashText(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function parseColor(value = '#e9c97e') {
  return Number.parseInt(value.replace('#', ''), 16)
}

function resolveFreeCameraState(
  state: TabletopCamera3DState | undefined,
): FreeCameraRuntimeState {
  return {
    distance: clamp(
      state?.distance ?? DEFAULT_FREE_CAMERA_STATE.distance,
      FREE_CAMERA_DISTANCE_MIN,
      FREE_CAMERA_DISTANCE_MAX,
    ),
    pitch: clamp(state?.pitch ?? DEFAULT_FREE_CAMERA_STATE.pitch, 0.18, 1.54),
    targetX: clamp(state?.targetX ?? DEFAULT_FREE_CAMERA_STATE.targetX, -12, 12),
    targetY: clamp(state?.targetY ?? DEFAULT_FREE_CAMERA_STATE.targetY, -12, 12),
    targetZ: clamp(state?.targetZ ?? DEFAULT_FREE_CAMERA_STATE.targetZ, -2, 10),
    yaw: clamp(state?.yaw ?? DEFAULT_FREE_CAMERA_STATE.yaw, -Math.PI * 8, Math.PI * 8),
  }
}

function resolveWorldMetrics(map: TabletopMap) {
  const floorWidth = 12
  const floorHeight = floorWidth * (map.stageHeight / Math.max(1, map.stageWidth))

  return {
    cellDepth: floorHeight / Math.max(1, map.gridRows),
    cellWidth: floorWidth / Math.max(1, map.gridColumns),
    floorHeight,
    floorWidth,
  }
}

function resolveWorldPosition(
  map: TabletopMap,
  input: {
    cell: TabletopCell
    customSize?: TabletopGridSpan
    placement3d?: TabletopBoardObject['placement3d']
    size: TabletopTokenSize
  },
) {
  const metrics = resolveWorldMetrics(map)
  const span = resolveTabletopTokenSpan(input)
  const normalizedX =
    input.placement3d?.x ?? (input.cell.column + span.columns / 2) / map.gridColumns
  const normalizedY =
    input.placement3d?.y ?? (input.cell.row + span.rows / 2) / map.gridRows

  return {
    x: (normalizedX - 0.5) * metrics.floorWidth,
    y: input.placement3d?.z ?? 0,
    z: (normalizedY - 0.5) * metrics.floorHeight,
  }
}

function resolveObjectFootprint(map: TabletopMap, object: Tabletop3DObjectView) {
  const metrics = resolveWorldMetrics(map)
  const span = resolveTabletopTokenSpan(object)
  const baseSize = Math.max(metrics.cellWidth * span.columns, metrics.cellDepth * span.rows)

  return baseSize
}

function getPlacementScale(placement?: TabletopBoardObject['placement3d']) {
  return clamp(placement?.scale ?? 1, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX)
}

function getPlacementScaleVector(
  THREE: ThreeModule,
  placement?: TabletopBoardObject['placement3d'],
) {
  const fallbackScale = getPlacementScale(placement)

  return new THREE.Vector3(
    clamp(placement?.scaleX ?? fallbackScale, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX),
    clamp(placement?.scaleY ?? fallbackScale, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX),
    clamp(placement?.scaleZ ?? fallbackScale, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX),
  )
}

function getObjectRuntimeKey(object: Tabletop3DObjectView) {
  return [
    object.renderMode,
    object.modelUrl ?? '',
    object.modelNodeName ?? '',
    object.linkedItemId ?? '',
    object.objectType,
    object.assetUrl ?? '',
    object.modelUrl ? '' : object.color ?? '',
    object.size,
    object.customSize?.columns ?? '',
    object.customSize?.rows ?? '',
  ].join(':')
}

function getTokenRuntimeKey(token: Tabletop3DTokenView) {
  return [
    token.id,
    token.size,
    token.customSize?.columns ?? '',
    token.customSize?.rows ?? '',
    token.color,
    token.label,
  ].join(':')
}

function resolvePlacementFromWorldPoint(
  map: TabletopMap,
  point: { x: number; z: number },
  fallback: Tabletop3DObjectView,
) {
  const metrics = resolveWorldMetrics(map)

  return {
    ...(fallback.placement3d ?? {}),
    x: clamp(point.x / metrics.floorWidth + 0.5, 0, 1),
    y: clamp(point.z / metrics.floorHeight + 0.5, 0, 1),
    z: clamp(fallback.placement3d?.z ?? 0, PLACEMENT_HEIGHT_MIN, PLACEMENT_HEIGHT_MAX),
    rotationX: fallback.placement3d?.rotationX ?? 0,
    rotationY: fallback.placement3d?.rotationY ?? 0,
    rotationZ: fallback.placement3d?.rotationZ ?? 0,
    scale: fallback.placement3d?.scale ?? 1,
    scaleX: fallback.placement3d?.scaleX,
    scaleY: fallback.placement3d?.scaleY,
    scaleZ: fallback.placement3d?.scaleZ,
  }
}

function resolveCellFromPlacement(
  map: TabletopMap,
  placement: Pick<TabletopObject3DPlacement, 'x' | 'y'>,
) {
  return {
    column: clamp(Math.floor(placement.x * map.gridColumns), 0, map.gridColumns - 1),
    row: clamp(Math.floor(placement.y * map.gridRows), 0, map.gridRows - 1),
  }
}

function applyFreeCameraState(
  THREE: ThreeModule,
  camera: import('three').PerspectiveCamera,
  state: FreeCameraRuntimeState,
) {
  const horizontalDistance = Math.cos(state.pitch) * state.distance
  const position = new THREE.Vector3(
    state.targetX + Math.sin(state.yaw) * horizontalDistance,
    state.targetZ + Math.sin(state.pitch) * state.distance,
    state.targetY + Math.cos(state.yaw) * horizontalDistance,
  )
  camera.position.copy(position)
  camera.up.set(0, 1, 0)
  camera.lookAt(state.targetX, state.targetZ, state.targetY)
}

function disposeRuntimeScene(root: Object3D) {
  root.traverse((child) => {
    if (!child.userData.runtimeOwned) {
      return
    }

    const runtimeTextures = child.userData.runtimeTextures as
      | import('three').Texture[]
      | undefined
    runtimeTextures?.forEach((texture) => texture.dispose())

    const mesh = child as import('three').Mesh
    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => material?.dispose())
  })
}

function makeLabelSprite(
  THREE: ThreeModule,
  label: string,
  color: string,
  scale = 0.72,
) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const context = canvas.getContext('2d')

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = 'rgba(7, 9, 13, 0.72)'
    context.strokeStyle = color
    context.lineWidth = 4
    context.beginPath()
    context.roundRect(22, 18, 212, 58, 22)
    context.fill()
    context.stroke()
    context.font = '700 32px Georgia, serif'
    context.fillStyle = '#f8f0df'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label.slice(0, 10), 128, 48)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      opacity: 0.94,
      transparent: true,
    }),
  )
  sprite.scale.set(scale, scale * 0.375, 1)
  sprite.userData.runtimeOwned = true

  return sprite
}

function addGroundShadow(THREE: ThreeModule, group: import('three').Group, radius: number) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 40),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.28,
      transparent: true,
      depthWrite: false,
    }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.012
  shadow.userData.runtimeOwned = true
  group.add(shadow)
}

function resolveVfxObjectKind(object: Tabletop3DObjectView): TabletopVfxKind | null {
  const lookup = `${object.linkedItemId ?? ''} ${object.name} ${object.label}`.toLowerCase()

  if (!lookup.includes('vfx-')) {
    return null
  }

  if (lookup.includes('fire') || lookup.includes('fogo')) return 'fire'
  if (lookup.includes('fog') || lookup.includes('nevoa')) return 'fog'
  if (lookup.includes('wind') || lookup.includes('vento')) return 'wind'
  if (lookup.includes('water') || lookup.includes('agua')) return 'water'
  if (lookup.includes('lightning') || lookup.includes('raio')) return 'lightning'
  if (lookup.includes('leaf') || lookup.includes('folha')) return 'leaves'
  if (lookup.includes('lava')) return 'lava'
  if (lookup.includes('rain') || lookup.includes('chuva')) return 'rain'

  return 'fire'
}

function getCachedVfxTexture(THREE: ThreeModule, texturePath: string) {
  const resolvedPath = resolveRuntimeAssetUrl(texturePath)
  const cachedTexture = vfxTextureCache.get(resolvedPath)

  if (cachedTexture) {
    return cachedTexture
  }

  const texture = new THREE.TextureLoader().load(resolvedPath)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  vfxTextureCache.set(resolvedPath, texture)

  return texture
}

function addVfxSprite(
  THREE: ThreeModule,
  group: import('three').Group,
  texturePath: string,
  options: {
    additive?: boolean
    alpha?: number
    color?: number
    motion: 'fall' | 'flicker' | 'orbit' | 'rise' | 'sweep'
    phase: number
    position: [number, number, number]
    radius?: number
    scale: number
    speed?: number
    spread?: number
  },
) {
  const material = new THREE.SpriteMaterial({
    blending: options.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    color: options.color ?? 0xffffff,
    depthWrite: false,
    map: getCachedVfxTexture(THREE, texturePath),
    opacity: options.alpha ?? 0.7,
    transparent: true,
  })
  const sprite = new THREE.Sprite(material)
  sprite.position.set(...options.position)
  sprite.scale.set(options.scale, options.scale, options.scale)
  sprite.renderOrder = 8
  sprite.userData.runtimeOwned = true
  sprite.userData.vfxParticle = true
  sprite.userData.vfxAlpha = options.alpha ?? 0.7
  sprite.userData.vfxMotion = options.motion
  sprite.userData.vfxOriginX = options.position[0]
  sprite.userData.vfxOriginY = options.position[1]
  sprite.userData.vfxOriginZ = options.position[2]
  sprite.userData.vfxPhase = options.phase
  sprite.userData.vfxRadius = options.radius ?? 0.2
  sprite.userData.vfxScale = options.scale
  sprite.userData.vfxSpeed = options.speed ?? 1
  sprite.userData.vfxSpread = options.spread ?? 1
  group.add(sprite)

  return sprite
}

function addVfxRing(
  THREE: ThreeModule,
  group: import('three').Group,
  radius: number,
  color: number,
  alpha: number,
  phase = 0,
) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, Math.max(0.01, radius * 0.016), 8, 96),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color,
      depthWrite: false,
      opacity: alpha,
      transparent: true,
    }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.05
  ring.renderOrder = 7
  ring.userData.runtimeOwned = true
  ring.userData.vfxRing = true
  ring.userData.vfxAlpha = alpha
  ring.userData.vfxPhase = phase
  ring.userData.vfxScale = radius
  group.add(ring)
}

function addVfxObject(
  THREE: ThreeModule,
  group: import('three').Group,
  object: Tabletop3DObjectView,
  footprint: number,
  color: number,
) {
  const kind = resolveVfxObjectKind(object) ?? 'fire'
  const radius = Math.max(0.42, footprint * 0.42)
  const random = createSeededRandom(hashText(`${object.id}:${object.linkedItemId}:${object.name}`))
  const glowColor =
    kind === 'water'
      ? 0x70eaff
      : kind === 'fog' || kind === 'rain'
        ? 0xd8f6ff
        : kind === 'leaves'
          ? 0x9aff6a
          : color

  group.userData.vfxObject = kind
  if (kind === 'fire' || kind === 'lava' || kind === 'water') {
    addGroundShadow(THREE, group, radius * 0.72)
  }

  const light = new THREE.PointLight(
    glowColor,
    kind === 'lightning' ? 5.8 : kind === 'fire' || kind === 'lava' ? 3.8 : 1.6,
    radius * 5.5,
    1.7,
  )
  light.position.set(0, radius * 1.1, 0)
  light.userData.runtimeOwned = true
  light.userData.vfxLight = true
  light.userData.vfxPhase = random() * Math.PI * 2
  light.userData.vfxBaseIntensity = light.intensity
  group.add(light)

  if (kind === 'fire' || kind === 'lava') {
    const core = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.34, radius * 1.26, 28),
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: kind === 'lava' ? 0xff3b18 : 0xff8b2e,
        depthWrite: false,
        opacity: 0.42,
        transparent: true,
      }),
    )
    core.position.y = radius * 0.58
    core.userData.runtimeOwned = true
    core.userData.vfxCore = true
    core.userData.vfxPhase = random() * Math.PI * 2
    group.add(core)

    for (let index = 0; index < 24; index += 1) {
      const phase = random() * Math.PI * 2
      const distance = radius * (0.12 + random() * 0.58)
      const angle = random() * Math.PI * 2
      addVfxSprite(
        THREE,
        group,
        index % 5 === 0
          ? `${KENNEY_SMOKE_PATH}/blackSmoke08.png`
          : index % 3 === 0
            ? `${KENNEY_PARTICLE_PATH}/spark_03.png`
            : `${KENNEY_PARTICLE_PATH}/flame_01.png`,
        {
          additive: index % 5 !== 0,
          alpha: index % 5 === 0 ? 0.22 : 0.58,
          color: index % 5 === 0 ? 0x4e3328 : kind === 'lava' ? 0xff4a1f : 0xffc36a,
          motion: 'rise',
          phase,
          position: [
            Math.cos(angle) * distance,
            radius * (0.1 + random() * 0.55),
            Math.sin(angle) * distance,
          ],
          radius: distance,
          scale: radius * (0.28 + random() * 0.46),
          speed: 0.72 + random() * 0.82,
          spread: radius * 1.2,
        },
      )
    }

    for (let index = 0; index < (kind === 'lava' ? 12 : 5); index += 1) {
      const angle = (index / (kind === 'lava' ? 12 : 5)) * Math.PI * 2
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.065, 0),
          new THREE.Vector3(
            Math.cos(angle) * radius * (0.52 + random() * 0.8),
            0.066,
            Math.sin(angle) * radius * (0.52 + random() * 0.8),
          ),
        ]),
        new THREE.LineBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: kind === 'lava' ? 0xff3214 : 0xffb94a,
          depthWrite: false,
          opacity: kind === 'lava' ? 0.72 : 0.28,
          transparent: true,
        }),
      )
      line.userData.runtimeOwned = true
      line.userData.vfxCrack = true
      line.userData.vfxPhase = random() * Math.PI * 2
      group.add(line)
    }
  }

  if (kind === 'fog' || kind === 'rain') {
    const puffCount = kind === 'rain' ? 8 : 18

    for (let index = 0; index < puffCount; index += 1) {
      const angle = random() * Math.PI * 2
      const distance = radius * (0.12 + random() * 1.12)
      addVfxSprite(
        THREE,
        group,
        index % 2 === 0
          ? `${KENNEY_SMOKE_PATH}/whitePuff18.png`
          : `${KENNEY_SMOKE_PATH}/whitePuff24.png`,
        {
          alpha: kind === 'rain' ? 0.14 : 0.42,
          color: kind === 'rain' ? 0xcff8ff : 0xc8d8d6,
          motion: 'orbit',
          phase: random() * Math.PI * 2,
          position: [
            Math.cos(angle) * distance,
            radius * (kind === 'rain' ? 1.15 : 0.22 + random() * 0.55),
            Math.sin(angle) * distance,
          ],
          radius: distance,
          scale: radius * (kind === 'rain' ? 0.18 + random() * 0.28 : 0.5 + random() * 0.86),
          speed: 0.18 + random() * 0.26,
        },
      )
    }
  }

  if (kind === 'wind' || kind === 'leaves') {
    const particleCount = kind === 'leaves' ? 20 : 28

    for (let index = 0; index < particleCount; index += 1) {
      const phase = random() * Math.PI * 2
      const leafTexture =
        index % 4 === 0
          ? `${KENNEY_PARTICLE_PATH}/dirt_01.png`
          : index % 4 === 1
            ? `${KENNEY_PARTICLE_PATH}/dirt_03.png`
            : index % 4 === 2
              ? `${KENNEY_PARTICLE_PATH}/magic_01.png`
              : `${KENNEY_PARTICLE_PATH}/spark_05.png`
      addVfxSprite(
        THREE,
        group,
        kind === 'leaves'
          ? leafTexture
          : index % 2 === 0
            ? `${KENNEY_PARTICLE_PATH}/twirl_01.png`
            : `${KENNEY_SMOKE_PATH}/whitePuff06.png`,
        {
          additive: kind !== 'leaves',
          alpha: kind === 'leaves' ? 0.3 : 0.28,
          color: kind === 'leaves' ? 0xb4ff75 : 0xe8fbff,
          motion: kind === 'leaves' ? 'orbit' : 'sweep',
          phase,
          position: [
            -radius * 1.35 + random() * radius * 2.7,
            radius * (0.18 + random() * 0.95),
            (random() - 0.5) * radius * 1.3,
          ],
          radius: radius * (0.38 + random() * 0.96),
          scale: radius * (kind === 'leaves' ? 0.06 + random() * 0.12 : 0.42 + random() * 0.54),
          speed: 0.34 + random() * 0.66,
          spread: radius * 3.0,
        },
      )
    }
    addVfxRing(THREE, group, radius * (kind === 'leaves' ? 0.46 : 0.82), glowColor, kind === 'leaves' ? 0.12 : 0.18, random())
  }

  if (kind === 'water') {
    const causticsTexture = getCachedVfxTexture(THREE, '/assets/fx/textures/water_caustics_loop.png')
    causticsTexture.wrapS = THREE.RepeatWrapping
    causticsTexture.wrapT = THREE.RepeatWrapping
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 1.12, 88),
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0x70eaff,
        depthWrite: false,
        map: causticsTexture,
        opacity: 0.2,
        transparent: true,
      }),
    )
    pool.rotation.x = -Math.PI / 2
    pool.position.y = 0.062
    pool.renderOrder = 7
    pool.userData.runtimeOwned = true
    pool.userData.vfxWaterPool = true
    group.add(pool)

    for (let index = 0; index < 26; index += 1) {
      const phase = random() * Math.PI * 2
      const angle = random() * Math.PI * 2
      const distance = radius * (0.08 + random() * 0.98)
      addVfxSprite(
        THREE,
        group,
        index % 3 === 0
          ? `${KENNEY_PARTICLE_PATH}/circle_03.png`
          : `${KENNEY_SMOKE_PATH}/whitePuff00.png`,
        {
          additive: true,
          alpha: index % 3 === 0 ? 0.22 : 0.4,
          color: 0xcffbff,
          motion: 'orbit',
          phase,
          position: [
            Math.cos(angle) * distance,
            radius * (0.1 + random() * 0.76),
            Math.sin(angle) * distance,
          ],
          radius: distance,
          scale: radius * (0.22 + random() * 0.42),
          speed: 0.36 + random() * 0.48,
        },
      )
    }
  }

  if (kind === 'lightning') {
    for (let bolt = 0; bolt < 4; bolt += 1) {
      const points: import('three').Vector3[] = []
      const angle = random() * Math.PI * 2
      const offset = radius * (0.1 + random() * 0.42)
      const baseX = Math.cos(angle) * offset
      const baseZ = Math.sin(angle) * offset

      for (let index = 0; index <= 7; index += 1) {
        const t = index / 7
        points.push(
          new THREE.Vector3(
            baseX + Math.sin(index * 2.2 + bolt) * radius * 0.08,
            radius * (2.6 * (1 - t) + 0.08),
            baseZ + Math.cos(index * 1.9 + bolt) * radius * 0.08,
          ),
        )
      }

      const boltMesh = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, radius * 0.02, 6, false),
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: bolt % 2 === 0 ? 0xff203b : 0xffffff,
          depthWrite: false,
          opacity: 0.78,
          transparent: true,
        }),
      )
      boltMesh.userData.runtimeOwned = true
      boltMesh.userData.vfxBolt = true
      boltMesh.userData.vfxAlpha = 0.78
      boltMesh.userData.vfxPhase = random() * Math.PI * 2
      group.add(boltMesh)
    }

    addVfxRing(THREE, group, radius * 0.72, 0xff273b, 0.44, random())
    addVfxRing(THREE, group, radius * 1.08, 0x12060a, 0.5, random())
  }

  if (kind === 'rain') {
    for (let index = 0; index < 42; index += 1) {
      const x = (random() - 0.5) * radius * 2.5
      const z = (random() - 0.5) * radius * 2.5
      const drop = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.24, 0),
          new THREE.Vector3(-radius * 0.04, -0.18, radius * 0.02),
        ]),
        new THREE.LineBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: 0xb8efff,
          depthWrite: false,
          opacity: 0.28,
          transparent: true,
        }),
      )
      drop.position.set(x, radius * (0.3 + random() * 1.6), z)
      drop.userData.runtimeOwned = true
      drop.userData.vfxRainDrop = true
      drop.userData.vfxOriginY = drop.position.y
      drop.userData.vfxPhase = random() * Math.PI * 2
      drop.userData.vfxRadius = radius
      drop.userData.vfxSpeed = 0.9 + random() * 0.9
      group.add(drop)
    }
  }

  group.userData.skipSelectionLabel = true
}

function updateVfxRuntimeObject(node: Object3D, elapsed: number) {
  if (!node.userData.vfxObject) {
    return
  }

  node.traverse((child) => {
    if (child.userData.vfxParticle) {
      const sprite = child as import('three').Sprite
      const material = sprite.material as import('three').SpriteMaterial
      const phase = child.userData.vfxPhase as number
      const originX = child.userData.vfxOriginX as number
      const originY = child.userData.vfxOriginY as number
      const originZ = child.userData.vfxOriginZ as number
      const radius = child.userData.vfxRadius as number
      const scaleBase = child.userData.vfxScale as number
      const speed = child.userData.vfxSpeed as number
      const alpha = child.userData.vfxAlpha as number
      const motion = child.userData.vfxMotion as string

      if (motion === 'rise') {
        const lift = (elapsed * speed + phase) % 1.45
        sprite.position.set(
          originX + Math.sin(elapsed * 1.7 + phase) * radius * 0.12,
          originY + lift * radius * 1.4,
          originZ + Math.cos(elapsed * 1.3 + phase) * radius * 0.12,
        )
        material.opacity = alpha * Math.max(0.08, 1 - lift / 1.45)
      } else if (motion === 'orbit') {
        const orbit = elapsed * speed + phase
        sprite.position.x = Math.cos(orbit) * radius + originX * 0.24
        sprite.position.z = Math.sin(orbit * 0.92) * radius + originZ * 0.24
        sprite.position.y = originY + Math.sin(orbit * 1.2) * radius * 0.12
        material.opacity = alpha * (0.72 + Math.sin(orbit * 1.7) * 0.22)
      } else if (motion === 'sweep') {
        const spread = child.userData.vfxSpread as number
        const travel = ((elapsed * speed + phase) % 1) * spread - spread / 2
        sprite.position.x = travel
        sprite.position.y = originY + Math.sin(elapsed * 2.2 + phase) * radius * 0.12
        sprite.position.z = originZ + Math.cos(elapsed * 1.5 + phase) * radius * 0.18
        material.opacity = alpha * (0.55 + Math.sin(elapsed * 4 + phase) * 0.18)
      } else {
        material.opacity = alpha * (0.55 + Math.sin(elapsed * 5 + phase) * 0.34)
      }

      const scale = scaleBase * (0.88 + Math.sin(elapsed * 2.6 + phase) * 0.12)
      sprite.scale.set(scale, scale, scale)
      material.rotation = elapsed * 0.28 * speed + phase
    }

    if (child.userData.vfxRing) {
      const phase = child.userData.vfxPhase as number
      const baseAlpha = child.userData.vfxAlpha as number
      const mesh = child as import('three').Mesh
      const material = mesh.material as import('three').MeshBasicMaterial
      const pulse = 1 + Math.sin(elapsed * 1.3 + phase) * 0.12
      mesh.scale.setScalar(pulse)
      material.opacity = baseAlpha * (0.62 + Math.sin(elapsed * 2.1 + phase) * 0.28)
    }

    if (child.userData.vfxCore) {
      const phase = child.userData.vfxPhase as number
      child.scale.setScalar(0.84 + Math.sin(elapsed * 5 + phase) * 0.12)
    }

    if (child.userData.vfxLight) {
      const light = child as import('three').PointLight
      const phase = child.userData.vfxPhase as number
      const baseIntensity = child.userData.vfxBaseIntensity as number
      light.intensity = baseIntensity * (0.72 + Math.sin(elapsed * 4.8 + phase) * 0.26)
    }

    if (child.userData.vfxCrack || child.userData.vfxBolt) {
      const phase = child.userData.vfxPhase as number
      const mesh = child as import('three').Mesh
      const material = mesh.material as import('three').Material & { opacity?: number }
      if (material.opacity !== undefined) {
        material.opacity =
          (child.userData.vfxAlpha ?? 0.6) *
          (child.userData.vfxBolt
            ? (Math.sin(elapsed * 13 + phase) > -0.2 ? 1 : 0.22)
            : 0.55 + Math.sin(elapsed * 3 + phase) * 0.25)
      }
    }

    if (child.userData.vfxWaterPool) {
      const pool = child as import('three').Mesh
      const material = pool.material as import('three').MeshBasicMaterial
      if (material.map) {
        material.map.offset.x = elapsed * 0.018
        material.map.offset.y = -elapsed * 0.024
      }
      material.opacity = 0.16 + Math.sin(elapsed * 1.2) * 0.035
    }

    if (child.userData.vfxRainDrop) {
      const radius = child.userData.vfxRadius as number
      const phase = child.userData.vfxPhase as number
      const speed = child.userData.vfxSpeed as number
      const fall = (elapsed * speed + phase) % 1
      child.position.y = radius * (1.8 - fall * 1.75)
    }
  })
}

function addProceduralForestObject(
  THREE: ThreeModule,
  group: import('three').Group,
  object: Tabletop3DObjectView,
  footprint: number,
  color: number,
) {
  const lookup = `${object.linkedItemId ?? ''} ${object.modelNodeName ?? ''} ${object.name}`.toLowerCase()
  const bark = new THREE.MeshStandardMaterial({
    color: 0x6b5138,
    emissive: 0x1a1009,
    emissiveIntensity: 0.08,
    roughness: 0.74,
  })
  const leaves = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: object.isSelected ? 0.2 : 0.08,
    roughness: 0.58,
  })

  if (lookup.includes('rock') || lookup.includes('roch')) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(footprint * 0.36, 0),
      new THREE.MeshStandardMaterial({
        color: 0x8d8a7b,
        emissive: 0x22221c,
        emissiveIntensity: 0.08,
        roughness: 0.84,
      }),
    )
    rock.scale.set(1.15, 0.5, 0.82)
    rock.position.y = footprint * 0.18
    rock.rotation.set(0.2, 0.5, -0.12)
    rock.castShadow = true
    rock.receiveShadow = true
    rock.userData.runtimeOwned = true
    group.add(rock)
    return
  }

  if (lookup.includes('trunk') || lookup.includes('tronco')) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(footprint * 0.12, footprint * 0.16, footprint * 0.92, 10),
      bark,
    )
    trunk.position.y = footprint * 0.34
    trunk.rotation.z = Math.PI / 2.8
    trunk.castShadow = true
    trunk.receiveShadow = true
    trunk.userData.runtimeOwned = true
    group.add(trunk)
    return
  }

  const trunkHeight = lookup.includes('branch') || lookup.includes('galh')
    ? footprint * 1.2
    : footprint * 1.85
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(footprint * 0.075, footprint * 0.13, trunkHeight, 10),
    bark,
  )
  trunk.position.y = trunkHeight * 0.5
  trunk.castShadow = true
  trunk.receiveShadow = true
  trunk.userData.runtimeOwned = true
  group.add(trunk)

  if (lookup.includes('branch') || lookup.includes('galh')) {
    for (let index = 0; index < 5; index += 1) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(footprint * 0.025, footprint * 0.045, footprint * 0.7, 7),
        bark,
      )
      branch.position.y = footprint * (0.58 + index * 0.12)
      branch.rotation.z = 0.7 + index * 0.16
      branch.rotation.y = index * 1.32
      branch.castShadow = true
      branch.receiveShadow = true
      branch.userData.runtimeOwned = true
      group.add(branch)
    }
    return
  }

  for (let layer = 0; layer < 3; layer += 1) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(
        footprint * (0.42 - layer * 0.055),
        footprint * 0.78,
        9,
      ),
      leaves,
    )
    crown.position.y = trunkHeight * 0.64 + layer * footprint * 0.31
    crown.rotation.y = layer * 0.46
    crown.castShadow = true
    crown.receiveShadow = true
    crown.userData.runtimeOwned = true
    group.add(crown)
  }
}

function makeTokenNode(
  THREE: ThreeModule,
  map: TabletopMap,
  token: Tabletop3DTokenView,
) {
  const group = new THREE.Group()
  const position = resolveWorldPosition(map, token)
  const metrics = resolveWorldMetrics(map)
  const span = resolveTabletopTokenSpan(token)
  const radius = Math.max(metrics.cellWidth * span.columns, metrics.cellDepth * span.rows) * 0.34
  const color = parseColor(token.color)

  group.position.set(position.x, 0.04, position.z)
  group.userData.pickId = token.id
  group.userData.pickType = 'token'
  group.userData.sourceToken = token

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.94, 0.1, 42),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: token.isSelected ? 0.42 : 0.16,
      metalness: 0.12,
      roughness: 0.46,
    }),
  )
  base.position.y = 0.05
  base.userData.tokenRole = 'base'
  base.userData.runtimeOwned = true
  group.add(base)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.08, 0.018, 8, 70),
    new THREE.MeshBasicMaterial({
      color: token.isSelected ? 0xfff1b8 : color,
      opacity: token.isSelected ? 0.9 : 0.48,
      transparent: true,
    }),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.125
  ring.userData.tokenRole = 'ring'
  ring.userData.runtimeOwned = true
  group.add(ring)

  const label = makeLabelSprite(THREE, token.label, token.color, radius * 3.1)
  label.position.y = 0.62 + radius * 0.24
  group.add(label)

  addGroundShadow(THREE, group, radius * 1.05)

  return group
}

function makePrimitiveObject(
  THREE: ThreeModule,
  map: TabletopMap,
  object: Tabletop3DObjectView,
) {
  const group = new THREE.Group()
  const position = resolveWorldPosition(map, object)
  const color = parseColor(object.color ?? '#e9c97e')
  const footprint = resolveObjectFootprint(map, object)
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: object.isSelected ? 0.42 : 0.16,
    metalness: 0.18,
    roughness: 0.4,
  })
  const lookup = `${object.linkedItemId ?? ''} ${object.name}`.toLowerCase()
  const vfxKind = resolveVfxObjectKind(object)
  let mesh: import('three').Mesh

  if (vfxKind) {
    addVfxObject(THREE, group, object, footprint, color)
    group.position.set(position.x, position.y, position.z)
    group.rotation.set(
      object.placement3d?.rotationX ?? 0,
      object.placement3d?.rotationY ?? 0,
      object.placement3d?.rotationZ ?? 0,
    )
    group.userData.pickId = object.id
    group.userData.pickType = 'object'
    group.userData.sourceObject = object
    group.userData.baseRotationZ = 0
    group.userData.sway = 0
    group.scale.copy(getPlacementScaleVector(THREE, object.placement3d))

    return group
  }

  if (
    lookup.includes('forest') ||
    lookup.includes('arvore') ||
    lookup.includes('galhos') ||
    lookup.includes('tronco') ||
    lookup.includes('rochas')
  ) {
    addProceduralForestObject(THREE, group, object, footprint, color)
    addGroundShadow(THREE, group, footprint * 0.38)

    const label = makeLabelSprite(THREE, object.label, object.color ?? '#e9c97e', footprint * 0.72)
    label.position.y = footprint * 1.45
    group.add(label)

    group.position.set(position.x, position.y, position.z)
    group.rotation.set(
      object.placement3d?.rotationX ?? 0,
      object.placement3d?.rotationY ?? 0,
      object.placement3d?.rotationZ ?? 0,
    )
    group.userData.pickId = object.id
    group.userData.pickType = 'object'
    group.userData.sourceObject = object
    group.userData.baseRotationZ = 0
    group.userData.sway = 0
    group.scale.copy(getPlacementScaleVector(THREE, object.placement3d))

    return group
  }

  if (lookup.includes('cristal') || lookup.includes('crystal') || lookup.includes('fushi')) {
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(footprint * 0.34, 0), material)
    mesh.position.y = footprint * 0.34
  } else if (lookup.includes('braseiro') || lookup.includes('brazier')) {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(footprint * 0.22, footprint * 0.3, footprint * 0.42, 28), material)
    mesh.position.y = footprint * 0.22
  } else if (lookup.includes('portal')) {
    mesh = new THREE.Mesh(new THREE.TorusGeometry(footprint * 0.34, footprint * 0.035, 16, 80), material)
    mesh.position.y = footprint * 0.42
  } else if (lookup.includes('armadilha') || lookup.includes('trap')) {
    mesh = new THREE.Mesh(new THREE.ConeGeometry(footprint * 0.22, footprint * 0.42, 5), material)
    mesh.position.y = footprint * 0.21
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(footprint * 0.52, footprint * 0.72, footprint * 0.52), material)
    mesh.position.y = footprint * 0.36
  }

  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.runtimeOwned = true
  group.add(mesh)
  addGroundShadow(THREE, group, footprint * 0.36)

  const label = makeLabelSprite(THREE, object.label, object.color ?? '#e9c97e', footprint * 0.85)
  label.position.y = footprint * 0.92
  group.add(label)

  group.position.set(position.x, position.y, position.z)
  group.rotation.set(
    object.placement3d?.rotationX ?? 0,
    object.placement3d?.rotationY ?? 0,
    object.placement3d?.rotationZ ?? 0,
  )
  group.userData.pickId = object.id
  group.userData.pickType = 'object'
  group.userData.sourceObject = object
  group.userData.baseRotationZ = 0
  group.userData.sway = 0
  group.scale.copy(getPlacementScaleVector(THREE, object.placement3d))

  return group
}

function getModelExtension(url: string) {
  const cleanUrl = decodeURIComponent(url.split(/[?#]/)[0] ?? '').toLowerCase()
  const match = /\.([a-z0-9]+)$/.exec(cleanUrl)

  return match?.[1] ?? ''
}

function prepareLoadedModel(scene: Object3D) {
  scene.traverse((child) => {
    const mesh = child as import('three').Mesh

    if (mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })

  return scene
}

async function cloneLoadedModelScene(scene: Object3D) {
  try {
    const { clone } = await import('three/addons/utils/SkeletonUtils.js')

    return clone(scene) as Object3D
  } catch {
    return scene.clone(true)
  }
}

async function loadModelAsset(THREE: ThreeModule, url: string) {
  if (!modelAssetCache.has(url)) {
    modelAssetCache.set(
      url,
      (async () => {
        const resolvedUrl = resolveRuntimeAssetUrl(url)
        const extension = getModelExtension(url)

        if (extension === 'glb' || extension === 'gltf') {
          const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
          const loader = new GLTFLoader()
          const gltf = await loader.loadAsync(resolvedUrl)

          return {
            animations: gltf.animations ?? [],
            scene: prepareLoadedModel(gltf.scene),
          }
        }

        if (extension === 'obj') {
          const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js')
          const loader = new OBJLoader()
          const scene = await loader.loadAsync(resolvedUrl)

          return {
            animations: [],
            scene: prepareLoadedModel(scene),
          }
        }

        if (extension === 'fbx') {
          const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js')
          const loader = new FBXLoader()
          const scene = await loader.loadAsync(resolvedUrl)

          return {
            animations: scene.animations ?? [],
            scene: prepareLoadedModel(scene),
          }
        }

        if (extension === 'stl') {
          const { STLLoader } = await import('three/addons/loaders/STLLoader.js')
          const loader = new STLLoader()
          const geometry = await loader.loadAsync(resolvedUrl)
          const material = new THREE.MeshStandardMaterial({
            color: 0xd8d0be,
            metalness: 0.05,
            roughness: 0.66,
          })
          const mesh = new THREE.Mesh(geometry, material)
          const scene = new THREE.Group()

          scene.add(mesh)

          return {
            animations: [],
            scene: prepareLoadedModel(scene),
          }
        }

        throw new Error(`Formato de modelo 3D nao suportado: ${extension || url}`)
      })(),
    )
  }

  const asset = await modelAssetCache.get(url)

  return {
    animations: asset?.animations ?? [],
    scene: asset ? await cloneLoadedModelScene(asset.scene) : new THREE.Group(),
  }
}

function pickModelNode(root: Object3D, modelNodeName?: string) {
  if (!modelNodeName) {
    return root
  }

  const exact = root.getObjectByName(modelNodeName)

  if (exact) {
    return exact
  }

  let partial: Object3D | null = null
  const lowerName = modelNodeName.toLowerCase()
  root.traverse((child) => {
    if (!partial && child.name.toLowerCase().includes(lowerName)) {
      partial = child
    }
  })

  return partial ?? root
}

async function makeGltfObject(
  THREE: ThreeModule,
  map: TabletopMap,
  object: Tabletop3DObjectView,
  quality: VisualQualityMode,
) {
  if (!object.modelUrl || object.linkedItemId?.startsWith('forest-') || quality !== 'ultra') {
    return makePrimitiveObject(THREE, map, object)
  }

  const asset = await loadModelAsset(THREE, object.modelUrl)
  const source = asset.scene
  source.updateMatrixWorld(true)
  const selectedNode = pickModelNode(source, object.modelNodeName)
  const model = selectedNode.clone(true)
  const group = new THREE.Group()
  const position = resolveWorldPosition(map, object)
  const footprint = resolveObjectFootprint(map, object)

  selectedNode.updateMatrixWorld(true)
  selectedNode.matrixWorld.decompose(model.position, model.quaternion, model.scale)
  model.updateMatrixWorld(true)
  model.traverse((child) => {
    const mesh = child as import('three').Mesh

    if (!mesh.isMesh || !mesh.material) {
      return
    }

    mesh.castShadow = true
    mesh.receiveShadow = true
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => material.clone())
    } else {
      mesh.material = mesh.material.clone()
    }
  })

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  if (
    !Number.isFinite(size.x) ||
    !Number.isFinite(size.y) ||
    !Number.isFinite(size.z) ||
    Math.max(size.x, size.y, size.z) < 0.001
  ) {
    return makePrimitiveObject(THREE, map, object)
  }

  const baseScale = footprint / Math.max(0.001, size.x, size.z, size.y * 0.56)

  model.position.x -= center.x
  model.position.y -= box.min.y
  model.position.z -= center.z
  model.scale.multiplyScalar(baseScale)

  group.add(model)
  group.position.set(position.x, position.y, position.z)
  group.rotation.set(
    object.placement3d?.rotationX ?? 0,
    object.placement3d?.rotationY ?? 0,
    object.placement3d?.rotationZ ?? 0,
  )
  group.userData.pickId = object.id
  group.userData.pickType = 'object'
  group.userData.sourceObject = object
  group.userData.baseRotationZ = 0
  group.userData.sway = 0
  group.scale.copy(getPlacementScaleVector(THREE, object.placement3d))

  if (asset.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model)

    asset.animations.forEach((clip) => {
      mixer.clipAction(clip).play()
    })
    group.userData.animationMixer = mixer
  }

  addGroundShadow(THREE, group, footprint * 0.42)

  if (object.isSelected) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(footprint * 0.48, 0.018, 8, 86),
      new THREE.MeshBasicMaterial({
        color: parseColor(object.color ?? '#ffefb1'),
        opacity: 0.86,
        transparent: true,
      }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.03
    ring.userData.selectionMarker = true
    ring.userData.runtimeOwned = true
    group.add(ring)
  }

  return group
}

function makeGridLines(THREE: ThreeModule, map: TabletopMap) {
  const metrics = resolveWorldMetrics(map)
  const group = new THREE.Group()
  const material = new THREE.LineBasicMaterial({
    color: 0xe9dcae,
    opacity: 0.18,
    transparent: true,
  })

  for (let column = 0; column <= map.gridColumns; column += 1) {
    const x = -metrics.floorWidth / 2 + column * metrics.cellWidth
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.018, -metrics.floorHeight / 2),
      new THREE.Vector3(x, 0.018, metrics.floorHeight / 2),
    ])
    const line = new THREE.Line(geometry, material)
    line.userData.runtimeOwned = true
    group.add(line)
  }

  for (let row = 0; row <= map.gridRows; row += 1) {
    const z = -metrics.floorHeight / 2 + row * metrics.cellDepth
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-metrics.floorWidth / 2, 0.018, z),
      new THREE.Vector3(metrics.floorWidth / 2, 0.018, z),
    ])
    const line = new THREE.Line(geometry, material)
    line.userData.runtimeOwned = true
    group.add(line)
  }

  return group
}

function shouldUseOpenWaterSurface(map: TabletopMap) {
  if (map.biomeId !== 'praia_litoral_oceano') {
    return false
  }

  const lookup = `${map.id} ${map.name} ${map.summary ?? ''}`.toLowerCase()

  return (
    lookup.includes('alto mar') ||
    lookup.includes('submerso') ||
    lookup.includes('oceano aberto') ||
    lookup.includes('redemoinho') ||
    lookup.includes('corrente')
  )
}

async function makeBiomeBackdrop3D(
  THREE: ThreeModule,
  map: TabletopMap,
  quality: VisualQualityMode,
) {
  const asset = resolveBiomeCinematicAsset(map.biomeId)
  const metrics = resolveWorldMetrics(map)
  const backdropPath = resolveBiomeCinematicBackdrop(asset, quality)
  const texture = await new THREE.TextureLoader().loadAsync(
    resolveRuntimeAssetUrl(backdropPath),
  )
  const isOpenWaterMap = shouldUseOpenWaterSurface(map)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = quality === 'ultra' ? 6 : 2

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(metrics.floorWidth * 2.35, metrics.floorHeight * 2.35, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthWrite: false,
      map: texture,
      opacity: isOpenWaterMap ? (quality === 'ultra' ? 0.16 : 0.08) : quality === 'ultra' ? 0.5 : 0.2,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    }),
  )
  backdrop.rotation.x = -Math.PI / 2
  backdrop.position.y = -0.07
  backdrop.renderOrder = -6
  backdrop.userData.runtimeOwned = true
  backdrop.userData.runtimeTextures = [texture]
  backdrop.userData.biomeBackdrop = true

  return backdrop
}

async function makeOpenWaterSurface3D(
  THREE: ThreeModule,
  map: TabletopMap,
  quality: VisualQualityMode,
) {
  const metrics = resolveWorldMetrics(map)
  const group = new THREE.Group()
  const loader = new THREE.TextureLoader()
  const normalTexture = await loader.loadAsync(
    resolveRuntimeAssetUrl('/assets/fx/textures/water/three-waternormals.jpg'),
  )
  const causticsTexture = await loader.loadAsync(
    resolveRuntimeAssetUrl('/assets/fx/textures/water_caustics_loop.png'),
  )

  normalTexture.wrapS = THREE.RepeatWrapping
  normalTexture.wrapT = THREE.RepeatWrapping
  normalTexture.anisotropy = quality === 'ultra' ? 8 : 3
  causticsTexture.wrapS = THREE.RepeatWrapping
  causticsTexture.wrapT = THREE.RepeatWrapping
  causticsTexture.colorSpace = THREE.SRGBColorSpace
  causticsTexture.anisotropy = quality === 'ultra' ? 6 : 2

  if (quality === 'ultra') {
    try {
      const { Water } = await import('three/examples/jsm/objects/Water.js')
      const ocean = new Water(
        new THREE.PlaneGeometry(metrics.floorWidth * 3.85, metrics.floorHeight * 3.85, 1, 1),
        {
          alpha: 0.24,
          distortionScale: 2.15,
          fog: false,
          sunColor: 0x9fefff,
          sunDirection: new THREE.Vector3(-0.35, 0.72, 0.32).normalize(),
          textureHeight: 512,
          textureWidth: 512,
          waterColor: 0x062a36,
          waterNormals: normalTexture,
        },
      ) as RuntimeWaterMesh

      ocean.rotation.x = -Math.PI / 2
      ocean.position.y = -0.18
      ocean.renderOrder = -7
      ocean.userData.runtimeOwned = true
      ocean.userData.threeOceanSurface = true
      group.add(ocean)
    } catch {
      // The procedural caustic layer below still keeps the map playable if Water.js is unavailable.
    }
  }

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(
      metrics.floorWidth * 1.02,
      metrics.floorHeight * 1.02,
      quality === 'ultra' ? 20 : 8,
      quality === 'ultra' ? 20 : 8,
    ),
    new THREE.ShaderMaterial({
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        causticsMap: { value: causticsTexture },
        normalMap: { value: normalTexture },
        opacity: { value: quality === 'ultra' ? 0.011 : 0.006 },
        time: { value: 0 },
        tint: { value: new THREE.Color(0x8defff) },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 transformed = position;
          float rippleA = sin(position.x * 1.25 + position.y * 0.8 + time * 1.4) * 0.007;
          float rippleB = cos(position.x * 0.55 - position.y * 1.45 + time * 0.9) * 0.005;
          transformed.z += rippleA + rippleB;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D causticsMap;
        uniform sampler2D normalMap;
        uniform float opacity;
        uniform float time;
        uniform vec3 tint;
        varying vec2 vUv;

        void main() {
          vec2 flowA = vec2(time * 0.018, -time * 0.012);
          vec2 flowB = vec2(-time * 0.011, time * 0.02);
          float normalA = texture2D(normalMap, vUv * 3.1 + flowA).r;
          float normalB = texture2D(normalMap, vUv * 6.2 + flowB).g;
          float causticA = texture2D(causticsMap, vUv * 2.2 + flowA).r;
          float causticB = texture2D(causticsMap, vUv * 4.7 + flowB).g;
          float current = smoothstep(0.52, 0.95, causticA * 0.66 + causticB * 0.42 + normalA * 0.2);
          float foam = smoothstep(0.72, 1.0, texture2D(causticsMap, vUv * 7.5 - flowB * 1.6).r + normalB * 0.22);
          float edgeX = 1.0 - smoothstep(0.0, 0.08, vUv.x) + smoothstep(0.92, 1.0, vUv.x);
          float edgeY = 1.0 - smoothstep(0.0, 0.08, vUv.y) + smoothstep(0.92, 1.0, vUv.y);
          float edgeFoam = clamp(max(edgeX, edgeY), 0.0, 1.0) * foam;
          float alpha = (current * 0.32 + foam * 0.18 + edgeFoam * 0.22) * opacity;
          vec3 color = tint * (0.22 + current * 0.42 + foam * 0.62);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    }),
  ) as RuntimeWaterMesh

  water.rotation.x = -Math.PI / 2
  water.position.y = 0.034
  water.renderOrder = 1
  water.userData.runtimeOwned = true
  water.userData.openWaterSurface = true
  group.add(water)

  const fallHeight = Math.max(0.7, Math.min(metrics.floorWidth, metrics.floorHeight) * 0.11)
  const edgeMaterialOptions = {
    blending: THREE.NormalBlending,
    color: 0x70eaff,
    depthWrite: false,
    map: causticsTexture,
    opacity: quality === 'ultra' ? 0.024 : 0.014,
    side: THREE.DoubleSide,
    transparent: true,
  }
  const edgeDefinitions = [
    {
      geometry: new THREE.PlaneGeometry(metrics.floorWidth, fallHeight, 18, 2),
      position: new THREE.Vector3(0, -fallHeight / 2 + 0.02, -metrics.floorHeight / 2),
      rotationY: 0,
    },
    {
      geometry: new THREE.PlaneGeometry(metrics.floorWidth, fallHeight, 18, 2),
      position: new THREE.Vector3(0, -fallHeight / 2 + 0.02, metrics.floorHeight / 2),
      rotationY: Math.PI,
    },
    {
      geometry: new THREE.PlaneGeometry(metrics.floorHeight, fallHeight, 18, 2),
      position: new THREE.Vector3(-metrics.floorWidth / 2, -fallHeight / 2 + 0.02, 0),
      rotationY: Math.PI / 2,
    },
    {
      geometry: new THREE.PlaneGeometry(metrics.floorHeight, fallHeight, 18, 2),
      position: new THREE.Vector3(metrics.floorWidth / 2, -fallHeight / 2 + 0.02, 0),
      rotationY: -Math.PI / 2,
    },
  ]

  edgeDefinitions.forEach((definition, index) => {
    const curtain = new THREE.Mesh(
      definition.geometry,
      new THREE.MeshBasicMaterial(edgeMaterialOptions),
    )
    curtain.position.copy(definition.position)
    curtain.rotation.y = definition.rotationY
    curtain.userData.runtimeOwned = true
    curtain.userData.waterEdgeCurtain = true
    curtain.userData.baseOpacity = edgeMaterialOptions.opacity
    curtain.userData.edgePhase = index * 0.37
    group.add(curtain)
  })

  group.userData.runtimeOwned = true
  group.userData.openWaterRoot = true
  group.userData.runtimeTextures = [normalTexture, causticsTexture]

  return group
}

function updateOpenWaterSurface3D(node: Object3D, elapsed: number) {
  node.traverse((child) => {
    if (child.userData.threeOceanSurface) {
      const ocean = child as RuntimeWaterMesh

      if (ocean.material.uniforms.time) {
        ocean.material.uniforms.time.value = elapsed * 0.18
      }
    }

    if (child.userData.openWaterSurface) {
      const water = child as RuntimeWaterMesh

      if (water.material.uniforms.time) {
        water.material.uniforms.time.value = elapsed * 0.62
      }
    }

    if (child.userData.waterEdgeCurtain) {
      const mesh = child as import('three').Mesh
      const material = mesh.material as import('three').MeshBasicMaterial

      if (material.map) {
        material.map.offset.y = elapsed * 0.08 + (child.userData.edgePhase ?? 0)
        material.map.offset.x = Math.sin(elapsed * 0.18 + (child.userData.edgePhase ?? 0)) * 0.035
      }

      material.opacity =
        (child.userData.baseOpacity ?? 0.16) *
        (0.9 + Math.sin(elapsed * 1.4 + (child.userData.edgePhase ?? 0)) * 0.1)
    }
  })
}

function makeAmbient3D(THREE: ThreeModule, map: TabletopMap, quality: VisualQualityMode) {
  const group = new THREE.Group()
  const profile =
    THREE_AMBIENT_PROFILES[(map.biomeId as BiomeVisualId | undefined) ?? 'neutral'] ?? null

  group.userData.runtimeOwned = true
  group.userData.ambient3d = true

  if (!profile || quality === 'low') {
    return group
  }

  const metrics = resolveWorldMetrics(map)
  const random = createSeededRandom(hashText(`ambient-3d:${map.id}:${profile.tint}:${quality}`))
  const loader = new THREE.TextureLoader()
  const textures = profile.textures.map((texturePath) => {
    const texture = loader.load(resolveRuntimeAssetUrl(texturePath))

    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = quality === 'ultra' ? 4 : 2
    return texture
  })
  const count = quality === 'ultra' ? profile.count.ultra : profile.count.balanced
  const boundsX = metrics.floorWidth * 0.68
  const boundsZ = metrics.floorHeight * 0.68

  group.userData.runtimeTextures = textures

  for (let index = 0; index < count; index += 1) {
    const texture = textures[index % textures.length]
    const opacity =
      profile.alpha[0] + random() * (profile.alpha[1] - profile.alpha[0])
    const size = profile.size[0] + random() * (profile.size[1] - profile.size[0])
    const material = new THREE.SpriteMaterial({
      blending: profile.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      color: profile.tint,
      depthWrite: false,
      map: texture,
      opacity,
      transparent: true,
    })
    const sprite = new THREE.Sprite(material)
    const x = random() * boundsX * 2 - boundsX
    const y = profile.height[0] + random() * (profile.height[1] - profile.height[0])
    const z = random() * boundsZ * 2 - boundsZ

    sprite.position.set(x, y, z)
    sprite.scale.set(size, size, size)
    sprite.renderOrder = 4
    sprite.userData.runtimeOwned = true
    sprite.userData.ambientParticle = true
    sprite.userData.alphaBase = opacity
    sprite.userData.alphaPhase = random() * Math.PI * 2
    sprite.userData.boundsX = boundsX
    sprite.userData.boundsZ = boundsZ
    sprite.userData.heightMin = profile.height[0]
    sprite.userData.heightMax = profile.height[1]
    sprite.userData.scaleBase = size
    sprite.userData.velocityX = profile.drift.x * (0.45 + random() * 0.85)
    sprite.userData.velocityY = profile.drift.y * (0.45 + random() * 0.85)
    sprite.userData.velocityZ = profile.drift.z * (0.45 + random() * 0.85)
    group.add(sprite)
  }

  return group
}

function updateAmbient3D(node: Object3D, elapsed: number) {
  node.traverse((child) => {
    if (!child.userData.ambientParticle) {
      return
    }

    const sprite = child as import('three').Sprite
    const boundsX = child.userData.boundsX as number
    const boundsZ = child.userData.boundsZ as number
    const heightMin = child.userData.heightMin as number
    const heightMax = child.userData.heightMax as number
    const alphaBase = child.userData.alphaBase as number
    const alphaPhase = child.userData.alphaPhase as number
    const scaleBase = child.userData.scaleBase as number

    sprite.position.x += child.userData.velocityX as number
    sprite.position.y += child.userData.velocityY as number
    sprite.position.z += child.userData.velocityZ as number

    if (sprite.position.x < -boundsX) sprite.position.x = boundsX
    if (sprite.position.x > boundsX) sprite.position.x = -boundsX
    if (sprite.position.z < -boundsZ) sprite.position.z = boundsZ
    if (sprite.position.z > boundsZ) sprite.position.z = -boundsZ
    if (sprite.position.y < heightMin) sprite.position.y = heightMax
    if (sprite.position.y > heightMax) sprite.position.y = heightMin

    const material = sprite.material as import('three').SpriteMaterial
    material.opacity = alphaBase * (0.82 + Math.sin(elapsed * 1.1 + alphaPhase) * 0.18)
    const pulse = scaleBase * (1 + Math.sin(elapsed * 0.7 + alphaPhase) * 0.05)
    sprite.scale.set(pulse, pulse, pulse)
  })
}

function makeBoardImpact(THREE: ThreeModule, map: TabletopMap, impact: Tabletop3DBoardImpact) {
  const metrics = resolveWorldMetrics(map)
  const group = new THREE.Group()
  const hotColor = parseColor(
    impact.color ?? (impact.outcome === 'triumph' ? '#ff1d16' : '#9b0505'),
  )
  const impactMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: hotColor,
    depthWrite: false,
    opacity: impact.outcome === 'triumph' ? 0.92 : 0.74,
    transparent: true,
  })
  const darkMaterial = new THREE.MeshBasicMaterial({
    color: 0x050000,
    depthWrite: false,
    opacity: 0.72,
    transparent: true,
  })
  const crackMaterials = [
    new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: hotColor,
      depthWrite: false,
      opacity: impact.outcome === 'triumph' ? 0.84 : 0.66,
      transparent: true,
    }),
    new THREE.LineBasicMaterial({
      color: 0x050000,
      depthWrite: false,
      opacity: 0.76,
      transparent: true,
    }),
  ]

  for (let bolt = 0; bolt < 5; bolt += 1) {
    const angle = bolt * 1.28 + Math.sin(bolt * 2.17) * 0.18
    const radius = 1.2 + bolt * 0.42
    const points: import('three').Vector3[] = []

    for (let index = 0; index <= 9; index += 1) {
      const t = index / 9
      const wobble = Math.sin(index * 2.8 + bolt) * (0.36 - t * 0.18)
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius * (1 - t) + wobble,
          5.8 * (1 - t) + 0.06,
          Math.sin(angle) * radius * (1 - t) + Math.cos(index + bolt) * wobble,
        ),
      )
    }

    const boltMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 42, 0.035, 7, false),
      bolt % 2 === 0 ? impactMaterial.clone() : darkMaterial.clone(),
    )
    boltMesh.userData.runtimeOwned = true
    boltMesh.userData.impactKind = 'bolt'
    boltMesh.userData.birthDelay = bolt * 0.08
    group.add(boltMesh)
  }

  for (let branch = 0; branch < 34; branch += 1) {
    const angle = (branch / 34) * Math.PI * 2 + Math.sin(branch * 1.91) * 0.22
    const radius =
      0.5 +
      (((branch * 31) % 100) / 100) *
        Math.min(metrics.floorWidth, metrics.floorHeight) *
        0.42
    const points: import('three').Vector3[] = [new THREE.Vector3(0, 0.052, 0)]

    for (let index = 1; index <= 5; index += 1) {
      const t = index / 5
      const wobble = Math.sin(index * 2.4 + branch) * 0.16
      points.push(
        new THREE.Vector3(
          Math.cos(angle + wobble) * radius * t,
          0.055,
          Math.sin(angle + wobble) * radius * t,
        ),
      )
    }

    const crack = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      crackMaterials[branch % crackMaterials.length],
    )
    crack.userData.runtimeOwned = true
    crack.userData.impactKind = 'crack'
    crack.userData.birthDelay = branch * 0.012
    group.add(crack)
  }

  for (let ringIndex = 0; ringIndex < 4; ringIndex += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.46 + ringIndex * 0.34, 0.018, 8, 120),
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: ringIndex % 2 === 0 ? hotColor : 0xffffff,
        depthWrite: false,
        opacity: 0.48,
        transparent: true,
      }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.07 + ringIndex * 0.004
    ring.userData.runtimeOwned = true
    ring.userData.impactKind = 'ring'
    ring.userData.birthDelay = ringIndex * 0.1
    group.add(ring)
  }

  const blast = new THREE.PointLight(
    hotColor,
    impact.outcome === 'triumph' ? 12 : 7,
    9,
    1.5,
  )
  blast.position.set(0, 2.2, 0)
  blast.userData.runtimeOwned = true
  blast.userData.impactKind = 'light'
  group.add(blast)
  group.userData.impactStart = performance.now()

  return group
}

function updateBoardImpact(group: Object3D, now: number) {
  const start = typeof group.userData.impactStart === 'number' ? group.userData.impactStart : now
  const age = (now - start) / 1000
  const flash = Math.max(0, 1 - age / 1.8)

  group.traverse((child) => {
    const birthDelay =
      typeof child.userData.birthDelay === 'number' ? child.userData.birthDelay : 0
    const localAge = Math.max(0, age - birthDelay)
    const light = child as import('three').PointLight

    if (light.isPointLight) {
      light.intensity = 10 * flash
      return
    }

    const materialHost = child as import('three').Object3D & {
      material?: import('three').Material | import('three').Material[]
    }
    if (!materialHost.material) {
      return
    }

    const materials = Array.isArray(materialHost.material)
      ? materialHost.material
      : [materialHost.material]
    materials.forEach((material) => {
      const fadedMaterial = material as import('three').Material & { opacity?: number }

      if (fadedMaterial.opacity !== undefined) {
        fadedMaterial.opacity = Math.max(0, Math.min(1, flash * (localAge > 0 ? 1 : 0)))
      }
    })

    if (child.userData.impactKind === 'ring') {
      child.scale.setScalar(1 + Math.min(1.8, localAge * 1.9))
    }
  })

  group.visible = age <= 2.4
}

export function Tabletop3DStage({
  boardImpact,
  cameraState,
  editorEnabled = false,
  editorTool = 'translate',
  freeCameraVisible = false,
  isGridVisible,
  map,
  objectPlacementActive = false,
  objects = [],
  onCameraChange,
  onEditorToolChange,
  onObjectCreateAtPlacement,
  onObjectDuplicate,
  onObjectConfirm,
  onObjectPlacementChange,
  onObjectRemove,
  onObjectSelect,
  onObjectUndo,
  onTokenSelect,
  quality = 'balanced',
  tokens = [],
}: Tabletop3DStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const boardImpactRef = useRef(boardImpact)
  const cameraStateRef = useRef(cameraState)
  const editorToolRef = useRef<Tabletop3DEditorTool>(editorTool)
  const applyEditorToolRef =
    useRef<((tool: Tabletop3DEditorTool) => void) | null>(null)
  const applyCameraStateRef =
    useRef<((state: TabletopCamera3DState | undefined) => void) | null>(null)
  const applyObjectStateRef =
    useRef<((nextObjects: Tabletop3DObjectView[]) => void) | null>(null)
  const applyTokenStateRef =
    useRef<((nextTokens: Tabletop3DTokenView[]) => void) | null>(null)
  const mapRef = useRef(map)
  const objectPlacementActiveRef = useRef(objectPlacementActive)
  const objectsRef = useRef(objects)
  const onCameraChangeRef = useRef(onCameraChange)
  const onEditorToolChangeRef = useRef(onEditorToolChange)
  const onObjectCreateAtPlacementRef = useRef(onObjectCreateAtPlacement)
  const onObjectDuplicateRef = useRef(onObjectDuplicate)
  const onObjectConfirmRef = useRef(onObjectConfirm)
  const onObjectPlacementChangeRef = useRef(onObjectPlacementChange)
  const onObjectRemoveRef = useRef(onObjectRemove)
  const onObjectSelectRef = useRef(onObjectSelect)
  const onObjectUndoRef = useRef(onObjectUndo)
  const onTokenSelectRef = useRef(onTokenSelect)
  const tokensRef = useRef(tokens)
  const cameraSignature = [
    cameraState?.enabled ? '1' : '0',
    cameraState?.mode ?? '',
    cameraState?.yaw ?? '',
    cameraState?.pitch ?? '',
    cameraState?.distance ?? '',
    cameraState?.targetX ?? '',
    cameraState?.targetY ?? '',
    cameraState?.targetZ ?? '',
  ].join(':')
  const mapSignature = [
    map.id,
    map.image,
    map.stageWidth,
    map.stageHeight,
    map.gridColumns,
    map.gridRows,
  ].join(':')
  useEffect(() => {
    boardImpactRef.current = boardImpact
    cameraStateRef.current = cameraState
    mapRef.current = map
    objectPlacementActiveRef.current = objectPlacementActive
    objectsRef.current = objects
    onCameraChangeRef.current = onCameraChange
    onEditorToolChangeRef.current = onEditorToolChange
    onObjectCreateAtPlacementRef.current = onObjectCreateAtPlacement
    onObjectDuplicateRef.current = onObjectDuplicate
    onObjectConfirmRef.current = onObjectConfirm
    onObjectPlacementChangeRef.current = onObjectPlacementChange
    onObjectRemoveRef.current = onObjectRemove
    onObjectSelectRef.current = onObjectSelect
    onObjectUndoRef.current = onObjectUndo
    onTokenSelectRef.current = onTokenSelect
    tokensRef.current = tokens
  }, [
    boardImpact,
    cameraState,
    map,
    objectPlacementActive,
    objects,
    onCameraChange,
    onEditorToolChange,
    onObjectCreateAtPlacement,
    onObjectDuplicate,
    onObjectConfirm,
    onObjectPlacementChange,
    onObjectRemove,
    onObjectSelect,
    onObjectUndo,
    onTokenSelect,
    tokens,
  ])

  useEffect(() => {
    editorToolRef.current = editorTool
    applyEditorToolRef.current?.(editorTool)
  }, [editorTool])

  useEffect(() => {
    if (!freeCameraVisible) {
      return
    }

    applyCameraStateRef.current?.(cameraState)
  }, [cameraSignature, freeCameraVisible, cameraState])

  useEffect(() => {
    applyObjectStateRef.current?.(objects)
  }, [objects])

  useEffect(() => {
    applyTokenStateRef.current?.(tokens)
  }, [tokens])

  useEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    let disposed = false
    let animationFrame = 0
    let activeCamera: Camera
    let cameraCommitTimeout = 0
    let dragState: DragState | null = null
    let externalCameraTarget: FreeCameraRuntimeState | null = null
    let ignoreExternalCameraUntil = 0
    let lastCameraStreamCommitAt = 0
    let cameraStreamSequence = 0
    const mapSnapshot = mapRef.current
    const objectsSnapshot = objectsRef.current
    const tokensSnapshot = tokensRef.current
    const freeState = resolveFreeCameraState(cameraStateRef.current)
    const runtimeObjects: Object3D[] = []
    const runtimeObjectNodes = new Map<string, Object3D>()
    const runtimeObjectKeys = new Map<string, string>()
    const pendingObjectKeys = new Map<string, string>()
    const runtimeTokenNodes = new Map<string, Object3D>()
    const runtimeTokenKeys = new Map<string, string>()
    const pressedCameraKeys = new Set<string>()
    let transformControls: TransformControlsInstance | null = null
    let ambientNode: Object3D | null = null
    let impactNode: Object3D | null = null
    let waterSurfaceNode: Object3D | null = null
    let currentImpactSignature = ''
    let keyboardCameraBoost = false
    let lastRenderTime = performance.now()
    let renderFrameCount = 0

    async function mount() {
      const THREE = await import('three')
      const { TransformControls } =
        editorEnabled && freeCameraVisible
          ? await import('three/addons/controls/TransformControls.js')
          : { TransformControls: null }

      if (disposed || !host) {
        return
      }

      const mountHost = host
      const metrics = resolveWorldMetrics(mapSnapshot)
      const targetLimitX = Math.max(metrics.floorWidth * 0.55, metrics.cellWidth * 2)
      const targetLimitY = Math.max(metrics.floorHeight * 0.55, metrics.cellDepth * 2)
      const scene = new THREE.Scene()
      const cameraMode = freeCameraVisible ? 'free' : 'topdown'
      const width = mountHost.clientWidth || mapSnapshot.stageWidth
      const height = mountHost.clientHeight || mapSnapshot.stageHeight
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: quality === 'ultra',
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
      })
      const orthographicCamera = new THREE.OrthographicCamera(
        -metrics.floorWidth / 2,
        metrics.floorWidth / 2,
        metrics.floorHeight / 2,
        -metrics.floorHeight / 2,
        0.05,
        80,
      )
      const perspectiveCamera = new THREE.PerspectiveCamera(42, width / height, 0.05, 120)

      renderer.setClearColor(0x05070a, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'ultra' ? 1.7 : 1.25))
      renderer.setSize(width, height)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.shadowMap.enabled = quality === 'ultra'
      renderer.domElement.className = 'tabletop-3d-stage__canvas'
      renderer.domElement.dataset.cameraMode = cameraMode
      renderer.domElement.dataset.editorEnabled = editorEnabled ? '1' : '0'
      renderer.domElement.tabIndex = 0
      mountHost.replaceChildren(renderer.domElement)
      if (editorEnabled && cameraMode === 'free') {
        window.requestAnimationFrame(() => renderer.domElement.focus())
      }

      orthographicCamera.position.set(0, 14, 0.001)
      orthographicCamera.up.set(0, 0, -1)
      orthographicCamera.lookAt(0, 0, 0)
      clampFreeCameraTarget()
      applyFreeCameraState(THREE, perspectiveCamera, freeState)
      activeCamera = cameraMode === 'free' ? perspectiveCamera : orthographicCamera
      const shouldRenderFloor = freeCameraVisible
      renderer.domElement.dataset.floorTexture = shouldRenderFloor ? 'loading' : 'not-needed'
      writeCameraDebugState()

      if (TransformControls && editorEnabled && cameraMode === 'free') {
        transformControls = new TransformControls(activeCamera, renderer.domElement)
        transformControls.setMode(editorToolRef.current)
        transformControls.setSize(1.05)
        scene.add(transformControls.getHelper())
        renderer.domElement.dataset.transformTool = editorToolRef.current
      }

      scene.add(new THREE.HemisphereLight(0xd8fff4, 0x100805, 1.25))
      const keyLight = new THREE.DirectionalLight(0xffeed0, 2.2)
      keyLight.position.set(-4, 8, -3)
      keyLight.castShadow = quality === 'ultra'
      scene.add(keyLight)
      const rimLight = new THREE.DirectionalLight(0x70f3ff, 0.82)
      rimLight.position.set(4, 5, 3)
      scene.add(rimLight)

      if (shouldRenderFloor) {
        if (quality !== 'low') {
          try {
            const backdrop = await makeBiomeBackdrop3D(THREE, mapSnapshot, quality)

            if (disposed) {
              disposeRuntimeScene(backdrop)
              return
            }

            scene.add(backdrop)
            renderer.domElement.dataset.biomeBackdrop = 'loaded'
          } catch {
            renderer.domElement.dataset.biomeBackdrop = 'unavailable'
          }
        } else {
          renderer.domElement.dataset.biomeBackdrop = 'low-disabled'
        }

        try {
          const texture = await new THREE.TextureLoader().loadAsync(
            resolveRuntimeAssetUrl(mapSnapshot.image),
          )

          if (disposed) {
            texture.dispose()
            return
          }

          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = quality === 'ultra' ? 8 : 2

          const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(metrics.floorWidth, metrics.floorHeight, 1, 1),
            new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.DoubleSide,
              toneMapped: false,
            }),
          )
          floor.rotation.x = -Math.PI / 2
          floor.receiveShadow = true
          floor.userData.runtimeOwned = true
          scene.add(floor)
          renderer.domElement.dataset.floorTexture = 'loaded'
        } catch {
          const fallbackFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(metrics.floorWidth, metrics.floorHeight, 1, 1),
            new THREE.MeshBasicMaterial({
              color: 0x161c1c,
              side: THREE.DoubleSide,
            }),
          )
          fallbackFloor.rotation.x = -Math.PI / 2
          fallbackFloor.userData.runtimeOwned = true
          scene.add(fallbackFloor)
          renderer.domElement.dataset.floorTexture = 'fallback'
        }

        const edge = new THREE.Mesh(
          new THREE.BoxGeometry(metrics.floorWidth + 0.14, 0.08, metrics.floorHeight + 0.14),
          new THREE.MeshBasicMaterial({
            color: 0x0b0d12,
            opacity: 0.62,
            transparent: true,
            wireframe: true,
          }),
        )
        edge.position.y = 0.04
        edge.userData.runtimeOwned = true
        scene.add(edge)

        if (quality !== 'low' && shouldUseOpenWaterSurface(mapSnapshot)) {
          try {
            waterSurfaceNode = await makeOpenWaterSurface3D(
              THREE,
              mapSnapshot,
              quality,
            )

            if (disposed) {
              disposeRuntimeScene(waterSurfaceNode)
              return
            }

            scene.add(waterSurfaceNode)
            renderer.domElement.dataset.waterSurface = 'loaded'
          } catch {
            renderer.domElement.dataset.waterSurface = 'unavailable'
          }
        } else {
          renderer.domElement.dataset.waterSurface = 'not-needed'
        }
      }

      if (isGridVisible && shouldRenderFloor) {
        scene.add(makeGridLines(THREE, mapSnapshot))
      }

      if (shouldRenderFloor && quality !== 'low') {
        ambientNode = makeAmbient3D(THREE, mapSnapshot, quality)
        scene.add(ambientNode)
      }

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const floorHit = new THREE.Vector3()

      function commitCameraState() {
        if (cameraCommitTimeout) {
          window.clearTimeout(cameraCommitTimeout)
          cameraCommitTimeout = 0
        }

        clampFreeCameraTarget()
        onCameraChangeRef.current?.({
          enabled: true,
          mode: 'free',
          ...freeState,
        })
      }

      function streamCameraState() {
        const now = performance.now()

        if (now - lastCameraStreamCommitAt < FREE_CAMERA_STREAM_INTERVAL_MS) {
          return
        }

        lastCameraStreamCommitAt = now
        onCameraChangeRef.current?.({
          enabled: true,
          mode: 'free',
          ...freeState,
        })
        cameraStreamSequence += 1
        renderer.domElement.dataset.cameraStreamSequence = String(cameraStreamSequence)
        renderer.domElement.dataset.cameraStreamAt = String(Math.round(now))
      }

      function scheduleCameraStateCommit(delay = 360) {
        if (cameraCommitTimeout) {
          window.clearTimeout(cameraCommitTimeout)
        }

        cameraCommitTimeout = window.setTimeout(() => {
          commitCameraState()
        }, delay)
      }

      function applyFreeCameraAndScheduleCommit(delay = 360) {
        ignoreExternalCameraUntil = performance.now() + 1200
        applyFreeCameraState(THREE, perspectiveCamera, freeState)
        writeCameraDebugState()
        streamCameraState()
        scheduleCameraStateCommit(delay)
      }

      applyCameraStateRef.current = (nextCameraState) => {
        if (cameraMode === 'free' && performance.now() < ignoreExternalCameraUntil) {
          renderer.domElement.dataset.externalCameraIgnored = '1'
          return
        }

        renderer.domElement.dataset.externalCameraIgnored = '0'
        const resolvedState = resolveFreeCameraState(nextCameraState)

        if (!editorEnabled) {
          externalCameraTarget = resolvedState
          renderer.domElement.dataset.externalCameraSmoothing = '1'
          return
        }

        externalCameraTarget = null
        renderer.domElement.dataset.externalCameraSmoothing = '0'
        Object.assign(freeState, resolvedState)
        clampFreeCameraTarget()
        applyFreeCameraState(THREE, perspectiveCamera, freeState)
        writeCameraDebugState()
      }

      applyEditorToolRef.current = (tool) => {
        transformControls?.setMode(tool)
        renderer.domElement.dataset.transformTool = tool
      }

      function requestEditorTool(tool: Tabletop3DEditorTool) {
        editorToolRef.current = tool
        applyEditorToolRef.current?.(tool)
        onEditorToolChangeRef.current?.(tool)
      }

      function clampFreeCameraTarget() {
        freeState.targetX = clamp(freeState.targetX, -targetLimitX, targetLimitX)
        freeState.targetY = clamp(freeState.targetY, -targetLimitY, targetLimitY)
        freeState.distance = clamp(
          freeState.distance,
          FREE_CAMERA_DISTANCE_MIN,
          FREE_CAMERA_DISTANCE_MAX,
        )
      }

      function writeCameraDebugState() {
        if (cameraMode !== 'free') {
          return
        }

        renderer.domElement.dataset.cameraTarget = [
          freeState.targetX.toFixed(3),
          freeState.targetY.toFixed(3),
          freeState.targetZ.toFixed(3),
          freeState.distance.toFixed(3),
          freeState.yaw.toFixed(3),
          freeState.pitch.toFixed(3),
        ].join(':')
      }

      function registerRuntimeNode(node: Object3D) {
        runtimeObjects.push(node)
        scene.add(node)
      }

      function removeRuntimeNode(node: Object3D) {
        const runtimeIndex = runtimeObjects.indexOf(node)

        if (runtimeIndex >= 0) {
          runtimeObjects.splice(runtimeIndex, 1)
        }
        scene.remove(node)
        disposeRuntimeScene(node)
      }

      function syncBoardImpact() {
        const nextImpact = boardImpactRef.current
        const nextSignature = nextImpact
          ? `${nextImpact.id}:${nextImpact.outcome}:${nextImpact.color ?? ''}`
          : ''

        if (nextSignature === currentImpactSignature) {
          return
        }

        if (impactNode) {
          scene.remove(impactNode)
          disposeRuntimeScene(impactNode)
          impactNode = null
        }

        currentImpactSignature = nextSignature

        if (!nextImpact) {
          renderer.domElement.dataset.impactActive = '0'
          return
        }

        impactNode = makeBoardImpact(THREE, mapSnapshot, nextImpact)
        scene.add(impactNode)
        renderer.domElement.dataset.impactActive = nextImpact.outcome
      }

      function removeRuntimeObjectNode(objectId: string) {
        const currentNode = runtimeObjectNodes.get(objectId)

        if (!currentNode) {
          return
        }

        if (transformControls?.object === currentNode) {
          transformControls.detach()
        }
        removeRuntimeNode(currentNode)
        runtimeObjectNodes.delete(objectId)
        runtimeObjectKeys.delete(objectId)
        pendingObjectKeys.delete(objectId)
      }

      function addOrReplaceRuntimeObject(object: Tabletop3DObjectView, runtimeKey: string) {
        pendingObjectKeys.set(object.id, runtimeKey)
        const createObject = object.modelUrl
          ? makeGltfObject(THREE, mapSnapshot, object, quality)
          : Promise.resolve(makePrimitiveObject(THREE, mapSnapshot, object))

        createObject
          .then((objectNode) => {
            if (disposed || pendingObjectKeys.get(object.id) !== runtimeKey) {
              removeRuntimeNode(objectNode)
              return
            }

            const latestObject = objectsRef.current.find(
              (candidate) =>
                candidate.id === object.id &&
                candidate.renderMode === 'three' &&
                getObjectRuntimeKey(candidate) === runtimeKey,
            )

            if (!latestObject) {
              removeRuntimeNode(objectNode)
              pendingObjectKeys.delete(object.id)
              return
            }

            removeRuntimeObjectNode(object.id)
            runtimeObjectNodes.set(object.id, objectNode)
            runtimeObjectKeys.set(object.id, runtimeKey)
            pendingObjectKeys.delete(object.id)
            registerRuntimeNode(objectNode)
            applyObjectState(objectsRef.current)
          })
          .catch(() => {
            if (disposed || pendingObjectKeys.get(object.id) !== runtimeKey) {
              return
            }

            const latestObject = objectsRef.current.find(
              (candidate) =>
                candidate.id === object.id &&
                candidate.renderMode === 'three' &&
                getObjectRuntimeKey(candidate) === runtimeKey,
            )

            if (!latestObject) {
              pendingObjectKeys.delete(object.id)
              return
            }

            removeRuntimeObjectNode(object.id)
            const fallbackNode = makePrimitiveObject(THREE, mapSnapshot, latestObject)
            runtimeObjectNodes.set(object.id, fallbackNode)
            runtimeObjectKeys.set(object.id, runtimeKey)
            pendingObjectKeys.delete(object.id)
            registerRuntimeNode(fallbackNode)
            applyObjectState(objectsRef.current)
          })
      }

      function removeRuntimeTokenNode(tokenId: string) {
        const currentNode = runtimeTokenNodes.get(tokenId)

        if (!currentNode) {
          return
        }

        removeRuntimeNode(currentNode)
        runtimeTokenNodes.delete(tokenId)
        runtimeTokenKeys.delete(tokenId)
      }

      function resolvePlacementFromObjectNode(
        objectNode: Object3D,
        sourceObject: Tabletop3DObjectView,
      ) {
        const placement = resolvePlacementFromWorldPoint(
          mapSnapshot,
          { x: objectNode.position.x, z: objectNode.position.z },
          sourceObject,
        )

        return {
          ...placement,
          z: clamp(objectNode.position.y, PLACEMENT_HEIGHT_MIN, PLACEMENT_HEIGHT_MAX),
          rotationX: objectNode.rotation.x,
          rotationY: objectNode.rotation.y,
          rotationZ: objectNode.rotation.z,
          scale: clamp(
            (objectNode.scale.x + objectNode.scale.y + objectNode.scale.z) / 3,
            PLACEMENT_SCALE_MIN,
            PLACEMENT_SCALE_MAX,
          ),
          scaleX: clamp(objectNode.scale.x, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX),
          scaleY: clamp(objectNode.scale.y, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX),
          scaleZ: clamp(objectNode.scale.z, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX),
        }
      }

      function commitTransformObject() {
        const objectNode = transformControls?.object as Object3D | undefined
        const sourceObject = objectNode?.userData.sourceObject as
          | Tabletop3DObjectView
          | undefined

        if (!objectNode || !sourceObject) {
          return
        }

        onObjectPlacementChangeRef.current?.(
          sourceObject.id,
          resolvePlacementFromObjectNode(objectNode, sourceObject),
        )
      }

      function syncTransformControls() {
        if (!transformControls) {
          return
        }

        const selectedObject = objectsRef.current.find(
          (object) => object.isSelected && object.renderMode === 'three',
        )
        const selectedNode = selectedObject
          ? runtimeObjectNodes.get(selectedObject.id)
          : null

        if (!selectedObject || !selectedNode) {
          transformControls.detach()
          renderer.domElement.dataset.transformAttached = '0'
          return
        }

        if (transformControls.object !== selectedNode) {
          transformControls.attach(selectedNode)
        }

        transformControls.setMode(editorToolRef.current)
        renderer.domElement.dataset.transformAttached = selectedObject.id
      }

      function syncObjectSelectionMarker(
        objectNode: Object3D,
        sourceObject: Tabletop3DObjectView,
      ) {
        let marker: Object3D | null = null

        objectNode.traverse((child) => {
          if (!marker && child.userData.selectionMarker) {
            marker = child
          }
        })

        if (!sourceObject.isSelected) {
          if (marker !== null) {
            ;(marker as Object3D).visible = false
          }
          return
        }

        if (resolveVfxObjectKind(sourceObject)) {
          if (marker !== null) {
            ;(marker as Object3D).visible = false
          }
          return
        }

        if (!marker) {
          const footprint = resolveObjectFootprint(mapSnapshot, sourceObject)
          const markerRadius = footprint * 0.48
          const markerTube = 0.018
          const markerOpacity = 0.86
          marker = new THREE.Mesh(
            new THREE.TorusGeometry(markerRadius, markerTube, 8, 86),
            new THREE.MeshBasicMaterial({
              color: parseColor(sourceObject.color ?? '#ffefb1'),
              opacity: markerOpacity,
              transparent: true,
            }),
          )
          marker.rotation.x = Math.PI / 2
          marker.position.y = 0.03
          marker.userData.runtimeOwned = true
          marker.userData.selectionMarker = true
          marker.userData.selectionMarkerOpacity = markerOpacity
          objectNode.add(marker)
        }

        const markerMesh = marker as import('three').Mesh
        const markerMaterial = markerMesh.material as import('three').MeshBasicMaterial | undefined

        if (markerMaterial?.color) {
          markerMaterial.color.setHex(parseColor(sourceObject.color ?? '#ffefb1'))
        }

        marker.visible = true
      }

      function applyObjectState(nextObjects: Tabletop3DObjectView[]) {
        const objectById = new Map(nextObjects.map((object) => [object.id, object]))
        let synced = 0

        runtimeObjectNodes.forEach((_node, objectId) => {
          const sourceObject = objectById.get(objectId)
          const nextRuntimeKey = sourceObject ? getObjectRuntimeKey(sourceObject) : ''

          if (
            !sourceObject ||
            sourceObject.renderMode !== 'three' ||
            runtimeObjectKeys.get(objectId) !== nextRuntimeKey
          ) {
            removeRuntimeObjectNode(objectId)
          }
        })

        nextObjects.forEach((object) => {
          if (object.renderMode !== 'three') {
            pendingObjectKeys.delete(object.id)
            return
          }

          const runtimeKey = getObjectRuntimeKey(object)

          if (
            !runtimeObjectNodes.has(object.id) &&
            pendingObjectKeys.get(object.id) !== runtimeKey
          ) {
            addOrReplaceRuntimeObject(object, runtimeKey)
          }
        })

        runtimeObjectNodes.forEach((objectNode, objectId) => {
          const sourceObject = objectById.get(objectId)

          if (!sourceObject) {
            objectNode.visible = false
            return
          }

          if (transformControls?.dragging && transformControls.object === objectNode) {
            objectNode.userData.sourceObject = sourceObject
            synced += 1
            return
          }

          const position = resolveWorldPosition(mapSnapshot, sourceObject)
          objectNode.position.set(position.x, position.y, position.z)
          objectNode.rotation.set(
            sourceObject.placement3d?.rotationX ?? 0,
            sourceObject.placement3d?.rotationY ?? 0,
            sourceObject.placement3d?.rotationZ ??
              objectNode.userData.baseRotationZ ??
              0,
          )
          objectNode.scale.copy(getPlacementScaleVector(THREE, sourceObject.placement3d))
          objectNode.userData.sourceObject = sourceObject
          syncObjectSelectionMarker(objectNode, sourceObject)
          objectNode.visible = true
          synced += 1
        })

        syncTransformControls()

        renderer.domElement.dataset.objectSyncCount = String(synced)
        renderer.domElement.dataset.objectSyncFrame = String(performance.now().toFixed(0))
      }

      function applyTokenState(nextTokens: Tabletop3DTokenView[]) {
        const tokenById = new Map(nextTokens.map((token) => [token.id, token]))
        let synced = 0

        runtimeTokenNodes.forEach((_node, tokenId) => {
          const sourceToken = tokenById.get(tokenId)
          const runtimeKey = sourceToken ? getTokenRuntimeKey(sourceToken) : ''

          if (!sourceToken || runtimeTokenKeys.get(tokenId) !== runtimeKey) {
            removeRuntimeTokenNode(tokenId)
          }
        })

        nextTokens.forEach((token) => {
          if (runtimeTokenNodes.has(token.id)) {
            return
          }

          const tokenNode = makeTokenNode(THREE, mapSnapshot, token)
          runtimeTokenNodes.set(token.id, tokenNode)
          runtimeTokenKeys.set(token.id, getTokenRuntimeKey(token))
          registerRuntimeNode(tokenNode)
        })

        runtimeTokenNodes.forEach((objectNode, tokenId) => {
          const sourceToken = tokenById.get(tokenId)

          if (!sourceToken) {
            objectNode.visible = false
            return
          }

          const position = resolveWorldPosition(mapSnapshot, sourceToken)
          const tokenColor = parseColor(sourceToken.color)

          objectNode.position.set(position.x, position.y + 0.04, position.z)
          objectNode.userData.sourceToken = sourceToken
          objectNode.visible = true
          objectNode.traverse((child) => {
            const mesh = child as import('three').Mesh

            if (!mesh.isMesh || !mesh.material || Array.isArray(mesh.material)) {
              return
            }

            if (child.userData.tokenRole === 'base') {
              const material = mesh.material as import('three').MeshStandardMaterial
              material.color.setHex(tokenColor)
              material.emissive.setHex(tokenColor)
              material.emissiveIntensity = sourceToken.isSelected ? 0.42 : 0.16
            }

            if (child.userData.tokenRole === 'ring') {
              const material = mesh.material as import('three').MeshBasicMaterial
              material.color.setHex(sourceToken.isSelected ? 0xfff1b8 : tokenColor)
              material.opacity = sourceToken.isSelected ? 0.9 : 0.48
            }
          })
          synced += 1
        })

        renderer.domElement.dataset.tokenSyncCount = String(synced)
        renderer.domElement.dataset.tokenSyncFrame = String(performance.now().toFixed(0))
      }

      applyObjectStateRef.current = applyObjectState
      applyTokenStateRef.current = applyTokenState
      applyTokenState(tokensSnapshot)
      applyObjectState(objectsSnapshot)

      const handleTransformObjectChange = () => {
        renderer.domElement.dataset.lastInput = `transform:${editorToolRef.current}`
      }
      const handleTransformMouseUp = () => {
        commitTransformObject()
      }

      transformControls?.addEventListener('objectChange', handleTransformObjectChange)
      transformControls?.addEventListener('mouseUp', handleTransformMouseUp)

      function syncPointer(event: PointerEvent | WheelEvent) {
        const bounds = renderer.domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
        pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
        raycaster.setFromCamera(pointer, activeCamera)
      }

      function resolveFloorPoint(event: PointerEvent) {
        syncPointer(event)

        if (!raycaster.ray.intersectPlane(floorPlane, floorHit)) {
          return null
        }

        return floorHit.clone()
      }

      function findPickedRuntimeNode(event: PointerEvent) {
        syncPointer(event)

        const hits = raycaster.intersectObjects(runtimeObjects, true)

        return hits
          .map((hit) => {
            let current: Object3D | null = hit.object

            while (current && !current.userData.pickId) {
              current = current.parent
            }

            return current
          })
          .find((node): node is Object3D => Boolean(node?.userData.pickId))
      }

      function panCameraByScreenDelta(
        state: FreeCameraRuntimeState,
        deltaX: number,
        deltaY: number,
        scaleMultiplier = 1,
      ) {
        const panScale = state.distance * 0.0016 * scaleMultiplier
        const rightX = Math.cos(state.yaw)
        const rightY = -Math.sin(state.yaw)
        const forwardX = Math.sin(state.yaw)
        const forwardY = Math.cos(state.yaw)

        freeState.targetX = clamp(
          state.targetX + deltaX * panScale * rightX - deltaY * panScale * forwardX,
          -targetLimitX,
          targetLimitX,
        )
        freeState.targetY = clamp(
          state.targetY + deltaX * panScale * rightY - deltaY * panScale * forwardY,
          -targetLimitY,
          targetLimitY,
        )
      }

      function resolveObjectPlacementDraft(object: Tabletop3DObjectView) {
        const position = resolveWorldPosition(mapSnapshot, object)
        const placement = resolvePlacementFromWorldPoint(
          mapSnapshot,
          { x: position.x, z: position.z },
          object,
        )

        return {
          ...placement,
          z: clamp(
            object.placement3d?.z ?? 0,
            PLACEMENT_HEIGHT_MIN,
            PLACEMENT_HEIGHT_MAX,
          ),
          rotationX: object.placement3d?.rotationX ?? 0,
          rotationY: object.placement3d?.rotationY ?? 0,
          rotationZ: object.placement3d?.rotationZ ?? 0,
          scale: getPlacementScale(object.placement3d),
          scaleX: object.placement3d?.scaleX,
          scaleY: object.placement3d?.scaleY,
          scaleZ: object.placement3d?.scaleZ,
        }
      }

      function handleObjectShortcut(key: string, event: KeyboardEvent) {
        if (key === '1') {
          requestEditorTool('translate')
          event.preventDefault()
          event.stopPropagation()
          return true
        }

        if (key === '2') {
          requestEditorTool('rotate')
          event.preventDefault()
          event.stopPropagation()
          return true
        }

        if (key === '3') {
          requestEditorTool('scale')
          event.preventDefault()
          event.stopPropagation()
          return true
        }

        if (key === 'z' && (event.ctrlKey || event.metaKey)) {
          onObjectUndoRef.current?.()
          event.preventDefault()
          event.stopPropagation()
          return true
        }

        const selectedObject = objectsRef.current.find(
          (object) => object.isSelected && object.renderMode === 'three',
        )

        if (!selectedObject) {
          return false
        }

        if (key === 'delete' || key === 'backspace') {
          event.preventDefault()
          event.stopPropagation()
          onObjectRemoveRef.current?.(selectedObject.id)
          return true
        }

        if (key === 'd' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          event.stopPropagation()
          onObjectDuplicateRef.current?.(selectedObject.id)
          return true
        }

        if (key === 'enter') {
          event.preventDefault()
          event.stopPropagation()
          commitTransformObject()
          transformControls?.detach()
          renderer.domElement.dataset.transformAttached = '0'
          renderer.domElement.dataset.lastInput = 'object-confirm'
          onObjectConfirmRef.current?.()
          return true
        }

        const placement = resolveObjectPlacementDraft(selectedObject)
        const scaleStep = event.shiftKey ? 0.15 : 0.05
        const heightStep = event.shiftKey ? 0.2 : 0.05
        const rotationStep = event.shiftKey ? Math.PI / 4 : Math.PI / 12

        if (key === '[') {
          placement.rotationY -= rotationStep
        } else if (key === ']') {
          placement.rotationY += rotationStep
        } else if (key === '-' || key === '_') {
          const nextScale = clamp(
            placement.scale - scaleStep,
            PLACEMENT_SCALE_MIN,
            PLACEMENT_SCALE_MAX,
          )
          placement.scale = nextScale
          placement.scaleX = nextScale
          placement.scaleY = nextScale
          placement.scaleZ = nextScale
        } else if (key === '=' || key === '+') {
          const nextScale = clamp(
            placement.scale + scaleStep,
            PLACEMENT_SCALE_MIN,
            PLACEMENT_SCALE_MAX,
          )
          placement.scale = nextScale
          placement.scaleX = nextScale
          placement.scaleY = nextScale
          placement.scaleZ = nextScale
        } else if (key === 'pageup') {
          placement.z = clamp(
            (placement.z ?? 0) + heightStep,
            PLACEMENT_HEIGHT_MIN,
            PLACEMENT_HEIGHT_MAX,
          )
        } else if (key === 'pagedown') {
          placement.z = clamp(
            (placement.z ?? 0) - heightStep,
            PLACEMENT_HEIGHT_MIN,
            PLACEMENT_HEIGHT_MAX,
          )
        } else {
          return false
        }

        event.preventDefault()
        event.stopPropagation()
        renderer.domElement.dataset.lastInput = `object-key:${key}`
        onObjectPlacementChangeRef.current?.(selectedObject.id, placement)
        return true
      }

      function isCameraMotionKey(key: string) {
        return (
          key === 'w' ||
          key === 'a' ||
          key === 's' ||
          key === 'd' ||
          key === 'arrowup' ||
          key === 'arrowleft' ||
          key === 'arrowdown' ||
          key === 'arrowright' ||
          key === 'q' ||
          key === 'e' ||
          key === 'r' ||
          key === 'f'
        )
      }

      function applyHeldCameraKeys(deltaSeconds: number) {
        if (pressedCameraKeys.size === 0) {
          return
        }

        const moveStep = freeState.distance * (keyboardCameraBoost ? 3.0 : 1.55) * deltaSeconds
        const rotateStep = (keyboardCameraBoost ? 1.4 : 0.86) * deltaSeconds
        const pitchStep = (keyboardCameraBoost ? 0.78 : 0.5) * deltaSeconds
        const rightX = Math.cos(freeState.yaw)
        const rightY = -Math.sin(freeState.yaw)
        const forwardX = Math.sin(freeState.yaw)
        const forwardY = Math.cos(freeState.yaw)

        if (pressedCameraKeys.has('w') || pressedCameraKeys.has('arrowup')) {
          freeState.targetX -= forwardX * moveStep
          freeState.targetY -= forwardY * moveStep
        }
        if (pressedCameraKeys.has('s') || pressedCameraKeys.has('arrowdown')) {
          freeState.targetX += forwardX * moveStep
          freeState.targetY += forwardY * moveStep
        }
        if (pressedCameraKeys.has('a') || pressedCameraKeys.has('arrowleft')) {
          freeState.targetX -= rightX * moveStep
          freeState.targetY -= rightY * moveStep
        }
        if (pressedCameraKeys.has('d') || pressedCameraKeys.has('arrowright')) {
          freeState.targetX += rightX * moveStep
          freeState.targetY += rightY * moveStep
        }
        if (pressedCameraKeys.has('q')) {
          freeState.yaw += rotateStep
        }
        if (pressedCameraKeys.has('e')) {
          freeState.yaw -= rotateStep
        }
        if (pressedCameraKeys.has('r')) {
          freeState.pitch = clamp(freeState.pitch + pitchStep, 0.12, 1.52)
        }
        if (pressedCameraKeys.has('f')) {
          freeState.pitch = clamp(freeState.pitch - pitchStep, 0.12, 1.52)
        }

        clampFreeCameraTarget()
        ignoreExternalCameraUntil = performance.now() + 1200
        applyFreeCameraState(THREE, perspectiveCamera, freeState)
        writeCameraDebugState()
        streamCameraState()
        scheduleCameraStateCommit(360)
      }

      function applyExternalCameraSmoothing(deltaSeconds: number) {
        if (!externalCameraTarget || editorEnabled || cameraMode !== 'free') {
          return
        }

        const smoothing = 1 - Math.exp(-deltaSeconds * REMOTE_CAMERA_SMOOTHING_SPEED)
        const target = externalCameraTarget
        const values: Array<keyof FreeCameraRuntimeState> = [
          'distance',
          'pitch',
          'targetX',
          'targetY',
          'targetZ',
        ]
        let largestDelta = 0

        values.forEach((key) => {
          const delta = target[key] - freeState[key]
          largestDelta = Math.max(largestDelta, Math.abs(delta))
          freeState[key] += delta * smoothing
        })
        const yawDelta = Math.atan2(
          Math.sin(target.yaw - freeState.yaw),
          Math.cos(target.yaw - freeState.yaw),
        )
        largestDelta = Math.max(largestDelta, Math.abs(yawDelta))
        freeState.yaw += yawDelta * smoothing

        if (largestDelta < 0.001) {
          Object.assign(freeState, target)
          externalCameraTarget = null
          renderer.domElement.dataset.externalCameraSmoothing = '0'
        }

        clampFreeCameraTarget()
        applyFreeCameraState(THREE, perspectiveCamera, freeState)
        writeCameraDebugState()
      }

      function scaleSelectedObjectFromWheel(event: WheelEvent) {
        const selectedObject = objectsRef.current.find(
          (object) => object.isSelected && object.renderMode === 'three',
        )

        if (!selectedObject) {
          return false
        }

        const selectedNode = runtimeObjectNodes.get(selectedObject.id)
        const basePlacement =
          selectedNode !== undefined
            ? resolvePlacementFromObjectNode(selectedNode, selectedObject)
            : resolveObjectPlacementDraft(selectedObject)
        const normalizedDelta = clamp(event.deltaY, -500, 500)
        const factor = Math.exp(-normalizedDelta * 0.0012)
        const currentScale = clamp(
          ((basePlacement.scaleX ?? basePlacement.scale ?? 1) +
            (basePlacement.scaleY ?? basePlacement.scale ?? 1) +
            (basePlacement.scaleZ ?? basePlacement.scale ?? 1)) /
            3,
          PLACEMENT_SCALE_MIN,
          PLACEMENT_SCALE_MAX,
        )
        const nextScale = clamp(
          currentScale * factor,
          PLACEMENT_SCALE_MIN,
          PLACEMENT_SCALE_MAX,
        )
        const nextPlacement = {
          ...basePlacement,
          scale: nextScale,
          scaleX: nextScale,
          scaleY: nextScale,
          scaleZ: nextScale,
        }

        if (selectedNode) {
          selectedNode.scale.set(nextScale, nextScale, nextScale)
        }
        renderer.domElement.dataset.lastInput = 'ctrl-wheel-scale'
        onObjectPlacementChangeRef.current?.(selectedObject.id, nextPlacement)
        return true
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (event.defaultPrevented) {
          return
        }

        renderer.domElement.dataset.lastKeySeen = event.key

        if (!editorEnabled || cameraMode !== 'free') {
          return
        }

        const target = event.target
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLTextAreaElement ||
          (target instanceof HTMLElement && target.isContentEditable)
        ) {
          return
        }

        const key = event.key.toLowerCase()

        if (handleObjectShortcut(key, event)) {
          return
        }

        if (isCameraMotionKey(key)) {
          pressedCameraKeys.add(key)
          keyboardCameraBoost = event.shiftKey
          event.preventDefault()
          event.stopPropagation()
          renderer.domElement.dataset.lastInput = `key:${key}`
        }
      }

      function handleKeyUp(event: KeyboardEvent) {
        const key = event.key.toLowerCase()

        if (isCameraMotionKey(key)) {
          pressedCameraKeys.delete(key)
          keyboardCameraBoost = event.shiftKey
        }
      }

      function render() {
        const now = performance.now()
        const elapsed = now / 1000
        const deltaSeconds = Math.min(0.05, Math.max(0.001, (now - lastRenderTime) / 1000))
        lastRenderTime = now
        renderFrameCount += 1
        if (renderFrameCount % 12 === 0) {
          renderer.domElement.dataset.renderFrame = String(renderFrameCount)
        }
        applyExternalCameraSmoothing(deltaSeconds)
        applyHeldCameraKeys(deltaSeconds)
        syncBoardImpact()
        runtimeObjects.forEach((objectNode) => {
          if (objectNode.userData.sway) {
            objectNode.rotation.z =
              Math.sin(elapsed * 0.9 + objectNode.userData.sway) * 0.018
          }
          const mixer = objectNode.userData.animationMixer as
            | import('three').AnimationMixer
            | undefined

          mixer?.update(deltaSeconds)
          updateVfxRuntimeObject(objectNode, elapsed)
        })
        if (impactNode) {
          updateBoardImpact(impactNode, performance.now())
          if (!impactNode.visible) {
            scene.remove(impactNode)
            disposeRuntimeScene(impactNode)
            impactNode = null
            renderer.domElement.dataset.impactActive = '0'
          }
        }
        if (ambientNode) {
          updateAmbient3D(ambientNode, elapsed)
        }
        if (waterSurfaceNode) {
          updateOpenWaterSurface3D(waterSurfaceNode, elapsed)
        }
        renderer.render(scene, activeCamera)
        animationFrame = window.requestAnimationFrame(render)
      }

      function handlePointerDown(event: PointerEvent) {
        if (!editorEnabled || cameraMode !== 'free') {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        renderer.domElement.focus()
        renderer.domElement.setPointerCapture(event.pointerId)

        if (transformControls?.dragging || transformControls?.axis) {
          dragState = null
          return
        }

        const picked = findPickedRuntimeNode(event)
        const pickedObject =
          event.button === 0 && picked?.userData.pickType === 'object'
            ? picked
            : null

        if (
          event.button === 0 &&
          objectPlacementActiveRef.current &&
          !pickedObject
        ) {
          const floorPoint = resolveFloorPoint(event)

          if (floorPoint) {
            const placement3d = {
              x: clamp(floorPoint.x / metrics.floorWidth + 0.5, 0, 1),
              y: clamp(floorPoint.z / metrics.floorHeight + 0.5, 0, 1),
              z: 0,
              rotationX: 0,
              rotationY: 0,
              rotationZ: 0,
              scale: 1,
            }

            onObjectCreateAtPlacementRef.current?.({
              cell: resolveCellFromPlacement(mapSnapshot, placement3d),
              placement3d,
            })
            renderer.domElement.dataset.lastInput = 'place-object-3d'
          }

          dragState = null
          return
        }

        if (pickedObject) {
          onObjectSelectRef.current?.(pickedObject.userData.pickId)
        }

        dragState = {
          button: event.button,
          mode: pickedObject ? 'move-object' : event.button === 2 ? 'orbit' : 'pan',
          movedObjectId: pickedObject?.userData.pickId,
          movedObjectNode: pickedObject ?? undefined,
          movedPlacement: pickedObject
            ? (pickedObject.userData.sourceObject as Tabletop3DObjectView | undefined)?.placement3d
            : undefined,
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startState: { ...freeState },
        }
      }

      function handlePointerMove(event: PointerEvent) {
        if (!dragState || dragState.pointerId !== event.pointerId) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        const deltaX = event.clientX - dragState.startClientX
        const deltaY = event.clientY - dragState.startClientY

        if (dragState.mode === 'move-object' && dragState.movedObjectNode) {
          const floorPoint = resolveFloorPoint(event)
          const sourceObject = dragState.movedObjectNode.userData.sourceObject as
            | Tabletop3DObjectView
            | undefined

          if (floorPoint && sourceObject) {
            const nextPlacement = resolvePlacementFromWorldPoint(mapSnapshot, floorPoint, sourceObject)
            dragState.movedPlacement = nextPlacement
            dragState.movedObjectNode.position.x = floorPoint.x
            dragState.movedObjectNode.position.z = floorPoint.z
          }
          return
        }

        if (dragState.mode === 'orbit') {
          freeState.yaw = dragState.startState.yaw - deltaX * 0.005
          freeState.pitch = clamp(dragState.startState.pitch + deltaY * 0.0035, 0.12, 1.52)
        } else {
          panCameraByScreenDelta(dragState.startState, deltaX, deltaY)
        }

        ignoreExternalCameraUntil = performance.now() + 1200
        applyFreeCameraState(THREE, perspectiveCamera, freeState)
        writeCameraDebugState()
        streamCameraState()
      }

      function handlePointerUp(event: PointerEvent) {
        if (!dragState || dragState.pointerId !== event.pointerId) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        const traveled = Math.hypot(
          event.clientX - dragState.startClientX,
          event.clientY - dragState.startClientY,
        )
        const wasClick = traveled < 6
        const completedDrag = dragState
        dragState = null

        if (
          completedDrag.mode === 'move-object' &&
          completedDrag.movedObjectId &&
          completedDrag.movedPlacement
        ) {
          onObjectPlacementChangeRef.current?.(
            completedDrag.movedObjectId,
            completedDrag.movedPlacement,
          )
          return
        }

        if (!wasClick) {
          commitCameraState()
          return
        }

        const picked = findPickedRuntimeNode(event)

        if (picked?.userData.pickType === 'object') {
          onObjectSelectRef.current?.(picked.userData.pickId)
        } else if (picked?.userData.pickType === 'token') {
          onTokenSelectRef.current?.(picked.userData.pickId)
        }
      }

      function handleWheel(event: WheelEvent) {
        if (!editorEnabled || cameraMode !== 'free') {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        renderer.domElement.dataset.lastInput = 'wheel'
        if ((event.ctrlKey || event.metaKey) && scaleSelectedObjectFromWheel(event)) {
          return
        }
        const normalizedDelta = clamp(event.deltaY, -500, 500)
        freeState.distance = clamp(
          freeState.distance * Math.exp(normalizedDelta * FREE_CAMERA_WHEEL_FACTOR),
          FREE_CAMERA_DISTANCE_MIN,
          FREE_CAMERA_DISTANCE_MAX,
        )
        applyFreeCameraAndScheduleCommit(420)
      }

      function handleResize() {
        const nextWidth = mountHost.clientWidth || mapSnapshot.stageWidth
        const nextHeight = mountHost.clientHeight || mapSnapshot.stageHeight

        renderer.setSize(nextWidth, nextHeight)
        perspectiveCamera.aspect = nextWidth / Math.max(1, nextHeight)
        perspectiveCamera.updateProjectionMatrix()
        orthographicCamera.left = -metrics.floorWidth / 2
        orthographicCamera.right = metrics.floorWidth / 2
        orthographicCamera.top = metrics.floorHeight / 2
        orthographicCamera.bottom = -metrics.floorHeight / 2
        orthographicCamera.updateProjectionMatrix()
      }

      const resizeObserver = new ResizeObserver(handleResize)
      function handleContextMenu(event: MouseEvent) {
        if (!editorEnabled || cameraMode !== 'free') {
          return
        }

        event.preventDefault()
        event.stopPropagation()
      }

      function handleWindowBlur() {
        pressedCameraKeys.clear()
      }

      renderer.domElement.style.touchAction = 'none'
      resizeObserver.observe(mountHost)
      renderer.domElement.addEventListener('pointerdown', handlePointerDown)
      renderer.domElement.addEventListener('pointermove', handlePointerMove)
      renderer.domElement.addEventListener('pointerup', handlePointerUp)
      renderer.domElement.addEventListener('pointercancel', handlePointerUp)
      renderer.domElement.addEventListener('wheel', handleWheel, { passive: false })
      renderer.domElement.addEventListener('contextmenu', handleContextMenu)
      window.addEventListener('keydown', handleKeyDown, true)
      document.addEventListener('keydown', handleKeyDown, true)
      renderer.domElement.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp, true)
      document.addEventListener('keyup', handleKeyUp, true)
      renderer.domElement.addEventListener('keyup', handleKeyUp)
      window.addEventListener('blur', handleWindowBlur)
      animationFrame = window.requestAnimationFrame(render)

      return () => {
        resizeObserver.disconnect()
        if (cameraCommitTimeout) {
          window.clearTimeout(cameraCommitTimeout)
        }
        if (applyCameraStateRef.current) {
          applyCameraStateRef.current = null
        }
        if (applyObjectStateRef.current) {
          applyObjectStateRef.current = null
        }
        if (applyTokenStateRef.current) {
          applyTokenStateRef.current = null
        }
        if (applyEditorToolRef.current) {
          applyEditorToolRef.current = null
        }
        transformControls?.removeEventListener('objectChange', handleTransformObjectChange)
        transformControls?.removeEventListener('mouseUp', handleTransformMouseUp)
        transformControls?.detach()
        transformControls?.dispose()
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
        renderer.domElement.removeEventListener('pointermove', handlePointerMove)
        renderer.domElement.removeEventListener('pointerup', handlePointerUp)
        renderer.domElement.removeEventListener('pointercancel', handlePointerUp)
        renderer.domElement.removeEventListener('wheel', handleWheel)
        renderer.domElement.removeEventListener('contextmenu', handleContextMenu)
        window.removeEventListener('keydown', handleKeyDown, true)
        document.removeEventListener('keydown', handleKeyDown, true)
        renderer.domElement.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp, true)
        document.removeEventListener('keyup', handleKeyUp, true)
        renderer.domElement.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('blur', handleWindowBlur)
        window.cancelAnimationFrame(animationFrame)
        disposeRuntimeScene(scene)
        renderer.dispose()
        mountHost.replaceChildren()
      }
    }

    let cleanup: (() => void) | undefined
    mount().then((nextCleanup) => {
      if (disposed) {
        nextCleanup?.()
        return
      }

      cleanup = nextCleanup
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [
    editorEnabled,
    freeCameraVisible,
    isGridVisible,
    mapSignature,
    quality,
  ])

  return (
    <div
      aria-hidden={!editorEnabled}
      className={`tabletop-3d-stage${
        freeCameraVisible ? ' tabletop-3d-stage--free' : ''
      }${editorEnabled ? ' tabletop-3d-stage--editor' : ''}${
        objectPlacementActive ? ' tabletop-3d-stage--placing' : ''
      }`}
    >
      <div className="tabletop-3d-stage__host" ref={hostRef} />
    </div>
  )
}
