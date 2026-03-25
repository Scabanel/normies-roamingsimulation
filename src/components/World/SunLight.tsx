'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getSunPosition3D, updateSunPosition } from '@/lib/daynight'

/**
 * Directional light that follows the real sun position.
 * Updates once per second to match the day/night calculation.
 */
export default function SunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const lastUpdate = useRef(0)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // Update light position at most once per second
    if (t - lastUpdate.current < 1) return
    lastUpdate.current = t

    updateSunPosition()
    const [x, y, z] = getSunPosition3D(80)
    if (lightRef.current) {
      lightRef.current.position.set(x, y, z)
    }
  })

  const [ix, iy, iz] = getSunPosition3D(80)

  return (
    <>
      {/* Sun: bright directional light from real sun position */}
      <directionalLight
        ref={lightRef}
        position={[ix, iy, iz]}
        intensity={1.4}
        color="#fff5e0"
      />
      {/* Ambient: low fill light so the dark side isn't pitch black */}
      <ambientLight intensity={0.12} color="#1a2040" />
    </>
  )
}
