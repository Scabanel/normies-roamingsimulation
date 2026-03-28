import { create } from 'zustand'
import { NormieMetadata } from '@/lib/normieApi'
import { CONTINENT_LATLON_BOUNDS, getRandomLandLatLon, findNearestBasement, BASEMENT_STATIONS, isOnLandCached } from '@/lib/worldMapData'
import { getRandomDialogue, getGreeting, getAlienNightDialogue } from '@/lib/dialogues'
import type { NormieType as DialogueType } from '@/lib/dialogues'
import { isNighttime, updateSunPosition } from '@/lib/daynight'

export type TravelState = 'grounded' | 'flying' | 'teleporting' | 'underground'

export interface NormieState extends NormieMetadata {
  // Position
  lat: number
  lon: number
  targetLat: number
  targetLon: number
  continent: string
  continentIndex: number

  // Locomotion
  isMoving: boolean
  waitTimer: number

  // Dialogue
  isTalking: boolean
  currentDialogue: string
  dialogueTimer: number

  // Conversation
  inConversation: boolean
  conversationPartnerId: number | null

  // Travel
  travelState: TravelState
  travelProgress: number   // 0..1
  travelFromLat: number
  travelFromLon: number
  travelToLat: number
  travelToLon: number
  travelDestContinent: number  // continent index of destination
  flightCooldown: number       // seconds until next flight allowed
  teleportCooldown: number     // seconds (Alien: 90s)
  basementTargetId: number     // which station to travel TO (-1 = none)

  // Cat
  followTargetId: number | null  // id of human to follow (Cats only)
}

export interface ConversationMessage { speakerId: number; text: string }
export interface ActiveConversation {
  id: string
  normieAId: number
  normieBId: number
  messages: ConversationMessage[]
  currentIndex: number
  messageTimer: number
  totalDuration?: number
}

// ── helpers ────────────────────────────────────────────────────────────────────

const DEG2RAD = Math.PI / 180
const MOVE_SPEED = 0.025  // deg/s - faster, more lively
const FLY_SPEED = 1.2   // deg/s during flight
const TELE_DURATION = 1.0 // seconds for teleport animation
const FLIGHT_COOLDOWN  = 86400  // 24h real time - each normie flies at most once per day
const MAX_FLIGHTS_DAY  = 10     // max group-flight events per real 24-hour period
const TELEPORT_COOLDOWN = 180 // 3 min (Alien)
const PROXIMITY_DEG = 2.5    // conversation trigger distance
const CONV_CHANCE = 0.5      // per second while close
const MSG_TIME = 2.5         // seconds per message
const MAX_CONVS = 12
// Max pairs to check per proximity pass (caps O(n²) cost)
const MAX_PROX_CHECKS = 4000
const CAT_FOLLOW_RANGE = 3.0 // degrees - cats stay within this range of their human

function latLonToUnit(lat: number, lon: number): [number, number, number] {
  const phi = (90 - lat) * DEG2RAD
  const theta = (lon + 180) * DEG2RAD
  return [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)]
}

function angDeg(latA: number, lonA: number, latB: number, lonB: number): number {
  const [ax, ay, az] = latLonToUnit(latA, lonA)
  const [bx, by, bz] = latLonToUnit(latB, lonB)
  const dot = Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz))
  return Math.acos(dot) * (180 / Math.PI)
}

function clampToBounds(lat: number, lon: number, ci: number): [number, number] {
  const c = CONTINENT_LATLON_BOUNDS[ci]
  if (!c) return [lat, lon]
  return [
    Math.max(c.minLat, Math.min(c.maxLat, lat)),
    Math.max(c.minLon, Math.min(c.maxLon, lon)),
  ]
}

function pickTarget(n: NormieState): { lat: number; lon: number } {
  const result = getRandomLandLatLon(n.continentIndex)
  if (result) return { lat: result.lat, lon: result.lon }
  return { lat: n.lat, lon: n.lon }
}

