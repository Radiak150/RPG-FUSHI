import { useEffect, useRef } from 'react'
import type { RollOutcome } from '../../lib/rolls'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface TabletopDiceImpactSceneProps {
  active: boolean
  outcome: Exclude<RollOutcome, 'normal'>
  triggerId?: string
}

const LIGHTNING_MODEL_URL = '/assets/fx/models/lighting_pack_chain_lighting.glb'
const THUNDER_VIDEO_URL = '/assets/fx/video/thunder_red_looping_2.mp4'

type ThreeModule = typeof import('three')

function makeJaggedBolt(
  THREE: ThreeModule,
  input: {
    color: number
    endX: number
    endY: number
    endZ: number
    seed: number
    startX: number
  },
) {
  const points: import('three').Vector3[] = []

  for (let index = 0; index <= 8; index += 1) {
    const t = index / 8
    const swing = Math.sin((index + input.seed) * 1.94) * (0.38 - t * 0.18)
    const snap = Math.cos((index + input.seed) * 2.81) * (0.28 - t * 0.12)

    points.push(
      new THREE.Vector3(
        input.startX * (1 - t) + input.endX * t + swing,
        4.2 * (1 - t) + input.endY * t,
        input.endZ * t + snap,
      ),
    )
  }

  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, 28, 0.028, 6, false)
  const material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: input.color,
    depthWrite: false,
    opacity: 0.94,
    transparent: true,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData.seed = input.seed
  mesh.userData.birthDelay = input.seed * 115

  return mesh
}

function makeCrackField(THREE: ThreeModule, color: number) {
  const group = new THREE.Group()
  const materials = [
    new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color,
      depthWrite: false,
      opacity: 0.62,
      transparent: true,
    }),
    new THREE.LineBasicMaterial({
      color: 0x050000,
      depthWrite: false,
      opacity: 0.72,
      transparent: true,
    }),
  ]

  for (let branch = 0; branch < 22; branch += 1) {
    const angle = (branch / 22) * Math.PI * 2 + Math.sin(branch * 1.7) * 0.22
    const radius = 1.2 + ((branch * 37) % 100) / 100 * 3.4
    const points: import('three').Vector3[] = [new THREE.Vector3(0, -1.76, -0.2)]

    for (let index = 1; index <= 5; index += 1) {
      const t = index / 5
      const wobble = Math.sin(index * 2.1 + branch) * 0.18
      points.push(
        new THREE.Vector3(
          Math.cos(angle + wobble) * radius * t,
          -1.76 + Math.sin(angle + wobble) * radius * t * 0.38,
          -0.2 + t * 0.05,
        ),
      )
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, materials[branch % 2])
    line.userData.branch = branch
    group.add(line)
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.28, 0.018, 8, 96),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color,
      depthWrite: false,
      opacity: 0.54,
      transparent: true,
    }),
  )
  ring.position.y = -1.76
  ring.rotation.x = Math.PI / 2
  group.add(ring)

  return group
}

function disposeObject(root: import('three').Object3D) {
  root.traverse((child) => {
    const mesh = child as import('three').Mesh
    mesh.geometry?.dispose()

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      const maybeTextured = material as import('three').Material & {
        map?: import('three').Texture | null
      }
      maybeTextured?.map?.dispose()
      material?.dispose()
    })
  })
}

function tintLightningModel(
  THREE: ThreeModule,
  model: import('three').Object3D,
  outcome: Exclude<RollOutcome, 'normal'>,
) {
  const hotColor = outcome === 'triumph' ? 0xff1515 : 0xcc0808
  const darkColor = 0x090000

  model.traverse((child) => {
    const mesh = child as import('three').Mesh

    if (!mesh.isMesh) {
      return
    }

    mesh.material = new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: Math.random() > 0.28 ? hotColor : darkColor,
      depthWrite: false,
      opacity: Math.random() > 0.28 ? 0.92 : 0.72,
      transparent: true,
    })
  })
}

