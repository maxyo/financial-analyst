import { Helpers } from '../integrations/tinkoff';
import type { Quotation } from '../integrations/tinkoff';

// Flexible input shapes for candles/points coming from different layers
export interface CandleLike {
  time?: string | number | Date; // e.g., SDK candle time
  t?: string; // ISO instant
  open?: Quotation;
  high?: Quotation;
  low?: Quotation;
  close?: Quotation;
  o?: Quotation;
  h?: Quotation;
  l?: Quotation;
  c?: Quotation;
  volume?: number | string | null | undefined;
  v?: number | string | null | undefined;
}

export interface PricePointLike {
  t?: string; // ISO instant
  c?: number | string | null | undefined;
  close?: number | string | null | undefined;
  v?: number | string | null | undefined;
  volume?: number | string | null | undefined;
}

// Core funding levels derived from previous base price and k1/k2 fractions
export function computeL1L2(prevBasePrice: number, k1: number, k2: number) {
  const L1 = (k1 || 0) * prevBasePrice;
  const L2 = (k2 || 0) * prevBasePrice;
  return { L1, L2 };
}

// MoEx-style clamped funding formula
export function computeFunding(D: number, L1: number, L2: number): number {
  // funding = MIN(L2; MAX(-L2; MIN(-L1, D) + MAX(L1, D)))
  const min1 = Math.min(-L1, D);
  const max1 = Math.max(L1, D);
  const inner = min1 + max1;
  const cappedLow = Math.max(-L2, inner);
  const capped = Math.min(L2, cappedLow);
  // Small epsilon to avoid -0
  const result = Math.abs(capped) < 1e-12 ? 0 : capped;
  return result;
}

// Internal helper for parsing HH:MM strings
function parseHHMM(s?: string): { h: number; m: number } | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Math.max(0, Math.min(23, Number(m[1])));
  const mm = Math.max(0, Math.min(59, Number(m[2])));
  return { h, m: mm };
}

// Volume-weighted average price in a given intraday time window
export function vwapInWindow(
  candles: readonly CandleLike[],
  start: string | undefined,
  end: string | undefined
): number | undefined {
  if (!Array.isArray(candles) || candles.length === 0) return undefined;
  const s = parseHHMM(start) || { h: 10, m: 0 };
  const e = parseHHMM(end) || { h: 15, m: 30 };
  let pv = 0;
  let v = 0;
  for (const c of candles) {
    const tVal = (c as CandleLike).time ?? (c as CandleLike).t ?? Date.now();
    const t = new Date(tVal);
    const hh = t.getHours();
    const mm = t.getMinutes();
    const inWindow =
      (hh > s.h || (hh === s.h && mm >= s.m)) &&
      (hh < e.h || (hh === e.h && mm <= e.m));
    if (!inWindow) continue;
    const closeRaw = (c as CandleLike).close ?? (c as CandleLike).c;
    const close = closeRaw != null ? Helpers.toNumber(closeRaw) : undefined;
    const vol = Number((c as CandleLike).volume ?? (c as CandleLike).v ?? 0);
    if (typeof close === 'number' && Number.isFinite(close) && vol > 0) {
      pv += close * vol;
      v += vol;
    }
  }
  if (v <= 0) return undefined;
  return pv / v;
}

// Compute MoEx clearing instants for a given date (defaults to today)
// Returns ISO strings in UTC for 14:00 and 19:00 MSK (i.e., 11:00Z and 16:00Z)
export function computeMoexClearingInstants(date?: Date): string[] {
  const base = date ? new Date(date) : new Date();
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const d = base.getUTCDate();
  const first = new Date(Date.UTC(y, m, d, 11, 0, 0, 0)); // 14:00 MSK
  const second = new Date(Date.UTC(y, m, d, 16, 0, 0, 0)); // 19:00 MSK
  return [first.toISOString(), second.toISOString()];
}



export function fundingRateEstAt(
  points: readonly PricePointLike[],
  cutoffIso: string,
): number {
  if (!Array.isArray(points) || points.length === 0) return 0;
  const cutoff = new Date(cutoffIso).getTime();
  if (!Number.isFinite(cutoff)) return 0;

  // VWAP strictly before cutoff
  let pv = 0;
  let volSum = 0;
  for (const p of points) {
    const tStr = (p as PricePointLike).t as any;
    const t = tStr != null ? new Date(tStr).getTime() : NaN;
    if (!Number.isFinite(t) || t >= cutoff) continue;
    const closeRaw = (p as PricePointLike).c ?? (p as PricePointLike).close;
    const close = closeRaw != null ? Number(closeRaw) : undefined;
    const vRaw = (p as PricePointLike).v ?? (p as PricePointLike).volume;
    const w = Math.max(0, Number(vRaw ?? 1)) || 1;
    if (typeof close === 'number' && Number.isFinite(close) && w > 0) {
      pv += close * w;
      volSum += w;
    }
  }
  if (volSum <= 0) return 0;
  const vwap = pv / volSum;

  // Last close at cutoff (prefer exact match), fallback to last <= cutoff
  let lastClose: number | undefined;
  let lastTime = -Infinity;
  for (const p of points) {
    const tStr = (p as PricePointLike).t as any;
    const t = tStr != null ? new Date(tStr).getTime() : NaN;
    const closeRaw = (p as PricePointLike).c ?? (p as PricePointLike).close;
    const close = closeRaw != null ? Number(closeRaw) : undefined;
    if (typeof close !== 'number' || !Number.isFinite(close) || !Number.isFinite(t)) continue;
    if (t === cutoff) {
      lastClose = close;
      lastTime = t;
      break;
    }
    if (t < cutoff && t > lastTime) {
      lastClose = close;
      lastTime = t;
    }
  }
  if (lastClose == null || !Number.isFinite(vwap) || vwap === 0) return 0;

  const premium = lastClose / vwap - 1;
  const clamped = Math.max(-0.003, Math.min(0.003, premium));
  return Math.abs(clamped) < 1e-12 ? 0 : clamped;
}

export default {
  computeL1L2,
  computeFunding,
  vwapInWindow,
  computeMoexClearingInstants,
  fundingRateEstAt,
};

// Ensure compatibility with CommonJS require() in tests/runtime
// so both named and default exports are available reliably.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeL1L2,
    computeFunding,
    vwapInWindow,
    computeMoexClearingInstants,
    fundingRateEstAt,
    default: {
      computeL1L2,
      computeFunding,
      vwapInWindow,
      computeMoexClearingInstants,
      fundingRateEstAt,
    },
  };
}
