// Simplified world map as a 120x60 grid
// 0 = ocean, 1 = land
// Based on simplified Mercator projection
import { isOnLand } from './landMask'

let _cachedMask: Uint8Array | null = null

export function setLandMask(mask: Uint8Array) {
  _cachedMask = mask
}

export const MAP_WIDTH = 120
export const MAP_HEIGHT = 60

// Encode the world map as a compact string (each char = one row of 120 pixels as hex-encoded bits)
// Land masses encoded with simplified continent shapes

function createWorldMap(): number[][] {
  const map: number[][] = Array.from({ length: MAP_HEIGHT }, () => new Array(MAP_WIDTH).fill(0))

  // Helper to fill rectangle
  const fillRect = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx
        const py = y + dy
        if (px >= 0 && px < MAP_WIDTH && py >= 0 && py < MAP_HEIGHT) {
          map[py][px] = 1
        }
      }
    }
  }

  // Helper to fill ellipse
  const fillEllipse = (cx: number, cy: number, rx: number, ry: number) => {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
          const px = cx + dx
          const py = cy + dy
          if (px >= 0 && px < MAP_WIDTH && py >= 0 && py < MAP_HEIGHT) {
            map[py][px] = 1
          }
        }
      }
    }
  }

  // Helper to fill polygon (array of [x,y] points) using scanline
  const fillPolygon = (points: [number, number][]) => {
    const minY = Math.floor(Math.min(...points.map(p => p[1])))
    const maxY = Math.ceil(Math.max(...points.map(p => p[1])))

    for (let y = minY; y <= maxY; y++) {
      const intersections: number[] = []
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i]
        const p2 = points[(i + 1) % points.length]
        if ((p1[1] <= y && p2[1] > y) || (p2[1] <= y && p1[1] > y)) {
          const x = p1[0] + (y - p1[1]) / (p2[1] - p1[1]) * (p2[0] - p1[0])
          intersections.push(x)
        }
      }
      intersections.sort((a, b) => a - b)
      for (let i = 0; i < intersections.length; i += 2) {
        const x1 = Math.floor(intersections[i])
        const x2 = Math.ceil(intersections[i + 1] || x1)
        for (let x = x1; x <= x2; x++) {
          if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            map[y][x] = 1
          }
        }
      }
    }
  }

  // suppress unused variable warning
  void fillRect

  // === NORTH AMERICA ===
  fillPolygon([
    [8, 5], [18, 3], [24, 4], [27, 7], [28, 12], [25, 16],
    [22, 18], [20, 22], [18, 25], [15, 28], [12, 30],
    [10, 28], [8, 24], [6, 18], [5, 12], [6, 8]
  ])
  // Alaska
  fillPolygon([[6, 8], [3, 6], [1, 8], [2, 10], [5, 10]])
  // East coast extension
  fillPolygon([[25, 12], [30, 10], [31, 14], [28, 16], [25, 16]])
  // Greenland
  fillPolygon([[30, 2], [38, 1], [40, 4], [38, 8], [34, 9], [31, 7]])

  // === CENTRAL AMERICA + CARIBBEAN ===
  fillPolygon([[18, 25], [20, 22], [22, 24], [21, 27], [19, 28]])
  // Cuba
  fillEllipse(22, 26, 2, 1)

  // === SOUTH AMERICA ===
  fillPolygon([
    [15, 30], [18, 28], [22, 29], [24, 32], [25, 38],
    [24, 44], [22, 48], [19, 50], [16, 48], [14, 42],
    [13, 36], [13, 31]
  ])

  // === EUROPE ===
  fillPolygon([
    [46, 6], [52, 4], [58, 5], [62, 7], [62, 11],
    [58, 13], [56, 15], [52, 16], [48, 15], [46, 12], [45, 9]
  ])
  // Scandinavia
  fillPolygon([[52, 4], [54, 2], [57, 3], [58, 5], [56, 8], [53, 7]])
  // British Isles
  fillEllipse(46, 9, 1, 2)
  // Iberian Peninsula
  fillEllipse(48, 15, 3, 3)
  // Italy
  fillPolygon([[56, 15], [58, 14], [59, 17], [57, 20], [55, 19]])

  // === AFRICA ===
  fillPolygon([
    [48, 18], [56, 16], [62, 17], [65, 20], [66, 26],
    [65, 32], [63, 38], [60, 44], [56, 48], [52, 49],
    [48, 46], [46, 40], [45, 32], [45, 26], [46, 20]
  ])
  // Madagascar
  fillEllipse(68, 38, 1, 3)

  // === MIDDLE EAST ===
  fillPolygon([
    [62, 13], [70, 12], [74, 15], [72, 19], [68, 21],
    [64, 20], [62, 17]
  ])
  // Arabian Peninsula
  fillPolygon([
    [64, 20], [70, 18], [74, 20], [74, 26], [70, 28],
    [65, 27], [63, 24]
  ])

  // === CENTRAL/SOUTH ASIA ===
  fillPolygon([
    [70, 8], [85, 6], [92, 8], [95, 12], [92, 16],
    [86, 18], [80, 20], [74, 20], [70, 18], [68, 14], [69, 10]
  ])
  // India
  fillPolygon([
    [80, 18], [86, 18], [88, 22], [86, 28], [82, 30],
    [79, 28], [78, 22]
  ])
  // Sri Lanka
  fillEllipse(85, 30, 1, 1)

  // === RUSSIA / NORTHERN ASIA ===
  fillPolygon([
    [55, 5], [80, 3], [100, 4], [110, 6], [115, 10],
    [112, 14], [105, 14], [95, 12], [85, 6], [70, 8],
    [62, 7], [58, 5], [55, 5]
  ])
  // Siberia extension
  fillPolygon([[90, 3], [100, 2], [108, 4], [110, 6], [100, 4], [90, 4]])

  // === EAST ASIA ===
  fillPolygon([
    [92, 10], [105, 8], [110, 12], [108, 18], [104, 22],
    [98, 24], [94, 22], [90, 18], [88, 14], [90, 10]
  ])
  // Korean Peninsula
  fillPolygon([[102, 18], [105, 17], [106, 21], [103, 22], [101, 20]])
  // Japan
  fillPolygon([[108, 14], [111, 13], [112, 16], [110, 18], [107, 17]])
  fillEllipse(109, 20, 1, 2)

  // === SOUTHEAST ASIA ===
  fillPolygon([
    [94, 22], [100, 20], [104, 22], [106, 26], [104, 30],
    [100, 32], [96, 30], [93, 26]
  ])
  // Indochina/Malaysia
  fillPolygon([[100, 26], [104, 26], [105, 30], [102, 32], [99, 30]])
  // Sumatra
  fillPolygon([[98, 30], [104, 28], [106, 32], [102, 34], [97, 33]])
  // Borneo
  fillEllipse(106, 32, 3, 3)
  // Java
  fillEllipse(104, 36, 3, 1)
  // Philippines
  fillEllipse(110, 26, 1, 3)

  // === AUSTRALIA ===
  fillPolygon([
    [90, 36], [100, 34], [108, 36], [110, 40], [108, 44],
    [102, 46], [95, 46], [90, 43], [88, 39]
  ])
  // Tasmania
  fillEllipse(102, 47, 1, 1)
  // New Zealand
  fillPolygon([[114, 42], [116, 41], [117, 44], [115, 45]])
  fillEllipse(113, 46, 1, 2)

  // === ANTARCTICA ===
  fillPolygon([
    [0, 55], [30, 53], [60, 52], [90, 53], [120, 55],
    [120, 59], [0, 59]
  ])

  return map
}

