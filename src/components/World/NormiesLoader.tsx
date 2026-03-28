'use client'
import { useEffect, useRef } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { NormieMetadata } from '@/lib/normieApi'
import { CONTINENT_LATLON_BOUNDS, getRandomLandLatLon, setLandMask } from '@/lib/worldMapData'
import { getLandMask, isOnLand } from '@/lib/landMask'
import { getRandomDialogue } from '@/lib/dialogues'
import type { NormieType } from '@/lib/dialogues'
import type { NormieState } from '@/store/worldStore'

// Load priority: Cat → Alien → Human → Agent
const TYPE_PRIORITY: Record<string, number> = {
  Cat:   0,
  Alien: 1,
  Human: 2,
  Agent: 3,
}

// ── Seeded PRNG - seed changes once per UTC day ──────────────────────────────
const DAY_SEED = Math.floor(Date.now() / 86400000)

function seededRng(id: number) {
  let s = (DAY_SEED * 99991 + id * 6271) | 0
  return function() {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function getSeededLandPosition(ci: number, mask: Uint8Array, rng: () => number): { lat: number; lon: number } | null {
  const c = CONTINENT_LATLON_BOUNDS[ci]
  for (let attempt = 0; attempt < 200; attempt++) {
    const lat = c.minLat + rng() * (c.maxLat - c.minLat)
    const lon = c.minLon + rng() * (c.maxLon - c.minLon)
    if (isOnLand(lat, lon, mask)) return { lat, lon }
  }
  return null
}

function pickContinentIndexSeeded(rng: () => number): number {
  const total = CONTINENT_LATLON_BOUNDS.reduce((s, c) => s + c.weight, 0)
  let r = rng() * total
  for (let i = 0; i < CONTINENT_LATLON_BOUNDS.length; i++) {
    r -= CONTINENT_LATLON_BOUNDS[i].weight
    if (r <= 0) return i
  }
  return 0
}

function normieToState(n: NormieMetadata, continentIndex: number, pos: { lat: number; lon: number }): NormieState {
  return {
    ...n,
    lat: pos.lat, lon: pos.lon,
    targetLat: pos.lat, targetLon: pos.lon,
    continent: CONTINENT_LATLON_BOUNDS[continentIndex].name,
    continentIndex,
    isMoving: false,
    isTalking: false,
    currentDialogue: getRandomDialogue(n.type as NormieType),
    dialogueTimer: Math.random() * 10,
    waitTimer: Math.random() * 5,
    inConversation: false,
    conversationPartnerId: null,
    travelState: 'grounded',
    travelProgress: 0,
    travelFromLat: pos.lat, travelFromLon: pos.lon,
    travelToLat: pos.lat, travelToLon: pos.lon,
    travelDestContinent: continentIndex,
    flightCooldown: Math.random() * 86400,
    teleportCooldown: Math.random() * 30,
    basementTargetId: -1,
    followTargetId: null,
  }
}

// ── Session cache ─────────────────────────────────────────────────────────────
// Stores the full normie list + computed positions keyed by UTC day.
// On reload (same day) the world loads instantly from sessionStorage.

const CACHE_VERSION = 2
const CACHE_KEY = `normies_v${CACHE_VERSION}_${DAY_SEED}`

interface CachedNormie extends NormieMetadata {
  lat: number
  lon: number
  ci: number
}

function readCache(): CachedNormie[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CachedNormie[]
  } catch {
    return null
  }
}

function writeCache(items: CachedNormie[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(items))
    // Evict older day caches to free space
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(`normies_v${CACHE_VERSION}_`) && k !== CACHE_KEY) {
        sessionStorage.removeItem(k)
      }
    }
  } catch {
    // quota exceeded - cache disabled, not critical
  }
}

