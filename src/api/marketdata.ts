import { Helpers, CandleInterval } from '../integrations/tinkoff';

import { getApi } from './client';
import { ensureAndGet } from '../lib/candles/store';
import { normalizeInterval } from '../lib/candles/aggregate';

import type { CandlePoint } from './types';

export async function getTodayCandlesByTicker(
  ticker: string,
  interval?: string,
): Promise<CandlePoint[]> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument =
    found.instruments.find(
      (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
    ) || found.instruments[0];
  if (!instrument) {
    throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  }
  const instrumentId = instrument.figi || instrument.uid || instrument.ticker;

  const now = Date.now();
  const fromTs = now - 24 * 60 * 60 * 1000;
  const toTs = now;

  const points = await ensureAndGet(
    ticker,
    normalizeInterval(interval),
    fromTs,
    toTs,
    async (fTs: number, tTs: number) => {
      const candles = await api.marketdata.getCandles({
        instrumentId,
        from: new Date(fTs),
        to: new Date(tTs),
        interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
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
  );

  return points;
}
