import type { CandlePoint } from '../../api/tinkoff/types';

export type Interval = '1m' | '5m' | '15m' | '1h';

export function normalizeInterval(s?: string | null): Interval {
  const x = String(s || '1m').toLowerCase();
  if (x === '1' || x === '1m' || x === 'm1') return '1m';
  if (x === '5' || x === '5m' || x === 'm5') return '5m';
  if (x === '15' || x === '15m' || x === 'm15') return '15m';
  if (x === '60' || x === '1h' || x === 'h1' || x === '60m') return '1h';
  return '1m';
}

export function intervalToMs(i: Interval): number {
  switch (i) {
    case '1m':
      return 60_000;
    case '5m':
      return 5 * 60_000;
    case '15m':
      return 15 * 60_000;
    case '1h':
      return 60 * 60_000;
  }
}

export function floorToBucket(ts: number, intervalMs: number): number {
  return Math.floor(ts / intervalMs) * intervalMs;
}

// Aggregates arbitrary source candles (assumed ascending order by t)
// into the requested interval using O/H/L/C/V rules.
export function aggregateCandles(
  source: readonly CandlePoint[],
  target: Interval,
): CandlePoint[] {
  if (!Array.isArray(source) || source.length === 0) return [];
  const targetMs = intervalToMs(target);
  const out: CandlePoint[] = [];

  let curBucket = -1;
  let o: number | undefined;
  let h: number | undefined;
  let l: number | undefined;
  let c: number | undefined;
  let v = 0;

  const flush = (bucketTs: number) => {
    if (v <= 0 && (o == null && h == null && l == null && c == null)) return;
    out.push({ t: new Date(bucketTs).toISOString(), o, h, l, c, v });
  };

  for (const p of source) {
    const t = new Date(p.t).getTime();
    if (!Number.isFinite(t)) continue;
    const b = floorToBucket(t, targetMs);
    if (curBucket === -1) curBucket = b;
    if (b !== curBucket) {
      flush(curBucket);
      // reset accumulators
      curBucket = b;
      o = undefined;
      h = undefined;
      l = undefined;
      c = undefined;
      v = 0;
    }
    if (o == null) o = p.o;
    if (h == null || (p.h != null && Number(p.h) > Number(h))) h = p.h;
    if (l == null || (p.l != null && Number(p.l) < Number(l))) l = p.l;
    if (p.c != null) c = p.c;
    v += Number(p.v || 0);
  }
  if (curBucket !== -1) flush(curBucket);

  return out;
}

export default {
  normalizeInterval,
  intervalToMs,
  floorToBucket,
  aggregateCandles,
};

// CommonJS compatibility for tests/runtime
if (typeof module !== 'undefined' && (module as any).exports) {
  (module as any).exports = {
    normalizeInterval,
    intervalToMs,
    floorToBucket,
    aggregateCandles,
    default: {
      normalizeInterval,
      intervalToMs,
      floorToBucket,
      aggregateCandles,
    },
  };
}