// ── Fallback: stream directly from api.normies.art if DB isn't ready ──────────
async function loadFromApi(
  mask: Uint8Array,
  setLoadingProgress: (p: number) => void,
  setFetchedCount: (n: number) => void,
  setTotalNormiesCount: (n: number) => void,
  setBurnedIds: (s: Set<number>) => void,
  addNormies: (ns: NormieState[]) => void,
  setNormies: (ns: NormieState[]) => void,
) {
  const { fetchBurnedTokenIds, fetchBatchNormies } = await import('@/lib/normieApi')
  const MAX_ID = 9999

  const burned = await fetchBurnedTokenIds()
  setBurnedIds(burned)

  const allIds: number[] = []
  for (let i = 0; i <= MAX_ID; i++) {
    if (!burned.has(i)) allIds.push(i)
  }
  setTotalNormiesCount(allIds.length)

  const cacheItems: CachedNormie[] = []
  let fetched = 0

  await fetchBatchNormies(
    allIds,
    (done, total) => setLoadingProgress(Math.floor((done / total) * 100)),
    (batch) => {
      fetched += batch.length
      setFetchedCount(fetched)
      const states = batch.map(n => {
        const rng = seededRng(n.id)
        const ci  = pickContinentIndexSeeded(rng)
        const pos = getSeededLandPosition(ci, mask, rng) ?? getRandomLandLatLon(ci) ?? { lat: 0, lon: 0 }
        cacheItems.push({ ...n, lat: pos.lat, lon: pos.lon, ci })
        return normieToState(n, ci, pos)
      })
      addNormies(states)
    },
  )

  const { normies } = useWorldStore.getState()
  const sorted = [...normies].sort((a, b) => {
        return (TYPE_PRIORITY[a.type] ?? 2) - (TYPE_PRIORITY[b.type] ?? 2)
  })
  setNormies(sorted)
  writeCache(cacheItems.sort((a, b) => {
        return (TYPE_PRIORITY[a.type] ?? 2) - (TYPE_PRIORITY[b.type] ?? 2)
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NormiesLoader() {
  const {
    setNormies, addNormies, setLoadingProgress, setIsLoading,
    setTotalNormiesCount, setFetchedCount, setBurnedIds,
  } = useWorldStore()
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    async function load() {
      try {
        // ── FAST PATH: session cache hit ──────────────────────────────────────
        const cached = readCache()
        if (cached && cached.length > 0) {
          // Positions are pre-computed - place everything synchronously, no HTTP
          const states = cached.map(c => normieToState(c, c.ci, { lat: c.lat, lon: c.lon }))
          setNormies(states)
          setTotalNormiesCount(states.length)
          setFetchedCount(states.length)

          // Rebuild burned IDs from gaps in the cached list
          const presentIds = new Set(cached.map(c => c.id))
          const maxId = cached.reduce((m, c) => Math.max(m, c.id), 0)
          const burned = new Set<number>()
          for (let i = 0; i <= maxId; i++) if (!presentIds.has(i)) burned.add(i)
          setBurnedIds(burned)

          setIsLoading(false)

          // Load land mask silently in the background (needed for water snap-back)
          getLandMask().then(mask => setLandMask(mask)).catch(() => {})
          return
        }

        // ── SLOW PATH: first load of the day ──────────────────────────────────
        const mask = await getLandMask()
        setLandMask(mask)
        setLoadingProgress(10)

        // Try static CDN file first (generated at build time via `npm run build`)
        const staticRes = await fetch('/normies-static.json').catch(() => null)
        const res = (staticRes?.ok ? staticRes : null) ?? await fetch('/api/normies')

        if (res.ok) {
          // DB path: one JSON blob → compute positions → cache
          const list: NormieMetadata[] = await res.json()
          setLoadingProgress(60)
          setTotalNormiesCount(list.length)
          setFetchedCount(list.length)

          const presentIds = new Set(list.map(n => n.id))
          const maxId = list.reduce((m, n) => Math.max(m, n.id), 0)
          const burned = new Set<number>()
          for (let i = 0; i <= maxId; i++) if (!presentIds.has(i)) burned.add(i)
          setBurnedIds(burned)

          const cacheItems: CachedNormie[] = []
          const CHUNK = 500
          for (let i = 0; i < list.length; i += CHUNK) {
            const batch  = list.slice(i, i + CHUNK)
            const states = batch.map(n => {
              const rng = seededRng(n.id)
              const ci  = pickContinentIndexSeeded(rng)
              const pos = getSeededLandPosition(ci, mask, rng) ?? getRandomLandLatLon(ci) ?? { lat: 0, lon: 0 }
              cacheItems.push({ ...n, lat: pos.lat, lon: pos.lon, ci })
              return normieToState(n, ci, pos)
            })
            addNormies(states)
            setLoadingProgress(60 + Math.floor(((i + CHUNK) / list.length) * 38))
            await new Promise<void>(r => setTimeout(r, 0))
          }

          const { normies } = useWorldStore.getState()
          const sorted = [...normies].sort((a, b) => {
                        return (TYPE_PRIORITY[a.type] ?? 2) - (TYPE_PRIORITY[b.type] ?? 2)
          })
          setNormies(sorted)
          writeCache(cacheItems.sort((a, b) => {
                        return (TYPE_PRIORITY[a.type] ?? 2) - (TYPE_PRIORITY[b.type] ?? 2)
          }))

        } else {
          // Fallback: DB not ready, stream directly from api.normies.art
          console.warn('[NormiesLoader] /api/normies returned', res.status, '- falling back to direct API')
          await loadFromApi(
            mask, setLoadingProgress, setFetchedCount, setTotalNormiesCount,
            setBurnedIds, addNormies, setNormies,
          )
        }

      } catch (err) {
        console.error('[NormiesLoader] Failed to load normies:', err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [addNormies, setNormies, setLoadingProgress, setIsLoading, setTotalNormiesCount, setFetchedCount, setBurnedIds])

  return null
}
