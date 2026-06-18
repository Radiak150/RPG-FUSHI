import { useEffect, useMemo, useRef } from 'react'
import type { VisualQualityMode } from '../../lib/productPreferences'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import type { TabletopWeatherRuntime } from '../../lib/tabletopRuntime'
import type { BiomeVisualId } from '../biomeVisualPresets'
import { resolveBiomeVisualPreset } from '../biomeVisualPresets'

interface TabletopFxStageProps {
  biomeId?: string
  height: number
  quality: VisualQualityMode
  weather?: TabletopWeatherRuntime | null
  width: number
}

function getQualityScale(quality: VisualQualityMode) {
  if (quality === 'low') {
    return 0
  }

  return quality === 'ultra' ? 1 : 0.55
}

function resolveWeatherFxVariant(
  weather?: TabletopWeatherRuntime | null,
): 'rain' | 'snow' | null {
  if (weather?.variant === 'rain' || weather?.variant === 'snow') {
    return weather.variant
  }

  return null
}

interface AmbientSpriteProfile {
  alpha: [number, number]
  count: {
    balanced: number
    ultra: number
  }
  drift: {
    x: number
    y: number
  }
  size: [number, number]
  spin: number
  textures: string[]
  tint?: number
}

interface RuntimeParticle {
  alphaBase: number
  alphaPhase: number
  alphaWave: number
  rotationSpeed: number
  scalePulse: number
  size: number
  sprite: import('pixi.js').Sprite
  velocityX: number
  velocityY: number
  x: number
  y: number
}

interface WeatherParticle {
  alphaEnd: number
  alphaStart: number
  age: number
  driftPhase: number
  lifetime: number
  particle: import('pixi.js').Particle
  rotationBase: number
  rotationSpeed: number
  scaleEndX: number
  scaleEndY: number
  scaleStartX: number
  scaleStartY: number
  velocityX: number
  velocityY: number
}

const KENNEY_PARTICLE_PATH = '/assets/fx/kenney/particles'
const KENNEY_SMOKE_PATH = '/assets/fx/kenney/smoke'

