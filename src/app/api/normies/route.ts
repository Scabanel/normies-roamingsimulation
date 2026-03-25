/**
 * GET /api/normies
 *
 * Returns all non-burned Normies. Data sources tried in order:
 *   1. SQLite DB (local dev, populated via `npm run index`)
 *   2. public/normies-static.json filtered by live burned-token list
 *
 * The result is cached server-side for 24h via unstable_cache (shared across
 * all Vercel invocations). The daily cron at /api/cron/daily-refresh
 * invalidates the 'normies' tag at midnight CET so the next visitor
 * triggers a fresh fetch — no one else pays the cost.
 */

import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import fs from 'fs'
import path from 'path'
import type { NormieMetadata } from '@/lib/normieApi'

export const revalidate = 86400  // CDN also caches for 24h

const getNormies = unstable_cache(
  async (): Promise<NormieMetadata[]> => {

    // ── 1. Try SQLite DB (local dev) ─────────────────────────────────────────
    try {
      const { getDb, countNormies } = await import('@/lib/db')
      const count = countNormies()
      if (count > 0) {
        const db = getDb()
        const rows = db.prepare(
          'SELECT id, name, type, gender, image_url, attributes FROM normies WHERE is_burned = 0 ORDER BY id ASC'
        ).all() as { id: number; name: string; type: string; gender: string; image_url: string; attributes: string }[]
        return rows.map(n => ({
          id:         n.id,
          name:       n.name,
          type:       n.type as NormieMetadata['type'],
          gender:     n.gender,
          imageUrl:   n.image_url,
          attributes: JSON.parse(n.attributes || '[]') as { trait_type: string; value: string }[],
        }))
      }
    } catch {
      // DB unavailable (Vercel serverless) — fall through
    }

    // ── 2. Static file + live burned-token filter (Vercel production) ────────
    const staticPath = path.join(process.cwd(), 'public', 'normies-static.json')
    if (!fs.existsSync(staticPath)) return []

    const base: NormieMetadata[] = JSON.parse(fs.readFileSync(staticPath, 'utf-8'))

    // Fetch the current burned list to filter out any normies burned since
    // the static file was last generated. Only runs once per 24h thanks to
    // the unstable_cache wrapper above.
    try {
      const { fetchBurnedIds } = await import('@/lib/indexer')
      const burned = await fetchBurnedIds()
      if (burned.size > 0) return base.filter(n => !burned.has(n.id))
    } catch {
      // If burned-token fetch fails, serve unfiltered static data
    }

    return base
  },
  ['normies-list'],
  { revalidate: 86400, tags: ['normies'] },
)

export async function GET() {
  try {
    const normies = await getNormies()
    if (normies.length === 0) {
      return NextResponse.json(
        { error: 'No data — run `npm run index && npm run build` first.' },
        { status: 503 }
      )
    }
    return NextResponse.json(normies, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[GET /api/normies]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
