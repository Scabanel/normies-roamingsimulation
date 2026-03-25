'use client'
import { Billboard, Text } from '@react-three/drei'
import { BASEMENT_STATIONS } from '@/lib/worldMapData'
import { latLonToVec3 } from './NormieSprite'
import { GLOBE_RADIUS } from './Globe'

export default function BasementMarkers() {
  return (
    <>
      {BASEMENT_STATIONS.map(station => {
        const pos = latLonToVec3(station.lat, station.lon, GLOBE_RADIUS + 0.6)
        return (
          <group key={station.id} position={pos}>
            {/* Small dark square marker */}
            <Billboard>
              <mesh>
                <planeGeometry args={[0.4, 0.4]} />
                <meshBasicMaterial color="#1a1a1a" transparent opacity={0.9} />
              </mesh>
              {/* Icon */}
              <Text position={[0, 0, 0.01]} fontSize={0.2} anchorX="center" anchorY="middle">
                🕳️
              </Text>
            </Billboard>
          </group>
        )
      })}
    </>
  )
}
