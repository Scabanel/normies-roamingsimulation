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

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      <Suspense fallback={<LoadingScreen />}>
        <WorldScene />
      </Suspense>
      <EscHandler />
      <LoadingOverlay />
      <Header />
      <EscHint />
      <NormieCard />
      <DayNightClock />
      <FindMyNormie />
    </main>
  )
}
