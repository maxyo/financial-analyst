import type { CandlePoint } from '../api/tinkoff/types';
import { getRepositories } from '../repositories';
import { mapToCacheInterval, normalizeTicker, toMs } from '../utils/format';

// Options accepted by the service for flexibility; controller/WS currently pass a string or nothing
export type GetCandlesOptions = {
  interval?: string;
  from?: Date | number | string;
  to?: Date | number | string;
};

class CandlesService {
  /**
   * Get candles from DB cache for the specified ticker and time window.
   * If from/to are not provided, defaults to last 24 hours.
   */
  async getCandlesByTicker(
    ticker: string,
    interval: string,
    from: Date | number | string,
    to: Date | number | string,
  ): Promise<CandlePoint[]> {
    const upper = normalizeTicker(ticker);
    if (!upper) return [];
    const fromMs = toMs(from) ?? Date.now() - 24 * 60 * 60 * 1000;
    const toMsVal = toMs(to) ?? Date.now();
    const cacheInterval = mapToCacheInterval(interval);
    return getRepositories().candles.getCandles(upper, cacheInterval, fromMs, toMsVal);
  }

  /**
   * Get today's (or provided range) candles from DB for the ticker. Accepts interval or options object.
   * Defaults to last 24 hours and 1m interval.
   */
  async getTodayCandlesByTicker(
    ticker: string,
    intervalOrOptions?: string | GetCandlesOptions,
  ): Promise<CandlePoint[]> {
    const now = Date.now();
    let to = now;
    let from = now - 24 * 60 * 60 * 1000; // last 24h by default
    let interval = '1m';

    if (typeof intervalOrOptions === 'object' && intervalOrOptions) {
      const maybeFrom = toMs(intervalOrOptions.from);
      const maybeTo = toMs(intervalOrOptions.to);
      if (maybeTo != null) to = maybeTo;
      if (maybeFrom != null) from = maybeFrom;
      if (intervalOrOptions.interval) interval = String(intervalOrOptions.interval);
    } else if (typeof intervalOrOptions === 'string' && intervalOrOptions.trim()) {
      interval = intervalOrOptions;
    }

    const cacheInterval = mapToCacheInterval(interval);
    const upper = normalizeTicker(ticker);
    if (!upper) return [];
    return getRepositories().candles.getCandles(upper, cacheInterval, Math.trunc(from), Math.trunc(to));
  }
}

export const candlesService = new CandlesService();

// Backward-compatible named exports
export async function getCandlesByTicker(
  ticker: string,
  interval: string,
  from: Date | number | string,
  to: Date | number | string,
): Promise<CandlePoint[]> {
  return candlesService.getCandlesByTicker(ticker, interval, from, to);
}

export async function getTodayCandlesByTicker(
  ticker: string,
  intervalOrOptions?: string | GetCandlesOptions,
): Promise<CandlePoint[]> {
  return candlesService.getTodayCandlesByTicker(ticker, intervalOrOptions);
}
