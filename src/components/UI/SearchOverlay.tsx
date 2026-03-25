'use client'

import { useState, useCallback } from 'react'
import { useWorldStore } from '@/store/worldStore'

const TRAVEL_STATE_LABEL: Record<string, string> = {
  grounded: '',
  flying: '✈️ Flying',
  teleporting: '✨ Teleporting',
  underground: '🕳️ Underground',
}

export default function SearchOverlay() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<number[]>([])
  const { normies, setSearchQuery, setFocusedNormieId, setFollowedNormieId, focusedNormieId } = useWorldStore()

  const handleSearch = useCallback((value: string) => {
    setInput(value)
    setSearchQuery(value)

    if (!value.trim()) {
      setResults([])
      return
    }

    const query = value.toLowerCase().replace('#', '')
    const found = normies
      .filter(n => {
        const idMatch = n.id.toString().includes(query)
        const typeMatch = n.type.toLowerCase().includes(query)
        return idMatch || typeMatch
      })
      .slice(0, 10)
      .map(n => n.id)

    setResults(found)
  }, [normies, setSearchQuery])

  const handleSelect = useCallback((id: number) => {
    setFocusedNormieId(id)
    setFollowedNormieId(id)
    setResults([])
    setInput(`#${id}`)
  }, [setFocusedNormieId, setFollowedNormieId])

  const handleClear = useCallback(() => {
    setInput('')
    setResults([])
    setSearchQuery('')
    setFocusedNormieId(null)
    setFollowedNormieId(null)
  }, [setSearchQuery, setFocusedNormieId, setFollowedNormieId])

  const focused = focusedNormieId !== null
    ? normies.find(n => n.id === focusedNormieId)
    : null

  const typeColors: Record<string, string> = {
    Human: 'text-blue-400',
    Alien: 'text-purple-400',
    Cat: 'text-orange-400',
    Agent: 'text-gray-400',
    THE100: 'text-yellow-400',
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-80">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center bg-black/80 border border-gray-700 rounded px-3 py-2 gap-2">
          <span className="text-gray-500 text-sm font-mono">#</span>
          <input
            type="text"
            value={input}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search normie..."
            className="bg-transparent text-white text-sm font-mono outline-none flex-1 placeholder-gray-600"
          />
          {input && (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          )}
          <div className="text-gray-600 text-xs font-mono">
            🔍
          </div>
        </div>

        {/* Dropdown results */}
        {results.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-black/90 border border-gray-700 rounded overflow-hidden">
            {results.map(id => {
              const n = normies.find(normie => normie.id === id)
              if (!n) return null
              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left transition-colors"
                >
                  <span className="text-gray-500 font-mono text-xs w-12">#{id}</span>
                  <span className={`font-mono text-xs ${typeColors[n.type] ?? 'text-white'}`}>
                    {n.type}
                  </span>
                  <span className="text-gray-600 font-mono text-xs ml-auto">
                    {n.gender}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Focused normie info panel */}
      {focused && (
        <div className="mt-2 bg-black/80 border border-gray-700 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={focused.imageUrl}
              alt={focused.name}
              className="w-12 h-12 rounded border border-gray-700"
              style={{ imageRendering: 'pixelated' }}
            />
            <div>
              <div className="font-mono text-sm text-white">{focused.name}</div>
              <div className={`font-mono text-xs ${typeColors[focused.type] ?? 'text-white'}`}>
                {focused.type} • {focused.gender}
                {focused.isThe100 && (
                  <span className="ml-1 text-yellow-400">★ THE100</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {focused.attributes.slice(0, 6).map((attr, i) => (
              <div key={i} className="font-mono text-xs text-gray-500">
                <span className="text-gray-600">{attr.trait_type}:</span>{' '}
                <span className="text-gray-400">{attr.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 font-mono text-xs text-gray-600">
            {focused.continent} — {focused.lat.toFixed(1)}°, {focused.lon.toFixed(1)}°
          </div>
          {focused.travelState && focused.travelState !== 'grounded' && (
            <div className="mt-1 font-mono text-xs text-gray-500">
              {TRAVEL_STATE_LABEL[focused.travelState] || focused.travelState}
            </div>
          )}
          {focused.isTalking && (
            <div className="mt-2 border-t border-gray-800 pt-2">
              <div className="font-mono text-xs text-white/80 italic">
                &ldquo;{focused.currentDialogue}&rdquo;
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