export const WORLD_MAP = createWorldMap()

// ============================================================
// Continent lat/lon bounds for globe placement
// ============================================================

export interface ContinentLatLonBounds {
  name: string
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
  weight: number
}

export const CONTINENT_LATLON_BOUNDS: ContinentLatLonBounds[] = [
  { name: 'North America', minLat: 15, maxLat: 75, minLon: -170, maxLon: -52, weight: 15 },
  { name: 'South America', minLat: -58, maxLat: 14, minLon: -83, maxLon: -32, weight: 10 },
  { name: 'Europe', minLat: 35, maxLat: 72, minLon: -25, maxLon: 45, weight: 15 },
  { name: 'Africa', minLat: -38, maxLat: 38, minLon: -18, maxLon: 53, weight: 20 },
  { name: 'Russia', minLat: 50, maxLat: 77, minLon: 32, maxLon: 180, weight: 5 },
  { name: 'Middle East', minLat: 12, maxLat: 42, minLon: 26, maxLon: 63, weight: 10 },
  { name: 'Central Asia', minLat: 35, maxLat: 55, minLon: 45, maxLon: 100, weight: 8 },
  { name: 'South Asia', minLat: 5, maxLat: 38, minLon: 60, maxLon: 97, weight: 15 },
  { name: 'East Asia', minLat: 18, maxLat: 55, minLon: 100, maxLon: 148, weight: 20 },
  { name: 'SE Asia', minLat: -10, maxLat: 25, minLon: 91, maxLon: 142, weight: 10 },
  { name: 'Australia', minLat: -44, maxLat: -10, minLon: 112, maxLon: 154, weight: 5 },
]

/**
 * Convert lat/lon degrees to grid indices in the 120x60 WORLD_MAP.
 * lat: -90..90 (south to north), lon: -180..180 (west to east)
 * Grid x: 0..119 (west to east), grid z: 0..59 (north to south)
 */
export function latLonToGridXZ(lat: number, lon: number): [number, number] {
  const x = Math.floor(((lon + 180) / 360) * MAP_WIDTH)
  const z = Math.floor(((90 - lat) / 180) * MAP_HEIGHT)
  return [
    Math.max(0, Math.min(MAP_WIDTH - 1, x)),
    Math.max(0, Math.min(MAP_HEIGHT - 1, z)),
  ]
}

