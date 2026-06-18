import { useEffect, useMemo, useRef } from 'react'
import type {
  TabletopBoardObject,
  TabletopMap,
  TabletopTokenSize,
} from '../../data/types'
import type { VisualQualityMode } from '../../lib/productPreferences'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import { resolveTabletopTokenSpan } from '../../lib/tabletop'

interface TabletopObjectVfxLayerProps {
  map: TabletopMap
  objects?: TabletopObjectVfxView[]
  quality: VisualQualityMode
}

interface TabletopObjectVfxView {
  id: string
  name: string
  label: string
  linkedItemId?: string
  color?: string
  cell: TabletopBoardObject['cell']
  size: TabletopTokenSize
  customSize?: TabletopBoardObject['customSize']
  placement3d?: TabletopBoardObject['placement3d']
}

type PixiModule = typeof import('pixi.js')
type ObjectVfxKind =
  | 'fire'
  | 'fog'
  | 'lava'
  | 'leaves'
  | 'lightning'
  | 'rain'
  | 'water'
  | 'wind'

type ParticleMotion = 'fall' | 'orbit' | 'pulse' | 'rise' | 'sweep'

interface RuntimeParticle {
  alpha: number
  angle: number
  distance: number
  motion: ParticleMotion
  originX: number
  originY: number
  phase: number
  scale: number
  speed: number
  sprite: import('pixi.js').Sprite
  spread: number
}

interface RuntimeEffect {
  group: import('pixi.js').Container
  kind: ObjectVfxKind
  particles: RuntimeParticle[]
  phase: number
  radius: number
}

interface VfxTextureProfile {
  additive?: boolean
  alpha: [number, number]
  count: {
    balanced: number
    ultra: number
  }
  distance?: [number, number]
  groupAlpha?: number
  maxSize?: number
  minSize?: number
  motion: ParticleMotion[]
  scale: [number, number]
  textures: string[]
  tint: number
  verticalFactor?: number
}

const KENNEY_PARTICLE_PATH = '/assets/fx/kenney/particles'
const KENNEY_SMOKE_PATH = '/assets/fx/kenney/smoke'

