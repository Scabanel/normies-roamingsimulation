'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLOBE_RADIUS } from './Globe'
import { useWorldStore } from '@/store/worldStore'
import { isNighttime } from '@/lib/daynight'

const DEG2RAD = Math.PI / 180

// Type colors (RGB 0-1) — kept saturated so dots read clearly on the dark globe
const TYPE_RGB: Record<string, [number, number, number]> = {
  Human:  [0.15, 0.55, 1.00],  // bright blue
  Alien:  [0.75, 0.10, 1.00],  // vivid purple
  Cat:    [1.00, 0.50, 0.00],  // vivid orange
  Agent:  [0.70, 0.70, 0.70],  // light grey (visible on dark globe)
}
const THE100_RGB: [number, number, number] = [1.00, 0.88, 0.00]  // gold for THE100 flagged normies

const MAX_POINTS = 10000

export default function NormiesPointsCloud({ onClick }: { onClick?: (normieId: number) => void }) {
  const { normies } = useWorldStore()
  const pointsRef = useRef<THREE.Points>(null)

  // Pre-allocated buffers
  const posArr = useMemo(() => new Float32Array(MAX_POINTS * 3), [])
  const colArr = useMemo(() => new Float32Array(MAX_POINTS * 3), [])

  // Build geometry once, reuse
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colArr, 3))
    return geo
  }, [posArr, colArr])

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 4,
    vertexColors: true,
    sizeAttenuation: false,  // pixels stay same size regardless of zoom
    transparent: true,
    opacity: 1.0,
  }), [])

  useFrame(() => {
    const n = Math.min(normies.length, MAX_POINTS)
    const R = GLOBE_RADIUS + 0.25

    for (let i = 0; i < n; i++) {
      const nm = normies[i]
      const phi   = (90 - nm.lat) * DEG2RAD
      const theta = (nm.lon + 180) * DEG2RAD
      posArr[i * 3]     = -R * Math.sin(phi) * Math.cos(theta)
      posArr[i * 3 + 1] =  R * Math.cos(phi)
      posArr[i * 3 + 2] =  R * Math.sin(phi) * Math.sin(theta)

      const sleeping = nm.type !== 'Alien' && isNighttime(nm.lon) && nm.travelState === 'grounded'
      if (sleeping) {
        colArr[i * 3]     = 0.25
        colArr[i * 3 + 1] = 0.25
        colArr[i * 3 + 2] = 0.30
      } else {
        const c = nm.isThe100 ? THE100_RGB : (TYPE_RGB[nm.type] ?? TYPE_RGB.Human)
        colArr[i * 3]     = c[0]
        colArr[i * 3 + 1] = c[1]
        colArr[i * 3 + 2] = c[2]
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.setDrawRange(0, n)
  })

  // Click picking
  const handleClick = (e: THREE.Event & { point?: THREE.Vector3; stopPropagation?: () => void }) => {
    if (!onClick || normies.length === 0) return
    if (e.stopPropagation) e.stopPropagation()

    // Find closest normie to click point
    const pt = (e as unknown as { point: THREE.Vector3 }).point
    if (!pt) return
    let minDist = Infinity
    let closest = -1
    const R = GLOBE_RADIUS + 0.25

    for (let i = 0; i < normies.length; i++) {
      const nm = normies[i]
      const phi = (90 - nm.lat) * DEG2RAD
      const theta = (nm.lon + 180) * DEG2RAD
      const px = -R * Math.sin(phi) * Math.cos(theta)
      const py =  R * Math.cos(phi)
      const pz =  R * Math.sin(phi) * Math.sin(theta)
      const d = (px - pt.x) ** 2 + (py - pt.y) ** 2 + (pz - pt.z) ** 2
      if (d < minDist) { minDist = d; closest = nm.id }
    }

    if (closest !== -1 && minDist < 4) onClick(closest)
  }

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onClick={handleClick as unknown as (event: THREE.Event) => void}
    />
  )
}
