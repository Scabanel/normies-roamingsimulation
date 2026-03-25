/**
 * GET /api/normies/[id]/holder
 *
 * Returns the current holder address + web3 identity (ENS/basename + X handle).
 * - DB cached holder → skips chain fetch
 * - web3.bio queried every time (has its own CDN cache, 60s)
 */

import { NextResponse } from 'next/server'
import { fetchHolder } from '@/lib/indexer'

interface Web3Profile {
  identity: string
  platform: string
  displayName: string | null
  links?: {
    twitter?: { handle: string }
    [key: string]: unknown
  }
}

async function fetchWeb3Profile(address: string): Promise<{ displayName: string | null; twitterHandle: string | null }> {
  try {
    const res = await fetch(`https://api.web3.bio/profile/${address}`, {
      signal: AbortSignal.timeout(5_000),
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return { displayName: null, twitterHandle: null }
    const profiles: Web3Profile[] = await res.json()
    if (!Array.isArray(profiles) || profiles.length === 0) return { displayName: null, twitterHandle: null }

    // Prefer ENS > basenames > others
    const PLATFORM_RANK: Record<string, number> = { ens: 0, basenames: 1, lens: 2, farcaster: 3 }
    const sorted = [...profiles].sort((a, b) =>
      (PLATFORM_RANK[a.platform] ?? 99) - (PLATFORM_RANK[b.platform] ?? 99)
    )

    const best = sorted[0]
    const displayName = best.displayName || best.identity || null

    // Collect twitter handle from any profile that has it
    let twitterHandle: string | null = null
    for (const p of profiles) {
      if (p.links?.twitter?.handle) {
        twitterHandle = p.links.twitter.handle
        break
      }
    }

    return { displayName, twitterHandle }
  } catch {
    return { displayName: null, twitterHandle: null }
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = parseInt(rawId, 10)

  if (isNaN(id) || id < 0 || id > 9999) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  // ── Get holder address ───────────────────────────────────────────────────────
  let holder: string | null = null

  try {
    const { getDb } = await import('@/lib/db')
    const row = getDb()
      .prepare('SELECT holder, holder_updated_at FROM normies WHERE id = ?')
      .get(id) as { holder: string | null; holder_updated_at: number | null } | undefined

    if (row?.holder_updated_at != null) {
      holder = row.holder
    } else {
      holder = await fetchHolder(id)
      if (row !== undefined) {
        try {
          getDb()
            .prepare('UPDATE normies SET holder = ?, holder_updated_at = ? WHERE id = ?')
            .run(holder, Math.floor(Date.now() / 1000), id)
        } catch { /* non-critical */ }
      }
    }
  } catch {
    holder = await fetchHolder(id).catch(() => null)
  }

  // ── Enrich with web3 identity ────────────────────────────────────────────────
  const { displayName, twitterHandle } = holder
    ? await fetchWeb3Profile(holder)
    : { displayName: null, twitterHandle: null }

  return NextResponse.json(
    { holder, displayName, twitterHandle },
    { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } },
  )
}
