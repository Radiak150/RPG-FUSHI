import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

interface DiceRoll3DProps {
  className?: string
  color?: string
  label?: string
  size?: 'md' | 'lg'
  type: number
}

function parseColor(value = '#d8a34d') {
  return Number.parseInt(value.replace('#', ''), 16)
}

function getDiceGeometry(
  THREE: typeof import('three'),
  type: number,
): import('three').BufferGeometry {
  switch (type) {
    case 2:
      return new THREE.CylinderGeometry(0.98, 0.98, 0.22, 64)
    case 4:
      return new THREE.TetrahedronGeometry(1.12, 0)
    case 6:
      return new THREE.BoxGeometry(1.5, 1.5, 1.5)
    case 8:
      return new THREE.OctahedronGeometry(1.18, 0)
    case 10:
      return new THREE.ConeGeometry(1.05, 1.95, 10)
    case 12:
      return new THREE.DodecahedronGeometry(1.12, 0)
    case 16:
      return new THREE.ConeGeometry(1.04, 1.9, 16)
    case 30:
      return new THREE.IcosahedronGeometry(1.12, 1)
    case 20:
    case 100:
    default:
      return new THREE.IcosahedronGeometry(1.14, type === 100 ? 2 : 0)
  }
}

export function DiceRoll3D({
  className,
  color = '#d8a34d',
  label,
  size = 'md',
  type,
}: DiceRoll3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const style = useMemo(
    () =>
      ({
        '--dice-color': color,
      }) as CSSProperties,
    [color],
  )

  useEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    let disposed = false
    let cleanup = () => {}

    async function mount() {
      const THREE = await import('three')

      if (disposed || !host) {
        return
      }

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
      camera.position.set(0, 0.12, 4.3)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setClearAlpha(0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
      renderer.setSize(host.clientWidth || 110, host.clientHeight || 110)
      renderer.domElement.className = 'dice-roll-3d__canvas'
      host.replaceChildren(renderer.domElement)

      const geometry = getDiceGeometry(THREE, type)
      const material = new THREE.MeshStandardMaterial({
        color: parseColor(color),
        emissive: parseColor(color),
        emissiveIntensity: 0.14,
        metalness: 0.16,
        roughness: 0.32,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.set(-0.65, 0.4, 0.2)
      scene.add(mesh)

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({
          color: 0xfff2bf,
          transparent: true,
          opacity: 0.58,
        }),
      )
      mesh.add(edges)

      const key = new THREE.DirectionalLight(0xfff2c8, 2.8)
      key.position.set(2.5, 3, 4.5)
      scene.add(key)
      scene.add(new THREE.AmbientLight(0x8ed5cc, 1.05))

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.02, 48),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          opacity: 0.24,
          transparent: true,
        }),
      )
      shadow.position.set(0, -1.26, -0.3)
      shadow.scale.set(1.45, 0.28, 1)
      scene.add(shadow)

      const resizeObserver = new ResizeObserver(() => {
        const width = host.clientWidth || 110
        const height = host.clientHeight || 110
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
        const landing = Math.min(1, age / 980)
        const bounce = Math.sin(landing * Math.PI) * 0.46
        mesh.rotation.x += 0.042 * (1.35 - landing * 0.55)
        mesh.rotation.y += 0.052 * (1.2 - landing * 0.45)
        mesh.rotation.z += 0.021
        mesh.position.y = bounce - 0.08
        mesh.scale.setScalar(0.84 + landing * 0.18)
        shadow.scale.set(1.15 + landing * 0.45, 0.22 + landing * 0.12, 1)
        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(animate)
      }
      animate()

      cleanup = () => {
        window.cancelAnimationFrame(frameId)
        resizeObserver.disconnect()
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        host.replaceChildren()
      }
    }

    void mount()

    return () => {
      disposed = true
      cleanup()
    }
  }, [color, type])

  return (
    <span
      className={`dice-roll-3d dice-roll-3d--${size}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <span className="dice-roll-3d__host" ref={hostRef} />
      {label ? <span className="dice-roll-3d__label">{label}</span> : null}
    </span>
  )
}
