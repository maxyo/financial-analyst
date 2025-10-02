export const API_URL = 'http://localhost:3000';

export type Scale = '1m' | '5m' | '15m' | '1h';

export function fmt(n: unknown, digits = 4): string {
  const num = Number(n);
  if (n == null || Number.isNaN(num)) return '-';
  try {
    const f = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: true,
    });
    return f.format(num);
  } catch {
    return num.toFixed(digits);
  }
}

export function fmtInt(n: unknown): string {
  const num = Number(n);
  if (n == null || Number.isNaN(num)) return '-';
  try {
    const f = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    });
    return f.format(num);
  } catch {
    return String(Math.trunc(num));
  }
}

export function fmtPct(v: unknown, digits = 4): string {
  const num = Number(v);
  if (v == null || !isFinite(num)) return '-';
  return `${fmt(num * 100, digits)}%`;
}

export function signClass(v: unknown): string {
  const num = Number(v);
  if (v == null || !isFinite(num)) return '';
  return num > 0 ? 'pos' : num < 0 ? 'neg' : '';
}

export function scaleToMs(scale: Scale): number {
  switch (scale) {
    case '1m':
      return 60 * 1000;
    case '5m':
      return 5 * 60 * 1000;
    case '15m':
      return 15 * 60 * 1000;
    case '1h':
      return 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}

export type CandleLike = {
  t: string;
  o: number;
  h?: number;
  l?: number;
  c: number;
  v?: number;
};

export function aggregateCandles<T extends CandleLike>(
  candles: T[] | undefined | null,
  scale: Scale,
): T[] {
  if (!Array.isArray(candles) || candles.length === 0) return [] as T[];
  if (scale === '1m') return candles.slice() as T[];
  const step = scaleToMs(scale);
  const map = new Map<number, any>();
  for (const p of candles) {
    if (!p || !p.t) continue;
    const ts = new Date(p.t).getTime();
    if (!isFinite(ts)) continue;
    const bucket = Math.floor(ts / step) * step;
    let agg = map.get(bucket);
    if (!agg) {
      agg = {
        t: new Date(bucket).toISOString(),
        o: p.o,
        h: p.h,
        l: p.l,
        c: p.c,
        v: p.v ?? 0,
        _firstTs: ts,
        _lastTs: ts,
      };
      map.set(bucket, agg);
    } else {
      if (ts < agg._firstTs) {
        agg._firstTs = ts;
        agg.o = p.o;
      }
      if (ts > agg._lastTs) {
        agg._lastTs = ts;
        agg.c = p.c;
      }
      if (p.h != null) agg.h = Math.max(agg.h ?? p.h, p.h);
      if (p.l != null) agg.l = Math.min(agg.l ?? p.l, p.l);
      agg.v = (agg.v || 0) + (p.v || 0);
    }
  }
  const result = Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, a]) => {
      const clean = { ...a };
      delete clean._firstTs;
      delete clean._lastTs;
      return clean;
    });
  return result as T[];
}

export async function fetchJSON<T = any>(url: string): Promise<T> {
  const res = await fetch(`${API_URL}${url}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

export function numColor(val: unknown): string {
  const n = Number(val);
  if (!isFinite(n)) return 'text.primary';
  return n > 0 ? 'success.main' : n < 0 ? 'error.main' : 'text.secondary';
}
