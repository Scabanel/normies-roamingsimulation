'use client'
import { useState, useCallback } from 'react'
import { useWorldStore } from '@/store/worldStore'

const TYPE_COLOR: Record<string, string> = {
  Human:  'text-blue-400',
  Alien:  'text-purple-400',
  Cat:    'text-orange-400',
  Agent:  'text-gray-400',
}
const TYPE_DOT: Record<string, string> = {
  Human:  'bg-blue-500',
  Alien:  'bg-purple-500',
  Cat:    'bg-orange-500',
  Agent:  'bg-gray-500',
}

export default function SidePanel() {
  const [inputVal, setInputVal] = useState('')
  const [error, setError] = useState('')
  const { normies, followedNormieId, setFollowedNormieId, focusedNormieId } = useWorldStore()

  const followed = followedNormieId !== null ? normies.find(n => n.id === followedNormieId) : null
  const focused  = focusedNormieId  !== null ? normies.find(n => n.id === focusedNormieId)  : null
  const display  = followed ?? focused

  const handleFollow = useCallback(() => {
    const id = parseInt(inputVal.replace('#', '').trim(), 10)
    if (isNaN(id)) { setError('Invalid number'); return }
    const found = normies.find(n => n.id === id)
    if (!found) { setError(`#${id} not found`); return }
    setError('')
    setFollowedNormieId(id)
    setInputVal(`#${id}`)
  }, [inputVal, normies, setFollowedNormieId])

  const handleUnfollow = useCallback(() => {
    setFollowedNormieId(null)
    setInputVal('')
  }, [setFollowedNormieId])

  // Counts by type
  const counts = normies.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-56 flex flex-col gap-3">
      {/* Follow by number */}
      <div className="bg-black/85 border border-gray-800 rounded p-3">
        <div className="font-mono text-[10px] text-gray-600 uppercase tracking-widest mb-2">
          Follow Normie
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleFollow()}
            placeholder="#0 – #8888"
            className="flex-1 bg-transparent border border-gray-800 rounded px-2 py-1 font-mono text-xs text-white outline-none focus:border-gray-600 placeholder-gray-700"
          />
          <button
            onClick={handleFollow}
            className="font-mono text-xs text-gray-400 border border-gray-800 rounded px-2 py-1 hover:border-gray-600 hover:text-white transition-colors"
          >
            GO
          </button>
        </div>
        {error && <div className="font-mono text-[10px] text-red-600 mt-1">{error}</div>}
      </div>

      {/* Followed / focused normie info */}
      {display && (
        <div className="bg-black/85 border border-gray-800 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={display.imageUrl}
              alt={display.name}
              className="w-10 h-10 border border-gray-800 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
            <div>
              <div className="font-mono text-xs text-white">{display.name}</div>
              <div className={`font-mono text-[10px] ${TYPE_COLOR[display.type] ?? 'text-gray-400'}`}>
                {display.type}
                {display.isThe100 && ' \u2605'}
              </div>
              <div className="font-mono text-[10px] text-gray-600">{display.continent}</div>
            </div>
          </div>

          {/* Travel state */}
          {display.travelState !== 'grounded' && (
            <div className="font-mono text-[10px] text-gray-500 mb-1">
              {display.travelState === 'flying'      && '\u2708\uFE0F Flying\u2026'}
              {display.travelState === 'teleporting' && '\u2728 Teleporting\u2026'}
              {display.travelState === 'underground' && '\uD83D\uDD73\uFE0F Underground\u2026'}
            </div>
          )}

          {/* Current dialogue */}
          {display.isTalking && display.currentDialogue && (
            <div className="font-mono text-[10px] text-gray-400 italic border-t border-gray-900 pt-1 mt-1">
              &ldquo;{display.currentDialogue}&rdquo;
            </div>
          )}

          {followed && (
            <button
              onClick={handleUnfollow}
              className="mt-2 w-full font-mono text-[10px] text-gray-700 hover:text-gray-400 transition-colors border border-gray-900 rounded py-0.5"
            >
              UNFOLLOW
            </button>
          )}
        </div>
      )}

      {/* Type legend + counts */}
      <div className="bg-black/85 border border-gray-800 rounded p-3">
        <div className="font-mono text-[10px] text-gray-600 uppercase tracking-widest mb-2">
          Population
        </div>
        <div className="space-y-1">
          {(['Cat','Alien','Human','Agent'] as const).map(type => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${TYPE_DOT[type]}`} />
              <span className={`font-mono text-[10px] ${TYPE_COLOR[type]}`}>{type}</span>
              <span className="font-mono text-[10px] text-gray-700 ml-auto tabular-nums">
                {counts[type] ?? 0}
              </span>
            </div>
          ))}
        </div>
        <div className="font-mono text-[10px] text-gray-700 mt-2 pt-2 border-t border-gray-900">
          Total: {normies.length.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