function pickRandomOtherContinent(current: number): number {
  let idx = current
  while (idx === current) idx = Math.floor(Math.random() * CONTINENT_LATLON_BOUNDS.length)
  return idx
}

// ── Alien night-gathering state ───────────────────────────────────────────────
let _nightRallyLat = 20
let _nightRallyLon = 20
let _nightRallyContIdx = 2
let _nightRallyRefreshTimer = 0
const _alienGathering = new Set<number>()  // alien ids currently in gathering mode

// Concentric ring slots for the alien gathering circle (clearly spaced)
const ALIEN_RINGS = [{ slots: 16, r: 4 }, { slots: 28, r: 7 }, { slots: 40, r: 10 }]
const ALIEN_RING_TOTAL = ALIEN_RINGS.reduce((s, rr) => s + rr.slots, 0)  // 84 total slots

function getAlienCircleSlot(id: number): { angle: number; r: number } {
  const slotId = id % ALIEN_RING_TOTAL
  let offset = 0
  for (const ring of ALIEN_RINGS) {
    if (slotId < offset + ring.slots) {
      return { angle: (slotId - offset) / ring.slots * 2 * Math.PI, r: ring.r }
    }
    offset += ring.slots
  }
  return { angle: 0, r: 4 }
}

// Global daily flight budget - resets every real 24 hours
let _flightsToday  = 0
let _flightDayTimer = 86400  // seconds until daily reset

function refreshNightRally(): void {
  const dark = CONTINENT_LATLON_BOUNDS
    .map((c, i) => ({
      i,
      lat: (c.minLat + c.maxLat) / 2,
      lon: (c.minLon + c.maxLon) / 2,
    }))
    .filter(c => isNighttime(c.lat, c.lon))
  if (dark.length > 0) {
    const pick = dark[Math.floor(Math.random() * dark.length)]
    _nightRallyLat = pick.lat
    _nightRallyLon = pick.lon
    _nightRallyContIdx = pick.i
  }
  _nightRallyRefreshTimer = 60
}

function generateConversation(a: NormieState, b: NormieState): ConversationMessage[] {
  const msgs: ConversationMessage[] = []
  msgs.push({ speakerId: a.id, text: getGreeting(a.type as DialogueType) })
  msgs.push({ speakerId: b.id, text: getGreeting(b.type as DialogueType) })
  const exchanges = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < exchanges; i++) {
    const spk = i % 2 === 0 ? a : b
    msgs.push({ speakerId: spk.id, text: getRandomDialogue(spk.type as DialogueType) })
  }
  return msgs
}

// ── store ──────────────────────────────────────────────────────────────────────

interface WorldStore {
  normies: NormieState[]
  conversations: ActiveConversation[]
  loadingProgress: number
  isLoading: boolean
  searchQuery: string
  focusedNormieId: number | null
  followedNormieId: number | null
  totalNormiesCount: number
  fetchedCount: number  // normies fetched but not yet placed on world

  setNormies: (n: NormieState[]) => void
  addNormies: (n: NormieState[]) => void
  updateNormie: (id: number, updates: Partial<NormieState>) => void
  setLoadingProgress: (v: number) => void
  setIsLoading: (v: boolean) => void
  setSearchQuery: (v: string) => void
  setFocusedNormieId: (v: number | null) => void
  setFollowedNormieId: (v: number | null) => void
  setTotalNormiesCount: (v: number) => void
  burnedIds: Set<number>
  setBurnedIds: (ids: Set<number>) => void
  setFetchedCount: (v: number) => void
  tick: (delta: number, skipProximity?: boolean) => void
}