const VFX_TEXTURE_PROFILES: Record<ObjectVfxKind, VfxTextureProfile> = {
  fire: {
    additive: true,
    alpha: [0.34, 0.88],
    count: { balanced: 42, ultra: 72 },
    distance: [0.02, 0.64],
    maxSize: 190,
    minSize: 24,
    motion: ['rise', 'pulse'],
    scale: [0.2, 0.62],
    textures: [
      `${KENNEY_PARTICLE_PATH}/fire_01.png`,
      `${KENNEY_PARTICLE_PATH}/fire_02.png`,
      `${KENNEY_PARTICLE_PATH}/flame_01.png`,
      `${KENNEY_PARTICLE_PATH}/spark_03.png`,
      `${KENNEY_PARTICLE_PATH}/flame_03.png`,
      `${KENNEY_PARTICLE_PATH}/flame_04.png`,
      `${KENNEY_PARTICLE_PATH}/flame_05.png`,
      `${KENNEY_PARTICLE_PATH}/light_01.png`,
      `${KENNEY_SMOKE_PATH}/blackSmoke08.png`,
    ],
    tint: 0xffb15c,
  },
  fog: {
    alpha: [0.08, 0.24],
    count: { balanced: 20, ultra: 36 },
    distance: [0.08, 0.92],
    groupAlpha: 0.82,
    maxSize: 280,
    minSize: 72,
    motion: ['orbit', 'sweep', 'pulse'],
    scale: [0.3, 0.82],
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff12.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff18.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff24.png`,
      `${KENNEY_PARTICLE_PATH}/smoke_07.png`,
      `${KENNEY_PARTICLE_PATH}/smoke_05.png`,
      `${KENNEY_PARTICLE_PATH}/smoke_10.png`,
    ],
    tint: 0xd8f6ff,
    verticalFactor: 0.34,
  },
  lava: {
    additive: true,
    alpha: [0.34, 0.88],
    count: { balanced: 38, ultra: 66 },
    distance: [0.04, 0.76],
    maxSize: 210,
    minSize: 24,
    motion: ['rise', 'pulse', 'orbit'],
    scale: [0.16, 0.68],
    textures: [
      `${KENNEY_PARTICLE_PATH}/fire_02.png`,
      `${KENNEY_PARTICLE_PATH}/flame_02.png`,
      `${KENNEY_PARTICLE_PATH}/flame_04.png`,
      `${KENNEY_PARTICLE_PATH}/flame_06.png`,
      `${KENNEY_PARTICLE_PATH}/spark_01.png`,
      `${KENNEY_PARTICLE_PATH}/spark_06.png`,
      `${KENNEY_SMOKE_PATH}/blackSmoke16.png`,
      `${KENNEY_SMOKE_PATH}/blackSmoke24.png`,
    ],
    tint: 0xff4a1f,
  },
  leaves: {
    alpha: [0.24, 0.58],
    count: { balanced: 28, ultra: 52 },
    distance: [0.16, 1.0],
    maxSize: 42,
    minSize: 10,
    motion: ['orbit', 'sweep'],
    scale: [0.06, 0.2],
    textures: [
      `${KENNEY_PARTICLE_PATH}/dirt_01.png`,
      `${KENNEY_PARTICLE_PATH}/dirt_03.png`,
      `${KENNEY_PARTICLE_PATH}/magic_01.png`,
      `${KENNEY_PARTICLE_PATH}/magic_03.png`,
    ],
    tint: 0xb4ff75,
  },
  lightning: {
    additive: true,
    alpha: [0.22, 0.92],
    count: { balanced: 22, ultra: 42 },
    distance: [0.04, 0.72],
    maxSize: 240,
    minSize: 24,
    motion: ['pulse', 'fall'],
    scale: [0.18, 0.7],
    textures: [
      `${KENNEY_SMOKE_PATH}/flash00.png`,
      `${KENNEY_SMOKE_PATH}/flash04.png`,
      `${KENNEY_PARTICLE_PATH}/flare_01.png`,
      `${KENNEY_PARTICLE_PATH}/spark_05.png`,
      `${KENNEY_PARTICLE_PATH}/trace_01.png`,
      `${KENNEY_PARTICLE_PATH}/trace_03.png`,
      `${KENNEY_PARTICLE_PATH}/trace_07.png`,
    ],
    tint: 0xffe9f0,
  },
  rain: {
    additive: true,
    alpha: [0.12, 0.42],
    count: { balanced: 90, ultra: 150 },
    distance: [0.0, 1.0],
    groupAlpha: 0.72,
    maxSize: 58,
    minSize: 12,
    motion: ['fall'],
    scale: [0.04, 0.13],
    textures: [
      `${KENNEY_PARTICLE_PATH}/spark_05.png`,
      `${KENNEY_PARTICLE_PATH}/trace_02.png`,
      `${KENNEY_PARTICLE_PATH}/trace_05.png`,
      `${KENNEY_PARTICLE_PATH}/trace_06.png`,
      `${KENNEY_PARTICLE_PATH}/trace_07.png`,
    ],
    tint: 0xcff8ff,
    verticalFactor: 1,
  },
  water: {
    additive: true,
    alpha: [0.14, 0.44],
    count: { balanced: 36, ultra: 64 },
    distance: [0.08, 0.88],
    maxSize: 120,
    minSize: 18,
    motion: ['orbit', 'pulse', 'rise'],
    scale: [0.14, 0.46],
    textures: [
      `${KENNEY_PARTICLE_PATH}/circle_01.png`,
      `${KENNEY_PARTICLE_PATH}/circle_02.png`,
      `${KENNEY_PARTICLE_PATH}/circle_03.png`,
      `${KENNEY_PARTICLE_PATH}/light_02.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff00.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff06.png`,
    ],
    tint: 0xcffbff,
  },
  wind: {
    additive: true,
    alpha: [0.12, 0.34],
    count: { balanced: 26, ultra: 54 },
    distance: [0.12, 1.08],
    maxSize: 170,
    minSize: 42,
    motion: ['sweep', 'orbit'],
    scale: [0.2, 0.72],
    textures: [
      `${KENNEY_PARTICLE_PATH}/twirl_01.png`,
      `${KENNEY_PARTICLE_PATH}/twirl_02.png`,
      `${KENNEY_PARTICLE_PATH}/twirl_03.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff06.png`,
      `${KENNEY_PARTICLE_PATH}/spark_05.png`,
    ],
    tint: 0xe8fbff,
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

function randomRange(random: () => number, min: number, max: number) {
  return min + random() * (max - min)
}

function resolveObjectVfxKind(object: TabletopObjectVfxView): ObjectVfxKind | null {
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

function resolveObjectVfxBounds(map: TabletopMap, object: TabletopObjectVfxView) {
  const span = resolveTabletopTokenSpan(object)
  const cellWidth = map.stageWidth / Math.max(1, map.gridColumns)
  const cellHeight = map.stageHeight / Math.max(1, map.gridRows)
  const fallbackScale = object.placement3d?.scale ?? 1
  const scale = clamp(
    Math.max(
      object.placement3d?.scaleX ?? fallbackScale,
      object.placement3d?.scaleY ?? fallbackScale,
    ),
    0.1,
    8,
  )
  const centerX =
    typeof object.placement3d?.x === 'number'
      ? object.placement3d.x * map.stageWidth
      : (object.cell.column + span.columns / 2) * cellWidth
  const centerY =
    typeof object.placement3d?.y === 'number'
      ? object.placement3d.y * map.stageHeight
      : (object.cell.row + span.rows / 2) * cellHeight
  const radius = Math.max(42, Math.max(cellWidth * span.columns, cellHeight * span.rows) * 0.55 * scale)

  return { centerX, centerY, radius }
}

function createVfxSprite(input: {
  PIXI: PixiModule
  group: import('pixi.js').Container
  kind: ObjectVfxKind
  profile: VfxTextureProfile
  radius: number
  random: () => number
  texture: import('pixi.js').Texture
}) {
  const { PIXI, group, kind, profile, radius, random, texture } = input
  const sprite = new PIXI.Sprite(texture)
  const motion = profile.motion[Math.floor(random() * profile.motion.length)] ?? 'pulse'
  const rawScale = randomRange(random, profile.scale[0], profile.scale[1]) * radius
  const scale = clamp(
    rawScale,
    profile.minSize ?? 8,
    profile.maxSize ?? Math.max(28, radius * 0.92),
  )
  const alpha = randomRange(random, profile.alpha[0], profile.alpha[1])
  const angle = random() * Math.PI * 2
  const [distanceMin, distanceMax] = profile.distance ?? [
    0.08,
    kind === 'fog' || kind === 'wind' ? 1.08 : 0.72,
  ]
  const distance = radius * randomRange(random, distanceMin, distanceMax)
  const originX =
    kind === 'rain'
      ? randomRange(random, -radius * 1.02, radius * 1.02)
      : Math.cos(angle) * distance
  const originY =
    kind === 'rain'
      ? randomRange(random, -radius * 0.82, radius * 0.82)
      : Math.sin(angle) * distance * (profile.verticalFactor ?? 0.58)

  sprite.anchor.set(0.5)
  sprite.tint = profile.tint
  sprite.alpha = alpha
  sprite.blendMode = profile.additive ? 'add' : 'normal'
  sprite.rotation = kind === 'rain' ? -0.42 + random() * 0.16 : random() * Math.PI * 2
  sprite.scale.set(scale / Math.max(1, texture.width), scale / Math.max(1, texture.height))
  group.addChild(sprite)

  return {
    alpha,
    angle,
    distance,
    motion,
    originX,
    originY,
    phase: random() * Math.PI * 2,
    scale,
    speed: randomRange(
      random,
      kind === 'rain' ? 1.1 : 0.34,
      kind === 'lightning' ? 2.4 : kind === 'rain' ? 2.35 : 1.25,
    ),
    sprite,
    spread: radius * randomRange(random, 1.6, kind === 'wind' ? 3.2 : 2.3),
  } satisfies RuntimeParticle
}

function updateParticle(particle: RuntimeParticle, elapsed: number, effect: RuntimeEffect) {
  const { radius } = effect
  const progress = (elapsed * particle.speed + particle.phase) % 1
  const wave = Math.sin(elapsed * (1.8 + particle.speed) + particle.phase)
  const shimmer = Math.max(0, Math.sin(elapsed * 6.5 + particle.phase))

  if (particle.motion === 'rise') {
    particle.sprite.x = particle.originX + Math.sin(elapsed * 2 + particle.phase) * radius * 0.12
    particle.sprite.y = particle.originY - progress * radius * 1.55
    particle.sprite.alpha = particle.alpha * Math.max(0, 1 - progress) * (0.72 + shimmer * 0.32)
  } else if (particle.motion === 'fall') {
    if (effect.kind === 'rain') {
      particle.sprite.x = particle.originX + progress * radius * 0.18
      particle.sprite.y = particle.originY - radius * 0.88 + progress * radius * 1.76
      particle.sprite.alpha =
        particle.alpha *
        Math.min(1, progress * 10) *
        Math.min(1, (1 - progress) * 7) *
        (0.82 + shimmer * 0.16)
    } else {
      particle.sprite.x = particle.originX - radius * 0.34 + progress * radius * 0.62
      particle.sprite.y = -radius * 1.12 + progress * radius * 2.24 + particle.originY
      particle.sprite.alpha =
        particle.alpha *
        Math.min(1, progress * 7) *
        Math.min(1, (1 - progress) * 4) *
        (effect.kind === 'lightning' ? (shimmer > 0.42 ? 1.9 : 0.35) : 1)
    }
  } else if (particle.motion === 'sweep') {
    particle.sprite.x = -particle.spread / 2 + progress * particle.spread
    particle.sprite.y = particle.originY + Math.sin(elapsed * 3.2 + particle.phase) * radius * 0.28
    particle.sprite.alpha = particle.alpha * (0.62 + wave * 0.18)
  } else if (particle.motion === 'orbit') {
    const orbit = elapsed * particle.speed + particle.phase
    particle.sprite.x = Math.cos(orbit) * particle.distance + particle.originX * 0.18
    particle.sprite.y = Math.sin(orbit * 0.74) * particle.distance * 0.5 + particle.originY * 0.18
    particle.sprite.alpha = particle.alpha * (0.72 + Math.sin(orbit * 2.1) * 0.24)
  } else {
    particle.sprite.x = particle.originX + Math.sin(elapsed * 1.6 + particle.phase) * radius * 0.08
    particle.sprite.y = particle.originY + Math.cos(elapsed * 1.4 + particle.phase) * radius * 0.08
    particle.sprite.alpha =
      effect.kind === 'lightning'
        ? particle.alpha * (shimmer > 0.5 ? 1.4 : 0.12)
        : particle.alpha * (0.55 + shimmer * 0.38)
  }

  const scalePulse =
    effect.kind === 'rain' ? particle.scale : particle.scale * (0.9 + wave * 0.1)
  particle.sprite.scale.set(
    scalePulse / Math.max(1, particle.sprite.texture.width),
    scalePulse / Math.max(1, particle.sprite.texture.height),
  )
  particle.sprite.rotation += 0.008 * particle.speed
}

function getVfxObjectSignature(objects: TabletopObjectVfxView[]) {
  return objects
    .map((object) =>
      [
        object.id,
        object.linkedItemId,
        object.name,
        object.color,
        object.cell.column,
        object.cell.row,
        object.size,
        object.customSize?.columns,
        object.customSize?.rows,
        object.placement3d?.x,
        object.placement3d?.y,
        object.placement3d?.scale,
        object.placement3d?.scaleX,
        object.placement3d?.scaleY,
      ].join(':'),
    )
    .join('|')
}

export function TabletopObjectVfxLayer({
  map,
  objects,
  quality,
}: TabletopObjectVfxLayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const vfxObjects = useMemo(
    () =>
      (objects ?? [])
        .map((object) => ({
          kind: resolveObjectVfxKind(object),
          object,
        }))
        .filter(
          (entry): entry is { kind: ObjectVfxKind; object: TabletopObjectVfxView } =>
            entry.kind !== null,
        ),
    [objects],
  )
  const objectSignature = useMemo(
    () => getVfxObjectSignature(vfxObjects.map((entry) => entry.object)),
    [vfxObjects],
  )
  const kindSignature = useMemo(
    () => [...new Set(vfxObjects.map((entry) => entry.kind))].join(','),
    [vfxObjects],
  )

  useEffect(() => {
    const host = hostRef.current

    if (!host || quality === 'low' || vfxObjects.length === 0) {
      host?.replaceChildren()
      return
    }

    const hostElement = host
    let disposed = false
    let app: import('pixi.js').Application | null = null

    function destroyApplication(target: import('pixi.js').Application) {
      target.destroy(
        { removeView: true },
        {
          children: true,
          texture: false,
          textureSource: false,
        },
      )
    }

    async function mountLayer() {
      const PIXI = await import('pixi.js')
      const { Application, Assets, Container } = PIXI
      const nextApp = new Application()

      await nextApp.init({
        antialias: false,
        backgroundAlpha: 0,
        height: map.stageHeight,
        preference: 'webgl',
        resolution: 1,
        width: map.stageWidth,
      })

      if (disposed) {
        destroyApplication(nextApp)
        return
      }

      app = nextApp
      nextApp.canvas.className = 'tabletop-object-vfx-layer__canvas'
      nextApp.canvas.setAttribute('aria-hidden', 'true')
      hostElement.replaceChildren(nextApp.canvas)

      const texturePaths = [
        ...new Set(
          vfxObjects.flatMap((entry) => VFX_TEXTURE_PROFILES[entry.kind].textures),
        ),
      ]
      const loadedTextures = new Map<string, import('pixi.js').Texture>()

      await Promise.all(
        texturePaths.map(async (texturePath) => {
          const texture = await Assets.load<import('pixi.js').Texture>(
            resolveRuntimeAssetUrl(texturePath),
          )
          loadedTextures.set(texturePath, texture)
        }),
      )

      if (disposed) {
        destroyApplication(nextApp)
        return
      }

      const effects: RuntimeEffect[] = []
      const root = new Container()
      nextApp.stage.addChild(root)

      vfxObjects.forEach(({ kind, object }) => {
        const profile = VFX_TEXTURE_PROFILES[kind]
        const { centerX, centerY, radius } = resolveObjectVfxBounds(map, object)
        const random = createSeededRandom(hashText(`${object.id}:${object.linkedItemId}:${kind}`))
        const group = new Container()
        const particleCount = Math.round(
          (quality === 'ultra' ? profile.count.ultra : profile.count.balanced) *
            clamp(radius / 86, 0.72, 1.65),
        )
        const effect: RuntimeEffect = {
          group,
          kind,
          particles: [],
          phase: random() * Math.PI * 2,
          radius,
        }

        group.position.set(centerX, centerY)
        group.alpha = profile.groupAlpha ?? 1
        root.addChild(group)

        for (let index = 0; index < particleCount; index += 1) {
          const texturePath = profile.textures[index % profile.textures.length]
          const texture = loadedTextures.get(texturePath)

          if (!texture) {
            continue
          }

          effect.particles.push(
            createVfxSprite({
              PIXI,
              group,
              kind,
              profile,
              radius,
              random,
              texture,
            }),
          )
        }

        effects.push(effect)
      })

      let elapsed = 0

      nextApp.ticker.add((ticker) => {
        elapsed += Math.min(0.05, ticker.deltaMS * 0.001)

        effects.forEach((effect) => {
          const pulse = 1 + Math.sin(elapsed * 1.25 + effect.phase) * 0.025
          effect.group.scale.set(pulse)
          effect.particles.forEach((particle) => updateParticle(particle, elapsed, effect))
        })
      })
    }

    void mountLayer()

    return () => {
      disposed = true
      if (app) {
        destroyApplication(app)
      }
      hostElement.replaceChildren()
    }
  }, [
    kindSignature,
    map,
    map.gridColumns,
    map.gridRows,
    map.stageHeight,
    map.stageWidth,
    objectSignature,
    quality,
    vfxObjects,
  ])

  if (quality === 'low' || vfxObjects.length === 0) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="tabletop-object-vfx-layer"
      data-vfx-kinds={kindSignature}
      data-vfx-object-count={vfxObjects.length}
      ref={hostRef}
    />
  )
}
