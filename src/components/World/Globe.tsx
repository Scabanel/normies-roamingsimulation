'use client'

import { useState, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export const GLOBE_RADIUS = 20

// Async: fetch real TopoJSON world data and render with d3-geo at 2048×1024
async function buildGlobeTexture(maxAnisotropy: number): Promise<THREE.CanvasTexture> {
  const TEX_W = 2048
  const TEX_H = 1024

  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!

  // Ocean background
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  const [topojson, d3geo, worldData] = await Promise.all([
    import('topojson-client'),
    import('d3-geo'),
    fetch('/world-110m.json').then(r => r.json()),
  ])

  const projection = d3geo.geoEquirectangular()
    .scale(TEX_W / (2 * Math.PI))
    .translate([TEX_W / 2, TEX_H / 2])

  const path = d3geo.geoPath(projection, ctx)

  // 1. Fill land - #E2E5E4
  const land = topojson.feature(worldData, worldData.objects.land)
  ctx.fillStyle = '#E2E5E4'
  ctx.beginPath()
  path(land as Parameters<typeof path>[0])
  ctx.fill()

  // 2. Country interior borders - #484A4B, lineWidth 1.5
  const countryBorders = topojson.mesh(
    worldData,
    worldData.objects.countries,
    (a: unknown, b: unknown) => a !== b,
  )
  ctx.strokeStyle = '#484A4B'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  path(countryBorders as Parameters<typeof path>[0])
  ctx.stroke()

  // 3. Coastlines (outer continent borders) - #484A4B, lineWidth 2.5
  const coastlines = topojson.mesh(
    worldData,
    worldData.objects.countries,
    (a: unknown, b: unknown) => a === b,
  )
  ctx.strokeStyle = '#484A4B'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  path(coastlines as Parameters<typeof path>[0])
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.anisotropy = Math.min(4, maxAnisotropy)
  texture.needsUpdate = true
  return texture
}

// Minimal ocean-only fallback while the real texture loads
function buildFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, 2, 2)
  return new THREE.CanvasTexture(canvas)
}

export default function Globe() {
  const { gl } = useThree()
  const [texture, setTexture] = useState<THREE.Texture>(() => buildFallbackTexture())

  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy()
    buildGlobeTexture(maxAnisotropy).then(t => setTexture(t))
  }, [gl])

  const globeGeometry = useMemo(() => new THREE.SphereGeometry(GLOBE_RADIUS, 72, 72), [])

  const globeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.0,
      }),
    [texture],
  )

  // Rim atmosphere - BackSide sphere slightly larger, #E2E5E4 at very low opacity
  const atmosGeometry = useMemo(() => new THREE.SphereGeometry(GLOBE_RADIUS + 0.4, 64, 64), [])
  const atmosMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#E2E5E4'),
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
      }),
    [],
  )

  return (
    <group>
      <mesh geometry={globeGeometry} material={globeMaterial} />
      <mesh geometry={atmosGeometry} material={atmosMaterial} />
    </group>
  )
}
