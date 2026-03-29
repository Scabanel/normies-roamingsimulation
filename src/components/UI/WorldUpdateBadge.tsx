'use client'
import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function WorldUpdateBadge() {
  const isMobile = useIsMobile()
  const [buildDate, setBuildDate] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('...')

  useEffect(() => {
    fetch('/normies-updated-at.json')
      .then(r => r.json())
      .then(d => setBuildDate(d.updatedAt))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function tick() {
      const now = new Date()
      const utcSecs = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()
      const secsLeft = (86400 - utcSecs) % 86400
      const h = Math.floor(secsLeft / 3600)
      const m = Math.floor((secsLeft % 3600) / 60)
      setCountdown(`${h}h ${String(m).padStart(2, '0')}m`)
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  const dateStr = buildDate
    ? new Date(buildDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '...'

  if (isMobile) return null

  return (
    <div style={{
      position: 'fixed',
      top: 80,
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
        DB last updated
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af' }}>{dateStr}</div>
      <div style={{ marginTop: 2, fontSize: 9, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Next refresh in <span style={{ color: '#4b5563' }}>{countdown}</span>
      </div>
    </div>
  )
}
