'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Twinkling stars: 8 groups with different sine phases ──────────────────────
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

// ── Comets: 2 comets that appear periodically ─────────────────────────────────
const COMET_COUNT = 2
const COMET_TRAIL = 10
const COMET_SPHERE_R = 190

interface CometState {
  start: THREE.Vector3
  dir: THREE.Vector3
  progress: number
  active: boolean
  cooldown: number
}

export default function SpaceEffects() {
  // Twinkle groups
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

  // Store mat refs for animation
  useMemo(() => {
    twinkleMaterials.current = twinkleData.map(d => d.mat)
  }, [twinkleData])

  // Comet geometries + materials
  const cometStates = useRef<CometState[]>(
    Array.from({ length: COMET_COUNT }, (_, i) => ({
      start: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      progress: 0,
      active: false,
      cooldown: i * 7 + Math.random() * 5,
    }))
  )

  const cometPosBuffers = useMemo(() =>
    Array.from({ length: COMET_COUNT }, () => new Float32Array(COMET_TRAIL * 3)), [])

  const cometGeos = useMemo(() =>
    Array.from({ length: COMET_COUNT }, (_, i) => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(cometPosBuffers[i], 3))
      geo.setDrawRange(0, 0)
      return geo
    }), [cometPosBuffers])

  const cometMats = useMemo(() =>
    Array.from({ length: COMET_COUNT }, () => new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
    })), [])

  function spawnComet(c: CometState) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    c.start.set(
      COMET_SPHERE_R * Math.sin(phi) * Math.cos(theta),
      COMET_SPHERE_R * Math.sin(phi) * Math.sin(theta),
      COMET_SPHERE_R * Math.cos(phi),
    )
    // Move tangentially (perpendicular to radial)
    const radial = c.start.clone().normalize()
    const tangent = new THREE.Vector3(
      -(Math.random() * 2 - 1),
      -(Math.random() * 2 - 1),
      -(Math.random() * 2 - 1),
    ).normalize()
    tangent.addScaledVector(radial, -tangent.dot(radial)).normalize()
    c.dir.copy(tangent)
    c.progress = 0
    c.active = true
    c.cooldown = 12 + Math.random() * 18
  }

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    // Animate twinkle groups
    for (let g = 0; g < TWINKLE_GROUPS; g++) {
      const mat = twinkleMaterials.current[g]
      if (!mat) continue
      const phase = twinkleData[g].phase
      mat.opacity = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.7 + phase))
    }

    // Animate comets
    for (let ci = 0; ci < COMET_COUNT; ci++) {
      const c = cometStates.current[ci]
      const geo = cometGeos[ci]
      const pos = cometPosBuffers[ci]

      if (!c.active) {
        c.cooldown -= delta
        if (c.cooldown <= 0) spawnComet(c)
        geo.setDrawRange(0, 0)
        continue
      }

      c.progress += delta * 80

      if (c.progress > COMET_TRAIL * 12) {
        c.active = false
        geo.setDrawRange(0, 0)
        continue
      }

      const visiblePoints = Math.min(COMET_TRAIL, Math.ceil(c.progress / 12))
      for (let j = 0; j < visiblePoints; j++) {
        const d = Math.max(0, c.progress - j * 12)
        pos[j * 3]     = c.start.x + c.dir.x * d
        pos[j * 3 + 1] = c.start.y + c.dir.y * d
        pos[j * 3 + 2] = c.start.z + c.dir.z * d
      }

      geo.attributes.position.needsUpdate = true
      geo.setDrawRange(0, visiblePoints)
    }
  })

  return (
    <group>
      {twinkleData.map((d, i) => (
        <points key={`twinkle-${i}`} geometry={d.geo} material={d.mat} />
      ))}
      {Array.from({ length: COMET_COUNT }, (_, i) => (
        <points key={`comet-${i}`} geometry={cometGeos[i]} material={cometMats[i]} />
      ))}
    </group>
  )
}
