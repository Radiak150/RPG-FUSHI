import { useEffect, useRef } from 'react'
import type { TabletopBoardObject } from '../../data/types'
import type { VisualQualityMode } from '../../lib/productPreferences'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface TabletopObject3DProps {
  assetUrl?: string
  color?: string
  modelUrl?: string
  objectType?: TabletopBoardObject['objectType']
  quality?: VisualQualityMode
  variant?: string
}

type ThreeModule = typeof import('three')
type ObjectVariant =
  | 'brazier'
  | 'chest'
  | 'crystal'
  | 'obelisk'
  | 'portal'
  | 'relic'
  | 'spike-trap'
  | 'sword'
  | 'vfx-fire'
  | 'vfx-fog'
  | 'vfx-lava'
  | 'vfx-leaves'
  | 'vfx-lightning'
  | 'vfx-rain'
  | 'vfx-water'
  | 'vfx-wind'

function parseColor(value = '#e9c97e') {
  return Number.parseInt(value.replace('#', ''), 16)
}

function resolveObjectVariant(input: TabletopObject3DProps): ObjectVariant {
  const lookup = `${input.variant ?? ''} ${input.assetUrl ?? ''} ${input.modelUrl ?? ''}`.toLowerCase()

  if (lookup.includes('vfx-fire')) return 'vfx-fire'
  if (lookup.includes('vfx-fog')) return 'vfx-fog'
  if (lookup.includes('vfx-wind')) return 'vfx-wind'
  if (lookup.includes('vfx-water')) return 'vfx-water'
  if (lookup.includes('vfx-lightning')) return 'vfx-lightning'
  if (lookup.includes('vfx-leaf')) return 'vfx-leaves'
  if (lookup.includes('vfx-lava')) return 'vfx-lava'
  if (lookup.includes('vfx-rain')) return 'vfx-rain'

  if (lookup.includes('cristal') || lookup.includes('crystal') || lookup.includes('fushi')) {
    return 'crystal'
  }

  if (lookup.includes('braseiro') || lookup.includes('chama') || lookup.includes('brazier')) {
    return 'brazier'
  }

  if (lookup.includes('obelisco') || lookup.includes('runic') || lookup.includes('runico')) {
    return 'obelisk'
  }

  if (lookup.includes('portal') || lookup.includes('aquatico') || lookup.includes('water')) {
    return 'portal'
  }

  if (lookup.includes('espada') || lookup.includes('sword')) {
    return 'sword'
  }

  if (lookup.includes('bau') || lookup.includes('chest')) {
    return 'chest'
  }

  if (lookup.includes('armadilha') || lookup.includes('spike') || lookup.includes('trap')) {
    return 'spike-trap'
  }

  if (input.objectType === 'hazard') return 'spike-trap'
  if (input.objectType === 'prop') return 'obelisk'

  return 'relic'
}

function makeStandardMaterial(
  THREE: ThreeModule,
  color: number,
  options: {
    emissive?: number
    emissiveIntensity?: number
    metalness?: number
    opacity?: number
    roughness?: number
  } = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: options.emissive ?? color,
    emissiveIntensity: options.emissiveIntensity ?? 0.08,
    metalness: options.metalness ?? 0.18,
    opacity: options.opacity ?? 1,
    roughness: options.roughness ?? 0.36,
    transparent: options.opacity !== undefined && options.opacity < 1,
  })
}

function addMesh(
  THREE: ThreeModule,
  root: import('three').Group,
  geometry: import('three').BufferGeometry,
  material: import('three').Material,
  transform: {
    position?: [number, number, number]
    rotation?: [number, number, number]
    scale?: [number, number, number]
  } = {},
) {
  const mesh = new THREE.Mesh(geometry, material)
  if (transform.position) mesh.position.set(...transform.position)
  if (transform.rotation) mesh.rotation.set(...transform.rotation)
  if (transform.scale) mesh.scale.set(...transform.scale)
  root.add(mesh)
  return mesh
}

function addEdges(
  THREE: ThreeModule,
  mesh: import('three').Mesh,
  color: number,
  opacity = 0.42,
) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({
      color,
      opacity,
      transparent: true,
    }),
  )
  mesh.add(edges)
}