/**
 * Returns true if the given lat/lon falls on a land cell in WORLD_MAP.
 */
export function isLandAtLatLon(lat: number, lon: number): boolean {
  const [x, z] = latLonToGridXZ(lat, lon)
  return WORLD_MAP[z][x] === 1
}

/**
 * Pick a random land lat/lon, optionally constrained to a specific continent index.
 * Returns null if no land found after many attempts.
 */
export function getRandomLandLatLon(
  continentIndex?: number
): { lat: number; lon: number; continentName: string } | null {
  // Pick continent
  let idx: number
  if (continentIndex !== undefined && continentIndex >= 0 && continentIndex < CONTINENT_LATLON_BOUNDS.length) {
    idx = continentIndex
  } else {
    // Weighted random selection
    const totalWeight = CONTINENT_LATLON_BOUNDS.reduce((s, c) => s + c.weight, 0)
    let rand = Math.random() * totalWeight
    idx = 0
    for (let i = 0; i < CONTINENT_LATLON_BOUNDS.length; i++) {
      rand -= CONTINENT_LATLON_BOUNDS[i].weight
      if (rand <= 0) {
        idx = i
        break
      }
    }
  }

  const c = CONTINENT_LATLON_BOUNDS[idx]

  for (let attempt = 0; attempt < 100; attempt++) {
    const lat = c.minLat + Math.random() * (c.maxLat - c.minLat)
    const lon = c.minLon + Math.random() * (c.maxLon - c.minLon)
    const landCheck = _cachedMask ? isOnLand(lat, lon, _cachedMask) : isLandAtLatLon(lat, lon)
    if (landCheck) {
      return { lat, lon, continentName: c.name }
    }
  }

  // Fallback: try any land cell in the continent bounding box without land check
  const lat = (c.minLat + c.maxLat) / 2
  const lon = (c.minLon + c.maxLon) / 2
  return { lat, lon, continentName: c.name }
}

// ============================================================
// Basement stations
// ============================================================

export interface BasementStation {
  id: number
  name: string
  lat: number
  lon: number
  continent: string
}

export const BASEMENT_STATIONS: BasementStation[] = [
  { id: 0, name: 'NYC Underground', lat: 40.7, lon: -74.0, continent: 'North America' },
  { id: 1, name: 'Mexico City Metro', lat: 19.4, lon: -99.1, continent: 'North America' },
  { id: 2, name: 'São Paulo Subte', lat: -23.5, lon: -46.6, continent: 'South America' },
  { id: 3, name: 'Buenos Aires Subte', lat: -34.6, lon: -58.4, continent: 'South America' },
  { id: 4, name: 'London Tube', lat: 51.5, lon: -0.1, continent: 'Europe' },
  { id: 5, name: 'Paris Métro', lat: 48.9, lon: 2.3, continent: 'Europe' },
  { id: 6, name: 'Berlin U-Bahn', lat: 52.5, lon: 13.4, continent: 'Europe' },
  { id: 7, name: 'Moscow Metro', lat: 55.8, lon: 37.6, continent: 'Russia' },
  { id: 8, name: 'Cairo Underground', lat: 30.0, lon: 31.2, continent: 'Africa' },
  { id: 9, name: 'Lagos Tunnels', lat: 6.5, lon: 3.4, continent: 'Africa' },
  { id: 10, name: 'Mumbai Metro', lat: 19.1, lon: 72.9, continent: 'South Asia' },
  { id: 11, name: 'Tokyo Subway', lat: 35.7, lon: 139.7, continent: 'East Asia' },
  { id: 12, name: 'Shanghai Metro', lat: 31.2, lon: 121.5, continent: 'East Asia' },
  { id: 13, name: 'Seoul Subway', lat: 37.6, lon: 127.0, continent: 'East Asia' },
  { id: 14, name: 'Sydney Tunnels', lat: -33.9, lon: 151.2, continent: 'Australia' },
]

/**
 * Check if a lat/lon is on land, using the high-res cached mask when available,
 * falling back to the coarse 120×60 grid. Safe to call from the simulation tick.
 */
export function isOnLandCached(lat: number, lon: number): boolean {
  if (_cachedMask) return isOnLand(lat, lon, _cachedMask)
  return isLandAtLatLon(lat, lon)
}

/** Find the nearest basement station to a given lat/lon */
export function findNearestBasement(lat: number, lon: number): BasementStation {
  let nearest = BASEMENT_STATIONS[0]
  let minDist = Infinity
  for (const station of BASEMENT_STATIONS) {
    const dlat = station.lat - lat
    const dlon = station.lon - lon
    const dist = dlat * dlat + dlon * dlon
    if (dist < minDist) { minDist = dist; nearest = station }
  }
  return nearest
}
