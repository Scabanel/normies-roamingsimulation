'use client'
import { getOpenseaUrl } from '@/lib/normieApi'
import type { NormieMetadata } from '@/lib/normieApi'

const TYPE_ACCENT: Record<string, string> = {
  Human: '#1e6fff', Alien: '#9000ff', Cat: '#e07000', Agent: '#cc1111',
}
const THE100_ACCENT = '#d4a800'

function hexToRgb(hex: string) {
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

interface Props {
  normie: NormieMetadata
  onClose: () => void
}

export default function CollectionCardModal({ normie: n, onClose }: Props) {
  const accent = n.isThe100 ? THE100_ACCENT : (TYPE_ACCENT[n.type] ?? TYPE_ACCENT.Human)
  const rgb    = hexToRgb(accent)
  const normieNum = String(n.id).padStart(4, '0')

  const photoGlass = `linear-gradient(160deg,
    rgba(255,255,255,0.45) 0%,
    rgba(${rgb},0.25) 25%,
    rgba(255,255,255,0.04) 52%,
    rgba(${rgb},0.15) 74%,
    rgba(255,255,255,0.35) 100%)`

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(340px, 100%)',
        maxHeight: 'calc(100dvh - 40px)',
        display: 'flex', flexDirection: 'column',
        boxShadow: `0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(${rgb},0.10)`,
        border: `1px solid rgba(${rgb},0.30)`,
      }}>
        <div style={{ background: '#131315', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: '#0c0c0e', padding: '8px 12px 6px', borderBottom: `2px solid ${accent}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, letterSpacing: '0.08em' }}>
                <span style={{ color: accent }}>N</span><span style={{ color: '#fff' }}>ORMIES</span>
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#666' }}>#{normieNum}</span>
                <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', fontSize: 11, padding: '2px 7px', borderRadius: 2 }}>✕</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#eee', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700 }}>{n.name}</span>
              <span style={{ fontSize: 11, color: accent, letterSpacing: '0.1em' }}>{n.isThe100 ? '★ THE100' : n.type.toUpperCase()}</span>
            </div>
          </div>

          {/* Portrait */}
          <div style={{ padding: '10px 10px 0', flexShrink: 0 }}>
            <div style={{ padding: '2px', background: photoGlass, boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              <div style={{ width: '100%', aspectRatio: '1', background: '#222', overflow: 'hidden', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={n.imageUrl} alt={n.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
              </div>
            </div>
          </div>

          {/* Traits */}
          {n.attributes.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'auto', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#777', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Traits</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {n.attributes.map((attr, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2 }}>
                    <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{attr.trait_type}</span>
                    <span style={{ fontSize: 11, color: '#eee', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OpenSea */}
          <div style={{ padding: '7px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: '#1c1c1e' }}>
            <a href={getOpenseaUrl(n.id)} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#999', textDecoration: 'none', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#2081E2'; el.style.borderColor = 'rgba(32,129,226,0.4)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#999'; el.style.borderColor = 'rgba(255,255,255,0.09)' }}
            ><IconOpenSea /> View on OpenSea</a>
          </div>

          {/* Footer strip */}
          <div style={{ background: '#0c0c0e', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '5px 12px', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>NORMIES.ART</span>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WORLD SIMULATION</span>
          </div>
        </div>
      </div>
    </div>
  )
}
