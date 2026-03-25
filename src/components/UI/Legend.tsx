'use client'

import { useWorldStore } from '@/store/worldStore'

const TYPES = [
  { type: 'Human', color: 'bg-blue-500', textColor: 'text-blue-400', desc: 'Speak English' },
  { type: 'Alien', color: 'bg-purple-500', textColor: 'text-purple-400', desc: 'Parlent français' },
  { type: 'Cat', color: 'bg-orange-500', textColor: 'text-orange-400', desc: 'Meow only' },
  { type: 'Agent', color: 'bg-gray-600', textColor: 'text-gray-400', desc: 'Silent operators' },
  { type: 'THE100', color: 'bg-yellow-400', textColor: 'text-yellow-400', desc: 'Shiny legendary' },
]

export default function Legend() {
  const { normies, isLoading, loadingProgress, totalNormiesCount } = useWorldStore()

  const counts = TYPES.reduce((acc, { type }) => {
    acc[type] = normies.filter(n => n.type === type).length
    return acc
  }, {} as Record<string, number>)

  const flyingCount = normies.filter(n => n.travelState === 'flying').length
  const teleportingCount = normies.filter(n => n.travelState === 'teleporting').length
  const undergroundCount = normies.filter(n => n.travelState === 'underground').length

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="bg-black/80 border border-gray-700 rounded p-3 min-w-48">
        <div className="font-mono text-xs text-gray-500 mb-2 uppercase tracking-wider">
          Normies World
        </div>

        {isLoading && (
          <div className="mb-3">
            <div className="font-mono text-xs text-gray-500 mb-1">
              Populating globe... {loadingProgress}%
            </div>
            <div className="w-full bg-gray-800 rounded h-1">
              <div
                className="bg-gray-400 h-1 rounded transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {TYPES.map(({ type, color, textColor }) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-sm ${color} flex-shrink-0`} />
              <span className={`font-mono text-xs ${textColor}`}>{type}</span>
              <span className="font-mono text-xs text-gray-700 ml-auto">
                {counts[type] || 0}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-800">
          <div className="font-mono text-xs text-gray-700">
            Loaded: {normies.length}{totalNormiesCount > 0 ? ` / ${totalNormiesCount}` : ''} normies
          </div>
        </div>

        {(flyingCount > 0 || teleportingCount > 0 || undergroundCount > 0) && (
          <div className="mt-2 pt-2 border-t border-gray-800 space-y-0.5">
            {flyingCount > 0 && (
              <div className="font-mono text-xs text-gray-600">✈️ Flying: {flyingCount}</div>
            )}
            {teleportingCount > 0 && (
              <div className="font-mono text-xs text-gray-600">✨ Teleporting: {teleportingCount}</div>
            )}
            {undergroundCount > 0 && (
              <div className="font-mono text-xs text-gray-600">🕳️ Underground: {undergroundCount}</div>
            )}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-800 space-y-0.5">
          <div className="font-mono text-xs text-gray-700">Scroll: zoom globe</div>
          <div className="font-mono text-xs text-gray-700">Drag: rotate globe</div>
          <div className="font-mono text-xs text-gray-700">Click: select normie</div>
        </div>
      </div>
    </div>
  )
}
