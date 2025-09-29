import { Helpers } from 'tinkoff-invest-api';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';

import { getApi } from './client';

import type { CandlePoint } from './types';

export async function getTodayCandlesByTicker(
  ticker: string,
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

  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  const candles = await api.marketdata.getCandles({
    instrumentId,
    from,
    to: now,
    interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
  });

  const points: CandlePoint[] = [];
  for (const c of candles.candles || []) {
    points.push({
      t: (c.time || new Date()).toISOString(),
      o: c.open ? Helpers.toNumber(c.open) : undefined,
      h: c.high ? Helpers.toNumber(c.high) : undefined,
      l: c.low ? Helpers.toNumber(c.low) : undefined,
      c: c.close ? Helpers.toNumber(c.close) : undefined,
      v: Number(c.volume ?? 0),
    });
  }
  return points;
}
