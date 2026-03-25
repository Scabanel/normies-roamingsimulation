'use client'

import { useState, useRef, useEffect } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { isNighttime } from '@/lib/daynight'
import { getOpenseaUrl } from '@/lib/normieApi'

interface HolderInfo {
  holder: string | null
  displayName: string | null
  twitterHandle: string | null
}

async function fetchHolderInfo(id: number): Promise<HolderInfo> {
  try {
    const res = await fetch(`/api/normies/${id}/holder`)
    if (!res.ok) return { holder: null, displayName: null, twitterHandle: null }
    const data = await res.json()
    return {
      holder:        data.holder        ?? null,
      displayName:   data.displayName   ?? null,
      twitterHandle: data.twitterHandle ?? null,
    }
  } catch {
    return { holder: null, displayName: null, twitterHandle: null }
  }
}

const TYPE_ACCENT: Record<string, string> = {
  Human: '#1e6fff',
  Alien: '#9000ff',
  Cat:   '#e07000',
  Agent: '#cc1111',
}

const TRAVEL_LABEL: Record<string, string> = {
  flying:      '✈ Flying',
  teleporting: '✨ Teleporting',
  underground: '🕳 Underground',
  grounded:    'Roaming',
}

function truncate(addr: string) {
  return addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : addr
}

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255'
}

function IconOpenSea() {
  return (
    <svg width="12" height="12" viewBox="0 0 90 90" fill="currentColor">
      <path d="M45 0C20.1 0 0 20.1 0 45s20.1 45 45 45 45-20.1 45-45S69.9 0 45 0zm-9.8 54.6l-10-14.5 10-14.5V54.6zm9.8 8.5L31.4 47.5l14.6-21.1 14.6 21.1L45 63.1zm9.8-8.5V25.6l10 14.5-10 14.5z" />
    </svg>
  )
}

function useSlabTilt() {
  const slabRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = slabRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height })
  }
  const onMouseEnter = () => setIsHovered(true)
  const onMouseLeave = () => { setIsHovered(false); setMouse({ x: 0.5, y: 0.5 }) }

  const rotateX = isHovered ? (mouse.y - 0.5) * -14 : 0
  const rotateY = isHovered ? (mouse.x - 0.5) *  14 : 0
  const sa      = isHovered ? 1 : 0.6
  const slabAng = 140 + rotateY * 3.5 - rotateX * 1.5
  const holoAng = 115 + mouse.x * 40
  const holoOff = mouse.y * 30

  const slabGlass = `linear-gradient(${slabAng}deg,
    rgba(255,255,255,${0.75*sa}) 0%,
    rgba(220,220,240,${0.28*sa}) 18%,
    rgba(255,255,255,${0.06*sa}) 42%,
    rgba(200,210,230,${0.18*sa}) 62%,
    rgba(255,255,255,${0.04*sa}) 78%,
    rgba(255,255,255,${0.60*sa}) 100%)`

  return { slabRef, isHovered, mouse, onMouseMove, onMouseEnter, onMouseLeave,
           rotateX, rotateY, sa, slabAng, holoAng, holoOff, slabGlass }
}

