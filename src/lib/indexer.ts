/**
 * Core indexing logic — runs both in scripts (Node CLI) and in API route handlers.
 * Fetches trait + holder data from api.normies.art and persists to SQLite.
 */

import type { getDb, DbNormie } from './db'

const API_BASE     = 'https://api.normies.art'
const MAX_ID       = 9999
// 50 concurrent, no delay — retry handles 429s with backoff
const BATCH_SIZE   = 50
const BATCH_DELAY  = 0

// ── Low-level fetch helpers ──────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

async function fetchWithRetry(url: string, retries = 5): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      if (res.status === 429) {
        const wait = 2_000 * (i + 1)  // 2s, 4s, 6s, 8s, 10s
        await sleep(wait)
        continue
      }
      return res
    } catch {
      if (i < retries - 1) await sleep(1_000)
    }
  }
  return null
}

// ── Public fetchers ──────────────────────────────────────────────────────────

export async function fetchBurnedIds(): Promise<Set<number>> {
  const result = new Set<number>()
  const PAGE = 100
  let offset = 0
  try {
    while (true) {
      const res = await fetchWithRetry(`${API_BASE}/history/burned-tokens?limit=${PAGE}&offset=${offset}`)
      if (!res?.ok) break
      const data: unknown[] = await res.json()
      if (!Array.isArray(data) || data.length === 0) break
      for (const d of data) {
        const raw = (d as Record<string, unknown>).tokenId ?? (d as Record<string, unknown>).id
        const id = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
        if (!isNaN(id)) result.add(id)
      }
      if (data.length < PAGE) break
      offset += PAGE
    }
  } catch {
    // return whatever we collected so far
  }
  return result
}

type TraitRow = Omit<DbNormie, 'holder' | 'holder_updated_at' | 'is_burned'>

export async function fetchTraits(id: number): Promise<TraitRow | null> {
  const res = await fetchWithRetry(`${API_BASE}/normie/${id}/traits`)
  if (!res?.ok) return null
  try {
    const data  = await res.json()
    const traits: { trait_type: string; value: string }[] =
      Array.isArray(data) ? data : (data.traits ?? data.attributes ?? [])

    const typeAttr   = traits.find(t => t.trait_type === 'Type'   || t.trait_type === 'type')
    const genderAttr = traits.find(t => t.trait_type === 'Gender' || t.trait_type === 'gender')
    const rawType    = typeAttr?.value ?? 'Human'
    return {
      id,
      name:              `Normie #${id}`,
      type:              (['Human','Alien','Cat','Agent'].includes(rawType) ? rawType : 'Human'),
      gender:            genderAttr?.value || 'Unknown',
      image_url:         `${API_BASE}/normie/${id}/image.png`,
      attributes:        JSON.stringify(traits),
      traits_updated_at: Math.floor(Date.now() / 1000),
    }
  } catch {
    return null
  }
}

export async function fetchHolder(id: number): Promise<string | null> {
  const res = await fetchWithRetry(`${API_BASE}/normie/${id}/owner`)
  if (!res?.ok) return null
  try {
    const data = await res.json()
    if (typeof data === 'string') return data || null
    return data.owner ?? data.holder ?? data.address ?? null
  } catch {
    return null
  }
}

// ── Full index (traits only, run once / weekly) ──────────────────────────────

export interface IndexStats {
  total: number; indexed: number; burned: number; failed: number
}

export async function indexAllTraits(
  db: ReturnType<typeof getDb>,
  onProgress?: (done: number, total: number) => void,
  limit?: number,  // optional: only index the first N active IDs (for dev/testing)
): Promise<IndexStats> {
  const stats: IndexStats = { total: 0, indexed: 0, burned: 0, failed: 0 }

  // 1 — Burned tokens
  const burnedIds = await fetchBurnedIds()
  stats.burned = burnedIds.size
  const markBurned = db.prepare('UPDATE normies SET is_burned = 1 WHERE id = ?')
  for (const id of burnedIds) markBurned.run(id)

  // 2 — Active ID list (optionally capped for dev mode)
  let allIds: number[] = []
  for (let i = 0; i <= MAX_ID; i++) {
    if (!burnedIds.has(i)) allIds.push(i)
  }
  if (limit && limit > 0) allIds = allIds.slice(0, limit)
  stats.total = allIds.length

  // 3 — Upsert prepared statement
  const upsert = db.prepare(`
    INSERT INTO normies (id, name, type, gender, image_url, attributes, traits_updated_at, is_burned)
    VALUES (@id, @name, @type, @gender, @image_url, @attributes, @traits_updated_at, 0)
    ON CONFLICT(id) DO UPDATE SET
      name              = excluded.name,
      type              = excluded.type,
      gender            = excluded.gender,
      image_url         = excluded.image_url,
      attributes        = excluded.attributes,
      traits_updated_at = excluded.traits_updated_at,
      is_burned         = 0
  `)

  // 4 — Batch fetch
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batch   = allIds.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(fetchTraits))
    const valid   = results.filter(Boolean) as TraitRow[]

    db.transaction((rows: TraitRow[]) => { for (const r of rows) upsert.run(r) })(valid)
    stats.indexed += valid.length
    stats.failed  += batch.length - valid.length

    onProgress?.(Math.min(i + BATCH_SIZE, allIds.length), allIds.length)
    await sleep(BATCH_DELAY)
  }

  return stats
}

// ── Rolling holder update (run hourly via cron) ──────────────────────────────

export async function updateHoldersBatch(
  db: ReturnType<typeof getDb>,
  limit           = 300,
  olderThanSeconds = 3600,
): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - olderThanSeconds

  const rows = db.prepare(`
    SELECT id FROM normies
    WHERE is_burned = 0
      AND (holder_updated_at IS NULL OR holder_updated_at < ?)
    ORDER BY holder_updated_at ASC NULLS FIRST
    LIMIT ?
  `).all(cutoff, limit) as { id: number }[]

  const updateHolder = db.prepare(
    'UPDATE normies SET holder = ?, holder_updated_at = ? WHERE id = ?'
  )

  let updated = 0
  const now   = Math.floor(Date.now() / 1000)

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch   = rows.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(({ id }) => fetchHolder(id).then(h => ({ id, h }))))

    db.transaction((items: typeof results) => {
      for (const { id, h } of items) updateHolder.run(h, now, id)
    })(results)
    updated += results.length

    if (i + BATCH_SIZE < rows.length) await sleep(BATCH_DELAY)
  }

  return updated
}
