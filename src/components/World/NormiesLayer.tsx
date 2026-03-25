'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useWorldStore } from '@/store/worldStore'
import NormieSprite from './NormieSprite'
import NormiesPointsCloud from './NormiesPointsCloud'
import type { NormieState } from '@/store/worldStore'

const SPRITE_DISTANCE = 23  // Only show sprites when very close to surface
const MAX_SPRITES     = 4   // Central normie + 3 nearest neighbours
const DEG2RAD = Math.PI / 180
const LOD_REFRESH = 15      // recalculate visible set every N frames
const SIM_EVERY   = 2       // tick simulation every N frames
const PROX_EVERY  = 120     // proximity/collision check every N frames

function sphereVec(lat: number, lon: number): [number, number, number] {
  const phi   = (90 - lat) * DEG2RAD
  const theta = (lon + 180) * DEG2RAD
  return [
    -Math.sin(phi) * Math.cos(theta),
     Math.cos(phi),
     Math.sin(phi) * Math.sin(theta),
  ]
}

function angDeg(latA: number, lonA: number, latB: number, lonB: number): number {
  const [ax, ay, az] = sphereVec(latA, lonA)
  const [bx, by, bz] = sphereVec(latB, lonB)
  const dot = Math.min(1, Math.max(-1, ax*bx + ay*by + az*bz))
  return Math.acos(dot) * (180 / Math.PI)
}

export default function NormiesLayer() {
  const { normies, focusedNormieId, followedNormieId, setFollowedNormieId, tick } = useWorldStore()
  const { camera } = useThree()

  const frameRef    = useRef(0)
  const deltaAccum  = useRef(0)
  const lookDir     = useRef(new THREE.Vector3())
  const [batch, setBatch]           = useState<NormieState[]>([])
  const [spriteMode, setSpriteMode] = useState(false)

  useFrame((state, delta) => {
    if (normies.length === 0) return

    frameRef.current++
    deltaAccum.current += delta

    // Tick simulation every SIM_EVERY frames
    if (frameRef.current % SIM_EVERY === 0) {
      const skipProx = frameRef.current % PROX_EVERY !== 0
      tick(deltaAccum.current, skipProx)
      deltaAccum.current = 0
    }

    // Recalculate LOD every LOD_REFRESH frames
    if (frameRef.current % LOD_REFRESH !== 0) return

    const dist = state.camera.position.length()
    const inSprite = dist <= SPRITE_DISTANCE || followedNormieId !== null || focusedNormieId !== null

    if (inSprite && normies.length > 0) {
      // Camera look direction (world space)
      lookDir.current.set(0, 0, -1).applyQuaternion(state.camera.quaternion)
      const lx = lookDir.current.x, ly = lookDir.current.y, lz = lookDir.current.z

      // Priority overrides: followed/focused normie is always the "center"
      let centerNormie: NormieState | null = null
      if (followedNormieId !== null) centerNormie = normies.find(n => n.id === followedNormieId) ?? null
      if (!centerNormie && focusedNormieId !== null) centerNormie = normies.find(n => n.id === focusedNormieId) ?? null

      if (!centerNormie) {
        // Find the normie whose sphere position best aligns with camera look direction
        let bestDot = -Infinity
        for (const n of normies) {
          const [nx, ny, nz] = sphereVec(n.lat, n.lon)
          const d = nx*lx + ny*ly + nz*lz
          if (d > bestDot) { bestDot = d; centerNormie = n }
        }
      }

      if (!centerNormie) { setSpriteMode(false); return }

      // 3 nearest neighbours by angular distance to center normie
      const neighbours = normies
        .filter(n => n.id !== centerNormie!.id)
        .map(n => ({ n, d: angDeg(n.lat, n.lon, centerNormie!.lat, centerNormie!.lon) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_SPRITES - 1)
        .map(x => x.n)

      setBatch([centerNormie, ...neighbours])
    } else {
      setBatch([])
    }

    setSpriteMode(inSprite)
  })

  if (normies.length === 0) return null

  return (
    <group>
      {/* Always render the fast points cloud (macro view) */}
      <NormiesPointsCloud onClick={(id) => setFollowedNormieId(id)} />
      {/* Render up to 4 sprites only when very zoomed in */}
      {spriteMode && batch.map(normie => (
        <NormieSprite key={normie.id} normie={normie} />
      ))}
    </group>
  )
}
