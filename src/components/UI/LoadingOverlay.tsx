'use client'

import { useEffect, useState } from 'react'
import { useWorldStore } from '@/store/worldStore'

const PIXEL_BLOCKS = 48

export default function LoadingOverlay() {
  const { isLoading, loadingProgress, totalNormiesCount, fetchedCount } = useWorldStore()
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setFading(true)
      const t = setTimeout(() => setVisible(false), 800)
      return () => clearTimeout(t)
    }
  }, [isLoading])

  if (!visible) return null

  const filledBlocks = Math.floor((loadingProgress / 100) * PIXEL_BLOCKS)

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
      style={{
        transition: 'opacity 0.8s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Title */}
      <div className="font-mono text-[#E2E5E4] text-xs tracking-[0.3em] uppercase mb-1">
        Normies World
      </div>
      <div className="font-mono text-[#484A4B] text-[10px] tracking-widest uppercase mb-10">
        Simulation
      </div>

      {/* Pixel avatar placeholder */}
      <div className="grid grid-cols-8 gap-px mb-10 opacity-40">
        {[
          0,0,1,1,1,1,0,0,
          0,1,1,1,1,1,1,0,
          1,1,0,1,1,0,1,1,
          1,1,1,1,1,1,1,1,
          0,1,1,0,0,1,1,0,
          0,1,0,1,1,0,1,0,
          0,0,1,1,1,1,0,0,
          0,0,0,1,1,0,0,0,
        ].map((px, i) => (
          <div
            key={i}
            className="w-2 h-2"
            style={{ background: px ? '#E2E5E4' : 'transparent' }}
          />
        ))}
      </div>

      {/* Loading message */}
      <div className="font-mono text-[#E2E5E4] text-sm mb-1 text-center px-8">
        Opening Normies World Simulation...
      </div>
      <div className="font-mono text-[#484A4B] text-xs mb-8 tracking-wider">
        one pixel at a time
      </div>

      {/* Pixel progress bar */}
      <div className="flex gap-px mb-3">
        {Array.from({ length: PIXEL_BLOCKS }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-4 transition-colors duration-100"
            style={{
              background: i < filledBlocks ? '#E2E5E4' : '#1a1a1a',
              transitionDelay: `${i * 10}ms`,
            }}
          />
        ))}
      </div>

      {/* Progress text */}
      <div className="font-mono text-[#484A4B] text-[10px] tabular-nums">
        {fetchedCount > 0 ? (
          <>
            {fetchedCount.toLocaleString()}
            {totalNormiesCount > 0 ? ` / ${totalNormiesCount.toLocaleString()}` : ''} normies fetched
            {' · '}{loadingProgress}%
          </>
        ) : (
          <span className="animate-pulse">Connecting to chain...</span>
        )}
      </div>
    </div>
  )
}