function addCrystal(THREE: ThreeModule, root: import('three').Group, color: number) {
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.52,
    metalness: 0.04,
    opacity: 0.82,
    roughness: 0.16,
    transmission: 0.18,
    transparent: true,
  })
  const crystal = addMesh(
    THREE,
    root,
    new THREE.OctahedronGeometry(0.72, 0),
    crystalMaterial,
    { position: [0, 0.28, 0], rotation: [0.18, 0.72, 0.12], scale: [0.72, 1.22, 0.72] },
  )
  addEdges(THREE, crystal, 0xffffff, 0.5)

  addMesh(
    THREE,
    root,
    new THREE.CylinderGeometry(0.56, 0.68, 0.18, 32),
    makeStandardMaterial(THREE, 0x1b2423, {
      emissive: color,
      emissiveIntensity: 0.06,
      metalness: 0.32,
      roughness: 0.5,
    }),
    { position: [0, -0.62, 0] },
  )

  addMesh(
    THREE,
    root,
    new THREE.TorusGeometry(0.78, 0.018, 8, 90),
    makeStandardMaterial(THREE, color, {
      emissive: color,
      emissiveIntensity: 0.9,
      opacity: 0.58,
      roughness: 0.22,
    }),
    { rotation: [Math.PI / 2.4, 0, 0.18] },
  )
}

function addBrazier(THREE: ThreeModule, root: import('three').Group, color: number) {
  const metal = makeStandardMaterial(THREE, 0x2a2019, {
    emissive: 0x3d1608,
    emissiveIntensity: 0.18,
    metalness: 0.48,
    roughness: 0.44,
  })
  addMesh(THREE, root, new THREE.CylinderGeometry(0.36, 0.48, 0.42, 32), metal, {
    position: [0, -0.42, 0],
  })
  addMesh(
    THREE,
    root,
    new THREE.TorusGeometry(0.46, 0.08, 12, 42),
    metal,
    { position: [0, -0.12, 0], rotation: [Math.PI / 2, 0, 0] },
  )

  const flameColors = [0xfff0a8, 0xff8a3b, color]
  flameColors.forEach((flameColor, index) => {
    addMesh(
      THREE,
      root,
      new THREE.ConeGeometry(0.18 + index * 0.04, 0.68 - index * 0.09, 22),
      makeStandardMaterial(THREE, flameColor, {
        emissive: flameColor,
        emissiveIntensity: 1.1,
        opacity: 0.72 - index * 0.08,
        roughness: 0.18,
      }),
      {
        position: [Math.sin(index * 2.1) * 0.08, 0.18 + index * 0.04, Math.cos(index) * 0.04],
        rotation: [0.06 * index, index * 0.7, -0.08 * index],
      },
    )
  })
}

function addObelisk(THREE: ThreeModule, root: import('three').Group, color: number) {
  const stone = makeStandardMaterial(THREE, 0x3b3a42, {
    emissive: color,
    emissiveIntensity: 0.14,
    metalness: 0.05,
    roughness: 0.58,
  })
  const obelisk = addMesh(
    THREE,
    root,
    new THREE.CylinderGeometry(0.22, 0.42, 1.42, 4),
    stone,
    { position: [0, 0.02, 0], rotation: [0, Math.PI / 4, 0] },
  )
  addEdges(THREE, obelisk, color, 0.34)
  addMesh(
    THREE,
    root,
    new THREE.TorusGeometry(0.44, 0.018, 8, 48),
    makeStandardMaterial(THREE, color, {
      emissive: color,
      emissiveIntensity: 0.7,
      opacity: 0.54,
      roughness: 0.22,
    }),
    { position: [0, 0.1, 0], rotation: [Math.PI / 2, 0, 0] },
  )
  addMesh(
    THREE,
    root,
    new THREE.BoxGeometry(0.7, 0.18, 0.7),
    stone,
    { position: [0, -0.8, 0], rotation: [0, Math.PI / 4, 0] },
  )
}

