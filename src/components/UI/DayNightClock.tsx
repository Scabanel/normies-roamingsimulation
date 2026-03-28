'use client'
import { useEffect, useState } from 'react'
import { updateSunPosition, isNighttime } from '@/lib/daynight'
import { useWorldStore } from '@/store/worldStore'

// 5-row × 3-col pixel digit patterns
const DIGITS: Record<string, number[]> = {
  '0': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1],
  '1': [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1],
  '2': [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1],
  '3': [1,1,1, 0,0,1, 0,1,1, 0,0,1, 1,1,1],
  '4': [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1],
  '5': [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1],
  '6': [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1],
  '7': [1,1,1, 0,0,1, 0,0,1, 0,1,0, 0,1,0],
  '8': [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1],
  '9': [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1],
}

const PX_W = 4
const PX_H = 6
const PX_GAP = 2
const ON_COLOR = '#e5e7eb'
const OFF_COLOR = '#1f2937'
const DIM_COLOR = '#374151'

function PixelDigit({ ch, dim }: { ch: string; dim?: boolean }) {
  const pattern = DIGITS[ch] ?? DIGITS['0']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${PX_W}px)`, gap: `${PX_GAP}px` }}>
      {pattern.map((on, i) => (
        <div key={i} style={{ width: PX_W, height: PX_H, background: on ? (dim ? DIM_COLOR : ON_COLOR) : OFF_COLOR, borderRadius: 1 }} />
      ))}
    </div>
  )
}

function PixelColon({ blink }: { blink: boolean }) {
  const h = 5 * PX_H + 4 * PX_GAP
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: h, paddingTop: 4, paddingBottom: 4 }}>
      <div style={{ width: PX_W, height: PX_H, background: blink ? ON_COLOR : OFF_COLOR, borderRadius: 1 }} />
      <div style={{ width: PX_W, height: PX_H, background: blink ? ON_COLOR : OFF_COLOR, borderRadius: 1 }} />
    </div>
  )
}

export default function DayNightClock() {
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)
  const normies = useWorldStore(s => s.normies)

  useEffect(() => {
    setMounted(true)
    updateSunPosition()
    const id = setInterval(() => {
      updateSunPosition()
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  void tick

  const now = new Date()
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const blink = mounted ? now.getUTCSeconds() % 2 === 0 : true

  const total = normies.length
  const asleep = mounted && total > 0
    ? normies.filter(n => n.type !== 'Alien' && isNighttime(n.lat, n.lon)).length
    : 0
  const awake = total - asleep

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 20,
      background: '#111827',
      border: '1px solid #374151',
      borderRadius: 8,
      padding: '12px 16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Left: pixel clock + timezone */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: PX_GAP * 2 }}>
          {mounted ? (
            <>
              <PixelDigit ch={hh[0]} />
              <PixelDigit ch={hh[1]} />
              <PixelColon blink={blink} />
              <PixelDigit ch={mm[0]} />
              <PixelDigit ch={mm[1]} />
            </>
          ) : (
            <>
              <PixelDigit ch="0" dim />
              <PixelDigit ch="0" dim />
              <PixelColon blink={false} />
              <PixelDigit ch="0" dim />
              <PixelDigit ch="0" dim />
            </>
          )}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          UTC
        </div>
      </div>

      {/* Divider */}
      {mounted && total > 0 && (
        <div style={{ width: 1, alignSelf: 'stretch', background: '#1f2937', flexShrink: 0 }} />
      )}

      {/* Right: awake / sleeping + daily reset hint */}
      {mounted && total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, background: '#ca8a04', borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', flex: 1 }}>Awake</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#d1d5db', fontVariantNumeric: 'tabular-nums', marginLeft: 8 }}>{awake.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, background: '#374151', borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4b5563', flex: 1 }}>Sleeping</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280', fontVariantNumeric: 'tabular-nums', marginLeft: 8 }}>{asleep.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: 2, fontFamily: 'monospace', fontSize: 8, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            World resets at midnight UTC
          </div>
        </div>
      )}
    </div>
  )
}
