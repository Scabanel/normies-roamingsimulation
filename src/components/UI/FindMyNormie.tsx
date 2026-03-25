'use client'
import { useState, useCallback } from 'react'
import { useWorldStore } from '@/store/worldStore'

export default function FindMyNormie() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'found' | 'burned' | 'notfound'>('idle')
  const { normies, burnedIds, setFollowedNormieId, setFocusedNormieId } = useWorldStore()

  const handleSearch = useCallback(() => {
    const raw = input.replace('#', '').trim()
    if (!raw) return
    const id = parseInt(raw, 10)
    if (isNaN(id)) { setStatus('notfound'); return }

    const found = normies.find(n => n.id === id)
    if (found) {
      setFollowedNormieId(id)
      setFocusedNormieId(id)
      setStatus('found')
      return
    }

    if (burnedIds.has(id)) {
      setStatus('burned')
      return
    }

    setStatus('notfound')
  }, [input, normies, burnedIds, setFollowedNormieId, setFocusedNormieId])

  const handleClear = useCallback(() => {
    setInput('')
    setStatus('idle')
    setFollowedNormieId(null)
    setFocusedNormieId(null)
  }, [setFollowedNormieId, setFocusedNormieId])

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      zIndex: 20,
      width: 220,
      background: '#111827',
      border: '1px solid #374151',
      borderRadius: 8,
      padding: '14px 16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        🔍 Find my Normie
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setStatus('idle') }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="#0 – #8888"
          style={{
            flex: 1,
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 4,
            padding: '7px 10px',
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#fff',
            outline: 'none',
            minWidth: 0,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#6b7280')}
          onBlur={e => (e.currentTarget.style.borderColor = '#374151')}
        />
        <button
          onClick={input ? handleSearch : handleClear}
          style={{
            background: input ? '#2563eb' : '#1f2937',
            border: '1px solid ' + (input ? '#2563eb' : '#374151'),
            borderRadius: 4,
            padding: '7px 12px',
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (input) e.currentTarget.style.background = '#1d4ed8' }}
          onMouseLeave={e => { if (input) e.currentTarget.style.background = '#2563eb' }}
        >
          {input ? 'GO' : '✕'}
        </button>
      </div>

      {status === 'burned' && (
        <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', lineHeight: 1.5 }}>
          💀 This Normie has been burned.<br />
          <span style={{ color: '#6b7280' }}>It is no longer of this world.</span>
        </div>
      )}
      {status === 'notfound' && (
        <div style={{ marginTop: 10, fontSize: 10, color: '#6b7280' }}>
          Not found, still loading?
        </div>
      )}
      {status === 'found' && (
        <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 10, color: '#4ade80' }}>
          ↑ Camera is following
        </div>
      )}
    </div>
  )
}
