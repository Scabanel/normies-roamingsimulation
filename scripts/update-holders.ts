#!/usr/bin/env tsx
/**
 * Populate / refresh holder addresses for all non-burned Normies.
 * Fetches from api.normies.art and stores in data/normies.db.
 *
 * Run manually or schedule with a cron job:
 *   npm run index:holders
 *
 * Flags:
 *   --all    Re-fetch even holders updated in the last hour (force refresh)
 *   --limit  Maximum number of normies to update in this run (default: all)
 */

import { getDb, setMeta, countNormies } from '../src/lib/db'
import { updateHoldersBatch } from '../src/lib/indexer'

const args            = process.argv.slice(2)
const forceAll        = args.includes('--all')
const limitArg        = args.find(a => a.startsWith('--limit='))
const limit           = limitArg ? parseInt(limitArg.split('=')[1]) : 999_999
const olderThan       = forceAll ? 0 : 3600  // 0 = update everything

async function main() {
  const db    = getDb()
  const total = countNormies()

  console.log('━━━ Normies holder update ━━━')
  console.log(`  Active normies in DB : ${total}`)
  console.log(`  Mode                 : ${forceAll ? 'force all' : 'stale only (>1h)'}`)
  console.log(`  Limit                : ${limit === 999_999 ? 'none' : limit}`)
  console.log()

  const CHUNK = 300
  let updated = 0

  while (true) {
    const remaining = limit - updated
    if (remaining <= 0) break

    const batch = await updateHoldersBatch(db, Math.min(CHUNK, remaining), olderThan)
    if (batch === 0) break

    updated += batch
    process.stdout.write(`\rUpdated: ${updated} holders…`)
  }

  console.log(`\n\nDone — ${updated} holders refreshed.`)
  setMeta('last_holder_update', new Date().toISOString())
}

main().catch(err => { console.error(err); process.exit(1) })
