import { aggregateCandles, normalizeInterval, type Interval } from './aggregate';
import { getCandlesDb, CandleRow } from '../db/sqlite';

import type { CandlePoint } from '../../api/tinkoff/types';

function toPoint(r: CandleRow): CandlePoint {
  return {
    t: new Date(r.ts).toISOString(),
    o: r.o,
    h: r.h,
    l: r.l,
    c: r.c,
    v: r.v,
  };
}

function toRow(p: CandlePoint): CandleRow {
  const ts = new Date(p.t).getTime();
  return {
    ts,
    o: p.o,
    h: p.h,
    l: p.l,
    c: p.c,
    v: Number(p.v || 0),
  };
}

export function getCandles(
  symbol: string,
  interval: string,
  fromTs: number,
  toTs: number,
): CandlePoint[] {
  const db = getCandlesDb();
  const q = db.prepare<unknown[], CandleRow>(
    'SELECT ts,o,h,l,c,v FROM candles WHERE symbol=? AND interval=? AND ts>=? AND ts<=? ORDER BY ts ASC',
  );
  const rows = q.all(symbol.toUpperCase(), normalizeInterval(interval), Math.trunc(fromTs), Math.trunc(toTs)) as unknown as CandleRow[];
  return rows.map(toPoint);
}

export function upsertCandles(
  symbol: string,
  interval: string,
  candles: readonly CandlePoint[],
): void {
  if (!Array.isArray(candles) || candles.length === 0) return;
  const db = getCandlesDb();
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO candles(symbol, interval, ts, o, h, l, c, v) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const upper = symbol.toUpperCase();
  const tx = db.transaction((items: CandlePoint[]) => {
    for (const p of items) {
      const r = toRow(p);
      stmt.run(upper, normalizeInterval(interval), Math.trunc(r.ts), r.o, r.h, r.l, r.c, r.v);
    }
  });
  tx(candles as CandlePoint[]);
}

export async function ensureAndGet(
  symbol: string,
  interval: string,
  fromTs: number,
  toTs: number,
  fetchRange: (fromTs: number, toTs: number) => Promise<CandlePoint[]>,
  baseInterval: Interval = '1m',
): Promise<CandlePoint[]> {
  const upper = symbol.toUpperCase();
  const reqInterval = normalizeInterval(interval);
  const from = Math.trunc(fromTs);
  const to = Math.trunc(toTs);

  // Try to read requested interval from DB first
  let have = getCandles(upper, reqInterval, from, to);
  if (have.length > 0) {
    return have;
  }

  // If nothing found, try to backfill base interval for the range
  const haveBase = getCandles(upper, baseInterval, from, to);
  if (haveBase.length === 0) {
    const fetched = await fetchRange(from, to);
    if (Array.isArray(fetched) && fetched.length > 0) {
      // Ensure sorted by time
      fetched.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
      upsertCandles(upper, baseInterval, fetched);
    }
  }

  // If requested differs from base, aggregate from base we now have
  if (reqInterval !== baseInterval) {
    const srcBase = getCandles(upper, baseInterval, from, to);
    const agg = aggregateCandles(srcBase, reqInterval);
    if (agg.length > 0) {
      upsertCandles(upper, reqInterval, agg);
    }
  }

  // Return requested interval
  have = getCandles(upper, reqInterval, from, to);
  return have;
}
