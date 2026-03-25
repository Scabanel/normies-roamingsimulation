'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { NormieState, TravelState } from '@/store/worldStore'
import { useWorldStore } from '@/store/worldStore'
import { getRandomDialogue } from '@/lib/dialogues'
import type { NormieType } from '@/lib/dialogues'
import { GLOBE_RADIUS } from './Globe'

// Type to color mapping
const TYPE_COLORS: Record<string, [number, number, number]> = {
  Human: [0.2, 0.4, 1.0],     // Blue
  Alien: [0.6, 0.2, 1.0],     // Purple
  Cat: [1.0, 0.5, 0.1],       // Orange
  Agent: [0.9, 0.1, 0.1],     // Red
  THE100: [1.0, 0.84, 0.0],   // Gold
}

const TYPE_GLOW: Record<string, string> = {
  Human: '#3366ff',
  Alien: '#9933ff',
  Cat: '#ff8800',
  Agent: '#cc1111',
  THE100: '#FFD700',
}

const BORDER_COLOR: Record<string, string> = {
  Human:  '#3377FF',
  Alien:  '#AA33FF',
  Cat:    '#FF8800',
  Agent:  '#cc1111',
  THE100: '#FFD700',
}

/** Convert lat/lon degrees to a THREE.Vector3 on the sphere surface at radius r. */
export function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),  // negated to match Three.js SphereGeometry UV
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

/** Great-circle arc position for flying normies */
function flyingPosition(n: NormieState): THREE.Vector3 {
  const t = n.travelProgress
  const fromVec = latLonToVec3(n.travelFromLat, n.travelFromLon, GLOBE_RADIUS + 0.4)
  const toVec = latLonToVec3(n.travelToLat, n.travelToLon, GLOBE_RADIUS + 0.4)
  // SLERP for great circle
  const base = new THREE.Vector3().copy(fromVec).lerp(toVec, t).normalize()
  const arcHeight = Math.sin(Math.PI * t) * 8
  return base.multiplyScalar(GLOBE_RADIUS + 0.4 + arcHeight)
}

// Suppress unused import
void (undefined as unknown as TravelState)

interface NormieSpriteProps {
  normie: NormieState
}

export default function NormieSprite({ normie }: NormieSpriteProps) {
  const groupRef = useRef<THREE.Group>(null)
  const goldRingRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const { updateNormie, setFocusedNormieId, focusedNormieId } = useWorldStore()

  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [textureLoaded, setTextureLoaded] = useState(false)

  const color = TYPE_COLORS[normie.type] ?? TYPE_COLORS.Human
  const isThe100 = normie.isThe100

  const loadTexture = useCallback(() => {
    if (textureLoaded) return
    const loader = new THREE.TextureLoader()
    loader.load(
      normie.imageUrl,
      (tex) => {
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        setTexture(tex)
        setTextureLoaded(true)
      },
      undefined,
      () => setTextureLoaded(true) // fail silently
    )
  }, [normie.imageUrl, textureLoaded])

  const material = useMemo(() => {
    if (texture) {
      return new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
      })
    }
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(...color),
      transparent: true,
      opacity: 0.9,
    })
  }, [texture, color])

  const borderMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(BORDER_COLOR[normie.type] ?? '#ffffff'),
  }), [normie.type])

  const goldRingMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FFD700'),
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  }), [])

  const isFocused = focusedNormieId === normie.id

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    const ts = normie.travelState

    // Determine position based on travel state
    let pos: THREE.Vector3
    let opacity = 1

    if (ts === 'flying') {
      pos = flyingPosition(normie)
    } else if (ts === 'teleporting') {
      pos = latLonToVec3(normie.lat, normie.lon, GLOBE_RADIUS + 0.4)
      const t = normie.travelProgress
      opacity = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2
    } else if (ts === 'underground') {
      pos = latLonToVec3(normie.lat, normie.lon, GLOBE_RADIUS + 0.4)
      opacity = 0
    } else {
      // grounded
      const surfaceRadius = GLOBE_RADIUS + 0.4
      const base = latLonToVec3(normie.lat, normie.lon, surfaceRadius)
      const bob = Math.sin(clock.getElapsedTime() * 2 + normie.id) * 0.05
      const normal = base.clone().normalize()
      pos = base.clone().addScaledVector(normal, bob)
    }

    groupRef.current.position.copy(pos)
    groupRef.current.visible = opacity > 0.01

    // Apply opacity to main material
    if (material) {
      material.opacity = opacity * (texture ? 1.0 : 0.9)
    }

    // Check distance to camera for texture loading
    const dist = camera.position.distanceTo(pos)
    if (dist < 45 && !textureLoaded) {
      loadTexture()
    }

    // Randomly trigger talking (solo monologue)
    if (!normie.inConversation && ts === 'grounded' && Math.random() < 0.0005) {
      const dialogue = getRandomDialogue(normie.type as NormieType)
      updateNormie(normie.id, {
        isTalking: true,
        currentDialogue: dialogue,
        dialogueTimer: 3,
      })
    }

    // Gold ring pulse for THE100
    if (goldRingRef.current && isThe100) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.5 + normie.id * 0.7) * 0.12
      goldRingRef.current.scale.setScalar(pulse)
    }
  })

  const spriteSize = (isThe100 || isFocused) ? 0.75 : 0.55
  const bubbleOpacity = normie.inConversation ? 1.0 : 0.85
  const bubbleFontSize = normie.inConversation ? 0.18 : 0.15

  return (
    <group ref={groupRef}>
      {/* Billboard sprite — always faces camera */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        {/* Type color border — rendered behind sprite */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[spriteSize + 0.18, spriteSize + 0.18]} />
          <primitive object={borderMaterial} attach="material" />
        </mesh>

        {/* THE100 golden outer ring */}
        {isThe100 && (
          <mesh ref={goldRingRef}>
            <ringGeometry args={[spriteSize * 0.55, spriteSize * 0.68, 24]} />
            <primitive object={goldRingMaterial} attach="material" />
          </mesh>
        )}

        <mesh
          onClick={() => {
            setFocusedNormieId(normie.id === focusedNormieId ? null : normie.id)
          }}
        >
          <planeGeometry args={[spriteSize, spriteSize]} />
          <primitive object={material} attach="material" />
        </mesh>

        {/* Travel state indicators */}
        {normie.travelState === 'flying' && (
          <Text
            position={[0, spriteSize * 0.7, 0]}
            fontSize={0.2}
            anchorX="center"
            anchorY="bottom"
          >
            ✈️
          </Text>
        )}
        {normie.travelState === 'teleporting' && (
          <Text
            position={[0, spriteSize * 0.7, 0]}
            fontSize={0.2}
            anchorX="center"
            anchorY="bottom"
          >
            ✨
          </Text>
        )}

        {/* Speech bubble */}
        {normie.isTalking && normie.currentDialogue && normie.travelState !== 'underground' && (
          <group position={[0, spriteSize * 0.8, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={bubbleFontSize}
              color="white"
              anchorX="center"
              anchorY="bottom"
              maxWidth={3.5}
              textAlign="center"
              outlineWidth={0.025}
              outlineColor="black"
              fillOpacity={bubbleOpacity}
            >
              {normie.currentDialogue}
            </Text>
          </group>
        )}

        {/* Name tag when focused */}
        {isFocused && (
          <Text
            position={[0, -spriteSize * 0.6, 0]}
            fontSize={0.12}
            color={TYPE_GLOW[normie.type] ?? '#ffffff'}
            anchorX="center"
            anchorY="top"
          >
            {normie.name}
          </Text>
        )}
      </Billboard>
    </group>
  )
}
