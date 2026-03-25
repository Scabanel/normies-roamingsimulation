'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import NormieWall from '@/components/UI/NormieWall'
import CollectionCardModal from '@/components/UI/CollectionCardModal'
import type { NormieMetadata } from '@/lib/normieApi'

const SYS_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const TYPE_ACCENT: Record<string, string> = {
  Human: '#1e6fff', Alien: '#9000ff', Cat: '#e07000', Agent: '#cc1111',
}
const THE100_ACCENT = '#d4a800'

const TYPES = ['All', 'Human', 'Alien', 'Cat', 'Agent']
const PER_PAGE = 120

export default function CollectionPage() {
  const [normies,    setNormies]    = useState<NormieMetadata[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    // 1. Session cache — written by NormiesLoader when the planet loads
    //    Same key used by NormiesLoader: normies_v2_<UTC day seed>
    const DAY_SEED = Math.floor(Date.now() / 86400000)
    const CACHE_KEY = `normies_v2_${DAY_SEED}`
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw)
        if (Array.isArray(cached) && cached.length > 0) {
          setNormies(cached)
          setLoading(false)
          return
        }
      }
    } catch { /* sessionStorage unavailable */ }

    // 2. Static CDN file (generated at build time)
    fetch('/normies-static.json')
      .then(r => r.ok ? r.json() : Promise.reject())
      // 3. API route (server-side DB)
      .catch(() => fetch('/api/normies').then(r => r.ok ? r.json() : Promise.reject()))
      .then((data: unknown) => { setNormies(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const [typeFilter,  setTypeFilter]  = useState('All')
  const [the100Only,  setThe100Only]  = useState(false)
  const [traitType,   setTraitType]   = useState('')
  const [traitValue,  setTraitValue]  = useState('')
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [modal,       setModal]       = useState<NormieMetadata | null>(null)

  // Derive available trait types + values from data
  const traitTypes = useMemo(() => {
    const set = new Set<string>()
    normies.forEach(n => n.attributes.forEach(a => set.add(a.trait_type)))
    return Array.from(set).sort()
  }, [normies])

  const traitValues = useMemo(() => {
    if (!traitType) return []
    const set = new Set<string>()
    normies.forEach(n => n.attributes
      .filter(a => a.trait_type === traitType)
      .forEach(a => set.add(a.value)))
    return Array.from(set).sort()
  }, [normies, traitType])

  const filtered = useMemo(() => {
    let list = normies
    if (typeFilter !== 'All') list = list.filter(n => n.type === typeFilter)
    if (the100Only)           list = list.filter(n => n.isThe100)
    if (traitType && traitValue)
      list = list.filter(n => n.attributes.some(a => a.trait_type === traitType && a.value === traitValue))
    const q = search.trim()
    if (q) {
      const id = parseInt(q)
      if (!isNaN(id)) list = list.filter(n => n.id === id)
      else list = list.filter(n => n.name.toLowerCase().includes(q.toLowerCase()))
    }
    return list
  }, [normies, typeFilter, the100Only, traitType, traitValue, search])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const resetPage = useCallback(() => setPage(1), [])

  const INPUT_STYLE: React.CSSProperties = {
    background: '#0c0c0e', border: '1px solid #2a2a2a', color: '#e5e7eb',
    borderRadius: 4, padding: '7px 12px', fontSize: 12, fontFamily: SYS_FONT,
    letterSpacing: '0.04em', outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: '#1A1B1C', color: '#e5e7eb', fontFamily: SYS_FONT }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <NormieWall count={500} opacityScale={0.35} cellSize="clamp(52px, 5.5vw, 78px)" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,27,28,0.72)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Nav */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#1A1B1C', borderBottom: '1px solid #2a2a2a', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ← BACK TO WORLD
            </Link>
            <div style={{ flex: 1 }} />
            <Link href="/know-more" style={{ fontSize: 12, color: '#888', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Know more ↗
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '60px 28px 48px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{ fontSize: 12, color: '#888', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>
              It&apos;s a Normie World
            </p>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 16 }}>
              The Collection
            </h1>
            <p style={{ fontSize: 15, color: '#bbb', lineHeight: 1.8 }}>
              {normies.length === 0 ? 'Loading…' : `${normies.length.toLocaleString()} Normies${isLoading ? '…' : ' on the planet'}`}
            </p>
          </div>
        </section>

        {/* Filters */}
        <div style={{ position: 'sticky', top: 68, zIndex: 40, background: 'rgba(26,27,28,0.95)', borderBottom: '1px solid #2a2a2a', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 28px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>

            {/* Type buttons */}
            {TYPES.map(t => (
              <button key={t} onClick={() => { setTypeFilter(t); resetPage() }} style={{
                ...INPUT_STYLE, cursor: 'pointer',
                color: typeFilter === t ? '#fff' : '#9ca3af',
                borderColor: typeFilter === t ? (TYPE_ACCENT[t] ?? '#6b7280') : '#2a2a2a',
                background: typeFilter === t ? 'rgba(255,255,255,0.06)' : '#0c0c0e',
              }}>
                {t === 'All' ? 'All' : (
                  <span>
                    <span style={{ color: TYPE_ACCENT[t], marginRight: 5 }}>●</span>{t}
                  </span>
                )}
              </button>
            ))}

            {/* THE100 toggle */}
            <button onClick={() => { setThe100Only(v => !v); resetPage() }} style={{
              ...INPUT_STYLE, cursor: 'pointer',
              color: the100Only ? '#ffd700' : '#9ca3af',
              borderColor: the100Only ? THE100_ACCENT : '#2a2a2a',
              background: the100Only ? 'rgba(212,168,0,0.08)' : '#0c0c0e',
            }}>
              ★ THE100
            </button>

            <div style={{ width: 1, height: 28, background: '#2a2a2a', margin: '0 4px' }} />

            {/* Trait filter */}
            <select value={traitType} onChange={e => { setTraitType(e.target.value); setTraitValue(''); resetPage() }}
              style={{ ...INPUT_STYLE, minWidth: 140 }}>
              <option value="">Trait type…</option>
              {traitTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {traitType && (
              <select value={traitValue} onChange={e => { setTraitValue(e.target.value); resetPage() }}
                style={{ ...INPUT_STYLE, minWidth: 140 }}>
                <option value="">Any value…</option>
                {traitValues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            )}

            <div style={{ flex: 1 }} />

            {/* ID search */}
            <input type="text" placeholder="Search by ID…" value={search}
              onChange={e => { setSearch(e.target.value); resetPage() }}
              style={{ ...INPUT_STYLE, width: 140, cursor: 'text' }} />
          </div>
        </div>

        {/* Results bar */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
            {filtered.length.toLocaleString()} normies
            {totalPages > 1 && ` · page ${page}/${totalPages}`}
          </span>
          {filtered.length !== normies.length && (
            <button onClick={() => { setTypeFilter('All'); setThe100Only(false); setTraitType(''); setTraitValue(''); setSearch(''); resetPage() }}
              style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 80px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#555', fontFamily: 'monospace', fontSize: 13 }}>
              Loading collection…
            </div>
          ) : paged.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#555', fontFamily: 'monospace', fontSize: 13 }}>
              No normies found
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {paged.map(n => (
                <NormieThumb key={n.id} normie={n} onClick={() => setModal(n)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ ...INPUT_STYLE, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? 'default' : 'pointer' }}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const mid = Math.min(Math.max(page, 4), totalPages - 3)
                const p = totalPages <= 7 ? i + 1 : i + mid - 3
                if (p < 1 || p > totalPages) return null
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    ...INPUT_STYLE, cursor: 'pointer',
                    color: page === p ? '#fff' : '#9ca3af',
                    borderColor: page === p ? '#6b7280' : '#2a2a2a',
                  }}>{p}</button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ ...INPUT_STYLE, opacity: page === totalPages ? 0.3 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}>
                Next →
              </button>
            </div>
          )}
        </div>

        <footer style={{ background: '#1A1B1C', borderTop: '1px solid #2a2a2a', padding: '32px 28px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            It&apos;s a Normie World · Built by{' '}
            <a href="https://x.com/Scabanel_" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>@Scabanel_</a>
          </p>
        </footer>
      </div>

      {/* Card modal */}
      {modal && <CollectionCardModal normie={modal} onClose={() => setModal(null)} />}
    </div>
  )
}

/* ── Small thumbnail ─────────────────────────────────────────────────────── */
function NormieThumb({ normie: n, onClick }: { normie: NormieMetadata; onClick: () => void }) {
  const accent = n.isThe100 ? THE100_ACCENT : (TYPE_ACCENT[n.type] ?? TYPE_ACCENT.Human)
  const [hover, setHover] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer', background: '#0c0c0e',
        border: `1px solid ${hover ? accent : (n.isThe100 ? THE100_ACCENT + '66' : '#1f1f1f')}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 3,
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'border-color 0.15s, transform 0.15s',
        boxShadow: n.isThe100 ? `0 0 10px rgba(212,168,0,0.20)` : 'none',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={n.imageUrl}
        alt={n.name}
        loading="lazy"
        style={{ width: '100%', aspectRatio: '1', display: 'block', imageRendering: 'pixelated', objectFit: 'contain', background: '#111' }}
      />
      <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', letterSpacing: '0.04em' }}>
          #{String(n.id).padStart(4, '0')}
        </span>
        {n.isThe100 && <span style={{ fontSize: 9, color: THE100_ACCENT }}>★</span>}
      </div>
    </div>
  )
}
