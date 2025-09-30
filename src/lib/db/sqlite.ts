import * as fs from 'fs';
import * as path from 'path';

import { Database } from 'better-sqlite3';

// Lazy-loaded to avoid requiring native module unless actually used
let _db: Database | null = null;

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getCandlesDb() {
  if (_db) return _db;
  // Dynamically require to avoid import at module load time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const BetterSqlite3 = require('better-sqlite3');
  const dbPath =
    process.env.CANDLES_DB_PATH ||
    path.resolve(process.cwd(), 'data', 'trade.db');
  ensureDir(dbPath);
  const db = new BetterSqlite3(dbPath);
  // Pragmas for durability vs performance balance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -16000'); // ~16MB page cache
  db.pragma('foreign_keys = ON');

  // Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS candles (
      symbol TEXT NOT NULL,
      interval TEXT NOT NULL,
      ts INTEGER NOT NULL,
      o REAL,
      h REAL,
      l REAL,
      c REAL,
      v REAL NOT NULL DEFAULT 0,
      PRIMARY KEY(symbol, interval, ts)
    );
    CREATE INDEX IF NOT EXISTS idx_candles_symbol_interval_ts ON candles(symbol, interval, ts);
  `);

  _db = db;

  if(!_db) {
    throw new Error('DB not initialized');
  }
  return _db;
}

export interface CandleRow {
  ts: number; // epoch ms
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v: number;
}
