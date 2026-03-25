#!/usr/bin/env tsx
/**
 * Fetches all traits from api.normies.art and populates data/normies.db.
 *
 *   npm run index               — full index (~38 min, sequential, no 429s)
 *   npm run index -- --limit 500  — dev mode: only first 500 normies (~2 min)
 *
 * After indexing, run `npm run build` to generate public/normies-static.json.
 */

import { getDb, setMeta } from '../src/lib/db'
import { indexAllTraits } from '../src/lib/indexer'

const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined

async function main() {
  console.log('━━━ Normies trait index ━━━')
  console.log('DB:', process.cwd() + '/data/normies.db')
  if (limit) console.log(`Mode: dev (first ${limit} normies)`)
  console.log()

  const db = getDb()

  const stats = await indexAllTraits(db, (done, total) => {
    const pct = Math.floor((done / total) * 100)
    const bar = '█'.repeat(Math.floor(pct / 2)) + '░'.repeat(50 - Math.floor(pct / 2))
    process.stdout.write(`\r[${bar}] ${pct}%  ${done}/${total}`)
  }, limit)

  console.log('\n')
  console.log('━━━ Done ━━━')
  console.log(`  Indexed : ${stats.indexed}`)
  console.log(`  Burned  : ${stats.burned}`)
  console.log(`  Failed  : ${stats.failed}`)

  setMeta('last_full_index', new Date().toISOString())
  console.log()
  console.log('Next: run `npm run build` to generate the static data file.')
}

main().catch(err => { console.error(err); process.exit(1) })
