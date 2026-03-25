/**
 * GET /api/cron/update-holders
 *
 * Rolling holder refresh — called by Vercel Cron (or any scheduler) every hour.
 * Updates up to 300 normies whose holder was last fetched >1h ago.
 *
 * Protected by CRON_SECRET env variable:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Vercel cron automatically sends this header when CRON_SECRET is set in the project.
 */

import { NextResponse } from 'next/server'
import { getDb, getMeta, setMeta } from '@/lib/db'
import { updateHoldersBatch } from '@/lib/indexer'

export const maxDuration = 300  // Vercel Pro: up to 5 min

export async function GET(req: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const db      = getDb()
    const updated = await updateHoldersBatch(db, 300, 3600)

    const lastRun = new Date().toISOString()
    setMeta('last_cron_holder_update', lastRun)

    return NextResponse.json({
      ok:       true,
      updated,
      lastRun,
      prevRun:  getMeta('last_cron_holder_update'),
    })
  } catch (err) {
    console.error('[cron/update-holders]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
