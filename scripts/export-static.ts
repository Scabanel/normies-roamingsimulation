#!/usr/bin/env tsx
/**
 * Exports all non-burned normies from the local SQLite DB to
 * public/normies-static.json, which is served as a static CDN asset.
 *
 * Run automatically during `npm run build` (skips silently if DB is empty).
 * Run manually after `npm run index`:
 *   npx tsx scripts/export-static.ts
 */
import { getDb, countNormies } from '../src/lib/db'
import fs from 'fs'
import path from 'path'

const count = countNormies()
if (count === 0) {
  console.log('[export-static] DB is empty — skipping (run `npm run index` first)')
  process.exit(0)
}

const db = getDb()
const rows = db.prepare(
  'SELECT id, name, type, gender, image_url, attributes FROM normies WHERE is_burned = 0 ORDER BY id ASC'
).all() as { id: number; name: string; type: string; gender: string; image_url: string; attributes: string }[]

const normies = rows.map(n => ({
  id:         n.id,
  name:       n.name,
  type:       n.type,
  gender:     n.gender,
  imageUrl:   n.image_url,
  attributes: JSON.parse(n.attributes || '[]') as { trait_type: string; value: string }[],
}))

const outPath = path.join(process.cwd(), 'public', 'normies-static.json')
fs.writeFileSync(outPath, JSON.stringify(normies))
console.log(`[export-static] ${normies.length} normies → public/normies-static.json`)