const AMBIENT_SPRITE_PROFILES: Record<BiomeVisualId, AmbientSpriteProfile | null> = {
  neutral: null,
  planicie_floresta_inicial: {
    alpha: [0.035, 0.095],
    count: { balanced: 7, ultra: 16 },
    drift: { x: 0.13, y: -0.05 },
    size: [28, 82],
    spin: 0.0012,
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff06.png`,
      `${KENNEY_PARTICLE_PATH}/dirt_01.png`,
      `${KENNEY_PARTICLE_PATH}/magic_01.png`,
    ],
    tint: 0xe4ffd2,
  },
  praia_litoral_oceano: {
    alpha: [0.035, 0.09],
    count: { balanced: 9, ultra: 22 },
    drift: { x: -0.2, y: 0.04 },
    size: [34, 116],
    spin: 0.0018,
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff00.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff12.png`,
      `${KENNEY_PARTICLE_PATH}/twirl_01.png`,
    ],
    tint: 0xd8fbff,
  },
  montanhas_vazio_sereno: {
    alpha: [0.035, 0.09],
    count: { balanced: 6, ultra: 15 },
    drift: { x: 0.18, y: -0.08 },
    size: [38, 132],
    spin: 0.0008,
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff18.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff24.png`,
      `${KENNEY_PARTICLE_PATH}/smoke_07.png`,
    ],
    tint: 0xe7f5ff,
  },
  floresta_mistica: {
    alpha: [0.035, 0.105],
    count: { balanced: 8, ultra: 20 },
    drift: { x: 0.09, y: -0.08 },
    size: [30, 94],
    spin: 0.0014,
    textures: [
      `${KENNEY_PARTICLE_PATH}/magic_03.png`,
      `${KENNEY_PARTICLE_PATH}/magic_05.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff06.png`,
    ],
    tint: 0xb6ff9a,
  },
  vulcao_terras_cinzentas: {
    alpha: [0.055, 0.16],
    count: { balanced: 12, ultra: 34 },
    drift: { x: 0.04, y: -0.26 },
    size: [18, 70],
    spin: 0.004,
    textures: [
      `${KENNEY_PARTICLE_PATH}/spark_01.png`,
      `${KENNEY_PARTICLE_PATH}/spark_03.png`,
      `${KENNEY_PARTICLE_PATH}/flame_01.png`,
      `${KENNEY_SMOKE_PATH}/blackSmoke08.png`,
    ],
    tint: 0xffb35c,
  },
  regiao_congelada_neve: {
    alpha: [0.04, 0.12],
    count: { balanced: 10, ultra: 26 },
    drift: { x: 0.13, y: 0.08 },
    size: [18, 62],
    spin: 0.0012,
    textures: [
      `${KENNEY_SMOKE_PATH}/whitePuff00.png`,
      `${KENNEY_SMOKE_PATH}/whitePuff18.png`,
      `${KENNEY_PARTICLE_PATH}/light_02.png`,
    ],
    tint: 0xd7f8ff,
  },
  ruinas_antigas: {
    alpha: [0.04, 0.13],
    count: { balanced: 8, ultra: 22 },
    drift: { x: -0.03, y: -0.1 },
    size: [24, 86],
    spin: 0.0022,
    textures: [
      `${KENNEY_PARTICLE_PATH}/magic_01.png`,
      `${KENNEY_PARTICLE_PATH}/magic_03.png`,
      `${KENNEY_PARTICLE_PATH}/twirl_03.png`,
      `${KENNEY_PARTICLE_PATH}/flare_01.png`,
    ],
    tint: 0xd9b4ff,
  },
  vale_cinzento_veu: {
    alpha: [0.035, 0.095],
    count: { balanced: 8, ultra: 19 },
    drift: { x: 0.1, y: -0.12 },
    size: [34, 106],
    spin: 0.0011,
    textures: [
      `${KENNEY_SMOKE_PATH}/blackSmoke00.png`,
      `${KENNEY_SMOKE_PATH}/blackSmoke16.png`,
      `${KENNEY_PARTICLE_PATH}/dirt_03.png`,
    ],
    tint: 0xcbb6a6,
  },
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

function wrapParticle(value: number, max: number, padding: number) {
  if (value < -padding) {
    return max + padding
  }

  if (value > max + padding) {
    return -padding
  }

  return value
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

function randomRange(random: () => number, min: number, max: number) {
  return min + random() * (max - min)
}

function resetWeatherParticle(input: {
  height: number
  initial: boolean
  qualityScale: number
  random: () => number
  slot: WeatherParticle
  variant: 'rain' | 'snow'
  width: number
}) {
  const { height, initial, qualityScale, random, slot, variant, width } = input
  const particle = slot.particle
  const padding = Math.max(96, Math.min(width, height) * 0.04)

  slot.age = 0
  slot.driftPhase = random() * Math.PI * 2

  if (variant === 'rain') {
    const velocityY = randomRange(random, 860, 1180) * qualityScale
    const velocityX = randomRange(random, -380, -210) * qualityScale
    const scale = randomRange(random, 0.75, 1.22) * qualityScale

    slot.lifetime = Math.max(1.8, (height + padding * 3) / Math.max(1, velocityY))
    slot.velocityX = velocityX
    slot.velocityY = velocityY
    slot.rotationBase = -0.34 + randomRange(random, -0.04, 0.04)
    slot.rotationSpeed = randomRange(random, -0.14, 0.14)
    slot.alphaStart = randomRange(random, 0.14, 0.26)
    slot.alphaEnd = 0
    slot.scaleStartX = randomRange(random, 0.045, 0.07) * scale
    slot.scaleStartY = randomRange(random, 0.88, 1.38) * scale
    slot.scaleEndX = slot.scaleStartX * 0.82
    slot.scaleEndY = slot.scaleStartY * 0.9

    particle.anchorX = 0.5
    particle.anchorY = 0.5
    particle.tint = 0xd8f2ff
    particle.alpha = slot.alphaStart
    particle.x = randomRange(random, -padding, width + padding)
    particle.y = initial ? randomRange(random, -padding, height + padding) : -padding
    particle.rotation = slot.rotationBase
    particle.scaleX = slot.scaleStartX
    particle.scaleY = slot.scaleStartY
    return
  }

  const velocityY = randomRange(random, 34, 76) * qualityScale
  const velocityX = randomRange(random, -24, 22) * qualityScale
  const scale = randomRange(random, 0.32, 0.86) * qualityScale

  slot.lifetime = Math.max(8, (height + padding * 3) / Math.max(1, velocityY))
  slot.velocityX = velocityX
  slot.velocityY = velocityY
  slot.rotationBase = random() * Math.PI * 2
  slot.rotationSpeed = randomRange(random, -0.28, 0.28)
  slot.alphaStart = randomRange(random, 0.1, 0.24)
  slot.alphaEnd = 0
  slot.scaleStartX = scale
  slot.scaleStartY = scale
  slot.scaleEndX = scale * randomRange(random, 0.74, 1.08)
  slot.scaleEndY = scale * randomRange(random, 0.74, 1.08)

  particle.anchorX = 0.5
  particle.anchorY = 0.5
  particle.tint = 0xf2fdff
  particle.alpha = slot.alphaStart
  particle.x = randomRange(random, -padding, width + padding)
  particle.y = initial ? randomRange(random, -padding, height + padding) : -padding
  particle.rotation = slot.rotationBase
  particle.scaleX = slot.scaleStartX
  particle.scaleY = slot.scaleStartY
}

export function TabletopFxStage({
  biomeId,
  height,
  quality,
  weather,
  width,
}: TabletopFxStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const preset = useMemo(() => resolveBiomeVisualPreset(biomeId), [biomeId])
  const qualityScale = getQualityScale(quality)
  const weatherVariant = resolveWeatherFxVariant(weather)
  const shouldRenderWater = preset.id === 'praia_litoral_oceano'
  const shouldRenderWeather = weatherVariant !== null
  const ambientProfile = AMBIENT_SPRITE_PROFILES[preset.id]
  const shouldRenderAmbient = qualityScale > 0 && ambientProfile !== null

  useEffect(() => {
    const host = hostRef.current

    if (
      !host ||
      qualityScale <= 0 ||
      width <= 0 ||
      height <= 0 ||
      (!shouldRenderWater && !shouldRenderWeather && !shouldRenderAmbient)
    ) {
      return
    }

    const hostElement = host
    let disposed = false
    let app: import('pixi.js').Application | null = null

    async function mountStage() {
      const {
        Application,
        Assets,
        Container,
        Particle,
        ParticleContainer,
        Sprite,
        TilingSprite,
      } = await import('pixi.js')
      const nextApp = new Application()

      await nextApp.init({
        antialias: true,
        backgroundAlpha: 0,
        height,
        preference: 'webgl',
        resolution: Math.min(window.devicePixelRatio || 1, quality === 'ultra' ? 1.5 : 1),
        width,
      })

      if (disposed) {
        nextApp.destroy(true)
        return
      }

      app = nextApp
      nextApp.canvas.className = 'tabletop-fx-stage__canvas'
      nextApp.canvas.setAttribute('aria-hidden', 'true')
      hostElement.append(nextApp.canvas)

      const waterLayer = new Container()
      const ambientLayer = new Container()
      const weatherLayer = new Container()
      nextApp.stage.addChild(waterLayer)
      nextApp.stage.addChild(ambientLayer)
      nextApp.stage.addChild(weatherLayer)

      let waterSurface: import('pixi.js').TilingSprite | null = null
      let waterCurrent: import('pixi.js').TilingSprite | null = null

      if (shouldRenderWater) {
        try {
          const causticsTexture = await Assets.load<import('pixi.js').Texture>(
            resolveRuntimeAssetUrl('/assets/fx/textures/water_caustics_loop.png'),
          )

          if (disposed) {
            nextApp.destroy(true)
            return
          }

          waterSurface = new TilingSprite({
            height,
            texture: causticsTexture,
            tilePosition: { x: 0, y: 0 },
            tileScale: { x: 0.9, y: 0.9 },
            width,
          })
          waterSurface.alpha = quality === 'ultra' ? 0.024 : 0.012
          waterSurface.rotation = -0.02
          waterLayer.addChild(waterSurface)

          waterCurrent = new TilingSprite({
            height,
            texture: causticsTexture,
            tilePosition: { x: 0, y: 0 },
            tileScale: { x: 1.35, y: 0.62 },
            width,
          })
          waterCurrent.alpha = quality === 'ultra' ? 0.01 : 0.005
          waterCurrent.rotation = -0.34
          waterLayer.addChild(waterCurrent)
        } catch {
          waterSurface = null
          waterCurrent = null
        }
      }

      const particles: RuntimeParticle[] = []

      if (ambientProfile) {
        try {
          const textures = await Promise.all(
            ambientProfile.textures.map((texturePath) =>
              Assets.load<import('pixi.js').Texture>(resolveRuntimeAssetUrl(texturePath)),
            ),
          )

          if (disposed) {
            nextApp.destroy(true)
            return
          }

          const random = createSeededRandom(hashText(`${preset.id}:${quality}:${width}x${height}`))
          const particleCount =
            quality === 'ultra'
              ? ambientProfile.count.ultra
              : ambientProfile.count.balanced
          const padding = Math.max(width, height) * 0.08

          for (let index = 0; index < particleCount; index += 1) {
            const texture = textures[index % textures.length]
            const sprite = new Sprite(texture)
            const size =
              ambientProfile.size[0] +
              random() * (ambientProfile.size[1] - ambientProfile.size[0])
            const alphaBase =
              ambientProfile.alpha[0] +
              random() * (ambientProfile.alpha[1] - ambientProfile.alpha[0])

            sprite.anchor.set(0.5)
            sprite.tint = ambientProfile.tint ?? 0xffffff
            sprite.alpha = alphaBase
            sprite.width = size
            sprite.height = size * (texture.height / Math.max(1, texture.width))
            sprite.position.set(random() * (width + padding * 2) - padding, random() * (height + padding * 2) - padding)
            sprite.rotation = random() * Math.PI * 2
            ambientLayer.addChild(sprite)
            particles.push({
              alphaBase,
              alphaPhase: random() * Math.PI * 2,
              alphaWave: alphaBase * (0.22 + random() * 0.24),
              rotationSpeed: (random() - 0.5) * ambientProfile.spin,
              scalePulse: 0.035 + random() * 0.05,
              size,
              sprite,
              velocityX:
                ambientProfile.drift.x * (0.45 + random() * 0.95) * qualityScale,
              velocityY:
                ambientProfile.drift.y * (0.45 + random() * 0.95) * qualityScale,
              x: sprite.x,
              y: sprite.y,
            })
          }
        } catch {
          particles.splice(0)
          ambientLayer.removeChildren()
        }
      }

      const weatherParticles: WeatherParticle[] = []
      const weatherRandom = createSeededRandom(
        hashText(`weather:${weatherVariant}:${quality}:${width}x${height}`),
      )

      if (shouldRenderWeather && weatherVariant) {
        try {
          const texture = await Assets.load<import('pixi.js').Texture>(
            resolveRuntimeAssetUrl(
              weatherVariant === 'rain'
                ? `${KENNEY_PARTICLE_PATH}/spark_05.png`
                : `${KENNEY_SMOKE_PATH}/whitePuff00.png`,
            ),
          )

          if (disposed) {
            nextApp.destroy(true)
            return
          }

          const particleContainer = new ParticleContainer({
            dynamicProperties: {
              color: true,
              position: true,
              rotation: true,
              vertex: true,
            },
            texture,
          })
          weatherLayer.addChild(particleContainer)

          const particleCount = Math.max(
            24,
            Math.round((weatherVariant === 'rain' ? 360 : 190) * qualityScale),
          )

          for (let index = 0; index < particleCount; index += 1) {
            const particle = new Particle({
              alpha: 0,
              anchorX: 0.5,
              anchorY: 0.5,
              texture,
            })
            const slot: WeatherParticle = {
              age: 0,
              alphaEnd: 0,
              alphaStart: 0,
              driftPhase: 0,
              lifetime: 1,
              particle,
              rotationBase: 0,
              rotationSpeed: 0,
              scaleEndX: 1,
              scaleEndY: 1,
              scaleStartX: 1,
              scaleStartY: 1,
              velocityX: 0,
              velocityY: 0,
            }

            resetWeatherParticle({
              height,
              initial: true,
              qualityScale,
              random: weatherRandom,
              slot,
              variant: weatherVariant,
              width,
            })
            particleContainer.addParticle(particle)
            weatherParticles.push(slot)
          }
        } catch {
          weatherParticles.splice(0)
          weatherLayer.removeChildren()
        }
      }

      let elapsed = 0

      nextApp.ticker.add((ticker) => {
        elapsed += ticker.deltaTime
        const deltaSeconds = Math.min(0.05, ticker.deltaMS * 0.001)

        if (waterSurface) {
          waterSurface.tilePosition.x -= 0.32 * ticker.deltaTime
          waterSurface.tilePosition.y += 0.16 * ticker.deltaTime
          waterSurface.tileScale.x = 0.9 + Math.sin(elapsed / 150) * 0.025
          waterSurface.tileScale.y = 0.9 + Math.cos(elapsed / 170) * 0.022
        }

        if (waterCurrent) {
          waterCurrent.tilePosition.x -= 0.82 * ticker.deltaTime
          waterCurrent.tilePosition.y += 0.12 * ticker.deltaTime
        }

        particles.forEach((particle, index) => {
          const padding = particle.size * 1.35
          particle.x += particle.velocityX * ticker.deltaTime
          particle.y += particle.velocityY * ticker.deltaTime
          particle.x = wrapParticle(particle.x, width, padding)
          particle.y = wrapParticle(particle.y, height, padding)
          particle.sprite.position.set(
            particle.x + Math.sin(elapsed / 90 + index) * 2.2,
            particle.y + Math.cos(elapsed / 120 + index * 0.7) * 1.8,
          )
          particle.sprite.rotation += particle.rotationSpeed * ticker.deltaTime
          particle.sprite.alpha =
            particle.alphaBase +
            Math.sin(elapsed / 58 + particle.alphaPhase) * particle.alphaWave
          const pulse = 1 + Math.sin(elapsed / 72 + particle.alphaPhase) * particle.scalePulse
          particle.sprite.width = particle.size * pulse
          particle.sprite.height =
            particle.size *
            (particle.sprite.texture.height / Math.max(1, particle.sprite.texture.width)) *
            pulse
        })

        const activeWeatherVariant = weatherVariant

        if (!activeWeatherVariant) {
          return
        }

        weatherParticles.forEach((slot) => {
          const particle = slot.particle

          slot.age += deltaSeconds
          particle.x += slot.velocityX * deltaSeconds
          particle.y += slot.velocityY * deltaSeconds
          particle.rotation += slot.rotationSpeed * deltaSeconds

          if (activeWeatherVariant === 'snow') {
            particle.x += Math.sin(elapsed / 36 + slot.driftPhase) * deltaSeconds * 18
          }

          const progress = Math.min(1, slot.age / slot.lifetime)
          const fadeIn = Math.min(1, progress * (activeWeatherVariant === 'rain' ? 8 : 5))
          const fadeOut = Math.min(1, (1 - progress) * (activeWeatherVariant === 'rain' ? 5 : 3))
          const visibility = Math.max(0, Math.min(fadeIn, fadeOut))

          particle.alpha = lerp(slot.alphaStart, slot.alphaEnd, progress) * visibility
          particle.scaleX = lerp(slot.scaleStartX, slot.scaleEndX, progress)
          particle.scaleY = lerp(slot.scaleStartY, slot.scaleEndY, progress)

          const padding = Math.max(96, Math.min(width, height) * 0.04)
          if (
            slot.age >= slot.lifetime ||
            particle.x < -padding * 2 ||
            particle.x > width + padding * 2 ||
            particle.y > height + padding * 2
          ) {
            resetWeatherParticle({
              height,
              initial: false,
              qualityScale,
              random: weatherRandom,
              slot,
              variant: activeWeatherVariant,
              width,
            })
          }
        })
      })
    }

    void mountStage()

    return () => {
      disposed = true
      app?.destroy(true)
      hostElement.replaceChildren()
    }
  }, [
    ambientProfile,
    height,
    preset.secondary,
    preset.id,
    quality,
    qualityScale,
    shouldRenderAmbient,
    shouldRenderWater,
    shouldRenderWeather,
    weatherVariant,
    width,
  ])

  if (qualityScale <= 0 || (!shouldRenderWater && !shouldRenderWeather && !shouldRenderAmbient)) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="tabletop-fx-stage"
      data-biome={preset.id}
      data-weather-emitter={weatherVariant ?? ''}
      ref={hostRef}
    />
  )
}