function addPortal(THREE: ThreeModule, root: import('three').Group, color: number) {
  const ringMaterial = makeStandardMaterial(THREE, color, {
    emissive: color,
    emissiveIntensity: 0.84,
    metalness: 0.1,
    opacity: 0.8,
    roughness: 0.16,
  })
  addMesh(
    THREE,
    root,
    new THREE.TorusGeometry(0.72, 0.07, 18, 110),
    ringMaterial,
    { rotation: [0.12, 0.18, 0] },
  )
  addMesh(
    THREE,
    root,
    new THREE.CircleGeometry(0.62, 72),
    new THREE.MeshBasicMaterial({
      color,
      opacity: 0.22,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    { rotation: [0.12, 0.18, 0] },
  )
  addMesh(
    THREE,
    root,
    new THREE.TorusGeometry(0.92, 0.012, 8, 96),
    makeStandardMaterial(THREE, 0xe8fdff, {
      emissive: color,
      emissiveIntensity: 0.92,
      opacity: 0.46,
      roughness: 0.18,
    }),
    { rotation: [Math.PI / 2.2, 0, 0.38] },
  )
}

function addSword(THREE: ThreeModule, root: import('three').Group, color: number) {
  addMesh(
    THREE,
    root,
    new THREE.BoxGeometry(0.13, 1.24, 0.05),
    makeStandardMaterial(THREE, 0xd9e0dd, {
      emissive: color,
      emissiveIntensity: 0.18,
      metalness: 0.62,
      roughness: 0.22,
    }),
    { position: [0, 0.16, 0] },
  )
  addMesh(
    THREE,
    root,
    new THREE.BoxGeometry(0.62, 0.12, 0.12),
    makeStandardMaterial(THREE, color, {
      emissive: color,
      emissiveIntensity: 0.28,
      metalness: 0.35,
      roughness: 0.28,
    }),
    { position: [0, -0.48, 0] },
  )
  addMesh(
    THREE,
    root,
    new THREE.CylinderGeometry(0.06, 0.06, 0.44, 20),
    makeStandardMaterial(THREE, 0x2a1910, { roughness: 0.52 }),
    { position: [0, -0.75, 0], rotation: [0, 0, Math.PI / 2] },
  )
}

function addChest(THREE: ThreeModule, root: import('three').Group, color: number) {
  const wood = makeStandardMaterial(THREE, 0x5a331b, {
    emissive: color,
    emissiveIntensity: 0.08,
    roughness: 0.48,
  })
  addMesh(THREE, root, new THREE.BoxGeometry(0.92, 0.52, 0.62), wood, {
    position: [0, -0.28, 0],
  })
  addMesh(
    THREE,
    root,
    new THREE.BoxGeometry(0.92, 0.22, 0.62),
    makeStandardMaterial(THREE, 0x6b3e21, {
      emissive: color,
      emissiveIntensity: 0.1,
      roughness: 0.42,
    }),
    { position: [0, 0.12, -0.02], rotation: [0.08, 0, 0] },
  )
  addMesh(
    THREE,
    root,
    new THREE.BoxGeometry(0.16, 0.2, 0.08),
    makeStandardMaterial(THREE, color, {
      emissive: color,
      emissiveIntensity: 0.2,
      metalness: 0.55,
      roughness: 0.24,
    }),
    { position: [0, -0.14, 0.34] },
  )
}

function addSpikeTrap(THREE: ThreeModule, root: import('three').Group, color: number) {
  const base = makeStandardMaterial(THREE, 0x2d2620, {
    emissive: 0x331009,
    emissiveIntensity: 0.1,
    roughness: 0.55,
  })
  addMesh(
    THREE,
    root,
    new THREE.CylinderGeometry(0.74, 0.74, 0.14, 7),
    base,
    { position: [0, -0.58, 0] },
  )

  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2
    const radius = index === 0 ? 0 : 0.42
    addMesh(
      THREE,
      root,
      new THREE.ConeGeometry(0.08, 0.72, 14),
      makeStandardMaterial(THREE, index % 2 === 0 ? 0xd6d0bf : color, {
        emissive: color,
        emissiveIntensity: 0.12,
        metalness: 0.44,
        roughness: 0.24,
      }),
      {
        position: [Math.cos(angle) * radius, -0.18, Math.sin(angle) * radius],
        rotation: [0.08 * Math.sin(angle), 0, 0.08 * Math.cos(angle)],
      },
    )
  }
}

function addRelic(THREE: ThreeModule, root: import('three').Group, color: number) {
  const relic = addMesh(
    THREE,
    root,
    new THREE.DodecahedronGeometry(0.58, 0),
    makeStandardMaterial(THREE, color, {
      emissive: color,
      emissiveIntensity: 0.36,
      metalness: 0.16,
      opacity: 0.9,
      roughness: 0.28,
    }),
    { position: [0, 0.04, 0], rotation: [0.28, 0.34, 0.12] },
  )
  addEdges(THREE, relic, 0xffffff, 0.38)
  addMesh(
    THREE,
    root,
    new THREE.TorusGeometry(0.76, 0.014, 8, 84),
    makeStandardMaterial(THREE, color, {
      emissive: color,
      emissiveIntensity: 0.86,
      opacity: 0.46,
      roughness: 0.18,
    }),
    { rotation: [Math.PI / 2.25, 0, -0.28] },
  )
}

function addVfxPreview(
  THREE: ThreeModule,
  root: import('three').Group,
  variant: ObjectVariant,
  color: number,
) {
  const isWater = variant === 'vfx-water' || variant === 'vfx-rain'
  const isFog = variant === 'vfx-fog'
  const isWind = variant === 'vfx-wind'
  const isLeaves = variant === 'vfx-leaves'
  const isLightning = variant === 'vfx-lightning'
  const isLava = variant === 'vfx-lava'
  const previewColor =
    isWater
      ? 0x70eaff
      : isFog
        ? 0xc8d8d6
        : isLeaves
          ? 0x9aff6a
          : color

  addMesh(
    THREE,
    root,
    new THREE.TorusGeometry(0.72, 0.024, 8, 92),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: previewColor,
      opacity: isFog ? 0.32 : 0.58,
      transparent: true,
    }),
    { position: [0, -0.56, 0], rotation: [Math.PI / 2, 0, 0] },
  )

  if (isLightning) {
    for (let index = 0; index < 3; index += 1) {
      const points = [
        new THREE.Vector3(-0.18 + index * 0.18, 0.86, 0),
        new THREE.Vector3(0.1 - index * 0.08, 0.34, 0.04),
        new THREE.Vector3(-0.04 + index * 0.1, -0.18, -0.03),
      ]
      root.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            blending: THREE.AdditiveBlending,
            color: index % 2 ? 0xffffff : previewColor,
            opacity: 0.88,
            transparent: true,
          }),
        ),
      )
    }
    return
  }

  if (isWind || isFog || isWater || isRainVariant(variant)) {
    for (let index = 0; index < 4; index += 1) {
      addMesh(
        THREE,
        root,
        new THREE.TorusGeometry(0.24 + index * 0.1, 0.012, 8, 64),
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: previewColor,
          opacity: isFog ? 0.18 : 0.28,
          transparent: true,
        }),
        {
          position: [
            Math.sin(index * 1.7) * 0.28,
            -0.24 + index * 0.22,
            Math.cos(index * 1.2) * 0.16,
          ],
          rotation: [Math.PI / 2.4, 0, index * 0.62],
        },
      )
    }
    return
  }

  for (let index = 0; index < 4; index += 1) {
    addMesh(
      THREE,
      root,
      new THREE.ConeGeometry(0.16 + index * 0.025, 0.86 - index * 0.08, 22),
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: isLava ? (index % 2 ? 0xfff0a8 : 0xff3514) : previewColor,
        opacity: 0.46,
        transparent: true,
      }),
      {
        position: [
          Math.sin(index * 2.1) * 0.16,
          -0.24 + index * 0.1,
          Math.cos(index * 1.6) * 0.1,
        ],
        rotation: [0.05 * index, index * 0.8, -0.08 * index],
      },
    )
  }
}

