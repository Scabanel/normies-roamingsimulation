'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD_MAP, MAP_WIDTH, MAP_HEIGHT } from '@/lib/worldMapData'

// Colors - Normies DA palette
const OCEAN_COLOR = new THREE.Color(0x0d1117)
const LAND_COLOR = new THREE.Color(0x2a2a2a)

const WORLD_SCALE_X = 120
const WORLD_SCALE_Z = 60
const CELL_SIZE = WORLD_SCALE_X / MAP_WIDTH // 1.0
const LAND_HEIGHT = 0.3

export default function WorldMap() {
  const oceanRef = useRef<THREE.Mesh>(null)

  // Build land mesh using instanced geometry
  const { landPositions, landCount } = useMemo(() => {
    const positions: number[] = []

    for (let z = 0; z < MAP_HEIGHT; z++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (WORLD_MAP[z][x] === 1) {
          const wx = (x / MAP_WIDTH) * WORLD_SCALE_X - WORLD_SCALE_X / 2 + CELL_SIZE / 2
          const wz = (z / MAP_HEIGHT) * WORLD_SCALE_Z - WORLD_SCALE_Z / 2 + CELL_SIZE / 2
          positions.push(wx, LAND_HEIGHT / 2, wz)
        }
      }
    }

    return {
      landPositions: new Float32Array(positions),
      landCount: positions.length / 3
    }
  }, [])

  // Build instanced mesh for land tiles
  const landMesh = useMemo(() => {
    const geometry = new THREE.BoxGeometry(CELL_SIZE * 0.95, LAND_HEIGHT, CELL_SIZE * 0.95)
    const material = new THREE.MeshLambertMaterial({ color: LAND_COLOR })
    const mesh = new THREE.InstancedMesh(geometry, material, landCount)

    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()

    for (let i = 0; i < landCount; i++) {
      const x = landPositions[i * 3]
      const y = landPositions[i * 3 + 1]
      const z = landPositions[i * 3 + 2]

      matrix.setPosition(x, y, z)
      mesh.setMatrixAt(i, matrix)

      // Slight color variation for depth
      const variation = 0.85 + Math.random() * 0.15
      color.setRGB(
        LAND_COLOR.r * variation,
        LAND_COLOR.g * variation,
        LAND_COLOR.b * variation
      )
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

    return mesh
  }, [landPositions, landCount])

  // Ocean plane
  const oceanGeometry = useMemo(() =>
    new THREE.PlaneGeometry(WORLD_SCALE_X + 10, WORLD_SCALE_Z + 10, 1, 1), [])
  const oceanMaterial = useMemo(() =>
    new THREE.MeshLambertMaterial({ color: OCEAN_COLOR }), [])

  // Border/frame
  const borderGeometry = useMemo(() =>
    new THREE.EdgesGeometry(new THREE.BoxGeometry(WORLD_SCALE_X + 0.5, 0.1, WORLD_SCALE_Z + 0.5)), [])
  const borderMaterial = useMemo(() =>
    new THREE.LineBasicMaterial({ color: 0x333333 }), [])

  useFrame(({ clock }) => {
    if (oceanRef.current) {
      // Subtle ocean animation
      const mat = oceanRef.current.material as THREE.MeshLambertMaterial
      const t = clock.getElapsedTime()
      const pulse = 0.95 + Math.sin(t * 0.5) * 0.05
      mat.color.setRGB(OCEAN_COLOR.r * pulse, OCEAN_COLOR.g * pulse, OCEAN_COLOR.b * pulse)
    }
  })

  return (
    <group>
      {/* Ocean floor */}
      <mesh ref={oceanRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <primitive object={oceanGeometry} attach="geometry" />
        <primitive object={oceanMaterial} attach="material" />
      </mesh>

      {/* Land tiles */}
      <primitive object={landMesh} />

      {/* Border */}
      <lineSegments position={[0, 0, 0]}>
        <primitive object={borderGeometry} attach="geometry" />
        <primitive object={borderMaterial} attach="material" />
      </lineSegments>

      {/* Grid lines */}
      <gridHelper
        args={[WORLD_SCALE_X, MAP_WIDTH / 5, 0x1a1a1a, 0x141414]}
        position={[0, 0.05, 0]}
      />
    </group>
  )
}
