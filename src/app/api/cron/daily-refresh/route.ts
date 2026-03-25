/**
 * GET /api/cron/daily-refresh
 *
 * Called automatically by Vercel Cron at 23:00 UTC (= midnight CET).
 * Invalidates the 'normies' cache tag so the next visitor triggers a
 * fresh fetch (updated burned-token list). Only that first visitor pays
 * the cost (~2-3s); everyone after gets the 24h cached result.
 *
 * Protected by CRON_SECRET env variable (set in Vercel project settings).
 * Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export const maxDuration = 10

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  revalidateTag('normies', 'max')

  const timestamp = new Date().toISOString()
  console.log(`[cron/daily-refresh] Normies cache invalidated at ${timestamp}`)

  return NextResponse.json({ ok: true, revalidated: 'normies', at: timestamp })
}
