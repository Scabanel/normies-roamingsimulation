'use client'
import { useCallback, useEffect, useState } from 'react'
import { getOpenseaUrl } from '@/lib/normieApi'
import type { NormieMetadata } from '@/lib/normieApi'

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

function truncate(addr: string) {
  return addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : addr
}

const TYPE_ACCENT: Record<string, string> = {
  Human: '#1e6fff', Alien: '#9000ff', Cat: '#e07000', Agent: '#cc1111',
}
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

async function downloadCardAsPng(n: NormieMetadata, accent: string) {
  const CARD_W = 340
  const TRAIT_H = 28
  const HEADER_H = 64
  const IMG_H = 340
  const FOOTER_H = 30
  const OPENSEA_H = 44
  const TRAITS_PAD = 16
  const traitsH = n.attributes.length > 0
    ? TRAITS_PAD + n.attributes.length * (TRAIT_H + 3) + TRAITS_PAD
    : 0
  const CARD_H = HEADER_H + IMG_H + traitsH + OPENSEA_H + FOOTER_H

  const canvas = document.createElement('canvas')
  const dpr = 2
  canvas.width  = CARD_W * dpr
  canvas.height = CARD_H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#131315'
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Header bg
  ctx.fillStyle = '#0c0c0e'
  ctx.fillRect(0, 0, CARD_W, HEADER_H)

  // Accent bottom border on header
  ctx.fillStyle = accent
  ctx.fillRect(0, HEADER_H - 2, CARD_W, 2)

  // Header text
  ctx.font = 'bold 13px monospace'
  ctx.fillStyle = accent
  ctx.fillText('N', 12, 22)
  ctx.fillStyle = '#ffffff'
  ctx.fillText('ORMIES', 12 + ctx.measureText('N').width, 22)

  ctx.font = '11px monospace'
  ctx.fillStyle = '#666666'
  const numText = `#${String(n.id).padStart(4, '0')}`
  ctx.fillText(numText, CARD_W - 12 - ctx.measureText(numText).width, 22)

  ctx.font = 'bold 13px monospace'
  ctx.fillStyle = '#eeeeee'
  ctx.fillText(n.name.toUpperCase(), 12, 50)

  const typeLabel = n.type.toUpperCase()
  ctx.font = '11px monospace'
  ctx.fillStyle = accent
  ctx.fillText(typeLabel, CARD_W - 12 - ctx.measureText(typeLabel).width, 50)

  // Portrait — load image with crossOrigin
  const imgY = HEADER_H
  ctx.fillStyle = '#222222'
  ctx.fillRect(0, imgY, CARD_W, IMG_H)

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = n.imageUrl
    })
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, imgY, CARD_W, IMG_H)
  } catch {
    // CORS blocked — draw placeholder
    ctx.fillStyle = '#333333'
    ctx.fillRect(0, imgY, CARD_W, IMG_H)
    ctx.fillStyle = '#555555'
    ctx.font = '13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Image unavailable (CORS)', CARD_W / 2, imgY + IMG_H / 2)
    ctx.textAlign = 'left'
  }

  // Traits
  let y = HEADER_H + IMG_H + TRAITS_PAD
  if (n.attributes.length > 0) {
    ctx.font = '9px monospace'
    ctx.fillStyle = '#777777'
    ctx.fillText('TRAITS', 12, y + 4)
    y += 16

    for (const attr of n.attributes) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      ctx.fillRect(8, y, CARD_W - 16, TRAIT_H)
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.strokeRect(8, y, CARD_W - 16, TRAIT_H)

      ctx.font = '9px monospace'
      ctx.fillStyle = '#888888'
      ctx.fillText(attr.trait_type.toUpperCase(), 16, y + 17)

      ctx.font = '10px monospace'
      ctx.fillStyle = '#eeeeee'
      const val = attr.value.length > 22 ? attr.value.slice(0, 22) + '…' : attr.value
      ctx.fillText(val, CARD_W - 16 - ctx.measureText(val).width, y + 17)

      y += TRAIT_H + 3
    }
  }

  // OpenSea strip
  const osY = CARD_H - FOOTER_H - OPENSEA_H
  ctx.fillStyle = '#1c1c1e'
  ctx.fillRect(0, osY, CARD_W, OPENSEA_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.beginPath()
  ctx.moveTo(0, osY)
  ctx.lineTo(CARD_W, osY)
  ctx.stroke()
  ctx.font = '11px monospace'
  ctx.fillStyle = '#999999'
  ctx.textAlign = 'center'
  ctx.fillText('VIEW ON OPENSEA', CARD_W / 2, osY + 26)
  ctx.textAlign = 'left'

  // Footer strip
  const footY = CARD_H - FOOTER_H
  ctx.fillStyle = '#0c0c0e'
  ctx.fillRect(0, footY, CARD_W, FOOTER_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.beginPath()
  ctx.moveTo(0, footY)
  ctx.lineTo(CARD_W, footY)
  ctx.stroke()
  ctx.font = '8px monospace'
  ctx.fillStyle = '#555555'
  ctx.fillText('NORMIES.ART', 12, footY + 18)
  ctx.fillText('WORLD SIMULATION', CARD_W - 12 - ctx.measureText('WORLD SIMULATION').width, footY + 18)

  // Trigger download
  const link = document.createElement('a')
  link.download = `normie-${String(n.id).padStart(4, '0')}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function CollectionCardModal({ normie: n, onClose }: Props) {
  const accent = TYPE_ACCENT[n.type] ?? TYPE_ACCENT.Human
  const rgb    = hexToRgb(accent)
  const normieNum = String(n.id).padStart(4, '0')
  const [holderInfo, setHolderInfo]       = useState<HolderInfo | null>(null)
  const [holderLoading, setHolderLoading] = useState(true)

  useEffect(() => {
    setHolderLoading(true)
    fetchHolderInfo(n.id).then(info => { setHolderInfo(info); setHolderLoading(false) })
  }, [n.id])

  const handleDownload = useCallback(() => {
    downloadCardAsPng(n, accent)
  }, [n, accent])

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
              <span style={{ fontSize: 11, color: accent, letterSpacing: '0.1em' }}>{n.type.toUpperCase()}</span>
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

          {/* Holder */}
          <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: '#777', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Holder</div>
            {holderLoading
              ? <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>loading…</span>
              : holderInfo === null || holderInfo.holder == null
                ? <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>none</span>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'monospace' }}>
                    {holderInfo.displayName && (
                      <span style={{ fontSize: 12, color: '#ddd', fontWeight: 600 }}>{holderInfo.displayName}</span>
                    )}
                    {holderInfo.twitterHandle && (
                      <a
                        href={`https://x.com/${holderInfo.twitterHandle}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11, color: '#1d9bf0', textDecoration: 'none' }}
                      >@{holderInfo.twitterHandle}</a>
                    )}
                    <span style={{ fontSize: 10, color: '#555' }}>{truncate(holderInfo.holder)}</span>
                  </div>
            }
          </div>

          {/* Actions */}
          <div style={{ padding: '7px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: '#1c1c1e', display: 'flex', gap: 6 }}>
            <a href={getOpenseaUrl(n.id)} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#999', textDecoration: 'none', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#2081E2'; el.style.borderColor = 'rgba(32,129,226,0.4)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#999'; el.style.borderColor = 'rgba(255,255,255,0.09)' }}
            ><IconOpenSea /> OpenSea</a>
            <button
              onClick={e => { e.stopPropagation(); handleDownload() }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#999', cursor: 'pointer', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = `rgba(${rgb},1)`; el.style.borderColor = `rgba(${rgb},0.4)` }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#999'; el.style.borderColor = 'rgba(255,255,255,0.09)' }}
            >↓ Save PNG</button>
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
