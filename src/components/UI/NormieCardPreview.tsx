'use client'
import { useState, useEffect } from 'react'
import type { NormieMetadata } from '@/lib/normieApi'

const TYPE_ACCENT: Record<string, string> = {
  Human: '#1e6fff', Alien: '#9000ff', Cat: '#e07000', Agent: '#cc1111',
}
function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255'
}

interface Props { normieId: number }

export default function NormieCardPreview({ normieId }: Props) {
  const [normie, setNormie] = useState<NormieMetadata | null>(null)

  useEffect(() => {
    // 1. Session cache (same key as NormiesLoader)
    const DAY_SEED = Math.floor(Date.now() / 86400000)
    try {
      const raw = sessionStorage.getItem(`normies_v2_${DAY_SEED}`)
      if (raw) {
        const cached = JSON.parse(raw)
        if (Array.isArray(cached) && cached.length > 0) {
          setNormie((cached as NormieMetadata[]).find((n: NormieMetadata) => n.id === normieId) ?? null)
          return
        }
      }
    } catch { /* sessionStorage unavailable */ }

    // 2. Static JSON / API
    fetch('/normies-static.json')
      .then(r => r.ok ? r.json() : Promise.reject())
      .catch(() => fetch('/api/normies').then(r => r.ok ? r.json() : Promise.reject()))
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setNormie((data as NormieMetadata[]).find((n: NormieMetadata) => n.id === normieId) ?? null)
        }
      })
      .catch(() => {})
  }, [normieId])

  if (!normie) {
    return (
      <div style={{
        width: 220, flexShrink: 0, background: '#131315',
        border: '1px solid #2a2a2a', fontFamily: 'monospace',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 320, color: '#555', fontSize: 11,
      }}>
        Loading…
      </div>
    )
  }

  const accent = TYPE_ACCENT[normie.type] ?? TYPE_ACCENT.Human
  const rgb = hexToRgb(accent)
  const numStr = String(normie.id).padStart(4, '0')

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: '#131315',
      border: `1px solid rgba(${rgb},0.30)`,
      boxShadow: `0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(${rgb},0.10)`,
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div style={{ background: '#0c0c0e', padding: '6px 10px 5px', borderBottom: `2px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 12, letterSpacing: '0.08em' }}>
            <span style={{ color: accent }}>N</span><span style={{ color: '#fff' }}>ORMIES</span>
          </span>
          <span style={{ fontSize: 10, color: '#666' }}>#{numStr}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#eee', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700 }}>{normie.name}</span>
          <span style={{ fontSize: 10, color: accent, letterSpacing: '0.1em' }}>{normie.type.toUpperCase()}</span>
        </div>
      </div>
      {/* Portrait */}
      <div style={{ padding: '8px 8px 0' }}>
        <div style={{ width: '100%', aspectRatio: '1', background: '#222', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normie.imageUrl}
            alt={normie.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }}
          />
        </div>
      </div>
      {/* Traits */}
      <div style={{ padding: '6px 10px 8px' }}>
        <div style={{ fontSize: 9, color: '#777', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>Traits</div>
        {normie.attributes.slice(0, 6).map((attr, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: '2px 6px', marginBottom: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2 }}>
            <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{attr.trait_type}</span>
            <span style={{ fontSize: 10, color: '#eee', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{attr.value}</span>
          </div>
        ))}
      </div>
      {/* Footer strip */}
      <div style={{ background: '#0c0c0e', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '4px 10px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>NORMIES.ART</span>
        <span style={{ fontSize: 8, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WORLD SIMULATION</span>
      </div>
    </div>
  )
}
