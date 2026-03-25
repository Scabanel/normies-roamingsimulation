'use client'
import { useEffect, useRef } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { fetchBurnedTokenIds, fetchBatchNormies, NormieMetadata } from '@/lib/normieApi'
import { CONTINENT_LATLON_BOUNDS, getRandomLandLatLon, setLandMask } from '@/lib/worldMapData'
import { getLandMask, isOnLand } from '@/lib/landMask'
import { getRandomDialogue } from '@/lib/dialogues'
import type { NormieType } from '@/lib/dialogues'
import type { NormieState } from '@/store/worldStore'

const MAX_ID = 8888

// Load priority: Cat → Alien → Human → Agent
const TYPE_PRIORITY: Record<string, number> = {
  Cat:   0,
  Alien: 1,
  Human: 2,
  Agent: 3,
}

// ── Seeded PRNG (mulberry32) — seed changes once per UTC day ─────────────────
// All users loading on the same day get identical initial normie positions.
const DAY_SEED = Math.floor(Date.now() / 86400000)

function seededRng(id: number) {
  // Combine day seed + normie id for a unique, deterministic seed per normie per day
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
    flightCooldown: Math.random() * 86400,  // staggered across the full 24h window
    teleportCooldown: Math.random() * 30,
    basementTargetId: -1,
    followTargetId: null,
  }
}

export default function NormiesLoader() {
  const { setNormies, addNormies, setLoadingProgress, setIsLoading, setTotalNormiesCount, setFetchedCount, setBurnedIds } = useWorldStore()
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    async function load() {
      try {
        // 1. Build land mask
        const mask = await getLandMask()
        setLandMask(mask)

        // 2. Get burned token IDs
        const burned = await fetchBurnedTokenIds()
        setBurnedIds(burned)

        // 3. Build valid ID list
        const allIds: number[] = []
        for (let i = 0; i <= MAX_ID; i++) {
          if (!burned.has(i)) allIds.push(i)
        }
        setTotalNormiesCount(allIds.length)

        // 4. Stream normies into world as they arrive (overlay stays up)
        //    Track fetched count separately from world population
        let fetched = 0
        await fetchBatchNormies(
          allIds,
          (done, total) => setLoadingProgress(Math.floor((done / total) * 100)),
          (batch) => {
            fetched += batch.length
            setFetchedCount(fetched)
            const states = batch.map(n => {
              const rng = seededRng(n.id)
              const ci = pickContinentIndexSeeded(rng)
              const pos = getSeededLandPosition(ci, mask, rng) ?? getRandomLandLatLon(ci) ?? { lat: 0, lon: 0 }
              return normieToState(n, ci, pos)
            })
            addNormies(states)
          }
        )

        // 5. Sort all normies in store by type priority: Cat → Alien → Human → Agent
        //    THE100 normies (by flag) always appear first within their type group
        const { normies } = useWorldStore.getState()
        const sorted = [...normies].sort((a, b) => {
          // isThe100 flagged normies come before their type peers
          if (a.isThe100 !== b.isThe100) return a.isThe100 ? -1 : 1
          return (TYPE_PRIORITY[a.type] ?? 2) - (TYPE_PRIORITY[b.type] ?? 2)
        })
        setNormies(sorted)

      } catch (err) {
        console.error('[NormiesLoader] Failed to load normies:', err)
      } finally {
        // Always reveal world, even if loading partially failed
        setIsLoading(false)
      }
    }

    load()
  }, [addNormies, setNormies, setLoadingProgress, setIsLoading, setTotalNormiesCount, setFetchedCount, setBurnedIds])

  return null
}
