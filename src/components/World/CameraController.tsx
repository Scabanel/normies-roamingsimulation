'use client'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useWorldStore } from '@/store/worldStore'
import { latLonToVec3 } from './NormieSprite'
import { GLOBE_RADIUS } from './Globe'
import * as THREE from 'three'

const FOLLOW_DIST = GLOBE_RADIUS + 6  // camera distance from globe center when zoomed in

export default function CameraController() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { controls, camera } = useThree() as any
  const { normies, focusedNormieId, followedNormieId } = useWorldStore()
  const flyToRef = useRef<{ startPos: THREE.Vector3; endPos: THREE.Vector3; t: number } | null>(null)

  // Fly-to when followedNormieId or focusedNormieId changes
  useEffect(() => {
    const id = followedNormieId ?? focusedNormieId
    if (id === null) return
    const normie = normies.find(n => n.id === id)
    if (!normie) return

    const surfacePos = latLonToVec3(normie.lat, normie.lon, GLOBE_RADIUS)
    // Place camera along the outward normal — target stays at [0,0,0]
    const endPos = surfacePos.clone().normalize().multiplyScalar(FOLLOW_DIST)

    flyToRef.current = {
      startPos: camera.position.clone(),
      endPos,
      t: 0,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followedNormieId, focusedNormieId])

  useFrame(() => {
    if (!flyToRef.current) return
    const fly = flyToRef.current
    fly.t = Math.min(fly.t + 0.025, 1)
    const ease = fly.t * fly.t * (3 - 2 * fly.t)
    camera.position.lerpVectors(fly.startPos, fly.endPos, ease)
    camera.lookAt(0, 0, 0)
    if (controls) {
      // Keep OrbitControls synced — target always stays at globe center
      controls.target.set(0, 0, 0)
      controls.update()
    }
    if (fly.t >= 1) flyToRef.current = null
  })

  return null
}
