'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLOBE_RADIUS } from './Globe'
import { useWorldStore } from '@/store/worldStore'
import { isNighttime } from '@/lib/daynight'

const DEG2RAD = Math.PI / 180

const TYPE_RGB: Record<string, [number, number, number]> = {
  Human:  [0.15, 0.55, 1.00],
  Alien:  [0.75, 0.10, 1.00],
  Cat:    [1.00, 0.50, 0.00],
  Agent:  [0.90, 0.10, 0.10],
}
const FLYING_RGB: [number, number, number] = [0.10, 0.90, 0.35]

const MAX_POINTS = 12000

export default function NormiesPointsCloud({ onClick }: { onClick?: (normieId: number) => void }) {
  const pointsRef = useRef<THREE.Points>(null)

  const posArr = useMemo(() => new Float32Array(MAX_POINTS * 3), [])
  const colArr = useMemo(() => new Float32Array(MAX_POINTS * 3), [])
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colArr, 3))
    return geo
  }, [posArr, colArr])
  const material = useMemo(() => new THREE.PointsMaterial({
    size: 4, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 1.0,
  }), [])

  useFrame(() => {
    const { normies } = useWorldStore.getState()
    const total = Math.min(normies.length, MAX_POINTS)
    const R = GLOBE_RADIUS + 0.25

    let count = 0

    for (let i = 0; i < total; i++) {
      const nm = normies[i]
      const sleeping = nm.type !== 'Alien' && isNighttime(nm.lat, nm.lon) && nm.travelState === 'grounded'
      if (sleeping) continue

      const phi   = (90 - nm.lat) * DEG2RAD
      const theta = (nm.lon + 180) * DEG2RAD
      const x = -R * Math.sin(phi) * Math.cos(theta)
      const y =  R * Math.cos(phi)
      const z =  R * Math.sin(phi) * Math.sin(theta)

      posArr[count * 3]     = x
      posArr[count * 3 + 1] = y
      posArr[count * 3 + 2] = z

      const c: [number, number, number] = nm.travelState === 'flying'
        ? FLYING_RGB
        : (TYPE_RGB[nm.type] ?? TYPE_RGB.Human)
      colArr[count * 3]     = c[0]
      colArr[count * 3 + 1] = c[1]
      colArr[count * 3 + 2] = c[2]
      count++
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate    = true
    geometry.setDrawRange(0, count)
  })

  const handleClick = (e: THREE.Event & { point?: THREE.Vector3; stopPropagation?: () => void }) => {
    const { normies } = useWorldStore.getState()
    if (!onClick || normies.length === 0) return
    if (e.stopPropagation) e.stopPropagation()
    const pt = (e as unknown as { point: THREE.Vector3 }).point
    if (!pt) return
    let minDist = Infinity
    let closest = -1
    const R = GLOBE_RADIUS + 0.25
    for (let i = 0; i < normies.length; i++) {
      const nm = normies[i]
      const sleeping = nm.type !== 'Alien' && isNighttime(nm.lat, nm.lon) && nm.travelState === 'grounded'
      if (sleeping) continue
      const phi   = (90 - nm.lat) * DEG2RAD
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
    <points ref={pointsRef} geometry={geometry} material={material}
      onClick={handleClick as unknown as (event: THREE.Event) => void} />
  )
}
