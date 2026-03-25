'use client'

import { useEffect, useRef, useState } from 'react'
import { useWorldStore } from '@/store/worldStore'
import NormieWall from './NormieWall'

const PIXEL_BLOCKS   = 32
const MIN_DISPLAY_MS = 2000

const SYS_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const MONO_FONT = '"Courier New", Courier, monospace'

export default function LoadingOverlay() {
  const { isLoading, loadingProgress, totalNormiesCount, fetchedCount } = useWorldStore()
  const [visible, setVisible]         = useState(true)
  const [fading, setFading]           = useState(false)
  const mountedAt                     = useRef(Date.now())
  const loadStartAt                   = useRef(Date.now())
  const [elapsed, setElapsed]         = useState(0)

  // Tick elapsed time every second
  useEffect(() => {
    if (!isLoading) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - loadStartAt.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [isLoading])

  useEffect(() => {
    if (!isLoading) {
      const delay = Math.max(0, MIN_DISPLAY_MS - (Date.now() - mountedAt.current))
      const t1 = setTimeout(() => {
        setFading(true)
        const t2 = setTimeout(() => setVisible(false), 800)
        return () => clearTimeout(t2)
      }, delay)
      return () => clearTimeout(t1)
    }
  }, [isLoading])

  if (!visible) return null

  const filledBlocks = Math.floor((loadingProgress / 100) * PIXEL_BLOCKS)

  // Estimated time remaining (linear extrapolation from progress + elapsed)
  let etaLabel = ''
  if (loadingProgress > 5 && loadingProgress < 99 && elapsed > 1) {
    const totalEstSec = (elapsed / loadingProgress) * 100
    const remaining   = Math.max(1, Math.round(totalEstSec - elapsed))
    etaLabel = remaining >= 60
      ? `~${Math.floor(remaining / 60)}m ${remaining % 60}s`
      : `~${remaining}s`
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: '#0c0c0c',
        overflow: 'hidden',
        transition: 'opacity 0.8s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
        fontFamily: SYS_FONT,
      }}
    >
      {/* Normie wall — fills entire background */}
      <NormieWall
        count={500}
        opacityScale={0.35}
        cellSize="clamp(52px, 5.5vw, 78px)"
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Dark overlay + radial vignette pour lisibilité */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'rgba(12,12,12,0.72)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(12,12,12,0.0) 0%, rgba(12,12,12,0.55) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
        padding: '0 24px',
      }}>

        {/* Eyebrow */}
        <p style={{
          fontFamily: MONO_FONT,
          fontSize: 'clamp(9px, 1vw, 11px)',
          color: '#555',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          marginBottom: 'clamp(16px, 2vw, 28px)',
        }}>
          It&apos;s a Normie World
        </p>

        {/* Subtitle */}
        <p style={{
          fontFamily: MONO_FONT,
          fontSize: 'clamp(10px, 1.1vw, 13px)',
          color: '#484A4B',
          letterSpacing: '0.12em',
          marginBottom: 'clamp(36px, 5vw, 60px)',
        }}>
          World live simulation, by @Scabanel_
        </p>

        {/* Progress bar — pixel blocks */}
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: PIXEL_BLOCKS }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 'clamp(8px, 1vw, 14px)',
                height: 'clamp(18px, 2.5vw, 28px)',
                background: i < filledBlocks ? '#e2e5e4' : '#1e1e1e',
                transition: 'background 0.1s',
                transitionDelay: `${i * 6}ms`,
              }}
            />
          ))}
        </div>

        {/* Counter + ETA */}
        <p style={{
          marginTop: 'clamp(12px, 1.5vw, 20px)',
          fontFamily: MONO_FONT,
          fontSize: 'clamp(11px, 1.1vw, 14px)',
          color: '#484A4B',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.06em',
          textAlign: 'center',
        }}>
          {fetchedCount > 0 ? (
            <>
              {fetchedCount.toLocaleString()}
              {totalNormiesCount > 0 ? ` / ${totalNormiesCount.toLocaleString()}` : ''}
              {' normies · '}{loadingProgress}%
              {etaLabel && (
                <span style={{ color: '#333', marginLeft: 10 }}>{etaLabel}</span>
              )}
            </>
          ) : (
            <span>Connecting...</span>
          )}
        </p>
      </div>
    </div>
  )
}
