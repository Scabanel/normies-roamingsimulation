'use client'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useWorldStore } from '@/store/worldStore'
import { latLonToVec3 } from './NormieSprite'
import { GLOBE_RADIUS } from './Globe'
import * as THREE from 'three'

export default function CameraController() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { controls, camera } = useThree() as any
  const { normies, focusedNormieId, followedNormieId } = useWorldStore()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const flyToRef = useRef<{ startPos: THREE.Vector3; endPos: THREE.Vector3; t: number } | null>(null)

  // Fly-to when followedNormieId changes
  useEffect(() => {
    const id = followedNormieId ?? focusedNormieId
    if (id === null) return
    const normie = normies.find(n => n.id === id)
    if (!normie) return

    const surfacePos = latLonToVec3(normie.lat, normie.lon, GLOBE_RADIUS)
    const normal = surfacePos.clone().normalize()
    // End position: 6 units above surface (radius 26 from center)
    const endPos = surfacePos.clone().addScaledVector(normal, 6)

    flyToRef.current = {
      startPos: camera.position.clone(),
      endPos,
      t: 0,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followedNormieId, focusedNormieId])

  useFrame(() => {
    // Fly-to animation
    if (flyToRef.current) {
      const fly = flyToRef.current
      fly.t = Math.min(fly.t + 0.02, 1)
      const ease = fly.t * fly.t * (3 - 2 * fly.t)
      camera.position.lerpVectors(fly.startPos, fly.endPos, ease)
      camera.lookAt(0, 0, 0)
      if (fly.t >= 1) flyToRef.current = null
      return
    }

    // Continuous follow for followedNormieId
    if (!controls || followedNormieId === null) return
    const normie = normies.find(n => n.id === followedNormieId)
    if (!normie) return

    const surfacePos = latLonToVec3(normie.lat, normie.lon, GLOBE_RADIUS)
    targetRef.current.lerp(surfacePos, 0.04)
    controls.target.copy(targetRef.current)

    // Keep camera within ~26 units of globe center
    const distFromCenter = camera.position.length()
    if (distFromCenter > 27) {
      camera.position.multiplyScalar(26 / distFromCenter)
    }

    controls.update()
  })

  return null
}
