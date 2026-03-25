'use client'
import { useWorldStore } from '@/store/worldStore'

export default function EscHint() {
  const followedNormieId = useWorldStore(s => s.followedNormieId)
  if (followedNormieId === null) return null

  return (
    <div style={{
      position: 'fixed',
      top: 64,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      background: 'rgba(0,0,0,0.75)',
      border: '1px solid #374151',
      borderRadius: 6,
      padding: '6px 16px',
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#9ca3af',
      letterSpacing: '0.08em',
      pointerEvents: 'none',
      animation: 'pulse 2s infinite',
    }}>
      Press ESC · Give your Normie some alone time
    </div>
  )
}
