'use client'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/store/worldStore'
import { GLOBE_RADIUS } from './Globe'

const DEG2RAD = Math.PI / 180
const ARC_R   = GLOBE_RADIUS + 0.5  // slightly above globe surface

// Each arc: 20 segments, draw every other one → 10 dashes per flight route
const ARC_SEGS  = 20
const MAX_ARCS  = 600   // max simultaneous flight arcs (large enough for group flights)

function sphPos(lat: number, lon: number, r: number): [number, number, number] {
  const phi   = (90 - lat) * DEG2RAD
  const theta = (lon + 180) * DEG2RAD
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ]
}

export default function FlightLayer() {
  // Pre-allocated buffers for arc line-segments and plane dot markers
  const arcPositions   = useMemo(() => new Float32Array(MAX_ARCS * ARC_SEGS * 3), [])  // each "dash" = 2 vertices, but we pack separately
  const planePositions = useMemo(() => new Float32Array(MAX_ARCS * 3), [])

  const arcGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3))
    return g
  }, [arcPositions])

  const planeGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(planePositions, 3))
    return g
  }, [planePositions])

  const arcMat = useMemo(() => new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.22,
    transparent: true,
  }), [])

  const planeMat = useMemo(() => new THREE.PointsMaterial({
    color: 0xffcc00,
    size: 5,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.95,
  }), [])

  useFrame(() => {
    const { normies } = useWorldStore.getState()
    const flying = normies.filter(n => n.travelState === 'flying')

    let arcI   = 0
    let planeI = 0

    for (const n of flying) {
      if (planeI / 3 >= MAX_ARCS) break

      // Draw dashed arc: render only even-numbered segments (skip odd = gaps)
      for (let s = 0; s < ARC_SEGS; s++) {
        if (s % 2 !== 0) continue  // skip odd segments = dashed effect
        if (arcI / 3 + 2 > arcPositions.length / 3) break

        const t0 = s / ARC_SEGS
        const t1 = (s + 1) / ARC_SEGS
        const lat0 = n.travelFromLat + (n.travelToLat - n.travelFromLat) * t0
        const lon0 = n.travelFromLon + (n.travelToLon - n.travelFromLon) * t0
        const lat1 = n.travelFromLat + (n.travelToLat - n.travelFromLat) * t1
        const lon1 = n.travelFromLon + (n.travelToLon - n.travelFromLon) * t1

        const [x0, y0, z0] = sphPos(lat0, lon0, ARC_R)
        const [x1, y1, z1] = sphPos(lat1, lon1, ARC_R)
        arcPositions[arcI++] = x0; arcPositions[arcI++] = y0; arcPositions[arcI++] = z0
        arcPositions[arcI++] = x1; arcPositions[arcI++] = y1; arcPositions[arcI++] = z1
      }

      // Plane marker at current interpolated position (slightly higher than arc)
      const [px, py, pz] = sphPos(n.lat, n.lon, ARC_R + 0.2)
      planePositions[planeI++] = px
      planePositions[planeI++] = py
      planePositions[planeI++] = pz
    }

    arcGeom.attributes.position.needsUpdate = true
    arcGeom.setDrawRange(0, arcI / 3)

    planeGeom.attributes.position.needsUpdate = true
    planeGeom.setDrawRange(0, planeI / 3)
  })

  return (
    <group>
      {/* Dashed flight routes */}
      <lineSegments geometry={arcGeom} material={arcMat} />
      {/* Plane position markers */}
      <points geometry={planeGeom} material={planeMat} />
    </group>
  )
}
