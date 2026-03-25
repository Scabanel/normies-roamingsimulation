import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH  = path.join(DATA_DIR, 'normies.db')

let _db: ReturnType<typeof Database> | null = null

export function getDb() {
  if (_db) return _db

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('synchronous = NORMAL')

  _db.exec(`
    CREATE TABLE IF NOT EXISTS normies (
      id                  INTEGER PRIMARY KEY,
      name                TEXT    NOT NULL,
      type                TEXT    NOT NULL DEFAULT 'Human',
      gender              TEXT    NOT NULL DEFAULT 'Unknown',
      image_url           TEXT    NOT NULL DEFAULT '',
      attributes          TEXT    NOT NULL DEFAULT '[]',
      holder              TEXT,
      holder_updated_at   INTEGER,
      traits_updated_at   INTEGER NOT NULL DEFAULT 0,
      is_burned           INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_normies_type     ON normies(type);
    CREATE INDEX IF NOT EXISTS idx_normies_burned   ON normies(is_burned);
    CREATE INDEX IF NOT EXISTS idx_normies_holder_ts ON normies(holder_updated_at);
  `)

  return _db
}

// ── Typed row shape returned by SQLite ──────────────────────────────────────
export interface DbNormie {
  id:                number
  name:              string
  type:              string
  gender:            string
  image_url:         string
  attributes:        string   // JSON string
  holder:            string | null
  holder_updated_at: number | null
  traits_updated_at: number
  is_burned:         0 | 1
}

// ── Helpers ─────────────────────────────────────────────────────────────────
export function getMeta(key: string): string | null {
  const db  = getDb()
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setMeta(key: string, value: string): void {
  getDb().prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
}

export function countNormies(): number {
  const row = getDb().prepare('SELECT COUNT(*) as n FROM normies WHERE is_burned = 0').get() as { n: number }
  return row.n
}
