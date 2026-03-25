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
    <div className="absolute bottom-4 left-4 z-10 w-52">
      <div className="bg-black/85 border border-gray-800 rounded p-2.5">
        <div className="font-mono text-[8px] text-gray-700 uppercase tracking-widest mb-2">
          Find my Normie
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setStatus('idle') }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="#0 – #8888"
            className="flex-1 bg-transparent border border-gray-800 rounded px-2 py-1 font-mono text-[10px] text-white outline-none focus:border-gray-600 placeholder-gray-800 min-w-0"
          />
          <button
            onClick={input ? handleSearch : handleClear}
            className="font-mono text-[10px] text-gray-600 border border-gray-800 rounded px-2 py-1 hover:border-gray-600 hover:text-white transition-colors shrink-0"
          >
            {input ? 'GO' : '✕'}
          </button>
        </div>

        {status === 'burned' && (
          <div className="mt-2 font-mono text-[9px] text-gray-700 leading-relaxed">
            💀 This Normie has been burned.<br />
            <span className="text-gray-800">It is no longer of this world.</span>
          </div>
        )}
        {status === 'notfound' && (
          <div className="mt-2 font-mono text-[9px] text-gray-800">
            Not found — still loading?
          </div>
        )}
        {status === 'found' && (
          <div className="mt-2 font-mono text-[9px] text-green-900">
            ↑ Camera is following
          </div>
        )}
      </div>
    </div>
  )
}
