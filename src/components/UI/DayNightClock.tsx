'use client'
import { useEffect, useState } from 'react'
import { getCETTime, updateSunPosition, isNighttime } from '@/lib/daynight'
import { useWorldStore } from '@/store/worldStore'

// 5-row × 3-col pixel digit patterns (row-major)
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

const PX_W = 2  // pixel block width (px)
const PX_H = 3  // pixel block height (px)
const PX_GAP = 1

const ON_COLOR = '#E2E5E4'
const OFF_COLOR = '#111111'

function PixelDigit({ ch, dim }: { ch: string; dim?: boolean }) {
  const pattern = DIGITS[ch] ?? DIGITS['0']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${PX_W}px)`, gap: `${PX_GAP}px` }}>
      {pattern.map((on, i) => (
        <div
          key={i}
          style={{
            width: PX_W,
            height: PX_H,
            background: on ? (dim ? '#484A4B' : ON_COLOR) : OFF_COLOR,
          }}
        />
      ))}
    </div>
  )
}

function PixelColon({ blink }: { blink: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: 5 * PX_H + 4 * PX_GAP, paddingTop: 3, paddingBottom: 3 }}>
      <div style={{ width: PX_W, height: PX_H, background: blink ? ON_COLOR : OFF_COLOR }} />
      <div style={{ width: PX_W, height: PX_H, background: blink ? ON_COLOR : OFF_COLOR }} />
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

  const t = getCETTime()
  const hh = String(t.hours).padStart(2, '0')
  const mm = String(t.minutes).padStart(2, '0')
  const blink = mounted ? t.seconds % 2 === 0 : true

  const total = normies.length
  const asleep = mounted && total > 0
    ? normies.filter(n => n.type !== 'Alien' && isNighttime(n.lon)).length
    : 0
  const awake = total - asleep

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-black/85 border border-gray-900 rounded p-3">
      {/* Pixel time display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: PX_GAP * 3 }}>
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

      {/* CET label */}
      <div className="font-mono text-[7px] text-[#484A4B] uppercase tracking-widest mt-1.5 text-center">
        {mounted ? `CET${t.isDST ? '+2' : '+1'}` : 'CET'}
      </div>

      {/* Awake / asleep */}
      {mounted && total > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-900 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-yellow-600 rounded-sm" />
            <span className="font-mono text-[8px] text-gray-700">Awake</span>
            <span className="font-mono text-[8px] text-[#484A4B] ml-auto tabular-nums">{awake.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-gray-800 rounded-sm" />
            <span className="font-mono text-[8px] text-gray-800">Sleeping</span>
            <span className="font-mono text-[8px] text-gray-800 ml-auto tabular-nums">{asleep.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
