'use client'
import { useWorldStore } from '@/store/worldStore'

export default function EscHint() {
  const followedNormieId = useWorldStore(s => s.followedNormieId)
  if (followedNormieId === null) return null

  return (
    <div className="absolute top-12 left-4 z-10 pointer-events-none">
      <span className="font-mono text-[9px] text-[#484A4B] tracking-[0.12em] uppercase animate-pulse">
        Press ESC · Give your Normie some alone time
      </span>
    </div>
  )
}