export const useWorldStore = create<WorldStore>((set) => ({
  normies: [],
  conversations: [],
  loadingProgress: 0,
  isLoading: true,
  searchQuery: '',
  focusedNormieId: null,
  followedNormieId: null,
  totalNormiesCount: 0,
  fetchedCount: 0,
  burnedIds: new Set<number>(),
  setBurnedIds: (burnedIds) => set({ burnedIds }),

  setNormies: (normies) => set({ normies }),
  addNormies: (newNormies) => set(state => ({ normies: [...state.normies, ...newNormies] })),
  updateNormie: (id, updates) => set(state => ({
    normies: state.normies.map(n => n.id === id ? { ...n, ...updates } : n),
  })),
  setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFocusedNormieId: (focusedNormieId) => set({ focusedNormieId }),
  setFollowedNormieId: (followedNormieId) => set({ followedNormieId }),
  setTotalNormiesCount: (totalNormiesCount) => set({ totalNormiesCount }),
  setFetchedCount: (fetchedCount) => set({ fetchedCount }),

  tick: (delta, skipProximity = false) => set(state => {
    if (state.normies.length === 0) return {}

    // Update sun position (internally throttled to 1/sec)
    updateSunPosition()

    // Refresh night rally point periodically
    _nightRallyRefreshTimer -= delta
    if (_nightRallyRefreshTimer <= 0) refreshNightRally()

    // Decrement daily flight budget timer; reset at midnight (every 24h real time)
    _flightDayTimer -= delta
    if (_flightDayTimer <= 0) {
      _flightDayTimer = 86400
      _flightsToday   = 0
    }

    const nm = new Map<number, NormieState>(state.normies.map(n => [n.id, { ...n }]))

    // ── advance conversations ─────────────────────────────────────────────────
    const newConvs: ActiveConversation[] = []
    for (const conv of state.conversations) {
      const c = { ...conv, messageTimer: conv.messageTimer - delta }
      if (c.messageTimer <= 0) {
        const next = c.currentIndex + 1
        if (next >= c.messages.length) {
          // end
          for (const id of [c.normieAId, c.normieBId]) {
            const n = nm.get(id)
            if (n) nm.set(id, { ...n, inConversation: false, conversationPartnerId: null, isTalking: false })
          }
          continue
        }
        c.currentIndex = next
        c.messageTimer = MSG_TIME
        const msg = c.messages[next]
        const spk = nm.get(msg.speakerId)
        if (spk) nm.set(spk.id, { ...spk, isTalking: true, currentDialogue: msg.text })
      }
      newConvs.push(c)
    }

    // ── per-normie tick ───────────────────────────────────────────────────────
    for (const [id, n] of nm) {
      let next = { ...n }

      // Sleeping normies are completely immobile - Aliens never sleep
      if (next.type !== 'Alien' && isNighttime(next.lat, next.lon) && next.travelState === 'grounded' && !next.inConversation) {
        next.isTalking = false
        next.isMoving = false
        nm.set(id, next)
        continue
      }

      // cooldown timers
      if (next.flightCooldown > 0) next.flightCooldown = Math.max(0, next.flightCooldown - delta)
      if (next.teleportCooldown > 0) next.teleportCooldown = Math.max(0, next.teleportCooldown - delta)
      if (next.dialogueTimer > 0) next.dialogueTimer -= delta
      if (next.dialogueTimer <= 0 && !next.inConversation) {
        next.isTalking = false
        next.dialogueTimer = 5 + Math.random() * 10
      }

      // ── FLYING ──────────────────────────────────────────────────────────────
      if (next.travelState === 'flying') {
        next.travelProgress = Math.min(1, next.travelProgress + FLY_SPEED * delta / 180)
        // Interpolate lat/lon so the dot moves across the globe during flight
        const fp = next.travelProgress
        next.lat = next.travelFromLat + (next.travelToLat - next.travelFromLat) * fp
        next.lon = next.travelFromLon + (next.travelToLon - next.travelFromLon) * fp
        if (next.travelProgress >= 1) {
          next.lat = next.travelToLat
          next.lon = next.travelToLon
          next.continentIndex = next.travelDestContinent
          next.continent = CONTINENT_LATLON_BOUNDS[next.travelDestContinent]?.name ?? next.continent
          next.travelState = 'grounded'
          next.targetLat = next.lat
          next.targetLon = next.lon
          const target = pickTarget(next)
          next.targetLat = target.lat
          next.targetLon = target.lon
          next.waitTimer = 2
        }
        nm.set(id, next)
        continue
      }

      // ── TELEPORTING (Alien) ──────────────────────────────────────────────────
      if (next.travelState === 'teleporting') {
        next.travelProgress = Math.min(1, next.travelProgress + delta / TELE_DURATION)
        if (next.travelProgress >= 1) {
          next.lat = next.travelToLat
          next.lon = next.travelToLon
          next.continentIndex = next.travelDestContinent
          next.continent = CONTINENT_LATLON_BOUNDS[next.travelDestContinent]?.name ?? next.continent
          next.travelState = 'grounded'
          const target = pickTarget(next)
          next.targetLat = target.lat
          next.targetLon = target.lon
          next.waitTimer = 1
        }
        nm.set(id, next)
        continue
      }

      // ── UNDERGROUND (Agent) ──────────────────────────────────────────────────
      if (next.travelState === 'underground') {
        next.travelProgress = Math.min(1, next.travelProgress + delta / 4) // 4s underground
        if (next.travelProgress >= 1) {
          const dest = BASEMENT_STATIONS[next.basementTargetId] ?? BASEMENT_STATIONS[0]
          next.lat = dest.lat
          next.lon = dest.lon
          const destContIdx = CONTINENT_LATLON_BOUNDS.findIndex(c => c.name === dest.continent)
          if (destContIdx >= 0) {
            next.continentIndex = destContIdx
            next.continent = dest.continent
          }
          next.travelState = 'grounded'
          const target = pickTarget(next)
          next.targetLat = target.lat
          next.targetLon = target.lon
          next.waitTimer = 2
          next.basementTargetId = -1
        }
        nm.set(id, next)
        continue
      }

      // ── skip if in conversation ──────────────────────────────────────────────
      if (next.inConversation) {
        nm.set(id, next)
        continue
      }

      // ── Alien night-gathering ────────────────────────────────────────────────
      // Night aliens teleport/walk to a circle formation and whisper together.
      // This block always ends with nm.set+continue so it never leaks into normal logic.
      if (next.type === 'Alien' && next.travelState === 'grounded') {
        const inNight = isNighttime(next.lat, next.lon)

        if (inNight) {
          _alienGathering.add(next.id)

          // Let active conversations finish without interruption
          if (next.inConversation) { nm.set(id, next); continue }

          // Advance cooldowns
          if (next.flightCooldown > 0)   next.flightCooldown   = Math.max(0, next.flightCooldown   - delta)
          if (next.teleportCooldown > 0) next.teleportCooldown = Math.max(0, next.teleportCooldown - delta)
          if (next.dialogueTimer > 0)    next.dialogueTimer   -= delta
          if (next.dialogueTimer <= 0)   next.isTalking = false

          // Deterministic circle slot - concentric rings (4°, 7°, 10°) clearly spaced
          const { angle, r } = getAlienCircleSlot(next.id)
          const tLat = _nightRallyLat + r * Math.cos(angle)
          const tLon = _nightRallyLon + r * Math.sin(angle)
          const dist = angDeg(next.lat, next.lon, tLat, tLon)

          if (dist > 8 && next.teleportCooldown <= 0) {
            // Far away - teleport directly to circle slot
            next.travelState    = 'teleporting'
            next.travelProgress = 0
            next.travelFromLat  = next.lat
            next.travelFromLon  = next.lon
            next.travelToLat    = tLat
            next.travelToLon    = tLon
            next.travelDestContinent = _nightRallyContIdx
            next.teleportCooldown    = 30   // short cooldown so they don't bounce
            next.isTalking       = true
            next.currentDialogue = '🌑 ...'
            next.dialogueTimer   = 1.5
          } else if (dist > 0.15) {
            // Close enough - walk toward slot at double speed
            const dLat = tLat - next.lat
            const dLon = tLon - next.lon
            const d = Math.sqrt(dLat * dLat + dLon * dLon)
            const speed = MOVE_SPEED * 2.5 * delta
            const ratio = Math.min(1, speed / d)
            next.lat += dLat * ratio
            next.lon += dLon * ratio
            next.isMoving = true
          } else {
            // At slot - stand still and whisper conspiracy (always in French)
            next.isMoving = false
            if (!next.isTalking && next.dialogueTimer <= 0) {
              next.isTalking       = true
              next.currentDialogue = getAlienNightDialogue()
              next.dialogueTimer   = 3 + Math.random() * 5
            }
          }

          nm.set(id, next)
          continue  // ← skip ALL normal wait/teleport/movement logic

        } else {
          // Daytime - if was gathering, scatter with a dawn teleport
          const wasGathering = _alienGathering.has(next.id)
          _alienGathering.delete(next.id)
          if (wasGathering && next.teleportCooldown <= 0) {
            let destCi  = pickRandomOtherContinent(next.continentIndex)
            let destPos = getRandomLandLatLon(destCi)
            let tries   = 0
            while (destPos && isNighttime(destPos.lat, destPos.lon) && tries < 10) {
              destCi  = pickRandomOtherContinent(next.continentIndex)
              destPos = getRandomLandLatLon(destCi)
              tries++
            }
            if (destPos) {
              next.travelState     = 'teleporting'
              next.travelProgress  = 0
              next.travelFromLat   = next.lat
              next.travelFromLon   = next.lon
              next.travelToLat     = destPos.lat
              next.travelToLon     = destPos.lon
              next.travelDestContinent = destCi
              next.teleportCooldown    = TELEPORT_COOLDOWN
              next.isTalking       = true
              next.currentDialogue = '🌅 Dawn!'
              next.dialogueTimer   = 2
              nm.set(id, next)
              continue
            }
          }
          // Normal daytime Alien logic falls through below
        }
      }

      // ── WAIT TIMER ───────────────────────────────────────────────────────────
      if (next.waitTimer > 0) {
        next.waitTimer = Math.max(0, next.waitTimer - delta)
        if (next.waitTimer <= 0) {
          const roll = Math.random()

          if (next.type === 'Human' && next.flightCooldown <= 0 && roll < 0.15
              && _flightsToday < MAX_FLIGHTS_DAY) {
            // Group flight: trigger 20-80 humans on same continent together (max 10/day)
            _flightsToday++
            const destCi = pickRandomOtherContinent(next.continentIndex)
            const ci = next.continentIndex
            const groupSize = 19 + Math.floor(Math.random() * 61)  // 19–79 additional
            let grouped = 0
            for (const [oid, other] of nm) {
              if (grouped >= groupSize) break
              if (oid === id || other.type !== 'Human' || other.continentIndex !== ci) continue
              if (other.travelState !== 'grounded' || other.flightCooldown > 0 || other.inConversation) continue
              const dpos = getRandomLandLatLon(destCi)
              if (!dpos) continue
              nm.set(oid, { ...other, travelState: 'flying', travelProgress: 0,
                travelFromLat: other.lat, travelFromLon: other.lon,
                travelToLat: dpos.lat, travelToLon: dpos.lon,
                travelDestContinent: destCi, flightCooldown: FLIGHT_COOLDOWN,
                isTalking: true, currentDialogue: '✈️ Flying!', dialogueTimer: 3 })
              grouped++
            }
            const dpos0 = getRandomLandLatLon(destCi)
            if (dpos0) {
              next.travelState = 'flying'; next.travelProgress = 0
              next.travelFromLat = next.lat; next.travelFromLon = next.lon
              next.travelToLat = dpos0.lat; next.travelToLon = dpos0.lon
              next.travelDestContinent = destCi; next.flightCooldown = FLIGHT_COOLDOWN
              next.isTalking = true; next.currentDialogue = '✈️ Flying!'; next.dialogueTimer = 3
            }
          } else if (next.type === 'Alien' && next.teleportCooldown <= 0 && roll < 0.08) {
            // Alien: teleport to another continent
            const destCi = pickRandomOtherContinent(next.continentIndex)
            const destPos = getRandomLandLatLon(destCi)
            if (destPos) {
              next.travelState = 'teleporting'
              next.travelProgress = 0
              next.travelFromLat = next.lat
              next.travelFromLon = next.lon
              next.travelToLat = destPos.lat
              next.travelToLon = destPos.lon
              next.travelDestContinent = destCi
              next.teleportCooldown = TELEPORT_COOLDOWN
            }
          } else if (next.type === 'Agent' && roll < 0.08) {
            // Agent: fly (secondary chance) or take basement
            if (next.flightCooldown <= 0 && roll < 0.03) {
              const destCi = pickRandomOtherContinent(next.continentIndex)
              const destPos = getRandomLandLatLon(destCi)
              if (destPos) {
                next.travelState = 'flying'
                next.travelProgress = 0
                next.travelFromLat = next.lat
                next.travelFromLon = next.lon
                next.travelToLat = destPos.lat
                next.travelToLon = destPos.lon
                next.travelDestContinent = destCi
                next.flightCooldown = FLIGHT_COOLDOWN
              }
            } else {
              const basement = findNearestBasement(next.lat, next.lon)
              const distToBasement = angDeg(next.lat, next.lon, basement.lat, basement.lon)
              if (distToBasement > 0.5) {
                // Walk toward basement
                next.targetLat = basement.lat
                next.targetLon = basement.lon
                next.isMoving = true
              } else {
                // At basement: take the tunnel
                let destStationId = Math.floor(Math.random() * BASEMENT_STATIONS.length)
                while (destStationId === basement.id) destStationId = Math.floor(Math.random() * BASEMENT_STATIONS.length)
                next.travelState = 'underground'
                next.travelProgress = 0
                next.basementTargetId = destStationId
                next.isTalking = true
                next.currentDialogue = '🕳️ Going underground.'
                next.dialogueTimer = 2
              }
            }
          } else {
            // Normal: pick new target on same continent
            const target = pickTarget(next)
            next.targetLat = target.lat
            next.targetLon = target.lon
            next.isMoving = true
            // Human exclusion zone: push humans away from active alien gathering
            if (next.type === 'Human' && _alienGathering.size > 5) {
              const distToRally = angDeg(next.lat, next.lon, _nightRallyLat, _nightRallyLon)
              if (distToRally < 12) {
                for (let attempt = 0; attempt < 5; attempt++) {
                  const alt = pickTarget(next)
                  if (angDeg(alt.lat, alt.lon, _nightRallyLat, _nightRallyLon) > 15) {
                    next.targetLat = alt.lat; next.targetLon = alt.lon
                    break
                  }
                }
              }
            }
          }
        }
        nm.set(id, next)
        continue
      }

      // ── Cat: follow nearest human ────────────────────────────────────────────
      if (next.type === 'Cat') {
        let followTarget = next.followTargetId !== null ? nm.get(next.followTargetId) : null
        // Reassign follow target if null or on different continent
        if (!followTarget || followTarget.continentIndex !== next.continentIndex) {
          const sameContHumans = Array.from(nm.values()).filter(
            h => h.type === 'Human' && h.continentIndex === next.continentIndex && !h.inConversation
          )
          if (sameContHumans.length > 0) {
            followTarget = sameContHumans[Math.floor(Math.random() * sameContHumans.length)]
            next.followTargetId = followTarget.id
          }
        }
        if (followTarget) {
          const dist = angDeg(next.lat, next.lon, followTarget.lat, followTarget.lon)
          if (dist > CAT_FOLLOW_RANGE * 0.5) {
            const offsetLat = (Math.random() - 0.5) * 1.5
            const offsetLon = (Math.random() - 0.5) * 1.5
            next.targetLat = followTarget.lat + offsetLat
            next.targetLon = followTarget.lon + offsetLon
            const [cLat, cLon] = clampToBounds(next.targetLat, next.targetLon, next.continentIndex)
            next.targetLat = cLat
            next.targetLon = cLon
          }
        }
      }

      // ── MOVE towards target ──────────────────────────────────────────────────
      const dLat = next.targetLat - next.lat
      const dLon = next.targetLon - next.lon
      const dist = Math.sqrt(dLat * dLat + dLon * dLon)
      const speed = MOVE_SPEED * delta

      if (dist > 0.05) {
        const ratio = Math.min(1, speed / dist)
        next.lat += dLat * ratio
        next.lon += dLon * ratio
        if (next.travelState === 'grounded') {
          const [cLat, cLon] = clampToBounds(next.lat, next.lon, next.continentIndex)
          next.lat = cLat
          next.lon = cLon
        }
        next.isMoving = true
      } else {
        next.lat = next.targetLat
        next.lon = next.targetLon
        next.isMoving = false
        next.waitTimer = 8 + Math.random() * 20
      }

      // Water guard: snap grounded normies back to land if they drifted into ocean
      if (next.travelState === 'grounded' && !isOnLandCached(next.lat, next.lon)) {
        const landPos = getRandomLandLatLon(next.continentIndex)
        if (landPos) {
          next.lat = landPos.lat; next.lon = landPos.lon
          next.targetLat = landPos.lat; next.targetLon = landPos.lon
          next.isMoving = false; next.waitTimer = 2
        }
      }

      nm.set(id, next)
    }

    // ── proximity conversations - grouped by continent, capped iterations ───────
    if (!skipProximity && newConvs.length < MAX_CONVS) {
      const free = Array.from(nm.values()).filter(n =>
        !n.inConversation && n.travelState === 'grounded'
      )

      // Group by continent to avoid O(n_total²)
      const byCont = new Map<number, typeof free>()
      for (const n of free) {
        if (!byCont.has(n.continentIndex)) byCont.set(n.continentIndex, [])
        byCont.get(n.continentIndex)!.push(n)
      }

      let checks = 0
      for (const group of byCont.values()) {
        if (newConvs.length >= MAX_CONVS || checks >= MAX_PROX_CHECKS) break
        for (let i = 0; i < group.length && checks < MAX_PROX_CHECKS; i++) {
          for (let j = i + 1; j < group.length && checks < MAX_PROX_CHECKS && newConvs.length < MAX_CONVS; j++) {
            checks++
            const a = nm.get(group[i].id)!; const b = nm.get(group[j].id)!
            if (!a || !b || a.inConversation || b.inConversation) continue
            if (angDeg(a.lat, a.lon, b.lat, b.lon) < PROXIMITY_DEG) {
              if (Math.random() < CONV_CHANCE * delta) {
                const msgs = generateConversation(a, b)
                newConvs.push({ id: `${a.id}-${b.id}-${Date.now()}`, normieAId: a.id, normieBId: b.id, messages: msgs, currentIndex: 0, messageTimer: MSG_TIME })
                nm.set(a.id, { ...a, inConversation: true, conversationPartnerId: b.id, isTalking: true, currentDialogue: msgs[0].speakerId === a.id ? msgs[0].text : '' })
                nm.set(b.id, { ...b, inConversation: true, conversationPartnerId: a.id, isTalking: true, currentDialogue: msgs[0].speakerId === b.id ? msgs[0].text : '' })
              }
            }
          }
        }
      }
    }

    return { normies: Array.from(nm.values()), conversations: newConvs }
  }),
}))
