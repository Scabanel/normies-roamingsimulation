'use client'

const API_BASE = 'https://api.normies.art'

// 80 IDs spread evenly across the collection (1..9999)
const WALL_IDS = Array.from({ length: 80 }, (_, i) => Math.round(1 + i * (9998 / 79)))

// Deterministic opacity variation across the grid
const OPACITIES = [0.13, 0.20, 0.28, 0.16, 0.24, 0.32, 0.15, 0.22, 0.30, 0.18, 0.25, 0.12]

interface NormieWallProps {
  /** Total number of grid cells (browser caches repeated images) */
  count?: number
  /** Multiplier applied to all opacities */
  opacityScale?: number
  /** CSS value for each cell width (grid auto-fills) */
  cellSize?: string
  style?: React.CSSProperties
}

export default function NormieWall({
  count       = 500,
  opacityScale = 1,
  cellSize    = 'clamp(56px, 6.5vw, 88px)',
  style,
}: NormieWallProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, ${cellSize})`,
        gridAutoRows: cellSize,
        gap: 3,
        overflow: 'hidden',
        ...style,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const id      = WALL_IDS[i % WALL_IDS.length]
        const opacity = OPACITIES[i % OPACITIES.length] * opacityScale

        return (
          <img
            key={i}
            src={`${API_BASE}/normie/${id}/image.png`}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              opacity,
              imageRendering: 'pixelated',
              transition: 'opacity 0.22s ease, transform 0.22s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity  = String(Math.min(opacity * 2.8, 0.80))
              e.currentTarget.style.transform = 'scale(1.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity  = String(opacity)
              e.currentTarget.style.transform = 'scale(1)'
            }}
          />
        )
      })}
    </div>
  )
}
