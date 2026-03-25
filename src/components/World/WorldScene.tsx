'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Suspense } from 'react'
import Globe from './Globe'
import NormiesLayer from './NormiesLayer'
import NormiesLoader from './NormiesLoader'
import BasementMarkers from './BasementMarkers'
import CameraController from './CameraController'
import SpaceEffects from './SpaceEffects'
import SunLight from './SunLight'
import FlightLayer from './FlightLayer'

export default function WorldScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 60], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        style={{ background: '#000000' }}
      >
        <color attach="background" args={['#000000']} />

        <SunLight />

        <Stars radius={200} depth={50} count={3000} factor={2} saturation={0} fade />

        <Suspense fallback={null}>
          <SpaceEffects />
          <Globe />
          <NormiesLayer />
          <FlightLayer />
          <NormiesLoader />
          <BasementMarkers />
          <CameraController />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={22}
          maxDistance={100}
        />
      </Canvas>
    </div>
  )
}