export default function NormieCard() {
  const { followedNormieId, focusedNormieId, normies, setFollowedNormieId, setFocusedNormieId } = useWorldStore()
  const activeId = followedNormieId ?? focusedNormieId
  const [expanded, setExpanded]           = useState(false)
  // undefined = not yet fetched; null/object = fetched
  const [holderInfo, setHolderInfo]       = useState<HolderInfo | undefined>(undefined)
  const [holderLoading, setHolderLoading] = useState(false)

  useEffect(() => { setExpanded(false); setHolderInfo(undefined) }, [activeId])

  useEffect(() => {
    if (!expanded || activeId === null || holderInfo !== undefined) return
    setHolderLoading(true)
    fetchHolderInfo(activeId).then(info => { setHolderInfo(info); setHolderLoading(false) })
  }, [expanded, activeId, holderInfo])

  if (activeId === null) return null
  const n = normies.find(nm => nm.id === activeId)
  if (!n) return null

  const sleeping  = n.type !== 'Alien' && isNighttime(n.lat, n.lon)
  const accent    = TYPE_ACCENT[n.type] ?? TYPE_ACCENT.Human
  const rgb       = hexToRgb(accent)
  const status    = sleeping                       ? '💤 Sleeping'
    : n.travelState !== 'grounded'                 ? TRAVEL_LABEL[n.travelState]
    : n.inConversation                             ? '💬 Talking' : '🚶 Roaming'
  const normieNum = String(n.id).padStart(4, '0')

  const handleClose = () => {
    setExpanded(false)
    setFollowedNormieId(null)
    setFocusedNormieId(null)
  }

  return expanded
    ? <ExpandedCard n={n} accent={accent} rgb={rgb} status={status} normieNum={normieNum}
                    sleeping={sleeping} holderInfo={holderInfo} holderLoading={holderLoading}
                    onClose={handleClose} onCollapse={() => setExpanded(false)} />
    : <CompactCard  n={n} accent={accent} rgb={rgb} status={status} normieNum={normieNum}
                    sleeping={sleeping} onExpand={() => setExpanded(true)} onClose={handleClose} />
}