export function TabletopDiceImpactScene({
  active,
  outcome,
  triggerId,
}: TabletopDiceImpactSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current

    if (!host || !active) {
      return
    }

    let disposed = false
    let cleanup = () => {}

    async function mount() {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
      const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js')
      const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js')
      const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js')
      const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js')

      if (disposed || !host) {
        return
      }

      const red = outcome === 'triumph' ? 0xff1919 : 0xb40000
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 80)
      camera.position.set(0, 0.16, 7.2)

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        depth: false,
        powerPreference: 'high-performance',
      })
      renderer.setClearAlpha(0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65))
      renderer.setSize(host.clientWidth || window.innerWidth, host.clientHeight || window.innerHeight)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.className = 'tabletop-dice-impact-scene__canvas'
      host.replaceChildren(renderer.domElement)

      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      composer.addPass(
        new UnrealBloomPass(
          new THREE.Vector2(host.clientWidth || window.innerWidth, host.clientHeight || window.innerHeight),
          outcome === 'triumph' ? 2.4 : 1.8,
          0.72,
          0.08,
        ),
      )
      composer.addPass(new OutputPass())

      const video = document.createElement('video')
      video.src = resolveRuntimeAssetUrl(THUNDER_VIDEO_URL)
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.preload = 'auto'
      video.currentTime = 0
      void video.play().catch(() => {
        // The 3D lightning still carries the impact if autoplay is blocked.
      })

      const videoTexture = new THREE.VideoTexture(video)
      videoTexture.colorSpace = THREE.SRGBColorSpace
      const videoPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(18.8, 10.6),
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: outcome === 'triumph' ? 0xffeeee : 0xff9a9a,
          depthWrite: false,
          map: videoTexture,
          opacity: outcome === 'triumph' ? 0.62 : 0.48,
          transparent: true,
        }),
      )
      videoPlane.position.z = -2.2
      scene.add(videoPlane)

      scene.add(new THREE.AmbientLight(0x120000, 1.2))
      const coreLight = new THREE.PointLight(red, outcome === 'triumph' ? 35 : 24, 18)
      coreLight.position.set(0, 0.3, 2.4)
      scene.add(coreLight)

      const strikeGroup = new THREE.Group()
      scene.add(strikeGroup)

      const crackField = makeCrackField(THREE, outcome === 'triumph' ? 0xffd2aa : 0xff2626)
      scene.add(crackField)

      const proceduralBolts = [
        makeJaggedBolt(THREE, {
          color: 0xffffff,
          endX: -2.4,
          endY: -1.55,
          endZ: 0.1,
          seed: 0,
          startX: -3.2,
        }),
        makeJaggedBolt(THREE, {
          color: red,
          endX: 0,
          endY: -1.74,
          endZ: 0.4,
          seed: 1,
          startX: 0.6,
        }),
        makeJaggedBolt(THREE, {
          color: 0x080000,
          endX: 2.6,
          endY: -1.58,
          endZ: 0.2,
          seed: 2,
          startX: 3.6,
        }),
        makeJaggedBolt(THREE, {
          color: outcome === 'triumph' ? 0xffd7a8 : 0xff2c2c,
          endX: 0.8,
          endY: -1.62,
          endZ: 0.7,
          seed: 3,
          startX: -0.8,
        }),
      ]
      proceduralBolts.forEach((bolt) => strikeGroup.add(bolt))

      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(resolveRuntimeAssetUrl(LIGHTNING_MODEL_URL))

      if (disposed) {
        disposeObject(gltf.scene)
        return
      }

      tintLightningModel(THREE, gltf.scene, outcome)

      const modelWrap = new THREE.Group()
      const modelScale = outcome === 'triumph' ? 1.95 : 1.55
      gltf.scene.scale.setScalar(modelScale)
      gltf.scene.rotation.set(-0.26, 0.2, -0.3)
      gltf.scene.position.set(-1.7, 0.9, 0.9)
      modelWrap.add(gltf.scene)
      strikeGroup.add(modelWrap)

      const modelCloneA = gltf.scene.clone(true)
      tintLightningModel(THREE, modelCloneA, outcome)
      modelCloneA.scale.setScalar(modelScale * 0.82)
      modelCloneA.rotation.set(0.18, -0.32, 0.78)
      modelCloneA.position.set(2.05, -0.25, 0.8)
      strikeGroup.add(modelCloneA)

      const modelCloneB = gltf.scene.clone(true)
      tintLightningModel(THREE, modelCloneB, outcome)
      modelCloneB.scale.setScalar(modelScale * 0.7)
      modelCloneB.rotation.set(-0.18, 0.5, -1.08)
      modelCloneB.position.set(0.4, 1.35, 0.6)
      strikeGroup.add(modelCloneB)

      const resizeObserver = new ResizeObserver(() => {
        const width = host.clientWidth || window.innerWidth
        const height = host.clientHeight || window.innerHeight
        camera.aspect = width / Math.max(1, height)
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
        composer.setSize(width, height)
      })
      resizeObserver.observe(host)

      const start = performance.now()
      let frameId = 0
      const animate = () => {
        if (disposed) {
          return
        }

        const age = performance.now() - start
        const impact = Math.min(1, age / 780)
        const fade = Math.max(0, 1 - Math.max(0, age - 2150) / 1100)
        const flicker = Math.sin(age / 24) * 0.5 + Math.sin(age / 43) * 0.5
        const shake = (1 - impact * 0.45) * (outcome === 'triumph' ? 0.09 : 0.06)

        camera.position.x = Math.sin(age / 31) * shake
        camera.position.y = 0.16 + Math.cos(age / 27) * shake * 0.7
        camera.rotation.z = Math.sin(age / 36) * shake * 0.22
        videoPlane.material.opacity = (outcome === 'triumph' ? 0.62 : 0.48) * fade
        coreLight.intensity = (outcome === 'triumph' ? 28 : 19) + flicker * 10
        strikeGroup.rotation.z = Math.sin(age / 220) * 0.045
        strikeGroup.scale.setScalar(0.88 + impact * 0.16 + Math.sin(age / 95) * 0.018)
        crackField.scale.setScalar(0.7 + impact * 0.5)
        crackField.rotation.z += 0.003

        proceduralBolts.forEach((bolt) => {
          const boltMaterial = bolt.material as import('three').MeshBasicMaterial
          const localAge = age - bolt.userData.birthDelay
          const visible = localAge > 0 && localAge < 1700
          boltMaterial.opacity = visible
            ? (0.32 + Math.abs(Math.sin(localAge / 33)) * 0.68) * fade
            : 0
          bolt.scale.setScalar(visible ? 0.8 + Math.sin(localAge / 80) * 0.18 : 0.01)
        })

        strikeGroup.visible = fade > 0.01
        composer.render()
        frameId = window.requestAnimationFrame(animate)
      }
      animate()

      cleanup = () => {
        window.cancelAnimationFrame(frameId)
        resizeObserver.disconnect()
        video.pause()
        video.removeAttribute('src')
        video.load()
        videoTexture.dispose()
        disposeObject(scene)
        composer.dispose()
        renderer.dispose()
        host.replaceChildren()
      }
    }

    void mount()

    return () => {
      disposed = true
      cleanup()
    }
  }, [active, outcome, triggerId])

  if (!active) {
    return null
  }

  return <div aria-hidden="true" className="tabletop-dice-impact-scene" ref={hostRef} />
}

