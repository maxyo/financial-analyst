/**
 * Common formatting and parsing utilities used across services.
 */
import { normalizeInterval } from '../candles/aggregate';

/**
 * Normalize a ticker string by trimming whitespace and converting to uppercase.
 * Returns an empty string if input is falsy.
 */
export function normalizeTicker(ticker: string | undefined | null): string {
  const t = String(ticker ?? '').trim();
  return t ? t.toUpperCase() : '';
}

/**
 * Convert a date-like input to epoch milliseconds.
 * - number: truncated to integer
 * - Date: date.getTime()
 * - string: Date.parse(string) if finite
 * Returns undefined for null/undefined or unparsable strings.
 */
export function toMs(x: Date | number | string | undefined | null): number | undefined {
  if (x == null) return undefined;
  if (typeof x === 'number') return Math.trunc(x);
  if (x instanceof Date) return x.getTime();
  const n = Date.parse(String(x));
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/**
 * Map application/Tinkoff interval strings to cache intervals used by the candles repository.
 * Supports M1/M5/M15/H1 → 1m/5m/15m/1h. Falls back to aggregate.normalizeInterval for cache-like inputs.
 */
export function mapToCacheInterval(input?: string): string {
  const s = String(input || '1m').trim();
  const m = s.toUpperCase();
  if (m === 'M1') return '1m';
  if (m === 'M5') return '5m';
  if (m === 'M15') return '15m';
  if (m === 'H1') return '1h';
  // Fallback to normalizeInterval for already cache-like strings
  return normalizeInterval(s);
}
