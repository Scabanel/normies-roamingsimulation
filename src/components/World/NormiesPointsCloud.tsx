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
const MAX_THE100 = 200

// Vertex/fragment shaders for square THE100 dots (no circular clip)
const SQUARE_VERT = `
  uniform float pointSize;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = pointSize;
  }
`
const SQUARE_FRAG_GLOW = `
  uniform vec3 color;
  uniform float opacity;
  void main() {
    // Soft square with feathered edges for glow effect
    vec2 uv = gl_PointCoord - 0.5;
    float d = max(abs(uv.x), abs(uv.y));
    float alpha = (1.0 - smoothstep(0.35, 0.5, d)) * opacity;
    gl_FragColor = vec4(color, alpha);
  }
`
const SQUARE_FRAG_SOLID = `
  uniform vec3 color;
  uniform float opacity;
  void main() {
    // Hard-edged square
    gl_FragColor = vec4(color, opacity);
  }
`

export default function NormiesPointsCloud({ onClick }: { onClick?: (normieId: number) => void }) {
  const pointsRef = useRef<THREE.Points>(null)

  // ── Regular normies ────────────────────────────────────────────────────────
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

  // ── THE100 outer diffuse square glow ───────────────────────────────────────
  const auraPosArr = useMemo(() => new Float32Array(MAX_THE100 * 3), [])
  const auraGeom = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(auraPosArr, 3))
    return geo
  }, [auraPosArr])
  const auraMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color:     { value: new THREE.Color(0xffd060) },
      opacity:   { value: 0.45 },
      pointSize: { value: 36.0 },
    },
    vertexShader:   SQUARE_VERT,
    fragmentShader: SQUARE_FRAG_GLOW,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  }), [])

  // ── THE100 middle square glow ──────────────────────────────────────────────
  const midPosArr = useMemo(() => new Float32Array(MAX_THE100 * 3), [])
  const midGeom = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(midPosArr, 3))
    return geo
  }, [midPosArr])
  const midMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color:     { value: new THREE.Color(0xffe566) },
      opacity:   { value: 0.70 },
      pointSize: { value: 18.0 },
    },
    vertexShader:   SQUARE_VERT,
    fragmentShader: SQUARE_FRAG_GLOW,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  }), [])

  // ── THE100 inner bright square core ───────────────────────────────────────
  const innerPosArr = useMemo(() => new Float32Array(MAX_THE100 * 3), [])
  const innerGeom = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(innerPosArr, 3))
    return geo
  }, [innerPosArr])
  const innerMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color:     { value: new THREE.Color(0xfff8cc) },
      opacity:   { value: 1.0 },
      pointSize: { value: 9.0 },
    },
    vertexShader:   SQUARE_VERT,
    fragmentShader: SQUARE_FRAG_SOLID,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  }), [])

  useFrame(() => {
    const { normies } = useWorldStore.getState()
    const total = Math.min(normies.length, MAX_POINTS)
    const R = GLOBE_RADIUS + 0.25

    let count     = 0
    let auraCount = 0

    for (let i = 0; i < total; i++) {
      const nm = normies[i]
      // THE100 never sleep — always burning, always building
      const sleeping = !nm.isThe100 && nm.type !== 'Alien' && isNighttime(nm.lat, nm.lon) && nm.travelState === 'grounded'
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

      if (nm.isThe100 && auraCount < MAX_THE100) {
        auraPosArr[auraCount * 3]     = x
        auraPosArr[auraCount * 3 + 1] = y
        auraPosArr[auraCount * 3 + 2] = z
        midPosArr[auraCount * 3]      = x
        midPosArr[auraCount * 3 + 1]  = y
        midPosArr[auraCount * 3 + 2]  = z
        innerPosArr[auraCount * 3]     = x
        innerPosArr[auraCount * 3 + 1] = y
        innerPosArr[auraCount * 3 + 2] = z
        auraCount++
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate    = true
    geometry.setDrawRange(0, count)

    auraGeom.attributes.position.needsUpdate  = true
    auraGeom.setDrawRange(0, auraCount)
    midGeom.attributes.position.needsUpdate   = true
    midGeom.setDrawRange(0, auraCount)
    innerGeom.attributes.position.needsUpdate = true
    innerGeom.setDrawRange(0, auraCount)
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
      const sleeping = !nm.isThe100 && nm.type !== 'Alien' && isNighttime(nm.lat, nm.lon) && nm.travelState === 'grounded'
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
    <group>
      {/* THE100 outer diffuse square glow (back layer) */}
      <points geometry={auraGeom} material={auraMat} />
      {/* THE100 middle square glow */}
      <points geometry={midGeom} material={midMat} />
      {/* THE100 inner bright square core */}
      <points geometry={innerGeom} material={innerMat} />
      {/* All normie dots (front layer) */}
      <points ref={pointsRef} geometry={geometry} material={material}
        onClick={handleClick as unknown as (event: THREE.Event) => void} />
    </group>
  )
}