/* ─────────────────────────────────────────────────────────────────────────────
   Compact card — top-right corner
───────────────────────────────────────────────────────────────────────────── */
function CompactCard({ n, accent, rgb, status, normieNum, sleeping, onExpand, onClose }: {
  n: ReturnType<typeof useWorldStore.getState>['normies'][0]
  accent: string; rgb: string; status: string; normieNum: string; sleeping: boolean
  onExpand: () => void; onClose: () => void
}) {
  const tilt = useSlabTilt()
  const photoAng   = tilt.slabAng + 60
  const photoGlass = `linear-gradient(${photoAng}deg,
    rgba(255,255,255,${0.50*tilt.sa}) 0%,
    rgba(${rgb},${0.30*tilt.sa}) 25%,
    rgba(255,255,255,${0.05*tilt.sa}) 52%,
    rgba(${rgb},${0.18*tilt.sa}) 74%,
    rgba(255,255,255,${0.40*tilt.sa}) 100%)`

  return (
    <div style={{ position: 'fixed', top: 60, right: 14, width: 210, perspective: 900, zIndex: 50 }}>
      <div
        ref={tilt.slabRef}
        onMouseMove={tilt.onMouseMove} onMouseEnter={tilt.onMouseEnter} onMouseLeave={tilt.onMouseLeave}
        style={{
          padding: '2px', background: tilt.slabGlass, cursor: 'pointer',
          transform: `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(${tilt.isHovered ? 8 : 0}px)`,
          transition: tilt.isHovered ? 'transform 0.07s ease-out, box-shadow 0.3s' : 'transform 0.55s ease, box-shadow 0.55s',
          boxShadow: tilt.isHovered ? `0 20px 44px rgba(0,0,0,0.85), 0 0 40px rgba(${rgb},0.08)` : '0 6px 24px rgba(0,0,0,0.55)',
        }}
        onClick={onExpand}
      >
        <div style={{ background: '#131315', overflow: 'hidden', fontFamily: 'monospace' }}>

          {/* Top label */}
          <div style={{ background: '#0c0c0e', padding: '6px 10px 5px', borderBottom: `2px solid ${accent}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: tilt.isHovered ? 0.45 : 0.1, transition: 'opacity 0.4s', background: `linear-gradient(90deg, transparent, rgba(${rgb},0.2) ${tilt.mouse.x*80+5}%, transparent)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, position: 'relative' }}>
              <span style={{ fontSize: 12, letterSpacing: '0.08em' }}>
                <span style={{ color: accent }}>N</span><span style={{ color: '#fff' }}>ORMIES</span>
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#777', letterSpacing: '0.06em' }}>#{normieNum}</span>
                <button
                  onClick={e => { e.stopPropagation(); onClose() }}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
                >✕</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', position: 'relative' }}>
              <span style={{ fontSize: 11, color: '#ddd', textTransform: 'uppercase', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{n.name}</span>
              <span style={{ fontSize: 10, color: accent, letterSpacing: '0.1em' }}>{n.type.toUpperCase()}</span>
            </div>
          </div>

          {/* Inner slab */}
          <div style={{ padding: 6 }}>
            <div style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.07)', padding: 9, position: 'relative', overflow: 'hidden' }}>
              {/* Holo */}
              <div style={{ position: 'absolute', inset: 0, opacity: tilt.isHovered ? 0.5 : 0, transition: 'opacity 0.35s', background: `linear-gradient(${tilt.holoAng}deg, transparent 0%, rgba(255,50,90,0.24) ${15+tilt.holoOff}%, rgba(255,190,50,0.24) ${28+tilt.holoOff}%, rgba(50,255,140,0.24) ${42+tilt.holoOff}%, rgba(50,140,255,0.24) ${56+tilt.holoOff}%, rgba(180,50,255,0.24) ${70+tilt.holoOff}%, transparent 100%)`, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 2 }} />
              {/* Glare */}
              <div style={{ position: 'absolute', inset: 0, opacity: tilt.isHovered ? 1 : 0, transition: 'opacity 0.35s', background: `radial-gradient(ellipse at ${tilt.mouse.x*100}% ${tilt.mouse.y*100}%, rgba(255,255,255,0.14) 0%, transparent 60%)`, pointerEvents: 'none', zIndex: 3 }} />

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Portrait */}
                <div style={{ padding: '2px', background: photoGlass, flexShrink: 0 }}>
                  <div style={{ width: 58, height: 58, background: '#2a2a2a', overflow: 'hidden', position: 'relative' }}>
                    <img src={n.imageUrl} alt={n.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: sleeping ? 'grayscale(1) brightness(0.3)' : 'none' }} />
                  </div>
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: sleeping ? '#444' : '#22cc66', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#ccc' }}>{status}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#777', letterSpacing: '0.04em' }}>{n.continent}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 6, letterSpacing: '0.05em' }}>tap to expand ↗</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{ background: '#0c0c0e', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '4px 10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>NORMIES.ART</span>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WORLD SIM</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Expanded card — centered modal with backdrop blur
───────────────────────────────────────────────────────────────────────────── */
function ExpandedCard({ n, accent, rgb, status, normieNum, sleeping, holderInfo, holderLoading, onClose, onCollapse }: {
  n: ReturnType<typeof useWorldStore.getState>['normies'][0]
  accent: string; rgb: string; status: string; normieNum: string; sleeping: boolean
  holderInfo: HolderInfo | undefined; holderLoading: boolean; onClose: () => void; onCollapse: () => void
}) {
  const photoGlass = `linear-gradient(160deg,
    rgba(255,255,255,0.45) 0%,
    rgba(${rgb},0.25) 25%,
    rgba(255,255,255,0.04) 52%,
    rgba(${rgb},0.15) 74%,
    rgba(255,255,255,0.35) 100%)`

  return (
    /* Backdrop overlay — click outside to dismiss */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Card — stop propagation. Height adapts to viewport via dvh. */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(340px, 100%)',
          height: 'min(calc(100dvh - 40px), 720px)',
          display: 'flex', flexDirection: 'column',
          boxShadow: `0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(${rgb},0.08)`,
          border: `1px solid rgba(${rgb},0.25)`,
        }}
      >
        <div style={{ background: '#131315', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'monospace', flex: 1, minHeight: 0 }}>

          {/* Top label — fixed height */}
          <div style={{ background: '#0c0c0e', padding: '8px 12px 6px', borderBottom: `2px solid ${accent}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, letterSpacing: '0.08em' }}>
                <span style={{ color: accent }}>N</span><span style={{ color: '#fff' }}>ORMIES</span>
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#666', letterSpacing: '0.06em' }}>#{normieNum}</span>
                <button onClick={onCollapse} title="Collapse"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', fontSize: 11, padding: '2px 7px', borderRadius: 2 }}>⊟</button>
                <button onClick={onClose} title="Close"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', fontSize: 11, padding: '2px 7px', borderRadius: 2 }}>✕</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#eee', textTransform: 'uppercase', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%', fontWeight: 700 }}>{n.name}</span>
              <span style={{ fontSize: 11, color: accent, letterSpacing: '0.1em' }}>{n.type.toUpperCase()}</span>
            </div>
          </div>

          {/* Body — flex 1, no overflow */}
          <div style={{ padding: 8, flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ flex: 1, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Portrait — takes all remaining vertical space */}
              <div style={{ flex: '1 1 0', minHeight: 0, padding: '10px 10px 0', position: 'relative' }}>
                <div style={{ height: '100%', padding: '2px', background: photoGlass, boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                  <div style={{ width: '100%', height: '100%', background: '#222', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)', pointerEvents: 'none', zIndex: 4 }} />
                    <img src={n.imageUrl} alt={n.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', display: 'block', filter: sleeping ? 'grayscale(1) brightness(0.3)' : 'none' }} />
                    {sleeping && <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 5, fontSize: 20 }}>💤</div>}
                  </div>
                </div>
              </div>

              {/* Name + status — fixed */}
              <div style={{ padding: '8px 12px 6px', flexShrink: 0 }}>
                <p style={{ fontSize: 15, color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 5 }}>{n.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: sleeping ? '#444' : '#22cc66', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#bbb' }}>{status}</span>
                  <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>{n.continent}</span>
                </div>
              </div>

              {/* Holder — fixed */}
              <div style={{ padding: '5px 12px 6px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#777', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Holder</div>
                {holderLoading
                  ? <span style={{ fontSize: 11, color: '#666' }}>loading…</span>
                  : holderInfo === undefined
                    ? null
                    : holderInfo.holder == null
                      ? <span style={{ fontSize: 11, color: '#444' }}>none</span>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {holderInfo.displayName && (
                            <span style={{ fontSize: 12, color: '#ddd', fontWeight: 600 }}>
                              {holderInfo.displayName}
                            </span>
                          )}
                          {holderInfo.twitterHandle && (
                            <a
                              href={`https://x.com/${holderInfo.twitterHandle}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: 11, color: '#1d9bf0', textDecoration: 'none' }}
                            >
                              @{holderInfo.twitterHandle}
                            </a>
                          )}
                          <span style={{ fontSize: 10, color: '#555' }}>{truncate(holderInfo.holder)}</span>
                        </div>
                }
              </div>

              {/* Traits — fixed, compact rows */}
              <div style={{ padding: '5px 12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#777', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>Traits</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {n.attributes.map((attr, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2 }}>
                      <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{attr.trait_type}</span>
                      <span style={{ fontSize: 11, color: '#eee', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OpenSea — pinned at bottom */}
              <div style={{ padding: '7px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: '#1c1c1e' }}>
                <a
                  href={getOpenseaUrl(n.id)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#999', textDecoration: 'none', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#2081E2'; el.style.borderColor = 'rgba(32,129,226,0.4)'; el.style.background = 'rgba(32,129,226,0.08)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#999'; el.style.borderColor = 'rgba(255,255,255,0.09)'; el.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  <IconOpenSea /> View on OpenSea
                </a>
              </div>
            </div>
          </div>

          {/* Bottom strip — fixed */}
          <div style={{ background: '#0c0c0e', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '5px 12px', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>NORMIES.ART</span>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WORLD SIMULATION</span>
          </div>

        </div>
      </div>
    </div>
  )
}
