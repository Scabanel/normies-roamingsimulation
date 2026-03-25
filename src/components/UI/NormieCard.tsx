'use client'

import { useState, useEffect } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { isNighttime } from '@/lib/daynight'
import { fetchNormieHolder, getOpenseaUrl } from '@/lib/normieApi'

const TYPE_ACCENT: Record<string, string> = {
  Human:  'border-blue-800',
  Alien:  'border-purple-800',
  Cat:    'border-orange-800',
  Agent:  'border-gray-600',
}
const TYPE_COLOR: Record<string, string> = {
  Human:  'text-blue-400',
  Alien:  'text-purple-400',
  Cat:    'text-orange-400',
  Agent:  'text-gray-400',
}

const TRAVEL_LABEL: Record<string, string> = {
  flying:      '✈ Flying',
  teleporting: '✨ Teleporting',
  underground: '🕳 Underground',
  grounded:    'Roaming',
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function NormieCard() {
  const { followedNormieId, focusedNormieId, normies } = useWorldStore()
  const activeId = followedNormieId ?? focusedNormieId
  const [expanded, setExpanded] = useState(false)
  const [holder, setHolder] = useState<string | null>(null)
  const [holderLoading, setHolderLoading] = useState(false)

  // Reset expanded state and holder when the active normie changes
  useEffect(() => {
    setExpanded(false)
    setHolder(null)
  }, [activeId])

  // Fetch holder when expanded
  useEffect(() => {
    if (!expanded || activeId === null || holder !== null) return
    setHolderLoading(true)
    fetchNormieHolder(activeId).then(h => {
      setHolder(h)
      setHolderLoading(false)
    })
  }, [expanded, activeId, holder])

  if (activeId === null) return null
  const n = normies.find(nm => nm.id === activeId)
  if (!n) return null

  const sleeping = isNighttime(n.lon)
  // THE100 flagged normies get gold border regardless of type
  const accent = n.isThe100 ? 'border-yellow-700' : (TYPE_ACCENT[n.type] ?? TYPE_ACCENT.Human)
  const typeColor = n.isThe100 ? 'text-yellow-400' : (TYPE_COLOR[n.type] ?? TYPE_COLOR.Human)
  const status = sleeping
    ? 'Sleeping'
    : n.travelState !== 'grounded'
      ? TRAVEL_LABEL[n.travelState]
      : n.inConversation ? 'Talking' : 'Roaming'

  /* ── Compact card ── */
  if (!expanded) {
    return (
      <div
        className={`absolute top-4 right-4 z-10 w-48 bg-black/92 border ${accent} rounded cursor-pointer select-none`}
        style={{ borderWidth: '1px' }}
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center gap-2.5 p-2.5">
          {/* Thumbnail */}
          <div className="relative shrink-0">
            <img
              src={n.imageUrl}
              alt={n.name}
              width={48}
              height={48}
              className="rounded"
              style={{
                imageRendering: 'pixelated',
                width: 48,
                height: 48,
                objectFit: 'contain',
                filter: sleeping ? 'grayscale(1) brightness(0.35)' : 'none',
              }}
            />
            {sleeping && (
              <span className="absolute bottom-0 right-0 text-xs leading-none">💤</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[11px] text-[#E2E5E4] truncate">{n.name}</div>
            <div className={`font-mono text-[9px] ${typeColor} truncate`}>
              {n.type}{n.isThe100 ? ' ★' : ''}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className={`w-1 h-1 rounded-full shrink-0 ${sleeping ? 'bg-gray-700' : 'bg-green-500'}`} />
              <span className="font-mono text-[9px] text-gray-600 truncate">{status}</span>
            </div>
          </div>
        </div>

        <div className="font-mono text-[8px] text-gray-800 text-right px-2.5 pb-1.5 -mt-1">
          click for details ↗
        </div>
      </div>
    )
  }

  /* ── Expanded modal ── */
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-end pointer-events-none"
      style={{ paddingRight: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}
    >
      <div
        className={`pointer-events-auto w-64 bg-black/95 border ${accent} rounded overflow-hidden flex flex-col`}
        style={{ borderWidth: '1px', maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Portrait */}
        <div className="relative bg-[#0a0a0a] shrink-0">
          <img
            src={n.imageUrl}
            alt={n.name}
            style={{
              imageRendering: 'pixelated',
              width: '100%',
              aspectRatio: '1/1',
              objectFit: 'contain',
              maxHeight: '200px',
              display: 'block',
              filter: sleeping ? 'grayscale(1) brightness(0.35)' : 'none',
            }}
          />
          {/* Type badge */}
          <div className={`absolute top-1.5 left-1.5 font-mono text-[9px] px-1.5 py-0.5 border rounded bg-black/80 ${accent} ${typeColor}`}>
            {n.type}{n.isThe100 ? ' ★' : ''}
          </div>
          {/* Close */}
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-1.5 right-1.5 font-mono text-[11px] text-gray-600 hover:text-white bg-black/60 rounded px-1.5 py-0.5 transition-colors"
          >
            ✕
          </button>
          {sleeping && (
            <div className="absolute inset-0 flex items-end justify-end p-2">
              <span className="text-xl leading-none">💤</span>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Name + location + links */}
          <div className="px-3 py-2 border-b border-gray-900">
            <div className="font-mono text-[12px] text-[#E2E5E4]">{n.name}</div>
            <div className="font-mono text-[9px] text-gray-600">{n.continent}</div>

            {/* Holder */}
            <div className="mt-1.5 flex items-center gap-1">
              <span className="font-mono text-[9px] text-gray-700">Holder</span>
              {holderLoading ? (
                <span className="font-mono text-[9px] text-gray-700 animate-pulse">…</span>
              ) : holder ? (
                <span className="font-mono text-[9px] text-gray-400 truncate">{truncateAddress(holder)}</span>
              ) : (
                <span className="font-mono text-[9px] text-gray-800">—</span>
              )}
            </div>

            {/* OpenSea link */}
            <a
              href={getOpenseaUrl(n.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 font-mono text-[9px] text-gray-600 hover:text-[#2081E2] transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <svg width="10" height="10" viewBox="0 0 90 90" fill="currentColor">
                <path d="M45 0C20.1 0 0 20.1 0 45s20.1 45 45 45 45-20.1 45-45S69.9 0 45 0zm-9.8 54.6l-10-14.5 10-14.5V54.6zm9.8 8.5L31.4 47.5l14.6-21.1 14.6 21.1L45 63.1zm9.8-8.5V25.6l10 14.5-10 14.5z"/>
              </svg>
              View on OpenSea
            </a>
          </div>

          {/* Status */}
          <div className="px-3 py-1.5 border-b border-gray-900 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sleeping ? 'bg-gray-700' : 'bg-green-500'}`} />
            <span className="font-mono text-[9px] text-gray-500">{status}</span>
          </div>

          {/* Traits */}
          <div className="px-3 py-2 space-y-1">
            <div className="font-mono text-[9px] text-gray-700 uppercase tracking-widest mb-1.5">Traits</div>
            {n.attributes.map((attr, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="font-mono text-[9px] text-gray-700 shrink-0">{attr.trait_type}</span>
                <span className="font-mono text-[9px] text-gray-400 text-right truncate">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