function isRainVariant(variant: ObjectVariant) {
  return variant === 'vfx-rain'
}

function buildObjectModel(
  THREE: ThreeModule,
  root: import('three').Group,
  variant: ObjectVariant,
  color: number,
) {
  if (variant.startsWith('vfx-')) {
    addVfxPreview(THREE, root, variant, color)
    return
  }

  switch (variant) {
    case 'brazier':
      addBrazier(THREE, root, color)
      break
    case 'chest':
      addChest(THREE, root, color)
      break
    case 'crystal':
      addCrystal(THREE, root, color)
      break
    case 'obelisk':
      addObelisk(THREE, root, color)
      break
    case 'portal':
      addPortal(THREE, root, color)
      break
    case 'spike-trap':
      addSpikeTrap(THREE, root, color)
      break
    case 'sword':
      addSword(THREE, root, color)
      break
    case 'relic':
    default:
      addRelic(THREE, root, color)
  }
}

async function addExternalModel(
  THREE: ThreeModule,
  root: import('three').Group,
  modelUrl: string,
) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(resolveRuntimeAssetUrl(modelUrl))
  const model = gltf.scene

  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
  const scale = 1.86 / maxDimension

  model.position.sub(center)
  model.scale.setScalar(scale)
  model.rotation.set(-0.42, 0.72, 0.03)

  model.traverse((child) => {
    const mesh = child as import('three').Mesh

    if (!mesh.isMesh) {
      return
    }

    mesh.frustumCulled = true

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      const standardMaterial = material as import('three').MeshStandardMaterial
      standardMaterial.roughness = Math.min(0.88, standardMaterial.roughness ?? 0.62)
      standardMaterial.metalness = Math.min(0.22, standardMaterial.metalness ?? 0.04)
      standardMaterial.needsUpdate = true
    })
  })

  root.add(model)
  return model
}

