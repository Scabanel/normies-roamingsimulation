'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TWINKLE_GROUPS = 8
const STARS_PER_GROUP = 35
const TWINKLE_RADIUS = 185

function makeTwinklePositions(count: number) {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = TWINKLE_RADIUS + Math.random() * 15
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)
  }
  return pos
}

export default function SpaceEffects() {
  const twinkleMaterials = useRef<THREE.PointsMaterial[]>([])

  const twinkleData = useMemo(() => {
    return Array.from({ length: TWINKLE_GROUPS }, (_, g) => {
      const positions = makeTwinklePositions(STARS_PER_GROUP)
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.5 + (g / TWINKLE_GROUPS) * 0.4,
      })
      return { geo, mat, phase: (g / TWINKLE_GROUPS) * Math.PI * 2 }
    })
  }, [])

  useMemo(() => {
    twinkleMaterials.current = twinkleData.map(d => d.mat)
  }, [twinkleData])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    for (let g = 0; g < TWINKLE_GROUPS; g++) {
      const mat = twinkleMaterials.current[g]
      if (!mat) continue
      mat.opacity = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.7 + twinkleData[g].phase))
    }
  })

  return (
    <group>
      {twinkleData.map((d, i) => (
        <points key={`twinkle-${i}`} geometry={d.geo} material={d.mat} />
      ))}
    </group>
  )
}
