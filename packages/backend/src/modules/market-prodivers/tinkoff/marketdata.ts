import { getApi } from './client';
import { Helpers, CandleInterval } from './index';
import { normalizeInterval, type Interval } from '../../lib/candles/aggregate';
import { ensureAndGet } from '../../lib/candles/store';

import type { CandlePoint } from './types';

// App-level interval enum
export enum AppCandleInterval {
  M1 = 'M1',
  M5 = 'M5',
  M15 = 'M15',
  H1 = 'H1',
}

export type GetCandlesOptions = {
  interval?: AppCandleInterval | string;
  from?: number | string | Date;
  to?: number | string | Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toTs(x: number | string | Date | undefined, fallback: number): number {
  if (x == null) return Math.trunc(fallback);
  if (typeof x === 'number') return Math.trunc(x);
  const d = new Date(x);
  const t = d.getTime();
  return Number.isFinite(t) ? Math.trunc(t) : Math.trunc(fallback);
}

function appIntervalToCacheString(i?: AppCandleInterval | string | null): Interval {
  if (!i) return '1m';
  // accept enum or textual
  if (typeof i === 'string') {
    if ((i) in AppCandleInterval) {
      switch (i as AppCandleInterval) {
        case AppCandleInterval.M1:
          return '1m';
        case AppCandleInterval.M5:
          return '5m';
        case AppCandleInterval.M15:
          return '15m';
        case AppCandleInterval.H1:
          return '1h';
      }
    }
    return normalizeInterval(i);
  }
  return '1m';
}

function cacheIntervalToTinkoff(i: Interval): CandleInterval {
  switch (i) {
    case '1m':
      return CandleInterval.CANDLE_INTERVAL_1_MIN;
    case '5m':
      return CandleInterval.CANDLE_INTERVAL_5_MIN;
    case '15m':
      return CandleInterval.CANDLE_INTERVAL_15_MIN;
    case '1h':
      return CandleInterval.CANDLE_INTERVAL_HOUR;
  }
}

export async function getTodayCandlesByTicker(
  ticker: string,
  intervalOrOptions?: string | AppCandleInterval | GetCandlesOptions,
): Promise<CandlePoint[]> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument =
    found.instruments.find((i) => i.ticker.toUpperCase() === ticker.toUpperCase()) ||
    found.instruments[0];
  if (!instrument) {
    throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  }
  const instrumentId = instrument.figi || instrument.uid || instrument.ticker;

  const now = Date.now();

  // Determine requested interval (cache/base) from input
  let reqInterval: Interval;
  if (
    intervalOrOptions &&
    typeof intervalOrOptions === 'object' &&
    !(intervalOrOptions instanceof Date)
  ) {
    reqInterval = appIntervalToCacheString(intervalOrOptions.interval);
  } else {
    reqInterval = appIntervalToCacheString(
      intervalOrOptions as string | AppCandleInterval | undefined,
    );
  }

  // Determine time range
  let to = now;
  let from = now - DAY_MS;
  if (
    intervalOrOptions &&
    typeof intervalOrOptions === 'object' &&
    !(intervalOrOptions instanceof Date)
  ) {
    to = toTs(intervalOrOptions.to, now);
    from = toTs(intervalOrOptions.from, to - DAY_MS);
  }

  const baseInterval = reqInterval;
  const sdkInterval = cacheIntervalToTinkoff(baseInterval);

  const points = await ensureAndGet(
    ticker,
    reqInterval,
    from,
    to,
    async (fTs: number, tTs: number) => {
      const candles = await api.marketdata.getCandles({
        instrumentId,
        from: new Date(fTs),
        to: new Date(tTs),
        interval: sdkInterval,
      });
      const out: CandlePoint[] = [];
      for (const c of candles.candles || []) {
        out.push({
          t: (c.time || new Date()).toISOString(),
          o: c.open ? Helpers.toNumber(c.open) : undefined,
          h: c.high ? Helpers.toNumber(c.high) : undefined,
          l: c.low ? Helpers.toNumber(c.low) : undefined,
          c: c.close ? Helpers.toNumber(c.close) : undefined,
          v: Number(c.volume ?? 0),
        });
      }
      return out;
    },
    baseInterval,
  );

  return points;
}