function disposeObject(root: import('three').Object3D) {
  root.traverse((child) => {
    const mesh = child as import('three').Mesh
    mesh.geometry?.dispose()

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      const texturedMaterial = material as import('three').Material & {
        map?: import('three').Texture | null
      }
      texturedMaterial?.map?.dispose()
      material?.dispose()
    })
  })
}

export function TabletopObject3D({
  assetUrl,
  color = '#e9c97e',
  modelUrl,
  objectType,
  quality = 'balanced',
  variant,
}: TabletopObject3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    if (quality === 'low') {
      host.replaceChildren()
      return
    }

    let disposed = false
    let cleanup = () => {}
    const objectVariant = resolveObjectVariant({
      assetUrl,
      color,
      modelUrl,
      objectType,
      quality,
      variant,
    })

    async function mount() {
      const THREE = await import('three')

      if (disposed || !host) {
        return
      }

      const objectColor = parseColor(color)
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
      camera.position.set(0, 0.1, 4.15)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setClearAlpha(0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'ultra' ? 1.85 : 1.45))
      renderer.setSize(host.clientWidth || 96, host.clientHeight || 96)
      renderer.domElement.className = 'tabletop-object-three__canvas'
      host.replaceChildren(renderer.domElement)

      const root = new THREE.Group()
      root.rotation.set(-0.22, 0.34, 0)
      root.scale.setScalar(objectVariant === 'portal' ? 0.92 : 1)
      scene.add(root)
      let externalModel: import('three').Object3D | null = null

      if (modelUrl && quality === 'ultra') {
        try {
          externalModel = await addExternalModel(THREE, root, modelUrl)
        } catch (error) {
          console.error('Falha ao carregar modelo 3D do objeto', error)
        }
      }

      if (!externalModel) {
        buildObjectModel(THREE, root, objectVariant, objectColor)
      }

      const key = new THREE.DirectionalLight(0xfff0c0, 2.8)
      key.position.set(2.4, 3.2, 4.2)
      scene.add(key)
      scene.add(new THREE.AmbientLight(0x8fbfb2, 1.2))

      const glow = new THREE.PointLight(objectColor, 1.4, 4.2)
      glow.position.set(0, 0.36, 1.4)
      scene.add(glow)

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.86, 48),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          opacity: 0.3,
          transparent: true,
        }),
      )
      shadow.position.set(0, -1.08, -0.28)
      shadow.scale.set(1.48, 0.32, 1)
      scene.add(shadow)

      if (assetUrl && objectVariant === 'relic') {
        const loader = new THREE.TextureLoader()
        loader.load(
          resolveRuntimeAssetUrl(assetUrl),
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace

            if (disposed) {
              texture.dispose()
              return
            }

            const spriteMaterial = new THREE.SpriteMaterial({
              map: texture,
              opacity: 0.72,
              transparent: true,
            })
            const sprite = new THREE.Sprite(spriteMaterial)
            sprite.position.set(0, 0.02, 0.46)
            sprite.scale.set(0.74, 0.74, 0.74)
            root.add(sprite)
          },
          undefined,
          () => {
            // The procedural mesh remains usable if the optional icon texture fails.
          },
        )
      }

      const resizeObserver = new ResizeObserver(() => {
        const width = host.clientWidth || 96
        const height = host.clientHeight || 96
        camera.aspect = width / Math.max(1, height)
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      })
      resizeObserver.observe(host)

      const start = performance.now()
      let frameId = 0
      const animate = () => {
        if (disposed) {
          return
        }

        const age = performance.now() - start
        const pulse = (Math.sin(age / 520) + 1) / 2
        const idleLift = Math.sin(age / 720) * 0.045
        const turnSpeed =
          objectVariant.startsWith('vfx-')
            ? 0.018
            : objectVariant === 'portal'
            ? 0.014
            : objectVariant === 'crystal'
              ? 0.011
              : 0.006

        root.rotation.y += turnSpeed
        root.position.y = idleLift
        glow.intensity = 1.05 + pulse * 0.7
        shadow.scale.set(1.34 + pulse * 0.18, 0.27 + pulse * 0.06, 1)
        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(animate)
      }
      animate()

      cleanup = () => {
        window.cancelAnimationFrame(frameId)
        resizeObserver.disconnect()
        disposeObject(scene)
        renderer.dispose()
        host.replaceChildren()
      }
    }

    void mount()

    return () => {
      disposed = true
      cleanup()
    }
  }, [assetUrl, color, modelUrl, objectType, quality, variant])

  return <div className="tabletop-object-three" ref={hostRef} />
}
