'use client'
import { useEffect, useState } from 'react'
import { getCETTime } from '@/lib/daynight'

export default function WorldUpdateBadge() {
  const [buildDate, setBuildDate] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('...')

  useEffect(() => {
    fetch('/build-info.json')
      .then(r => r.json())
      .then(d => setBuildDate(d.buildDate))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function tick() {
      const t = getCETTime()
      const secsLeft = (23 - t.hours) * 3600 + (59 - t.minutes) * 60 + (60 - t.seconds)
      const positive = ((secsLeft % 86400) + 86400) % 86400
      const h = Math.floor(positive / 3600)
      const m = Math.floor((positive % 3600) / 60)
      setCountdown(`${h}h ${String(m).padStart(2, '0')}m`)
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  const dateStr = buildDate
    ? new Date(buildDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '...'

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      zIndex: 20,
      background: '#111827',
      border: '1px solid #374151',
      borderRadius: 8,
      padding: '9px 14px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Last update
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af' }}>{dateStr}</div>
      <div style={{ marginTop: 2, fontSize: 9, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Next refresh in <span style={{ color: '#4b5563' }}>{countdown}</span>
      </div>
    </div>
  )
}
