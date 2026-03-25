'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect } from 'react'
import LoadingScreen from '@/components/UI/LoadingScreen'
import LoadingOverlay from '@/components/UI/LoadingOverlay'
import NormieCard from '@/components/UI/NormieCard'
import DayNightClock from '@/components/UI/DayNightClock'
import Header from '@/components/UI/Header'
import EscHint from '@/components/UI/EscHint'
import FindMyNormie from '@/components/UI/FindMyNormie'
import WorldUpdateBadge from '@/components/UI/WorldUpdateBadge'
import { useWorldStore } from '@/store/worldStore'

const WorldScene = dynamic(() => import('@/components/World/WorldScene'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

function EscHandler() {
  const { setFocusedNormieId, setFollowedNormieId } = useWorldStore()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusedNormieId(null)
        setFollowedNormieId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setFocusedNormieId, setFollowedNormieId])
  return null
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Globe — always mounted, never destroyed on navigation */}
      <Suspense fallback={<LoadingScreen />}>
        <WorldScene />
      </Suspense>
      <EscHandler />
      <LoadingOverlay />
      <Header />
      <EscHint />
      <NormieCard />
      <DayNightClock />
      <WorldUpdateBadge />
      <FindMyNormie />
      {/* Page-specific content (e.g. explanations overlay) renders on top */}
      {children}
    </div>
  )
}
